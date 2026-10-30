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
    if (btn) btn.addEventListener('click', fn);
  }

  function countChars() {
    var text = (control('input') && control('input').value) || '';
    if (!text) {
      setOutput('result', 'Please enter some text.');
      setStats('summary', []);
      return;
    }
    var freq = {};
    for (var i = 0; i < text.length; i++) {
      var c = text[i];
      freq[c] = (freq[c] || 0) + 1;
    }
    var entries = Object.keys(freq).map(function (k) { return [k, freq[k]]; });
    entries.sort(function (a, b) { return b[1] - a[1] || a[0].localeCompare(b[0]); });
    var lines = entries.map(function (pair) {
      var display = pair[0] === ' ' ? '(space)' : pair[0] === '\n' ? '(newline)' : pair[0] === '\t' ? '(tab)' : pair[0] === '\r' ? '(cr)' : pair[0];
      return display + ': ' + pair[1];
    });
    setOutput('result', lines.join('\n'));

    var total = text.length;
    var letters = 0, digits = 0, spaces = 0, other = 0;
    for (var j = 0; j < text.length; j++) {
      var ch = text[j];
      if (/[a-zA-Z]/.test(ch)) letters++;
      else if (/[0-9]/.test(ch)) digits++;
      else if (/\s/.test(ch)) spaces++;
      else other++;
    }
    setStats('summary', [
      ['Total characters', total],
      ['Unique characters', entries.length],
      ['Letters', letters],
      ['Digits', digits],
      ['Whitespace', spaces],
      ['Other', other]
    ]);
  }

  onAction('count', countChars);
  onAction('clear', function () {
    if (control('input')) control('input').value = '';
    setOutput('result', '');
    setStats('summary', []);
  });
})();
