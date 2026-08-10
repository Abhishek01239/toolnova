import { frame, composeSEO, standardFaq, finalizeEntry } from './helpers.mjs';

// Each generator: UI controls + a self-contained run(vals) function that is
// serialized verbatim into client code. Tests exercise the same function by
// temporarily replacing Math.random with a seeded RNG.
const GENERATORS = {
  'random-number': {
    actionLabel: 'Generate random numbers',
    controls: [
      { type: 'number', id: 'min', label: 'Minimum', value: 1, min: -1000000000, max: 1000000000 },
      { type: 'number', id: 'max', label: 'Maximum', value: 100, min: -1000000000, max: 1000000000 },
      { type: 'number', id: 'count', label: 'How many?', value: 1, min: 1, max: 20, step: 1 }
    ],
    run: function (vals) {
      var out = [];
      var lo = Math.ceil(Math.min(vals.min, vals.max));
      var hi = Math.floor(Math.max(vals.min, vals.max));
      for (var i = 0; i < vals.count; i++) {
        out.push(String(lo + Math.floor(Math.random() * (hi - lo + 1))));
      }
      return out.join('\n');
    }
  },
  'dice': {
    actionLabel: 'Roll the dice',
    controls: [
      { type: 'select', id: 'sides', label: 'Die type', value: '6', options: [4, 6, 8, 10, 12, 20].map((s) => ({ value: String(s), label: `d${s} (${s} sides)` })) },
      { type: 'number', id: 'count', label: 'How many dice?', value: 2, min: 1, max: 20, step: 1 }
    ],
    run: function (vals) {
      var sides = parseInt(vals.sides, 10) || 6;
      var rolls = [];
      for (var i = 0; i < vals.count; i++) rolls.push(1 + Math.floor(Math.random() * sides));
      var lines = rolls.map(function (r, i) { return 'Roll ' + (i + 1) + ' (d' + sides + '): ' + r; });
      var total = rolls.reduce(function (a, b) { return a + b; }, 0);
      return lines.join('\n') + (rolls.length > 1 ? '\n\nTotal: ' + total : '');
    }
  },
  'coin': {
    actionLabel: 'Flip the coin',
    controls: [
      { type: 'number', id: 'count', label: 'How many flips?', value: 1, min: 1, max: 10, step: 1 }
    ],
    run: function (vals) {
      var flips = [];
      var heads = 0;
      for (var i = 0; i < vals.count; i++) {
        var f = Math.random() < 0.5 ? 'Heads' : 'Tails';
        if (f === 'Heads') heads++;
        flips.push(f);
      }
      var summary = vals.count > 1 ? '\n\n' + heads + ' heads, ' + (vals.count - heads) + ' tails' : '';
      return flips.join('\n') + summary;
    }
  },
  'random-color': {
    actionLabel: 'Generate colors',
    controls: [
      { type: 'number', id: 'count', label: 'How many colors?', value: 1, min: 1, max: 8, step: 1 }
    ],
    run: function (vals) {
      var colors = [];
      for (var i = 0; i < vals.count; i++) {
        var hex = '';
        for (var j = 0; j < 6; j++) hex += '0123456789ABCDEF'[Math.floor(Math.random() * 16)];
        colors.push('#' + hex);
      }
      return colors.join('\n');
    }
  },
  'random-letter': {
    actionLabel: 'Generate letters',
    controls: [
      { type: 'number', id: 'count', label: 'How many letters?', value: 1, min: 1, max: 20, step: 1 },
      { type: 'checkbox', id: 'lowercase', label: 'Use lowercase letters', checked: false }
    ],
    run: function (vals) {
      var letters = [];
      for (var i = 0; i < vals.count; i++) {
        letters.push('ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)]);
      }
      var out = letters.join(' ');
      return vals.lowercase ? out.toLowerCase() : out;
    }
  },
  'random-date': {
    actionLabel: 'Generate random dates',
    controls: [
      { type: 'date', id: 'start', label: 'Start of range', value: '2000-01-01' },
      { type: 'date', id: 'end', label: 'End of range', value: '2030-12-31' },
      { type: 'number', id: 'count', label: 'How many dates?', value: 1, min: 1, max: 10, step: 1 }
    ],
    run: function (vals) {
      var start = Date.parse(vals.start + 'T00:00:00Z');
      var end = Date.parse(vals.end + 'T00:00:00Z');
      if (!isFinite(start) || !isFinite(end)) return 'Pick a valid start and end date first.';
      if (end < start) { var t = start; start = end; end = t; }
      var out = [];
      for (var i = 0; i < vals.count; i++) {
        var d = new Date(start + Math.random() * (end - start));
        var iso = d.toISOString().slice(0, 10);
        var weekday = new Date(iso + 'T00:00:00Z').toLocaleDateString('en-US', { weekday: 'long', timeZone: 'UTC' });
        out.push(iso + ' (' + weekday + ')');
      }
      return out.join('\n');
    }
  },
  'yes-or-no': {
    actionLabel: 'Ask again',
    controls: [],
    run: function () {
      return Math.random() < 0.5 ? 'Yes' : 'No';
    }
  },
  'random-password': {
    actionLabel: 'Generate password',
    controls: [
      { type: 'range', id: 'length', label: 'Length', value: 16, min: 4, max: 64 },
      { type: 'checkbox', id: 'uppercase', label: 'Uppercase (A–Z)', checked: true },
      { type: 'checkbox', id: 'numbers', label: 'Numbers (0–9)', checked: true },
      { type: 'checkbox', id: 'symbols', label: 'Symbols (!@#$%…)', checked: true }
    ],
    run: function (vals) {
      var chars = 'abcdefghijklmnopqrstuvwxyz';
      if (vals.uppercase) chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      if (vals.numbers) chars += '0123456789';
      if (vals.symbols) chars += '!@#$%^&*()_+-=[]{}|;:,.<>?';
      if (chars.length === 0) return 'Enable at least one character type.';
      var len = Math.max(4, Math.min(64, Math.floor(vals.length) || 16));
      var out = '';
      for (var i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)];
      return out;
    }
  },
  'lottery-pick': {
    actionLabel: 'Pick numbers',
    controls: [
      { type: 'number', id: 'max', label: 'Number range (1 to …)', value: 49, min: 2, max: 1000 },
      { type: 'number', id: 'count', label: 'How many picks?', value: 6, min: 1, max: 20, step: 1 }
    ],
    run: function (vals) {
      var hi = Math.max(2, Math.floor(vals.max) || 49);
      var n = Math.max(1, Math.min(20, Math.floor(vals.count) || 6));
      if (n > hi) n = hi;
      var pool = [];
      for (var i = 1; i <= hi; i++) pool.push(i);
      for (var j = 0; j < n; j++) {
        var idx = j + Math.floor(Math.random() * (pool.length - j));
        var t = pool[j];
        pool[j] = pool[idx];
        pool[idx] = t;
      }
      var picks = pool.slice(0, n).sort(function (a, b) { return a - b; });
      return picks.join('  ');
    }
  }
};

