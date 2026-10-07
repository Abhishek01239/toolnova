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

  var boxes = ['or','ow','ox','gr','gw','gx','otr','otw','otx'];
  function digit(ids) {
    return (control(ids[0]).checked ? 4 : 0) + (control(ids[1]).checked ? 2 : 0) + (control(ids[2]).checked ? 1 : 0);
  }
  function sym(d) {
    return (d & 4 ? 'r' : '-') + (d & 2 ? 'w' : '-') + (d & 1 ? 'x' : '-');
  }
  function show(o, g, t) {
    var oct = '' + o + g + t;
    setOutput('command', 'chmod ' + oct + ' file');
    setOutput('symbolic', sym(o) + sym(g) + sym(t));
    setStats('summary', [
      ['Octal', oct],
      ['Owner', sym(o)],
      ['Group', sym(g)],
      ['Other', sym(t)]
    ]);
    status('Mode ' + oct + '.', 'ok');
  }
  function fromBoxes() {
    show(digit(['or','ow','ox']), digit(['gr','gw','gx']), digit(['otr','otw','otx']));
  }
  function fromOctal() {
    var raw = (control('octal').value || '').trim();
    if (!/^[0-7]{3}$/.test(raw)) { status('Enter exactly three octal digits, for example 644.', 'err'); return; }
    var bits = [4, 2, 1];
    for (var i = 0; i < 3; i++) {
      var d = Number(raw[i]);
      for (var b = 0; b < 3; b++) control(boxes[i * 3 + b]).checked = (d & bits[b]) !== 0;
    }
    show(Number(raw[0]), Number(raw[1]), Number(raw[2]));
  }
  onAction('from-boxes', fromBoxes);
  onAction('from-octal', fromOctal);

})();
