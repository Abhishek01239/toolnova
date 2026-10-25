(function () {
  'use strict';
  var root = document.getElementById('tool-app');
  if (!root) return;
  function control(id) { return root.querySelector('[data-control="' + id + '"]'); }
  function outputEl(id) { return root.querySelector('[data-output="' + id + '"]'); }
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
  function setOutput(id, value) {
    var el = outputEl(id);
    if (!el) return;
    if ('value' in el) el.value = value;
    else el.textContent = value;
  }
  function onAction(id, fn) {
    var btn = root.querySelector('[data-action="' + id + '"]');
    if (btn) btn.addEventListener('click', function () { fn(btn); });
  }

  function countSyllables(word) {
    word = word.toLowerCase().replace(/[^a-z]/g, '');
    if (word.length <= 3) return 1;
    word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
    word = word.replace(/^y/, '');
    var matches = word.match(/[aeiouy]{1,2}/g);
    return matches ? matches.length : 1;
  }

  function analyze() {
    var text = (control('text') && control('text').value || '').trim();
    if (!text) {
      setStats('summary', []);
      setOutput('details', '');
      return;
    }
    var sentences = text.split(/[.!?]+/).filter(function (s) { return s.trim().length > 0; }).length || 1;
    var words = text.split(/\s+/).filter(function (w) { return w.length > 0; });
    var wordCount = words.length || 1;
    var syllables = words.reduce(function (sum, w) { return sum + countSyllables(w); }, 0);
    var avgSent = wordCount / sentences;
    var avgSyl = syllables / wordCount;
    var flesch = 206.835 - 1.015 * avgSent - 84.6 * avgSyl;
    flesch = Math.max(0, Math.min(100, flesch));
    var grade = 0.39 * avgSent + 11.8 * avgSyl - 15.59;
    grade = Math.max(0, grade);
    var easeLabel = flesch >= 90 ? 'Very Easy' : flesch >= 80 ? 'Easy' : flesch >= 70 ? 'Fairly Easy' : flesch >= 60 ? 'Standard' : flesch >= 50 ? 'Fairly Difficult' : flesch >= 30 ? 'Difficult' : 'Very Difficult';

    setStats('summary', [
      ['Flesch Reading Ease', flesch.toFixed(1) + ' (' + easeLabel + ')'],
      ['Flesch-Kincaid Grade', grade.toFixed(1)],
      ['Sentences', String(sentences)],
      ['Words', String(wordCount)],
      ['Syllables', String(syllables)]
    ]);
    setOutput('details', 'Average words per sentence: ' + avgSent.toFixed(1) + '\nAverage syllables per word: ' + avgSyl.toFixed(2) + '\n\nHigher Flesch scores mean easier text. Grade level estimates US school grade.');
  }

  onAction('analyze', analyze);
  onAction('clear', function () {
    if (control('text')) control('text').value = '';
    setStats('summary', []);
    setOutput('details', '');
  });
  if (control('text')) control('text').addEventListener('input', analyze);
})();
