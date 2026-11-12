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
    if (btn) btn.addEventListener('click', function () { fn(); });
  }
  function status(msg, kind) {
    var el = root.querySelector('[data-status]');
    if (!el) return;
    el.textContent = msg || '';
    el.className = 'status' + (kind ? ' ' + kind : '');
  }

  function process(action) {
    var raw = control('input').value.trim();
    if (!raw) {
      setOutput('output', '');
      status('Enter some JSON first.', 'error');
      return;
    }
    try {
      var parsed = JSON.parse(raw);
      if (action === 'validate') {
        setOutput('output', 'Valid JSON');
        status('JSON is valid.', 'ok');
        return;
      }
      var space = action === 'minify' ? 0 : 2;
      var result = JSON.stringify(parsed, null, space);
      setOutput('output', result);
      status(action === 'minify' ? 'Minified.' : 'Formatted.', 'ok');
    } catch (err) {
      setOutput('output', '');
      status('Invalid JSON: ' + (err.message || 'parse error'), 'error');
    }
  }

  onAction('format', function () { process('format'); });
  onAction('minify', function () { process('minify'); });
  onAction('validate', function () { process('validate'); });
})();
