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
  function readControls(defs) {
    var vals = {};
    defs.forEach(function (d) {
      var el = control(d.id);
      if (!el) { vals[d.id] = d.value; return; }
      if (d.type === 'checkbox') vals[d.id] = el.checked;
      else if (d.type === 'number' || d.type === 'range') vals[d.id] = parseFloat(el.value) || 0;
      else vals[d.id] = el.value;
    });
    return vals;
  }

  var calculateBMI = function calculateBMI(weight, weightUnit, height, heightUnit) {
  var w = parseFloat(weight);
  var h = parseFloat(height);
  if (!w || !h || w <= 0 || h <= 0) return null;

  var weightKg = weightUnit === 'lb' ? w * 0.45359237 : w;
  var heightM = heightUnit === 'in' ? h * 0.0254 : h / 100;

  var bmi = weightKg / (heightM * heightM);
  return bmi;
};
  var getBMICategory = function getBMICategory(bmi) {
  if (bmi < 18.5) return 'Underweight';
  if (bmi < 25) return 'Normal weight';
  if (bmi < 30) return 'Overweight';
  return 'Obese';
};

  function render() {
    var weight = parseFloat(control('weight').value);
    var weightUnit = control('weight-unit').value;
    var height = parseFloat(control('height').value);
    var heightUnit = control('height-unit').value;

    if (!weight || !height || weight <= 0 || height <= 0) {
      setOutput('bmi-val', '');
      setOutput('bmi-cat', '');
      setStats('guidance', []);
      status('Please enter a valid height and weight.', '');
      return;
    }

    var bmi = calculateBMI(weight, weightUnit, height, heightUnit);
    if (!bmi) {
      setOutput('bmi-val', '');
      setOutput('bmi-cat', '');
      setStats('guidance', []);
      status('Invalid input values.', 'error');
      return;
    }

    setOutput('bmi-val', bmi.toFixed(2));
    var cat = getBMICategory(bmi);
    setOutput('bmi-cat', cat);

    // Calculate healthy range: BMI between 18.5 and 24.9
    var minHeightM = heightUnit === 'in' ? height * 0.0254 : height / 100;
    var minWeightKg = 18.5 * minHeightM * minHeightM;
    var maxWeightKg = 24.9 * minHeightM * minHeightM;

    var minWeight, maxWeight, unitLabel;
    if (weightUnit === 'lb') {
      minWeight = minWeightKg / 0.45359237;
      maxWeight = maxWeightKg / 0.45359237;
      unitLabel = 'lbs';
    } else {
      minWeight = minWeightKg;
      maxWeight = maxWeightKg;
      unitLabel = 'kg';
    }

    setStats('guidance', [
      ['Healthy BMI range', '18.5 – 24.9'],
      ['Ideal weight range', minWeight.toFixed(1) + ' – ' + maxWeight.toFixed(1) + ' ' + unitLabel],
      ['Current classification', cat]
    ]);

    status('BMI calculated successfully.', 'ok');
  }

  ['weight', 'weight-unit', 'height', 'height-unit'].forEach(function (id) {
    var el = control(id);
    el.addEventListener('input', render);
    el.addEventListener('change', render);
  });

  render();
})();
