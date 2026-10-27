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

  var exponents = { B: 0, KB: 1, MB: 2, GB: 3, TB: 4 };

  function convert() {
    var value = parseFloat(control('value').value);
    var from = control('from').value;
    var to = control('to').value;
    var base = parseInt(control('base').value, 10);
    if (isNaN(value) || value < 0) {
      setOutput('result', 'Enter a valid positive number');
      return;
    }
    var fromExp = exponents[from];
    var toExp = exponents[to];
    var bytes = value * Math.pow(base, fromExp);
    var result = bytes / Math.pow(base, toExp);
    setOutput('result', result.toFixed(6).replace(/\.?0+$/, ''));
  }

  onAction('convert', convert);
  ['value', 'from', 'to', 'base'].forEach(function (id) {
    var el = control(id);
    if (el) el.addEventListener('input', convert);
  });
  convert();
})();
