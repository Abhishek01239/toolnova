(function () {
  'use strict';
  var root = document.getElementById('tool-app');
  if (!root) return;
  function control(id) { return root.querySelector('[data-control="' + id + '"]'); }
  function outputEl(id) { return root.querySelector('[data-output="' + id + '"]'); }
  function setOutput(id, value) {
    var el = outputEl(id);
    if (!el) return;
    if ('value' in el) el.value = value; else el.textContent = value;
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

  function money(n) {
    return (Math.round(n * 100) / 100).toFixed(2);
  }
  function calc() {
    var amount = parseFloat(control('amount').value);
    var hours = parseFloat(control('hours').value);
    var weeks = parseFloat(control('weeks').value);
    if (!isFinite(amount) || amount < 0) { status('Enter a non-negative amount.', 'err'); return; }
    if (!isFinite(hours) || hours <= 0 || hours > 168) { status('Hours per week must be between 0.5 and 168.', 'err'); return; }
    if (!isFinite(weeks) || weeks < 1 || weeks > 52) { status('Weeks per year must be between 1 and 52.', 'err'); return; }
    var annual = control('mode').value === 'annual' ? amount : amount * hours * weeks;
    var hourly = annual / (hours * weeks);
    var weekly = hourly * hours;
    var monthly = annual / 12;
    setOutput('result', [
      'Hourly: ' + money(hourly),
      'Weekly: ' + money(weekly),
      'Monthly: ' + money(monthly),
      'Annual: ' + money(annual),
      'Schedule: ' + hours + ' h/week × ' + weeks + ' weeks'
    ].join('\n'));
    setStats('summary', [
      ['Hourly', money(hourly)],
      ['Monthly', money(monthly)],
      ['Annual', money(annual)]
    ]);
    status('Gross pay only — taxes are not included.', 'ok');
  }
  onAction('calc', calc);
  calc();
})();
