(function () {
  'use strict';
  var root = document.getElementById('tool-app');
  if (!root) return;
  function outputEl(id) { return root.querySelector('[data-output="' + id + '"]'); }
  function setStats(id, entries) {
    var el = outputEl(id);
    if (!el) return;
    el.replaceChildren();
    entries.forEach(function (pair) {
      var wrap = document.createElement('div');
      wrap.className = 'stat';
      var dt = document.createElement('dt');
      dt.textContent = String(pair[0] || '');
      var dd = document.createElement('dd');
      dd.textContent = String(pair[1] || '');
      wrap.appendChild(dt);
      wrap.appendChild(dd);
      el.appendChild(wrap);
    });
  }
  function onAction(id, fn) {
    var btn = root.querySelector('[data-action="' + id + '"]');
    if (btn) btn.addEventListener('click', function () { fn(btn); });
  }
  var startTime = 0;
  var elapsed = 0;
  var running = false;
  var timer = null;
  var laps = [];
  function format(ms) {
    var h = Math.floor(ms / 3600000);
    var m = Math.floor((ms % 3600000) / 60000);
    var s = Math.floor((ms % 60000) / 1000);
    var c = Math.floor((ms % 1000) / 10);
    return (h ? h + ':' : '') + String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0') + '.' + String(c).padStart(2, '0');
  }
  function update() {
    var now = running ? Date.now() - startTime + elapsed : elapsed;
    setStats('display', [['Elapsed', format(now)]]);
  }
  function renderLaps() {
    var el = outputEl('laps');
    if (!el) return;
    el.textContent = laps.length ? laps.map(function (t, i) { return (i + 1) + '. ' + format(t); }).join('\n') : 'No laps yet.';
  }
  onAction('start', function () {
    if (running) return;
    running = true;
    startTime = Date.now();
    timer = setInterval(update, 50);
    update();
  });
  onAction('stop', function () {
    if (!running) return;
    running = false;
    clearInterval(timer);
    elapsed += Date.now() - startTime;
    update();
  });
  onAction('lap', function () {
    if (!running && !elapsed) return;
    var now = running ? Date.now() - startTime + elapsed : elapsed;
    laps.unshift(now);
    renderLaps();
  });
  onAction('reset', function () {
    running = false;
    clearInterval(timer);
    elapsed = 0;
    laps = [];
    update();
    renderLaps();
  });
  update();
  renderLaps();
})();
