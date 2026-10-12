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

  function getN(freq) {
    if (freq === 'yearly') return 1;
    if (freq === 'half') return 2;
    if (freq === 'quarterly') return 4;
    if (freq === 'monthly') return 12;
    if (freq === 'daily') return 365;
    return 1;
  }

  function money(n) {
    return '$' + n.toFixed(2);
  }

  function calc() {
    var pEl = control('principal');
    var rEl = control('rate');
    var tEl = control('years');
    var fEl = control('frequency');
    if (!pEl || !rEl || !tEl || !fEl) {
      status('Controls not found.', 'error');
      return;
    }
    var P = parseFloat(pEl.value);
    var ratePct = parseFloat(rEl.value);
    var t = parseFloat(tEl.value);
    var freq = fEl.value || 'yearly';
    if (isNaN(P) || isNaN(ratePct) || isNaN(t) || P < 0 || ratePct < 0 || t < 0) {
      setStats('summary', []);
      setOutput('schedule', '');
      status('Please enter non-negative numbers for principal, rate and years.', 'error');
      return;
    }
    var n = getN(freq);
    var r = ratePct / 100;
    var A = P * Math.pow(1 + r / n, n * t);
    var interest = A - P;
    setStats('summary', [
      ['Principal', money(P)],
      ['Future value', money(A)],
      ['Interest earned', money(interest)],
      ['Compounding', freq + ' (' + n + '\u00d7/year)'],
      ['Years', String(t)]
    ]);
    var lines = ['Year | Balance'];
    var fullYears = Math.floor(t);
    for (var y = 1; y <= fullYears; y++) {
      var bal = P * Math.pow(1 + r / n, n * y);
      lines.push(y + ' | ' + money(bal));
    }
    if (fullYears === 0) {
      lines.push('(no complete years)');
    }
    setOutput('schedule', lines.join('\n'));
    status('Compound interest calculated.', 'ok');
  }

  onAction('calc', calc);
  // also run on input for live feel
  ['principal', 'rate', 'years', 'frequency'].forEach(function (id) {
    var el = control(id);
    if (el) {
      el.addEventListener('input', calc);
      el.addEventListener('change', calc);
    }
  });
  calc();
})();
