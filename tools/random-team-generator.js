(function () {
  'use strict';
  var root = document.getElementById('tool-app');
  if (!root) return;

  function control(id) { return root.querySelector('[data-control="' + id + '"]'); }
  function setOutput(id, value) {
    var el = root.querySelector('[data-output="' + id + '"]');
    if (!el) return;
    if ('value' in el) el.value = value;
    else el.textContent = value;
  }
  function status(msg, kind) {
    var n = root.querySelector('[data-status]');
    if (!n) return;
    n.textContent = msg || '';
    n.className = 'status' + (kind ? ' ' + kind : '');
  }
  function onAction(id, fn) {
    var btn = root.querySelector('[data-action="' + id + '"]');
    if (btn) btn.addEventListener('click', function () { fn(btn); });
  }

  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = a[i]; a[i] = a[j]; a[j] = tmp;
    }
    return a;
  }

  function generate() {
    var raw = (control('names') && control('names').value || '').trim();
    var n = parseInt(control('teams') && control('teams').value, 10) || 2;
    if (n < 2) n = 2;
    if (n > 20) n = 20;
    var names = raw.split(/\r?\n/).map(function (s) { return s.trim(); }).filter(Boolean);
    if (names.length < n) {
      status('Need at least as many names as teams.', 'error');
      setOutput('result', '');
      return;
    }
    var shuffled = shuffle(names);
    var teams = [];
    for (var t = 0; t < n; t++) teams.push([]);
    shuffled.forEach(function (name, i) {
      teams[i % n].push(name);
    });
    var out = '';
    teams.forEach(function (team, i) {
      out += 'Team ' + (i + 1) + ' (' + team.length + '):\n';
      out += team.map(function (p, j) { return '  ' + (j + 1) + '. ' + p; }).join('\n');
      out += '\n\n';
    });
    setOutput('result', out.trim());
    status('Created ' + n + ' teams from ' + names.length + ' people.', 'ok');
  }

  onAction('generate', generate);
})();
