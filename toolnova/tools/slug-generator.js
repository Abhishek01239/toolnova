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

  var STOP_WORDS = ["a","an","and","the","or","but","of","at","by","for","with","about","into","to","in","on","is","are","was","were","be","been","it","its","as","from","that","this","these","those"];
  var slugify = function slugify(text, options) {
  var opts = options || {};
  var separator = opts.separator === undefined ? '-' : opts.separator;
  var stopwords = opts.stopwords || [];
  var maxLength = opts.maxLength || 0;

  var cleaned = String(text)
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/['’]/g, '');

  // ASCII-only slugs: scripts without a Latin mapping are omitted, matching
  // what WordPress and most CMSs do for non-Latin titles.
  var words = cleaned.match(/[a-z0-9]+/g) || [];
  var stop = new Set(stopwords);
  words = words.filter(function (w) { return !stop.has(w); });

  var slug = words.join(separator);
  if (maxLength > 0 && slug.length > maxLength) {
    slug = slug.slice(0, maxLength);
    var cut = slug.lastIndexOf(separator);
    if (cut > 0) slug = slug.slice(0, cut);
  }
  var edge = new RegExp('^[' + separator.replace(/[-]/g, '\\-') + ']+|[' + separator.replace(/[-]/g, '\\-') + ']+$', 'g');
  return slug.replace(edge, '');
};

  function convert() {
    var maxLen = parseInt(control('max-length').value, 10);
    var opts = {
      separator: control('separator').value,
      stopwords: control('remove-stopwords').checked ? STOP_WORDS : [],
      maxLength: isFinite(maxLen) && maxLen > 0 ? maxLen : 0
    };
    var lines = control('input').value.split('\n')
      .map(function (l) { return l.trim(); })
      .filter(function (l) { return l.length > 0; });
    var slugs = lines.map(function (l) { return slugify(l, opts); });
    setOutput('output', slugs.join('\n'));
    if (lines.length) {
      status(slugs.length + ' slug' + (slugs.length === 1 ? '' : 's') + ' generated.', 'ok');
    } else {
      status('');
    }
  }

  ['input', 'separator', 'remove-stopwords', 'max-length'].forEach(function (id) {
    var el = control(id);
    el.addEventListener('input', convert);
    el.addEventListener('change', convert);
  });
  convert();
})();
