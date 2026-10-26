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

  function flatten(obj, prefix, out) {
    out = out || {};
    prefix = prefix || '';
    for (var key in obj) {
      if (!Object.prototype.hasOwnProperty.call(obj, key)) continue;
      var val = obj[key];
      var newKey = prefix ? prefix + '.' + key : key;
      if (val && typeof val === 'object' && !Array.isArray(val)) {
        flatten(val, newKey, out);
      } else {
        out[newKey] = Array.isArray(val) ? JSON.stringify(val) : val;
      }
    }
    return out;
  }

  function escapeCsv(value) {
    if (value == null) return '';
    var str = String(value);
    if (/[",\n\r]/.test(str)) {
      return '"' + str.replace(/"/g, '""') + '"';
    }
    return str;
  }

  function jsonToCsv(text) {
    var data = JSON.parse(text);
    if (!Array.isArray(data) || data.length === 0) {
      throw new Error('Input must be a non-empty JSON array of objects.');
    }
    var rows = data.map(function (item) { return flatten(item); });
    var headers = [];
    var seen = {};
    rows.forEach(function (row) {
      Object.keys(row).forEach(function (k) {
        if (!seen[k]) { seen[k] = true; headers.push(k); }
      });
    });
    var lines = [headers.map(escapeCsv).join(',')];
    rows.forEach(function (row) {
      lines.push(headers.map(function (h) { return escapeCsv(row[h]); }).join(','));
    });
    return lines.join('\n');
  }

  onAction('convert', function () {
    var input = control('input').value.trim();
    if (!input) {
      status('Paste some JSON first.', 'error');
      return;
    }
    try {
      var csv = jsonToCsv(input);
      setOutput('output', csv);
      status('Converted ' + csv.split('\n').length + ' lines.', 'ok');
    } catch (err) {
      setOutput('output', '');
      status('Error: ' + err.message, 'error');
    }
  });

  onAction('clear', function () {
    control('input').value = '';
    setOutput('output', '');
    status('');
    control('input').focus();
  });
})();
