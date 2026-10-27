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

  function calculate() {
    var amount = parseFloat(control('amount').value);
    var rate = parseFloat(control('rate').value);
    var mode = control('mode').value;
    if (isNaN(amount) || isNaN(rate) || rate < 0) {
      setOutput('result', 'Enter valid amount and rate');
      setStats('details', []);
      return;
    }
    var r = rate / 100;
    var tax, net, total;
    if (mode === 'add') {
      tax = amount * r;
      net = amount;
      total = amount + tax;
    } else {
      total = amount;
      net = total / (1 + r);
      tax = total - net;
    }
    setOutput('result', total.toFixed(2));
    setStats('details', [
      ['Net / Pre-tax', net.toFixed(2)],
      ['Tax amount', tax.toFixed(2)],
      ['Total', total.toFixed(2)],
      ['Rate', rate.toFixed(2) + '%']
    ]);
  }

  onAction('calculate', calculate);
  ['amount', 'rate', 'mode'].forEach(function (id) {
    var el = control(id);
    if (el) el.addEventListener('input', calculate);
  });
  calculate();
})();
