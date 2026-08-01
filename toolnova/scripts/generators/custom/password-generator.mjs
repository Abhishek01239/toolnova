import { frame } from '../../../lib/factories/helpers.mjs';

export default function generate(catalogItem, ctx) {
  const entry = {
    id: 'password-generator',
    title: 'Password Generator',
    h1: 'Strong Password Generator — secure & local',
    seoTitle: 'Strong Password Generator — Secure, Random & Free | ToolNova',
    description:
      'Generate strong random passwords with crypto-grade randomness. Control length, symbols and ambiguous characters, see entropy strength. Free & private.',
    intro:
      'Create strong, truly random passwords using your browser’s cryptographic random generator — with unbiased sampling, entropy-strength feedback and options for symbols and ambiguous characters. Passwords are generated locally and never leave your device.',
    category: 'Password',
    keywords: ['password generator', 'strong password', 'random password', 'secure password generator', 'password maker', 'passphrase generator'],
    popularity: 90,
    ui: {
      controls: [
        { type: 'range', id: 'length', label: 'Length', min: 4, max: 64, step: 1, value: 16, help: '16+ characters recommended for important accounts.' },
        { type: 'checkbox', id: 'uppercase', label: 'Uppercase (A–Z)', checked: true },
        { type: 'checkbox', id: 'lowercase', label: 'Lowercase (a–z)', checked: true },
        { type: 'checkbox', id: 'digits', label: 'Digits (0–9)', checked: true },
        { type: 'checkbox', id: 'symbols', label: 'Symbols (!@#$%…)', checked: true },
        { type: 'checkbox', id: 'exclude-similar', label: 'Exclude look-alike characters (l, 1, I, O, 0)', checked: false }
      ],
      actions: [{ id: 'generate', label: '↻ New password', primary: true }],
      outputs: [{ type: 'text', id: 'password', label: 'Generated password' }]
    },
    howItWorks: [
      'Pick a length and character sets — the password regenerates automatically.',
      'Characters are drawn with crypto.getRandomValues plus rejection sampling, so every character in the set is equally likely (no modulo bias).',
      'The strength read-out shows entropy in bits; aim for 80+ bits for important accounts.',
      'Click the password’s Copy button, paste it into your password manager, then clear the field.',
      'Nothing is transmitted or stored — the password exists only in this tab until you close it.'
    ],
    examples: [
      '16 characters with all sets enabled gives ~105 bits of entropy — “very strong”.',
      'Enable “exclude look-alike characters” when a password must be read aloud or typed from print.',
      'For Wi-Fi and devices with awkward keyboards, disable symbols and raise the length to 20+.'
    ],
    faq: [
      {
        q: 'How random are the generated passwords?',
        a: 'They use your browser’s cryptographic random number generator (crypto.getRandomValues), the same source your operating system uses for keys. Rejection sampling removes modulo bias, so every possible character is exactly equally likely.'
      },
      {
        q: 'What does the entropy number mean?',
        a: 'Entropy (in bits) measures how hard the password is to guess: length × log2(character set size). Under 45 bits is weak, 60–80 is strong, and above 80 bits is very strong — beyond practical brute force for online attacks.'
      },
      {
        q: 'Is it safe to generate passwords in a browser?',
        a: 'On this page, yes. Generation happens entirely on your device with no network calls, no storage and no third-party scripts. For maximum safety, bookmark the page and use it offline — it works without internet once loaded.'
      },
      {
        q: 'Should I include symbols in my password?',
        a: 'Symbols raise entropy per character, but length matters more. Some sites reject certain symbols — for those, disable symbols and add extra length instead. A password manager removes the need to type either.'
      }
    ]
  };

  const js = frame(`  var SETS = {
    uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    lowercase: 'abcdefghijklmnopqrstuvwxyz',
    digits: '0123456789',
    symbols: '!@#$%^&*()-_=+[]{};:,.<>/?'
  };
  var LOOKALIKE = /[l1IO0]/g;

  function secureInt(maxExclusive) {
    var span = 4294967296;
    var limit = span - (span % maxExclusive);
    var buf = new Uint32Array(1);
    do {
      window.crypto.getRandomValues(buf);
    } while (buf[0] >= limit);
    return buf[0] % maxExclusive;
  }

  function buildCharset() {
    var chars = '';
    ['uppercase', 'lowercase', 'digits', 'symbols'].forEach(function (key) {
      if (control(key).checked) chars += SETS[key];
    });
    if (control('exclude-similar').checked) chars = chars.replace(LOOKALIKE, '');
    return chars;
  }

  function strengthLabel(bits) {
    if (bits < 45) return 'weak';
    if (bits < 60) return 'fair';
    if (bits < 80) return 'strong';
    return 'very strong';
  }

  function generate() {
    var chars = buildCharset();
    var length = parseInt(control('length').value, 10) || 16;
    if (!chars.length) {
      setOutput('password', '');
      status('Select at least one character set.', 'error');
      return;
    }
    var pw = '';
    for (var i = 0; i < length; i++) pw += chars[secureInt(chars.length)];
    setOutput('password', pw);
    var bits = Math.round(length * Math.log2(chars.length));
    status('Entropy: ~' + bits + ' bits — ' + strengthLabel(bits) + '.', bits >= 60 ? 'ok' : '');
  }

  onAction('generate', generate);
  ['length', 'uppercase', 'lowercase', 'digits', 'symbols', 'exclude-similar'].forEach(function (id) {
    var el = control(id);
    el.addEventListener('change', generate);
    if (el.type === 'range') el.addEventListener('input', generate);
  });
  generate();`);

  return { entry, js };
}
