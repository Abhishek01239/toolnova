(function () {
  'use strict';
  var root = document.getElementById('tool-app');
  if (!root) return;

  var MAX_FILES = 30;
  var GROUPS = {
    pixels: ['width', 'height', 'keepratio'],
    percent: ['percent'],
    preset: ['preset', 'fit']
  };
  var files = [];
  var nextId = 1;
  var runId = 0;
  var timer = null;

  /* ---------- tiny helpers ---------- */
  function control(id) { return root.querySelector('[data-control="' + id + '"]'); }
  function outputEl(id) { return root.querySelector('[data-output="' + id + '"]'); }
  function val(id, fallback) {
    var n = control(id);
    return n ? String(n.value) : fallback;
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
    if (n < 1073741824) return (n / 1048576).toFixed(1) + ' MB';
    return (n / 1073741824).toFixed(2) + ' GB';
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
  function extFor(type) {
    var map = { 'image/jpeg': '.jpg', 'image/webp': '.webp', 'image/png': '.png' };
    return map[type] || '.png';
  }
  function outName(item) {
    return item.name.replace(/\.[^.]+$/, '') + '-' + item.outW + 'x' + item.outH + extFor(item.outType);
  }
  function uniqueName(name, used) {
    if (!used[name]) { used[name] = 1; return name; }
    var dot = name.lastIndexOf('.');
    var base = dot > 0 ? name.slice(0, dot) : name;
    var ext = dot > 0 ? name.slice(dot) : '';
    var n = 2;
    while (used[base + ' (' + n + ')' + ext]) n++;
    var out = base + ' (' + n + ')' + ext;
    used[out] = 1;
    return out;
  }
  function opts() {
    var keep = control('keepratio');
    return {
      mode: val('mode', 'pixels'),
      width: parseInt(val('width', ''), 10) || 0,
      height: parseInt(val('height', ''), 10) || 0,
      keep: keep ? keep.checked : true,
      percent: parseFloat(val('percent', '50')) || 0,
      preset: val('preset', '1080x1080'),
      fit: val('fit', 'cover'),
      format: val('format', 'keep'),
      quality: (parseFloat(val('quality', '90')) || 90) / 100
    };
  }
  function optionError(o) {
    if (o.mode === 'pixels' && !o.width && !o.height) return 'Enter a width, a height, or both.';
    if (o.mode === 'percent' && (o.percent < 1 || o.percent > 1000)) return 'Enter a percentage between 1 and 1000.';
    return '';
  }
  function pickMime(item, o) {
    if (o.format === 'jpeg') return 'image/jpeg';
    if (o.format === 'png') return 'image/png';
    if (o.format === 'webp') return 'image/webp';
    var t = item.file.type === 'image/jpg' ? 'image/jpeg' : item.file.type;
    return (t === 'image/jpeg' || t === 'image/png' || t === 'image/webp') ? t : 'image/png';
  }

  /* ---------- styles (self-contained, uses the site's theme variables) ---------- */
  if (!document.getElementById('image-resizer-styles')) {
    var st = document.createElement('style');
    st.id = 'image-resizer-styles';
    st.textContent = [
      '.fz-drop{display:flex;flex-direction:column;align-items:center;gap:6px;padding:34px 20px;text-align:center;border:2px dashed var(--accent-ring);border-radius:16px;background:var(--accent-soft);cursor:pointer;color:var(--text);transition:border-color .25s ease,background .25s ease,transform .25s ease,box-shadow .25s ease}',
      '.fz-drop:hover,.fz-drop:focus-visible,.fz-drop.is-over{border-color:var(--accent);transform:translateY(-2px);box-shadow:0 0 36px -10px var(--accent-ring);outline:none}',
      '.fz-drop.is-over{background:var(--accent-ring)}',
      '.fz-drop-icon{font-size:2rem;line-height:1;animation:tn-float 3.5s ease-in-out infinite}',
      '.fz-drop strong{font-size:1.05rem}',
      '.fz-drop span.fz-hint{color:var(--muted);font-size:.86rem}',
      '.fz-list{list-style:none;margin:14px 0 0;padding:0;display:flex;flex-direction:column;gap:8px}',
      '.fz-item{display:flex;align-items:center;gap:12px;padding:10px 12px;background:var(--surface-2);border:1px solid var(--border);border-radius:12px;transition:border-color .2s ease}',
      '.fz-item:hover{border-color:var(--accent-ring)}',
      '.fz-item.has-error{border-color:var(--err)}',
      '.fz-thumb{flex:none;width:46px;height:46px;border-radius:8px;object-fit:cover;border:1px solid var(--border);background:var(--surface)}',
      '.fz-info{flex:1;min-width:0}',
      '.fz-name{display:block;font-weight:600;font-size:.92rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
      '.fz-meta{display:block;color:var(--muted);font-size:.78rem}',
      '.fz-meta b{color:var(--accent);font-weight:700}',
      '.fz-item.has-error .fz-meta{color:var(--err)}',
      '.fz-btns{display:flex;gap:4px;flex:none}',
      '.fz-btns button{width:30px;height:30px;border:1px solid var(--border);border-radius:8px;background:var(--surface);color:var(--muted);line-height:1;transition:color .15s ease,border-color .15s ease,background .15s ease}',
      '.fz-btns button:hover:not(:disabled){color:var(--accent);border-color:var(--accent-ring);background:var(--accent-soft)}',
      '.fz-btns button.fz-del:hover:not(:disabled){color:var(--err);border-color:var(--err);background:var(--err-soft)}',
      '.fz-btns button:disabled{opacity:.35;cursor:default}',
      '.fz-empty{color:var(--muted);font-size:.88rem;text-align:center;margin:12px 0 0}'
    ].join('\n');
    document.head.appendChild(st);
  }

  /* ---------- upload area inside the input pane ---------- */
  var pane = root.querySelector('.tool-pane');
  var zone = el('div', 'fz-zone');
  var drop = el('div', 'fz-drop');
  drop.setAttribute('role', 'button');
  drop.setAttribute('tabindex', '0');
  drop.setAttribute('aria-label', 'Add images');
  drop.appendChild(el('span', 'fz-drop-icon', '🖼️'));
  drop.appendChild(el('strong', '', 'Drop images here'));
  drop.appendChild(el('span', 'fz-hint', 'JPG, PNG, WebP · up to 30 at once · your files stay on this device'));
  var input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/jpeg,image/png,image/webp,image/bmp,image/avif';
  input.multiple = true;
  input.hidden = true;
  var list = el('ul', 'fz-list');
  var empty = el('p', 'fz-empty', 'No images yet — add some to resize them.');
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

  /* ---------- show only the fields for the chosen mode ---------- */
  function syncGroups() {
    var mode = val('mode', 'pixels');
    Object.keys(GROUPS).forEach(function (g) {
      GROUPS[g].forEach(function (id) {
        var f = root.querySelector('[data-field="' + id + '"]');
        if (f) f.style.display = g === mode ? '' : 'none';
      });
    });
  }
  function onSettingsChange(e) {
    var id = e.target && e.target.getAttribute ? e.target.getAttribute('data-control') : null;
    if (!id) return;
    if (id === 'mode') syncGroups();
    if (id === 'quality') {
      var rv = root.querySelector('[data-range-value="quality"]');
      if (rv) rv.textContent = e.target.value;
    }
    schedule(300);
  }
  root.addEventListener('input', onSettingsChange);
  root.addEventListener('change', onSettingsChange);

  /* ---------- minimal ZIP writer (store method) ---------- */
  var crcTable = (function () {
    var table = [];
    for (var n = 0; n < 256; n++) {
      var c = n;
      for (var k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
      table[n] = c >>> 0;
    }
    return table;
  })();
  function crc32(buf) {
    var c = 0xFFFFFFFF;
    for (var i = 0; i < buf.length; i++) c = crcTable[(c ^ buf[i]) & 0xFF] ^ (c >>> 8);
    return (c ^ 0xFFFFFFFF) >>> 0;
  }
  function makeZip(entries) {
    var enc = new TextEncoder();
    var parts = [];
    var central = [];
    var offset = 0;
    var d = new Date();
    var dosTime = (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1);
    var dosDate = ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate();
    entries.forEach(function (e) {
      var nameBytes = enc.encode(e.name);
      var crc = crc32(e.data);
      var size = e.data.length;
      var lh = new DataView(new ArrayBuffer(30));
      lh.setUint32(0, 0x04034b50, true);
      lh.setUint16(4, 20, true);
      lh.setUint16(6, 0x0800, true);
      lh.setUint16(8, 0, true);
      lh.setUint16(10, dosTime, true);
      lh.setUint16(12, dosDate, true);
      lh.setUint32(14, crc, true);
      lh.setUint32(18, size, true);
      lh.setUint32(22, size, true);
      lh.setUint16(26, nameBytes.length, true);
      lh.setUint16(28, 0, true);
      parts.push(new Uint8Array(lh.buffer), nameBytes, e.data);
      var ch = new DataView(new ArrayBuffer(46));
      ch.setUint32(0, 0x02014b50, true);
      ch.setUint16(4, 20, true);
      ch.setUint16(6, 20, true);
      ch.setUint16(8, 0x0800, true);
      ch.setUint16(10, 0, true);
      ch.setUint16(12, dosTime, true);
      ch.setUint16(14, dosDate, true);
      ch.setUint32(16, crc, true);
      ch.setUint32(20, size, true);
      ch.setUint32(24, size, true);
      ch.setUint16(28, nameBytes.length, true);
      ch.setUint16(30, 0, true);
      ch.setUint16(32, 0, true);
      ch.setUint16(34, 0, true);
      ch.setUint16(36, 0, true);
      ch.setUint32(38, 0, true);
      ch.setUint32(42, offset, true);
      central.push(new Uint8Array(ch.buffer), nameBytes);
      offset += 30 + nameBytes.length + size;
    });
    var cdSize = 0;
    central.forEach(function (p) { cdSize += p.length; });
    var end = new DataView(new ArrayBuffer(22));
    end.setUint32(0, 0x06054b50, true);
    end.setUint16(4, 0, true);
    end.setUint16(6, 0, true);
    end.setUint16(8, entries.length, true);
    end.setUint16(10, entries.length, true);
    end.setUint32(12, cdSize, true);
    end.setUint32(16, offset, true);
    end.setUint16(20, 0, true);
    return new Blob(parts.concat(central, [new Uint8Array(end.buffer)]), { type: 'application/zip' });
  }
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

  /* ---------- resizing ---------- */
  function loadImg(item) {
    return new Promise(function (resolve, reject) {
      var im = new Image();
      im.onload = function () { item.img = im; item.w = im.naturalWidth; item.h = im.naturalHeight; resolve(); };
      im.onerror = function () { item.error = 'Unsupported or damaged image'; reject(new Error(item.error)); };
      im.src = item.url;
    });
  }
  function plan(item, o) {
    var nw = item.img.naturalWidth;
    var nh = item.img.naturalHeight;
    var cw;
    var ch;
    var dx = 0;
    var dy = 0;
    var dw;
    var dh;
    if (o.mode === 'percent') {
      cw = Math.round(nw * o.percent / 100);
      ch = Math.round(nh * o.percent / 100);
      dw = cw;
      dh = ch;
    } else if (o.mode === 'preset') {
      var p = o.preset.split('x');
      cw = parseInt(p[0], 10);
      ch = parseInt(p[1], 10);
      if (o.fit === 'stretch') {
        dw = cw;
        dh = ch;
      } else {
        var s = o.fit === 'cover' ? Math.max(cw / nw, ch / nh) : Math.min(cw / nw, ch / nh);
        dw = Math.round(nw * s);
        dh = Math.round(nh * s);
        dx = Math.round((cw - dw) / 2);
        dy = Math.round((ch - dh) / 2);
      }
    } else {
      if (o.width && o.height) {
        if (o.keep) {
          var sc = Math.min(o.width / nw, o.height / nh);
          cw = Math.round(nw * sc);
          ch = Math.round(nh * sc);
        } else {
          cw = o.width;
          ch = o.height;
        }
      } else if (o.width) {
        cw = o.width;
        ch = Math.round(nh * o.width / nw);
      } else {
        ch = o.height;
        cw = Math.round(nw * o.height / nh);
      }
      dw = cw;
      dh = ch;
    }
    cw = Math.max(1, cw);
    ch = Math.max(1, ch);
    if (cw > 16384 || ch > 16384 || cw * ch > 120000000) throw new Error('That size is too large for your browser.');
    return { cw: cw, ch: ch, dx: dx, dy: dy, dw: dw, dh: dh };
  }
  function resizeOne(item, o) {
    return new Promise(function (resolve, reject) {
      var p;
      try { p = plan(item, o); } catch (e) { reject(e); return; }
      var mime = pickMime(item, o);
      var c = document.createElement('canvas');
      c.width = p.cw;
      c.height = p.ch;
      var ctx = c.getContext('2d');
      if (!ctx) { reject(new Error('Canvas is not available in this browser')); return; }
      if (mime === 'image/jpeg' || (o.mode === 'preset' && o.fit === 'contain')) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, p.cw, p.ch);
      }
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(item.img, p.dx, p.dy, p.dw, p.dh);
      c.toBlob(function (blob) {
        if (!blob) { reject(new Error('This image is too large for your browser to resize')); return; }
        item.out = blob;
        item.outType = blob.type;
        item.outSize = blob.size;
        item.outW = p.cw;
        item.outH = p.ch;
        item.fallback = blob.type !== mime;
        resolve();
      }, mime, o.quality);
    });
  }
  function schedule(delay) {
    if (timer) clearTimeout(timer);
    timer = setTimeout(run, delay);
  }
  function run() {
    var myRun = ++runId;
    var o = opts();
    var problem = optionError(o);
    if (problem) {
      files.forEach(function (f) { f.out = null; });
      render();
      if (files.length) status(problem, 'error');
      return;
    }
    var chain = Promise.resolve();
    files.slice().forEach(function (item) {
      chain = chain.then(function () {
        if (myRun !== runId || item.error) return;
        item.state = 'working';
        render();
        return (item.img ? Promise.resolve() : loadImg(item)).then(function () {
          if (myRun !== runId) return;
          return resizeOne(item, o).then(function () {
            item.state = 'done';
            render();
          });
        }).catch(function (e) {
          if (!item.error) item.error = (e && e.message) ? e.message : 'Could not resize this image';
          item.out = null;
          item.state = 'error';
          render();
        });
      });
    });
    chain.then(function () {
      if (myRun !== runId) return;
      var fb = files.some(function (f) { return f.fallback; });
      if (fb) status('Your browser cannot create files in that format, so some images were saved as PNG.', 'error');
      else if (files.length) status('');
    });
  }

  /* ---------- file list ---------- */
  function addFiles(fileList) {
    var incoming = Array.prototype.slice.call(fileList || []);
    if (!incoming.length) return;
    var added = 0;
    var skipped = 0;
    incoming.forEach(function (f) {
      if (!isImage(f) || files.length >= MAX_FILES) { skipped++; return; }
      files.push({ id: nextId++, file: f, name: f.name, size: f.size, url: URL.createObjectURL(f), img: null, w: 0, h: 0, out: null, outType: '', outSize: 0, outW: 0, outH: 0, fallback: false, error: '', state: 'new' });
      added++;
    });
    render();
    if (skipped && added) status(added + ' added. Skipped ' + skipped + ' (matching JPG, PNG, WebP, BMP or AVIF files up to 20 MB each, maximum ' + MAX_FILES + ' files).', 'error');
    else if (skipped) status('Choose matching JPG, PNG, WebP, BMP or AVIF images up to 20 MB each (maximum ' + MAX_FILES + ' files).', 'error');
    else status('');
    if (added) schedule(0);
  }
  function removeAt(i) {
    URL.revokeObjectURL(files[i].url);
    files.splice(i, 1);
    status('');
    render();
  }
  function render() {
    list.innerHTML = '';
    files.forEach(function (item, i) {
      var li = el('li', 'fz-item' + (item.error ? ' has-error' : ''));
      var thumb = document.createElement('img');
      thumb.className = 'fz-thumb';
      thumb.alt = '';
      thumb.src = item.url;
      var info = el('div', 'fz-info');
      var name = el('span', 'fz-name', item.name);
      name.title = item.name;
      var meta = el('span', 'fz-meta');
      if (item.error) {
        meta.textContent = item.error;
      } else if (item.out) {
        meta.appendChild(document.createTextNode(item.w + ' \u00d7 ' + item.h + ' \u2192 '));
        meta.appendChild(el('b', '', item.outW + ' \u00d7 ' + item.outH + ' px'));
        meta.appendChild(document.createTextNode(' \u00b7 ' + fmtBytes(item.size) + ' \u2192 ' + fmtBytes(item.outSize)));
      } else {
        meta.textContent = fmtBytes(item.size) + (item.state === 'working' ? ' \u00b7 resizing\u2026' : ' \u00b7 waiting\u2026');
      }
      info.appendChild(name);
      info.appendChild(meta);
      var btns = el('div', 'fz-btns');
      var dl = el('button', '', '\u2193');
      dl.type = 'button';
      dl.title = 'Download this image';
      dl.setAttribute('aria-label', 'Download ' + item.name);
      dl.disabled = !item.out;
      dl.addEventListener('click', function () { download(item.out, outName(item)); });
      var del = el('button', 'fz-del', '\u2715');
      del.type = 'button';
      del.title = 'Remove';
      del.setAttribute('aria-label', 'Remove ' + item.name);
      del.addEventListener('click', function () { removeAt(i); });
      btns.appendChild(dl);
      btns.appendChild(del);
      li.appendChild(thumb);
      li.appendChild(info);
      li.appendChild(btns);
      list.appendChild(li);
    });
    empty.style.display = files.length ? 'none' : '';
    updateSummary();
  }
  function updateSummary() {
    var orig = 0;
    var outTotal = 0;
    var done = [];
    files.forEach(function (f) {
      orig += f.size;
      if (f.out) { done.push(f); outTotal += f.outSize; }
    });
    var dims = '\u2014';
    if (done.length === 1) dims = done[0].outW + ' \u00d7 ' + done[0].outH + ' px';
    else if (done.length > 1) dims = 'Varies';
    setStats('summary', [
      ['Images', String(files.length)],
      ['Original', fmtBytes(orig)],
      ['Resized', done.length ? fmtBytes(outTotal) : '\u2014'],
      ['New size', dims]
    ]);
  }

  /* ---------- download all ---------- */
  function downloadAll() {
    var ready = files.filter(function (f) { return f.out; });
    if (!ready.length) { status('Nothing to download yet \u2014 add an image and check your size settings.', 'error'); return; }
    if (ready.length === 1) {
      download(ready[0].out, outName(ready[0]));
      status('Downloaded ' + outName(ready[0]) + '.', 'ok');
      return;
    }
    status('Preparing ZIP\u2026');
    var used = {};
    Promise.all(ready.map(function (f) {
      return f.out.arrayBuffer().then(function (buf) {
        return { name: uniqueName(outName(f), used), data: new Uint8Array(buf) };
      });
    })).then(function (entries) {
      download(makeZip(entries), 'resized-images.zip');
      status('Done \u2014 ' + entries.length + ' images saved in resized-images.zip.', 'ok');
    }).catch(function () {
      status('Could not create the ZIP. Try downloading the images one by one.', 'error');
    });
  }

  onAction('download', downloadAll);
  onAction('clear', function () {
    runId++;
    files.forEach(function (f) { URL.revokeObjectURL(f.url); });
    files = [];
    status('');
    render();
  });
  syncGroups();
  render();
})();
