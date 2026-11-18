(function () {
  'use strict';
  var root = document.getElementById('tool-app');
  if (!root) return;
  function control(id) { return root.querySelector('[data-control="' + id + '"]'); }
  function setOutput(id, value) {
    var el = root.querySelector('[data-output="' + id + '"]');
    if (!el) return;
    if ('value' in el) el.value = value; else el.textContent = value;
  }
  function onAction(id, fn) {
    var btn = root.querySelector('[data-action="' + id + '"]');
    if (btn) btn.addEventListener('click', function () { fn(); });
  }
  function status(msg, kind) {
    var el = root.querySelector('[data-status]');
    if (!el) return;
    el.textContent = msg || '';
    el.className = 'status' + (kind ? ' ' + kind : '');
  }

  onAction('toDate', function () {
    var raw = control('input').value.trim();
    if (!raw) { status('Enter a value.', 'error'); return; }
    var unit = control('unit').value;
    var num = Number(raw);
    if (isNaN(num)) { status('Not a valid number.', 'error'); return; }
    var ms = unit === 'milliseconds' ? num : num * 1000;
    var d = new Date(ms);
    if (isNaN(d.getTime())) { status('Invalid timestamp.', 'error'); return; }
    setOutput('output', d.toISOString() + '\n' + d.toUTCString());
    status('Converted to date.', 'ok');
  });

  onAction('toTimestamp', function () {
    var raw = control('input').value.trim();
    if (!raw) { status('Enter a value.', 'error'); return; }
    var unit = control('unit').value;
    var d = new Date(raw);
    if (isNaN(d.getTime())) { status('Could not parse date.', 'error'); return; }
    var ts = unit === 'milliseconds' ? d.getTime() : Math.floor(d.getTime() / 1000);
    setOutput('output', String(ts));
    status('Converted to timestamp.', 'ok');
  });

  onAction('now', function () {
    var unit = control('unit').value;
    var now = Date.now();
    control('input').value = unit === 'milliseconds' ? String(now) : String(Math.floor(now / 1000));
    status('Filled with current time.', 'ok');
  });
})();
