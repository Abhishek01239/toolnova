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
    var startStr = control('start').value;
    var endStr = control('end').value;
    var includeEnd = control('include-end') ? control('include-end').checked : true;
    if (!startStr || !endStr) {
      setOutput('days', '');
      setStats('details', []);
      return;
    }
    var start = new Date(startStr + 'T00:00:00');
    var end = new Date(endStr + 'T00:00:00');
    if (isNaN(start) || isNaN(end)) {
      setOutput('days', 'Invalid dates');
      return;
    }
    if (end < start) {
      setOutput('days', 'End date is before start');
      setStats('details', []);
      return;
    }
    var count = 0;
    var current = new Date(start);
    var last = includeEnd ? end : new Date(end.getTime() - 86400000);
    while (current <= last) {
      var day = current.getDay();
      if (day !== 0 && day !== 6) count++;
      current.setDate(current.getDate() + 1);
    }
    setOutput('days', String(count));
    setStats('details', [
      ['Start', start.toDateString()],
      ['End', end.toDateString()],
      ['Include end', includeEnd ? 'Yes' : 'No'],
      ['Business days', String(count)]
    ]);
  }

  var btn = root.querySelector('[data-action="calculate"]');
  if (btn) btn.addEventListener('click', calculate);
  ['start', 'end'].forEach(function(id) {
    var el = control(id);
    if (el) el.addEventListener('change', calculate);
  });
  if (control('include-end')) control('include-end').addEventListener('change', calculate);
})();
