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


  function scoreSelector(selector) {
    var s = selector.trim();
    var note = '';
    if (s.indexOf(',') !== -1) {
      s = s.split(',')[0];
      note = 'Scored the first selector only.';
    }
    var a = 0, b = 0, c = 0, d = 0;
    if (/^style$/i.test(s) || s === '') return null;
    var i = 0;
    function peek() { return s[i] || ''; }
    function ident() {
      var start = i;
      while (i < s.length && /[\w-]/.test(s[i])) i++;
      return s.slice(start, i);
    }
    while (i < s.length) {
      var ch = peek();
      if (ch === ' ' || ch === '>' || ch === '+' || ch === '~') { i++; continue; }
      if (ch === '#') { i++; ident(); b++; continue; }
      if (ch === '.') { i++; ident(); c++; continue; }
      if (ch === '[') {
        while (i < s.length && s[i] !== ']') i++;
        if (s[i] === ']') i++;
        c++;
        continue;
      }
      if (ch === ':') {
        i++;
        if (peek() === ':') { i++; ident(); d++; continue; }
        var name = ident();
        var args = '';
        if (peek() === '(') {
          var depth = 0;
          var start = i;
          while (i < s.length) {
            if (s[i] === '(') depth++;
            if (s[i] === ')') { depth--; if (depth === 0) { i++; break; } }
            i++;
          }
          args = s.slice(start + 1, i - 1);
        }
        if (name === 'where') continue;
        if (name === 'is' || name === 'not' || name === 'has') {
          var best = { b: 0, c: 0, d: 0 };
          args.split(',').forEach(function (part) {
            var sub = scoreSelector(part);
            if (!sub) return;
            if (sub.b > best.b || (sub.b === best.b && sub.c > best.c) || (sub.b === best.b && sub.c === best.c && sub.d > best.d)) best = sub;
          });
          b += best.b; c += best.c; d += best.d;
          continue;
        }
        if (name === 'before' || name === 'after' || name === 'placeholder' || name === 'marker' || name === 'selection') d++;
        else c++;
        continue;
      }
      if (ch === '*') { i++; continue; }
      if (/[a-zA-Z_]/.test(ch)) { ident(); d++; continue; }
      i++;
    }
    return { a: a, b: b, c: c, d: d, note: note };
  }
  function score() {
    var selector = control('selector').value.trim();
    if (!selector) { status('Enter a CSS selector.', 'err'); return; }
    var result = scoreSelector(selector);
    if (!result) { status('Could not score that selector.', 'err'); return; }
    var tuple = '(' + result.a + ', ' + result.b + ', ' + result.c + ', ' + result.d + ')';
    setOutput('result', tuple);
    setStats('summary', [
      ['Inline', String(result.a)],
      ['IDs', String(result.b)],
      ['Classes / attributes / pseudo-classes', String(result.c)],
      ['Elements / pseudo-elements', String(result.d)]
    ]);
    status(result.note || 'Calculated specificity.', 'ok');
  }
  onAction('score', score);
  score();

})();
