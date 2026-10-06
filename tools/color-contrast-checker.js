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

  function parseHex(input) {
    var h = String(input || '').trim().replace(/^#/, '');
    if (!/^[0-9a-fA-F]{3}$|^[0-9a-fA-F]{6}$/.test(h)) return null;
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  }
  function channel(c) {
    var s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  }
  function lum(rgb) {
    return 0.2126 * channel(rgb[0]) + 0.7152 * channel(rgb[1]) + 0.0722 * channel(rgb[2]);
  }
  function mark(ok) { return ok ? 'Pass' : 'Fail'; }

  function check() {
    var fg = parseHex(control('fg').value);
    var bg = parseHex(control('bg').value);
    if (!fg || !bg) { status('Enter #RGB or #RRGGBB colors.', 'err'); return; }
    var l1 = lum(fg);
    var l2 = lum(bg);
    var lighter = Math.max(l1, l2);
    var darker = Math.min(l1, l2);
    var ratio = (lighter + 0.05) / (darker + 0.05);
    var shown = (Math.round(ratio * 100) / 100).toFixed(2);
    setOutput('result', 'Contrast ratio ' + shown + ':1\nNormal text AA (4.5:1): ' + mark(ratio >= 4.5) + '\nNormal text AAA (7:1): ' + mark(ratio >= 7) + '\nLarge text AA (3:1): ' + mark(ratio >= 3) + '\nLarge text AAA (4.5:1): ' + mark(ratio >= 4.5) + '\nUI graphics AA (3:1): ' + mark(ratio >= 3));
    setStats('summary', [
      ['Ratio', shown + ':1'],
      ['AA normal', mark(ratio >= 4.5)],
      ['AAA normal', mark(ratio >= 7)],
      ['AA large / UI', mark(ratio >= 3)]
    ]);
    status('Checked contrast.', 'ok');
  }
  onAction('check', check);
  check();
})();
