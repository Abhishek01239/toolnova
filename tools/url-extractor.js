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
  function readControls(defs) {
    var vals = {};
    defs.forEach(function (d) {
      var el = control(d.id);
      if (!el) { vals[d.id] = d.value; return; }
      if (d.type === 'checkbox') vals[d.id] = el.checked;
      else if (d.type === 'number' || d.type === 'range') vals[d.id] = parseFloat(el.value) || 0;
      else vals[d.id] = el.value;
    });
    return vals;
  }

  var transforms = {};
  transforms["extract-urls"] = function extractUrls(text) {
  var matches = text.match(/https?:\/\/[^\s<>"'()]+/g) || [];
  return [...new Set(matches)].join('\n');
};

  root.querySelectorAll('[data-action]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var fn = transforms[btn.getAttribute('data-action')];
      if (!fn) return;
      try {
        var before = control('input').value;
        var result = fn(before);
        setOutput('output', result);
        var lines = result && result.indexOf('\n') !== -1 ? ', ' + (result.split('\n').length) + ' lines' : '';
        status('Done — ' + result.length + ' characters' + lines + '.', 'ok');
      } catch (err) {
        setOutput('output', '');
        status(err && err.message ? err.message : 'Something went wrong.', 'error');
      }
    });
  });
})();
