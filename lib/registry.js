// Strict validation + normalization for tools.json entries.
// Every tool — factory-generated or hand-written — must satisfy this contract
// before it can be committed. This is the core of the quality gate.

const CONTROL_TYPES = new Set(['textarea', 'text', 'number', 'date', 'select', 'checkbox', 'range']);
const OUTPUT_TYPES = new Set(['textarea', 'text', 'pre', 'stats']);
const ID_RE = /^[a-z0-9][a-z0-9-]{1,60}$/;

export class ValidationError extends Error {
  constructor(toolId, problems) {
    super(`Tool "${toolId}" failed validation:\n  - ${problems.join('\n  - ')}`);
    this.problems = problems;
  }
}

function checkIdUniqueness(kind, items, getId, problems) {
  const seen = new Set();
  for (const item of items) {
    const id = getId(item);
    if (seen.has(id)) problems.push(`duplicate ${kind} id "${id}"`);
    seen.add(id);
  }
}

export function validateEntry(entry) {
  const problems = [];
  const id = entry && entry.id ? entry.id : '(unknown)';

  if (!entry || typeof entry !== 'object') throw new ValidationError('(none)', ['entry is not an object']);

  if (!ID_RE.test(entry.id || '')) problems.push(`id "${entry.id}" must be kebab-case (2–61 chars)`);
  if (typeof entry.title !== 'string' || entry.title.length < 3 || entry.title.length > 70) {
    problems.push('title must be 3–70 characters');
  }
  if (typeof entry.seoTitle !== 'string' || entry.seoTitle.length < 10 || entry.seoTitle.length > 80) {
    problems.push('seoTitle must be 10–80 characters');
  }
  if (typeof entry.description !== 'string' || entry.description.length < 60 || entry.description.length > 170) {
    problems.push(`description must be 60–170 characters (got ${entry.description ? entry.description.length : 0})`);
  }
  if (typeof entry.intro !== 'string' || entry.intro.length < 40) {
    problems.push('intro must be at least 40 characters (shown under the H1)');
  }
  if (typeof entry.h1 !== 'string' || entry.h1.length < 5 || entry.h1.length > 90) {
    problems.push('h1 must be 5–90 characters');
  }
  if (!Array.isArray(entry.keywords) || entry.keywords.length < 3) problems.push('keywords must have at least 3 items');
  if (typeof entry.category !== 'string' || entry.category.length < 2) problems.push('category is required');
  if (typeof entry.added !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(entry.added)) {
    problems.push('added must be an ISO date (YYYY-MM-DD)');
  }
  if (!Number.isInteger(entry.popularity) || entry.popularity < 0 || entry.popularity > 100) {
    problems.push('popularity must be an integer 0–100');
  }

  // ---- UI spec ----
  const ui = entry.ui || {};
  if (!Array.isArray(ui.controls)) problems.push('ui.controls must be an array');
  if (!Array.isArray(ui.outputs) || ui.outputs.length === 0) problems.push('ui.outputs must have at least one output');
  if (!Array.isArray(ui.actions)) problems.push('ui.actions must be an array (may be empty)');

  if (Array.isArray(ui.controls)) {
    checkIdUniqueness('control', ui.controls, (c) => c.id, problems);
    for (const c of ui.controls) {
      if (!CONTROL_TYPES.has(c.type)) {
        problems.push(`unknown control type "${c.type}" (allowed: ${[...CONTROL_TYPES].join(', ')})`);
        continue;
      }
      if (!c.id || !/^[a-z][a-z0-9-]*$/.test(c.id)) problems.push(`control id "${c.id}" must be lowercase`);
      if (c.type !== 'checkbox' && (!c.label || typeof c.label !== 'string')) {
        problems.push(`control "${c.id}" needs a label`);
      }
      if (c.type === 'checkbox' && (!c.label || typeof c.label !== 'string')) {
        problems.push(`checkbox "${c.id}" needs a label`);
      }
      if (c.type === 'select' && (!Array.isArray(c.options) || c.options.length === 0)) {
        problems.push(`select "${c.id}" needs at least one option`);
      }
      if (c.type === 'range' && (c.min === undefined || c.max === undefined)) {
        problems.push(`range "${c.id}" needs min and max`);
      }
    }
  }
  if (Array.isArray(ui.actions)) {
    checkIdUniqueness('action', ui.actions, (a) => a.id, problems);
    for (const a of ui.actions) {
      if (!a.id || !/^[a-z][a-z0-9-]*$/.test(a.id)) problems.push(`action id "${a.id}" must be lowercase`);
      if (!a.label) problems.push(`action "${a.id}" needs a label`);
    }
    const primaryCount = ui.actions.filter((a) => a.primary).length;
    if (primaryCount > 1) problems.push('at most one action may be primary');
  }
  if (Array.isArray(ui.outputs)) {
    checkIdUniqueness('output', ui.outputs, (o) => o.id, problems);
    for (const o of ui.outputs) {
      if (!OUTPUT_TYPES.has(o.type)) {
        problems.push(`unknown output type "${o.type}" (allowed: ${[...OUTPUT_TYPES].join(', ')})`);
      }
      if (!o.id || !/^[a-z][a-z0-9-]*$/.test(o.id)) problems.push(`output id "${o.id}" must be lowercase`);
    }
  }

  // ---- Content sections ----
  const stringArray = (key, min, minLen) => {
    if (!Array.isArray(entry[key]) || entry[key].length < min) {
      problems.push(`${key} must be an array of at least ${min} strings`);
      return;
    }
    for (const s of entry[key]) {
      if (typeof s !== 'string' || s.length < minLen) problems.push(`every ${key} item must be ≥${minLen} characters`);
    }
  };
  stringArray('howItWorks', 2, 15);
  stringArray('examples', 2, 10);

  if (!Array.isArray(entry.faq) || entry.faq.length < 2) {
    problems.push('faq must have at least 2 items');
  } else {
    for (const f of entry.faq) {
      if (typeof f.q !== 'string' || f.q.length < 10) problems.push('faq questions must be ≥10 characters');
      if (typeof f.a !== 'string' || f.a.length < 20) problems.push('faq answers must be ≥20 characters');
    }
  }

  if (problems.length) throw new ValidationError(id, problems);
  return true;
}

// Normalizes an entry: fills computed fields, trims strings.
export function normalizeEntry(entry) {
  const out = { ...entry };
  out.id = out.id.trim();
  out.title = out.title.trim();
  out.seoTitle = out.seoTitle.trim();
  out.description = out.description.trim();
  out.intro = out.intro.trim();
  out.h1 = out.h1.trim();
  out.keywords = [...new Set(out.keywords.map((k) => String(k).trim()).filter(Boolean))];
  out.blurb = (out.blurb || out.description).trim();
  return out;
}

// Cross-entry checks run by the build over the whole registry.
export function validateRegistry(tools) {
  const problems = [];
  const ids = new Set();
  const titles = new Set();
  const seoTitles = new Set();
  for (const tool of tools) {
    try {
      validateEntry(tool);
    } catch (err) {
      problems.push(err.message);
      continue;
    }
    if (ids.has(tool.id)) problems.push(`duplicate tool id "${tool.id}"`);
    if (titles.has(tool.title.toLowerCase())) problems.push(`duplicate title "${tool.title}"`);
    if (seoTitles.has(tool.seoTitle.toLowerCase())) problems.push(`duplicate seoTitle "${tool.seoTitle}"`);
    ids.add(tool.id);
    titles.add(tool.title.toLowerCase());
    seoTitles.add(tool.seoTitle.toLowerCase());
  }
  if (problems.length) throw new ValidationError('registry', problems);
  return true;
}
