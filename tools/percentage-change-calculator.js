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

  function run() {
    var oldVal = parseFloat(control('old').value);
    var newVal = parseFloat(control('new').value);
    if (isNaN(oldVal) || isNaN(newVal)) {
      status('Please enter valid numbers.', 'error');
      setOutput('result', '');
      setOutput('absolute', '');
      return;
    }
    if (oldVal === 0) {
      status('Percentage change is undefined when original value is zero.', 'error');
      setOutput('result', 'Undefined');
      setOutput('absolute', (newVal - oldVal).toString());
      return;
    }
    var abs = newVal - oldVal;
    var pct = (abs / oldVal) * 100;
    var sign = pct >= 0 ? '+' : '';
    setOutput('result', sign + pct.toFixed(2) + '%');
    setOutput('absolute', (abs >= 0 ? '+' : '') + abs.toFixed(2));
    status('✓ Calculated.', 'ok');
  }

  onAction('calculate', run);
})();
