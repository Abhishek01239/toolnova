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


  function minify() {
    var raw = control('input').value;
    if (!raw.trim()) { status('Paste JSON to minify.', 'err'); return; }
    var data;
    try { data = JSON.parse(raw); }
    catch (e) { status('Invalid JSON: ' + e.message, 'err'); return; }
    var out = JSON.stringify(data);
    setOutput('result', out);
    setStats('summary', [
      ['Original characters', String(raw.length)],
      ['Minified characters', String(out.length)],
      ['Saved', String(Math.max(0, raw.length - out.length))]
    ]);
    status('Minified JSON.', 'ok');
  }
  onAction('minify', minify);

})();
