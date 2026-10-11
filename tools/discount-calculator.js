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
  function readControls() {
    var out = {};
    root.querySelectorAll('[data-control]').forEach(function (el) {
      var id = el.getAttribute('data-control');
      if (el.type === 'checkbox') out[id] = el.checked;
      else out[id] = el.value;
    });
    return out;
  }
  var calcDiscount = function calcDiscount(price, disc1, disc2) {
  var p = parseFloat(price);
  var d1 = parseFloat(disc1) || 0;
  var d2 = parseFloat(disc2) || 0;
  if (isNaN(p) || p < 0 || d1 < 0 || d1 > 100 || d2 < 0 || d2 > 100) return null;
  var after1 = p * (1 - d1 / 100);
  var final = after1 * (1 - d2 / 100);
  var savings = p - final;
  return { original: p, afterFirst: after1, final: final, savings: savings, disc1: d1, disc2: d2 };
};

  onAction('calc', function () {
    var r = calcDiscount(control('price').value, control('disc1').value, control('disc2').value);
    if (!r) { status('Enter a valid price and discount percentages between 0 and 100.'); return; }
    setStats('summary', [
      { label: 'Original', value: r.original.toFixed(2) },
      { label: 'After first', value: r.afterFirst.toFixed(2) },
      { label: 'Final price', value: r.final.toFixed(2) },
      { label: 'You save', value: r.savings.toFixed(2) }
    ]);
    setOutput('details', 'Original: ' + r.original.toFixed(2) + '\nAfter ' + r.disc1 + '%: ' + r.afterFirst.toFixed(2) + '\nAfter additional ' + r.disc2 + '%: ' + r.final.toFixed(2) + '\nTotal savings: ' + r.savings.toFixed(2));
    status('Calculated.');
  });
})();