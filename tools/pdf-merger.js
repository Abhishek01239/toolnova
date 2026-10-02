(function () {
  'use strict';
  var root = document.getElementById('tool-app');
  if (!root) return;

  var LIB_URLS = [
    'https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/dist/pdf-lib.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/pdf-lib/1.17.1/pdf-lib.min.js'
  ];
  var MAX_FILES = 50;
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
  function isPdf(f) {
    return f.type === 'application/pdf' || f.name.toLowerCase().slice(-4) === '.pdf';
  }
  function friendlyError(err) {
    var m = err && err.message ? err.message : '';
    return /encrypt/i.test(m) ? 'Password-protected PDF' : 'Damaged or unreadable PDF';
  }
  function outputName() {
    var node = control('filename');
    var v = ((node && node.value) || '').replace(/[\\/:*?"<>|]+/g, '').trim();
    if (!v) v = 'merged';
    if (v.toLowerCase().slice(-4) !== '.pdf') v += '.pdf';
    return v;
  }

  /* ---------- styles (self-contained, uses the site's theme variables) ---------- */
  if (!document.getElementById('pdf-merger-styles')) {
    var st = document.createElement('style');
    st.id = 'pdf-merger-styles';
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

  /* ---------- build the upload area inside the configuration pane ---------- */
  var pane = root.querySelector('.tool-pane');
  var zone = el('div', 'pdf-zone');
  var drop = el('div', 'pdf-drop');
  drop.setAttribute('role', 'button');
  drop.setAttribute('tabindex', '0');
  drop.setAttribute('aria-label', 'Add PDF files');
  drop.appendChild(el('span', 'pdf-drop-icon', '📄'));
  drop.appendChild(el('strong', '', 'Drop PDF files here'));
  drop.appendChild(el('span', 'pdf-hint', 'or click to browse · your files stay on this device'));
  var input = document.createElement('input');
  input.type = 'file';
  input.accept = 'application/pdf,.pdf';
  input.multiple = true;
  input.hidden = true;
  var list = el('ol', 'pdf-list');
  var empty = el('p', 'pdf-empty', 'No files yet — add at least two PDFs to merge them.');
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

  /* ---------- file list ---------- */
  function addFiles(fileList) {
    var incoming = Array.prototype.slice.call(fileList || []);
    if (!incoming.length) return;
    var added = [];
    var skipped = 0;
    incoming.forEach(function (f) {
      if (!isPdf(f) || files.length + added.length >= MAX_FILES) { skipped++; return; }
      added.push({ id: nextId++, file: f, name: f.name, size: f.size, pages: null, error: '' });
    });
    files = files.concat(added);
    touch();
    if (skipped && added.length) status(added.length + ' added. Skipped ' + skipped + ' (PDF files only, up to ' + MAX_FILES + ' at a time).', 'error');
    else if (skipped) status('Only PDF files are accepted, up to ' + MAX_FILES + ' at a time.', 'error');
    else status(added.length + (added.length === 1 ? ' file added.' : ' files added.'), 'ok');
    added.forEach(inspect);
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
      var info = el('div', 'pdf-info');
      var name = el('span', 'pdf-name', item.name);
      name.title = item.name;
      var metaText = item.error
        ? item.error
        : fmtBytes(item.size) + (item.pages !== null ? ' · ' + item.pages + (item.pages === 1 ? ' page' : ' pages') : ' · reading…');
      info.appendChild(name);
      info.appendChild(el('span', 'pdf-meta', metaText));
      var btns = el('div', 'pdf-btns');
      btns.appendChild(iconBtn('↑', 'Move up', i === 0, function () { move(i, -1); }));
      btns.appendChild(iconBtn('↓', 'Move down', i === files.length - 1, function () { move(i, 1); }));
      btns.appendChild(iconBtn('✕', 'Remove', false, function () { removeAt(i); }, 'pdf-del'));
      li.appendChild(el('span', 'pdf-num', String(i + 1)));
      li.appendChild(info);
      li.appendChild(btns);
      attachDnd(li, i);
      list.appendChild(li);
    });
    empty.style.display = files.length ? 'none' : '';
    updateSummary();
  }
  function updateSummary() {
    var pages = 0;
    var size = 0;
    var reading = false;
    files.forEach(function (f) {
      size += f.size;
      if (f.pages !== null) pages += f.pages;
      else if (!f.error) reading = true;
    });
    var entries = [
      ['Files', String(files.length)],
      ['Total pages', pages + (reading ? '…' : '')],
      ['Input size', fmtBytes(size)]
    ];
    if (lastOut !== null) entries.push(['Merged size', fmtBytes(lastOut)]);
    setStats('summary', entries);
  }

  /* ---------- merge & download ---------- */
  function setBusy(flag) {
    busy = flag;
    var btn = root.querySelector('[data-action="merge"]');
    if (!btn) return;
    if (flag) { btn.setAttribute('data-label', btn.textContent); btn.textContent = 'Merging…'; }
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
  function mergeAll() {
    if (busy) return;
    if (files.length < 2) { status('Add at least two PDF files to merge.', 'error'); return; }
    var bad = files.filter(function (f) { return f.error; })[0];
    if (bad) { status('"' + bad.name + '" can\'t be merged (' + bad.error.toLowerCase() + '). Remove it and try again.', 'error'); return; }
    setBusy(true);
    status('Loading the PDF engine…');
    var total = 0;
    ensureLib().then(function (lib) {
      return lib.PDFDocument.create().then(function (out) {
        var chain = Promise.resolve();
        files.forEach(function (item, idx) {
          chain = chain.then(function () {
            status('Merging ' + (idx + 1) + ' of ' + files.length + ': ' + item.name + '…');
            return item.file.arrayBuffer().then(function (buf) {
              return lib.PDFDocument.load(buf).catch(function (e) {
                throw new Error('"' + item.name + '" could not be read (' + friendlyError(e).toLowerCase() + ').');
              });
            }).then(function (src) {
              return out.copyPages(src, src.getPageIndices());
            }).then(function (pages) {
              pages.forEach(function (p) { out.addPage(p); });
              total += pages.length;
            });
          });
        });
        return chain.then(function () {
          out.setProducer('ToolNova PDF Merger');
          return out.save();
        });
      });
    }).then(function (bytes) {
      var name = outputName();
      download(bytes, name);
      lastOut = bytes.length;
      render();
      status('Done — ' + total + ' pages merged into ' + name + '.', 'ok');
    }).catch(function (err) {
      status(err && err.message ? err.message : 'Something went wrong while merging. Please try again.', 'error');
    }).then(function () {
      setBusy(false);
    });
  }

  onAction('merge', mergeAll);
  onAction('sort', function () {
    files.sort(function (a, b) { return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }); });
    touch();
    if (files.length) status('Sorted A–Z by file name.', 'ok');
  });
  onAction('clear', function () {
    files = [];
    status('');
    touch();
  });
  render();
})();
