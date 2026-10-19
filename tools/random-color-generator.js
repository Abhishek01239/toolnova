(function () {
  'use strict';
  var root = document.getElementById('tool-app');
  if (!root) return;
  function setOutput(id, value) {
    var el = root.querySelector('[data-output="' + id + '"]');
    if (!el) return;
    if ('value' in el) { el.value = value; } else { el.textContent = value; }
  }
  function setStats(id, entries) {
    var el = root.querySelector('[data-output="' + id + '"]');
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
  function onAction(id, fn) {
    var btn = root.querySelector('[data-action="' + id + '"]');
    if (btn) btn.addEventListener('click', function () { fn(btn); });
  }

  var current = '#000000';

  function randomHex() {
    var n = Math.floor(Math.random() * 16777216);
    return '#' + n.toString(16).padStart(6, '0');
  }

  function generate() {
    current = randomHex();
    setOutput('hex', current);
    setStats('preview', [
      ['Hex', current],
      ['RGB', hexToRgb(current)]
    ]);
    var preview = root.querySelector('[data-output="preview"]');
    if (preview) preview.style.background = current;
  }

  function hexToRgb(hex) {
    var r = parseInt(hex.slice(1, 3), 16);
    var g = parseInt(hex.slice(3, 5), 16);
    var b = parseInt(hex.slice(5, 7), 16);
    return 'rgb(' + r + ', ' + g + ', ' + b + ')';
  }

  onAction('generate', generate);
  onAction('copy', function () {
    navigator.clipboard.writeText(current).then(function () {
    }).catch(function () {});
  });
  generate();
})();
