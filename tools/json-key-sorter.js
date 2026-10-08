(function () {
  'use strict';
  var root = document.getElementById('tool-app');
  if (!root) return;
  function control(id) { return root.querySelector('[data-control="' + id + '"]'); }
  function outputEl(id) { return root.querySelector('[data-output="' + id + '"]'); }
  function setOutput(id, value) {
    var el = outputEl(id);
    if (!el) return;
    if ('value' in el) el.value = value; else el.textContent = value;
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
  function sortKeys(value) {
    if (Array.isArray(value)) return value.map(sortKeys);
    if (value && typeof value === 'object') {
      var out = {};
      Object.keys(value).sort().forEach(function (k) { out[k] = sortKeys(value[k]); });
      return out;
    }
    return value;
  }
  function countObjects(value) {
    if (Array.isArray(value)) return value.reduce(function (n, item) { return n + countObjects(item); }, 0);
    if (value && typeof value === 'object') {
      return 1 + Object.keys(value).reduce(function (n, k) { return n + countObjects(value[k]); }, 0);
    }
    return 0;
  }
  function run() {
    var raw = control('input').value || '';
    if (!raw.trim()) { status('Paste JSON first.', 'err'); return; }
    var parsed;
    try { parsed = JSON.parse(raw); }
    catch (err) { status('Invalid JSON: ' + err.message, 'err'); return; }
    var sorted = sortKeys(parsed);
    setOutput('output', JSON.stringify(sorted, null, 2));
    setStats('summary', [
      ['Objects sorted', String(countObjects(parsed))],
      ['Top type', Array.isArray(parsed) ? 'array' : typeof parsed]
    ]);
    status('Keys sorted.', 'ok');
  }
  onAction('run', run);
})();
