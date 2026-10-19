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
    var s = control('start').value;
    var e = control('end').value;
    if (!s || !e) {
      setOutput('days', '');
      setStats('details', []);
      return;
    }
    var start = new Date(s);
    var end = new Date(e);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      setOutput('days', 'Invalid dates');
      setStats('details', []);
      return;
    }
    var ms = end - start;
    var days = Math.round(ms / (1000 * 60 * 60 * 24));
    var weeks = Math.floor(Math.abs(days) / 7);
    var rem = Math.abs(days) % 7;
    setOutput('days', days.toString());
    setStats('details', [
      ['Total days', days],
      ['Full weeks', weeks],
      ['Remaining days', rem],
      ['Direction', days >= 0 ? 'Forward' : 'Backward']
    ]);
  }

  ['start', 'end'].forEach(function (id) {
    var el = control(id);
    if (el) el.addEventListener('change', calculate);
  });
  calculate();
})();
