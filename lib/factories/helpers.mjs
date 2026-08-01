import { truncate } from '../html.js';

// Shared helpers for tool factories.

// Build SEO-safe description/intro/title from a short blurb.
export function composeSEO(title, blurb, site) {
  const suffix = ' Free, fast and private — runs entirely in your browser with no uploads or sign-up.';
  let description = String(blurb).trim().replace(/\.*$/, '.');
  if (description.length < 110) description += suffix;
  description = truncate(description, 168);

  let intro = String(blurb).trim().replace(/\.*$/, '.');
  if (intro.length < 100) intro += suffix;
  intro = truncate(intro, 230);

  const seoTitle = truncate(`${title} — Free Online Tool | ${site.name}`, 80);
  return { description, intro, seoTitle };
}

export function standardFaq(title, whatItDoes) {
  return [
    { q: `What does the ${title} do?`, a: whatItDoes },
    {
      q: 'Is my text or data uploaded to a server?',
      a: `No. The ${title} runs entirely in your browser using JavaScript — nothing you type or paste is sent anywhere, and everything disappears when you close the tab.`
    },
    {
      q: 'Is this tool free to use?',
      a: `Yes, completely free with no sign-up, no watermarks and no usage limits. ${title} is part of a collection of free tools where a new one is added every day.`
    },
    {
      q: 'Does it work on phones and tablets?',
      a: 'Yes. The layout is fully responsive and all processing is done on your device, so it works on any modern phone, tablet or computer — even offline once the page has loaded.'
    }
  ];
}

// Standard IIFE wrapper that gives every generated tool script the same
// helper API: control(), output(), setOutput(), onAction(), status(), setStats().
export function frame(bodySource) {
  return `(function () {
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

${bodySource}
})();
`;
}

// Fill in registry defaults shared by all generated entries.
export function finalizeEntry(entry, catalogItem, ctx) {
  return {
    ...entry,
    id: catalogItem.id,
    category: entry.category || catalogItem.category,
    added: ctx.today,
    popularity: catalogItem.popularity ?? entry.popularity ?? 45,
    keywords: [...new Set([...(entry.keywords || []), ...(catalogItem.keywords || [])])].slice(0, 14)
  };
}

// Render a short, copy-safe "input / output" example line.
export function showSample(sample) {
  const s = String(sample).replace(/\n/g, ' ⏎ ');
  return s.length > 90 ? s.slice(0, 89) + '…' : s;
}
