// Slug generation — pure and serialization-safe.

export const STOPWORDS = [
  'a', 'an', 'and', 'the', 'or', 'but', 'of', 'at', 'by', 'for', 'with',
  'about', 'into', 'to', 'in', 'on', 'is', 'are', 'was', 'were', 'be',
  'been', 'it', 'its', 'as', 'from', 'that', 'this', 'these', 'those'
];

export function slugify(text, options) {
  var opts = options || {};
  var separator = opts.separator === undefined ? '-' : opts.separator;
  var stopwords = opts.stopwords || [];
  var maxLength = opts.maxLength || 0;

  var cleaned = String(text)
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/['’]/g, '');

  // ASCII-only slugs: scripts without a Latin mapping are omitted, matching
  // what WordPress and most CMSs do for non-Latin titles.
  var words = cleaned.match(/[a-z0-9]+/g) || [];
  var stop = new Set(stopwords);
  words = words.filter(function (w) { return !stop.has(w); });

  var slug = words.join(separator);
  if (maxLength > 0 && slug.length > maxLength) {
    slug = slug.slice(0, maxLength);
    var cut = slug.lastIndexOf(separator);
    if (cut > 0) slug = slug.slice(0, cut);
  }
  var edge = new RegExp('^[' + separator.replace(/[-]/g, '\\-') + ']+|[' + separator.replace(/[-]/g, '\\-') + ']+$', 'g');
  return slug.replace(edge, '');
}
