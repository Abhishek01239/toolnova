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

  function pixels(text) {
    var wide = 0;
    var s = String(text || '');
    for (var i = 0; i < s.length; i++) {
      var c = s.charAt(i);
      if (c === 'i' || c === 'l' || c === 'I' || c === '.' || c === ',' || c === ' ') wide += 4;
      else if (c === 'm' || c === 'w' || c === 'M' || c === 'W') wide += 12;
      else if (c >= 'A' && c <= 'Z') wide += 9;
      else wide += 7;
    }
    return wide;
  }
  function check() {
    var title = control('title').value || '';
    var desc = control('description').value || '';
    var tp = pixels(title);
    var dp = pixels(desc);
    var notes = [];
    notes.push('Title: ' + title.length + ' characters, about ' + tp + ' px (planning limit ~580 px).');
    notes.push(tp > 580 ? 'Title may truncate on a desktop snippet.' : 'Title width is within the planning limit.');
    notes.push('Description: ' + desc.length + ' characters, about ' + dp + ' px (planning limit ~920 px).');
    notes.push(dp > 920 ? 'Description may truncate on a desktop snippet.' : 'Description width is within the planning limit.');
    notes.push('Search engines can still rewrite either field.');
    setOutput('result', notes.join('\n'));
    setStats('summary', [
      ['Title chars', String(title.length)],
      ['Title px', String(tp)],
      ['Description chars', String(desc.length)],
      ['Description px', String(dp)]
    ]);
    status('Local length estimate only.', 'ok');
  }
  onAction('check', check);
  check();
})();
