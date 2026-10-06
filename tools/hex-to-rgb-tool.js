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
  function clamp(n) { n = Math.round(Number(n)); if (isNaN(n)) n = 0; return Math.max(0, Math.min(255, n)); }
  function hexByte(n) { return clamp(n).toString(16).toUpperCase().padStart(2, '0'); }
  function hsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    var max = Math.max(r, g, b), min = Math.min(r, g, b);
    var h = 0, s = 0, l = (max + min) / 2;
    var d = max - min;
    if (d) {
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      if (max === r) h = ((g - b) / d) % 6;
      else if (max === g) h = (b - r) / d + 2;
      else h = (r - g) / d + 4;
      h *= 60;
      if (h < 0) h += 360;
    }
    return [Math.round(h), Math.round(s * 100), Math.round(l * 100)];
  }
  function show(r, g, b, hex) {
    var h = hsl(r, g, b);
    setOutput('result', hex + '\nrgb(' + r + ', ' + g + ', ' + b + ')\nhsl(' + h[0] + ', ' + h[1] + '%, ' + h[2] + '%)');
    setStats('summary', [['Hex', hex], ['RGB', r + ', ' + g + ', ' + b], ['HSL', h.join(', ')], ['Preview', hex]]);
    var el = outputEl('summary');
    if (el) el.style.borderLeft = '12px solid ' + hex;
    status('Converted the color.', 'ok');
  }
  function fromHex() {
    var raw = (control('hex').value || '').trim().replace(/^#/, '');
    if (/^[0-9a-fA-F]{3}$/.test(raw)) raw = raw.split('').map(function (c) { return c + c; }).join('');
    if (!/^[0-9a-fA-F]{6}$/.test(raw)) { status('Enter a 3- or 6-digit hex color.', 'err'); return; }
    var r = parseInt(raw.slice(0, 2), 16), g = parseInt(raw.slice(2, 4), 16), b = parseInt(raw.slice(4, 6), 16);
    control('red').value = r; control('green').value = g; control('blue').value = b;
    show(r, g, b, '#' + raw.toUpperCase());
  }
  function fromRgb() {
    var r = clamp(control('red').value), g = clamp(control('green').value), b = clamp(control('blue').value);
    control('red').value = r; control('green').value = g; control('blue').value = b;
    var hex = '#' + hexByte(r) + hexByte(g) + hexByte(b);
    control('hex').value = hex;
    show(r, g, b, hex);
  }
  onAction('fromhex', fromHex);
  onAction('fromrgb', fromRgb);
  fromHex();
})();
