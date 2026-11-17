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

  function convert() {
    var text = control('input').value || '';
    var repl = control('replace').value;
    var result = text.replace(/\r\n|\r|\n/g, repl);
    setOutput('result', result);
    status('Line breaks removed.', 'ok');
  }

  onAction('convert', convert);
  onAction('copy', function() {
    var val = control('result') ? control('result').value : '';
    if (!val) return;
    navigator.clipboard.writeText(val).then(function() { status('Copied.', 'ok'); });
  });
  onAction('clear', function() {
    control('input').value = '';
    setOutput('result', '');
    status('');
  });
})();
