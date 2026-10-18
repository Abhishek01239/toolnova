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

  function randomInt(min, max) {
    var range = max - min + 1;
    var arr = new Uint32Array(1);
    crypto.getRandomValues(arr);
    return min + (arr[0] % range);
  }

  function generate() {
    var min = parseFloat(control('min').value);
    var max = parseFloat(control('max').value);
    var count = parseInt(control('count').value, 10) || 1;
    var unique = control('unique').checked;
    if (isNaN(min) || isNaN(max) || min > max) {
      status('Invalid range.', 'err');
      setOutput('result', '');
      return;
    }
    count = Math.max(1, Math.min(100, count));
    var isInt = Number.isInteger(min) && Number.isInteger(max);
    var results = [];
    var used = new Set();
    var attempts = 0;
    var maxAttempts = count * 100;
    while (results.length < count && attempts < maxAttempts) {
      attempts++;
      var n;
      if (isInt) {
        n = randomInt(Math.ceil(min), Math.floor(max));
      } else {
        var arr = new Uint32Array(1);
        crypto.getRandomValues(arr);
        n = min + (arr[0] / 4294967296) * (max - min);
        n = Math.round(n * 100) / 100;
      }
      if (unique) {
        if (used.has(n)) continue;
        used.add(n);
      }
      results.push(n);
    }
    if (results.length < count) {
      status('Could not generate enough unique numbers in this range.', 'err');
      setOutput('result', results.join('\n'));
      return;
    }
    setOutput('result', results.join('\n'));
    status('Generated ' + results.length + ' number(s).', 'ok');
  }

  onAction('generate', generate);
})();
