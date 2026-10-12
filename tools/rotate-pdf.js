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
  var MAX_PDF_BYTES = 50 * 1024 * 1024;
  function isPdf(f) {
    if (!f || typeof f.name !== 'string' || !/\.pdf$/i.test(f.name)) return false;
    if (!Number.isFinite(f.size) || f.size <= 0 || f.size > MAX_PDF_BYTES) return false;
    return true;
  }
  function friendlyError(err) {
    var m = err && err.message ? err.message : '';
    return /encrypt/i.test(m) ? 'Password-protected PDF' : 'Damaged or unreadable PDF';
  }
  function baseName() {
    var node = control('filename');
    var v = ((node && node.value) || '').replace(/[\\/:*?"<>|]+/g, '').trim();
    if (v.toLowerCase().slice(-4) === '.pdf') v = v.slice(0, -4);
    return v || 'rotated';
  }

  /* ---------- styles (self-contained, uses the site's theme variables) ---------- */
  if (!document.getElementById('rotate-pdf-styles')) {
    var st = document.createElement('style');
    st.id = 'rotate-pdf-styles';
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
  drop.appendChild(el('span', 'pdf-drop-icon', '🔄'));
  drop.appendChild(el('strong', '', 'Drop a PDF here'));
  drop.appendChild(el('span', 'pdf-hint', 'or click to browse · your file stays on this device'));
  var input = document.createElement('input');
  input.type = 'file';
  input.accept = 'application/pdf,.pdf';
  input.hidden = true;
  var card = el('div', 'pdf-file');
  var empty = el('p', 'pdf-empty', 'No file yet — add the PDF you want to rotate.');
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

  /* the Pages box is only needed for a custom selection */
  var scopeSel = control('scope');
  function syncScope() {
    var field = root.querySelector('[data-field="pages"]');
    if (field && scopeSel) field.style.display = scopeSel.value === 'custom' ? '' : 'none';
  }
  if (scopeSel) scopeSel.addEventListener('change', syncScope);
  syncScope();

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

  /* ---------- page selection ---------- */
  function parseRanges(text, total) {
    var tokens = text.split(',').map(function (t) { return t.trim(); }).filter(Boolean);
    if (!tokens.length) throw new Error('Enter the pages you want to rotate, for example 1-3, 5, 8-10.');
    var seen = {};
    var out = [];
    tokens.forEach(function (tok) {
      var m = /^(\d+)\s*(?:-\s*(\d*))?$/.exec(tok);
      if (!m) throw new Error('"' + tok + '" is not a valid page or range. Use numbers like 5 or 3-7.');
      var from = parseInt(m[1], 10);
      var to = m[2] === undefined ? from : (m[2] === '' ? total : parseInt(m[2], 10));
      if (from < 1 || to < 1 || from > total || to > total) throw new Error('"' + tok + '" is outside this document, which has ' + total + (total === 1 ? ' page.' : ' pages.'));
      if (from > to) throw new Error('"' + tok + '": the first page must come before the last page.');
      for (var p = from; p <= to; p++) {
        if (!seen[p]) { seen[p] = true; out.push(p - 1); }
      }
    });
    return out;
  }
  function selectPages(scope, total) {
    var idx = [];
    var i;
    if (scope === 'custom') {
      var node = control('pages');
      return parseRanges(node ? node.value : '', total);
    }
    for (i = 0; i < total; i++) {
      if (scope === 'all' || (scope === 'odd' && i % 2 === 0) || (scope === 'even' && i % 2 === 1)) idx.push(i);
    }
    if (!idx.length) throw new Error('This document has no ' + scope + ' pages to rotate.');
    return idx;
  }

  /* ---------- the loaded file ---------- */
  function setFile(fileList) {
    var f = fileList && fileList[0];
    if (!f) return;
    if (!isPdf(f)) { status('Choose a non-empty .pdf file up to 50 MB.', 'error'); return; }
    current = { file: f, name: f.name, size: f.size, pages: null, error: '' };
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
      row.appendChild(el('span', 'pdf-badge', '🔄'));
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
      entries.push(['Pages rotated', String(lastOut.rotated)]);
      entries.push(['Output size', fmtBytes(lastOut.size)]);
    }
    setStats('summary', entries);
  }

  /* ---------- rotate & download ---------- */
  function setBusy(flag) {
    busy = flag;
    var btn = root.querySelector('[data-action="rotate"]');
    if (!btn) return;
    if (flag) { btn.setAttribute('data-label', btn.textContent); btn.textContent = 'Rotating…'; }
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
  function rotatePdf() {
    if (busy) return;
    if (!current) { status('Add a PDF file first.', 'error'); return; }
    if (current.error) { status('"' + current.name + '" can\'t be rotated (' + current.error.toLowerCase() + '). Choose another file.', 'error'); return; }
    var scope = scopeSel ? scopeSel.value : 'all';
    var angleSel = control('angle');
    var delta = parseInt(angleSel ? angleSel.value : '90', 10) || 90;
    setBusy(true);
    status('Loading the PDF engine…');
    var rotated = 0;
    ensureLib().then(function (lib) {
      // Load a fresh copy every time so repeated runs never stack rotations.
      return current.file.arrayBuffer().then(function (buf) {
        return lib.PDFDocument.load(buf).catch(function (e) {
          throw new Error('"' + current.name + '" could not be read (' + friendlyError(e).toLowerCase() + ').');
        });
      }).then(function (doc) {
        var pages = doc.getPages();
        var indices = selectPages(scope, pages.length);
        status('Rotating ' + indices.length + (indices.length === 1 ? ' page…' : ' pages…'));
        indices.forEach(function (i) {
          var page = pages[i];
          var next = (((page.getRotation().angle + delta) % 360) + 360) % 360;
          page.setRotation(lib.degrees(next));
        });
        rotated = indices.length;
        doc.setProducer('ToolNova Rotate PDF');
        return doc.save();
      });
    }).then(function (bytes) {
      var doneName = baseName() + '.pdf';
      download(new Blob([bytes], { type: 'application/pdf' }), doneName);
      lastOut = { rotated: rotated, size: bytes.length };
      render();
      status('Done — saved ' + doneName + ' with ' + rotated + (rotated === 1 ? ' page rotated.' : ' pages rotated.'), 'ok');
    }).catch(function (err) {
      status(err && err.message ? err.message : 'Something went wrong while rotating. Please try again.', 'error');
    }).then(function () {
      setBusy(false);
    });
  }

  onAction('rotate', rotatePdf);
  onAction('clear', clearFile);
  render();
})();
