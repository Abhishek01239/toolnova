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
  function fmt(n) {
    if (Number.isInteger(n)) return String(n);
    return String(Math.round(n * 10000) / 10000);
  }
  function calc() {
    var raw = control('numbers').value || '';
    var parts = raw.split(/[\s,]+/).filter(Boolean);
    if (!parts.length) { status('Enter at least one number.', 'err'); return; }
    var nums = [];
    for (var i = 0; i < parts.length; i++) {
      if (!/^-?\d+(\.\d+)?$/.test(parts[i])) { status('Invalid number: ' + parts[i], 'err'); return; }
      nums.push(Number(parts[i]));
    }
    var sum = nums.reduce(function (a, b) { return a + b; }, 0);
    var sorted = nums.slice().sort(function (a, b) { return a - b; });
    var mid = Math.floor(sorted.length / 2);
    var median = sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
    var counts = {};
    nums.forEach(function (n) { counts[n] = (counts[n] || 0) + 1; });
    var max = 0;
    Object.keys(counts).forEach(function (k) { if (counts[k] > max) max = counts[k]; });
    var modes = Object.keys(counts).filter(function (k) { return counts[k] === max; });
    var modeText = max < 2 ? 'none' : modes.join(', ');
    setOutput('result', 'Count: ' + nums.length + '\nSum: ' + fmt(sum) + '\nMean: ' + fmt(sum / nums.length) + '\nMedian: ' + fmt(median) + '\nMode: ' + modeText);
    setStats('summary', [
      ['Count', String(nums.length)],
      ['Mean', fmt(sum / nums.length)],
      ['Median', fmt(median)],
      ['Mode', modeText]
    ]);
    status('Calculated statistics for ' + nums.length + ' numbers.', 'ok');
  }
  onAction('calc', calc);
  calc();
})();
