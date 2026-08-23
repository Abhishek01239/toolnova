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
  },
  // --- Extra deterministic supply so the backstop can never run dry ----------
  // (the four originals above can themselves be exhausted once they go live;
  // these keep the run from ever ending empty-handed even with zero AI).
  {
    id: 'reverse-text-tool',
    factory: 'text-transform',
    category: 'Text',
    keywords: ['reverse text', 'backwards text', 'mirror text', 'reverse string'],
    blurb: 'Flip any text backwards character by character — handy for puzzles, obfuscation and quick checks.',
    params: { title: 'Reverse Text Tool', h1: 'Reverse Text Tool — flip any string backwards', transforms: ['reverse-text'], rows: 8 },
    popularity: 48
  },
  {
    id: 'title-case-tool',
    factory: 'text-transform',
    category: 'Text',
    keywords: ['title case', 'capitalize words', 'title case converter', 'headline case'],
    blurb: 'Convert any sentence into clean Title Case for headings, titles and labels in one click.',
    params: { title: 'Title Case Converter', h1: 'Title Case Converter', transforms: ['title-case'], rows: 8 },
    popularity: 52
  },
  {
    id: 'sentence-case-tool',
    factory: 'text-transform',
    category: 'Text',
    keywords: ['sentence case', 'sentence case converter', 'capitalize first letter'],
    blurb: 'Normalize messy text into proper Sentence case with the first letter of every sentence capitalized.',
    params: { title: 'Sentence Case Converter', h1: 'Sentence Case Converter', transforms: ['sentence-case'], rows: 8 },
    popularity: 50
  },
  {
    id: 'strip-html-tool',
    factory: 'text-transform',
    category: 'Text',
    keywords: ['strip html', 'remove html tags', 'html to text', 'clean html'],
    blurb: 'Strip HTML tags from any snippet and keep the plain readable text behind the markup.',
    params: { title: 'Strip HTML Tags', h1: 'Strip HTML Tags — plain text from markup', transforms: ['strip-html'], rows: 8 },
    popularity: 47
  },
  {
    id: 'extract-emails-tool',
    factory: 'text-transform',
    category: 'Text',
    keywords: ['extract emails', 'email extractor', 'find email addresses', 'collect emails'],
    blurb: 'Pull every email address out of a block of text and list them one per line, duplicates removed.',
    params: { title: 'Extract Emails Tool', h1: 'Extract Emails from any text', transforms: ['extract-emails'], rows: 8 },
    popularity: 54
  },
  {
    id: 'sort-lines-tool',
    factory: 'text-transform',
    category: 'Text',
    keywords: ['sort lines', 'alphabetize lines', 'sort list', 'sort text lines'],
    blurb: 'Alphabetically sort a pasted list of lines A→Z (or Z→A) in a single click.',
    params: { title: 'Sort Lines Tool', h1: 'Sort Lines — alphabetize any list', transforms: ['sort-lines'], rows: 8 },
    popularity: 46
  },
  {
    id: 'dedupe-lines-tool',
    factory: 'text-transform',
    category: 'Text',
    keywords: ['remove duplicate lines', 'dedupe lines', 'unique lines', 'delete duplicates'],
    blurb: 'Remove duplicate lines from any list while keeping the order of the first occurrence.',
    params: { title: 'Remove Duplicate Lines Tool', h1: 'Remove Duplicate Lines Tool', transforms: ['dedupe-lines'], rows: 8 },
    popularity: 49
  }
];