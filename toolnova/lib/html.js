// Tiny HTML helpers shared by every renderer.
export function esc(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function escAttr(value) {
  return esc(value);
}

// Renders an attribute only when the value is not null/undefined/false.
export function attr(name, value) {
  if (value === null || value === undefined || value === false) return '';
  if (value === true) return ` ${name}`;
  return ` ${name}="${escAttr(value)}"`;
}

export function kebab(str) {
  return String(str)
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function truncate(str, max) {
  const s = String(str);
  if (s.length <= max) return s;
  return s.slice(0, max - 1).replace(/[\s.,;:!?-]*$/, '') + '…';
}
