(function () {
  'use strict';
  var root = document.getElementById('tool-app');
  if (!root) return;

  var LIBS = [
    'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3',
    'https://esm.sh/@huggingface/transformers@3'
  ];
  var MODEL = 'Xenova/modnet';
  var MAX_SIDE = 2048;

  var item = null; // { file, name, size, url }
  var cut = null; // canvas with transparent background
  var busy = false;
  var engine = null; // { model, processor, RawImage }
  var enginePromise = null;

  function control(id) { return root.querySelector('[data-control="' + id + '"]'); }
  function outputEl(id) { return root.querySelector('[data-output="' + id + '"]'); }
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined && text !== null) n.textContent = text;
    return n;
  }
  function status(msg, kind) {
    var n = root.querySelector('[data-status]');
    if (!n) return;
    n.textContent = msg || '';
    n.className = 'status' + (kind ? ' ' + kind : '');
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
    return btn;
  }
  function fmtBytes(n) {
    if (n < 1024) return n + ' B';
    if (n < 1048576) return (n / 1024).toFixed(1) + ' KB';
    return (n / 1048576).toFixed(1) + ' MB';
  }
  function isImage(f) {
    var t = (f.type || '').toLowerCase();
    if (t === 'image/gif' || t === 'image/svg+xml') return false;
    return t.indexOf('image/') === 0 || /\.(jpe?g|png|webp|bmp|avif)$/i.test(f.name);
  }

  /* ---------- styles ---------- */
  if (!document.getElementById('bgremover-styles')) {
    var st = document.createElement('style');
    st.id = 'bgremover-styles';
    st.textContent = [
      '.br-drop{display:flex;flex-direction:column;align-items:center;gap:6px;padding:34px 20px;text-align:center;border:2px dashed var(--accent-ring);border-radius:16px;background:var(--accent-soft);cursor:pointer;color:var(--text);transition:border-color .25s ease,background .25s ease,transform .25s ease,box-shadow .25s ease}',
      '.br-drop:hover,.br-drop:focus-visible,.br-drop.is-over{border-color:var(--accent);transform:translateY(-2px);box-shadow:0 0 36px -10px var(--accent-ring);outline:none}',
      '.br-drop.is-over{background:var(--accent-ring)}',
      '.br-icon{font-size:2rem;line-height:1;animation:tn-float 3.5s ease-in-out infinite}',
      '.br-drop strong{font-size:1.05rem}',
      '.br-hint{color:var(--muted);font-size:.86rem}',
      '.br-stage{margin-top:14px;display:none}',
      '.br-view{position:relative;border:1px solid var(--border);border-radius:14px;overflow:hidden;background-color:#fff;background-image:linear-gradient(45deg,#d9d9d9 25%,transparent 25%,transparent 75%,#d9d9d9 75%),linear-gradient(45deg,#d9d9d9 25%,transparent 25%,transparent 75%,#d9d9d9 75%);background-size:20px 20px;background-position:0 0,10px 10px;line-height:0}',
      '.br-view.solid{background-image:none}',
      '.br-view img,.br-view canvas{display:block;width:100%;height:auto;max-height:480px;object-fit:contain;margin:0 auto}',
      '.br-load{position:absolute;inset:0;display:none;flex-direction:column;align-items:center;justify-content:center;gap:10px;background:rgba(0,0,0,.72);color:#fff;font-size:.92rem;line-height:1.4;text-align:center;padding:16px}',
      '.br-load.on{display:flex}',
      '.br-bar{width:min(260px,70%);height:6px;border-radius:99px;background:rgba(255,255,255,.2);overflow:hidden}',
      '.br-bar i{display:block;height:100%;width:0;background:var(--accent);transition:width .2s ease}',
      '.br-bar.indet i{width:40%;animation:br-slide 1.1s ease-in-out infinite}',
      '@keyframes br-slide{0%{margin-left:-40%}100%{margin-left:100%}}',
      '.br-name{margin:10px 0 0;color:var(--muted);font-size:.84rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}'
    ].join('\n');
    document.head.appendChild(st);
  }

  /* ---------- UI ---------- */
  var pane = root.querySelector('.tool-pane');
  var zone = el('div', 'br-zone');
  var drop = el('div', 'br-drop');
  drop.setAttribute('role', 'button');
  drop.setAttribute('tabindex', '0');
  drop.setAttribute('aria-label', 'Choose a photo');
  drop.appendChild(el('span', 'br-icon', '✂️'));
  drop.appendChild(el('strong', '', 'Choose a photo'));
  drop.appendChild(el('span', 'br-hint', 'JPG, PNG or WebP · stays on this device'));
  var input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/jpeg,image/png,image/webp,image/bmp,image/avif';
  input.hidden = true;

  var stage = el('div', 'br-stage');
  var view = el('div', 'br-view');
  var original = document.createElement('img');
  original.alt = 'Your photo';
  var canvas = document.createElement('canvas');
  canvas.style.display = 'none';
  var load = el('div', 'br-load');
  var loadText = el('div', '', '');
  var bar = el('div', 'br-bar indet');
  var barFill = document.createElement('i');
  bar.appendChild(barFill);
  load.appendChild(loadText);
  load.appendChild(bar);
  view.appendChild(original);
  view.appendChild(canvas);
  view.appendChild(load);
  var nameLine = el('p', 'br-name', '');
  stage.appendChild(view);
  stage.appendChild(nameLine);

  zone.appendChild(drop);
  zone.appendChild(input);
  zone.appendChild(stage);
  var header = pane.querySelector('.pane-header');
  if (header && header.nextSibling) pane.insertBefore(zone, header.nextSibling);
  else pane.appendChild(zone);

  drop.addEventListener('click', function () { input.click(); });
  drop.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); input.click(); }
  });
  input.addEventListener('change', function () {
    if (input.files && input.files[0]) setFile(input.files[0]);
    input.value = '';
  });
  ['dragenter', 'dragover'].forEach(function (name) {
    drop.addEventListener(name, function (e) { e.preventDefault(); drop.classList.add('is-over'); });
  });
  drop.addEventListener('dragleave', function (e) { e.preventDefault(); drop.classList.remove('is-over'); });
  drop.addEventListener('drop', function (e) {
    e.preventDefault();
    drop.classList.remove('is-over');
    if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]) setFile(e.dataTransfer.files[0]);
  });

  var removeBtn = root.querySelector('[data-action="remove"]');
  var downloadBtn = root.querySelector('[data-action="download"]');

  function showLoad(text, pct) {
    load.classList.add('on');
    loadText.textContent = text;
    if (typeof pct === 'number') {
      bar.classList.remove('indet');
      barFill.style.width = Math.max(2, Math.min(100, pct)) + '%';
    } else {
      bar.classList.add('indet');
      barFill.style.width = '';
    }
  }
  function hideLoad() { load.classList.remove('on'); }

  function setFile(f) {
    if (busy) return;
    if (!isImage(f)) { status('Please choose a JPG, PNG or WebP photo.', 'error'); return; }
    if (item) URL.revokeObjectURL(item.url);
    item = { file: f, name: f.name, size: f.size, url: URL.createObjectURL(f) };
    cut = null;
    original.onload = function () { updateStats(); };
    original.src = item.url;
    original.style.display = '';
    canvas.style.display = 'none';
    view.classList.remove('solid');
    view.style.backgroundColor = '';
    stage.style.display = 'block';
    nameLine.textContent = f.name + ' · ' + fmtBytes(f.size);
    status('Photo ready. Press Remove background.');
    updateStats();
  }

  /* ---------- load the AI model ---------- */
  function importFrom(i) {
    if (i >= LIBS.length) return Promise.reject(new Error('lib'));
    return import(LIBS[i]).catch(function () { return importFrom(i + 1); });
  }
  function getEngine() {
    if (engine) return Promise.resolve(engine);
    if (enginePromise) return enginePromise;
    var files = {};
    function progress(p) {
      if (!p || !p.file) return;
      if (p.status === 'progress' && typeof p.progress === 'number') {
        files[p.file] = { loaded: p.loaded || 0, total: p.total || 0 };
        var loaded = 0;
        var total = 0;
        Object.keys(files).forEach(function (k) { loaded += files[k].loaded; total += files[k].total; });
        if (total > 0) {
          var pct = loaded / total * 100;
          showLoad('Downloading the AI model (first time only)… ' + Math.round(pct) + '%', pct);
        }
      }
    }
    showLoad('Loading the AI engine…');
    enginePromise = importFrom(0).then(function (lib) {
      if (lib.env) { lib.env.allowLocalModels = false; }
      return Promise.all([
        lib.AutoModel.from_pretrained(MODEL, { dtype: 'fp32', progress_callback: progress }),
        lib.AutoProcessor.from_pretrained(MODEL)
      ]).then(function (r) {
        engine = { model: r[0], processor: r[1], RawImage: lib.RawImage };
        return engine;
      });
    }).catch(function (e) {
      enginePromise = null;
      throw e;
    });
    return enginePromise;
  }

  /* ---------- run ---------- */
  function loadImage(url) {
    return new Promise(function (resolve, reject) {
      var im = new Image();
      im.onload = function () { resolve(im); };
      im.onerror = function () { reject(new Error('img')); };
      im.src = url;
    });
  }
  function canvasBlob(c) {
    return new Promise(function (resolve, reject) {
      c.toBlob(function (b) { b ? resolve(b) : reject(new Error('blob')); }, 'image/png');
    });
  }

  function run() {
    if (busy) return;
    if (!item) { status('Choose a photo first.', 'error'); return; }
    busy = true;
    if (removeBtn) removeBtn.disabled = true;
    status('');
    var base;
    var t0 = Date.now();
    loadImage(item.url).then(function (im) {
      var w = im.naturalWidth;
      var h = im.naturalHeight;
      var s = Math.min(1, MAX_SIDE / Math.max(w, h));
      base = document.createElement('canvas');
      base.width = Math.max(1, Math.round(w * s));
      base.height = Math.max(1, Math.round(h * s));
      var ctx = base.getContext('2d');
      if (!ctx) throw new Error('canvas');
      ctx.drawImage(im, 0, 0, base.width, base.height);
      return getEngine();
    }).then(function (eng) {
      showLoad('Removing the background…');
      return canvasBlob(base).then(function (blob) {
        var u = URL.createObjectURL(blob);
        return eng.RawImage.fromURL(u).then(function (img) {
          URL.revokeObjectURL(u);
          return eng.processor(img);
        });
      }).then(function (inputs) {
        return eng.model({ input: inputs.pixel_values });
      }).then(function (out) {
        var tensor = out.output[0].mul(255).to('uint8');
        var mask = eng.RawImage.fromTensor(tensor);
        return mask.resize(base.width, base.height);
      });
    }).then(function (mask) {
      var ctx = base.getContext('2d');
      var data = ctx.getImageData(0, 0, base.width, base.height);
      var ch = mask.channels || 1;
      var n = base.width * base.height;
      for (var i = 0; i < n; i++) data.data[i * 4 + 3] = mask.data[i * ch];
      ctx.putImageData(data, 0, 0);
      cut = base;
      showResult();
      var secs = Math.max(1, Math.round((Date.now() - t0) / 1000));
      status('Done in about ' + secs + ' s. Choose a background, then download.', 'ok');
    }).catch(function (e) {
      var msg = e && e.message;
      if (msg === 'lib') status('Could not load the AI engine. Check your internet connection and try again.', 'error');
      else if (msg === 'img') status('That image could not be read. Try a different JPG or PNG.', 'error');
      else status('Something went wrong while removing the background. Check your connection, or try a smaller photo, and press the button again.', 'error');
    }).then(function () {
      busy = false;
      hideLoad();
      if (removeBtn) removeBtn.disabled = false;
      updateStats();
    });
  }

  /* ---------- result + background ---------- */
  function bgValue() {
    var c = control('bg');
    return c ? String(c.value) : 'transparent';
  }
  function composite() {
    var out = document.createElement('canvas');
    out.width = cut.width;
    out.height = cut.height;
    var ctx = out.getContext('2d');
    var bg = bgValue();
    if (bg !== 'transparent') {
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, out.width, out.height);
    }
    ctx.drawImage(cut, 0, 0);
    return out;
  }
  function showResult() {
    if (!cut) return;
    canvas.width = cut.width;
    canvas.height = cut.height;
    var ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(cut, 0, 0);
    original.style.display = 'none';
    canvas.style.display = '';
    applyBg();
  }
  function applyBg() {
    var bg = bgValue();
    if (bg === 'transparent') {
      view.classList.remove('solid');
      view.style.backgroundColor = '';
    } else {
      view.classList.add('solid');
      view.style.backgroundColor = bg;
    }
  }
  root.addEventListener('change', function (e) {
    if (e.target && e.target.getAttribute && e.target.getAttribute('data-control') === 'bg' && cut) applyBg();
  });

  function updateStats() {
    setStats('summary', [
      ['Photo', item ? fmtBytes(item.size) : '—'],
      ['Result', cut ? cut.width + ' × ' + cut.height + ' px' : '—'],
      ['Status', busy ? 'Working…' : (cut ? 'Ready' : (item ? 'Waiting' : 'No photo'))]
    ]);
  }

  function download() {
    if (!cut) { status('Remove the background first, then download.', 'error'); return; }
    var out = composite();
    out.toBlob(function (blob) {
      if (!blob) { status('Could not create the file. Try a smaller photo.', 'error'); return; }
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = item.name.replace(/\.[^.]+$/, '') + '-no-background.png';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(function () { URL.revokeObjectURL(url); }, 5000);
      status('Downloaded ' + a.download + '.', 'ok');
    }, 'image/png');
  }

  onAction('remove', run);
  onAction('download', download);
  onAction('clear', function () {
    if (busy) return;
    if (item) URL.revokeObjectURL(item.url);
    item = null;
    cut = null;
    stage.style.display = 'none';
    original.removeAttribute('src');
    status('');
    updateStats();
  });
  updateStats();
})();
