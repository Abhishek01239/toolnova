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

  var interval = null;
  var endTime = null;

  function pad(n) { return n < 10 ? '0' + n : String(n); }

  function tick() {
    if (!endTime) return;
    var now = Date.now();
    var diff = endTime - now;
    if (diff <= 0) {
      setOutput('display', '00:00:00');
      clearInterval(interval);
      interval = null;
      return;
    }
    var s = Math.floor(diff / 1000);
    var d = Math.floor(s / 86400);
    s %= 86400;
    var h = Math.floor(s / 3600);
    s %= 3600;
    var m = Math.floor(s / 60);
    s %= 60;
    var text = (d > 0 ? d + 'd ' : '') + pad(h) + ':' + pad(m) + ':' + pad(s);
    setOutput('display', text);
  }

  function start() {
    var mode = control('mode').value;
    var now = Date.now();
    if (mode === 'date') {
      var target = control('target').value;
      if (!target) { setOutput('display', 'Pick a date'); return; }
      endTime = new Date(target + 'T23:59:59').getTime();
      if (endTime <= now) { setOutput('display', 'Date is in the past'); return; }
    } else {
      var hrs = parseInt(control('hours').value, 10) || 0;
      var mins = parseInt(control('minutes').value, 10) || 0;
      var totalMs = (hrs * 3600 + mins * 60) * 1000;
      if (totalMs <= 0) { setOutput('display', 'Set a duration'); return; }
      endTime = now + totalMs;
    }
    if (interval) clearInterval(interval);
    tick();
    interval = setInterval(tick, 1000);
  }

  function stop() {
    if (interval) clearInterval(interval);
    interval = null;
    endTime = null;
    setOutput('display', 'Stopped');
  }

  var startBtn = root.querySelector('[data-action="start"]');
  var stopBtn = root.querySelector('[data-action="stop"]');
  if (startBtn) startBtn.addEventListener('click', start);
  if (stopBtn) stopBtn.addEventListener('click', stop);
})();
