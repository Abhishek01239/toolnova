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

  function check() {
    var raw = control('input').value;
    var ignore = control('ignore-nonletters').checked;
    var cleaned = ignore ? raw.toLocaleLowerCase().replace(/[^\p{L}\p{N}]+/gu, '') : raw;
    var chars = Array.from(cleaned);
    var reversed = chars.slice().reverse().join('');
    var ok = cleaned.length > 0 && cleaned === reversed;
    setOutput('result', (ok ? 'Yes — this is a palindrome.' : 'No — this is not a palindrome.') + '\n\nForward: ' + cleaned + '\nReverse: ' + reversed);
    setStats('summary', [
      ['Palindrome', cleaned.length ? (ok ? 'Yes' : 'No') : 'Empty'],
      ['Characters compared', String(chars.length)],
      ['Filter', ignore ? 'Letters and numbers only' : 'Exact text']
    ]);
    status(cleaned.length ? (ok ? 'Palindrome.' : 'Not a palindrome.') : 'Enter some text first.', cleaned.length ? 'ok' : 'err');
  }
  onAction('check', check);
  control('input').addEventListener('input', check);
  check();

})();
