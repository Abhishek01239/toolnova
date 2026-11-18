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

  function process(minify) {
    var raw = control('input').value.trim();
    if (!raw) {
      setOutput('output', '');
      setStats('summary', []);
      status('Enter some JSON first.', 'error');
      return;
    }
    try {
      var parsed = JSON.parse(raw);
      var indent = control('indent').value;
      var space = indent === 'tab' ? '\t' : parseInt(indent, 10);
      var result = minify ? JSON.stringify(parsed) : JSON.stringify(parsed, null, space);
      setOutput('output', result);
      setStats('summary', [
        ['Status', 'Valid JSON'],
        ['Characters', String(result.length)],
        ['Type', Array.isArray(parsed) ? 'Array' : typeof parsed]
      ]);
      status('Formatted successfully.', 'ok');
    } catch (e) {
      setOutput('output', '');
      setStats('summary', [['Status', 'Invalid'], ['Error', e.message]]);
      status(e.message || 'Invalid JSON', 'error');
    }
  }

  onAction('format', function () { process(false); });
  onAction('minify', function () { process(true); });
  onAction('clear', function () {
    control('input').value = '';
    setOutput('output', '');
    setStats('summary', []);
    status('');
  });
})();
