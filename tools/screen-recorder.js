(function () {
  'use strict';
  var root = document.getElementById('tool-app');
  if (!root) return;

  var LISTS = {
    webm: ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'],
    mp4: ['video/mp4;codecs=avc1.42E01E,mp4a.40.2', 'video/mp4;codecs=avc1,mp4a.40.2', 'video/mp4']
  };
  var LABELS = { idle: 'Ready', starting: 'Starting…', recording: 'Recording', paused: 'Paused', done: 'Saved' };

  var state = 'idle';
  var recorder = null;
  var chunks = [];
  var displayStream = null;
  var micStream = null;
  var finalStream = null;
  var audioCtx = null;
  var startedAt = 0;
  var pausedAt = 0;
  var pausedTotal = 0;
  var finalDuration = 0;
  var tick = null;
  var cancelled = false;
  var resultUrl = '';
  var resultInfo = null;

  /* ---------- tiny helpers ---------- */
  function control(id) { return root.querySelector('[data-control="' + id + '"]'); }
  function outputEl(id) { return root.querySelector('[data-output="' + id + '"]'); }
  function getBtn(id) { return root.querySelector('[data-action="' + id + '"]'); }
  function el(tag, cls, text) {
    var node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text !== undefined && text !== null) node.textContent = text;
    return node;
  }
  function status(msg, kind) {
    var node = root.querySelector('[data-status]');
    if (!node) return;
    node.textContent = msg || '';
    node.className = 'status' + (kind ? ' ' + kind : '');
  }
  function setStats(id, entries) {
    var node = outputEl(id);
    if (!node) return;
    node.innerHTML = '';
    entries.forEach(function (pair) {
      var wrap = document.createElement('div');
      wrap.className = 'stat';
      var dt = document.createElement('dt');
      dt.textContent = pair[0];
      var dd = document.createElement('dd');
      dd.textContent = pair[1];
      wrap.appendChild(dt);
      wrap.appendChild(dd);
      node.appendChild(wrap);
    });
  }
  function onAction(id, fn) {
    var btn = getBtn(id);
    if (btn) btn.addEventListener('click', function () { fn(btn); });
  }
  function val(id, fallback) {
    var n = control(id);
    return n ? n.value : fallback;
  }
  function fmtBytes(n) {
    if (n < 1024) return n + ' B';
    if (n < 1048576) return (n / 1024).toFixed(1) + ' KB';
    if (n < 1073741824) return (n / 1048576).toFixed(1) + ' MB';
    return (n / 1073741824).toFixed(2) + ' GB';
  }
  function pad2(n) { return n < 10 ? '0' + n : String(n); }
  function fmtTime(ms) {
    var s = Math.floor(ms / 1000);
    var h = Math.floor(s / 3600);
    var m = Math.floor((s % 3600) / 60);
    var sec = s % 60;
    return (h ? h + ':' + pad2(m) : pad2(m)) + ':' + pad2(sec);
  }
  function sleep(ms) { return new Promise(function (resolve) { setTimeout(resolve, ms); }); }
  function baseName() {
    var v = String(val('filename', '')).replace(/[\\/:*?"<>|]+/g, '').trim();
    return v || 'screen-recording';
  }
  function supported() {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia && window.MediaRecorder);
  }
  function pickMime(pref) {
    var order = pref === 'mp4' ? LISTS.mp4.concat(LISTS.webm) : LISTS.webm.concat(LISTS.mp4);
    for (var i = 0; i < order.length; i++) {
      if (MediaRecorder.isTypeSupported(order[i])) return order[i];
    }
    return '';
  }
  function elapsed() {
    if (!startedAt) return 0;
    var end = state === 'paused' ? pausedAt : Date.now();
    return Math.max(0, end - startedAt - pausedTotal);
  }

  /* ---------- styles (self-contained, uses the site's theme variables) ---------- */
  if (!document.getElementById('screen-recorder-styles')) {
    var st = document.createElement('style');
    st.id = 'screen-recorder-styles';
    st.textContent = [
      '.sr-stage{display:flex;flex-direction:column;gap:12px}',
      '.sr-screen{position:relative;aspect-ratio:16/9;border-radius:14px;overflow:hidden;background:#000;border:1px solid var(--border);display:grid;place-items:center}',
      '.sr-screen video{position:absolute;inset:0;width:100%;height:100%;object-fit:contain;background:#000}',
      '.sr-idle{display:flex;flex-direction:column;align-items:center;gap:8px;color:var(--muted);text-align:center;padding:16px;font-size:.9rem}',
      '.sr-idle-icon{font-size:2.4rem;line-height:1;animation:tn-float 3.5s ease-in-out infinite}',
      '.sr-count{position:absolute;inset:0;display:none;place-items:center;font-size:5rem;font-weight:800;color:var(--accent);background:rgba(0,0,0,.7);text-shadow:0 0 40px var(--accent-ring)}',
      '.sr-bar{display:flex;align-items:center;gap:10px;padding:10px 14px;background:var(--surface-2);border:1px solid var(--border);border-radius:12px;font-variant-numeric:tabular-nums}',
      '.sr-dot{width:10px;height:10px;border-radius:50%;background:var(--muted);flex:none}',
      '.sr-dot.live{background:#ff4d4d;animation:sr-pulse 1.2s ease-out infinite}',
      '.sr-dot.pause{background:#f5b301}',
      '.sr-time{font-family:var(--mono);font-weight:700;font-size:1.05rem}',
      '.sr-state{margin-left:auto;color:var(--muted);font-size:.86rem}',
      '@keyframes sr-pulse{0%{box-shadow:0 0 0 0 rgba(255,77,77,.6)}100%{box-shadow:0 0 0 10px rgba(255,77,77,0)}}'
    ].join('\n');
    document.head.appendChild(st);
  }

  /* ---------- preview stage inside the result pane ---------- */
  var panes = root.querySelectorAll('.tool-pane');
  var outPane = panes[1] || panes[0];
  var stage = el('div', 'sr-stage');
  var screen = el('div', 'sr-screen');
  var video = document.createElement('video');
  video.playsInline = true;
  video.preload = 'metadata';
  video.hidden = true;
  var idleBox = el('div', 'sr-idle');
  idleBox.appendChild(el('span', 'sr-idle-icon', '🎥'));
  idleBox.appendChild(el('span', '', 'Your recording will appear here'));
  var countEl = el('div', 'sr-count');
  screen.appendChild(video);
  screen.appendChild(idleBox);
  screen.appendChild(countEl);
  var bar = el('div', 'sr-bar');
  var dotEl = el('span', 'sr-dot');
  var timeEl = el('span', 'sr-time', '00:00');
  var stateEl = el('span', 'sr-state', LABELS.idle);
  bar.appendChild(dotEl);
  bar.appendChild(timeEl);
  bar.appendChild(stateEl);
  stage.appendChild(screen);
  stage.appendChild(bar);
  var outHeader = outPane.querySelector('.pane-header');
  if (outHeader && outHeader.nextSibling) outPane.insertBefore(stage, outHeader.nextSibling);
  else outPane.appendChild(stage);

  // WebM files from MediaRecorder have no duration; nudge the player to compute it.
  video.addEventListener('loadedmetadata', function () {
    if (video.duration === Infinity) {
      try {
        video.currentTime = 1e101;
        video.addEventListener('timeupdate', function reset() {
          video.removeEventListener('timeupdate', reset);
          video.currentTime = 0;
        });
      } catch (e) { /* ignore */ }
    }
  });

  window.addEventListener('beforeunload', function (e) {
    if (state === 'recording' || state === 'paused') { e.preventDefault(); e.returnValue = ''; }
  });

  /* ---------- state ---------- */
  function setState(s) {
    state = s;
    stateEl.textContent = LABELS[s];
    dotEl.className = 'sr-dot' + (s === 'recording' ? ' live' : (s === 'paused' ? ' pause' : ''));
    var show = {
      start: s === 'idle' || s === 'done',
      pause: s === 'recording' || s === 'paused',
      stop: s === 'recording' || s === 'paused' || s === 'starting',
      download: s === 'done',
      discard: s === 'done'
    };
    Object.keys(show).forEach(function (id) {
      var b = getBtn(id);
      if (b) b.style.display = show[id] ? '' : 'none';
    });
    var pb = getBtn('pause');
    if (pb) pb.textContent = s === 'paused' ? 'Resume' : 'Pause';
    var sb = getBtn('start');
    if (sb) sb.textContent = s === 'done' ? 'Record again' : 'Start recording';
    var stb = getBtn('stop');
    if (stb) stb.textContent = s === 'starting' ? 'Cancel' : 'Stop & save';
    updateSummary();
  }
  function updateSummary() {
    var info = resultInfo;
    var entries = [
      ['Status', LABELS[state]],
      ['Duration', info ? fmtTime(info.duration) : '\u2014'],
      ['File size', info ? fmtBytes(info.size) : '\u2014'],
      ['Format', info ? info.ext.toUpperCase() : '\u2014']
    ];
    if (info && info.res) entries.push(['Resolution', info.res]);
    setStats('summary', entries);
  }
  function showCount(text) {
    countEl.textContent = text;
    countEl.style.display = text ? 'grid' : 'none';
  }
  function startTimer() {
    stopTimer();
    timeEl.textContent = '00:00';
    tick = setInterval(function () { timeEl.textContent = fmtTime(elapsed()); }, 250);
  }
  function stopTimer() {
    if (tick) { clearInterval(tick); tick = null; }
  }
  function cleanup() {
    [displayStream, micStream, finalStream].forEach(function (s) {
      if (s) s.getTracks().forEach(function (t) { try { t.stop(); } catch (e) { /* ignore */ } });
    });
    displayStream = null;
    micStream = null;
    finalStream = null;
    if (audioCtx) { try { audioCtx.close(); } catch (e) { /* ignore */ } audioCtx = null; }
  }
  function clearResult() {
    if (resultUrl) { URL.revokeObjectURL(resultUrl); resultUrl = ''; }
    resultInfo = null;
    video.pause();
    video.removeAttribute('src');
    video.load();
    video.hidden = true;
    idleBox.style.display = '';
    timeEl.textContent = '00:00';
  }
  function friendly(err) {
    if (err && err.name === 'NotAllowedError') return 'Screen sharing was cancelled or blocked. Press Start recording and choose something to share.';
    if (err && err.message) return err.message;
    return 'Could not start the recording. Please try again.';
  }

  /* ---------- recording ---------- */
  function buildAudioTracks(wantSystem, wantMic) {
    var sys = wantSystem && displayStream ? displayStream.getAudioTracks() : [];
    var mic = wantMic && micStream ? micStream.getAudioTracks() : [];
    if (sys.length && mic.length) {
      var Ctx = window.AudioContext || window.webkitAudioContext;
      audioCtx = new Ctx();
      var dest = audioCtx.createMediaStreamDestination();
      audioCtx.createMediaStreamSource(new MediaStream(sys)).connect(dest);
      audioCtx.createMediaStreamSource(new MediaStream(mic)).connect(dest);
      return dest.stream.getAudioTracks();
    }
    return sys.length ? sys : mic;
  }
  function beginRecording(note) {
    var pref = val('format', 'webm');
    var mime = pickMime(pref);
    var opts = { videoBitsPerSecond: parseInt(val('quality', '4000000'), 10) || 4000000, audioBitsPerSecond: 128000 };
    if (mime) opts.mimeType = mime;
    try {
      recorder = new MediaRecorder(finalStream, opts);
    } catch (e) {
      try { recorder = new MediaRecorder(finalStream); }
      catch (e2) { throw new Error('Your browser could not start the recorder.'); }
    }
    chunks = [];
    recorder.ondataavailable = function (e) { if (e.data && e.data.size) chunks.push(e.data); };
    recorder.onstop = onRecorderStop;
    recorder.onerror = function () { status('The recording stopped unexpectedly.', 'error'); };
    recorder.start(1000);
    startedAt = Date.now();
    pausedAt = 0;
    pausedTotal = 0;
    setState('recording');
    startTimer();
    var msg = 'Recording — press Stop & save when you are done.';
    if (pref === 'mp4' && mime.indexOf('mp4') === -1) msg += ' (MP4 is not supported here, so WebM is used.)';
    if (note) msg += ' ' + note;
    status(msg);
  }
  async function start() {
    if (state !== 'idle' && state !== 'done') return;
    if (!supported()) {
      status('Your browser cannot record the screen. Try the desktop version of Chrome, Edge, Firefox or Safari.', 'error');
      return;
    }
    clearResult();
    cancelled = false;
    var mode = val('audio', 'none');
    var wantSystem = mode === 'system' || mode === 'both';
    var wantMic = mode === 'mic' || mode === 'both';
    setState('starting');
    status('Choose the screen, window or tab to record in your browser prompt…');
    try {
      displayStream = await navigator.mediaDevices.getDisplayMedia({ video: { frameRate: 30 }, audio: wantSystem });
      if (wantMic) {
        try {
          micStream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
        } catch (e) {
          throw new Error('Microphone access was blocked. Allow it in your browser, or choose a different audio option.');
        }
      }
      if (cancelled) { cleanup(); setState('idle'); status(''); return; }
      var audioTracks = buildAudioTracks(wantSystem, wantMic);
      var note = '';
      if (wantSystem && !displayStream.getAudioTracks().length) {
        note = 'No tab or system audio was shared — tick ‘Share audio’ in the picker next time.';
      }
      finalStream = new MediaStream(displayStream.getVideoTracks().concat(audioTracks));
      displayStream.getVideoTracks()[0].addEventListener('ended', function () {
        if (state === 'recording' || state === 'paused') stop();
        else if (state === 'starting') cancelled = true;
      });
      var countdown = control('countdown');
      if (countdown && countdown.checked) {
        for (var n = 3; n > 0 && !cancelled; n--) {
          showCount(String(n));
          status('Recording starts in ' + n + '…');
          await sleep(1000);
        }
        showCount('');
      }
      if (cancelled) { cleanup(); setState('idle'); status('Cancelled.'); return; }
      beginRecording(note);
    } catch (err) {
      showCount('');
      cleanup();
      setState('idle');
      status(friendly(err), 'error');
    }
  }
  function togglePause() {
    if (!recorder) return;
    if (state === 'recording') {
      recorder.pause();
      pausedAt = Date.now();
      setState('paused');
      status('Paused — press Resume to continue.');
    } else if (state === 'paused') {
      recorder.resume();
      pausedTotal += Date.now() - pausedAt;
      pausedAt = 0;
      setState('recording');
      status('Recording…');
    }
  }
  function stop() {
    if (state === 'starting') { cancelled = true; status('Cancelling…'); return; }
    if (!recorder || recorder.state === 'inactive') return;
    var now = Date.now();
    if (state === 'paused') { pausedTotal += now - pausedAt; pausedAt = 0; }
    finalDuration = Math.max(0, now - startedAt - pausedTotal);
    status('Finishing…');
    recorder.stop();
  }
  function onRecorderStop() {
    var type = (recorder && recorder.mimeType) || 'video/webm';
    var track = displayStream && displayStream.getVideoTracks()[0];
    var settings = track ? track.getSettings() : {};
    var blob = new Blob(chunks, { type: type });
    chunks = [];
    stopTimer();
    cleanup();
    recorder = null;
    if (!blob.size) {
      setState('idle');
      status('Nothing was recorded. Please try again.', 'error');
      return;
    }
    resultUrl = URL.createObjectURL(blob);
    resultInfo = {
      duration: finalDuration,
      size: blob.size,
      ext: type.indexOf('mp4') !== -1 ? 'mp4' : 'webm',
      res: settings.width ? settings.width + ' \u00d7 ' + settings.height : ''
    };
    timeEl.textContent = fmtTime(finalDuration);
    video.src = resultUrl;
    video.controls = true;
    video.hidden = false;
    idleBox.style.display = 'none';
    setState('done');
    status('Recording saved — preview it above, then press Download recording.', 'ok');
  }
  function downloadResult() {
    if (!resultUrl || !resultInfo) return;
    var a = document.createElement('a');
    a.href = resultUrl;
    a.download = baseName() + '.' + resultInfo.ext;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    status('Downloaded ' + a.download + '.', 'ok');
  }
  function discard() {
    clearResult();
    setState('idle');
    status('');
  }

  onAction('start', start);
  onAction('pause', togglePause);
  onAction('stop', stop);
  onAction('download', downloadResult);
  onAction('discard', discard);
  setState('idle');
})();
