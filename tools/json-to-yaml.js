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

  function toYaml(value, indent) {
    indent = indent || 0;
    var pad = '  '.repeat(indent);
    if (value === null) return 'null';
    if (typeof value === 'boolean' || typeof value === 'number') return String(value);
    if (typeof value === 'string') {
      if (value.includes('\n') || value.includes(':') || value.includes('#')) {
        return '|\n' + value.split('\n').map(function (l) { return pad + '  ' + l; }).join('\n');
      }
      return JSON.stringify(value);
    }
    if (Array.isArray(value)) {
      if (value.length === 0) return '[]';
      return value.map(function (item) {
        var s = toYaml(item, indent + 1);
        if (typeof item === 'object' && item !== null) {
          return pad + '- ' + s.trimStart();
        }
        return pad + '- ' + s;
      }).join('\n');
    }
    if (typeof value === 'object') {
      var keys = Object.keys(value);
      if (keys.length === 0) return '{}';
      return keys.map(function (k) {
        var v = value[k];
        var vs = toYaml(v, indent + 1);
        if (typeof v === 'object' && v !== null && !Array.isArray(v)) {
          return pad + k + ':\n' + vs;
        }
        return pad + k + ': ' + vs;
      }).join('\n');
    }
    return String(value);
  }

  function convert() {
    var raw = control('json').value.trim();
    if (!raw) {
      setOutput('yaml', '');
      status('Enter JSON first.', 'err');
      return;
    }
    try {
      var obj = JSON.parse(raw);
      var yaml = toYaml(obj).replace(/^\s+/, '');
      setOutput('yaml', yaml);
      status('Converted successfully.', 'ok');
    } catch (e) {
      setOutput('yaml', '');
      status('Invalid JSON: ' + e.message, 'err');
    }
  }

  onAction('convert', convert);
  onAction('copy', function () {
    var yaml = outputEl('yaml').value;
    if (!yaml) { status('Nothing to copy.', 'err'); return; }
    navigator.clipboard.writeText(yaml).then(function () {
      status('Copied to clipboard.', 'ok');
    }).catch(function () {
      status('Copy failed.', 'err');
    });
  });
  control('json').addEventListener('input', convert);
  convert();
})();
