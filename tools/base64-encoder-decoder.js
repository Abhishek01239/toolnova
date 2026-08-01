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
  function readControls(defs) {
    var vals = {};
    defs.forEach(function (d) {
      var el = control(d.id);
      if (!el) { vals[d.id] = d.value; return; }
      if (d.type === 'checkbox') vals[d.id] = el.checked;
      else if (d.type === 'number' || d.type === 'range') vals[d.id] = parseFloat(el.value) || 0;
      else vals[d.id] = el.value;
    });
    return vals;
  }

  var encode = function base64Encode(text) {
  var alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  var bytes = new TextEncoder().encode(text);
  var out = '';
  for (var i = 0; i < bytes.length; i += 3) {
    var b1 = bytes[i];
    var b2 = i + 1 < bytes.length ? bytes[i + 1] : undefined;
    var b3 = i + 2 < bytes.length ? bytes[i + 2] : undefined;
    var n = (b1 << 16) | ((b2 || 0) << 8) | (b3 || 0);
    out += alphabet[(n >> 18) & 63];
    out += alphabet[(n >> 12) & 63];
    out += b2 === undefined ? '=' : alphabet[(n >> 6) & 63];
    out += b3 === undefined ? '=' : alphabet[n & 63];
  }
  return out;
};
  var decode = function base64Decode(encoded) {
  var alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  var clean = String(encoded).replace(/\s+/g, '');
  if (!/^[A-Za-z0-9+/]*(={0,2})$/.test(clean) || clean.length % 4 === 1) {
    throw new Error('That is not valid Base64 — check for missing or extra characters.');
  }
  var padded = clean.replace(/=+$/, '');
  var bytes = [];
  var buffer = 0;
  var bits = 0;
  for (var i = 0; i < padded.length; i++) {
    var v = alphabet.indexOf(padded[i]);
    buffer = (buffer << 6) | v;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      bytes.push((buffer >> bits) & 0xff);
    }
  }
  return new TextDecoder().decode(new Uint8Array(bytes));
};

  function run(fn) {
    try {
      var before = control('input').value;
      var result = fn(before);
      setOutput('output', result);
      status('Done — ' + result.length + ' characters.', 'ok');
    } catch (err) {
      setOutput('output', '');
      status(err && err.message ? err.message : 'Could not process that input.', 'error');
    }
  }

  onAction('encode', function () { run(encode); });
  onAction('decode', function () { run(decode); });
})();
