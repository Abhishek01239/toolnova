(function () {
  'use strict';
  var root = document.getElementById('tool-app');
  if (!root) return;
  function control(id) { return root.querySelector('[data-control="' + id + '"]'); }
  function outputEl(id) { return root.querySelector('[data-output="' + id + '"]'); }
  function setStats(id, entries) {
    var el = outputEl(id);
    if (!el) return;
    el.replaceChildren();
    entries.forEach(function (pair) {
      var wrap = document.createElement('div');
      wrap.className = 'stat';
      var dt = document.createElement('dt');
      dt.textContent = String(pair[0] || '');
      var dd = document.createElement('dd');
      dd.textContent = String(pair[1] || '');
      wrap.appendChild(dt);
      wrap.appendChild(dd);
      el.appendChild(wrap);
    });
  }
  function onAction(id, fn) {
    var btn = root.querySelector('[data-action="' + id + '"]');
    if (btn) btn.addEventListener('click', function () { fn(btn); });
  }
  function preview() {
    var raw = (control('input') && control('input').value || '').trim();
    var el = outputEl('preview');
    if (!el) return;
    if (!raw) { setStats('preview', [['Status', 'Paste Base64 data']]); return; }
    var src = raw;
    if (!raw.startsWith('data:')) {
      src = 'data:image/png;base64,' + raw.replace(/\s/g, '');
    }
    var img = document.createElement('img');
    img.style.maxWidth = '100%';
    img.style.height = 'auto';
    img.style.borderRadius = '8px';
    img.alt = 'Base64 preview';
    img.onload = function () {
      setStats('preview', [['Status', 'Image loaded'], ['Size', img.naturalWidth + ' × ' + img.naturalHeight + ' px']]);
      el.appendChild(img);
    };
    img.onerror = function () {
      setStats('preview', [['Status', 'Could not load image. Check the Base64 data.']]);
    };
    img.src = src;
    el.replaceChildren();
  }
  onAction('preview', preview);
})();
