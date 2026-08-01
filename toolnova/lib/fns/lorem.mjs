// Lorem ipsum generation — pure, seedable, serialization-safe.

export const LATIN_WORDS = [
  'lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur', 'adipiscing', 'elit',
  'sed', 'do', 'eiusmod', 'tempor', 'incididunt', 'ut', 'labore', 'et', 'dolore',
  'magna', 'aliqua', 'enim', 'ad', 'minim', 'veniam', 'quis', 'nostrud',
  'exercitation', 'ullamco', 'laboris', 'nisi', 'aliquip', 'ex', 'ea', 'commodo',
  'consequat', 'duis', 'aute', 'irure', 'in', 'reprehenderit', 'voluptate',
  'velit', 'esse', 'cillum', 'fugiat', 'nulla', 'pariatur', 'excepteur', 'sint',
  'occaecat', 'cupidatat', 'non', 'proident', 'sunt', 'culpa', 'qui', 'officia',
  'deserunt', 'mollit', 'anim', 'id', 'est', 'laborum', 'perspiciatis', 'unde',
  'omnis', 'iste', 'natus', 'error', 'voluptatem', 'accusantium', 'doloremque',
  'laudantium', 'totam', 'rem', 'aperiam', 'eaque', 'ipsa', 'quae', 'ab', 'illo',
  'inventore', 'veritatis', 'quasi', 'architecto', 'beatae', 'vitae', 'dicta',
  'explicabo', 'nemo', 'ipsam', 'quia', 'voluptas', 'aspernatur', 'aut', 'odit',
  'fugit', 'consequuntur', 'magni', 'ratione', 'neque', 'porro', 'quisquam',
  'dolorem', 'adipisci', 'numquam', 'eius', 'modi', 'tempora', 'magnam',
  'quaerat', 'minima', 'nostrum', 'exercitationem', 'ullam', 'corporis',
  'suscipit', 'laboriosam', 'commodi', 'sequi', 'nesciunt', 'aliquid', 'eos'
];

export function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// Builds `wordCount` words. First two are "lorem ipsum" when startClassic.
export function makeWords(wordCount, latin, rng, startClassic) {
  var out = [];
  for (var i = 0; i < wordCount; i++) {
    if (startClassic && i === 0) out.push('lorem');
    else if (startClassic && i === 1) out.push('ipsum');
    else out.push(latin[Math.floor(rng() * latin.length)]);
  }
  return out;
}

export function makeSentences(count, latin, rng, startClassic) {
  var sentences = [];
  var skipClassic = false;
  for (var s = 0; s < count; s++) {
    var len = 6 + Math.floor(rng() * 9);
    var words = makeWords(len, latin, rng, startClassic && !skipClassic);
    skipClassic = true;
    sentences.push(capitalize(words.join(' ')) + '.');
  }
  return sentences.join(' ');
}

export function makeParagraphs(count, latin, rng, startClassic) {
  var paragraphs = [];
  var first = true;
  for (var p = 0; p < count; p++) {
    var sentenceCount = 3 + Math.floor(rng() * 3);
    paragraphs.push(makeSentences(sentenceCount, latin, rng, startClassic && first));
    first = false;
  }
  return paragraphs.join('\n\n');
}

export function generateLorem(options, latin, rng) {
  var words = latin || LATIN_WORDS;
  var r = rng || Math.random;
  var count = Math.max(1, Math.min(100, Math.floor(options.count) || 1));
  var startClassic = options.startClassic !== false;
  if (options.type === 'words') {
    return capitalize(makeWords(count, words, r, startClassic).join(' ')) + '.';
  }
  if (options.type === 'sentences') return makeSentences(count, words, r, startClassic);
  return makeParagraphs(count, words, r, startClassic);
}
