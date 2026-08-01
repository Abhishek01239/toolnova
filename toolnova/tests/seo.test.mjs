import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildHead, webAppLD, faqLD, breadcrumbLD, websiteLD, itemListLD } from '../lib/seo.js';

const site = {
  name: 'ToolNova',
  url: 'https://toolnova.vercel.app',
  ogImage: '/assets/og.jpg',
  locale: 'en_US',
  themeColor: '#4f46e5',
  description: 'A collection of free tools.',
  keywords: []
};

test('buildHead emits complete meta', () => {
  const head = buildHead({ site, title: 'Test Page', description: 'A description that is comfortably longer than seventy characters for truncation checks.', path: '/tools/test', jsonLd: [websiteLD(site)] });
  assert.match(head, /<title>Test Page<\/title>/);
  assert.match(head, /rel="canonical" href="https:\/\/toolnova\.vercel\.app\/tools\/test"/);
  assert.match(head, /property="og:title" content="Test Page"/);
  assert.match(head, /property="og:image" content="https:\/\/toolnova\.vercel\.app\/assets\/og\.jpg"/);
  assert.match(head, /name="twitter:card" content="summary_large_image"/);
  assert.match(head, /application\/ld\+json/);
});

test('home canonical is the root url', () => {
  const head = buildHead({ site, title: 'Home', description: 'long enough description for the home page test', path: '/' });
  assert.match(head, /href="https:\/\/toolnova\.vercel\.app\/"/);
});

test('JSON-LD is injection-safe against </script> breakouts', () => {
  const evil = '</script><script>alert(1)</script>';
  const head = buildHead({
    site,
    title: 'Evil',
    description: 'A description long enough to be included in the head output.',
    path: '/x',
    jsonLd: [faqLD([{ q: `Is ${evil} safe?`, a: `It must be escaped: ${evil} and escaped well.` }])]
  });
  assert.equal(head.includes('<script>alert(1)</script>'), false);
  const scriptCount = (head.match(/<script type="application\/ld\+json">/g) || []).length;
  const closeCount = (head.match(/<\/script>/g) || []).length;
  assert.equal(closeCount, scriptCount);
});

test('schema builders produce expected shapes', () => {
  const tool = { id: 'word-counter', title: 'Word Counter', description: 'Counts words and characters in your browser instantly, free forever.', added: '2026-07-31' };
  const app = webAppLD(site, tool);
  assert.equal(app['@type'], 'WebApplication');
  assert.equal(app.offers.price, '0');
  assert.equal(app.url, 'https://toolnova.vercel.app/tools/word-counter');

  const bc = breadcrumbLD(site, [{ name: 'Home', path: '/' }, { name: 'Text', path: '/category/text' }, { name: 'Word Counter', path: '/tools/word-counter' }]);
  assert.equal(bc['@type'], 'BreadcrumbList');
  assert.equal(bc.itemListElement.length, 3);
  assert.equal(bc.itemListElement[1].item, 'https://toolnova.vercel.app/category/text');

  const list = itemListLD(site, 'Text tools', [{ id: 'a', title: 'A' }, { id: 'b', title: 'B' }]);
  assert.equal(list.numberOfItems, 2);
  assert.equal(list.itemListElement[0].position, 1);
});
