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
  function readControls(defs) {
    var vals = {};
    defs.forEach(function (d) {
      var el = control(d.id);
      if (!el) { vals[d.id] = d.value; return; }
      if (d.type === 'checkbox') vals[d.id] = el.checked;
      else if (d.type === 'number' || d.type === 'range') vals[d.id] = parseFloat(el.value) || 0;
      else vals[d.id] = el.value;
    });
    return vals;
  }

  var SETS = {
    uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    lowercase: 'abcdefghijklmnopqrstuvwxyz',
    digits: '0123456789',
    symbols: '!@#$%^&*()-_=+[]{};:,.<>/?'
  };
  var LOOKALIKE = /[l1IO0]/g;

  function secureInt(maxExclusive) {
    var span = 4294967296;
    var limit = span - (span % maxExclusive);
    var buf = new Uint32Array(1);
    do {
      window.crypto.getRandomValues(buf);
    } while (buf[0] >= limit);
    return buf[0] % maxExclusive;
  }

  function buildCharset() {
    var chars = '';
    ['uppercase', 'lowercase', 'digits', 'symbols'].forEach(function (key) {
      if (control(key).checked) chars += SETS[key];
    });
    if (control('exclude-similar').checked) chars = chars.replace(LOOKALIKE, '');
    return chars;
  }

  function strengthLabel(bits) {
    if (bits < 45) return 'weak';
    if (bits < 60) return 'fair';
    if (bits < 80) return 'strong';
    return 'very strong';
  }

  function generate() {
    var chars = buildCharset();
    var length = parseInt(control('length').value, 10) || 16;
    if (!chars.length) {
      setOutput('password', '');
      status('Select at least one character set.', 'error');
      return;
    }
    var pw = '';
    for (var i = 0; i < length; i++) pw += chars[secureInt(chars.length)];
    setOutput('password', pw);
    var bits = Math.round(length * Math.log2(chars.length));
    status('Entropy: ~' + bits + ' bits — ' + strengthLabel(bits) + '.', bits >= 60 ? 'ok' : '');
  }

  onAction('generate', generate);
  ['length', 'uppercase', 'lowercase', 'digits', 'symbols', 'exclude-similar'].forEach(function (id) {
    var el = control(id);
    el.addEventListener('change', generate);
    if (el.type === 'range') el.addEventListener('input', generate);
  });
  generate();
})();
