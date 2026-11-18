(function () {
  'use strict';
  var root = document.getElementById('tool-app');
  if (!root) return;
  function control(id) { return root.querySelector('[data-control="' + id + '"]'); }
  function setOutput(id, value) {
    var el = root.querySelector('[data-output="' + id + '"]');
    if (!el) return;
    if ('value' in el) el.value = value; else el.textContent = value;
  }
  function onAction(id, fn) {
    var btn = root.querySelector('[data-action="' + id + '"]');
    if (btn) btn.addEventListener('click', function () { fn(); });
  }
  function status(msg, kind) {
    var el = root.querySelector('[data-status]');
    if (!el) return;
    el.textContent = msg || '';
    el.className = 'status' + (kind ? ' ' + kind : '');
  }

  onAction('encode', function () {
    var raw = control('input').value;
    try {
      setOutput('output', encodeURIComponent(raw));
      status('Encoded.', 'ok');
    } catch (e) {
      status(e.message || 'Encode failed', 'error');
    }
  });
  onAction('decode', function () {
    var raw = control('input').value;
    try {
      setOutput('output', decodeURIComponent(raw));
      status('Decoded.', 'ok');
    } catch (e) {
      status(e.message || 'Decode failed (invalid percent-encoding)', 'error');
    }
  });
  onAction('clear', function () {
    control('input').value = '';
    setOutput('output', '');
    status('');
  });
})();
