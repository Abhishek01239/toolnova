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

  var NAMES = ['minute', 'hour', 'day of month', 'month', 'day of week'];
  var RANGES = [[0, 59], [0, 23], [1, 31], [1, 12], [0, 7]];
  var DOW = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  function parsePart(part, min, max) {
    if (part === '*') return { any: true, label: 'every' };
    var values = {};
    var bits = part.split(',');
    for (var i = 0; i < bits.length; i++) {
      var bit = bits[i];
      var step = 1;
      var range = bit;
      if (bit.indexOf('/') !== -1) {
        var sp = bit.split('/');
        range = sp[0];
        step = parseInt(sp[1], 10);
        if (!step || step < 1) return null;
      }
      var start = min;
      var end = max;
      if (range !== '*') {
        if (range.indexOf('-') !== -1) {
          var rp = range.split('-');
          start = parseInt(rp[0], 10);
          end = parseInt(rp[1], 10);
        } else {
          start = parseInt(range, 10);
          end = start;
        }
      }
      if (isNaN(start) || isNaN(end) || start < min || end > max || start > end) return null;
      for (var n = start; n <= end; n += step) values[n] = true;
    }
    var list = Object.keys(values).map(Number).sort(function (a, b) { return a - b; });
    if (!list.length) return null;
    return { any: false, values: values, label: list.join(', ') };
  }

  function match(parsed, value) {
    return parsed.any || !!parsed.values[value];
  }

  function explain() {
    var raw = control('expr').value.trim().replace(/\s+/g, ' ');
    var parts = raw.split(' ');
    if (parts.length !== 5) { status('Enter exactly five fields.', 'err'); return; }
    var parsed = [];
    for (var i = 0; i < 5; i++) {
      var p = parsePart(parts[i], RANGES[i][0], RANGES[i][1]);
      if (!p) { status('Could not parse the ' + NAMES[i] + ' field.', 'err'); return; }
      parsed.push(p);
    }
    var lines = parsed.map(function (p, i) {
      return NAMES[i] + ': ' + parts[i] + ' (' + p.label + ')';
    });
    var domAny = parsed[2].any;
    var dowAny = parsed[4].any;
    lines.push(domAny || dowAny
      ? 'Day rule: both restricted fields must match.'
      : 'Day rule: day-of-month or day-of-week may match (standard cron OR).');
    setOutput('meaning', lines.join('\n'));
    setStats('summary', NAMES.map(function (name, i) { return [name, parts[i]]; }));

    var count = Math.max(1, Math.min(12, parseInt(control('count').value, 10) || 5));
    var cursor = new Date();
    cursor.setSeconds(0, 0);
    cursor.setMinutes(cursor.getMinutes() + 1);
    var found = [];
    var guard = 0;
    while (found.length < count && guard < 525600) {
      guard++;
      var minute = cursor.getMinutes();
      var hour = cursor.getHours();
      var dom = cursor.getDate();
      var month = cursor.getMonth() + 1;
      var dow = cursor.getDay();
      var dowOk = match(parsed[4], dow) || (dow === 0 && match(parsed[4], 7));
      var domOk = match(parsed[2], dom);
      var dayOk = (domAny || dowAny) ? (domOk && dowOk) : (domOk || dowOk);
      if (match(parsed[0], minute) && match(parsed[1], hour) && match(parsed[3], month) && dayOk) {
        found.push(cursor.toLocaleString() + ' (' + DOW[dow] + ')');
      }
      cursor.setMinutes(cursor.getMinutes() + 1);
    }
    setOutput('runs', found.length ? found.join('\n') : 'No matching time in the next year.');
    status('Explained ' + raw + '.', 'ok');
  }
  onAction('explain', explain);
  explain();
})();
