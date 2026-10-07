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

  function parseInput(raw, base) {
    var s = String(raw).trim().replace(/_/g, '');
    if (!s) return null;
    var sign = 1;
    if (s[0] === '+') s = s.slice(1);
    else if (s[0] === '-') { sign = -1; s = s.slice(1); }
    if (base === 2 && /^0b/i.test(s)) s = s.slice(2);
    if (base === 8 && /^0o/i.test(s)) s = s.slice(2);
    if (base === 16 && /^0x/i.test(s)) s = s.slice(2);
    if (!s) return null;
    var alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    var allowed = alphabet.slice(0, base);
    if (!new RegExp('^[' + allowed + ']+$', 'i').test(s)) return null;
    return BigInt(sign) * BigInt(parseInt(s, base));
  }
  function run() {
    var base = Number(control('base').value);
    var n = parseInput(control('value').value, base);
    if (n === null) { status('Enter a valid integer for the selected base.', 'err'); return; }
    var neg = n < 0n;
    var abs = neg ? -n : n;
    var bin = abs.toString(2);
    var oct = abs.toString(8);
    var dec = abs.toString(10);
    var hex = abs.toString(16).toUpperCase();
    var sign = neg ? '-' : '';
    setOutput('binary', sign + bin);
    setOutput('octal', sign + oct);
    setOutput('decimal', sign + dec);
    setOutput('hex', sign + hex);
    setStats('summary', [
      ['Input base', String(base)],
      ['Bit length', String(bin.length)],
      ['Sign', neg ? 'Negative' : 'Non-negative']
    ]);
    status('Converted.', 'ok');
  }
  onAction('run', run);

})();
