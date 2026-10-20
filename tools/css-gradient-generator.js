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
  function status(msg, kind) {
    var el = root.querySelector('[data-status]');
    if (!el) return;
    el.textContent = msg || '';
    el.className = 'status' + (kind ? ' ' + kind : '');
  }

  function generate() {
    var type = control('type').value;
    var angle = parseInt(control('angle').value, 10) || 90;
    var c1 = control('color1').value.trim() || '#4f46e5';
    var c2 = control('color2').value.trim() || '#ec4899';
    var css;
    if (type === 'radial') {
      css = 'background: radial-gradient(circle, ' + c1 + ', ' + c2 + ');';
    } else {
      css = 'background: linear-gradient(' + angle + 'deg, ' + c1 + ', ' + c2 + ');';
    }
    setOutput('css', css);
    status('CSS generated. Copy and use in your stylesheet.', 'ok');
  }

  onAction('generate', generate);
  generate();
})();
