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
  function setStats(id, entries) {
    var el = outputEl(id);
    if (!el) return;
    el.innerHTML = '';
    entries.forEach(function (pair) {
      var wrap = document.createElement('div');
      wrap.className = 'stat';
      var dt = document.createElement('dt');
      dt.textContent = pair[0];
      var dd = document.createElement('dd');
      dd.textContent = pair[1];
      wrap.appendChild(dt);
      wrap.appendChild(dd);
      el.appendChild(wrap);
    });
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

  function dedupe() {
    var text = control('text').value;
    var caseSensitive = control('case-sensitive').checked;
    var doTrim = control('trim').checked;
    var lines = text.split('\n');
    var seen = new Set();
    var unique = [];
    for (var i = 0; i < lines.length; i++) {
      var line = lines[i];
      var key = doTrim ? line.trim() : line;
      if (!caseSensitive) key = key.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(line);
      }
    }
    setOutput('result', unique.join('\n'));
    var removed = lines.length - unique.length;
    setStats('stats', [
      ['Original lines', lines.length.toLocaleString()],
      ['Unique lines', unique.length.toLocaleString()],
      ['Duplicates removed', removed.toLocaleString()]
    ]);
    status(removed ? removed + ' duplicates removed.' : 'No duplicates found.', 'ok');
  }

  onAction('dedupe', dedupe);
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
    setStats('stats', []);
    status('');
    control('text').focus();
  });

  control('text').addEventListener('input', dedupe);
  dedupe();
})();
