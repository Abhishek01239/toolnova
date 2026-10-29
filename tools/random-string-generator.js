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
    len = Math.max(1, Math.min(256, len));
    var charset = '';
    if (control('uppercase').checked) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (control('lowercase').checked) charset += 'abcdefghijklmnopqrstuvwxyz';
    if (control('digits').checked) charset += '0123456789';
    if (control('symbols').checked) charset += '!@#$%^&*';
    if (!charset) {
      status('Select at least one character set.', 'error');
      setOutput('output', '');
      return;
    }
    var result = '';
    var values = new Uint32Array(len);
    crypto.getRandomValues(values);
    for (var i = 0; i < len; i++) {
      result += charset[values[i] % charset.length];
    }
    setOutput('output', result);
    status('✓ Generated a ' + len + '-character string.', 'ok');
  }

  onAction('generate', generate);
  onAction('copy', function() {
    var val = root.querySelector('[data-output="output"]').value;
    if (!val) { status('Generate a string first.', 'error'); return; }
    navigator.clipboard.writeText(val).then(function() {
      status('Copied to clipboard.', 'ok');
    }).catch(function() {
      status('Could not copy. Select and copy manually.', 'error');
    });
  });
  generate();
})();
