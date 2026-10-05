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


  function check() {
    var text = control('text').value || '';
    var phrase = (control('phrase').value || '').trim();
    var words = text.trim().split(/\s+/).filter(Boolean);
    if (!words.length) { status('Paste some text.', 'err'); return; }
    if (!phrase) { status('Enter a keyword or phrase.', 'err'); return; }
    var hay = text.toLowerCase();
    var needle = phrase.toLowerCase();
    var count = 0;
    var from = 0;
    while (from <= hay.length) {
      var at = hay.indexOf(needle, from);
      if (at === -1) break;
      count++;
      from = at + needle.length;
    }
    var density = words.length ? (count / words.length) * 100 : 0;
    setOutput('result', (Math.round(density * 100) / 100) + '%');
    setStats('summary', [
      ['Matches', String(count)],
      ['Words', String(words.length)],
      ['Phrase', phrase],
      ['Density', (Math.round(density * 100) / 100) + '%']
    ]);
    status('Calculated phrase density.', 'ok');
  }
  onAction('check', check);

})();
