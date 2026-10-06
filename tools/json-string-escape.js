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
  function run() {
    var mode = control('mode').value;
    var input = control('input').value;
    try {
      if (mode === 'escape') {
        setOutput('result', JSON.stringify(input));
        status('Escaped as a JSON string.', 'ok');
      } else {
        var parsed = JSON.parse(input);
        if (typeof parsed !== 'string') { status('Unescape needs a JSON string, not an object or number.', 'err'); return; }
        setOutput('result', parsed);
        status('Unescaped the JSON string.', 'ok');
      }
    } catch (e) {
      status('Invalid JSON string: ' + e.message, 'err');
    }
  }
  onAction('run', run);
  run();
})();
