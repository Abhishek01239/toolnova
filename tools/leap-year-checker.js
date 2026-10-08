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
  function isLeap(y) { return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0; }
  function neighbor(y, step) {
    var n = y + step;
    while (n >= 1 && n <= 9999 && !isLeap(n)) n += step;
    return n >= 1 && n <= 9999 && isLeap(n) ? String(n) : 'n/a';
  }
  function run() {
    var y = Number(control('year').value);
    if (!Number.isInteger(y) || y < 1 || y > 9999) {
      status('Enter a whole year from 1 to 9999.', 'err');
      return;
    }
    var leap = isLeap(y);
    var why = leap
      ? (y % 400 === 0 ? 'divisible by 400' : 'divisible by 4 and not a century')
      : (y % 100 === 0 ? 'a century not divisible by 400' : 'not divisible by 4');
    setOutput('output', y + (leap ? ' is a leap year' : ' is not a leap year') + ' (' + why + '). February has ' + (leap ? '29' : '28') + ' days.');
    setStats('summary', [
      ['Verdict', leap ? 'Leap year' : 'Common year'],
      ['Previous leap year', neighbor(y, -1)],
      ['Next leap year', neighbor(y, 1)]
    ]);
    status('Checked ' + y + '.', 'ok');
  }
  onAction('run', run);
})();
