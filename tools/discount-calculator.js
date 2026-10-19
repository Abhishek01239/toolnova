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

  function calculate() {
    var orig = parseFloat(control('original').value) || 0;
    var pct = parseFloat(control('percent').value) || 0;
    if (orig < 0 || pct < 0) {
      setOutput('final', '');
      setStats('details', []);
      return;
    }
    var saved = orig * (pct / 100);
    var finalPrice = orig - saved;
    setOutput('final', finalPrice.toFixed(2));
    setStats('details', [
      ['Original price', orig.toFixed(2)],
      ['Discount', pct.toFixed(1) + '%'],
      ['Amount saved', saved.toFixed(2)],
      ['Final price', finalPrice.toFixed(2)]
    ]);
  }

  ['original', 'percent'].forEach(function (id) {
    var el = control(id);
    if (el) el.addEventListener('input', calculate);
  });
  calculate();
})();
