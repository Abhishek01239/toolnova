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

  function textToBinary(text) {
    var bytes = new TextEncoder().encode(text);
    return Array.from(bytes).map(function(b) {
      return b.toString(2).padStart(8, '0');
    }).join(' ');
  }

  function binaryToText(bin) {
    var parts = bin.trim().split(/\s+/);
    var bytes = [];
    for (var i = 0; i < parts.length; i++) {
      var n = parseInt(parts[i], 2);
      if (isNaN(n) || n > 255) throw new Error('Invalid binary group: ' + parts[i]);
      bytes.push(n);
    }
    return new TextDecoder().decode(new Uint8Array(bytes));
  }

  function convert() {
    var input = control('input').value;
    var mode = control('mode').value;
    if (!input.trim()) {
      setOutput('result', '');
      status('Enter some input.', 'err');
      return;
    }
    try {
      var result;
      if (mode === 'to-bin') {
        result = textToBinary(input);
      } else {
        result = binaryToText(input);
      }
      setOutput('result', result);
      status('Converted.', 'ok');
    } catch (e) {
      setOutput('result', '');
      status(e.message, 'err');
    }
  }

  onAction('convert', convert);
})();
