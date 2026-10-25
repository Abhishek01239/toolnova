(function () {
  'use strict';
  var root = document.getElementById('tool-app');
  if (!root) return;
  function control(id) { return root.querySelector('[data-control="' + id + '"]'); }
  function outputEl(id) { return root.querySelector('[data-output="' + id + '"]'); }
  function setOutput(id, value) {
    var el = outputEl(id);
    if (!el) return;
    if ('value' in el) el.value = value;
    else el.textContent = value;
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
  function onAction(id, fn) {
    var btn = root.querySelector('[data-action="' + id + '"]');
    if (btn) btn.addEventListener('click', function () { fn(btn); });
  }

  function minify(css) {
    return css
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\s+/g, ' ')
      .replace(/\s*([{}:;,])\s*/g, '$1')
      .replace(/;}/g, '}')
      .trim();
  }

  function run() {
    var css = control('css') ? control('css').value : '';
    if (!css.trim()) {
      setOutput('result', '');
      setStats('stats', []);
      return;
    }
    var min = minify(css);
    setOutput('result', min);
    var orig = new Blob([css]).size;
    var news = new Blob([min]).size;
    var saved = orig > 0 ? Math.round((1 - news / orig) * 100) : 0;
    setStats('stats', [
      ['Original', orig + ' bytes'],
      ['Minified', news + ' bytes'],
      ['Saved', saved + '%']
    ]);
  }

  onAction('minify', run);
  onAction('copy', function () {
    var el = outputEl('result');
    if (el && el.value) navigator.clipboard.writeText(el.value);
  });
  onAction('clear', function () {
    if (control('css')) control('css').value = '';
    setOutput('result', '');
    setStats('stats', []);
  });
})();
