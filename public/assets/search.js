/* Client-side search for /search. Render results with DOM APIs, never HTML strings. */
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
      indexPromise = fetch('/search.json').then(function (response) {
        if (!response.ok) throw new Error('Search index could not be loaded.');
        return response.json();
      }).then(function (items) {
        if (!Array.isArray(items)) throw new Error('Search index has an invalid format.');
        return items;
      });
    }
    return indexPromise;
  }

  function score(item, tokens) {
    var title = String(item.t || '').toLowerCase();
    var category = String(item.c || '').toLowerCase();
    var blurb = String(item.d || '').toLowerCase();
    var total = 0;
    for (var i = 0; i < tokens.length; i++) {
      var token = tokens[i], value = 0;
      if (title === token) value += 30;
      if (title.indexOf(token) !== -1) value += 12;
      if (title.indexOf(token) === 0) value += 6;
      if (category.indexOf(token) !== -1) value += 5;
      if (blurb.indexOf(token) !== -1) value += 3;
      if (value === 0) return 0;
      total += value;
    }
    return total;
  }

  function card(item) {
    // Registry IDs are slugs, but validate before using one in a URL.
    var id = String(item.i || '');
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id)) return null;

    var article = document.createElement('article');
    article.className = 'tool-card';
    var link = document.createElement('a');
    link.className = 'tool-card-link';
    link.href = '/tools/' + encodeURIComponent(id);

    var emoji = document.createElement('span');
    emoji.className = 'tool-card-emoji';
    emoji.setAttribute('aria-hidden', 'true');
    emoji.textContent = String(item.e || '🔧');

    var body = document.createElement('span');
    body.className = 'tool-card-body';
    var title = document.createElement('h3');
    title.textContent = String(item.t || 'Untitled tool');
    var description = document.createElement('p');
    description.className = 'muted';
    description.textContent = String(item.d || '');
    var meta = document.createElement('span');
    meta.className = 'tool-card-meta';
    var category = document.createElement('span');
    category.className = 'chip';
    category.textContent = String(item.c || 'Other');
    var free = document.createElement('span');
    free.className = 'chip chip-free';
    free.textContent = 'Free';

    meta.appendChild(category);
    meta.appendChild(free);
    body.appendChild(title);
    body.appendChild(description);
    body.appendChild(meta);
    link.appendChild(emoji);
    link.appendChild(body);
    article.appendChild(link);
    return article;
  }

  var lastQuery = null;
  function run(rawQuery) {
    var query = String(rawQuery || '').trim().toLowerCase();
    if (query === lastQuery) return;
    lastQuery = query;
    if (!query) {
      resultsEl.replaceChildren();
      if (metaEl) metaEl.textContent = 'Type above to search the complete tool library.';
      if (fallback) fallback.hidden = false;
      return;
    }
    var tokens = query.split(/[^a-z0-9]+/).filter(Boolean);
    if (!tokens.length) return;

    loadIndex().then(function (items) {
      var hits = items.map(function (item) { return { item: item, score: score(item, tokens) }; })
        .filter(function (hit) { return hit.score > 0; })
        .sort(function (a, b) { return b.score - a.score; })
        .slice(0, 24);
      var grid = document.createElement('div');
      grid.className = 'tool-grid';
      hits.forEach(function (hit) {
        var node = card(hit.item);
        if (node) grid.appendChild(node);
      });
      if (fallback) fallback.hidden = true;
      if (metaEl) metaEl.textContent = grid.childElementCount
        ? grid.childElementCount + ' tool' + (grid.childElementCount === 1 ? '' : 's') + ' found'
        : 'No matching tools found. Try a broader keyword.';
      resultsEl.replaceChildren(grid);
    }).catch(function () {
      if (metaEl) metaEl.textContent = 'Search is temporarily unavailable. Please try again.';
      resultsEl.replaceChildren();
      if (fallback) fallback.hidden = false;
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
      } catch (e) {}
      run(input.value);
    }, 130);
  });

  var initial = new URLSearchParams(window.location.search).get('q') || '';
  if (initial) input.value = initial;
  run(initial);
})();
