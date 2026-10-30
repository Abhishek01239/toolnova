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
  function setStats(id, entries) {
    var el = root.querySelector('[data-output="' + id + '"]');
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
  function onAction(id, fn) {
    var btn = root.querySelector('[data-action="' + id + '"]');
    if (btn) btn.addEventListener('click', fn);
  }

  function pick() {
    var raw = (control('list') && control('list').value) || '';
    var items = raw.split(/\r?\n/).map(function (s) { return s.trim(); }).filter(Boolean);
    var count = parseInt((control('count') && control('count').value) || '1', 10) || 1;
    if (items.length === 0) {
      setOutput('result', 'Please enter at least one item.');
      setStats('summary', []);
      return;
    }
    count = Math.max(1, Math.min(count, items.length));
    var shuffled = items.slice();
    for (var i = shuffled.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = shuffled[i];
      shuffled[i] = shuffled[j];
      shuffled[j] = tmp;
    }
    var picked = shuffled.slice(0, count);
    setOutput('result', picked.join('\n'));
    setStats('summary', [
      ['Total items', items.length],
      ['Picked', picked.length],
      ['Remaining', items.length - picked.length]
    ]);
  }

  onAction('pick', pick);
  onAction('clear', function () {
    if (control('list')) control('list').value = '';
    setOutput('result', '');
    setStats('summary', []);
  });
})();
