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

  var calcPercentageOf = function calcPercentageOf(pct, val) {
  var p = parseFloat(pct);
  var v = parseFloat(val);
  if (isNaN(p) || isNaN(v)) return null;
  return (p / 100) * v;
};
  var calcPercentageRatio = function calcPercentageRatio(val1, val2) {
  var v1 = parseFloat(val1);
  var v2 = parseFloat(val2);
  if (isNaN(v1) || isNaN(v2) || v2 === 0) return null;
  return (v1 / v2) * 100;
};
  var calcPercentageChange = function calcPercentageChange(val1, val2) {
  var v1 = parseFloat(val1);
  var v2 = parseFloat(val2);
  if (isNaN(v1) || isNaN(v2) || v1 === 0) return null;
  return ((v2 - v1) / v1) * 100;
};
  var calcPercentageReverse = function calcPercentageReverse(val, pct) {
  var v = parseFloat(val);
  var p = parseFloat(pct);
  if (isNaN(v) || isNaN(p) || p === 0) return null;
  return v / (p / 100);
};

  function formatNumber(num) {
    if (num === null || isNaN(num)) return '';
    if (num % 1 === 0) return num.toString();
    var str = num.toFixed(4);
    return parseFloat(str).toString();
  }

  function render() {
    var p1Pct = parseFloat(control('p1-pct').value);
    var p1Val = parseFloat(control('p1-val').value);
    var r1 = calcPercentageOf(p1Pct, p1Val);
    setOutput('result-1', r1 !== null ? formatNumber(r1) : '');

    var p2Val1 = parseFloat(control('p2-val1').value);
    var p2Val2 = parseFloat(control('p2-val2').value);
    var r2 = calcPercentageRatio(p2Val1, p2Val2);
    setOutput('result-2', r2 !== null ? formatNumber(r2) + '%' : '');

    var p3Val1 = parseFloat(control('p3-val1').value);
    var p3Val2 = parseFloat(control('p3-val2').value);
    var r3 = calcPercentageChange(p3Val1, p3Val2);
    if (r3 !== null) {
      var prefix = r3 > 0 ? '+' : '';
      setOutput('result-3', prefix + formatNumber(r3) + '%');
    } else {
      setOutput('result-3', '');
    }

    var p4Val = parseFloat(control('p4-val').value);
    var p4Pct = parseFloat(control('p4-pct').value);
    var r4 = calcPercentageReverse(p4Val, p4Pct);
    setOutput('result-4', r4 !== null ? formatNumber(r4) : '');

    status('Percentage calculations updated live.', 'ok');
  }

  [
    'p1-pct', 'p1-val',
    'p2-val1', 'p2-val2',
    'p3-val1', 'p3-val2',
    'p4-val', 'p4-pct'
  ].forEach(function (id) {
    var el = control(id);
    if (el) {
      el.addEventListener('input', render);
      el.addEventListener('change', render);
    }
  });

  render();
})();
