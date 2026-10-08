(function () {
  'use strict';
  var root = document.getElementById('tool-app');
  if (!root) return;
  function control(id) { return root.querySelector('[data-control="' + id + '"]'); }
  function outputEl(id) { return root.querySelector('[data-output="' + id + '"]'); }
  function setOutput(id, value) {
    var el = outputEl(id);
    if (!el) return;
    if ('value' in el) el.value = value; else el.textContent = value;
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
  function run() {
    var pw = control('password').value || '';
    if (!pw) { status('Enter a password to score.', 'err'); return; }
    var classes = [
      [/ [a-z]/.source ? /[a-z]/ : /[a-z]/, 26, 'lowercase'],
      [/[A-Z]/, 26, 'uppercase'],
      [/[0-9]/, 10, 'digits'],
      [/[^A-Za-z0-9]/, 33, 'symbols']
    ];
    var pool = 0;
    var missing = [];
    classes.forEach(function (row) {
      if (row[0].test(pw)) pool += row[1]; else missing.push(row[2]);
    });
    if (!pool) pool = 32;
    var entropy = Math.round(pw.length * Math.log2(pool));
    var band = entropy < 40 ? 'Weak' : entropy < 60 ? 'Fair' : entropy < 80 ? 'Good' : 'Strong';
    setOutput('output', band + ' heuristic score. Estimated entropy ' + entropy + ' bits from length ' + pw.length + ' and pool ' + pool + '.' + (missing.length ? ' Missing: ' + missing.join(', ') + '.' : ' All tracked classes are present.'));
    setStats('summary', [
      ['Band', band],
      ['Length', String(pw.length)],
      ['Estimated bits', String(entropy)],
      ['Missing', missing.length ? missing.join(', ') : 'none']
    ]);
    status('Scored locally.', 'ok');
  }
  onAction('run', run);
})();
