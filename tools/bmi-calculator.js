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

  function calculate() {
    var weight = parseFloat(control('weight').value) || 0;
    var wUnit = control('weight-unit').value;
    var height = parseFloat(control('height').value) || 0;
    var hUnit = control('height-unit').value;
    if (weight <= 0 || height <= 0) {
      setOutput('bmi-value', '');
      setOutput('category', '');
      setStats('details', []);
      return;
    }
    var kg = wUnit === 'lb' ? weight * 0.453592 : weight;
    var m = hUnit === 'in' ? height * 0.0254 : height / 100;
    if (m <= 0) return;
    var bmi = kg / (m * m);
    var cat = bmi < 18.5 ? 'Underweight' : bmi < 25 ? 'Normal' : bmi < 30 ? 'Overweight' : 'Obese';
    setOutput('bmi-value', bmi.toFixed(1));
    setOutput('category', cat);
    setStats('details', [
      ['Weight (kg)', kg.toFixed(1)],
      ['Height (m)', m.toFixed(2)],
      ['BMI', bmi.toFixed(1)],
      ['Category', cat]
    ]);
  }

  ['weight', 'weight-unit', 'height', 'height-unit'].forEach(function(id) {
    var el = control(id);
    if (el) {
      el.addEventListener('input', calculate);
      el.addEventListener('change', calculate);
    }
  });
  calculate();
})();
