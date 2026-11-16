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
    el.className = 'status' + (kind ? ' ' + kind : '');
  }

  onAction('run', function () {
    var text = control('input').value || '';
    var doSort = control('sort') && control('sort').checked;
    var lines = text.split(/\r?\n/);
    var seen = new Set();
    var unique = [];
    for (var i = 0; i < lines.length; i++) {
      var line = lines[i];
      if (!seen.has(line)) {
        seen.add(line);
        unique.push(line);
      }
    }
    if (doSort) unique.sort(function (a, b) { return a.localeCompare(b); });
    setOutput('output', unique.join('\n'));
    status('Found ' + unique.length + ' unique lines out of ' + lines.length + '.', 'ok');
  });

  onAction('clear', function () {
    control('input').value = '';
    setOutput('output', '');
    status('');
  });
})();
