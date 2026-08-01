import { kebab } from './html.js';

// Canonical category metadata. Category pages are generated for any category
// that has at least one live tool; unknown categories fall back to 🔧.
export const CATEGORIES = {
  'Text': { emoji: '📝', blurb: 'Count, convert, clean and transform text of any kind.' },
  'Developer': { emoji: '💻', blurb: 'Formatters, validators and everyday utilities for developers.' },
  'JSON': { emoji: '🧾', blurb: 'Format, validate, convert and inspect JSON data.' },
  'Encoding': { emoji: '🔡', blurb: 'Encode and decode text between Base64, URL, hex and more.' },
  'Security': { emoji: '🔐', blurb: 'Passwords, hashes and privacy-friendly security utilities.' },
  'Password': { emoji: '🔑', blurb: 'Generate and check strong passwords locally in your browser.' },
  'UUID': { emoji: '🆔', blurb: 'Generate and validate UUIDs of every version.' },
  'Hash': { emoji: '#️⃣', blurb: 'Compute cryptographic hashes entirely offline.' },
  'Date & Time': { emoji: '📅', blurb: 'Age, date-difference, timezone and countdown tools.' },
  'Unit Converter': { emoji: '📏', blurb: 'Convert between units of length, mass, temperature and more.' },
  'Math': { emoji: '➗', blurb: 'Everyday math calculators that show their working.' },
  'Finance': { emoji: '💰', blurb: 'Loan, EMI, interest and investment calculators.' },
  'Calculators': { emoji: '🧮', blurb: 'Fast calculators for daily life, health and percentages.' },
  'Generators': { emoji: '✨', blurb: 'Generate text, data, names and ideas in one click.' },
  'Random Generators': { emoji: '🎲', blurb: 'Random numbers, dice, colors, letters and decisions.' },
  'Color': { emoji: '🎨', blurb: 'Pick, convert and check colors for accessible design.' },
  'Design': { emoji: '🖌️', blurb: 'CSS generators and design helpers for the web.' },
  'SEO': { emoji: '🔍', blurb: 'Meta tags, slugs, robots.txt and search-preview tools.' },
  'Social Media': { emoji: '📣', blurb: 'Preview cards and craft posts for social platforms.' },
  'Markdown': { emoji: '⬇️', blurb: 'Write, preview and convert Markdown.' },
  'CSV': { emoji: '📊', blurb: 'Convert between CSV, JSON and other tabular formats.' },
  'Productivity': { emoji: '⏱️', blurb: 'Timers, checklists and focus tools that respect your data.' },
  'Image': { emoji: '🖼️', blurb: 'Compress, resize and convert images locally.' },
  'PDF': { emoji: '📄', blurb: 'Merge, split and rotate PDFs without uploads.' },
  'Validators': { emoji: '✅', blurb: 'Validate data formats instantly.' },
  'Regex': { emoji: '🔎', blurb: 'Build and test regular expressions with live feedback.' },
  'QR Code': { emoji: '🔳', blurb: 'Generate QR codes in the browser.' },
  'Utilities': { emoji: '🧰', blurb: 'Handy everyday utilities that are hard to categorize.' }
};

export function categoryMeta(name) {
  return CATEGORIES[name] || { emoji: '🔧', blurb: `Free online ${String(name).toLowerCase()} tools.` };
}

export function categorySlug(name) {
  return kebab(name);
}

export function categoryEmoji(name) {
  return categoryMeta(name).emoji;
}
