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
  var alphabets = {
    url: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-',
    alnum: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
    hex: '0123456789abcdef'
  };
  function generate() {
    var length = Math.max(4, Math.min(64, parseInt(control('length').value, 10) || 21));
    var count = Math.max(1, Math.min(50, parseInt(control('count').value, 10) || 1));
    control('length').value = length;
    control('count').value = count;
    var alphabet = alphabets[control('alphabet').value] || alphabets.url;
    var ids = [];
    for (var n = 0; n < count; n++) {
      var bytes = new Uint8Array(length);
      crypto.getRandomValues(bytes);
      var out = '';
      for (var i = 0; i < length; i++) out += alphabet[bytes[i] % alphabet.length];
      ids.push(out);
    }
    setOutput('result', ids.join('\n'));
    status('Generated ' + count + ' ID' + (count === 1 ? '' : 's') + '.', 'ok');
  }
  onAction('generate', generate);
  generate();
})();
