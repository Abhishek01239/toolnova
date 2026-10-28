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

  function gcd(a, b) {
    a = Math.abs(Math.round(a * 1000));
    b = Math.abs(Math.round(b * 1000));
    while (b) {
      var t = b;
      b = a % b;
      a = t;
    }
    return a / 1000;
  }

  function calculate() {
    var a = parseFloat(control('a').value) || 0;
    var b = parseFloat(control('b').value) || 0;
    var mode = control('mode').value;
    var c = parseFloat(control('c').value) || 0;
    if (a <= 0 || b <= 0) {
      setOutput('result', 'Enter positive numbers');
      setStats('details', []);
      return;
    }
    if (mode === 'simplify') {
      var g = gcd(a, b);
      var sa = (a / g).toFixed(4).replace(/\.?0+$/, '');
      var sb = (b / g).toFixed(4).replace(/\.?0+$/, '');
      setOutput('result', sa + ' : ' + sb);
      setStats('details', [
        ['Original', a + ' : ' + b],
        ['Simplified', sa + ' : ' + sb],
        ['GCD factor', g.toFixed(4).replace(/\.?0+$/, '')]
      ]);
    } else {
      if (c <= 0) {
        setOutput('result', 'Enter C for scale mode');
        setStats('details', []);
        return;
      }
      var d = (b / a) * c;
      setOutput('result', d.toFixed(4).replace(/\.?0+$/, ''));
      setStats('details', [
        ['Ratio', a + ' : ' + b],
        ['Given C', c],
        ['Calculated D', d.toFixed(4).replace(/\.?0+$/, '')]
      ]);
    }
  }

  var btn = root.querySelector('[data-action="calculate"]');
  if (btn) btn.addEventListener('click', calculate);
})();
