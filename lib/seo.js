import { esc, escAttr, truncate } from './html.js';

// Everything SEO-related lives here so every page gets a consistent,
// complete set of tags: title, meta description, canonical, OpenGraph,
// Twitter cards and schema.org JSON-LD.

function absUrl(site, path) {
  if (!path || path === '/') return site.url + '/';
  return site.url + (path.startsWith('/') ? path : '/' + path);
}

function jsonLdTag(obj) {
  // Escape "</" so embedded JSON can never break out of the script tag.
  const json = JSON.stringify(obj).replace(/</g, '\\u003c');
  return `<script type="application/ld+json">${json}</script>`;
}

export function buildHead({ site, title, description, path, type = 'website', image, jsonLd = [] }) {
  const url = absUrl(site, path);
  const imageUrl = image ? (image.startsWith('http') ? image : site.url + image) : site.url + site.ogImage;
  const desc = truncate(description, 170);
  return [
    `<title>${esc(truncate(title, 70))}</title>`,
    `<meta name="description" content="${escAttr(desc)}">`,
    `<link rel="canonical" href="${escAttr(url)}">`,
    `<meta name="robots" content="index, follow, max-image-preview:large">`,
    `<meta property="og:type" content="${escAttr(type)}">`,
    `<meta property="og:site_name" content="${escAttr(site.name)}">`,
    `<meta property="og:title" content="${escAttr(title)}">`,
    `<meta property="og:description" content="${escAttr(desc)}">`,
    `<meta property="og:url" content="${escAttr(url)}">`,
    `<meta property="og:image" content="${escAttr(imageUrl)}">`,
    `<meta property="og:locale" content="${escAttr(site.locale)}">`,
    `<meta name="twitter:card" content="summary_large_image">`,
    `<meta name="twitter:title" content="${escAttr(title)}">`,
    `<meta name="twitter:description" content="${escAttr(desc)}">`,
    `<meta name="twitter:image" content="${escAttr(imageUrl)}">`,
    `<meta name="theme-color" content="${escAttr(site.themeColor)}">`,
    ...jsonLd.map(jsonLdTag)
  ].join('\n    ');
}

export function webAppLD(site, tool) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: tool.title,
    url: absUrl(site, `/tools/${tool.id}`),
    description: truncate(tool.description, 300),
    applicationCategory: 'UtilitiesApplication',
    operatingSystem: 'Any (web browser)',
    browserRequirements: 'Requires JavaScript',
    inLanguage: 'en',
    datePublished: tool.added,
    isAccessibleForFree: true,
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    author: { '@type': 'Organization', name: site.name, url: site.url }
  };
}

export function faqLD(faq) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faq.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a }
    }))
  };
}

export function breadcrumbLD(site, items) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: absUrl(site, item.path)
    }))
  };
}

export function websiteLD(site) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: site.name,
    url: site.url + '/',
    description: truncate(site.description, 300),
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: site.url + '/search?q={search_term_string}'
      },
      'query-input': 'required name=search_term_string'
    }
  };
}

export function organizationLD(site) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: site.name,
    url: site.url + '/',
    logo: site.url + '/assets/favicon.svg'
  };
}

export function itemListLD(site, name, tools) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name,
    numberOfItems: tools.length,
    itemListElement: tools.map((tool, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: tool.title,
      url: absUrl(site, `/tools/${tool.id}`)
    }))
  };
}

export { absUrl };
