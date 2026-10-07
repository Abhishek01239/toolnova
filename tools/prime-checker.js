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

  function factorize(n) {
    var factors = [];
    function take(p) {
      var c = 0;
      while (n % p === 0) { n = Math.floor(n / p); c++; }
      if (c) factors.push([p, c]);
    }
    take(2); take(3);
    var p = 5;
    while (p * p <= n) {
      take(p);
      take(p + 2);
      p += 6;
    }
    if (n > 1) factors.push([n, 1]);
    return factors;
  }
  function run() {
    var raw = (control('number').value || '').trim();
    if (!/^\d{1,15}$/.test(raw)) { status('Enter a positive integer with at most 15 digits.', 'err'); return; }
    var n = Number(raw);
    if (n === 0 || n === 1) {
      setOutput('result', n + ' is neither prime nor composite.');
      setStats('summary', [['Value', String(n)], ['Prime', 'No'], ['Factors', '—']]);
      status('Checked.', 'ok');
      return;
    }
    var factors = factorize(n);
    var text = factors.map(function (f) { return f[1] === 1 ? String(f[0]) : f[0] + '^' + f[1]; }).join(' × ');
    var prime = factors.length === 1 && factors[0][1] === 1;
    setOutput('result', (prime ? n + ' is prime.' : n + ' is composite.') + '\n' + text);
    setStats('summary', [
      ['Value', String(n)],
      ['Prime', prime ? 'Yes' : 'No'],
      ['Distinct primes', String(factors.length)]
    ]);
    status(prime ? 'Prime.' : 'Composite.', 'ok');
  }
  onAction('run', run);

})();
