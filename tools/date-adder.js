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

  var weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  function calculate() {
    var dateVal = control('startdate') && control('startdate').value;
    var days = parseInt((control('days') && control('days').value) || '0', 10);
    if (!dateVal || isNaN(days)) {
      setOutput('result', 'Please enter a valid date and number of days.');
      setStats('details', []);
      return;
    }
    var d = new Date(dateVal + 'T00:00:00');
    if (isNaN(d.getTime())) {
      setOutput('result', 'Invalid date.');
      setStats('details', []);
      return;
    }
    d.setDate(d.getDate() + days);
    var resultStr = d.toISOString().slice(0, 10);
    setOutput('result', resultStr);
    setStats('details', [
      ['Resulting date', resultStr],
      ['Weekday', weekdays[d.getDay()]],
      ['Days added', days]
    ]);
  }

  onAction('calculate', calculate);
  // Also recalculate on input change for convenience
  ['startdate', 'days'].forEach(function (id) {
    var el = control(id);
    if (el) {
      el.addEventListener('change', calculate);
      el.addEventListener('input', calculate);
    }
  });
})();
