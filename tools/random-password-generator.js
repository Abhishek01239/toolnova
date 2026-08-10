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

  var CONTROL_DEFS = [{"id":"length","type":"range","value":16},{"id":"uppercase","type":"checkbox"},{"id":"numbers","type":"checkbox"},{"id":"symbols","type":"checkbox"}];
  var run = function (vals) {
      var chars = 'abcdefghijklmnopqrstuvwxyz';
      if (vals.uppercase) chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      if (vals.numbers) chars += '0123456789';
      if (vals.symbols) chars += '!@#$%^&*()_+-=[]{}|;:,.<>?';
      if (chars.length === 0) return 'Enable at least one character type.';
      var len = Math.max(4, Math.min(64, Math.floor(vals.length) || 16));
      var out = '';
      for (var i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)];
      return out;
    };

  function go() {
    try {
      var result = run(readControls(CONTROL_DEFS));
      setOutput('result', result);
      var lines = String(result).split('\n').filter(function (l) { return l.trim() !== ''; });
      status('Generated ' + lines.length + ' result' + (lines.length === 1 ? '' : 's') + '.', 'ok');
    } catch (err) {
      setOutput('result', '');
      status(err && err.message ? err.message : 'Something went wrong.', 'error');
    }
  }

  onAction('generate', go);
  go();
})();
