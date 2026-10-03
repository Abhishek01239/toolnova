(function () {
  'use strict';
  var root = document.getElementById('tool-app');
  if (!root) return;

  var LIB_URLS = [
    'https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/dist/pdf-lib.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/pdf-lib/1.17.1/pdf-lib.min.js'
  ];
  var current = null;
  var busy = false;
  var lastOut = null;
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
  function pad(n, w) {
    var s = String(n);
    while (s.length < w) s = '0' + s;
    return s;
  }
  function isPdf(f) {
    return f.type === 'application/pdf' || f.name.toLowerCase().slice(-4) === '.pdf';
  }
  function friendlyError(err) {
    var m = err && err.message ? err.message : '';
    return /encrypt/i.test(m) ? 'Password-protected PDF' : 'Damaged or unreadable PDF';
  }
  function baseName() {
    var node = control('filename');
    var v = ((node && node.value) || '').replace(/[\\/:*?"<>|]+/g, '').trim();
    if (v.toLowerCase().slice(-4) === '.pdf') v = v.slice(0, -4);
    return v || 'split';
  }

  /* ---------- styles (self-contained, uses the site's theme variables) ---------- */
  if (!document.getElementById('split-pdf-styles')) {
    var st = document.createElement('style');
    st.id = 'split-pdf-styles';
    st.textContent = [
      '.pdf-drop{display:flex;flex-direction:column;align-items:center;gap:6px;padding:34px 20px;text-align:center;border:2px dashed var(--accent-ring);border-radius:16px;background:var(--accent-soft);cursor:pointer;color:var(--text);transition:border-color .25s ease,background .25s ease,transform .25s ease,box-shadow .25s ease}',
      '.pdf-drop:hover,.pdf-drop:focus-visible,.pdf-drop.is-over{border-color:var(--accent);transform:translateY(-2px);box-shadow:0 0 36px -10px var(--accent-ring);outline:none}',
      '.pdf-drop.is-over{background:var(--accent-ring)}',
      '.pdf-drop-icon{font-size:2rem;line-height:1;animation:tn-float 3.5s ease-in-out infinite}',
      '.pdf-drop strong{font-size:1.05rem}',
      '.pdf-drop span.pdf-hint{color:var(--muted);font-size:.86rem}',
      '.pdf-file{margin-top:14px}',
      '.pdf-item{display:flex;align-items:center;gap:12px;padding:10px 12px;background:var(--surface-2);border:1px solid var(--border);border-radius:12px}',
      '.pdf-item.has-error{border-color:var(--err)}',
      '.pdf-badge{flex:none;width:34px;height:34px;display:grid;place-items:center;border-radius:8px;background:var(--accent-soft);font-size:1.1rem}',
      '.pdf-info{flex:1;min-width:0}',
      '.pdf-name{display:block;font-weight:600;font-size:.92rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
      '.pdf-meta{display:block;color:var(--muted);font-size:.78rem}',
      '.pdf-item.has-error .pdf-meta{color:var(--err)}',
      '.pdf-btns{display:flex;gap:4px;flex:none}',
      '.pdf-btns button{width:30px;height:30px;border:1px solid var(--border);border-radius:8px;background:var(--surface);color:var(--muted);line-height:1;transition:color .15s ease,border-color .15s ease,background .15s ease}',
      '.pdf-btns button.pdf-del:hover{color:var(--err);border-color:var(--err);background:var(--err-soft)}',
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
  drop.setAttribute('aria-label', 'Choose a PDF file');
  drop.appendChild(el('span', 'pdf-drop-icon', '📄'));
  drop.appendChild(el('strong', '', 'Drop a PDF here'));
  drop.appendChild(el('span', 'pdf-hint', 'or click to browse · your file stays on this device'));
  var input = document.createElement('input');
  input.type = 'file';
  input.accept = 'application/pdf,.pdf';
  input.hidden = true;
  var card = el('div', 'pdf-file');
  var empty = el('p', 'pdf-empty', 'No file yet — add the PDF you want to split.');
  zone.appendChild(drop);
  zone.appendChild(input);
  zone.appendChild(card);
  zone.appendChild(empty);
  var header = pane.querySelector('.pane-header');
  if (header && header.nextSibling) pane.insertBefore(zone, header.nextSibling);
  else pane.appendChild(zone);

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

  /* the Pages box is not needed when every page becomes its own file */
  var modeSel = control('mode');
  function syncMode() {
    var field = root.querySelector('[data-field="pages"]');
    if (field && modeSel) field.style.display = modeSel.value === 'each' ? 'none' : '';
  }
  if (modeSel) modeSel.addEventListener('change', syncMode);
  syncMode();

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

  /* ---------- minimal ZIP writer (store method, no compression) ---------- */
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

  /* ---------- page ranges ---------- */
  function parseRanges(text, total) {
    var tokens = text.split(',').map(function (t) { return t.trim(); }).filter(Boolean);
    if (!tokens.length) throw new Error('Enter the pages you want, for example 1-3, 5, 8-10.');
    return tokens.map(function (tok) {
      var m = /^(\d+)\s*(?:-\s*(\d*))?$/.exec(tok);
      if (!m) throw new Error('"' + tok + '" is not a valid page or range. Use numbers like 5 or 3-7.');
      var from = parseInt(m[1], 10);
      var to = m[2] === undefined ? from : (m[2] === '' ? total : parseInt(m[2], 10));
      if (from < 1 || to < 1 || from > total || to > total) throw new Error('"' + tok + '" is outside this document, which has ' + total + (total === 1 ? ' page.' : ' pages.'));
      if (from > to) throw new Error('"' + tok + '": the first page must come before the last page.');
      var idx = [];
      for (var p = from; p <= to; p++) idx.push(p - 1);
      return { label: from === to ? String(from) : from + '-' + to, indices: idx };
    });
  }
  function plan(mode, total) {
    var base = baseName();
    if (mode === 'each') {
      var width = String(total).length;
      var jobs = [];
      for (var i = 0; i < total; i++) jobs.push({ name: base + '-page-' + pad(i + 1, width) + '.pdf', indices: [i] });
      return jobs;
    }
    var node = control('pages');
    var ranges = parseRanges(node ? node.value : '', total);
    if (mode === 'extract') {
      var all = [];
      ranges.forEach(function (r) { all = all.concat(r.indices); });
      return [{ name: base + '.pdf', indices: all }];
    }
    var width2 = String(ranges.length).length;
    return ranges.map(function (r, n) {
      return { name: base + '-part' + pad(n + 1, width2) + '-pages-' + r.label + '.pdf', indices: r.indices };
    });
  }

  /* ---------- the loaded file ---------- */
  function setFile(fileList) {
    var f = fileList && fileList[0];
    if (!f) return;
    if (!isPdf(f)) { status('Please choose a PDF file.', 'error'); return; }
    current = { file: f, name: f.name, size: f.size, pages: null, error: '', src: null };
    lastOut = null;
    status('');
    render();
    inspect(current);
  }
  function inspect(item) {
    ensureLib().then(function (lib) {
      return item.file.arrayBuffer().then(function (buf) {
        return lib.PDFDocument.load(buf);
      }).then(function (doc) {
        item.src = doc;
        item.pages = doc.getPageCount();
        render();
      }, function (err) {
        item.error = friendlyError(err);
        render();
      });
    }).catch(function (err) {
      if (err && err.engine) status(err.message, 'error');
    });
  }
  function clearFile() {
    current = null;
    lastOut = null;
    status('');
    render();
  }
  function render() {
    card.innerHTML = '';
    if (current) {
      var row = el('div', 'pdf-item' + (current.error ? ' has-error' : ''));
      var info = el('div', 'pdf-info');
      var name = el('span', 'pdf-name', current.name);
      name.title = current.name;
      var metaText = current.error
        ? current.error
        : fmtBytes(current.size) + (current.pages !== null ? ' · ' + current.pages + (current.pages === 1 ? ' page' : ' pages') : ' · reading…');
      info.appendChild(name);
      info.appendChild(el('span', 'pdf-meta', metaText));
      var btns = el('div', 'pdf-btns');
      var del = el('button', 'pdf-del', '✕');
      del.type = 'button';
      del.title = 'Remove file';
      del.setAttribute('aria-label', 'Remove file');
      del.addEventListener('click', clearFile);
      btns.appendChild(del);
      row.appendChild(el('span', 'pdf-badge', '📄'));
      row.appendChild(info);
      row.appendChild(btns);
      card.appendChild(row);
    }
    empty.style.display = current ? 'none' : '';
    updateSummary();
  }
  function updateSummary() {
    var entries = [
      ['Pages', current && current.pages !== null ? String(current.pages) : '—'],
      ['Input size', current ? fmtBytes(current.size) : '—']
    ];
    if (lastOut) {
      entries.push(['Files created', String(lastOut.count)]);
      entries.push(['Output size', fmtBytes(lastOut.size)]);
    }
    setStats('summary', entries);
  }

  /* ---------- split & download ---------- */
  function setBusy(flag) {
    busy = flag;
    var btn = root.querySelector('[data-action="split"]');
    if (!btn) return;
    if (flag) { btn.setAttribute('data-label', btn.textContent); btn.textContent = 'Splitting…'; }
    else if (btn.getAttribute('data-label')) { btn.textContent = btn.getAttribute('data-label'); }
    btn.disabled = flag;
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
  function getSource(lib, item) {
    if (item.src) return Promise.resolve(item.src);
    return item.file.arrayBuffer().then(function (buf) {
      return lib.PDFDocument.load(buf).catch(function (e) {
        throw new Error('"' + item.name + '" could not be read (' + friendlyError(e).toLowerCase() + ').');
      });
    });
  }
  function splitPdf() {
    if (busy) return;
    if (!current) { status('Add a PDF file first.', 'error'); return; }
    if (current.error) { status('"' + current.name + '" can\'t be split (' + current.error.toLowerCase() + '). Choose another file.', 'error'); return; }
    var mode = modeSel ? modeSel.value : 'extract';
    setBusy(true);
    status('Loading the PDF engine…');
    ensureLib().then(function (lib) {
      return getSource(lib, current).then(function (src) {
        var jobs = plan(mode, src.getPageCount());
        var outputs = [];
        var chain = Promise.resolve();
        jobs.forEach(function (job, n) {
          chain = chain.then(function () {
            status('Creating file ' + (n + 1) + ' of ' + jobs.length + '…');
            return lib.PDFDocument.create().then(function (out) {
              return out.copyPages(src, job.indices).then(function (pages) {
                pages.forEach(function (p) { out.addPage(p); });
                out.setProducer('ToolNova Split PDF');
                return out.save();
              });
            }).then(function (bytes) {
              outputs.push({ name: job.name, data: bytes });
            });
          });
        });
        return chain.then(function () { return outputs; });
      });
    }).then(function (outputs) {
      var total = 0;
      outputs.forEach(function (o) { total += o.data.length; });
      var doneName;
      if (outputs.length === 1) {
        doneName = outputs[0].name;
        download(new Blob([outputs[0].data], { type: 'application/pdf' }), doneName);
        lastOut = { count: 1, size: total };
      } else {
        var zip = makeZip(outputs);
        doneName = baseName() + '.zip';
        download(zip, doneName);
        lastOut = { count: outputs.length, size: zip.size };
      }
      render();
      status('Done — saved ' + doneName + (outputs.length > 1 ? ' with ' + outputs.length + ' PDFs.' : '.'), 'ok');
    }).catch(function (err) {
      status(err && err.message ? err.message : 'Something went wrong while splitting. Please try again.', 'error');
    }).then(function () {
      setBusy(false);
    });
  }

  onAction('split', splitPdf);
  onAction('clear', clearFile);
  render();
})();
