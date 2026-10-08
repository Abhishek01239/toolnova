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
  function counts(text) {
    var map = Object.create(null);
    var n = 0;
    var chars = text.toLowerCase().match(/\p{L}/gu) || [];
    chars.forEach(function (ch) {
      map[ch] = (map[ch] || 0) + 1;
      n++;
    });
    return { map: map, n: n };
  }
  function run() {
    var a = counts(control('left').value || '');
    var b = counts(control('right').value || '');
    if (!a.n || !b.n) { status('Enter letters in both phrases.', 'err'); return; }
    var keys = {};
    Object.keys(a.map).concat(Object.keys(b.map)).forEach(function (k) { keys[k] = true; });
    var diffs = [];
    Object.keys(keys).sort().forEach(function (k) {
      var d = (a.map[k] || 0) - (b.map[k] || 0);
      if (d) diffs.push(k + ' ' + (d > 0 ? '+' : '') + d);
    });
    var same = diffs.length === 0;
    setOutput('output', same ? 'These phrases are anagrams.' : 'Not anagrams. Letter differences (first minus second): ' + diffs.join(', '));
    setStats('summary', [
      ['Verdict', same ? 'Anagram' : 'Not an anagram'],
      ['Letters in first', String(a.n)],
      ['Letters in second', String(b.n)]
    ]);
    status(same ? 'Match.' : 'Different letter counts.', same ? 'ok' : 'err');
  }
  onAction('run', run);
})();
