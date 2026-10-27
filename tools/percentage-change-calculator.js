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
  function setStats(id, entries) {
    var el = root.querySelector('[data-output="' + id + '"]');
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
  function onAction(id, fn) {
    var btn = root.querySelector('[data-action="' + id + '"]');
    if (btn) btn.addEventListener('click', function () { fn(btn); });
  }

  function calculate() {
    var oldVal = parseFloat(control('old').value);
    var newVal = parseFloat(control('new').value);
    if (isNaN(oldVal) || isNaN(newVal)) {
      setOutput('result', 'Enter valid numbers');
      setStats('details', []);
      return;
    }
    if (oldVal === 0) {
      setOutput('result', 'Undefined (original is 0)');
      setStats('details', []);
      return;
    }
    var diff = newVal - oldVal;
    var pct = (diff / Math.abs(oldVal)) * 100;
    var direction = pct > 0 ? 'increase' : pct < 0 ? 'decrease' : 'no change';
    setOutput('result', pct.toFixed(2) + '% ' + direction);
    setStats('details', [
      ['Absolute change', diff.toFixed(2)],
      ['Percentage', pct.toFixed(2) + '%'],
      ['Direction', direction],
      ['Multiplier', (newVal / oldVal).toFixed(4)]
    ]);
  }

  onAction('calculate', calculate);
  ['old', 'new'].forEach(function (id) {
    var el = control(id);
    if (el) el.addEventListener('input', calculate);
  });
  calculate();
})();
