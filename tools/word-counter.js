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
  function readControls(defs) {
    var vals = {};
    defs.forEach(function (d) {
      var el = control(d.id);
      if (!el) { vals[d.id] = d.value; return; }
      if (d.type === 'checkbox') vals[d.id] = el.checked;
      else if (d.type === 'number' || d.type === 'range') vals[d.id] = parseFloat(el.value) || 0;
      else vals[d.id] = el.value;
    });
    return vals;
  }

  var STOP_WORDS = ["the","be","to","of","and","a","in","that","have","i","it","for","not","on","with","he","as","you","do","at","this","but","his","by","from","they","we","say","her","she","or","an","will","my","one","all","would","there","their","what","so","up","out","if","about","who","get","which","go","me","when","make","can","like","time","no","just","him","know","take","people","into","year","your","good","some","could","them","see","other","than","then","now","look","only","come","its","over","think","also","back","after","use","two","how","our","work","first","well","way","even","new","want","because","any","these","give","day","most","us","is","are","was","were","been","has","had","did","am"];
  var compute = function computeWordStats(text, stopwords) {
  var stop = new Set(stopwords || []);
  var words = text.match(/[\p{L}\p{N}]+(?:['’-][\p{L}\p{N}]+)*/gu) || [];
  var sentences = text.split(/[.!?]+/).map(function (s) { return s.trim(); }).filter(function (s) { return s.length > 0; }).length;
  var paragraphs = text.split(/\n\s*\n/).map(function (s) { return s.trim(); }).filter(function (s) { return s.length > 0; }).length;

  var freq = new Map();
  for (var i = 0; i < words.length; i++) {
    var w = words[i].toLowerCase().replace(/^['’-]+|['’-]+$/g, '');
    if (w.length < 3 || stop.has(w) || /^\d+$/.test(w)) continue;
    freq.set(w, (freq.get(w) || 0) + 1);
  }
  var keywords = [...freq.entries()]
    .sort(function (a, b) { return b[1] - a[1] || a[0].localeCompare(b[0]); })
    .slice(0, 8)
    .map(function (entry) {
      return { word: entry[0], count: entry[1], percent: words.length ? (entry[1] / words.length) * 100 : 0 };
    });

  return {
    words: words.length,
    characters: text.length,
    charactersNoSpaces: text.replace(/\s/g, '').length,
    sentences: sentences,
    paragraphs: paragraphs,
    lines: text === '' ? 0 : text.split('\n').length,
    readingSeconds: Math.ceil((words.length / 200) * 60),
    speakingSeconds: Math.ceil((words.length / 130) * 60),
    keywords: keywords
  };
};
  var fmtDuration = function formatDuration(totalSeconds) {
  if (totalSeconds < 60) return totalSeconds + ' sec';
  var minutes = Math.floor(totalSeconds / 60);
  var seconds = totalSeconds % 60;
  if (minutes < 60) return minutes + ' min' + (seconds ? ' ' + seconds + ' sec' : '');
  var hours = Math.floor(minutes / 60);
  var restMin = minutes % 60;
  return hours + ' h' + (restMin ? ' ' + restMin + ' min' : '');
};

  function render() {
    var stats = compute(control('text').value, STOP_WORDS);
    setStats('stats', [
      ['Words', stats.words.toLocaleString('en-US')],
      ['Characters', stats.characters.toLocaleString('en-US')],
      ['No spaces', stats.charactersNoSpaces.toLocaleString('en-US')],
      ['Sentences', stats.sentences.toLocaleString('en-US')],
      ['Paragraphs', stats.paragraphs.toLocaleString('en-US')],
      ['Lines', stats.lines.toLocaleString('en-US')],
      ['Reading time', fmtDuration(stats.readingSeconds)],
      ['Speaking time', fmtDuration(stats.speakingSeconds)]
    ]);
    var kw = stats.keywords.map(function (k) {
      return k.word + ' — ' + k.count + '× (' + k.percent.toFixed(1) + '%)';
    });
    setOutput('keywords', kw.length ? kw.join('\n') : '—');
    if (stats.words > 0) status(stats.words.toLocaleString('en-US') + ' words counted.', 'ok');
    else status('');
  }

  control('text').addEventListener('input', render);
  onAction('clear', function () {
    control('text').value = '';
    control('text').focus();
    render();
  });
  render();
})();
