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

  function byteLength(s) {
    return new TextEncoder().encode(s).length;
  }

  function minifyHtml(html) {
    // Remove comments
    var s = html.replace(/<!--[\s\S]*?-->/g, '');
    // Collapse whitespace between tags
    s = s.replace(/>\s+</g, '><');
    // Collapse multiple spaces
    s = s.replace(/\s{2,}/g, ' ');
    return s.trim();
  }

  function run() {
    var text = control('input').value;
    if (!text.trim()) {
      status('Paste some HTML first.', 'error');
      setOutput('output', '');
      setStats('stats', []);
      return;
    }
    var min = minifyHtml(text);
    setOutput('output', min);
    var orig = byteLength(text);
    var neu = byteLength(min);
    var saved = orig - neu;
    var pct = orig ? Math.round((saved / orig) * 100) : 0;
    setStats('stats', [
      ['Original', orig.toLocaleString() + ' bytes'],
      ['Minified', neu.toLocaleString() + ' bytes'],
      ['Saved', saved.toLocaleString() + ' bytes (' + pct + '%)']
    ]);
    status('✓ Minified — saved ' + pct + '%.', 'ok');
  }

  onAction('minify', run);
  onAction('clear', function() {
    control('input').value = '';
    setOutput('output', '');
    setStats('stats', []);
    status('');
  });
})();
