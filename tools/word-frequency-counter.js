(function () {
  'use strict';
  var root = document.getElementById('tool-app');
  if (!root) return;
  function control(id) { return root.querySelector('[data-control="' + id + '"]'); }
  function outputEl(id) { return root.querySelector('[data-output="' + id + '"]'); }
  function onAction(id, fn) {
    var btn = root.querySelector('[data-action="' + id + '"]');
    if (btn) btn.addEventListener('click', function () { fn(btn); });
  }
  var STOP = new Set('a an and are as at be but by for from has have he her his i in is it its of on or that the their them they this to was were will with you your'.split(' '));
  function count() {
    var text = (control('input') && control('input').value) || '';
    var ignore = control('ignoreStop') && control('ignoreStop').checked;
    var words = text.toLowerCase().match(/[a-z0-9']+/g) || [];
    var freq = {};
    words.forEach(function (w) {
      if (ignore && STOP.has(w)) return;
      if (w.length < 2) return;
      freq[w] = (freq[w] || 0) + 1;
    });
    var sorted = Object.keys(freq).map(function (k) { return [k, freq[k]]; }).sort(function (a, b) { return b[1] - a[1]; });
    var el = outputEl('result');
    if (el) el.textContent = sorted.length ? sorted.slice(0, 50).map(function (p) { return p[0] + ': ' + p[1]; }).join('\n') : 'No words found.';
  }
  onAction('count', count);
})();
