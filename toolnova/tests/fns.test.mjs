import { test } from 'node:test';
import assert from 'node:assert/strict';

import * as T from '../lib/fns/transforms.mjs';
import * as C from '../lib/fns/codecs.mjs';
import * as R from '../lib/fns/randoms.mjs';
import { UNITS, TEMP_UNITS, convertUnit, convertTemperature, formatMeasurement, unitSymbol } from '../lib/fns/units.mjs';
import { parseISODate, daysBetween, computeAge, weekdayOf, nextBirthday, zodiacSign } from '../lib/fns/age.mjs';
import { slugify, STOPWORDS } from '../lib/fns/slug.mjs';
import { computeWordStats, formatDuration, COMMON_WORDS } from '../lib/fns/wordcount.mjs';
import { LATIN_WORDS, makeWords, makeSentences, makeParagraphs, generateLorem } from '../lib/fns/lorem.mjs';

// ---------- transforms ----------
test('case transforms', () => {
  assert.equal(T.toUpper('abc def'), 'ABC DEF');
  assert.equal(T.toLower('ABC DeF'), 'abc def');
  assert.equal(T.toTitleCase('the quick fox'), 'The Quick Fox');
  assert.equal(T.toSentenceCase('hello world. how ARE you? fine'), 'Hello world. How are you? Fine');
  assert.equal(T.toCamelCase('the quick-brown_fox'), 'theQuickBrownFox');
  assert.equal(T.toPascalCase('the quick fox'), 'TheQuickFox');
  assert.equal(T.toSnakeCase('The Quick Fox'), 'the_quick_fox');
  assert.equal(T.toKebabCase('The Quick Fox'), 'the-quick-fox');
  assert.equal(T.toConstantCase('the quick fox'), 'THE_QUICK_FOX');
});

test('line transforms', () => {
  assert.equal(T.reverseText('stressed'), 'desserts');
  assert.equal(T.reverseText('a👋b'), 'b👋a');
  assert.equal(T.reverseLines('one\ntwo\nthree'), 'three\ntwo\none');
  assert.equal(T.sortLines('pear\napple\nitem10\nitem2'), 'apple\nitem2\nitem10\npear');
  assert.equal(T.sortLinesReverse('b\na\nc'), 'c\nb\na');
  assert.equal(T.dedupeLines('a\nb\na\nc\nb'), 'a\nb\nc');
  assert.equal(T.dedupeLines('a\nA'), 'a\nA'); // case-sensitive by design
  assert.equal(T.trimLines('  x  \n\ty\t'), 'x\ny');
  assert.equal(T.removeEmptyLines('a\n\n   \nb'), 'a\nb');
  assert.equal(T.removeExtraSpaces('too    many\ta  b'), 'too many a b');
  assert.equal(T.addLineNumbers('x\ny'), '1. x\n2. y');
});

test('strip html and extractors', () => {
  assert.equal(T.stripHtmlTags('<p>Hello <strong>world</strong></p>').trim(), 'Hello world');
  assert.equal(T.stripHtmlTags('&lt;b&gt; &amp; co'), '<b> & co');
  assert.equal(T.extractEmails('mail a@b.co and A@B.co, plus a@b.co'), 'a@b.co\nA@B.co');
  assert.equal(T.extractUrls('see https://a.com and http://b.io/x?y=1 ok https://a.com'), 'https://a.com\nhttp://b.io/x?y=1');
  assert.equal(T.removeDuplicateWords('the cat and the dog'), 'the cat and dog');
});

// ---------- codecs ----------
test('base64 round-trips unicode and rejects garbage', () => {
  for (const s of ['Hello, ToolNova 👋', 'café', '12345', '日本語', '']) {
    assert.equal(C.base64Decode(C.base64Encode(s)), s);
  }
  assert.equal(C.base64Encode('Hello, ToolNova 👋'), 'SGVsbG8sIFRvb2xOb3ZhIPCfkYs=');
  assert.throws(() => C.base64Decode('!!!notbase64!!!'), /not valid Base64/);
  assert.throws(() => C.base64Decode('abcde'), /not valid Base64/);
});

