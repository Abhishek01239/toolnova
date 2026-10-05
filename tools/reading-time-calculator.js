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


  function wordsOf(text) {
    return String(text || '').trim().split(/\s+/).filter(Boolean);
  }
  function format(seconds) {
    var s = Math.max(0, Math.round(seconds));
    var m = Math.floor(s / 60);
    var rem = s % 60;
    return m + ' minute' + (m === 1 ? '' : 's') + ' ' + rem + ' second' + (rem === 1 ? '' : 's');
  }
  function estimate() {
    var words = wordsOf(control('text').value);
    var wpm = parseFloat(control('wpm').value);
    if (!words.length) { status('Paste some text to estimate.', 'err'); return; }
    if (!isFinite(wpm) || wpm < 50) { status('Use a pace of at least 50 words per minute.', 'err'); return; }
    var minutes = words.length / wpm;
    setOutput('result', format(minutes * 60));
    setStats('summary', [
      ['Words', String(words.length)],
      ['Pace', String(wpm) + ' wpm'],
      ['Minutes', (Math.round(minutes * 100) / 100) + ''],
      ['Speaking at 150 wpm', format(words.length / 150 * 60)]
    ]);
    status('Estimated reading time.', 'ok');
  }
  onAction('estimate', estimate);

})();
