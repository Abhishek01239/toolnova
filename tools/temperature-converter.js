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

  function convert() {
    var val = parseFloat(control('value').value);
    var unit = control('unit').value;
    if (isNaN(val)) {
      setOutput('celsius', '');
      setOutput('fahrenheit', '');
      setOutput('kelvin', '');
      return;
    }
    var c, f, k;
    if (unit === 'c') {
      c = val;
      f = c * 9 / 5 + 32;
      k = c + 273.15;
    } else if (unit === 'f') {
      f = val;
      c = (f - 32) * 5 / 9;
      k = c + 273.15;
    } else {
      k = val;
      c = k - 273.15;
      f = c * 9 / 5 + 32;
    }
    setOutput('celsius', c.toFixed(2));
    setOutput('fahrenheit', f.toFixed(2));
    setOutput('kelvin', k.toFixed(2));
  }

  ['value', 'unit'].forEach(function(id) {
    var el = control(id);
    if (el) {
      el.addEventListener('input', convert);
      el.addEventListener('change', convert);
    }
  });
  convert();
})();
