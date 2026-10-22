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

  function pad(n) { return n < 10 ? '0' + n : n; }

  function convert() {
    var input = control('datetime').value.trim();
    var from = control('from').value;
    var to = control('to').value;
    var date;
    if (!input) {
      date = new Date();
    } else {
      // Parse as local then adjust — better to use ISO with zone if possible
      var parts = input.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})/);
      if (!parts) {
        status('Use format YYYY-MM-DD HH:MM', 'error');
        setOutput('result', '');
        return;
      }
      // Create a date string that we can interpret in the from zone
      date = new Date(parts[1] + '-' + parts[2] + '-' + parts[3] + 'T' + parts[4] + ':' + parts[5] + ':00');
    }
    try {
      // Use Intl to format in target zone
      var formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: to,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        timeZoneName: 'short'
      });
      var result = formatter.format(date);
      setOutput('result', result);
      status('Converted from ' + from + ' to ' + to + '.', 'ok');
    } catch (e) {
      status('Could not convert: ' + e.message, 'error');
      setOutput('result', '');
    }
  }

  onAction('convert', convert);
  control('datetime').addEventListener('input', convert);
  control('from').addEventListener('change', convert);
  control('to').addEventListener('change', convert);
  // Set default to now
  var now = new Date();
  control('datetime').value = now.getFullYear() + '-' + pad(now.getMonth()+1) + '-' + pad(now.getDate()) + ' ' + pad(now.getHours()) + ':' + pad(now.getMinutes());
  convert();
})();
