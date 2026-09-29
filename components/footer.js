import { esc, escAttr } from '../lib/html.js';
import { categoryEmoji, categorySlug } from '../lib/categories.js';

export function footer(site, tools) {
  const byCategory = new Map();
  for (const tool of tools) {
    if (!byCategory.has(tool.category)) byCategory.set(tool.category, []);
    byCategory.get(tool.category).push(tool);
  }
  const cats = [...byCategory.entries()]
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, 8)
    .map(([cat, items]) =>
      `<li><a href="/category/${categorySlug(cat)}">${categoryEmoji(cat)} ${esc(cat)} <span class="footer-count">(${items.length})</span></a></li>`
    ).join('');

  const latest = [...tools]
    .sort((a, b) => (a.added < b.added ? 1 : -1))
    .slice(0, 6)
    .map((t) => `<li><a href="/tools/${t.id}">${esc(t.title)}</a></li>`)
    .join('');

  const year = new Date().getFullYear();

  return `<footer class="site-footer">
  <div class="container footer-grid">
    <div class="footer-col footer-brand-col">
      <a class="footer-brand" href="/">${esc(site.name)}</a>
      <p class="muted">${esc(site.description)}</p>
      <p class="muted"><a href="${escAttr(site.repo)}" rel="noopener noreferrer">View source on GitHub →</a></p>
    </div>
    <nav class="footer-col" aria-label="Categories">
      <strong>Explore</strong>
      <ul>${cats}</ul>
    </nav>
    <nav class="footer-col" aria-label="Site information">
      <strong>Information</strong>
      <ul>
        <li><a href="/about">About</a></li>
        <li><a href="/privacy">Privacy Policy</a></li>
        <li><a href="/terms">Terms</a></li>
        <li><a href="/contact">Contact</a></li>
        <li><a href="/sitemap.xml">Sitemap</a></li>
      </ul>
    </nav>
    <nav class="footer-col" aria-label="Latest tools">
      <strong>Recently added</strong>
      <ul>${latest}</ul>
    </nav>
  </div>
  <div class="container footer-bottom muted">
    <span>© ${year} ${esc(site.name)}</span>
    <span>Free browser tools · No account required</span>
  </div>
</footer>`;
}
