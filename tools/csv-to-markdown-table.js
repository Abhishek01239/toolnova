(function () {
  'use strict';
  var root = document.getElementById('tool-app');
  if (!root) return;
  function control(id) { return root.querySelector('[data-control="' + id + '"]'); }
  function outputEl(id) { return root.querySelector('[data-output="' + id + '"]'); }
  function setOutput(id, value) {
    var el = outputEl(id);
    if (!el) return;
    if ('value' in el) { el.value = value; } else { el.textContent = value; }
  }
  function onAction(id, fn) {
    var btn = root.querySelector('[data-action="' + id + '"]');
    if (btn) btn.addEventListener('click', function () { fn(btn); });
  }
  function status(msg, kind) {
    var el = root.querySelector('[data-status]');
    if (!el) return;
    el.textContent = msg || '';
    el.className = 'status' + (kind ? ' ' + kind : '');
  }
  function setStats(id, entries) {
    var el = outputEl(id);
    if (!el) return;
    el.innerHTML = '';
    entries.forEach(function (pair) {
      var wrap = document.createElement('div');
      wrap.className = 'stat';
      var dt = document.createElement('dt');
      dt.textContent = pair[0];
      var dd = document.createElement('dd');
      dd.textContent = pair[1];
      wrap.appendChild(dt);
      wrap.appendChild(dd);
      el.appendChild(wrap);
    });
  }

  function parseCsv(text, delim) {
    var rows = [];
    var row = [];
    var field = '';
    var inQuotes = false;
    var i = 0;
    while (i < text.length) {
      var ch = text[i];
      if (inQuotes) {
        if (ch === '"') {
          if (text[i + 1] === '"') { field += '"'; i += 2; continue; }
          inQuotes = false; i++; continue;
        }
        field += ch; i++; continue;
      }
      if (ch === '"') { inQuotes = true; i++; continue; }
      if (ch === delim) { row.push(field); field = ''; i++; continue; }
      if (ch === '\n' || ch === '\r') {
        if (ch === '\r' && text[i + 1] === '\n') i++;
        row.push(field); field = '';
        if (row.length > 1 || row[0] !== '') rows.push(row);
        row = []; i++; continue;
      }
      field += ch; i++;
    }
    row.push(field);
    if (row.length > 1 || row[0] !== '') rows.push(row);
    return rows;
  }
  function escCell(s) {
    return String(s).replace(/\|/g, '\\|').replace(/\r?\n/g, ' ');
  }
  function convert() {
    var delim = control('delimiter').value === '\\t' ? '\t' : control('delimiter').value;
    var rows = parseCsv(control('input').value.replace(/^\uFEFF/, ''), delim);
    if (!rows.length) { status('Paste at least one row.', 'err'); setOutput('result', ''); return; }
    var width = rows.reduce(function (m, r) { return Math.max(m, r.length); }, 0);
    rows = rows.map(function (r) {
      var copy = r.slice();
      while (copy.length < width) copy.push('');
      return copy.map(escCell);
    });
    var header = control('header').checked ? rows[0] : rows[0].map(function (_, i) { return 'Column ' + (i + 1); });
    var body = control('header').checked ? rows.slice(1) : rows;
    var sep = header.map(function () { return '---'; });
    var lines = ['| ' + header.join(' | ') + ' |', '| ' + sep.join(' | ') + ' |'].concat(body.map(function (r) {
      return '| ' + r.join(' | ') + ' |';
    }));
    setOutput('result', lines.join('\n'));
    status('Built a table with ' + body.length + ' data row' + (body.length === 1 ? '' : 's') + '.', 'ok');
  }
  onAction('convert', convert);
  convert();

})();
