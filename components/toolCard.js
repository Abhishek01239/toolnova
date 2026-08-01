import { esc, escAttr } from '../lib/html.js';
import { categoryEmoji, categorySlug } from '../lib/categories.js';

export function toolCard(tool) {
  const emoji = categoryEmoji(tool.category);
  return `<article class="tool-card">
  <a class="tool-card-link" href="/tools/${escAttr(tool.id)}">
    <span class="tool-card-emoji" aria-hidden="true">${emoji}</span>
    <span class="tool-card-body">
      <h3>${esc(tool.title)}</h3>
      <p class="muted">${esc(tool.blurb || tool.description)}</p>
      <span class="tool-card-meta">
        <span class="chip">[ ${esc(tool.category.toUpperCase())} ]</span>
        <span class="chip chip-free">[ FREE ]</span>
      </span>
    </span>
  </a>
</article>`;
}

export function toolGrid(tools) {
  if (!tools.length) return '<p class="muted">No tools here yet — check back tomorrow.</p>';
  return `<div class="tool-grid">${tools.map(toolCard).join('\n')}</div>`;
}

export function categoryChip(name, count) {
  const countStr = count !== undefined ? ` (${count})` : '';
  return `<a class="category-chip" href="/category/${categorySlug(name)}">
  <span aria-hidden="true">${categoryEmoji(name)}</span> [ ${esc(name.toUpperCase())}${countStr} ]
</a>`;
}

