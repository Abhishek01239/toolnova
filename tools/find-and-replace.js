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
    var find = control('find').value || '';
    var repl = control('replace').value || '';
    var useRegex = control('regex') && control('regex').checked;
    var ignoreCase = control('ignorecase') && control('ignorecase').checked;
    if (!find) {
      status('Enter a search term.', 'error');
      return;
    }
    try {
      var flags = ignoreCase ? 'gi' : 'g';
      var pattern = useRegex ? find : find.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      var re = new RegExp(pattern, flags);
      var matches = text.match(re);
      var count = matches ? matches.length : 0;
      var result = text.replace(re, repl);
      setOutput('output', result);
      status('Replaced ' + count + ' occurrence' + (count === 1 ? '' : 's') + '.', 'ok');
    } catch (e) {
      status('Invalid pattern: ' + e.message, 'error');
    }
  });

  onAction('clear', function () {
    control('input').value = '';
    control('find').value = '';
    control('replace').value = '';
    setOutput('output', '');
    status('');
  });
})();
