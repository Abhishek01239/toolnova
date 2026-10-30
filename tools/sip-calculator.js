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
    if (btn) btn.addEventListener('click', fn);
  }

  function formatMoney(n) {
    if (!isFinite(n)) return 'N/A';
    return Math.round(n).toLocaleString('en-IN');
  }

  function calculate() {
    var monthly = parseFloat((control('monthly') && control('monthly').value) || '0');
    var annualRate = parseFloat((control('rate') && control('rate').value) || '0');
    var years = parseFloat((control('years') && control('years').value) || '0');
    if (!(monthly > 0) || !(years > 0) || annualRate < 0) {
      setOutput('result', 'Please enter positive monthly amount and years.');
      setStats('details', []);
      return;
    }
    var months = years * 12;
    var monthlyRate = annualRate / 12 / 100;
    var futureValue;
    if (monthlyRate === 0) {
      futureValue = monthly * months;
    } else {
      futureValue = monthly * (Math.pow(1 + monthlyRate, months) - 1) / monthlyRate * (1 + monthlyRate);
    }
    var totalInvested = monthly * months;
    var wealthGained = futureValue - totalInvested;
    setOutput('result', formatMoney(futureValue));
    setStats('details', [
      ['Estimated future value', formatMoney(futureValue)],
      ['Total amount invested', formatMoney(totalInvested)],
      ['Wealth gained', formatMoney(wealthGained)],
      ['Number of months', months]
    ]);
  }

  onAction('calculate', calculate);
  ['monthly', 'rate', 'years'].forEach(function (id) {
    var el = control(id);
    if (el) {
      el.addEventListener('input', calculate);
      el.addEventListener('change', calculate);
    }
  });
  calculate();
})();
