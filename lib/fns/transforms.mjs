// Pure text transforms. Design contract: every function is self-contained
// (no module-scope references) and uses no template literals, so it can be
// serialized with fn.toString() directly into generated client-side code.

export function toUpper(text) {
  return text.toUpperCase();
}

export function toLower(text) {
  return text.toLowerCase();
}

export function toTitleCase(text) {
  return text.toLowerCase().replace(/[\p{L}\p{N}][\p{L}\p{N}'’-]*/gu, function (word) {
    return word.charAt(0).toUpperCase() + word.slice(1);
  });
}

export function toSentenceCase(text) {
  var lower = text.toLowerCase();
  return lower.replace(/(^|[.!?]\s+|[\n]+\s*)([\p{L}])/gu, function (m, prefix, letter) {
    return prefix + letter.toUpperCase();
  });
}

export function toCamelCase(text) {
  var words = text.toLowerCase().match(/[\p{L}\p{N}]+/gu) || [];
  return words.map(function (w, i) {
    return i === 0 ? w : w.charAt(0).toUpperCase() + w.slice(1);
  }).join('');
}

export function toPascalCase(text) {
  var words = text.toLowerCase().match(/[\p{L}\p{N}]+/gu) || [];
  return words.map(function (w) {
    return w.charAt(0).toUpperCase() + w.slice(1);
  }).join('');
}

export function toSnakeCase(text) {
  var words = text.toLowerCase().match(/[\p{L}\p{N}]+/gu) || [];
  return words.join('_');
}

export function toKebabCase(text) {
  var words = text.toLowerCase().match(/[\p{L}\p{N}]+/gu) || [];
  return words.join('-');
}

export function toConstantCase(text) {
  var words = text.toUpperCase().match(/[\p{L}\p{N}]+/gu) || [];
  return words.join('_');
}

export function reverseText(text) {
  return [...text].reverse().join('');
}

export function reverseLines(text) {
  return text.split('\n').reverse().join('\n');
}


export function sortLines(text) {
  return text.split('\n').slice().sort(function (a, b) {
    return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
  }).join('\n');
}

export function sortLinesReverse(text) {
  return text.split('\n').slice().sort(function (a, b) {
    return b.localeCompare(a, undefined, { numeric: true, sensitivity: 'base' });
  }).join('\n');
}

export function dedupeLines(text) {
  var seen = new Set();
  return text.split('\n').filter(function (line) {
    if (seen.has(line)) return false;
    seen.add(line);
    return true;
  }).join('\n');
}

export function trimLines(text) {
  return text.split('\n').map(function (line) { return line.trim(); }).join('\n');
}

export function removeEmptyLines(text) {
  return text.split('\n').filter(function (line) { return line.trim() !== ''; }).join('\n');
}

export function removeExtraSpaces(text) {
  return text.split('\n').map(function (line) {
    return line.replace(/[ \t]+/g, ' ').trim();
  }).join('\n');
}

export function stripHtmlTags(text) {
  var entities = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'", '&nbsp;': ' ', '&apos;': "'" };
  return text
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|li|h[1-6]|tr)>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&(amp|lt|gt|quot|nbsp|apos|#39);/g, function (m) { return entities[m] || m; })
    .replace(/\n{3,}/g, '\n\n');
}

export function extractEmails(text) {
  var matches = text.match(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g) || [];
  return [...new Set(matches)].join('\n');
}

export function extractUrls(text) {
  var matches = text.match(/https?:\/\/[^\s<>"'()]+/g) || [];
  return [...new Set(matches)].join('\n');
}

export function addLineNumbers(text) {
  return text.split('\n').map(function (line, i) {
    return (i + 1) + '. ' + line;
  }).join('\n');
}

export function removeDuplicateWords(text) {
  var seen = new Set();
  var words = text.match(/[\p{L}\p{N}'’-]+|[^\s\p{L}\p{N}'’-]+|\s+/gu) || [];
  var out = words.filter(function (w) {
    if (!/[\p{L}\p{N}]/u.test(w)) return true;
    var key = w.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).join('');
  // Tidy the gaps left behind by removed words (keep newlines intact).
  return out.replace(/[^\S\n]{2,}/g, ' ').replace(/ +\n/g, '\n');
}
