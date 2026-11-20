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

  function calculate() {
    var P = parseFloat(control('amount').value) || 0;
    var annualRate = parseFloat(control('rate').value) || 0;
    var years = parseFloat(control('years').value) || 0;
    if (P <= 0 || years <= 0) {
      setOutput('payment', 'Enter valid positive values');
      setStats('summary', []);
      return;
    }
    var r = annualRate / 100 / 12;
    var n = years * 12;
    var payment;
    if (r === 0) {
      payment = P / n;
    } else {
      payment = P * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    }
    var totalPaid = payment * n;
    var totalInterest = totalPaid - P;

    setOutput('payment', payment.toFixed(2));
    setStats('summary', [
      ['Monthly payment', payment.toFixed(2)],
      ['Total payments', totalPaid.toFixed(2)],
      ['Total interest', totalInterest.toFixed(2)],
      ['Number of payments', n],
      ['Interest as % of principal', ((totalInterest / P) * 100).toFixed(1) + '%']
    ]);
  }

  var btn = root.querySelector('[data-action="calculate"]');
  if (btn) btn.addEventListener('click', calculate);
  calculate();
})();
