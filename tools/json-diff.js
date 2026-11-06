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

  function diff(a, b, path, changes) {
    if (a === b) return;
    var typeA = Object.prototype.toString.call(a);
    var typeB = Object.prototype.toString.call(b);
    if (typeA !== typeB || (typeof a !== 'object' || a === null) || (typeof b !== 'object' || b === null)) {
      changes.push({ path: path || '(root)', type: 'changed', from: JSON.stringify(a), to: JSON.stringify(b) });
      return;
    }
    if (Array.isArray(a) && Array.isArray(b)) {
      var max = Math.max(a.length, b.length);
      for (var i = 0; i < max; i++) {
        var p = path + '[' + i + ']';
        if (i >= a.length) changes.push({ path: p, type: 'added', to: JSON.stringify(b[i]) });
        else if (i >= b.length) changes.push({ path: p, type: 'removed', from: JSON.stringify(a[i]) });
        else diff(a[i], b[i], p, changes);
      }
      return;
    }
    var keys = new Set([...Object.keys(a), ...Object.keys(b)]);
    keys.forEach(function (k) {
      var p = path ? path + '.' + k : k;
      if (!(k in a)) changes.push({ path: p, type: 'added', to: JSON.stringify(b[k]) });
      else if (!(k in b)) changes.push({ path: p, type: 'removed', from: JSON.stringify(a[k]) });
      else diff(a[k], b[k], p, changes);
    });
  }

  onAction('compare', function () {
    status('');
    var left = control('left').value.trim();
    var right = control('right').value.trim();
    if (!left || !right) {
      status('Please paste JSON into both boxes.', 'error');
      setOutput('result', '');
      setStats('summary', []);
      return;
    }
    var a, b;
    try { a = JSON.parse(left); } catch (e) { status('Invalid JSON in left box: ' + e.message, 'error'); return; }
    try { b = JSON.parse(right); } catch (e) { status('Invalid JSON in right box: ' + e.message, 'error'); return; }
    var changes = [];
    diff(a, b, '', changes);
    if (changes.length === 0) {
      setOutput('result', 'No differences found. The two JSON documents are identical.');
      setStats('summary', [['Differences', '0']]);
      status('Identical.', 'ok');
      return;
    }
    var lines = changes.map(function (c) {
      if (c.type === 'added') return '+ ' + c.path + ' = ' + c.to;
      if (c.type === 'removed') return '- ' + c.path + ' = ' + c.from;
      return '~ ' + c.path + ': ' + c.from + ' \u2192 ' + c.to;
    });
    setOutput('result', lines.join('\n'));
    var added = changes.filter(function (c) { return c.type === 'added'; }).length;
    var removed = changes.filter(function (c) { return c.type === 'removed'; }).length;
    var changed = changes.filter(function (c) { return c.type === 'changed'; }).length;
    setStats('summary', [
      ['Total differences', String(changes.length)],
      ['Added', String(added)],
      ['Removed', String(removed)],
      ['Changed', String(changed)]
    ]);
    status('Found ' + changes.length + ' difference' + (changes.length === 1 ? '' : 's') + '.', 'ok');
  });
})();
