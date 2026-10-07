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

  function gcd(a, b) {
    a = a < 0n ? -a : a;
    b = b < 0n ? -b : b;
    while (b !== 0n) {
      var t = a % b;
      a = b;
      b = t;
    }
    return a;
  }
  function run() {
    var parts = (control('numbers').value || '').split(/[^0-9-]+/).filter(Boolean);
    var nums = [];
    for (var i = 0; i < parts.length; i++) {
      if (!/^-?\d+$/.test(parts[i])) { status('Only integers are allowed.', 'err'); return; }
      nums.push(BigInt(parts[i]));
    }
    if (nums.length < 2) { status('Enter at least two integers.', 'err'); return; }
    var g = nums[0];
    var l = nums[0] < 0n ? -nums[0] : nums[0];
    var steps = [];
    var a0 = nums[0] < 0n ? -nums[0] : nums[0];
    var b0 = nums[1] < 0n ? -nums[1] : nums[1];
    var aa = a0, bb = b0;
    while (bb !== 0n) {
      steps.push(aa.toString() + ' = ' + (aa / bb).toString() + ' × ' + bb.toString() + ' + ' + (aa % bb).toString());
      var t = aa % bb; aa = bb; bb = t;
    }
    for (var j = 1; j < nums.length; j++) {
      g = gcd(g, nums[j]);
      var abs = nums[j] < 0n ? -nums[j] : nums[j];
      if (g === 0n) { l = 0n; }
      else l = (l / gcd(l, abs)) * abs;
    }
    var lcmText = (nums.every(function (n) { return n === 0n; }) || l === 0n) ? 'undefined (zero in the list)' : l.toString();
    setOutput('result', 'GCD: ' + g.toString() + '\nLCM: ' + lcmText + '\n\nEuclidean steps for the first pair:\n' + (steps.join('\n') || 'No remainder steps.'));
    setStats('summary', [
      ['Count', String(nums.length)],
      ['GCD', g.toString()],
      ['LCM', lcmText]
    ]);
    status('Calculated.', 'ok');
  }
  onAction('run', run);

})();
