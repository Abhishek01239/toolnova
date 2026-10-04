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

  function round(n) {
    return String(Math.round(n * 1000) / 1000);
  }
  function toRem() {
    var px = parseFloat(control('px').value);
    var rootPx = parseFloat(control('root').value);
    if (!isFinite(px) || px < 0 || !isFinite(rootPx) || rootPx <= 0) { status('Enter a pixel size and a root font size greater than 0.', 'err'); return; }
    var rem = px / rootPx;
    setOutput('result', round(rem) + 'rem');
    setStats('summary', [
      ['Pixels', round(px) + 'px'],
      ['Root', round(rootPx) + 'px'],
      ['Rem', round(rem) + 'rem']
    ]);
    status('Converted pixels to rem.', 'ok');
  }
  function toPx() {
    var rem = parseFloat(control('rem').value);
    var rootPx = parseFloat(control('root').value);
    if (!isFinite(rem) || rem < 0 || !isFinite(rootPx) || rootPx <= 0) { status('Enter a rem value and a root font size greater than 0.', 'err'); return; }
    var px = rem * rootPx;
    setOutput('result', round(px) + 'px');
    setStats('summary', [
      ['Rem', round(rem) + 'rem'],
      ['Root', round(rootPx) + 'px'],
      ['Pixels', round(px) + 'px']
    ]);
    status('Converted rem to pixels.', 'ok');
  }
  onAction('to-rem', toRem);
  onAction('to-px', toPx);
  toRem();

})();
