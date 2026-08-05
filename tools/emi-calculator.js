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
  function readControls(defs) {
    var vals = {};
    defs.forEach(function (d) {
      var el = control(d.id);
      if (!el) { vals[d.id] = d.value; return; }
      if (d.type === 'checkbox') vals[d.id] = el.checked;
      else if (d.type === 'number' || d.type === 'range') vals[d.id] = parseFloat(el.value) || 0;
      else vals[d.id] = el.value;
    });
    return vals;
  }

  var calculateEMI = function calculateEMI(loanAmount, interestRate, tenure, tenureType) {
  var p = parseFloat(loanAmount);
  var rYear = parseFloat(interestRate);
  var nVal = parseFloat(tenure);

  if (isNaN(p) || isNaN(rYear) || isNaN(nVal) || p <= 0 || rYear < 0 || nVal <= 0) return null;

  var n = tenureType === 'years' ? nVal * 12 : nVal;
  if (n <= 0) return null;

  // Monthly interest rate
  var r = (rYear / 12) / 100;

  var emi = 0;
  if (r === 0) {
    emi = p / n;
  } else {
    emi = p * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1);
  }

  var totalPayment = emi * n;
  var totalInterest = totalPayment - p;

  return {
    emi: emi,
    totalPayment: totalPayment,
    totalInterest: totalInterest,
    principalPercent: (p / totalPayment) * 100,
    interestPercent: (totalInterest / totalPayment) * 100
  };
};

  function formatCurrency(val) {
    if (val === null || isNaN(val)) return '';
    return '$' + val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function render() {
    var amount = parseFloat(control('loan-amount').value);
    var rate = parseFloat(control('interest-rate').value);
    var tenure = parseFloat(control('loan-tenure').value);
    var tenureType = control('tenure-type').value;

    if (isNaN(amount) || amount <= 0 || isNaN(rate) || rate < 0 || isNaN(tenure) || tenure <= 0) {
      setOutput('monthly-emi', '');
      setOutput('total-interest', '');
      setOutput('total-payment', '');
      setStats('ratio-breakdown', []);
      status('Please enter valid positive values.', 'error');
      return;
    }

    var res = calculateEMI(amount, rate, tenure, tenureType);
    if (!res) {
      setOutput('monthly-emi', '');
      setOutput('total-interest', '');
      setOutput('total-payment', '');
      setStats('ratio-breakdown', []);
      status('Invalid calculation parameters.', 'error');
      return;
    }

    setOutput('monthly-emi', formatCurrency(res.emi));
    setOutput('total-interest', formatCurrency(res.totalInterest));
    setOutput('total-payment', formatCurrency(res.totalPayment));

    setStats('ratio-breakdown', [
      ['Principal component', res.principalPercent.toFixed(1) + '%'],
      ['Interest component', res.interestPercent.toFixed(1) + '%'],
      ['Total payments', (tenureType === 'years' ? (tenure * 12) : tenure) + ' months']
    ]);

    status('Loan payment details calculated.', 'ok');
  }

  [
    'loan-amount', 'interest-rate', 'loan-tenure', 'tenure-type'
  ].forEach(function (id) {
    var el = control(id);
    if (el) {
      el.addEventListener('input', render);
      el.addEventListener('change', render);
    }
  });

  render();
})();
