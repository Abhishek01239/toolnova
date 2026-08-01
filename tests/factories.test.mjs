import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateEntry, normalizeEntry } from '../lib/registry.js';
import { finalizeEntry, frame, composeSEO } from '../lib/factories/helpers.mjs';
import { generate as textTransform } from '../lib/factories/text-transform.mjs';
import { generate as encoderDecoder } from '../lib/factories/encoder-decoder.mjs';
import { generate as randomGenerator, GENERATORS } from '../lib/factories/random-generator.mjs';
import { generate as unitConverter } from '../lib/factories/unit-converter.mjs';
import { mulberry32 } from '../lib/fns/randoms.mjs';
import { base64Encode } from '../lib/fns/codecs.mjs';

const ctx = {
  today: '2026-07-31',
  site: {
    name: 'ToolNova',
    url: 'https://toolnova.vercel.app',
    ogImage: '/assets/og.jpg',
    locale: 'en_US',
    themeColor: '#4f46e5'
  }
};

const syntaxCheck = (js) => new Function(js);

test('composeSEO stays within SERP limits', () => {
  const { description, intro, seoTitle } = composeSEO('Test Thing', 'Short blurb.', ctx.site);
  assert.ok(description.length >= 60 && description.length <= 170, `description ${description.length} chars`);
  assert.ok(intro.length >= 40);
  assert.ok(seoTitle.length <= 80);
  assert.ok(seoTitle.includes('Test Thing'));
});

test('frame produces a parseable IIFE with helper API', () => {
  const js = frame('  status("ready", "ok");');
  syntaxCheck(js);
  assert.ok(js.startsWith('(function () {'));
  assert.ok(js.includes('function onAction('));
});

test('text-transform factory emits a valid tool', () => {
  const item = {
    id: 'test-case-tool',
    factory: 'text-transform',
    category: 'Text',
    keywords: ['case', 'test', 'example'],
    blurb: 'Converts text between letter cases for testing the factory contract.',
    params: { title: 'Test Case Tool', transforms: ['uppercase', 'sort-lines'], rows: 8 }
  };
  const { entry, js } = textTransform(item, ctx);
  validateEntry(normalizeEntry(finalizeEntry(entry, item, ctx)));
  syntaxCheck(js);
  assert.ok(js.includes("transforms[\"uppercase\"]"));
  assert.equal(entry.ui.actions.length, 2);
  assert.ok(entry.examples[0].includes('THE QUICK BROWN FOX')); // computed by actually running the fn
});

test('encoder-decoder factory emits a valid tool with verified examples', () => {
  const item = {
    id: 'test-b64',
    factory: 'encoder-decoder',
    category: 'Encoding',
    keywords: ['base64', 'encode', 'decode'],
    blurb: 'Encodes and decodes Base64 for the factory test suite run today.',
    params: { title: 'Test Base64', codec: 'base64' }
  };
  const { entry, js } = encoderDecoder(item, ctx);
  validateEntry(normalizeEntry(finalizeEntry(entry, item, ctx)));
  syntaxCheck(js);
  assert.ok(entry.examples.some((e) => e.includes(base64Encode('Hello, ToolNova! 👋'))));
  assert.throws(() => encoderDecoder({ ...item, params: { title: 'X', codec: 'nope' } }, ctx));
});

test('random generators produce in-range output with a seeded RNG', () => {
  const original = Math.random;
  try {
    Math.random = mulberry32(99);
    const rn = GENERATORS['random-number'].run({ min: 1, max: 6, count: 4 });
    const nums = rn.split('\n').map(Number);
    assert.equal(nums.length, 4);
    assert.ok(nums.every((n) => n >= 1 && n <= 6 && Number.isInteger(n)));

    const dice = GENERATORS['dice'].run({ sides: '20', count: 3 });
    assert.match(dice, /Roll 1 \(d20\): \d+/);
    assert.match(dice, /Total: \d+/);

    const color = GENERATORS['random-color'].run({ count: 2 });
    assert.equal(color.split('\n').filter((c) => /^#[0-9A-F]{6}$/.test(c)).length, 2);

    const letter = GENERATORS['random-letter'].run({ count: 3, lowercase: true });
    assert.ok(letter.split(' ').every((l) => /^[a-z]$/.test(l)));

    assert.ok(['Yes', 'No'].includes(GENERATORS['yes-or-no'].run({})));
  } finally {
    Math.random = original;
  }
});

test('random-generator factory emits a valid tool', () => {
  const item = {
    id: 'test-rng',
    factory: 'random-generator',
    category: 'Random Generators',
    keywords: ['random', 'number', 'test'],
    blurb: 'Generates random numbers in a range for factory contract testing.',
    params: { title: 'Test RNG', generator: 'random-number' }
  };
  const { entry, js } = randomGenerator(item, ctx);
  validateEntry(normalizeEntry(finalizeEntry(entry, item, ctx)));
  syntaxCheck(js);
});

test('unit-converter factory emits valid tools (factor + temperature kinds)', () => {
  const lengthItem = {
    id: 'test-length',
    factory: 'unit-converter',
    category: 'Unit Converter',
    keywords: ['length', 'convert', 'test'],
    blurb: 'Converts length units for the factory test suite validation.',
    params: { title: 'Test Length', kind: 'length', sampleValue: 2 }
  };
  const { entry: lengthEntry, js } = unitConverter(lengthItem, ctx);
  validateEntry(normalizeEntry(finalizeEntry(lengthEntry, lengthItem, ctx)));
  syntaxCheck(js);
  assert.ok(lengthEntry.examples.some((e) => e.includes('Kilometer (km)') || e.includes('km')));

  const tempItem = {
    id: 'test-temp',
    factory: 'unit-converter',
    category: 'Unit Converter',
    keywords: ['temperature', 'convert', 'test'],
    blurb: 'Converts temperature units for the factory test suite validation.',
    params: { title: 'Test Temp', kind: 'temperature', sampleValue: 25 }
  };
  const { entry: tempEntry, js: tempJs } = unitConverter(tempItem, ctx);
  validateEntry(normalizeEntry(finalizeEntry(tempEntry, tempItem, ctx)));
  syntaxCheck(tempJs);
  assert.ok(tempEntry.examples.some((e) => e.includes('77'))); // 25 °C = 77 °F
  assert.throws(() => unitConverter({ ...tempItem, params: { title: 'X', kind: 'nope' } }, ctx));
});
