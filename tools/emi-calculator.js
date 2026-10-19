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
    var P = parseFloat(control('principal').value) || 0;
    var annualRate = parseFloat(control('rate').value) || 0;
    var n = parseInt(control('tenure').value, 10) || 0;
    if (P <= 0 || n <= 0) {
      setOutput('emi', '');
      setStats('details', []);
      return;
    }
    var r = annualRate / 12 / 100;
    var emi;
    if (r === 0) {
      emi = P / n;
    } else {
      emi = P * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1);
    }
    var total = emi * n;
    var interest = total - P;
    setOutput('emi', emi.toFixed(2));
    setStats('details', [
      ['Monthly EMI', emi.toFixed(2)],
      ['Total interest', interest.toFixed(2)],
      ['Total amount payable', total.toFixed(2)],
      ['Tenure', n + ' months']
    ]);
  }

  ['principal', 'rate', 'tenure'].forEach(function (id) {
    var el = control(id);
    if (el) el.addEventListener('input', calculate);
  });
  calculate();
})();
