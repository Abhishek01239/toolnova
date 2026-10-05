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


  function gcd(a, b) {
    a = Math.abs(Math.round(a));
    b = Math.abs(Math.round(b));
    while (b) { var t = a % b; a = b; b = t; }
    return a || 1;
  }
  function simplify() {
    var w = parseFloat(control('width').value);
    var h = parseFloat(control('height').value);
    if (!isFinite(w) || !isFinite(h) || w <= 0 || h <= 0) { status('Enter width and height greater than 0.', 'err'); return; }
    var g = gcd(w, h);
    var rw = Math.round(w) / g;
    var rh = Math.round(h) / g;
    control('ratio-w').value = rw;
    control('ratio-h').value = rh;
    setOutput('result', rw + ':' + rh);
    setStats('summary', [
      ['Simplified', rw + ':' + rh],
      ['Decimal', String(Math.round((w / h) * 1000) / 1000)],
      ['CSS', 'aspect-ratio: ' + rw + ' / ' + rh + ';']
    ]);
    status('Simplified the aspect ratio.', 'ok');
  }
  function fromWidth() {
    var w = parseFloat(control('width').value);
    var rw = parseFloat(control('ratio-w').value);
    var rh = parseFloat(control('ratio-h').value);
    if (!isFinite(w) || w <= 0 || !isFinite(rw) || !isFinite(rh) || rw <= 0 || rh <= 0) { status('Enter a width and a ratio greater than 0.', 'err'); return; }
    var h = w * rh / rw;
    control('height').value = Math.round(h * 100) / 100;
    setOutput('result', (Math.round(h * 100) / 100) + ' high');
    setStats('summary', [['Width', String(w)], ['Height', String(Math.round(h * 100) / 100)], ['Ratio', rw + ':' + rh]]);
    status('Calculated height from width.', 'ok');
  }
  function fromHeight() {
    var h = parseFloat(control('height').value);
    var rw = parseFloat(control('ratio-w').value);
    var rh = parseFloat(control('ratio-h').value);
    if (!isFinite(h) || h <= 0 || !isFinite(rw) || !isFinite(rh) || rw <= 0 || rh <= 0) { status('Enter a height and a ratio greater than 0.', 'err'); return; }
    var w = h * rw / rh;
    control('width').value = Math.round(w * 100) / 100;
    setOutput('result', (Math.round(w * 100) / 100) + ' wide');
    setStats('summary', [['Width', String(Math.round(w * 100) / 100)], ['Height', String(h)], ['Ratio', rw + ':' + rh]]);
    status('Calculated width from height.', 'ok');
  }
  onAction('simplify', simplify);
  onAction('from-width', fromWidth);
  onAction('from-height', fromHeight);
  simplify();

})();
