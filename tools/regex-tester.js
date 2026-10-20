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

  function test() {
    var pat = control('pattern').value;
    var flags = control('flags').value || '';
    var text = control('text').value;
    if (!pat) { status('Enter a pattern.', 'err'); setOutput('result', ''); return; }
    try {
      var re = new RegExp(pat, flags);
      var matches = [];
      var m;
      var idx = 0;
      if (flags.indexOf('g') === -1) {
        m = re.exec(text);
        if (m) matches.push(formatMatch(m, 1));
      } else {
        while ((m = re.exec(text)) !== null && idx < 100) {
          matches.push(formatMatch(m, idx + 1));
          idx++;
          if (m.index === re.lastIndex) re.lastIndex++;
        }
      }
      setOutput('result', matches.length ? matches.join('\n\n') : 'No matches.');
      status(matches.length + ' match' + (matches.length === 1 ? '' : 'es') + ' found.', 'ok');
    } catch (e) {
      status('Invalid regex: ' + e.message, 'err');
      setOutput('result', '');
    }
  }
  function formatMatch(m, n) {
    var lines = ['Match ' + n + ': ' + m[0]];
    for (var i = 1; i < m.length; i++) {
      if (m[i] !== undefined) lines.push('  Group ' + i + ': ' + m[i]);
    }
    if (m.groups) {
      for (var k in m.groups) lines.push('  ' + k + ': ' + m.groups[k]);
    }
    return lines.join('\n');
  }

  onAction('test', test);
  test();
})();
