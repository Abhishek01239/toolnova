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
  function fmt(n) {
    if (!isFinite(n)) return 'n/a';
    return String(Math.round(n * 1e8) / 1e8);
  }
  function run() {
    var a = Number(control('a').value);
    var b = Number(control('b').value);
    var c = Number(control('c').value);
    if (![a, b, c].every(function (n) { return isFinite(n); })) {
      status('Enter numeric coefficients.', 'err');
      return;
    }
    if (a === 0) { status('a must not be zero for a quadratic.', 'err'); return; }
    var d = b * b - 4 * a * c;
    var vx = -b / (2 * a);
    var vy = a * vx * vx + b * vx + c;
    var text;
    if (d > 0) {
      var s = Math.sqrt(d);
      text = 'Two real roots: ' + fmt((-b + s) / (2 * a)) + ' and ' + fmt((-b - s) / (2 * a));
    } else if (d === 0) {
      text = 'One repeated real root: ' + fmt(-b / (2 * a));
    } else {
      text = 'No real roots. Discriminant is negative.';
    }
    setOutput('output', text);
    setStats('summary', [
      ['Discriminant', fmt(d)],
      ['Vertex x', fmt(vx)],
      ['Vertex y', fmt(vy)],
      ['Opens', a > 0 ? 'Upward' : 'Downward']
    ]);
    status('Solved.', 'ok');
  }
  onAction('run', run);
})();
