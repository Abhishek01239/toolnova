(function () {
  'use strict';
  var root = document.getElementById('tool-app');
  if (!root) return;
  function control(id) { return root.querySelector('[data-control="' + id + '"]'); }
  function outputEl(id) { return root.querySelector('[data-output="' + id + '"]'); }
  function setOutput(id, value) {
    var el = outputEl(id);
    if (!el) return;
    if ('value' in el) el.value = value; else el.textContent = value;
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

  var LETTERS = {
    'A+': 4.0, 'A': 4.0, 'A-': 3.7,
    'B+': 3.3, 'B': 3.0, 'B-': 2.7,
    'C+': 2.3, 'C': 2.0, 'C-': 1.7,
    'D+': 1.3, 'D': 1.0, 'D-': 0.7,
    'F': 0
  };
  function calc() {
    var lines = control('courses').value.split(/\n/);
    var scale = control('scale').value;
    var credits = 0;
    var points = 0;
    var rows = [];
    for (var i = 0; i < lines.length; i++) {
      var line = lines[i].trim();
      if (!line) continue;
      var parts = line.split(/\s+/);
      var grade = parts[0].toUpperCase();
      var credit = parts.length > 1 ? parseFloat(parts[1]) : 1;
      if (!isFinite(credit) || credit <= 0) { status('Credit on line ' + (i + 1) + ' must be a positive number.', 'err'); return; }
      var gp;
      if (scale === 'points') {
        gp = parseFloat(parts[0]);
        if (!isFinite(gp)) { status('Numeric points required on line ' + (i + 1) + '.', 'err'); return; }
      } else {
        if (!Object.prototype.hasOwnProperty.call(LETTERS, grade)) { status('Unknown letter grade on line ' + (i + 1) + ': ' + parts[0], 'err'); return; }
        gp = LETTERS[grade];
      }
      credits += credit;
      points += gp * credit;
      rows.push(parts[0] + '  ·  ' + credit + ' cr  ·  ' + gp.toFixed(2) + ' pts');
    }
    if (!credits) { status('Enter at least one course.', 'err'); return; }
    var gpa = points / credits;
    setOutput('result', rows.join('\n'));
    setStats('summary', [
      ['GPA', gpa.toFixed(2)],
      ['Credits', String(Math.round(credits * 100) / 100)],
      ['Quality points', points.toFixed(2)]
    ]);
    status('GPA calculated locally.', 'ok');
  }
  onAction('calc', calc);
  calc();
})();
