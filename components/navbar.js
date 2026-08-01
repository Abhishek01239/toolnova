import { esc, escAttr } from '../lib/html.js';
import { logoSvg } from './logo.js';

const NAV_LINKS = [
  { name: 'Categories', href: '/categories' },
  { name: 'Latest', href: '/latest' },
  { name: 'Popular', href: '/popular' }
];

export function navbar(site, currentPath) {
  const links = NAV_LINKS.map((l) => {
    const active = currentPath === l.href || currentPath.startsWith(l.href + '/');
    const label = `[ ${l.name.toUpperCase()} ]`;
    return `<a href="${l.href}"${active ? ' aria-current="page" class="active"' : ''}>${esc(label)}</a>`;
  }).join('');

  return `<header class="site-header">
  <div class="container nav-inner">
    <a class="brand" href="/" aria-label="${escAttr(site.name)} home">
      ${logoSvg(30)}<span class="brand-name">${esc(site.name)}</span>
    </a>
    <nav class="main-nav" aria-label="Main navigation">${links}</nav>
    <form class="nav-search" action="/search" method="get" role="search">
      <input type="search" name="q" placeholder="[ SEARCH… ]" aria-label="Search tools" minlength="1">
      <button type="submit" aria-label="Search">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><line x1="16.5" y1="16.5" x2="21" y2="21"/></svg>
      </button>
    </form>
    <button type="button" class="theme-toggle" data-theme-toggle aria-label="Toggle dark mode" title="Toggle dark mode">
      <svg class="icon-sun" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>
      <svg class="icon-moon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>
    </button>
  </div>
</header>`;
}
