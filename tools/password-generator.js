(function () {
  'use strict';
  var root = document.getElementById('tool-app');
  if (!root) return;
  function control(id) { return root.querySelector('[data-control="' + id + '"]'); }
  function setOutput(id, value) {
    var el = root.querySelector('[data-output="' + id + '"]');
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

  function generate() {
    var len = parseInt(control('length').value, 10) || 16;
    len = Math.max(8, Math.min(64, len));
    var sets = [];
    if (control('uppercase').checked) sets.push('ABCDEFGHIJKLMNOPQRSTUVWXYZ');
    if (control('lowercase').checked) sets.push('abcdefghijklmnopqrstuvwxyz');
    if (control('numbers').checked) sets.push('0123456789');
    if (control('symbols').checked) sets.push('!@#$%^&*()_+-=[]{}|;:,.<>?');
    if (sets.length === 0) {
      status('Select at least one character type.', 'err');
      setOutput('result', '');
      return;
    }
    var all = sets.join('');
    var arr = new Uint32Array(len);
    crypto.getRandomValues(arr);
    var out = '';
    for (var i = 0; i < len; i++) {
      out += all[arr[i] % all.length];
    }
    setOutput('result', out);
    status('Password generated.', 'ok');
  }

  onAction('generate', generate);
  generate();
})();
