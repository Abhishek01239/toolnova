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

  function sortLines() {
    var text = control('text').value;
    var mode = control('mode').value;
    var removeEmpty = control('remove-empty').checked;
    var lines = text.split('\n');
    if (removeEmpty) {
      lines = lines.filter(function (l) { return l.trim().length > 0; });
    }
    if (mode === 'alpha') {
      lines.sort(function (a, b) { return a.toLowerCase().localeCompare(b.toLowerCase()); });
    } else if (mode === 'alpha-rev') {
      lines.sort(function (a, b) { return b.toLowerCase().localeCompare(a.toLowerCase()); });
    } else if (mode === 'length') {
      lines.sort(function (a, b) { return a.length - b.length || a.localeCompare(b); });
    } else if (mode === 'length-rev') {
      lines.sort(function (a, b) { return b.length - a.length || a.localeCompare(b); });
    } else if (mode === 'random') {
      for (var i = lines.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var tmp = lines[i];
        lines[i] = lines[j];
        lines[j] = tmp;
      }
    }
    var result = lines.join('\n');
    setOutput('result', result);
    status(lines.length + ' lines sorted.', 'ok');
  }

  onAction('sort', sortLines);
  onAction('copy', function () {
    var result = outputEl('result').value;
    if (result && navigator.clipboard) {
      navigator.clipboard.writeText(result).then(function () {
        status('Copied to clipboard.', 'ok');
      }).catch(function () {
        status('Could not copy.', 'err');
      });
    } else {
      status('Nothing to copy.', 'warn');
    }
  });
  onAction('clear', function () {
    control('text').value = '';
    setOutput('result', '');
    status('');
    control('text').focus();
  });

  control('text').addEventListener('input', sortLines);
  sortLines();
})();
