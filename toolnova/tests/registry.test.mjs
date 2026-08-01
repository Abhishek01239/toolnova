import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateEntry, normalizeEntry, validateRegistry, ValidationError } from '../lib/registry.js';

function validEntry() {
  return {
    id: 'sample-tool',
    title: 'Sample Tool',
    seoTitle: 'Sample Tool — Free Online Utility | ToolNova',
    description: 'A sample tool used by the test suite to verify the registry validation contract works.',
    intro: 'A slightly longer introduction for the sample tool, shown under the H1 on the tool page.',
    h1: 'Sample Tool — does sample things',
    keywords: ['sample', 'test', 'tool'],
    category: 'Text',
    added: '2026-07-31',
    popularity: 50,
    ui: {
      controls: [{ type: 'textarea', id: 'input', label: 'Input text' }],
      actions: [{ id: 'go', label: 'Go', primary: true }],
      outputs: [{ type: 'textarea', id: 'output', label: 'Result' }]
    },
    howItWorks: ['The first step takes long enough to pass.', 'The second step is also sufficient.'],
    examples: ['A first concrete example here.', 'A second concrete example here.'],
    faq: [
      { q: 'Is this a valid enough question?', a: 'Yes, this is a valid enough answer to pass checks.' },
      { q: 'And is this a second question?', a: 'Indeed, a second answer rich enough for the schema.' }
    ],
    blurb: 'A sample tool.'
  };
}

test('a valid entry passes', () => {
  assert.equal(validateEntry(validEntry()), true);
});

test('normalizeEntry trims and fills blurb', () => {
  const e = validEntry();
  e.title = '  Sample Tool  ';
  delete e.blurb;
  const n = normalizeEntry(e);
  assert.equal(n.title, 'Sample Tool');
  assert.equal(n.blurb, n.description);
});

test('missing/short fields are rejected', () => {
  const cases = [
    (e) => { e.id = 'Bad ID!'; },
    (e) => { e.title = 'Hi'; },
    (e) => { e.seoTitle = 'short'; },
    (e) => { e.description = 'too short'; },
    (e) => { e.intro = 'tiny'; },
    (e) => { e.h1 = 'x'; },
    (e) => { e.keywords = ['only-one']; },
    (e) => { e.added = '31 July 2026'; },
    (e) => { e.popularity = 101; },
    (e) => { e.ui.controls = [{ type: 'hologram', id: 'x', label: 'X' }]; },
    (e) => { e.ui.controls = [{ type: 'select', id: 's', label: 'S', options: [] }]; },
    (e) => { e.ui.actions.push({ id: 'go2', label: 'G2', primary: true }); },
    (e) => { e.ui.outputs = []; },
    (e) => { e.howItWorks = ['only one step here that is long']; },
    (e) => { e.examples = ['lone example that is fine']; },
    (e) => { e.faq = [{ q: 'Only one with length', a: 'answers are irrelevant when alone but long' }]; }
  ];
  for (const mutate of cases) {
    const e = validEntry();
    mutate(e);
    assert.throws(() => validateEntry(e), ValidationError, JSON.stringify(e.ui ? '' : ''));
  }
});

test('duplicate ids and titles are caught across the registry', () => {
  const a = validEntry();
  const dup = validEntry();
  assert.throws(() => validateRegistry([a, dup]), /duplicate tool id/);
  const b = validEntry();
  b.id = 'other-tool';
  assert.throws(() => validateRegistry([a, b]), /duplicate title/);
});
