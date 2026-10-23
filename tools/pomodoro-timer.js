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

  var timer = null;
  var remaining = 0;
  var phase = 'work'; // 'work' or 'break'
  var running = false;

  function format(sec) {
    var m = Math.floor(sec / 60);
    var s = sec % 60;
    return (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
  }

  function updateDisplay() {
    setOutput('display', format(remaining));
    setOutput('phase', phase === 'work' ? 'Work' : 'Break');
  }

  function tick() {
    if (remaining > 0) {
      remaining--;
      updateDisplay();
    } else {
      clearInterval(timer);
      running = false;
      phase = phase === 'work' ? 'break' : 'work';
      status(phase === 'work' ? 'Break finished. Ready for work.' : 'Work finished. Time for a break.', 'ok');
      // Auto prepare next phase but don't start
      var mins = phase === 'work' ? (parseInt(control('work').value, 10) || 25) : (parseInt(control('break').value, 10) || 5);
      remaining = mins * 60;
      updateDisplay();
    }
  }

  function start() {
    if (running) return;
    if (remaining <= 0) {
      var mins = phase === 'work' ? (parseInt(control('work').value, 10) || 25) : (parseInt(control('break').value, 10) || 5);
      remaining = mins * 60;
    }
    running = true;
    timer = setInterval(tick, 1000);
    status('Timer running.', 'ok');
    updateDisplay();
  }

  function pause() {
    if (!running) return;
    clearInterval(timer);
    running = false;
    status('Paused.', '');
  }

  function reset() {
    clearInterval(timer);
    running = false;
    phase = 'work';
    var mins = parseInt(control('work').value, 10) || 25;
    remaining = mins * 60;
    updateDisplay();
    status('Reset.', '');
  }

  onAction('start', start);
  onAction('pause', pause);
  onAction('reset', reset);
  reset();
})();
