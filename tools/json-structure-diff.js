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

  function pathJoin(base, key) {
    if (!base) return String(key);
    return base + (typeof key === 'number' ? '[' + key + ']' : '.' + key);
  }
  function walk(a, b, path, out) {
    if (Object.is(a, b) || JSON.stringify(a) === JSON.stringify(b)) return;
    var aArr = Array.isArray(a), bArr = Array.isArray(b);
    var aObj = a && typeof a === 'object', bObj = b && typeof b === 'object';
    if (aArr && bArr) {
      var n = Math.max(a.length, b.length);
      for (var i = 0; i < n; i++) {
        if (i >= a.length) out.added.push(pathJoin(path, i));
        else if (i >= b.length) out.removed.push(pathJoin(path, i));
        else walk(a[i], b[i], pathJoin(path, i), out);
      }
      return;
    }
    if (aObj && bObj && !aArr && !bArr) {
      var keys = {};
      Object.keys(a).forEach(function (k) { keys[k] = true; });
      Object.keys(b).forEach(function (k) { keys[k] = true; });
      Object.keys(keys).sort().forEach(function (k) {
        if (!Object.prototype.hasOwnProperty.call(a, k)) out.added.push(pathJoin(path, k));
        else if (!Object.prototype.hasOwnProperty.call(b, k)) out.removed.push(pathJoin(path, k));
        else walk(a[k], b[k], pathJoin(path, k), out);
      });
      return;
    }
    out.changed.push(path || '$');
  }
  function diff() {
    var left, right;
    try { left = JSON.parse(control('left').value); }
    catch (e) { status('Original JSON is invalid: ' + e.message, 'err'); return; }
    try { right = JSON.parse(control('right').value); }
    catch (e) { status('Updated JSON is invalid: ' + e.message, 'err'); return; }
    var out = { added: [], removed: [], changed: [] };
    walk(left, right, '', out);
    function block(title, items) { return title + (items.length ? '\n  ' + items.join('\n  ') : '\n  (none)'); }
    setOutput('result', [block('Added', out.added), block('Removed', out.removed), block('Changed', out.changed)].join('\n\n'));
    setStats('summary', [
      ['Added', String(out.added.length)],
      ['Removed', String(out.removed.length)],
      ['Changed', String(out.changed.length)]
    ]);
    status(out.added.length + out.removed.length + out.changed.length ? 'Differences found.' : 'Documents match.', 'ok');
  }
  onAction('diff', diff);
  diff();
})();
