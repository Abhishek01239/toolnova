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

  function encode(s) {
    return s.replace(/[&<>"']/g, function(c) {
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":':&#39;'}[c];
    });
  }
  function decode(s) {
    var ta = document.createElement('textarea');
    ta.innerHTML = s;
    return ta.value;
  }

  onAction('encode', function () {
    var input = control('input');
    if (!input) return;
    setOutput('output', encode(input.value));
    status('Encoded.', 'ok');
  });
  onAction('decode', function () {
    var input = control('input');
    if (!input) return;
    setOutput('output', decode(input.value));
    status('Decoded.', 'ok');
  });
  onAction('clear', function () {
    if (control('input')) control('input').value = '';
    setOutput('output', '');
    status('');
  });
})();
