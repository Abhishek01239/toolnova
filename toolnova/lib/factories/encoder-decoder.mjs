import * as C from '../fns/codecs.mjs';
import { frame, composeSEO, standardFaq, finalizeEntry, showSample } from './helpers.mjs';

// Vetted codec registry — encode/decode pairs, all unit-tested.
const CODECS = {
  'base64': {
    name: 'Base64', encode: C.base64Encode, decode: C.base64Decode,
    sample: 'Hello, ToolNova! 👋',
    about: 'Base64 converts text or binary data into a safe ASCII alphabet (A–Z, a–z, 0–9, + and /), which is handy for embedding data in URLs, JSON, HTML or email.'
  },
  'url': {
    name: 'URL (percent-encoding)', encode: C.urlEncode, decode: C.urlDecode,
    sample: 'Hello World! 100% free & simple = true',
    about: 'URL encoding (percent-encoding) escapes characters that are not safe inside a URL — spaces, ampersands, non-ASCII characters and reserved symbols — so links and query strings never break.'
  },
  'html-entity': {
    name: 'HTML entities', encode: C.htmlEntityEncode, decode: C.htmlEntityDecode,
    sample: '<p>Tom & Jerry said "5 > 3" — café ☕</p>',
    about: 'HTML entity encoding turns characters like <, >, & and quotes into safe entities (&lt;, &gt;, &amp;…) so text can be shown inside HTML without being parsed as markup.'
  },
  'hex': {
    name: 'hexadecimal', encode: C.hexEncode, decode: C.hexDecode,
    sample: 'Hi there!',
    about: 'Hexadecimal encoding represents each byte of (UTF-8) text as two hex digits, 0–9 and a–f — the format used everywhere from color codes to cryptographic hashes.'
  },
  'binary': {
    name: 'binary', encode: C.binaryEncode, decode: C.binaryDecode,
    sample: 'Hi!',
    about: 'Binary encoding shows each byte of text as eight 0s and 1s — the raw representation computers actually store.'
  },
  'unicode-escape': {
    name: 'JavaScript unicode escapes', encode: C.unicodeEscape, decode: C.unicodeUnescape,
    sample: 'café — naïve — 日本語 😀',
    about: 'Unicode escape sequences (\\u0041 style) are how non-ASCII characters are written inside JavaScript strings, JSON and many config formats.'
  },
  'rot13': {
    name: 'ROT13', encode: C.rot13, decode: C.rot13,
    sample: 'Hello, world! Try me.',
    about: 'ROT13 shifts every letter 13 places through the alphabet. Applying it twice returns the original text, which makes it a classic way to obscure spoilers and puzzle answers.'
  }
};

export const id = 'encoder-decoder';

export function generate(catalogItem, ctx) {
  const key = catalogItem.params?.codec;
  const codec = CODECS[key];
  if (!codec) throw new Error(`${catalogItem.id}: unknown codec "${key}"`);

  const title = catalogItem.params.title;
  const { description, intro, seoTitle } = composeSEO(title, catalogItem.blurb, ctx.site);

  const encoded = codec.encode(codec.sample);
  const examples = [
    `Encoding "${showSample(codec.sample)}" produces "${showSample(encoded)}".`,
    `Decoding "${showSample(encoded)}" returns the original "${showSample(codec.sample)}".`,
    'Errors are caught and explained — paste a broken value and the tool tells you what is wrong with it.'
  ];

  const entry = {
    id: catalogItem.id,
    title,
    h1: catalogItem.params.h1 || `${title} — free & online`,
    intro,
    blurb: catalogItem.blurb,
    ui: {
      controls: [
        { type: 'textarea', id: 'input', label: 'Input', rows: 9, placeholder: 'Type or paste here — encoding and decoding both work on this box.' }
      ],
      actions: [
        { id: 'encode', label: `Encode to ${codec.name}`, primary: true },
        { id: 'decode', label: `Decode from ${codec.name}` }
      ],
      outputs: [
        { type: 'textarea', id: 'output', label: 'Output', rows: 9 }
      ]
    },
    howItWorks: [
      'Paste or type your text into the input box.',
      `Choose "Encode to ${codec.name}" or "Decode from ${codec.name}" — the result appears instantly in the output box.`,
      'Copy the result with one click. Unicode and emoji are fully supported.',
      'Everything runs locally in your browser, so even sensitive strings never leave your device.'
    ],
    examples,
    faq: catalogItem.faq || [
      { q: `What is ${codec.name} encoding?`, a: codec.about },
      ...standardFaq(title, catalogItem.blurb).slice(1)
    ],
    description,
    seoTitle
  };

  const js = frame(`  var encode = ${codec.encode.toString()};
  var decode = ${codec.decode.toString()};

  function run(fn) {
    try {
      var before = control('input').value;
      var result = fn(before);
      setOutput('output', result);
      status('Done — ' + result.length + ' characters.', 'ok');
    } catch (err) {
      setOutput('output', '');
      status(err && err.message ? err.message : 'Could not process that input.', 'error');
    }
  }

  onAction('encode', function () { run(encode); });
  onAction('decode', function () { run(decode); });`);

  return { entry: finalizeEntry(entry, catalogItem, ctx), js };
}

export { CODECS };
