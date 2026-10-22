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

  function calculate() {
    var p = parseFloat(control('principal').value) || 0;
    var annualRate = parseFloat(control('rate').value) || 0;
    var years = parseFloat(control('years').value) || 0;
    if (p <= 0 || years <= 0) {
      status('Enter a positive loan amount and term.', 'error');
      setStats('result', []);
      return;
    }
    var monthlyRate = annualRate / 100 / 12;
    var n = years * 12;
    var monthly;
    if (monthlyRate === 0) {
      monthly = p / n;
    } else {
      monthly = p * monthlyRate * Math.pow(1 + monthlyRate, n) / (Math.pow(1 + monthlyRate, n) - 1);
    }
    var total = monthly * n;
    var interest = total - p;
    setStats('result', [
      ['Monthly payment', '$' + monthly.toFixed(2)],
      ['Total paid', '$' + total.toFixed(2)],
      ['Total interest', '$' + interest.toFixed(2)],
      ['Number of payments', n.toString()]
    ]);
    status('Calculated successfully.', 'ok');
  }

  onAction('calculate', calculate);
  control('principal').addEventListener('input', calculate);
  control('rate').addEventListener('input', calculate);
  control('years').addEventListener('input', calculate);
  calculate();
})();
