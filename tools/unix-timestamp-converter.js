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

  function pad(n) { return String(n).padStart(2, '0'); }
  function formatLocal(d) {
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds());
  }
  function detectUnit(raw, unit) {
    if (unit === 'seconds') return 'seconds';
    if (unit === 'milliseconds') return 'milliseconds';
    return Math.abs(Number(raw)) >= 100000000000 ? 'milliseconds' : 'seconds';
  }
  function fromTimestamp() {
    var raw = String(control('timestamp').value).trim();
    if (!/^-?\d+(\.\d+)?$/.test(raw)) { status('Enter a numeric Unix timestamp.', 'err'); return; }
    var unit = detectUnit(raw, control('unit').value);
    var n = Number(raw);
    var ms = unit === 'milliseconds' ? n : n * 1000;
    var d = new Date(ms);
    if (isNaN(d.getTime())) { status('That timestamp is outside the range JavaScript can represent.', 'err'); return; }
    setOutput('result', 'UTC: ' + d.toISOString() + '\nLocal: ' + formatLocal(d));
    setStats('summary', [
      ['Unit used', unit],
      ['Epoch seconds', String(Math.trunc(ms / 1000))],
      ['Epoch milliseconds', String(Math.trunc(ms))],
      ['UTC', d.toISOString()],
      ['Local', formatLocal(d)],
      ['Timezone', Intl.DateTimeFormat().resolvedOptions().timeZone || 'local']
    ]);
    status('Converted timestamp to date.', 'ok');
  }
  function fromDate() {
    var raw = String(control('datetime').value).trim();
    var d = new Date(raw);
    if (!raw || isNaN(d.getTime())) { status('Enter a valid local date and time, such as 2024-06-01T15:30.', 'err'); return; }
    var ms = d.getTime();
    setOutput('result', 'Seconds: ' + Math.trunc(ms / 1000) + '\nMilliseconds: ' + ms);
    setStats('summary', [
      ['Epoch seconds', String(Math.trunc(ms / 1000))],
      ['Epoch milliseconds', String(ms)],
      ['UTC', d.toISOString()],
      ['Local', formatLocal(d)]
    ]);
    status('Converted date to Unix timestamp.', 'ok');
  }
  onAction('from-timestamp', fromTimestamp);
  onAction('from-date', fromDate);
  fromTimestamp();

})();
