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

  onAction('run', function () {
    var text = control('input').value || '';
    var prefix = control('prefix').value || '';
    var suffix = control('suffix').value || '';
    var lines = text.split(/\r?\n/);
    var result = lines.map(function (line) {
      return prefix + line + suffix;
    }).join('\n');
    setOutput('output', result);
    status('Applied prefix and suffix to ' + lines.length + ' lines.', 'ok');
  });

  onAction('clear', function () {
    control('input').value = '';
    setOutput('output', '');
    status('');
  });
})();
