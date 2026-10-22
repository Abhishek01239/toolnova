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

  function calculate() {
    var sex = control('sex').value;
    var age = parseFloat(control('age').value) || 0;
    var weight = parseFloat(control('weight').value) || 0;
    var height = parseFloat(control('height').value) || 0;
    var activity = parseFloat(control('activity').value) || 1.2;
    if (age < 15 || weight < 30 || height < 100) {
      status('Please enter realistic values.', 'error');
      setStats('result', []);
      return;
    }
    var bmr;
    if (sex === 'male') {
      bmr = 10 * weight + 6.25 * height - 5 * age + 5;
    } else {
      bmr = 10 * weight + 6.25 * height - 5 * age - 161;
    }
    var tdee = bmr * activity;
    setStats('result', [
      ['BMR (basal)', Math.round(bmr) + ' kcal'],
      ['TDEE (maintenance)', Math.round(tdee) + ' kcal'],
      ['Mild weight loss (-0.5 kg/week)', Math.round(tdee - 500) + ' kcal'],
      ['Weight gain (+0.5 kg/week)', Math.round(tdee + 500) + ' kcal']
    ]);
    status('Calculated with Mifflin-St Jeor equation.', 'ok');
  }

  onAction('calculate', calculate);
  ['sex', 'age', 'weight', 'height', 'activity'].forEach(function (id) {
    control(id).addEventListener('input', calculate);
    control(id).addEventListener('change', calculate);
  });
  calculate();
})();
