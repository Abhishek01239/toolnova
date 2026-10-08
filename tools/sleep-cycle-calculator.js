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
  function parseClock(raw) {
    var m = /^(\d{1,2}):(\d{2})$/.exec((raw || '').trim());
    if (!m) return null;
    var h = Number(m[1]), min = Number(m[2]);
    if (h > 23 || min > 59) return null;
    return h * 60 + min;
  }
  function fmt(mins) {
    mins = ((mins % 1440) + 1440) % 1440;
    var h = Math.floor(mins / 60), m = mins % 60;
    return (h < 10 ? '0' : '') + h + ':' + (m < 10 ? '0' : '') + m;
  }
  function run() {
    var base = parseClock(control('clock').value);
    if (base === null) { status('Enter a time as HH:MM, for example 23:00.', 'err'); return; }
    var mode = control('mode').value;
    var lines = [];
    for (var cycles = 6; cycles >= 3; cycles--) {
      var delta = 15 + cycles * 90;
      var result = mode === 'bed' ? base + delta : base - delta;
      lines.push(cycles + ' cycles (' + (delta / 60).toFixed(1) + ' h including fall-asleep): ' + fmt(result));
    }
    setOutput('output', lines.join('\n'));
    setStats('summary', [
      ['Cycle length', '90 minutes'],
      ['Fall-asleep buffer', '15 minutes'],
      ['Range', '3 to 6 cycles']
    ]);
    status('Estimated times ready.', 'ok');
  }
  onAction('run', run);
})();
