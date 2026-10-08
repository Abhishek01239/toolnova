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
  function fmt(n) { return String(Math.round(n * 100) / 100); }
  function run() {
    var distance = Number(control('distance').value);
    var consumption = Number(control('consumption').value);
    var price = Number(control('price').value);
    if (![distance, consumption, price].every(function (n) { return isFinite(n) && n >= 0; })) {
      status('Enter non-negative numbers.', 'err');
      return;
    }
    var fuel = distance / 100 * consumption;
    var cost = fuel * price;
    setOutput('output', 'Fuel used: ' + fmt(fuel) + '\nEstimated cost: ' + fmt(cost));
    setStats('summary', [
      ['Fuel used', fmt(fuel)],
      ['Estimated cost', fmt(cost)],
      ['Per distance unit', distance ? fmt(cost / distance) : 'n/a']
    ]);
    status('Estimate ready.', 'ok');
  }
  onAction('run', run);
})();
