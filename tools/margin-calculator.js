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
  var calcMargin = function calcMargin(cost, price, mode) {
  var c = parseFloat(cost);
  var p = parseFloat(price);
  if (isNaN(c) || isNaN(p) || c < 0 || p < 0) return null;
  if (mode === 'from-cost-price') {
    if (p === 0) return null;
    var margin = ((p - c) / p) * 100;
    var markup = c === 0 ? null : ((p - c) / c) * 100;
    return { cost: c, price: p, margin: margin, markup: markup };
  }
  return null;
};

  onAction('calc', function () {
    var r = calcMargin(control('cost').value, control('price').value, 'from-cost-price');
    if (!r) { status('Enter valid non-negative cost and price.'); return; }
    setStats('summary', [
      { label: 'Cost', value: r.cost.toFixed(2) },
      { label: 'Price', value: r.price.toFixed(2) },
      { label: 'Margin %', value: r.margin.toFixed(2) + '%' },
      { label: 'Markup %', value: (r.markup === null ? 'N/A' : r.markup.toFixed(2) + '%') }
    ]);
    status('Calculated.');
  });
})();