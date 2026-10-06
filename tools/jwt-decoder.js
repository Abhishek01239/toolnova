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

  function b64url(seg) {
    var s = seg.replace(/-/g, '+').replace(/_/g, '/');
    while (s.length % 4) s += '=';
    var bin = atob(s);
    var bytes = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new TextDecoder().decode(bytes);
  }
  function pretty(text) {
    try { return JSON.stringify(JSON.parse(text), null, 2); }
    catch (e) { return text; }
  }
  function claimDate(obj, key) {
    if (!obj || typeof obj[key] !== 'number') return '—';
    return new Date(obj[key] * 1000).toLocaleString();
  }

  function decode() {
    var raw = control('token').value.trim();
    if (!raw) { status('Paste a JWT.', 'err'); return; }
    var parts = raw.split('.');
    if (parts.length !== 3 || !parts[0] || !parts[1] || !parts[2]) {
      status('A JWT needs three dot-separated segments.', 'err');
      return;
    }
    var headerText;
    var payloadText;
    try {
      headerText = b64url(parts[0]);
      payloadText = b64url(parts[1]);
    } catch (e) {
      status('Could not base64url-decode the token.', 'err');
      return;
    }
    setOutput('header', pretty(headerText));
    setOutput('payload', pretty(payloadText));
    var header;
    var payload;
    try { header = JSON.parse(headerText); } catch (e) { header = null; }
    try { payload = JSON.parse(payloadText); } catch (e) { payload = null; }
    setStats('summary', [
      ['Algorithm', header && header.alg ? String(header.alg) : '—'],
      ['Type', header && header.typ ? String(header.typ) : '—'],
      ['Issued', claimDate(payload, 'iat')],
      ['Expires', claimDate(payload, 'exp')],
      ['Signature', 'not verified']
    ]);
    status('Decoded locally. Signature was not verified.', 'ok');
  }
  onAction('decode', decode);
})();
