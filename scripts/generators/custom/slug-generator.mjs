import { frame } from '../../../lib/factories/helpers.mjs';
import { slugify, STOPWORDS } from '../../../lib/fns/slug.mjs';

export default function generate(catalogItem, ctx) {
  const entry = {
    id: 'slug-generator',
    title: 'Slug Generator',
    h1: 'Slug Generator — SEO-friendly URLs from any text',
    seoTitle: 'Slug Generator — Create SEO-Friendly URL Slugs Free | ToolNova',
    description:
      'Turn titles into clean, SEO-friendly URL slugs. Handles accents, removes stop words, custom separators, bulk line-by-line mode. Free and private.',
    intro:
      'Paste one or more titles and get clean, SEO-ready URL slugs instantly. Accents are transliterated (café → cafe), punctuation is stripped, and you can remove stop words, choose your separator and cap the length — one slug per line, in bulk.',
    category: 'SEO',
    keywords: ['slug generator', 'url slug', 'seo friendly url', 'slugify', 'permalink generator', 'url generator', 'blog slug'],
    popularity: 74,
    ui: {
      controls: [
        {
          type: 'textarea',
          id: 'input',
          label: 'Titles or phrases (one per line)',
          rows: 7,
          placeholder: 'My First Blog Post!\n10 Tips for Better Sleep in 2026\nCafé René: à la carte',
          mono: false
        },
        { type: 'select', id: 'separator', label: 'Word separator', value: '-', options: [
          { value: '-', label: 'Hyphen (recommended) — my-title' },
          { value: '_', label: 'Underscore — my_title' }
        ] },
        { type: 'checkbox', id: 'remove-stopwords', label: 'Remove stop words (a, the, of, in…)', checked: true },
        { type: 'number', id: 'max-length', label: 'Maximum length (0 = no limit)', value: 0, min: 0, max: 200, step: 1 }
      ],
      actions: [],
      outputs: [{ type: 'textarea', id: 'output', label: 'URL slugs', rows: 7 }]
    },
    howItWorks: [
      'Enter one title per line — each line becomes its own slug.',
      'Text is lowercased, accents are removed (é → e, ü → u) and any character that is not a letter or number is dropped.',
      'Optionally, common stop words are removed and the result is trimmed to your maximum length at a word boundary.',
      'Slugs update live as you type or change any option; copy them all with one click.'
    ],
    examples: [
      '“My First Blog Post!” → `my-first-blog-post`',
      '“10 Tips for Better Sleep in 2026” with stop words removed → `10-tips-better-sleep-2026`',
      '“Café René: à la carte” → `cafe-rene-a-la-carte` (accents transliterated automatically)',
      'Set max length 30 and “The Complete Guide to Container Gardening” → `complete-guide-container-gard` trimmed at a word boundary.'
    ],
    faq: [
      {
        q: 'What is a URL slug?',
        a: 'A slug is the human-readable part of a URL that identifies a page, like /blog/my-first-post. Good slugs are short, lowercase, hyphen-separated and contain the main keyword — exactly what this tool generates.'
      },
      {
        q: 'Should I use hyphens or underscores in slugs?',
        a: 'Hyphens. Search engines treat hyphens as word separators, while underscores join words together. The hyphen is the default here because it is the recommended choice for SEO.'
      },
      {
        q: 'Why remove stop words?',
        a: 'Words like “a”, “the” and “of” add length without adding meaning. Removing them keeps URLs short and keyword-focused, which is easier to read, share and rank.'
      },
      {
        q: 'Are accented and non-Latin characters supported?',
        a: 'Accented Latin characters are transliterated automatically (café → cafe, naïve → naive). Scripts without a Latin mapping (like Chinese or Arabic) are simply omitted, following the same convention most CMSs use.'
      }
    ]
  };

  const js = frame(`  var STOP_WORDS = ${JSON.stringify(STOPWORDS)};
  var slugify = ${slugify.toString()};

  function convert() {
    var maxLen = parseInt(control('max-length').value, 10);
    var opts = {
      separator: control('separator').value,
      stopwords: control('remove-stopwords').checked ? STOP_WORDS : [],
      maxLength: isFinite(maxLen) && maxLen > 0 ? maxLen : 0
    };
    var lines = control('input').value.split('\\n')
      .map(function (l) { return l.trim(); })
      .filter(function (l) { return l.length > 0; });
    var slugs = lines.map(function (l) { return slugify(l, opts); });
    setOutput('output', slugs.join('\\n'));
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
  convert();`);

  return { entry, js };
}
