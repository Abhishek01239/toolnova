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

  var toMeters = {
    m: 1,
    km: 1000,
    cm: 0.01,
    mm: 0.001,
    ft: 0.3048,
    in: 0.0254,
    yd: 0.9144,
    mi: 1609.344
  };

  function convert() {
    var value = parseFloat(control('value').value);
    var from = control('from').value;
    var to = control('to').value;
    if (isNaN(value)) {
      setOutput('result', 'Enter a valid number');
      return;
    }
    var meters = value * toMeters[from];
    var result = meters / toMeters[to];
    setOutput('result', result.toFixed(6).replace(/\.?0+$/, ''));
  }

  onAction('convert', convert);
  ['value', 'from', 'to'].forEach(function (id) {
    var el = control(id);
    if (el) el.addEventListener('input', convert);
  });
  convert();
})();
