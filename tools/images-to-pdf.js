(function () {
  'use strict';
  var root = document.getElementById('tool-app');
  if (!root) return;

  var LIB_URLS = [
    'https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/dist/pdf-lib.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/pdf-lib/1.17.1/pdf-lib.min.js'
  ];
  var MAX_FILES = 100;
  var files = [];
  var nextId = 1;
  var busy = false;
  var lastOut = null;
  var dragIndex = null;
  var libPromise = null;

  /* ---------- tiny helpers ---------- */
  function control(id) { return root.querySelector('[data-control="' + id + '"]'); }
  function outputEl(id) { return root.querySelector('[data-output="' + id + '"]'); }
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
    if (n < 1073741824) return (n / 1048576).toFixed(1) + ' MB';
    return (n / 1073741824).toFixed(2) + ' GB';
  }
  function isImage(f) {
    return (f.type || '').indexOf('image/') === 0 || /\.(jpe?g|png|webp|gif|bmp|avif)$/i.test(f.name);
  }
  function outputName() {
    var node = control('filename');
    var v = ((node && node.value) || '').replace(/[\\/:*?"<>|]+/g, '').trim();
    if (!v) v = 'images';
    if (v.toLowerCase().slice(-4) !== '.pdf') v += '.pdf';
    return v;
  }
  function options() {
    function val(id, fallback) { var n = control(id); return n ? n.value : fallback; }
    return { size: val('size', 'a4'), orient: val('orient', 'auto'), margin: parseFloat(val('margin', '24')) || 0 };
  }

  /* ---------- styles (self-contained, uses the site's theme variables) ---------- */
  if (!document.getElementById('images-to-pdf-styles')) {
    var st = document.createElement('style');
    st.id = 'images-to-pdf-styles';
    st.textContent = [
      '.pdf-drop{display:flex;flex-direction:column;align-items:center;gap:6px;padding:34px 20px;text-align:center;border:2px dashed var(--accent-ring);border-radius:16px;background:var(--accent-soft);cursor:pointer;color:var(--text);transition:border-color .25s ease,background .25s ease,transform .25s ease,box-shadow .25s ease}',
      '.pdf-drop:hover,.pdf-drop:focus-visible,.pdf-drop.is-over{border-color:var(--accent);transform:translateY(-2px);box-shadow:0 0 36px -10px var(--accent-ring);outline:none}',
      '.pdf-drop.is-over{background:var(--accent-ring)}',
      '.pdf-drop-icon{font-size:2rem;line-height:1;animation:tn-float 3.5s ease-in-out infinite}',
      '.pdf-drop strong{font-size:1.05rem}',
      '.pdf-drop span.pdf-hint{color:var(--muted);font-size:.86rem}',
      '.pdf-list{list-style:none;margin:14px 0 0;padding:0;display:flex;flex-direction:column;gap:8px}',
      '.pdf-item{display:flex;align-items:center;gap:12px;padding:10px 12px;background:var(--surface-2);border:1px solid var(--border);border-radius:12px;cursor:grab;transition:border-color .2s ease,opacity .2s ease,box-shadow .2s ease}',
      '.pdf-item:hover{border-color:var(--accent-ring)}',
      '.pdf-item.dragging{opacity:.4}',
      '.pdf-item.drop-target{border-color:var(--accent);box-shadow:0 0 0 3px var(--accent-soft)}',
      '.pdf-item.has-error{border-color:var(--err)}',
      '.pdf-num{flex:none;width:26px;height:26px;display:grid;place-items:center;border-radius:8px;background:var(--accent-soft);color:var(--accent);font-weight:700;font-size:.8rem}',
      '.pdf-thumb{flex:none;width:46px;height:46px;border-radius:8px;object-fit:cover;border:1px solid var(--border);background:var(--surface)}',
      '.pdf-info{flex:1;min-width:0}',
      '.pdf-name{display:block;font-weight:600;font-size:.92rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
      '.pdf-meta{display:block;color:var(--muted);font-size:.78rem}',
      '.pdf-item.has-error .pdf-meta{color:var(--err)}',
      '.pdf-btns{display:flex;gap:4px;flex:none}',
      '.pdf-btns button{width:30px;height:30px;border:1px solid var(--border);border-radius:8px;background:var(--surface);color:var(--muted);line-height:1;transition:color .15s ease,border-color .15s ease,background .15s ease}',
      '.pdf-btns button:hover:not(:disabled){color:var(--accent);border-color:var(--accent-ring);background:var(--accent-soft)}',
      '.pdf-btns button.pdf-del:hover:not(:disabled){color:var(--err);border-color:var(--err);background:var(--err-soft)}',
      '.pdf-btns button:disabled{opacity:.35;cursor:default}',
      '.pdf-empty{color:var(--muted);font-size:.88rem;text-align:center;margin:12px 0 0}'
    ].join('\n');
    document.head.appendChild(st);
  }

  /* ---------- upload area inside the input pane ---------- */
  var pane = root.querySelector('.tool-pane');
  var zone = el('div', 'pdf-zone');
  var drop = el('div', 'pdf-drop');
  drop.setAttribute('role', 'button');
  drop.setAttribute('tabindex', '0');
  drop.setAttribute('aria-label', 'Add images');
  drop.appendChild(el('span', 'pdf-drop-icon', '🖼️'));
  drop.appendChild(el('strong', '', 'Drop images here'));
  drop.appendChild(el('span', 'pdf-hint', 'JPG, PNG, WebP and more · your files stay on this device'));
  var input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  input.multiple = true;
  input.hidden = true;
  var list = el('ol', 'pdf-list');
  var empty = el('p', 'pdf-empty', 'No images yet — add one or more to build your PDF.');
  zone.appendChild(drop);
  zone.appendChild(input);
  zone.appendChild(list);
  zone.appendChild(empty);
  var header = pane.querySelector('.pane-header');
  if (header && header.nextSibling) pane.insertBefore(zone, header.nextSibling);
  else pane.appendChild(zone);

  drop.addEventListener('click', function () { input.click(); });
  drop.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); input.click(); }
  });
  input.addEventListener('change', function () {
    addFiles(input.files);
    input.value = '';
  });
  ['dragenter', 'dragover'].forEach(function (name) {
    drop.addEventListener(name, function (e) { e.preventDefault(); drop.classList.add('is-over'); });
  });
  drop.addEventListener('dragleave', function (e) { e.preventDefault(); drop.classList.remove('is-over'); });
  drop.addEventListener('drop', function (e) {
    e.preventDefault();
    drop.classList.remove('is-over');
    if (e.dataTransfer && e.dataTransfer.files) addFiles(e.dataTransfer.files);
  });

  /* ---------- PDF engine (loaded on demand) ---------- */
  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.src = src;
      s.async = true;
      s.onload = resolve;
      s.onerror = function () { reject(new Error('load failed')); };
      document.head.appendChild(s);
    });
  }
  function ensureLib() {
    if (window.PDFLib) return Promise.resolve(window.PDFLib);
    if (!libPromise) {
      libPromise = LIB_URLS.reduce(function (chain, url) {
        return chain.catch(function () {
          return loadScript(url).then(function () {
            if (!window.PDFLib) throw new Error('engine missing');
          });
        });
      }, Promise.reject(new Error('start'))).then(function () {
        return window.PDFLib;
      }).catch(function () {
        libPromise = null;
        var e = new Error('Could not load the PDF engine. Check your internet connection and try again.');
        e.engine = true;
        throw e;
      });
    }
    return libPromise;
  }

  /* ---------- image helpers ---------- */
  function sniff(b) {
    if (b[0] === 0xFF && b[1] === 0xD8 && b[2] === 0xFF) return 'jpeg';
    if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4E && b[3] === 0x47) return 'png';
    return 'other';
  }
  // Reads the EXIF orientation tag (1 = upright) from the start of a JPEG.
  function exifOrientation(b) {
    if (b[0] !== 0xFF || b[1] !== 0xD8) return 1;
    var p = 2;
    while (p + 4 < b.length && p < 65536) {
      if (b[p] !== 0xFF) return 1;
      var marker = b[p + 1];
      var len = (b[p + 2] << 8) | b[p + 3];
      if (marker === 0xE1 && b[p + 4] === 0x45 && b[p + 5] === 0x78 && b[p + 6] === 0x69 && b[p + 7] === 0x66) {
        var t = p + 10;
        var little = b[t] === 0x49;
        var u16 = function (o) { return little ? (b[t + o] | (b[t + o + 1] << 8)) : ((b[t + o] << 8) | b[t + o + 1]); };
        var u32 = function (o) {
          return little
            ? (b[t + o] | (b[t + o + 1] << 8) | (b[t + o + 2] << 16) | (b[t + o + 3] << 24))
            : ((b[t + o] << 24) | (b[t + o + 1] << 16) | (b[t + o + 2] << 8) | b[t + o + 3]);
        };
        var ifd = u32(4);
        var count = Math.min(u16(ifd), 64);
        for (var i = 0; i < count; i++) {
          var entry = ifd + 2 + i * 12;
          if (u16(entry) === 0x0112) return u16(entry + 8) || 1;
        }
        return 1;
      }
      if (marker === 0xDA) return 1;
      p += 2 + len;
    }
    return 1;
  }
  // Draws the image on a canvas (browsers apply EXIF rotation) and re-encodes it.
  function rasterize(file, mime) {
    return new Promise(function (resolve, reject) {
      var url = URL.createObjectURL(file);
      var img = new Image();
      img.onload = function () {
        try {
          var c = document.createElement('canvas');
          c.width = img.naturalWidth;
          c.height = img.naturalHeight;
          var ctx = c.getContext('2d');
          if (mime === 'image/jpeg') { ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, c.width, c.height); }
          ctx.drawImage(img, 0, 0);
          c.toBlob(function (blob) {
            URL.revokeObjectURL(url);
            if (!blob) { reject(new Error('conversion failed')); return; }
            blob.arrayBuffer().then(function (buf) { resolve(new Uint8Array(buf)); }, reject);
          }, mime, 0.92);
        } catch (e) {
          URL.revokeObjectURL(url);
          reject(e);
        }
      };
      img.onerror = function () { URL.revokeObjectURL(url); reject(new Error('decode failed')); };
      img.src = url;
    });
  }
  function embedImage(doc, item) {
    return item.file.arrayBuffer().then(function (buf) {
      var bytes = new Uint8Array(buf);
      var kind = sniff(bytes);
      var viaCanvas = function () {
        var asJpeg = kind === 'jpeg';
        return rasterize(item.file, asJpeg ? 'image/jpeg' : 'image/png').then(function (out) {
          return asJpeg ? doc.embedJpg(out) : doc.embedPng(out);
        });
      };
      if (kind === 'png') return doc.embedPng(bytes).catch(viaCanvas);
      if (kind === 'jpeg' && exifOrientation(bytes) <= 1) return doc.embedJpg(bytes).catch(viaCanvas);
      return viaCanvas();
    });
  }
  function addPage(doc, img, opts) {
    var w = img.width;
    var h = img.height;
    if (opts.size === 'fit') {
      var s = Math.min(1, 842 / Math.max(w, h));
      var fw = Math.max(1, Math.round(w * s));
      var fh = Math.max(1, Math.round(h * s));
      doc.addPage([fw, fh]).drawImage(img, { x: 0, y: 0, width: fw, height: fh });
      return;
    }
    var base = opts.size === 'letter' ? [612, 792] : [595.28, 841.89];
    var landscape = opts.orient === 'landscape' || (opts.orient === 'auto' && w > h);
    var pw = landscape ? base[1] : base[0];
    var ph = landscape ? base[0] : base[1];
    var m = Math.min(opts.margin, Math.min(pw, ph) / 4);
    var scale = Math.min((pw - 2 * m) / w, (ph - 2 * m) / h);
    var dw = w * scale;
    var dh = h * scale;
    doc.addPage([pw, ph]).drawImage(img, { x: (pw - dw) / 2, y: (ph - dh) / 2, width: dw, height: dh });
  }

  /* ---------- file list ---------- */
  function addFiles(fileList) {
    var incoming = Array.prototype.slice.call(fileList || []);
    if (!incoming.length) return;
    var added = [];
    var skipped = 0;
    incoming.forEach(function (f) {
      if (!isImage(f) || files.length + added.length >= MAX_FILES) { skipped++; return; }
      added.push({ id: nextId++, file: f, name: f.name, size: f.size, w: 0, h: 0, error: '', url: URL.createObjectURL(f) });
    });
    files = files.concat(added);
    touch();
    if (skipped && added.length) status(added.length + ' added. Skipped ' + skipped + ' (images only, up to ' + MAX_FILES + ' at a time).', 'error');
    else if (skipped) status('Only image files are accepted, up to ' + MAX_FILES + ' at a time.', 'error');
    else status(added.length + (added.length === 1 ? ' image added.' : ' images added.'), 'ok');
    added.forEach(inspect);
    if (added.length) ensureLib().catch(function () {});
  }
  function inspect(item) {
    var probe = new Image();
    probe.onload = function () { item.w = probe.naturalWidth; item.h = probe.naturalHeight; render(); };
    probe.onerror = function () { item.error = 'Unsupported or damaged image'; render(); };
    probe.src = item.url;
  }
  function touch() { lastOut = null; render(); }
  function move(i, delta) {
    var j = i + delta;
    if (j < 0 || j >= files.length) return;
    var t = files[i];
    files[i] = files[j];
    files[j] = t;
    touch();
  }
  function removeAt(i) {
    URL.revokeObjectURL(files[i].url);
    files.splice(i, 1);
    status('');
    touch();
  }
  function iconBtn(label, title, disabled, fn, extra) {
    var b = el('button', extra || '', label);
    b.type = 'button';
    b.title = title;
    b.setAttribute('aria-label', title);
    b.disabled = !!disabled;
    b.addEventListener('click', function (e) { e.stopPropagation(); fn(); });
    return b;
  }
  function attachDnd(li, index) {
    li.addEventListener('dragstart', function (e) {
      dragIndex = index;
      li.classList.add('dragging');
      if (e.dataTransfer) {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', String(index));
      }
    });
    li.addEventListener('dragend', function () {
      dragIndex = null;
      li.classList.remove('dragging');
      Array.prototype.forEach.call(list.children, function (c) { c.classList.remove('drop-target'); });
    });
    li.addEventListener('dragover', function (e) {
      if (dragIndex === null) return;
      e.preventDefault();
      li.classList.add('drop-target');
    });
    li.addEventListener('dragleave', function () { li.classList.remove('drop-target'); });
    li.addEventListener('drop', function (e) {
      if (dragIndex === null) return;
      e.preventDefault();
      var from = dragIndex;
      dragIndex = null;
      if (from !== index) {
        var moved = files.splice(from, 1)[0];
        files.splice(index, 0, moved);
        touch();
      }
    });
  }
  function render() {
    list.innerHTML = '';
    files.forEach(function (item, i) {
      var li = el('li', 'pdf-item' + (item.error ? ' has-error' : ''));
      li.draggable = true;
      var thumb = document.createElement('img');
      thumb.className = 'pdf-thumb';
      thumb.alt = '';
      thumb.draggable = false;
      thumb.src = item.url;
      var info = el('div', 'pdf-info');
      var name = el('span', 'pdf-name', item.name);
      name.title = item.name;
      var metaText = item.error
        ? item.error
        : fmtBytes(item.size) + (item.w ? ' · ' + item.w + ' × ' + item.h + ' px' : ' · reading…');
      info.appendChild(name);
      info.appendChild(el('span', 'pdf-meta', metaText));
      var btns = el('div', 'pdf-btns');
      btns.appendChild(iconBtn('↑', 'Move up', i === 0, function () { move(i, -1); }));
      btns.appendChild(iconBtn('↓', 'Move down', i === files.length - 1, function () { move(i, 1); }));
      btns.appendChild(iconBtn('✕', 'Remove', false, function () { removeAt(i); }, 'pdf-del'));
      li.appendChild(el('span', 'pdf-num', String(i + 1)));
      li.appendChild(thumb);
      li.appendChild(info);
      li.appendChild(btns);
      attachDnd(li, i);
      list.appendChild(li);
    });
    empty.style.display = files.length ? 'none' : '';
    updateSummary();
  }
  function updateSummary() {
    var size = 0;
    files.forEach(function (f) { size += f.size; });
    var entries = [
      ['Images', String(files.length)],
      ['Total size', fmtBytes(size)]
    ];
    if (lastOut !== null) entries.push(['PDF size', fmtBytes(lastOut)]);
    setStats('summary', entries);
  }

  /* ---------- create & download ---------- */
  function setBusy(flag) {
    busy = flag;
    var btn = root.querySelector('[data-action="create"]');
    if (!btn) return;
    if (flag) { btn.setAttribute('data-label', btn.textContent); btn.textContent = 'Creating…'; }
    else if (btn.getAttribute('data-label')) { btn.textContent = btn.getAttribute('data-label'); }
    btn.disabled = flag;
  }
  function download(bytes, name) {
    var blob = new Blob([bytes], { type: 'application/pdf' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 5000);
  }
  function createPdf() {
    if (busy) return;
    if (!files.length) { status('Add at least one image first.', 'error'); return; }
    var bad = files.filter(function (f) { return f.error; })[0];
    if (bad) { status('"' + bad.name + '" can\'t be added (' + bad.error.toLowerCase() + '). Remove it and try again.', 'error'); return; }
    var opts = options();
    setBusy(true);
    status('Loading the PDF engine…');
    ensureLib().then(function (lib) {
      return lib.PDFDocument.create().then(function (doc) {
        var chain = Promise.resolve();
        files.forEach(function (item, idx) {
          chain = chain.then(function () {
            status('Adding image ' + (idx + 1) + ' of ' + files.length + '…');
            return embedImage(doc, item).then(function (img) {
              addPage(doc, img, opts);
            }, function () {
              throw new Error('"' + item.name + '" could not be converted. Try saving it as a JPG or PNG first.');
            });
          });
        });
        return chain.then(function () {
          doc.setProducer('ToolNova Images to PDF');
          return doc.save();
        });
      });
    }).then(function (bytes) {
      var name = outputName();
      download(bytes, name);
      lastOut = bytes.length;
      render();
      status('Done — ' + files.length + (files.length === 1 ? ' page' : ' pages') + ' saved as ' + name + '.', 'ok');
    }).catch(function (err) {
      status(err && err.message ? err.message : 'Something went wrong while creating the PDF. Please try again.', 'error');
    }).then(function () {
      setBusy(false);
    });
  }

  onAction('create', createPdf);
  onAction('sort', function () {
    files.sort(function (a, b) { return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }); });
    touch();
    if (files.length) status('Sorted A–Z by file name.', 'ok');
  });
  onAction('clear', function () {
    files.forEach(function (f) { URL.revokeObjectURL(f.url); });
    files = [];
    status('');
    touch();
  });
  render();
})();