test('url / html-entity / hex / binary / unicode escapes / rot13', () => {
  assert.equal(C.urlEncode('a b&c=d'), 'a%20b%26c%3Dd');
  assert.equal(C.urlDecode('a+b%20c'), 'a b c');
  assert.throws(() => C.urlDecode('%zz'), /not valid URL/);
  assert.equal(C.htmlEntityDecode(C.htmlEntityEncode('<b>Tom & "Jerry" café</b>')), '<b>Tom & "Jerry" café</b>');
  assert.equal(C.hexEncode('Hi'), '4869');
  assert.equal(C.hexDecode('48656c6c6f'), 'Hello');
  assert.throws(() => C.hexDecode('abc'), /not valid hexadecimal/);
  assert.equal(C.binaryDecode(C.binaryEncode('Hi!')), 'Hi!');
  assert.throws(() => C.binaryDecode('0100 100'), /8-bit groups/);
  assert.equal(C.unicodeEscape('éA😀'), '\\u00e9A\\u{1f600}');
  assert.equal(C.unicodeUnescape('\\u00e9 studio'), 'é studio');
  assert.equal(C.rot13(C.rot13('Attack at dawn, Zebra!')), 'Attack at dawn, Zebra!');
  assert.equal(C.rot13('Hello'), 'Uryyb');
});

// ---------- units ----------
test('unit conversion factors and temperature formulas', () => {
  assert.equal(formatMeasurement(convertUnit(UNITS.length.units, 1, 'Kilometer (km)', 'Mile (mi)')), '0.6213711922');
  assert.equal(convertUnit(UNITS.length.units, 1, 'Inch (in)', 'Centimeter (cm)'), 2.54);
  assert.equal(convertUnit(UNITS.data.units, 1, 'Kibibyte (KiB)', 'Byte (B)'), 1024);
  assert.equal(formatMeasurement(convertUnit(UNITS.data.units, 1, 'Gibibyte (GiB)', 'Gigabyte (GB)')), '1.073741824');
  assert.equal(convertUnit(UNITS.time.units, 1, 'Week (wk)', 'Day (d)'), 7);
  assert.equal(convertTemperature(100, 'Celsius (°C)', 'Fahrenheit (°F)'), 212);
  assert.equal(convertTemperature(32, 'Fahrenheit (°F)', 'Celsius (°C)'), 0);
  assert.equal(convertTemperature(0, 'Celsius (°C)', 'Kelvin (K)'), 273.15);
  assert.equal(unitSymbol('Kilometer (km)'), 'km');
  assert.equal(formatMeasurement(1 / 3), '0.3333333333');
  assert.ok(TEMP_UNITS.length === 3);
});

// ---------- age ----------
test('date parsing and differences', () => {
  assert.deepEqual(parseISODate('2000-02-29'), { y: 2000, m: 2, d: 29 });
  assert.equal(parseISODate('2023-02-29'), null);
  assert.equal(parseISODate('nope'), null);
  assert.equal(daysBetween('2000-01-01', '2000-01-02'), 1);
  assert.equal(daysBetween('2020-02-28', '2020-03-01'), 2);
});

test('computeAge calendar math', () => {
  assert.deepEqual(computeAge('1995-06-15', '2026-07-31'), { years: 31, months: 1, days: 16, totalDays: 11369 });
  assert.deepEqual(computeAge('2000-01-15', '2024-01-14'), { years: 23, months: 11, days: 30, totalDays: 8765 });
  assert.deepEqual(computeAge('2000-03-10', '2024-02-05'), { years: 23, months: 10, days: 26, totalDays: 8732 });
  assert.equal(computeAge('2024-01-01', '2023-01-01'), null);
});

