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

  var encode = function hexEncode(text) {
  var bytes = new TextEncoder().encode(text);
  var out = [];
  for (var i = 0; i < bytes.length; i++) {
    out.push(bytes[i].toString(16).padStart(2, '0'));
  }
  return out.join('');
};
  var decode = function hexDecode(text) {
  var clean = String(text).replace(/[\s,]+/g, '').replace(/^0x/i, '');
  if (!/^[0-9a-fA-F]*$/.test(clean) || clean.length % 2 !== 0) {
    throw new Error('That is not valid hexadecimal — it must be pairs of hex digits.');
  }
  var bytes = new Uint8Array(clean.length / 2);
  for (var i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(clean.substr(i * 2, 2), 16);
  }
  return new TextDecoder().decode(bytes);
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
