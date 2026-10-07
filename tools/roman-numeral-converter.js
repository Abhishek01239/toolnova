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

  var PAIRS = [[1000,'M'],[900,'CM'],[500,'D'],[400,'CD'],[100,'C'],[90,'XC'],[50,'L'],[40,'XL'],[10,'X'],[9,'IX'],[5,'V'],[4,'IV'],[1,'I']];
  var VALUES = {I:1,V:5,X:10,L:50,C:100,D:500,M:1000};
  function toRoman(n) {
    var out = '';
    for (var i = 0; i < PAIRS.length; i++) {
      while (n >= PAIRS[i][0]) { out += PAIRS[i][1]; n -= PAIRS[i][0]; }
    }
    return out;
  }
  function fromRoman(s) {
    if (!/^[IVXLCDM]+$/.test(s)) return null;
    if (/IIII|XXXX|CCCC|VV|LL|DD/.test(s)) return null;
    var total = 0;
    for (var i = 0; i < s.length; i++) {
      var v = VALUES[s[i]];
      var next = VALUES[s[i + 1]] || 0;
      if (next > v) {
        var pair = s[i] + s[i + 1];
        if (['IV','IX','XL','XC','CD','CM'].indexOf(pair) === -1) return null;
        total += next - v;
        i++;
      } else total += v;
    }
    if (total < 1 || total > 3999 || toRoman(total) !== s) return null;
    return total;
  }
  function run() {
    var dir = control('direction').value;
    var raw = (control('input').value || '').trim().toUpperCase();
    if (dir === 'to-roman') {
      if (!/^\d+$/.test(raw)) { status('Enter an integer from 1 to 3999.', 'err'); return; }
      var n = Number(raw);
      if (n < 1 || n > 3999) { status('Roman numerals here cover 1 to 3999.', 'err'); return; }
      var roman = toRoman(n);
      setOutput('output', roman);
      setStats('summary', [['Input', String(n)], ['Roman', roman], ['Length', String(roman.length)]]);
      status('Converted.', 'ok');
      return;
    }
    var num = fromRoman(raw);
    if (num === null) { status('Enter a standard Roman numeral from I to MMMCMXCIX.', 'err'); return; }
    setOutput('output', String(num));
    setStats('summary', [['Numeral', raw], ['Value', String(num)], ['Checks', 'Canonical']]);
    status('Converted.', 'ok');
  }
  onAction('run', run);

})();
