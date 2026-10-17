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

  function calculate() {
    var type = control('calc-type').value;
    var x = parseFloat(control('x').value);
    var y = parseFloat(control('y').value);
    if (isNaN(x) || isNaN(y)) {
      setOutput('result', '');
      setOutput('explanation', '');
      return;
    }
    var result = '';
    var expl = '';
    if (type === 'of') {
      var res = (x / 100) * y;
      result = res.toFixed(2);
      expl = x + '% of ' + y + ' is ' + result;
    } else if (type === 'is') {
      if (y === 0) { result = 'N/A'; expl = 'Cannot divide by zero.'; }
      else {
        var res = (x / y) * 100;
        result = res.toFixed(2) + '%';
        expl = x + ' is ' + result + ' of ' + y;
      }
    } else if (type === 'change') {
      if (x === 0) { result = 'N/A'; expl = 'Cannot calculate change from zero.'; }
      else {
        var res = ((y - x) / Math.abs(x)) * 100;
        result = (res >= 0 ? '+' : '') + res.toFixed(2) + '%';
        expl = 'Change from ' + x + ' to ' + y + ' is ' + result;
      }
    }
    setOutput('result', result);
    setOutput('explanation', expl);
  }

  ['calc-type', 'x', 'y'].forEach(function(id) {
    var el = control(id);
    if (el) {
      el.addEventListener('input', calculate);
      el.addEventListener('change', calculate);
    }
  });
  calculate();
})();
