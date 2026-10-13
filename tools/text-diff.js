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

  function diffLines(a, b) {
    var al = a.replace(/\r\n/g, '\n').split('\n');
    var bl = b.replace(/\r\n/g, '\n').split('\n');
    var result = [];
    var i = 0, j = 0;
    var added = 0, removed = 0, same = 0;
    while (i < al.length || j < bl.length) {
      if (i < al.length && j < bl.length && al[i] === bl[j]) {
        result.push('  ' + al[i]);
        same++;
        i++; j++;
      } else if (j < bl.length && (i >= al.length || al.indexOf(bl[j], i) === -1 || (i < al.length && bl.indexOf(al[i], j) === -1))) {
        result.push('+ ' + bl[j]);
        added++;
        j++;
      } else if (i < al.length) {
        result.push('- ' + al[i]);
        removed++;
        i++;
      } else {
        result.push('+ ' + bl[j]);
        added++;
        j++;
      }
    }
    return { text: result.join('\n'), added: added, removed: removed, same: same };
  }

  function doDiff() {
    var left = control('left').value;
    var right = control('right').value;
    var d = diffLines(left, right);
    setOutput('result', d.text || '(no differences)');
    setStats('summary', [
      ['Lines added', String(d.added)],
      ['Lines removed', String(d.removed)],
      ['Unchanged lines', String(d.same)]
    ]);
    status(d.added || d.removed ? 'Differences found.' : 'Texts are identical.', 'ok');
  }

  onAction('diff', doDiff);
  control('left').addEventListener('input', doDiff);
  control('right').addEventListener('input', doDiff);
  doDiff();
})();
