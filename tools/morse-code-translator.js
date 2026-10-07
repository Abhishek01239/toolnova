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

  var MAP = {
    A:'.-', B:'-...', C:'-.-.', D:'-..', E:'.', F:'..-.', G:'--.', H:'....', I:'..', J:'.---',
    K:'-.-', L:'.-..', M:'--', N:'-.', O:'---', P:'.--.', Q:'--.-', R:'.-.', S:'...', T:'-',
    U:'..-', V:'...-', W:'.--', X:'-..-', Y:'-.--', Z:'--..',
    '0':'-----','1':'.----','2':'..---','3':'...--','4':'....-','5':'.....','6':'-....','7':'--...','8':'---..','9':'----.',
    '.':'.-.-.-', ',':'--..--', '?':'..--..', "'":'.----.', '!':'-.-.--', '/':'-..-.', '(':'-.--.', ')':'-.--.-',
    '&':'.-...', ':':'---...', ';':'-.-.-.', '=':'-...-', '+':'.-.-.', '-':'-....-', '_':'..--.-', '"':'.-..-.',
    '$':'...-..-', '@':'.--.-.'
  };
  var REV = {};
  Object.keys(MAP).forEach(function (k) { REV[MAP[k]] = k; });
  function toMorse(text) {
    var unknown = 0;
    var words = String(text).toUpperCase().trim().split(/\s+/);
    var out = words.map(function (word) {
      return word.split('').map(function (ch) {
        if (!MAP[ch]) { unknown++; return '#'; }
        return MAP[ch];
      }).join(' ');
    }).join(' / ');
    return { text: out, unknown: unknown, units: out ? out.split(/\s+/).length : 0 };
  }
  function toText(code) {
    var unknown = 0;
    var normalized = String(code).replace(/_/g, '-').trim();
    var words = normalized.split(/\s*\/\s*/);
    var out = words.map(function (word) {
      return word.split(/\s+/).filter(Boolean).map(function (tok) {
        if (!REV[tok]) { unknown++; return '#'; }
        return REV[tok];
      }).join('');
    }).join(' ');
    return { text: out, unknown: unknown, units: normalized ? normalized.split(/\s+/).length : 0 };
  }
  function run() {
    var raw = control('input').value || '';
    if (!raw.trim()) { status('Enter text or Morse first.', 'err'); return; }
    var dir = control('direction').value;
    var result = dir === 'to-text' ? toText(raw) : toMorse(raw);
    setOutput('output', result.text);
    setStats('summary', [
      ['Direction', dir === 'to-text' ? 'Morse to text' : 'Text to Morse'],
      ['Unknown tokens', String(result.unknown)],
      ['Tokens', String(result.units)]
    ]);
    status(result.unknown ? 'Done, with unknown characters marked #.' : 'Translated.', result.unknown ? 'err' : 'ok');
  }
  onAction('run', run);

})();
