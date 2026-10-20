(function () {
  'use strict';
  var root = document.getElementById('tool-app');
  if (!root) return;
  function control(id) { return root.querySelector('[data-control="' + id + '"]'); }
  function setOutput(id, value) {
    var el = root.querySelector('[data-output="' + id + '"]');
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
        if (row.some(function(f) { return f !== ''; })) rows.push(row);
        row = []; i++; continue;
      }
      field += ch; i++;
    }
    row.push(field);
    if (row.some(function(f) { return f !== ''; })) rows.push(row);
    return rows;
  }

  function convert() {
    var delim = control('delimiter').value === '\\t' ? '\t' : control('delimiter').value;
    var text = control('input').value.replace(/^\uFEFF/, '');
    var rows = parseCsv(text, delim);
    if (!rows.length) { status('No data found.', 'err'); setOutput('result', ''); return; }
    var hasHeader = control('header').checked;
    var headers = hasHeader ? rows[0] : null;
    var dataRows = hasHeader ? rows.slice(1) : rows;
    var result;
    if (hasHeader) {
      result = dataRows.map(function(row) {
        var obj = {};
        headers.forEach(function(h, i) { obj[h || ('col' + (i+1))] = row[i] || ''; });
        return obj;
      });
    } else {
      result = dataRows;
    }
    setOutput('result', JSON.stringify(result, null, 2));
    status('Converted ' + dataRows.length + ' row' + (dataRows.length === 1 ? '' : 's') + '.', 'ok');
  }

  onAction('convert', convert);
  convert();
})();
