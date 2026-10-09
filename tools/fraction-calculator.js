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

  function gcd(a, b) {
    a = Math.abs(a); b = Math.abs(b);
    while (b) { var t = a % b; a = b; b = t; }
    return a || 1;
  }
  function parseFrac(raw) {
    var s = String(raw || '').trim();
    var mixed = s.match(/^(-?\d+)\s+(\d+)\s*\/\s*(\d+)$/);
    if (mixed) {
      var whole = parseInt(mixed[1], 10);
      var n = parseInt(mixed[2], 10);
      var d = parseInt(mixed[3], 10);
      if (d === 0) return null;
      var sign = whole < 0 ? -1 : 1;
      return { n: sign * (Math.abs(whole) * d + n), d: d };
    }
    var frac = s.match(/^(-?\d+)\s*\/\s*(-?\d+)$/);
    if (frac) {
      var d2 = parseInt(frac[2], 10);
      if (d2 === 0) return null;
      return { n: parseInt(frac[1], 10), d: d2 };
    }
    if (/^-?\d+$/.test(s)) return { n: parseInt(s, 10), d: 1 };
    return null;
  }
  function format(n, d) {
    var g = gcd(n, d);
    n = n / g; d = d / g;
    if (d < 0) { n = -n; d = -d; }
    var sign = n < 0 ? '-' : '';
    n = Math.abs(n);
    var whole = Math.floor(n / d);
    var rem = n % d;
    var proper = rem === 0 ? '0' : rem + '/' + d;
    var mixed = whole ? (rem ? sign + whole + ' ' + proper : sign + String(whole)) : (rem ? sign + proper : '0');
    var improper = d === 1 ? sign + String(n) : sign + n + '/' + d;
    return { mixed: mixed, improper: improper, decimal: ((n === 0 ? 0 : (sign ? -1 : 1) * n) / d) };
  }
  function calc() {
    var a = parseFrac(control('left').value);
    var b = parseFrac(control('right').value);
    if (!a || !b) { status('Use a fraction (3/4), whole number, or mixed number (1 1/2).', 'err'); return; }
    var op = control('op').value;
    var n, d;
    if (op === 'add') { n = a.n * b.d + b.n * a.d; d = a.d * b.d; }
    else if (op === 'sub') { n = a.n * b.d - b.n * a.d; d = a.d * b.d; }
    else if (op === 'mul') { n = a.n * b.n; d = a.d * b.d; }
    else {
      if (b.n === 0) { status('Cannot divide by zero.', 'err'); return; }
      n = a.n * b.d; d = a.d * b.n;
    }
    var f = format(n, d);
    setOutput('result', 'Simplified: ' + f.improper + '\nMixed: ' + f.mixed + '\nDecimal: ' + f.decimal);
    setStats('summary', [
      ['Simplified', f.improper],
      ['Mixed', f.mixed],
      ['Decimal', String(Math.round(f.decimal * 1000000) / 1000000)]
    ]);
    status('Exact rational result.', 'ok');
  }
  onAction('calc', calc);
  calc();
})();