export const id = 'random-generator';

export function generate(catalogItem, ctx) {
  const key = catalogItem.params?.generator;
  const gen = GENERATORS[key];
  if (!gen) throw new Error(`${catalogItem.id}: unknown generator "${key}"`);

  const title = catalogItem.params.title;
  const { description, intro, seoTitle } = composeSEO(title, catalogItem.blurb, ctx.site);

  const entry = {
    id: catalogItem.id,
    title,
    h1: catalogItem.params.h1 || `${title} — free & online`,
    intro,
    blurb: catalogItem.blurb,
    ui: {
      controls: gen.controls,
      actions: [{ id: 'generate', label: gen.actionLabel, primary: true }],
      outputs: [{ type: 'pre', id: 'result', label: catalogItem.params.outputLabel || 'Result' }]
    },
    howItWorks: [
      'Adjust the options, then press the button — each press produces a fresh random result.',
      'Results come from your browser’s built-in random number generator; nothing is stored or transmitted.',
      'Press the button as many times as you like — every click is a new, independent draw.',
      'The tool runs entirely on your device and keeps working offline once loaded.'
    ],
    examples: catalogItem.examples || [
      ...defaultExamples(key),
      'Every button press produces fresh, independent results — nothing is stored between clicks.'
    ],
    faq: catalogItem.faq || standardFaq(title, catalogItem.blurb),
    description,
    seoTitle
  };

  const controlsJson = JSON.stringify(gen.controls.map((c) => ({ id: c.id, type: c.type, value: c.value })));

  const js = frame(`  var CONTROL_DEFS = ${controlsJson};
  var run = ${gen.run.toString()};

  function go() {
    try {
      var result = run(readControls(CONTROL_DEFS));
      setOutput('result', result);
      var lines = String(result).split('\\n').filter(function (l) { return l.trim() !== ''; });
      status('Generated ' + lines.length + ' result' + (lines.length === 1 ? '' : 's') + '.', 'ok');
    } catch (err) {
      setOutput('result', '');
      status(err && err.message ? err.message : 'Something went wrong.', 'error');
    }
  }

  onAction('generate', go);
  go();`);

  return { entry: finalizeEntry(entry, catalogItem, ctx), js };
}

function defaultExamples(key) {
  switch (key) {
    case 'random-number':
      return ['Set minimum 1, maximum 6 and count 3 to simulate three six-sided dice.'];
    case 'dice':
      return ['Choose a d20 and count 1 for tabletop critical rolls, or roll 5d6 for character stats.'];
    case 'coin':
      return ['Flip once for a quick heads-or-tails decision, or 10 times to see the spread.'];
    case 'random-color':
      return ['Generate one color as a design accent — or eight at once to sketch a palette.'];
    case 'random-letter':
      return ['Generate five letters as initials for a game or a teaching exercise.'];
    case 'random-date':
      return ['Pick a range like 2000-01-01 to 2030-12-31 to create random birthdays, deadlines or test data.'];
    case 'yes-or-no':
      return ['Ask any yes/no question — “Should I take the day off?” — and let fate decide.'];
    case 'random-password':
      return ['Set length 16 with all character types for a strong default, or 24+ for extra headroom on sensitive accounts.'];
    case 'lottery-pick':
      return ['Pick “6 from 49” for a classic lotto game, or set a custom range like 1–90 for regional draws.'];
    default:
      return ['Press the button to generate a fresh result.'];
  }
}

export { GENERATORS };
