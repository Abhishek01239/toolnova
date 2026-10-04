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

  function count() {
    var text = control('input').value;
    var ignore = control('ignore-case').checked;
    var minLen = parseInt(control('min-length').value, 10) || 1;
    var words = text.match(/[\p{L}\p{N}]+/gu) || [];
    var map = new Map();
    words.forEach(function (w) {
      var key = ignore ? w.toLocaleLowerCase() : w;
      if (key.length < minLen) return;
      map.set(key, (map.get(key) || 0) + 1);
    });
    var rows = Array.from(map.entries()).sort(function (a, b) {
      return b[1] - a[1] || a[0].localeCompare(b[0]);
    });
    setOutput('result', rows.map(function (r) { return r[1] + '\t' + r[0]; }).join('\n'));
    var unique = rows.length;
    var total = rows.reduce(function (s, r) { return s + r[1]; }, 0);
    setStats('summary', [
      ['Words counted', String(total)],
      ['Unique words', String(unique)],
      ['Most common', rows.length ? rows[0][0] + ' (' + rows[0][1] + ')' : '—']
    ]);
    status(total ? 'Counted ' + total + ' words.' : 'No words matched those filters.', total ? 'ok' : 'err');
  }
  onAction('count', count);
  control('input').addEventListener('input', count);
  count();

})();
