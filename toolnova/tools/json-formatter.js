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

  function sortKeysDeep(value) {
    if (Array.isArray(value)) return value.map(sortKeysDeep);
    if (value && typeof value === 'object') {
      var out = {};
      Object.keys(value).sort().forEach(function (k) { out[k] = sortKeysDeep(value[k]); });
      return out;
    }
    return value;
  }

  function lineCol(text, index) {
    var before = text.slice(0, index);
    var line = before.split('\n').length;
    var col = index - before.lastIndexOf('\n');
    return ' (line ' + line + ', column ' + col + ')';
  }

  function explainError(text, err) {
    var msg = err && err.message ? err.message : 'Invalid JSON';
    var m = msg.match(/position\s+(\d+)/i);
    if (m) {
      var idx = parseInt(m[1], 10);
      if (isFinite(idx) && idx <= text.length) msg += lineCol(text, idx);
    }
    return msg;
  }

  function parseInput() {
    var text = control('input').value;
    return JSON.parse(text);
  }

  function byteLength(s) {
    return new TextEncoder().encode(s).length;
  }

  function run(mode) {
    var text = control('input').value;
    if (!text.trim()) {
      status('Paste some JSON first.', '');
      return;
    }
    try {
      var data = parseInput();
      if (control('sort-keys').checked) data = sortKeysDeep(data);
      if (mode === 'validate') {
        var kind = Array.isArray(data) ? 'array' : typeof data;
        status('✓ Valid JSON — top-level ' + kind + ', ' + byteLength(text).toLocaleString('en-US') + ' bytes.', 'ok');
        return;
      }
      if (mode === 'minify') {
        var min = JSON.stringify(data);
        setOutput('output', min);
        var saved = byteLength(text) - byteLength(min);
        status('Minified — saved ' + saved.toLocaleString('en-US') + ' bytes (' + byteLength(min).toLocaleString('en-US') + ' bytes total).', 'ok');
        return;
      }
      var ind = control('indent').value;
      var indent = ind === 'tab' ? '\t' : parseInt(ind, 10);
      setOutput('output', JSON.stringify(data, null, indent));
      status('✓ Valid JSON, formatted.', 'ok');
    } catch (err) {
      status('✗ ' + explainError(text, err), 'error');
    }
  }

  onAction('format', function () { run('format'); });
  onAction('minify', function () { run('minify'); });
  onAction('validate', function () { run('validate'); });
  onAction('download', function () {
    var content = outputEl('output').value || control('input').value;
    if (!content.trim()) { status('Nothing to download yet.', ''); return; }
    try {
      if (outputEl('output').value) JSON.parse(outputEl('output').value);
    } catch (err) {
      status('Format the JSON first — the output is not valid yet.', 'error');
      return;
    }
    var blob = new Blob([content], { type: 'application/json' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'formatted.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
    status('Downloaded formatted.json.', 'ok');
  });
})();
