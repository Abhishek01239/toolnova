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

  function hslToRgb(h, s, l) {
    h /= 360; s /= 100; l /= 100;
    var a = s * Math.min(l, 1 - l);
    function f(n) {
      var k = (n + h * 12) % 12;
      return l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    }
    return [Math.round(f(0) * 255), Math.round(f(8) * 255), Math.round(f(4) * 255)];
  }
  function rgbToHex(r, g, b) {
    return '#' + [r, g, b].map(function (x) { return x.toString(16).padStart(2, '0'); }).join('').toUpperCase();
  }
  function hexToRgb(hex) {
    hex = hex.replace('#', '');
    if (hex.length === 3) hex = hex.split('').map(function (c) { return c + c; }).join('');
    if (!/^[0-9a-fA-F]{6}$/.test(hex)) return null;
    return [parseInt(hex.slice(0, 2), 16), parseInt(hex.slice(2, 4), 16), parseInt(hex.slice(4, 6), 16)];
  }
  function rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    var max = Math.max(r, g, b), min = Math.min(r, g, b);
    var h, s, l = (max + min) / 2;
    if (max === min) { h = s = 0; }
    else {
      var d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }
    return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
  }

  function convert() {
    var mode = control('mode') ? control('mode').value : 'hsl';
    if (mode === 'hsl') {
      var h = Math.max(0, Math.min(360, Number(control('h').value) || 0));
      var s = Math.max(0, Math.min(100, Number(control('s').value) || 0));
      var l = Math.max(0, Math.min(100, Number(control('l').value) || 0));
      var rgb = hslToRgb(h, s, l);
      var hex = rgbToHex(rgb[0], rgb[1], rgb[2]);
      setOutput('result', hex);
      setStats('preview', [['HSL', h + ', ' + s + '%, ' + l + '%'], ['Hex', hex], ['RGB', rgb.join(', ')]]);
      status('Converted HSL to hex.', 'ok');
    } else {
      var hexIn = (control('hex').value || '').trim();
      var rgb = hexToRgb(hexIn);
      if (!rgb) {
        setOutput('result', '');
        setStats('preview', []);
        status('Enter a valid 3- or 6-digit hex color.', 'error');
        return;
      }
      var hsl = rgbToHsl(rgb[0], rgb[1], rgb[2]);
      var result = 'hsl(' + hsl[0] + ', ' + hsl[1] + '%, ' + hsl[2] + '%)';
      setOutput('result', result);
      setStats('preview', [['Hex', hexIn.toUpperCase()], ['HSL', result], ['RGB', rgb.join(', ')]]);
      status('Converted hex to HSL.', 'ok');
    }
  }

  function clear() {
    setOutput('result', '');
    setStats('preview', []);
    status('');
  }

  var btn = root.querySelector('[data-action="convert"]');
  if (btn) btn.addEventListener('click', convert);
  var clr = root.querySelector('[data-action="clear"]');
  if (clr) clr.addEventListener('click', clear);
  convert();
})();
