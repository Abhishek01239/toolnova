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
  function parse(raw) {
    raw = (raw || '').trim().replace(/^#/, '');
    if (/^[0-9a-fA-F]{3}$/.test(raw)) raw = raw.split('').map(function (c) { return c + c; }).join('');
    if (!/^[0-9a-fA-F]{6}$/.test(raw)) return null;
    return [parseInt(raw.slice(0, 2), 16), parseInt(raw.slice(2, 4), 16), parseInt(raw.slice(4, 6), 16)];
  }
  function mix(rgb, target, amount) {
    return rgb.map(function (c, i) { return Math.round(c + (target[i] - c) * amount); });
  }
  function hex(rgb) {
    return '#' + rgb.map(function (c) { return c.toString(16).toUpperCase().padStart(2, '0'); }).join('');
  }
  function build() {
    var rgb = parse(control('hex').value);
    if (!rgb) { status('Enter a 3- or 6-digit hex color.', 'err'); return; }
    var steps = [
      ['Light 40%', mix(rgb, [255, 255, 255], 0.4)],
      ['Light 20%', mix(rgb, [255, 255, 255], 0.2)],
      ['Base', rgb],
      ['Dark 20%', mix(rgb, [0, 0, 0], 0.2)],
      ['Dark 40%', mix(rgb, [0, 0, 0], 0.4)]
    ];
    setOutput('result', steps.map(function (s) { return hex(s[1]) + '  ' + s[0]; }).join('\n'));
    setStats('summary', steps.map(function (s) { return [s[0], hex(s[1])]; }));
    status('Built a five-step palette.', 'ok');
  }
  onAction('build', build);
  build();
})();
