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

  function check() {
    var title = control('title').value || '';
    var desc = control('description').value || '';
    var tLen = title.length;
    var dLen = desc.length;
    var tStatus = tLen === 0 ? 'Empty' : tLen <= 60 ? 'Good' : tLen <= 70 ? 'Long' : 'Too long';
    var dStatus = dLen === 0 ? 'Empty' : dLen <= 160 ? 'Good' : dLen <= 180 ? 'Long' : 'Too long';
    setStats('summary', [
      ['Title length', tLen + ' characters — ' + tStatus],
      ['Description length', dLen + ' characters — ' + dStatus]
    ]);
    status('Lengths checked.', 'ok');
  }
  onAction('check', check);
})();
