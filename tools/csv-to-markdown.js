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

  function escapeMd(cell) {
    return String(cell).replace(/\|/g, '\\|').replace(/\n/g, ' ');
  }

  function toMarkdown(rows) {
    if (!rows.length) return '';
    var headers = rows[0];
    var lines = [];
    lines.push('| ' + headers.map(escapeMd).join(' | ') + ' |');
    lines.push('| ' + headers.map(function() { return '---'; }).join(' | ') + ' |');
    for (var i = 1; i < rows.length; i++) {
      var row = rows[i];
      while (row.length < headers.length) row.push('');
      lines.push('| ' + row.slice(0, headers.length).map(escapeMd).join(' | ') + ' |');
    }
    return lines.join('\n');
  }

  function convert() {
    var delimChar = control('delimiter').value === '\\t' ? '\t' : control('delimiter').value;
    var text = (control('input').value || '').replace(/^\uFEFF/, '').trim();
    if (!text) { status('Paste some CSV first.', 'error'); setOutput('result', ''); return; }
    var rows = parseCsv(text, delimChar);
    if (rows.length < 1) { status('No rows found.', 'error'); return; }
    var md = toMarkdown(rows);
    setOutput('result', md);
    status('Converted ' + (rows.length - 1) + ' data rows.', 'ok');
  }

  onAction('convert', convert);
  onAction('copy', function() {
    var val = control('result') ? control('result').value : '';
    if (!val) { status('Nothing to copy.', 'error'); return; }
    navigator.clipboard.writeText(val).then(function() { status('Copied to clipboard.', 'ok'); }).catch(function() { status('Copy failed.', 'error'); });
  });
  onAction('clear', function() {
    control('input').value = '';
    setOutput('result', '');
    status('');
  });
})();
