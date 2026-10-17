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
    var val = control('birthdate').value;
    if (!val) {
      setOutput('age', '');
      setStats('details', []);
      return;
    }
    var birth = new Date(val);
    var today = new Date();
    if (isNaN(birth.getTime()) || birth > today) {
      setOutput('age', 'Invalid or future date');
      setStats('details', []);
      return;
    }
    var years = today.getFullYear() - birth.getFullYear();
    var months = today.getMonth() - birth.getMonth();
    var days = today.getDate() - birth.getDate();
    if (days < 0) {
      months--;
      var prevMonth = new Date(today.getFullYear(), today.getMonth(), 0);
      days += prevMonth.getDate();
    }
    if (months < 0) {
      years--;
      months += 12;
    }
    var ageStr = years + ' years, ' + months + ' months, ' + days + ' days';
    setOutput('age', ageStr);

    var totalDays = Math.floor((today - birth) / (1000 * 60 * 60 * 24));
    var nextBday = new Date(today.getFullYear(), birth.getMonth(), birth.getDate());
    if (nextBday < today) nextBday.setFullYear(today.getFullYear() + 1);
    var daysToBday = Math.ceil((nextBday - today) / (1000 * 60 * 60 * 24));

    setStats('details', [
      ['Years', years],
      ['Months', months],
      ['Days', days],
      ['Total days lived', totalDays],
      ['Days until next birthday', daysToBday]
    ]);
  }

  var el = control('birthdate');
  if (el) el.addEventListener('change', calculate);
  calculate();
})();
