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
  function leap(y) { return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0; }
  function calc() {
    var raw = control('date').value;
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw || '');
    if (!m) { status('Choose a date.', 'err'); return; }
    var y = +m[1], mo = +m[2], d = +m[3];
    var start = Date.UTC(y, 0, 1);
    var current = Date.UTC(y, mo - 1, d);
    if (isNaN(current)) { status('That date is not valid.', 'err'); return; }
    var day = Math.round((current - start) / 86400000) + 1;
    var total = leap(y) ? 366 : 365;
    if (day < 1 || day > total) { status('That date is not valid.', 'err'); return; }
    setOutput('result', raw + ' is day ' + day + ' of ' + y + '.\n' + (total - day) + ' days remain after this date.');
    setStats('summary', [
      ['Day of year', String(day)],
      ['Days left', String(total - day)],
      ['Length of year', String(total)],
      ['Leap year', leap(y) ? 'Yes' : 'No']
    ]);
    status('Calculated the ordinal date.', 'ok');
  }
  onAction('calc', calc);
  calc();
})();
