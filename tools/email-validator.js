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
  function setStats(id, entries) {
    var el = root.querySelector('[data-output="' + id + '"]');
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

  var EMAIL_RE = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

  function run() {
    var text = control('input').value.trim();
    if (!text) {
      status('Paste some email addresses.', 'error');
      setOutput('output', '');
      setStats('summary', []);
      return;
    }
    var lines = text.split(/\r?\n/).map(function(l) { return l.trim(); }).filter(Boolean);
    var results = [];
    var valid = 0;
    lines.forEach(function(email) {
      var ok = EMAIL_RE.test(email);
      if (ok) valid++;
      results.push(email + ' — ' + (ok ? 'Valid' : 'Invalid'));
    });
    setOutput('output', results.join('\n'));
    setStats('summary', [
      ['Total', lines.length.toString()],
      ['Valid', valid.toString()],
      ['Invalid', (lines.length - valid).toString()]
    ]);
    status('✓ Checked ' + lines.length + ' address' + (lines.length === 1 ? '' : 'es') + '.', 'ok');
  }

  onAction('validate', run);
  onAction('clear', function() {
    control('input').value = '';
    setOutput('output', '');
    setStats('summary', []);
    status('');
  });
})();
