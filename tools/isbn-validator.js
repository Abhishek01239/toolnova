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
  function isbn13(raw) {
    if (!/^\d{13}$/.test(raw)) return null;
    var sum = 0;
    for (var i = 0; i < 12; i++) sum += Number(raw[i]) * (i % 2 === 0 ? 1 : 3);
    return (10 - (sum % 10)) % 10 === Number(raw[12]);
  }
  function isbn10(raw) {
    if (!/^\d{9}[\dXx]$/.test(raw)) return null;
    var sum = 0;
    for (var i = 0; i < 9; i++) sum += Number(raw[i]) * (10 - i);
    var check = raw[9].toUpperCase() === 'X' ? 10 : Number(raw[9]);
    sum += check;
    return sum % 11 === 0;
  }
  function run() {
    var raw = (control('isbn').value || '').replace(/[\s-]/g, '');
    if (!raw) { status('Enter an ISBN.', 'err'); return; }
    var ok = null, kind = '';
    if (raw.length === 13) { ok = isbn13(raw); kind = 'ISBN-13'; }
    else if (raw.length === 10) { ok = isbn10(raw); kind = 'ISBN-10'; }
    if (ok === null) { status('Use 10 or 13 characters after removing hyphens.', 'err'); return; }
    setOutput('output', (ok ? 'Valid ' : 'Invalid ') + kind + ': ' + raw.toUpperCase());
    setStats('summary', [
      ['Type', kind],
      ['Check digit', ok ? 'Matches' : 'Does not match'],
      ['Compact', raw.toUpperCase()]
    ]);
    status(ok ? 'Valid checksum.' : 'Checksum failed.', ok ? 'ok' : 'err');
  }
  onAction('run', run);
})();
