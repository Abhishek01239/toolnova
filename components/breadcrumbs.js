import { esc, escAttr } from '../lib/html.js';

// Visible breadcrumbs (paired with BreadcrumbList JSON-LD from lib/seo.js).
// items: [{ name, path? }] — the last item is the current page (no link).
export function breadcrumbs(items) {
  const lis = items.map((item, i) => {
    const last = i === items.length - 1;
    const label = `[ ${item.name.toUpperCase()} ]`;
    if (last || !item.path) {
      return `<li aria-current="page">${esc(label)}</li>`;
    }
    return `<li><a href="${escAttr(item.path)}">${esc(label)}</a></li>`;
  }).join('');
  return `<nav class="breadcrumbs" aria-label="Breadcrumb"><ol>${lis}</ol></nav>`;
}

