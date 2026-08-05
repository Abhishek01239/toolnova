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

  var calculateSimpleInterest = function calculateSimpleInterest(principal, rate, time, timeUnit) {
  var p = parseFloat(principal);
  var r = parseFloat(rate);
  var tVal = parseFloat(time);

  if (isNaN(p) || isNaN(r) || isNaN(tVal) || p < 0 || r < 0 || tVal < 0) return null;

  var tYears = tVal;
  if (timeUnit === 'months') {
    tYears = tVal / 12;
  } else if (timeUnit === 'days') {
    tYears = tVal / 365;
  }

  var interest = (p * r * tYears) / 100;
  var total = p + interest;

  return {
    interest: interest,
    total: total,
    tYears: tYears
  };
};

  function formatCurrency(val) {
    if (val === null || isNaN(val)) return '';
    return '$' + val.toFixed(2);
  }

  function render() {
    var principal = parseFloat(control('principal-amount').value);
    var rate = parseFloat(control('rate-of-interest').value);
    var time = parseFloat(control('time-period').value);
    var timeUnit = control('time-unit').value;

    if (isNaN(principal) || principal < 0 || isNaN(rate) || rate < 0 || isNaN(time) || time < 0) {
      setOutput('interest-amount', '');
      setOutput('total-amount', '');
      setOutput('formula-step', '');
      status('Please enter valid positive values.', 'error');
      return;
    }

    var res = calculateSimpleInterest(principal, rate, time, timeUnit);
    if (!res) {
      setOutput('interest-amount', '');
      setOutput('total-amount', '');
      setOutput('formula-step', '');
      status('Invalid calculation parameters.', 'error');
      return;
    }

    setOutput('interest-amount', formatCurrency(res.interest));
    setOutput('total-amount', formatCurrency(res.total));

    var timeWalkthrough = time.toString() + ' ' + timeUnit;
    if (timeUnit !== 'years') {
      timeWalkthrough += ' (= ' + res.tYears.toFixed(4) + ' years)';
    }

    var stepText = 'Formula: Interest = (Principal * Rate * Time) / 100\n\n' +
      '1. Identify inputs:\n' +
      '   - Principal (P) = ' + formatCurrency(principal) + '\n' +
      '   - Rate (R)      = ' + rate + '% per year\n' +
      '   - Time (T)      = ' + timeWalkthrough + '\n\n' +
      '2. Calculate Interest:\n' +
      '   Interest = (' + principal + ' * ' + rate + ' * ' + res.tYears.toFixed(4) + ') / 100\n' +
      '   Interest = ' + formatCurrency(res.interest) + '\n\n' +
      '3. Calculate Total Amount (Principal + Interest):\n' +
      '   Total = ' + formatCurrency(principal) + ' + ' + formatCurrency(res.interest) + '\n' +
      '   Total = ' + formatCurrency(res.total);

    setOutput('formula-step', stepText);
    status('Simple interest calculated successfully.', 'ok');
  }

  [
    'principal-amount', 'rate-of-interest', 'time-period', 'time-unit'
  ].forEach(function (id) {
    var el = control(id);
    if (el) {
      el.addEventListener('input', render);
      el.addEventListener('change', render);
    }
  });

  render();
})();
