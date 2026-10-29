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

  var ones = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
  var tens = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
  var scales = ['', 'thousand', 'million', 'billion', 'trillion'];

  function chunkToWords(n) {
    var s = '';
    if (n >= 100) {
      s += ones[Math.floor(n / 100)] + ' hundred';
      n %= 100;
      if (n) s += ' and ';
    }
    if (n >= 20) {
      s += tens[Math.floor(n / 10)];
      if (n % 10) s += '-' + ones[n % 10];
    } else if (n > 0) {
      s += ones[n];
    }
    return s;
  }

  function numberToWords(num) {
    if (num === 0) return 'zero';
    if (num < 0) return 'negative ' + numberToWords(-num);
    var words = [];
    var scale = 0;
    while (num > 0 && scale < scales.length) {
      var chunk = num % 1000;
      if (chunk) {
        var chunkWords = chunkToWords(chunk);
        if (scales[scale]) chunkWords += ' ' + scales[scale];
        words.unshift(chunkWords);
      }
      num = Math.floor(num / 1000);
      scale++;
    }
    return words.join(', ');
  }

  function run() {
    var raw = control('number').value.trim().replace(/,/g, '');
    if (!raw) {
      status('Enter a number.', 'error');
      setOutput('result', '');
      return;
    }
    if (!/^-?\d+$/.test(raw)) {
      status('Please enter a whole number (digits only).', 'error');
      setOutput('result', '');
      return;
    }
    var n = parseInt(raw, 10);
    if (!isFinite(n) || Math.abs(n) > 999999999999999) {
      status('Number is too large.', 'error');
      setOutput('result', '');
      return;
    }
    var words = numberToWords(n);
    setOutput('result', words.charAt(0).toUpperCase() + words.slice(1));
    status('✓ Converted.', 'ok');
  }

  onAction('convert', run);
  onAction('clear', function() {
    control('number').value = '';
    setOutput('result', '');
    status('');
  });
  // Live update
  control('number').addEventListener('input', run);
  run();
})();
