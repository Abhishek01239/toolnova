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

  function hash() {
    var text = control('input').value;
    if (!window.crypto || !crypto.subtle) { status('Web Crypto is not available in this browser.', 'err'); return; }
    var bytes = new TextEncoder().encode(text);
    crypto.subtle.digest('SHA-256', bytes).then(function (buf) {
      var hex = Array.from(new Uint8Array(buf)).map(function (b) {
        return b.toString(16).padStart(2, '0');
      }).join('');
      setOutput('digest', hex);
      setStats('summary', [
        ['Algorithm', 'SHA-256'],
        ['UTF-8 bytes', String(bytes.length)],
        ['Hex length', String(hex.length)]
      ]);
      status('Hashed locally.', 'ok');
    }).catch(function () {
      status('Could not compute the digest.', 'err');
    });
  }
  onAction('hash', hash);
  hash();
})();
