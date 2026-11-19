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
  function setStats(id, entries) {
    var el = root.querySelector('[data-output="' + id + '"]');
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
  function status(msg, kind) {
    var n = root.querySelector('[data-status]');
    if (!n) return;
    n.textContent = msg || '';
    n.className = 'status' + (kind ? ' ' + kind : '');
  }

  function parse() {
    var raw = (control('input') && control('input').value || '').trim();
    if (!raw) {
      setOutput('params', '');
      setOutput('rebuilt', '');
      setStats('summary', []);
      status('');
      return;
    }
    var qs = raw;
    try {
      if (raw.indexOf('://') !== -1 || raw.indexOf('?') !== -1) {
        var u = new URL(raw.indexOf('://') === -1 ? 'http://x' + (raw.charAt(0) === '?' ? '' : '?') + raw : raw);
        qs = u.search.slice(1);
      }
    } catch (e) {
      // fall through and treat as raw query
    }
    var params = new URLSearchParams(qs);
    var lines = [];
    var count = 0;
    params.forEach(function (value, key) {
      lines.push(key + ' = ' + value);
      count++;
    });
    var rebuilt = params.toString();
    setOutput('params', lines.join('\n'));
    setOutput('rebuilt', rebuilt ? '?' + rebuilt : '');
    setStats('summary', [
      ['Parameters', count],
      ['Raw length', raw.length],
      ['Rebuilt length', rebuilt.length]
    ]);
    status(count ? 'Parsed ' + count + ' parameter' + (count === 1 ? '' : 's') + '.' : 'No parameters found.', count ? 'ok' : 'error');
  }

  function clear() {
    if (control('input')) control('input').value = '';
    setOutput('params', '');
    setOutput('rebuilt', '');
    setStats('summary', []);
    status('');
  }

  var btn = root.querySelector('[data-action="parse"]');
  if (btn) btn.addEventListener('click', parse);
  var clr = root.querySelector('[data-action="clear"]');
  if (clr) clr.addEventListener('click', clear);
})();
