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

  function shuffle(arr) {
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = arr[i]; arr[i] = arr[j]; arr[j] = t;
    }
    return arr;
  }

  function scrambleWord(word) {
    if (word.length <= 3) return word;
    var chars = word.split('');
    var first = chars.shift();
    var last = chars.pop();
    shuffle(chars);
    return first + chars.join('') + last;
  }

  function scramble() {
    var text = (control('text') && control('text').value || '');
    if (!text.trim()) {
      setOutput('result', '');
      setStats('stats', []);
      status('');
      return;
    }
    var result = text.replace(/\b[a-zA-Z]+\b/g, scrambleWord);
    var words = text.match(/\b[a-zA-Z]+\b/g) || [];
    var longWords = words.filter(function (w) { return w.length > 3; }).length;
    setOutput('result', result);
    setStats('stats', [
      ['Total words', words.length],
      ['Words scrambled', longWords],
      ['Characters', text.length]
    ]);
    status('Scrambled. Click again for a new arrangement.', 'ok');
  }

  function clear() {
    if (control('text')) control('text').value = '';
    setOutput('result', '');
    setStats('stats', []);
    status('');
  }

  var btn = root.querySelector('[data-action="scramble"]');
  if (btn) btn.addEventListener('click', scramble);
  var clr = root.querySelector('[data-action="clear"]');
  if (clr) clr.addEventListener('click', clear);
})();
