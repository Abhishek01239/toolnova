import { esc, escAttr } from '../lib/html.js';
import { categoryEmoji, categorySlug } from '../lib/categories.js';

// The footer is rebuilt from tools.json on every deploy, so category and
// "latest tools" links stay current automatically as the site grows.
export function footer(site, tools) {
  const byCategory = new Map();
  for (const tool of tools) {
    if (!byCategory.has(tool.category)) byCategory.set(tool.category, []);
    byCategory.get(tool.category).push(tool);
  }
  const cats = [...byCategory.entries()]
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, 10)
    .map(([cat, items]) =>
      `<li><a href="/category/${categorySlug(cat)}">${categoryEmoji(cat)} [ ${esc(cat.toUpperCase())} (${items.length}) ]</a></li>`
    ).join('');


  const latest = [...tools]
    .sort((a, b) => (a.added < b.added ? 1 : -1))
    .slice(0, 8)
    .map((t) => `<li><a href="/tools/${t.id}">${esc(t.title)}</a></li>`)
    .join('');

  const year = new Date().getFullYear();

  return `<footer class="site-footer">
  <div class="container footer-grid">
    <div class="footer-col">
      <strong>${esc(site.name)}</strong>
      <p class="muted">${esc(site.tagline)}. Every tool is free, requires no sign-up and processes your data locally — nothing is uploaded to a server.</p>
      <p class="muted"><a href="${escAttr(site.repo)}" rel="noopener">Open source on GitHub</a></p>
    </div>
    <nav class="footer-col" aria-label="Categories">
      <strong>Categories</strong>
      <ul>${cats}</ul>
      <p><a href="/categories">All categories →</a></p>
    </nav>
    <nav class="footer-col" aria-label="Latest tools">
      <strong>Latest tools</strong>
      <ul>${latest}</ul>
      <p><a href="/latest">All tools →</a></p>
    </nav>
  </div>
  <div class="container footer-bottom muted">
    <span>© ${year} ${esc(site.name)} · 100% free, no sign-up</span>
    <span class="footer-links">
      <a href="/about">About</a> ·
      <a href="/privacy">Privacy</a> ·
      <a href="/search">Search</a> ·
      <a href="/sitemap.xml">Sitemap</a>
    </span>
  </div>
</footer>`;
}
