(function () {
  'use strict';
  var root = document.getElementById('tool-app');
  if (!root) return;
  function control(id) { return root.querySelector('[data-control="' + id + '"]'); }
  function setOutput(id, value) {
    var el = root.querySelector('[data-output="' + id + '"]');
    if (!el) return;
    if ('value' in el) { el.value = value; } else { el.textContent = value; }
  }
  function onAction(id, fn) {
    var btn = root.querySelector('[data-action="' + id + '"]');
    if (btn) btn.addEventListener('click', function () { fn(btn); });
  }

  function reverse() {
    var text = control('input') ? control('input').value : '';
    var mode = control('mode') ? control('mode').value : 'chars';
    var result = '';
    if (mode === 'chars') {
      result = text.split('').reverse().join('');
    } else if (mode === 'words') {
      result = text.split(/\s+/).filter(Boolean).reverse().join(' ');
    } else if (mode === 'lines') {
      result = text.split(/\r?\n/).reverse().join('\n');
    }
    setOutput('output', result);
  }

  function clear() {
    if (control('input')) control('input').value = '';
    setOutput('output', '');
  }

  var input = control('input');
  var mode = control('mode');
  if (input) input.addEventListener('input', reverse);
  if (mode) mode.addEventListener('change', reverse);
  onAction('clear', clear);
  reverse();
})();
