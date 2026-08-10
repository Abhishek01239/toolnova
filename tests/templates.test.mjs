// Deterministic guarantee: every item in the emergency pool must generate a
// valid, gated tool through the existing factories — no AI involved.
import test from 'node:test';
import assert from 'node:assert/strict';
import { EMERGENCY_POOL } from '../lib/templates.mjs';
import { validateEntry } from '../lib/registry.js';
import { convertUnit } from '../lib/fns/units.mjs';

const FACTORY_LOADERS = {
  'unit-converter': () => import('../lib/factories/unit-converter.mjs'),
  'random-generator': () => import('../lib/factories/random-generator.mjs'),
  'text-transform': () => import('../lib/factories/text-transform.mjs')
};

const ctx = { site: { name: 'ToolNova' }, today: '2026-08-10' };

for (const item of EMERGENCY_POOL) {
  test(`emergency pool: "${item.id}" generates a valid tool without AI`, async () => {
    const mod = await FACTORY_LOADERS[item.factory]();
    const { entry, js } = mod.generate(item, ctx);
    assert.ok(js.length >= 200, 'client script too short');
    assert.equal(entry.id, item.id);
    assert.ok(entry.title.length >= 3 && entry.title.length <= 70);
    assert.ok(entry.seoTitle.length >= 10 && entry.seoTitle.length <= 80);
    assert.ok(entry.description.length >= 60 && entry.description.length <= 170);
    assert.ok(Array.isArray(entry.faq) && entry.faq.length >= 2);
    assert.ok(Array.isArray(entry.howItWorks) && entry.howItWorks.length >= 2);
    assert.ok(Array.isArray(entry.examples) && entry.examples.length >= 2);
    assert.ok(Array.isArray(entry.keywords) && entry.keywords.length >= 3);
    validateEntry(entry); // throws if invalid
  });
}

// New unit kinds must convert correctly (values are per-base-unit factors).
test('units: energy factors (kWh → J, cal → J)', () => {
  assert.ok(Math.abs(convertUnit({ 'Joule (J)': 1, 'Kilowatt-hour (kWh)': 3600000 }, 1, 'Kilowatt-hour (kWh)', 'Joule (J)') - 3600000) < 1e-6);
  assert.ok(Math.abs(convertUnit({ 'Joule (J)': 1, 'Calorie (cal)': 4.184 }, 100, 'Calorie (cal)', 'Joule (J)') - 418.4) < 1e-9);
});

test('units: pressure factors (bar → Pa, psi → Pa)', () => {
  assert.ok(Math.abs(convertUnit({ 'Pascal (Pa)': 1, 'Bar (bar)': 100000 }, 1, 'Bar (bar)', 'Pascal (Pa)') - 100000) < 1e-9);
  assert.ok(Math.abs(convertUnit({ 'Pascal (Pa)': 1, 'Pound/sq inch (psi)': 6894.757293168 }, 1, 'Pound/sq inch (psi)', 'Pascal (Pa)') - 6894.757293168) < 1e-6);
});