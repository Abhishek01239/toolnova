(function () {
  'use strict';
  var root = document.getElementById('tool-app');
  if (!root) return;

  var DPI = 300;
  var GROUPS = { custom: ['cw', 'ch'], pixels: ['pxw', 'pxh'] };
  var BG = { white: '#ffffff', blue: '#dbe9f6', grey: '#e6e6e6' };
  var img = null;
  var imgName = 'photo';
  var imgUrl = '';
  var frame = { w: 413, h: 531, mmw: 35, mmh: 45 };
  var view = { cx: 0, cy: 0 };
  var lastPlan = { count: 0, total: 0, cols: 0, rows: 0, W: 1200, H: 1800 };
  var sizeText = '\u2014';
  var sizeRun = 0;
  var sizeTimer = null;
  var rafPending = false;
  var pointers = {};
  var lastDist = 0;

  /* ---------- tiny helpers ---------- */
  function control(id) { return root.querySelector('[data-control="' + id + '"]'); }
  function outputEl(id) { return root.querySelector('[data-output="' + id + '"]'); }
  function val(id, fallback) {
    var n = control(id);
    return n ? String(n.value) : fallback;
  }
  function checked(id, fallback) {
    var n = control(id);
    return n ? n.checked : fallback;
  }
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
    var btn = root.querySelector('[data-action="' + id + '"]');
    if (btn) btn.addEventListener('click', function () { fn(btn); });
  }
  function fmtBytes(n) {
    if (n < 1024) return n + ' B';
    if (n < 1048576) return (n / 1024).toFixed(1) + ' KB';
    return (n / 1048576).toFixed(2) + ' MB';
  }
  function clampNum(v, min, max, def) {
    var n = parseFloat(v);
    if (isNaN(n)) return def;
    return Math.min(max, Math.max(min, n));
  }
  var MAX_IMAGE_BYTES = 20 * 1024 * 1024;
  function isImage(f) {
    if (!f || typeof f.name !== 'string' || !Number.isFinite(f.size) || f.size <= 0 || f.size > MAX_IMAGE_BYTES) return false;
    var match = f.name.toLowerCase().match(/\.([^.]+)$/);
    var ext = match ? match[1] : '';
    var allowed = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', bmp: 'image/bmp', avif: 'image/avif' };
    var type = (f.type || '').toLowerCase();
    return !!allowed[ext] && (!type || type === allowed[ext] || (ext === 'jpeg' && type === 'image/pjpeg'));
  }
  function extFor(mime) { return mime === 'image/png' ? '.png' : '.jpg'; }
  function download(blob, name) {
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 5000);
  }

  /* ---------- styles (self-contained, uses the site's theme variables) ---------- */
  if (!document.getElementById('passport-photo-styles')) {
    var st = document.createElement('style');
    st.id = 'passport-photo-styles';
    st.textContent = [
      '.pp-drop{display:flex;flex-direction:column;align-items:center;gap:6px;padding:30px 20px;text-align:center;border:2px dashed var(--accent-ring);border-radius:16px;background:var(--accent-soft);cursor:pointer;color:var(--text);transition:border-color .25s ease,background .25s ease,transform .25s ease,box-shadow .25s ease}',
      '.pp-drop:hover,.pp-drop:focus-visible,.pp-drop.is-over{border-color:var(--accent);transform:translateY(-2px);box-shadow:0 0 36px -10px var(--accent-ring);outline:none}',
      '.pp-drop.is-over{background:var(--accent-ring)}',
      '.pp-drop-icon{font-size:2rem;line-height:1;animation:tn-float 3.5s ease-in-out infinite}',
      '.pp-drop strong{font-size:1.05rem}',
      '.pp-drop span.pp-hint{color:var(--muted);font-size:.86rem}',
      '.pp-fileinfo{margin:10px 0 0;font-size:.85rem;color:var(--muted);text-align:center;word-break:break-all}',
      '.pp-stage{display:flex;flex-direction:column;gap:10px;margin-bottom:8px}',
      '.pp-frame{position:relative;width:100%;max-width:340px;margin:0 auto;border-radius:12px;overflow:hidden;border:1px solid var(--border);background:#fff;box-shadow:0 0 44px -14px var(--accent-ring)}',
      '.pp-canvas{display:block;width:100%;height:auto;touch-action:none;cursor:grab;user-select:none;-webkit-user-select:none}',
      '.pp-guides{position:absolute;inset:0;width:100%;height:100%;pointer-events:none}',
      '.pp-idle{position:absolute;inset:0;display:grid;place-items:center;background:var(--surface-2);color:var(--muted);text-align:center;padding:16px;font-size:.9rem;line-height:1.5}',
      '.pp-tip{margin:0;text-align:center;color:var(--muted);font-size:.82rem}',
      '.pp-sheet-title{margin:8px 0 0;text-align:center;font-weight:600;font-size:.86rem}',
      '.pp-sheet{display:block;width:100%;max-width:340px;height:auto;margin:0 auto;border:1px solid var(--border);border-radius:8px;background:#fff}'
    ].join('\n');
    document.head.appendChild(st);
  }

  /* ---------- upload area in the input pane ---------- */
  var panes = root.querySelectorAll('.tool-pane');
  var inPane = panes[0];
  var outPane = panes[1] || panes[0];
  var zone = el('div', 'pp-zone');
  var drop = el('div', 'pp-drop');
  drop.setAttribute('role', 'button');
  drop.setAttribute('tabindex', '0');
  drop.setAttribute('aria-label', 'Choose a photo');
  drop.appendChild(el('span', 'pp-drop-icon', '🪪'));
  drop.appendChild(el('strong', '', 'Add your photo'));
  drop.appendChild(el('span', 'pp-hint', 'Tap to choose from your gallery or drop a file here · it stays on this device'));
  var input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/jpeg,image/png,image/webp,image/bmp,image/avif';
  input.hidden = true;
  var fileInfo = el('p', 'pp-fileinfo', 'No photo yet.');
  zone.appendChild(drop);
  zone.appendChild(input);
  zone.appendChild(fileInfo);
  var inHeader = inPane.querySelector('.pane-header');
  if (inHeader && inHeader.nextSibling) inPane.insertBefore(zone, inHeader.nextSibling);
  else inPane.appendChild(zone);

  drop.addEventListener('click', function () { input.click(); });
  drop.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); input.click(); }
  });
  input.addEventListener('change', function () {
    setFile(input.files);
    input.value = '';
  });
  ['dragenter', 'dragover'].forEach(function (name) {
    drop.addEventListener(name, function (e) { e.preventDefault(); drop.classList.add('is-over'); });
  });
  drop.addEventListener('dragleave', function (e) { e.preventDefault(); drop.classList.remove('is-over'); });
  drop.addEventListener('drop', function (e) {
    e.preventDefault();
    drop.classList.remove('is-over');
    if (e.dataTransfer && e.dataTransfer.files) setFile(e.dataTransfer.files);
  });

  /* ---------- editor stage in the result pane ---------- */
  var stage = el('div', 'pp-stage');
  var frameBox = el('div', 'pp-frame');
  var canvas = document.createElement('canvas');
  canvas.className = 'pp-canvas';
  canvas.width = frame.w;
  canvas.height = frame.h;
  canvas.setAttribute('role', 'img');
  canvas.setAttribute('aria-label', 'Photo editor: drag to position your photo');
  var NS = 'http://www.w3.org/2000/svg';
  var guides = document.createElementNS(NS, 'svg');
  guides.setAttribute('class', 'pp-guides');
  guides.setAttribute('viewBox', '0 0 100 100');
  guides.setAttribute('preserveAspectRatio', 'none');
  guides.setAttribute('aria-hidden', 'true');
  function guideShape(tag, attrs, stroke, width, dash) {
    var s = document.createElementNS(NS, tag);
    Object.keys(attrs).forEach(function (k) { s.setAttribute(k, attrs[k]); });
    s.setAttribute('fill', 'none');
    s.setAttribute('stroke', stroke);
    s.setAttribute('stroke-width', width);
    s.setAttribute('vector-effect', 'non-scaling-stroke');
    if (dash) s.setAttribute('stroke-dasharray', dash);
    return s;
  }
  var ellipse = { cx: '50', cy: '46', rx: '25', ry: '33' };
  var eyeLine = { x1: '8', y1: '40', x2: '92', y2: '40' };
  guides.appendChild(guideShape('ellipse', ellipse, 'rgba(0,0,0,0.55)', '4'));
  guides.appendChild(guideShape('ellipse', ellipse, '#ffffff', '2', '6 5'));
  guides.appendChild(guideShape('line', eyeLine, 'rgba(0,0,0,0.45)', '3'));
  guides.appendChild(guideShape('line', eyeLine, '#ffffff', '1', '4 4'));
  var idleEl = el('div', 'pp-idle', 'Add a photo to start. Then drag it into place and zoom until your face fits the oval.');
  frameBox.appendChild(canvas);
  frameBox.appendChild(guides);
  frameBox.appendChild(idleEl);
  var tip = el('p', 'pp-tip', 'Drag to move · pinch or use Zoom to resize · keep your eyes near the line');
  var sheetTitle = el('p', 'pp-sheet-title', 'Print sheet preview');
  var sheetCanvas = document.createElement('canvas');
  sheetCanvas.className = 'pp-sheet';
  sheetCanvas.setAttribute('role', 'img');
  sheetCanvas.setAttribute('aria-label', 'Preview of the print sheet');
  stage.appendChild(frameBox);
  stage.appendChild(tip);
  stage.appendChild(sheetTitle);
  stage.appendChild(sheetCanvas);
  var outHeader = outPane.querySelector('.pane-header');
  if (outHeader && outHeader.nextSibling) outPane.insertBefore(stage, outHeader.nextSibling);
  else outPane.appendChild(stage);

  /* ---------- geometry ---------- */
  function readFrame() {
    var p = val('preset', '35x45');
    var w;
    var h;
    var mmw = 0;
    var mmh = 0;
    if (p === 'pixels') {
      w = Math.round(clampNum(val('pxw', ''), 20, 6000, 200));
      h = Math.round(clampNum(val('pxh', ''), 20, 6000, 230));
    } else {
      if (p === 'custom') {
        mmw = clampNum(val('cw', ''), 10, 300, 35);
        mmh = clampNum(val('ch', ''), 10, 300, 45);
      } else {
        var parts = p.split('x');
        mmw = parseFloat(parts[0]);
        mmh = parseFloat(parts[1]);
      }
      w = Math.round(mmw / 25.4 * DPI);
      h = Math.round(mmh / 25.4 * DPI);
    }
    return { w: w, h: h, mmw: mmw, mmh: mmh };
  }
  function currentZoom() { return clampNum(val('zoom', '100'), 50, 300, 100); }
  function setZoom(z) {
    var v = Math.round(Math.min(300, Math.max(50, z)));
    var n = control('zoom');
    if (n) n.value = String(v);
    var rv = root.querySelector('[data-range-value="zoom"]');
    if (rv) rv.textContent = String(v);
  }
  function layout() {
    var base = Math.max(frame.w / img.naturalWidth, frame.h / img.naturalHeight);
    var s = base * currentZoom() / 100;
    var iw = img.naturalWidth * s;
    var ih = img.naturalHeight * s;
    var mx = Math.max(0, (iw - frame.w) / 2);
    var my = Math.max(0, (ih - frame.h) / 2);
    view.cx = Math.max(-mx, Math.min(mx, view.cx));
    view.cy = Math.max(-my, Math.min(my, view.cy));
    return { iw: iw, ih: ih };
  }
  function draw(cv) {
    cv.width = frame.w;
    cv.height = frame.h;
    var ctx = cv.getContext('2d');
    ctx.fillStyle = BG[val('bg', 'white')] || '#ffffff';
    ctx.fillRect(0, 0, frame.w, frame.h);
    if (!img) return;
    var L = layout();
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, frame.w / 2 + view.cx - L.iw / 2, frame.h / 2 + view.cy - L.ih / 2, L.iw, L.ih);
  }
  function sheetPlan() {
    var paper = val('sheet', '4x6') === 'a4' ? [2480, 3508] : [1200, 1800];
    var m = 59;
    var gap = 24;
    function fit(W, H) {
      return {
        W: W,
        H: H,
        cols: Math.max(0, Math.floor((W - 2 * m + gap) / (frame.w + gap))),
        rows: Math.max(0, Math.floor((H - 2 * m + gap) / (frame.h + gap)))
      };
    }
    var a = fit(paper[0], paper[1]);
    var b = fit(paper[1], paper[0]);
    var best = (b.cols * b.rows > a.cols * a.rows) ? b : a;
    best.total = best.cols * best.rows;
    var req = parseInt(val('copies', ''), 10);
    best.count = req > 0 ? Math.min(req, best.total) : best.total;
    best.gap = gap;
    return best;
  }
  function drawSheet(cv, plan, scale) {
    cv.width = Math.max(1, Math.round(plan.W * scale));
    cv.height = Math.max(1, Math.round(plan.H * scale));
    var ctx = cv.getContext('2d');
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, plan.W, plan.H);
    if (!plan.total) return;
    var gridW = plan.cols * frame.w + (plan.cols - 1) * plan.gap;
    var gridH = plan.rows * frame.h + (plan.rows - 1) * plan.gap;
    var x0 = Math.round((plan.W - gridW) / 2);
    var y0 = Math.round((plan.H - gridH) / 2);
    var line = checked('border', true);
    ctx.lineWidth = Math.max(2, 1.2 / scale);
    ctx.strokeStyle = '#8a8a8a';
    for (var i = 0; i < plan.count; i++) {
      var col = i % plan.cols;
      var row = Math.floor(i / plan.cols);
      var x = x0 + col * (frame.w + plan.gap);
      var y = y0 + row * (frame.h + plan.gap);
      ctx.drawImage(canvas, x, y, frame.w, frame.h);
      if (line) ctx.strokeRect(x, y, frame.w, frame.h);
    }
  }

  /* ---------- encoding (with an optional KB limit for JPG) ---------- */
  function encode(cv, mime, maxKB) {
    return new Promise(function (resolve, reject) {
      function toBlob(q, cb) { cv.toBlob(cb, mime, q); }
      if (mime !== 'image/jpeg' || !maxKB) {
        toBlob(0.95, function (b) { if (b) resolve(b); else reject(new Error('Could not create the image.')); });
        return;
      }
      var limit = maxKB * 1024;
      var lo = 0.1;
      var hi = 0.95;
      var best = null;
      var tries = 0;
      function search() {
        if (tries >= 9 || hi - lo < 0.015) {
          if (best) { resolve(best); return; }
          reject(new Error('Could not get under ' + maxKB + ' KB at this size. Choose a smaller photo size.'));
          return;
        }
        var q = (lo + hi) / 2;
        toBlob(q, function (b) {
          tries++;
          if (!b) { reject(new Error('Could not create the image.')); return; }
          if (b.size <= limit) { best = b; lo = q; } else { hi = q; }
          search();
        });
      }
      toBlob(0.95, function (b) {
        if (!b) { reject(new Error('Could not create the image.')); return; }
        if (b.size <= limit) { resolve(b); return; }
        search();
      });
    });
  }

  /* ---------- refreshing the view ---------- */
  function renderStats() {
    var real = frame.mmw ? (Math.round(frame.mmw * 10) / 10) + ' \u00d7 ' + (Math.round(frame.mmh * 10) / 10) + ' mm' : '\u2014';
    setStats('summary', [
      ['Photo size', frame.w + ' \u00d7 ' + frame.h + ' px'],
      ['Printed size', real],
      ['Copies on sheet', lastPlan.total ? String(lastPlan.count) : '0'],
      ['File size', sizeText]
    ]);
  }
  function refresh() {
    frame = readFrame();
    draw(canvas);
    lastPlan = sheetPlan();
    sheetTitle.style.display = '';
    drawSheet(sheetCanvas, lastPlan, Math.min(1, 340 / lastPlan.W));
    guides.style.display = checked('guides', true) && img ? '' : 'none';
    idleEl.style.display = img ? 'none' : '';
    renderStats();
    scheduleSize();
  }
  function refreshLight() {
    if (rafPending) return;
    rafPending = true;
    requestAnimationFrame(function () {
      rafPending = false;
      draw(canvas);
      drawSheet(sheetCanvas, lastPlan, Math.min(1, 340 / lastPlan.W));
    });
  }
  function scheduleSize() {
    if (sizeTimer) clearTimeout(sizeTimer);
    sizeTimer = setTimeout(estimate, 450);
  }
  function estimate() {
    var run = ++sizeRun;
    if (!img) { sizeText = '\u2014'; renderStats(); return; }
    var mime = val('format', 'image/jpeg');
    var maxKB = clampNum(val('maxkb', ''), 1, 5000, 0);
    encode(canvas, mime, maxKB).then(function (b) {
      if (run !== sizeRun) return;
      sizeText = fmtBytes(b.size);
      renderStats();
      if (maxKB && mime !== 'image/jpeg') status('The file-size limit only works with JPG output.', 'error');
      else status('');
    }).catch(function (e) {
      if (run !== sizeRun) return;
      sizeText = '\u2014';
      renderStats();
      status(e.message, 'error');
    });
  }

  /* ---------- loading the photo ---------- */
  function setFile(fileList) {
    var f = fileList && fileList[0];
    if (!f) return;
    if (!isImage(f)) { status('Choose a matching JPG, PNG, WebP, BMP or AVIF image up to 20 MB.', 'error'); return; }
    if (imgUrl) URL.revokeObjectURL(imgUrl);
    imgUrl = URL.createObjectURL(f);
    var probe = new Image();
    probe.onload = function () {
      img = probe;
      imgName = f.name.replace(/\.[^.]+$/, '') || 'photo';
      view.cx = 0;
      view.cy = 0;
      setZoom(100);
      fileInfo.textContent = f.name + ' \u00b7 ' + probe.naturalWidth + ' \u00d7 ' + probe.naturalHeight + ' px';
      status('Photo added \u2014 drag it into place and zoom to fit your face in the oval.', 'ok');
      refresh();
    };
    probe.onerror = function () {
      status('That image could not be opened. Try a JPG or PNG photo.', 'error');
    };
    probe.src = imgUrl;
  }

  /* ---------- drag, pinch and wheel ---------- */
  canvas.addEventListener('pointerdown', function (e) {
    if (!img) return;
    try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
    pointers[e.pointerId] = { x: e.clientX, y: e.clientY };
    lastDist = 0;
    canvas.style.cursor = 'grabbing';
  });
  canvas.addEventListener('pointermove', function (e) {
    var p = pointers[e.pointerId];
    if (!p || !img) return;
    var keys = Object.keys(pointers);
    var k = frame.w / (canvas.clientWidth || frame.w);
    if (keys.length === 1) {
      view.cx += (e.clientX - p.x) * k;
      view.cy += (e.clientY - p.y) * k;
      p.x = e.clientX;
      p.y = e.clientY;
    } else {
      p.x = e.clientX;
      p.y = e.clientY;
      var a = pointers[keys[0]];
      var b = pointers[keys[1]];
      var d = Math.sqrt((a.x - b.x) * (a.x - b.x) + (a.y - b.y) * (a.y - b.y));
      if (lastDist) setZoom(currentZoom() * d / lastDist);
      lastDist = d;
    }
    refreshLight();
  });
  function endPointer(e) {
    delete pointers[e.pointerId];
    lastDist = 0;
    canvas.style.cursor = 'grab';
    scheduleSize();
  }
  canvas.addEventListener('pointerup', endPointer);
  canvas.addEventListener('pointercancel', endPointer);
  canvas.addEventListener('wheel', function (e) {
    if (!img) return;
    e.preventDefault();
    setZoom(currentZoom() * (e.deltaY < 0 ? 1.06 : 0.94));
    refreshLight();
    scheduleSize();
  }, { passive: false });

  /* ---------- settings ---------- */
  function syncGroups() {
    var p = val('preset', '35x45');
    Object.keys(GROUPS).forEach(function (g) {
      GROUPS[g].forEach(function (id) {
        var f = root.querySelector('[data-field="' + id + '"]');
        if (f) f.style.display = g === p ? '' : 'none';
      });
    });
  }
  function onSettingsChange(e) {
    var id = e.target && e.target.getAttribute ? e.target.getAttribute('data-control') : null;
    if (!id) return;
    if (id === 'preset') { syncGroups(); view.cx = 0; view.cy = 0; }
    if (id === 'zoom') {
      var rv = root.querySelector('[data-range-value="zoom"]');
      if (rv) rv.textContent = e.target.value;
    }
    refresh();
  }
  root.addEventListener('input', onSettingsChange);
  root.addEventListener('change', onSettingsChange);

  /* ---------- downloads ---------- */
  onAction('photo', function () {
    if (!img) { status('Add a photo first.', 'error'); return; }
    var mime = val('format', 'image/jpeg');
    var maxKB = clampNum(val('maxkb', ''), 1, 5000, 0);
    status('Preparing your photo\u2026');
    draw(canvas);
    encode(canvas, mime, maxKB).then(function (blob) {
      download(blob, imgName + '-' + frame.w + 'x' + frame.h + extFor(mime));
      status('Downloaded ' + fmtBytes(blob.size) + (maxKB && mime === 'image/jpeg' ? ' (limit ' + maxKB + ' KB).' : '.'), 'ok');
    }).catch(function (e) {
      status(e.message, 'error');
    });
  });
  onAction('sheet', function () {
    if (!img) { status('Add a photo first.', 'error'); return; }
    var plan = sheetPlan();
    if (!plan.total) { status('This photo size is too large to fit on that paper. Choose A4 or a smaller size.', 'error'); return; }
    var mime = val('format', 'image/jpeg');
    status('Preparing the print sheet\u2026');
    draw(canvas);
    var tmp = document.createElement('canvas');
    drawSheet(tmp, plan, 1);
    encode(tmp, mime, 0).then(function (blob) {
      var paper = val('sheet', '4x6') === 'a4' ? 'a4' : '4x6';
      download(blob, imgName + '-print-sheet-' + paper + extFor(mime));
      status('Downloaded a sheet with ' + plan.count + (plan.count === 1 ? ' photo.' : ' photos.') + ' Print it at 100% scale.', 'ok');
    }).catch(function (e) {
      status(e.message, 'error');
    });
  });
  onAction('reset', function () {
    view.cx = 0;
    view.cy = 0;
    setZoom(100);
    refresh();
  });

  syncGroups();
  refresh();
})();
