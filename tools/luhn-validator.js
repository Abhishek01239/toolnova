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
  function brand(digits) {
    if (/^4/.test(digits)) return 'Visa-like prefix';
    if (/^3[47]/.test(digits)) return 'American Express-like prefix';
    if (/^5[1-5]/.test(digits) || /^2(2[2-9]|[3-6]\d|7[01]|720)/.test(digits)) return 'Mastercard-like prefix';
    if (/^6(?:011|5)/.test(digits)) return 'Discover-like prefix';
    return 'Unknown prefix';
  }
  function check() {
    var raw = control('number').value || '';
    var digits = raw.replace(/[\s-]/g, '');
    if (!/^\d{2,19}$/.test(digits)) { status('Enter 2–19 digits. Spaces and dashes are fine.', 'err'); return; }
    var sum = 0;
    var alt = false;
    for (var i = digits.length - 1; i >= 0; i--) {
      var n = digits.charCodeAt(i) - 48;
      if (alt) {
        n *= 2;
        if (n > 9) n -= 9;
      }
      sum += n;
      alt = !alt;
    }
    var ok = sum % 10 === 0;
    setOutput('result', ok ? 'Valid Luhn checksum.' : 'Invalid Luhn checksum.');
    setStats('summary', [
      ['Digits', String(digits.length)],
      ['Checksum', ok ? 'Pass' : 'Fail'],
      ['Prefix hint', brand(digits)],
      ['Check digit', digits.slice(-1)]
    ]);
    status(ok ? 'Checksum passed.' : 'Checksum failed.', ok ? 'ok' : 'err');
  }
  onAction('check', check);
  check();
})();
