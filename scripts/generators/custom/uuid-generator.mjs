import { frame } from '../../../lib/factories/helpers.mjs';

export default function generate(catalogItem, ctx) {
  const entry = {
    id: 'uuid-generator',
    title: 'UUID Generator',
    h1: 'UUID Generator (v4) — bulk unique identifiers',
    seoTitle: 'UUID Generator — Free Bulk v4 UUIDs, Copy in One Click | ToolNova',
    description:
      'Generate up to 100 random UUID version 4 identifiers at once, uppercase or without hyphens. Cryptographically secure, free, no sign-up.',
    intro:
      'Generate cryptographically random version 4 UUIDs in bulk — up to 100 at a time. Choose uppercase formatting or strip the hyphens, then copy them all in one click. Everything is produced by your browser’s secure random generator.',
    category: 'Developer',
    keywords: ['uuid generator', 'uuid v4', 'guid generator', 'random uuid', 'bulk uuid', 'unique id generator', 'uuid online'],
    popularity: 80,
    ui: {
      controls: [
        { type: 'number', id: 'count', label: 'How many UUIDs?', value: 5, min: 1, max: 100, step: 1 },
        { type: 'checkbox', id: 'uppercase', label: 'UPPERCASE letters', checked: false },
        { type: 'checkbox', id: 'no-hyphens', label: 'Remove hyphens', checked: false }
      ],
      actions: [{ id: 'generate', label: 'Generate UUIDs', primary: true }],
      outputs: [{ type: 'textarea', id: 'output', label: 'Your UUIDs', rows: 9 }]
    },
    howItWorks: [
      'Click Generate (or change any option) to create a fresh batch of version 4 UUIDs.',
      'Each UUID is 128 bits: 122 of them are filled by your browser’s cryptographically secure random generator, the rest mark the version and variant.',
      'Toggle uppercase or hyphen-free formatting — the underlying identifier is identical, only the display changes.',
      'Copy the whole list with the Copy button; each line holds one UUID.'
    ],
    examples: [
      'A standard v4 UUID looks like `3f6b2a1e-8c4d-4e7a-9f1b-2c5d8e0a4b6f`.',
      'Need IDs for a database seed? Generate 50 at once and paste them straight into your fixtures.',
      'With hyphens removed you get `3f6b2a1e8c4d4e7a9f1b2c5d8e0a4b6f` — handy for URLs and filenames.'
    ],
    faq: [
      {
        q: 'What is a UUID?',
        a: 'A universally unique identifier is a 128-bit value standardized by RFC 9562. Version 4 UUIDs are randomly generated, so the chance of two identical UUIDs ever being created is astronomically small — you can safely treat them as unique.'
      },
      {
        q: 'Are these UUIDs cryptographically secure?',
        a: 'Yes. They are produced with your browser’s crypto.getRandomValues (or crypto.randomUUID where available), not the predictable Math.random, so they are suitable for security-sensitive identifiers.'
      },
      {
        q: 'What is the difference between a UUID and a GUID?',
        a: 'They are effectively the same thing — GUID is Microsoft’s name for the UUID format. A GUID from this tool can be used anywhere a .NET or Windows GUID is expected.'
      },
      {
        q: 'Can two generated UUIDs ever collide?',
        a: 'In practice, no. With 122 random bits you would need to generate about 2.7 quintillion UUIDs to have a 50% chance of a single collision. Generating a billion per second would take decades.'
      }
    ]
  };

  const js = frame(`  function uuidv4() {
    if (window.crypto && typeof window.crypto.randomUUID === 'function') {
      return window.crypto.randomUUID();
    }
    var bytes = new Uint8Array(16);
    window.crypto.getRandomValues(bytes);
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    var hex = '';
    for (var i = 0; i < 16; i++) hex += bytes[i].toString(16).padStart(2, '0');
    return hex.slice(0, 8) + '-' + hex.slice(8, 12) + '-' + hex.slice(12, 16) + '-' + hex.slice(16, 20) + '-' + hex.slice(20);
  }

  function generate() {
    var n = parseInt(control('count').value, 10);
    if (!isFinite(n)) n = 5;
    n = Math.max(1, Math.min(100, n));
    var upper = control('uppercase').checked;
    var bare = control('no-hyphens').checked;
    var out = [];
    for (var i = 0; i < n; i++) {
      var id = uuidv4();
      if (bare) id = id.replace(/-/g, '');
      if (upper) id = id.toUpperCase();
      out.push(id);
    }
    setOutput('output', out.join('\\n'));
    status(n + ' v4 UUID' + (n === 1 ? '' : 's') + ' generated with crypto-secure randomness.', 'ok');
  }

  onAction('generate', generate);
  ['count', 'uppercase', 'no-hyphens'].forEach(function (id) {
    control(id).addEventListener('change', generate);
  });
  generate();`);

  return { entry, js };
}
