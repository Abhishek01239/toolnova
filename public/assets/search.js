/* Client-side search for /search — reads ?q=, scores against /search.json,
   renders live results as you type. No server round-trips after load. */
(function () {
  'use strict';

  var input = document.getElementById('search-input');
  var resultsEl = document.getElementById('results');
  var metaEl = document.getElementById('search-results-meta');
  var fallback = document.getElementById('search-fallback');
  if (!input || !resultsEl) return;

  var indexPromise = null;
  function loadIndex() {
    if (!indexPromise) {
      indexPromise = fetch('/search.json').then(function (r) { return r.json(); });
    }
    return indexPromise;
  }

  function escText(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function score(item, tokens) {
    var title = item.t.toLowerCase();
    var c = item.c.toLowerCase();
    var b = (item.d || '').toLowerCase();
    var total = 0;
    for (var i = 0; i < tokens.length; i++) {
      var tok = tokens[i];
      var s = 0;
      if (title === tok) s += 30;
      if (title.indexOf(tok) !== -1) s += 12;
      if (title.indexOf(tok) === 0) s += 6;
      if (c.indexOf(tok) !== -1) s += 5;
      if (b.indexOf(tok) !== -1) s += 3;
      if (s === 0) return 0; // every token must match something
      total += s;
    }
    return total;
  }

  function card(item) {
    var desc = escText(item.d || '');
    return '<article class="tool-card"><a class="tool-card-link" href="/tools/' + encodeURIComponent(item.i) + '">' +
      '<span class="tool-card-emoji" aria-hidden="true">' + (item.e || '🔧') + '</span>' +
      '<span class="tool-card-body"><h3>' + escText(item.t) + '</h3>' +
      '<p class="muted">' + desc + '</p>' +
      '<span class="tool-card-meta"><span class="chip">' + escText(item.c) + '</span>' +
      '<span class="chip chip-free">Free</span></span></span></a></article>';
  }

  var lastQuery = null;
  function run(rawQuery) {
    var q = rawQuery.trim().toLowerCase();
    if (q === lastQuery) return;
    lastQuery = q;
    if (!q) {
      resultsEl.innerHTML = '';
      if (metaEl) metaEl.textContent = 'Type above to search all tools.';
      if (fallback) fallback.hidden = false;
      return;
    }
    var tokens = q.split(/[^a-z0-9]+/).filter(Boolean);
    if (!tokens.length) return;
    loadIndex().then(function (items) {
      var hits = items
        .map(function (it) { return { it: it, s: score(it, tokens) }; })
        .filter(function (h) { return h.s > 0; })
        .sort(function (a, b) { return b.s - a.s; })
        .slice(0, 24);
      if (fallback) fallback.hidden = true;
      if (metaEl) {
        metaEl.textContent = hits.length
          ? hits.length + ' tool' + (hits.length === 1 ? '' : 's') + ' found'
          : 'No tools match "' + rawQuery.trim() + '" yet — a new tool is added every day.';
      }
      resultsEl.innerHTML = '<div class="tool-grid">' + hits.map(function (h) { return card(h.it); }).join('') + '</div>';
    });
  }

  var debounceTimer = null;
  input.addEventListener('input', function () {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(function () {
      try {
        var url = new URL(window.location.href);
        if (input.value.trim()) url.searchParams.set('q', input.value.trim());
        else url.searchParams.delete('q');
        window.history.replaceState(null, '', url.toString());
      } catch (e) { /* noop */ }
      run(input.value);
    }, 130);
  });

  var initial = new URLSearchParams(window.location.search).get('q') || '';
  if (initial) input.value = initial;
  run(initial);
})();
