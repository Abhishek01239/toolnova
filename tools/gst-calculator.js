(function () {
  'use strict';
  var root = document.getElementById('tool-app');
  if (!root) return;
  function control(id) { return root.querySelector('[data-control="' + id + '"]'); }
  function setOutput(id, value) {
    var el = root.querySelector('[data-output="' + id + '"]');
    if (!el) return;
    if (el.tagName === 'TEXTAREA' || el.tagName === 'INPUT') el.value = value;
    else el.textContent = value;
  }
  function setStats(id, rows) {
    var el = root.querySelector('[data-output="' + id + '"]');
    if (!el) return;
    el.innerHTML = '';
    rows.forEach(function (row) {
      var div = document.createElement('div');
      div.className = 'stat';
      var lab = document.createElement('span');
      lab.className = 'stat-label';
      lab.textContent = row.label;
      var val = document.createElement('span');
      val.className = 'stat-value';
      val.textContent = row.value;
      div.appendChild(lab);
      div.appendChild(val);
      el.appendChild(div);
    });
  }
  function status(msg) {
    var el = root.querySelector('[data-status]');
    if (el) el.textContent = msg;
  }
  function onAction(id, fn) {
    var btn = root.querySelector('[data-action="' + id + '"]');
    if (btn) btn.addEventListener('click', fn);
  }
  var calcGST = function calcGST(amount, rate, inclusive) {
  var a = parseFloat(amount);
  var r = parseFloat(rate);
  if (isNaN(a) || isNaN(r) || a < 0 || r < 0) return null;
  var net, tax, gross;
  if (inclusive) {
    gross = a;
    net = a / (1 + r / 100);
    tax = gross - net;
  } else {
    net = a;
    tax = a * (r / 100);
    gross = net + tax;
  }
  return { net: net, tax: tax, gross: gross, rate: r, inclusive: inclusive };
};

  onAction('calc', function () {
    var inclusive = control('mode').value === 'inclusive';
    var r = calcGST(control('amount').value, control('rate').value, inclusive);
    if (!r) { status('Enter a valid non-negative amount and rate.'); return; }
    setStats('summary', [
      { label: 'Net', value: r.net.toFixed(2) },
      { label: 'Tax', value: r.tax.toFixed(2) },
      { label: 'Gross', value: r.gross.toFixed(2) }
    ]);
    status('Calculated.');
  });
})();