import * as T from '../fns/transforms.mjs';
import { frame, composeSEO, standardFaq, finalizeEntry, showSample } from './helpers.mjs';

// Registry of vetted, unit-tested transforms a text-transform tool can expose.
// fn must be self-contained so it can be serialized into client code.
const TRANSFORMS = {
  'uppercase': { label: 'UPPERCASE', fn: T.toUpper, sample: 'the quick brown fox jumps over the lazy dog' },
  'lowercase': { label: 'lowercase', fn: T.toLower, sample: 'THE QUICK BROWN FOX JUMPS HIGH' },
  'title-case': { label: 'Title Case', fn: T.toTitleCase, sample: 'the quick brown fox jumps over the lazy dog' },
  'sentence-case': { label: 'Sentence case', fn: T.toSentenceCase, sample: 'the fox jumps. it jumps very high. what a jump!' },
  'camel-case': { label: 'camelCase', fn: T.toCamelCase, sample: 'the quick brown fox' },
  'pascal-case': { label: 'PascalCase', fn: T.toPascalCase, sample: 'the quick brown fox' },
  'snake-case': { label: 'snake_case', fn: T.toSnakeCase, sample: 'the quick brown fox' },
  'kebab-case': { label: 'kebab-case', fn: T.toKebabCase, sample: 'the quick brown fox' },
  'constant-case': { label: 'CONSTANT_CASE', fn: T.toConstantCase, sample: 'the quick brown fox' },
  'reverse-text': { label: 'Reverse characters', fn: T.reverseText, sample: 'stressed desserts' },
  'reverse-lines': { label: 'Reverse line order', fn: T.reverseLines, sample: 'first\nsecond\nthird' },
  'sort-lines': { label: 'Sort lines A → Z', fn: T.sortLines, sample: 'pear\napple\norange\nbanana' },
  'sort-lines-reverse': { label: 'Sort lines Z → A', fn: T.sortLinesReverse, sample: 'apple\npear\norange\nbanana' },
  'dedupe-lines': { label: 'Remove duplicate lines', fn: T.dedupeLines, sample: 'apple\nbanana\napple\ncherry\nbanana' },
  'trim-lines': { label: 'Trim line ends', fn: T.trimLines, sample: '   padded left and right   \n\talso padded\t' },
  'remove-empty-lines': { label: 'Remove empty lines', fn: T.removeEmptyLines, sample: 'one\n\n\n\ntwo\n   \nthree' },
  'remove-extra-spaces': { label: 'Collapse extra spaces', fn: T.removeExtraSpaces, sample: 'too     many      spaces    in   here' },
  'strip-html': { label: 'Strip HTML tags', fn: T.stripHtmlTags, sample: '<p>Hello <strong>beautiful</strong> world!</p>' },
  'extract-emails': { label: 'Extract email addresses', fn: T.extractEmails, sample: 'Reach ada@example.com or bob.smith@test.org; ada@example.com again.' },
  'extract-urls': { label: 'Extract URLs', fn: T.extractUrls, sample: 'See https://example.com and http://test.org/docs?page=2. https://example.com rocks.' },
  'add-line-numbers': { label: 'Add line numbers', fn: T.addLineNumbers, sample: 'alpha\nbeta\ngamma' }
};

export const id = 'text-transform';

export function generate(catalogItem, ctx) {
  const keys = catalogItem.params?.transforms;
  if (!Array.isArray(keys) || keys.length === 0) {
    throw new Error(`${catalogItem.id}: text-transform params.transforms must be a non-empty array`);
  }
  for (const key of keys) {
    if (!TRANSFORMS[key]) throw new Error(`${catalogItem.id}: unknown transform "${key}"`);
  }

  const title = catalogItem.params.title;
  const { description, intro, seoTitle } = composeSEO(title, catalogItem.blurb, ctx.site);
  const labels = keys.map((k) => TRANSFORMS[k].label);

  const examples = keys.slice(0, 3).map((key) => {
    const t = TRANSFORMS[key];
    const result = t.fn(t.sample);
    return `Input "${showSample(t.sample)}" → click "${t.label}" → output "${showSample(result)}".`;
  });
  if (examples.length < 2) {
    examples.push('Paste as much text as you like — long lists and whole documents work, not just short samples.');
  }

  const entry = {
    id: catalogItem.id,
    title,
    h1: catalogItem.params.h1 || `${title} — free & online`,
    intro,
    blurb: catalogItem.blurb,
    ui: {
      controls: [
        {
          type: 'textarea',
          id: 'input',
          label: catalogItem.params.inputLabel || 'Your text',
          rows: catalogItem.params.rows || 10,
          placeholder: catalogItem.params.placeholder || 'Type or paste your text here…'
        }
      ],
      actions: keys.map((key, i) => ({ id: key, label: TRANSFORMS[key].label, primary: i === 0 })),
      outputs: [
        { type: 'textarea', id: 'output', label: 'Result', rows: catalogItem.params.rows || 10 }
      ]
    },
    howItWorks: [
      'Type or paste your text into the input box — there is no practical length limit.',
      `Click one of the operation buttons (${labels.join(', ')}) to transform the text instantly.`,
      'The result appears in the output box; use the Copy button to copy it to your clipboard.',
      'All processing happens locally in your browser — your text is never uploaded anywhere.'
    ],
    examples,
    faq: catalogItem.faq || standardFaq(title, catalogItem.blurb),
    ...{ description, seoTitle }
  };

  const transformSources = keys
    .map((key) => `  transforms[${JSON.stringify(key)}] = ${TRANSFORMS[key].fn.toString()};`)
    .join('\n');

  const js = frame(`  var transforms = {};
${transformSources}

  root.querySelectorAll('[data-action]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var fn = transforms[btn.getAttribute('data-action')];
      if (!fn) return;
      try {
        var before = control('input').value;
        var result = fn(before);
        setOutput('output', result);
        var lines = result && result.indexOf('\\n') !== -1 ? ', ' + (result.split('\\n').length) + ' lines' : '';
        status('Done — ' + result.length + ' characters' + lines + '.', 'ok');
      } catch (err) {
        setOutput('output', '');
        status(err && err.message ? err.message : 'Something went wrong.', 'error');
      }
    });
  });`);

  return { entry: finalizeEntry(entry, catalogItem, ctx), js };
}

export { TRANSFORMS };