test('weekday, next birthday, zodiac', () => {
  assert.equal(weekdayOf('1995-06-15'), 'Thursday');
  assert.equal(weekdayOf('2000-01-01'), 'Saturday');
  assert.deepEqual(nextBirthday('1995-06-15', '2026-07-31'), { dateIso: '2027-06-15', daysLeft: 319 });
  assert.deepEqual(nextBirthday('1996-02-29', '2025-03-01'), { dateIso: '2026-02-28', daysLeft: 364 });
  assert.deepEqual(nextBirthday('1990-07-31', '2026-07-31'), { dateIso: '2026-07-31', daysLeft: 0 });
  assert.equal(zodiacSign(2, 19), 'Pisces');
  assert.equal(zodiacSign(12, 25), 'Capricorn');
  assert.equal(zodiacSign(7, 31), 'Leo');
  assert.equal(zodiacSign(3, 21), 'Aries');
  assert.equal(zodiacSign(3, 20), 'Pisces');
});

// ---------- slug ----------
test('slugify', () => {
  assert.equal(slugify('Héllo, World! 2024'), 'hello-world-2024');
  assert.equal(slugify('Café René: à la carte'), 'cafe-rene-a-la-carte');
  assert.equal(slugify("It's a don't-miss deal"), 'its-a-dont-miss-deal');
  assert.equal(slugify('The Quick Brown Fox', { stopwords: STOPWORDS }), 'quick-brown-fox');
  assert.equal(slugify('alpha beta gamma', { maxLength: 9 }), 'alpha');
  assert.equal(slugify('Hello World', { separator: '_' }), 'hello_world');
  assert.equal(slugify('日本語 only'), 'only');
  assert.equal(slugify('日本語'), '');
});

// ---------- randoms ----------
test('seeded randoms are deterministic and in range', () => {
  const rng = R.mulberry32(42);
  for (let i = 0; i < 200; i++) {
    const v = R.randInt(3, 9, rng);
    assert.ok(v >= 3 && v <= 9 && Number.isInteger(v));
  }
  const rng2 = R.mulberry32(42);
  const rolls = R.rollDice(6, 5, rng2);
  assert.equal(rolls.length, 5);
  assert.ok(rolls.every((r) => r >= 1 && r <= 6));
  assert.ok(['Heads', 'Tails'].includes(R.flipCoin(rng2)));
  assert.match(R.randomHexColor(rng2), /^#[0-9A-F]{6}$/);
  assert.match(R.randomLetter(rng2), /^[A-Z]$/);
  assert.match(R.randomDate('2020-01-01', '2020-12-31', rng2), /^2020-\d{2}-\d{2}$/);
});

// ---------- wordcount ----------
test('word stats', () => {
  const s = computeWordStats('Hello world. Hello there, friend!\n\nSecond paragraph.', COMMON_WORDS);
  assert.equal(s.words, 7);
  assert.equal(s.sentences, 3);
  assert.equal(s.paragraphs, 2);
  assert.equal(s.characters, 'Hello world. Hello there, friend!\n\nSecond paragraph.'.length);
  assert.equal(s.keywords[0].word, 'hello');
  assert.equal(s.keywords[0].count, 2);
  assert.equal(formatDuration(45), '45 sec');
  assert.equal(formatDuration(200), '3 min 20 sec');
  assert.equal(formatDuration(3700), '1 h 1 min');
});

// ---------- lorem ----------
test('lorem generation is exact and seedable', () => {
  const rng = R.mulberry32(7);
  assert.deepEqual(makeWords(3, LATIN_WORDS, rng, true).slice(0, 2), ['lorem', 'ipsum']);
  const text = generateLorem({ type: 'words', count: 10 }, LATIN_WORDS, R.mulberry32(7));
  const words = text.replace('.', '').split(' ');
  assert.equal(words.length, 10);
  assert.ok(text.endsWith('.'));
  const two = generateLorem({ type: 'paragraphs', count: 2 }, LATIN_WORDS, R.mulberry32(1));
  assert.equal(two.split('\n\n').length, 2);
  assert.match(makeSentences(2, LATIN_WORDS, R.mulberry32(2), false), /^[A-Z]/);
});
