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

  var toGrams = {
    kg: 1000,
    g: 1,
    mg: 0.001,
    lb: 453.59237,
    oz: 28.349523125,
    st: 6350.29318
  };

  function convert() {
    var value = parseFloat(control('value').value);
    var from = control('from').value;
    var to = control('to').value;
    if (isNaN(value)) {
      setOutput('result', 'Enter a valid number');
      return;
    }
    var grams = value * toGrams[from];
    var result = grams / toGrams[to];
    setOutput('result', result.toFixed(6).replace(/\.?0+$/, ''));
  }

  onAction('convert', convert);
  ['value', 'from', 'to'].forEach(function (id) {
    var el = control(id);
    if (el) el.addEventListener('input', convert);
  });
  convert();
})();
