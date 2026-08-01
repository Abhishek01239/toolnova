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

  var LATIN = ["lorem","ipsum","dolor","sit","amet","consectetur","adipiscing","elit","sed","do","eiusmod","tempor","incididunt","ut","labore","et","dolore","magna","aliqua","enim","ad","minim","veniam","quis","nostrud","exercitation","ullamco","laboris","nisi","aliquip","ex","ea","commodo","consequat","duis","aute","irure","in","reprehenderit","voluptate","velit","esse","cillum","fugiat","nulla","pariatur","excepteur","sint","occaecat","cupidatat","non","proident","sunt","culpa","qui","officia","deserunt","mollit","anim","id","est","laborum","perspiciatis","unde","omnis","iste","natus","error","voluptatem","accusantium","doloremque","laudantium","totam","rem","aperiam","eaque","ipsa","quae","ab","illo","inventore","veritatis","quasi","architecto","beatae","vitae","dicta","explicabo","nemo","ipsam","quia","voluptas","aspernatur","aut","odit","fugit","consequuntur","magni","ratione","neque","porro","quisquam","dolorem","adipisci","numquam","eius","modi","tempora","magnam","quaerat","minima","nostrum","exercitationem","ullam","corporis","suscipit","laboriosam","commodi","sequi","nesciunt","aliquid","eos"];
  function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
  function makeWords(wordCount, latin, rng, startClassic) {
  var out = [];
  for (var i = 0; i < wordCount; i++) {
    if (startClassic && i === 0) out.push('lorem');
    else if (startClassic && i === 1) out.push('ipsum');
    else out.push(latin[Math.floor(rng() * latin.length)]);
  }
  return out;
}
  function makeSentences(count, latin, rng, startClassic) {
  var sentences = [];
  var skipClassic = false;
  for (var s = 0; s < count; s++) {
    var len = 6 + Math.floor(rng() * 9);
    var words = makeWords(len, latin, rng, startClassic && !skipClassic);
    skipClassic = true;
    sentences.push(capitalize(words.join(' ')) + '.');
  }
  return sentences.join(' ');
}
  function makeParagraphs(count, latin, rng, startClassic) {
  var paragraphs = [];
  var first = true;
  for (var p = 0; p < count; p++) {
    var sentenceCount = 3 + Math.floor(rng() * 3);
    paragraphs.push(makeSentences(sentenceCount, latin, rng, startClassic && first));
    first = false;
  }
  return paragraphs.join('\n\n');
}

  function go() {
    var type = control('type').value;
    var count = parseInt(control('count').value, 10);
    if (!isFinite(count)) count = 3;
    count = Math.max(1, Math.min(100, count));
    var classic = control('classic').checked;
    var text;
    if (type === 'words') {
      text = capitalize(makeWords(count, LATIN, Math.random, classic).join(' ')) + '.';
    } else if (type === 'sentences') {
      text = makeSentences(count, LATIN, Math.random, classic);
    } else {
      text = makeParagraphs(count, LATIN, Math.random, classic);
      if (control('html').checked) {
        text = text.split('\n\n').map(function (p) { return '<p>' + p + '</p>'; }).join('\n');
      }
    }
    setOutput('output', text);
    var words = (text.replace(/<[^>]+>/g, ' ').match(/\S+/g) || []).length;
    status(words.toLocaleString('en-US') + ' words generated.', 'ok');
  }

  onAction('generate', go);
  ['type', 'count', 'classic', 'html'].forEach(function (id) {
    control(id).addEventListener('change', go);
  });
  go();
})();
