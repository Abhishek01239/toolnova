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
  function onAction(id, fn) {
    var btn = root.querySelector('[data-action="' + id + '"]');
    if (btn) btn.addEventListener('click', function () { fn(btn); });
  }

  var words = ['lorem','ipsum','dolor','sit','amet','consectetur','adipiscing','elit','sed','do','eiusmod','tempor','incididunt','ut','labore','et','dolore','magna','aliqua','ut','enim','ad','minim','veniam','quis','nostrud','exercitation','ullamco','laboris','nisi','ut','aliquip','ex','ea','commodo','consequat','duis','aute','irure','dolor','in','reprehenderit','in','voluptate','velit','esse','cillum','dolore','eu','fugiat','nulla','pariatur','excepteur','sint','occaecat','cupidatat','non','proident','sunt','in','culpa','qui','officia','deserunt','mollit','anim','id','est','laborum'];

  function randomWord() { return words[Math.floor(Math.random() * words.length)]; }

  function sentence() {
    var len = 6 + Math.floor(Math.random() * 10);
    var s = [];
    for (var i = 0; i < len; i++) s.push(randomWord());
    s[0] = s[0].charAt(0).toUpperCase() + s[0].slice(1);
    return s.join(' ') + '.';
  }

  function paragraph() {
    var len = 3 + Math.floor(Math.random() * 5);
    var p = [];
    for (var i = 0; i < len; i++) p.push(sentence());
    return p.join(' ');
  }

  function generate() {
    var count = parseInt(control('count').value, 10) || 3;
    count = Math.min(Math.max(count, 1), 50);
    var unit = control('unit').value;
    var out = [];
    if (unit === 'words') {
      for (var i = 0; i < count; i++) out.push(randomWord());
      setOutput('output', out.join(' '));
    } else if (unit === 'sentences') {
      for (var i = 0; i < count; i++) out.push(sentence());
      setOutput('output', out.join(' '));
    } else {
      for (var i = 0; i < count; i++) out.push(paragraph());
      setOutput('output', out.join('\n\n'));
    }
  }

  onAction('generate', generate);
  generate();
})();
