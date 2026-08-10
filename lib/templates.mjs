// Deterministic tool pool — the pipeline's last-resort supply.
//
// Every item is a self-contained catalog-style spec that drives the EXISTING
// vetted factories (unit-converter, random-generator, text-transform). No AI
// involvement, no catalog entries required: if the backlog is exhausted or the
// AI provider is down, the pipeline adds one of these instead of skipping.
// The full quality gate (tests → build → verify) still applies.

export const EMERGENCY_POOL = [
  {
    id: 'energy-converter',
    factory: 'unit-converter',
    category: 'Unit Converter',
    keywords: ['energy converter', 'joules to calories', 'kwh to mj', 'wh to kwh'],
    blurb: 'Convert energy between joules, kilowatt-hours, calories, BTU, electronvolts and more with exact physical factors.',
    params: { title: 'Energy Converter', h1: 'Energy Converter — J, kWh, cal, BTU', kind: 'energy', sampleValue: 100 },
    popularity: 55
  },
  {
    id: 'pressure-converter',
    factory: 'unit-converter',
    category: 'Unit Converter',
    keywords: ['pressure converter', 'bar to psi', 'kpa to psi', 'atm to bar', 'mmhg to kpa'],
    blurb: 'Convert pressure between pascals, bar, atmospheres, psi and mmHg for engineering, weather and diving data.',
    params: { title: 'Pressure Converter', h1: 'Pressure Converter — Pa, bar, psi, atm', kind: 'pressure', sampleValue: 1 },
    popularity: 55
  },
  {
    id: 'random-password-generator',
    factory: 'random-generator',
    category: 'Random Generators',
    keywords: ['random password generator', 'strong password generator', 'password maker', 'secure password'],
    blurb: 'Generate strong random passwords with an adjustable length slider and toggles for uppercase, numbers and symbols.',
    params: { title: 'Random Password Generator', h1: 'Random Password Generator — strong & custom', generator: 'random-password', outputLabel: 'Your password' },
    popularity: 68
  },
  {
    id: 'add-line-numbers',
    factory: 'text-transform',
    category: 'Text',
    keywords: ['add line numbers', 'number lines', 'line numbering tool', 'numbered list'],
    blurb: 'Add sequential line numbers to any pasted text or list, perfect for code excerpts, scripts and numbered instruction sets.',
    params: { title: 'Add Line Numbers', h1: 'Add Line Numbers to text & lists', transforms: ['add-line-numbers'], rows: 12 },
    popularity: 45
  }
];