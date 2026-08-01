// Word/text statistics — pure and serialization-safe.

export const COMMON_WORDS = [
  'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i', 'it', 'for',
  'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at', 'this', 'but', 'his',
  'by', 'from', 'they', 'we', 'say', 'her', 'she', 'or', 'an', 'will', 'my',
  'one', 'all', 'would', 'there', 'their', 'what', 'so', 'up', 'out', 'if',
  'about', 'who', 'get', 'which', 'go', 'me', 'when', 'make', 'can', 'like',
  'time', 'no', 'just', 'him', 'know', 'take', 'people', 'into', 'year',
  'your', 'good', 'some', 'could', 'them', 'see', 'other', 'than', 'then',
  'now', 'look', 'only', 'come', 'its', 'over', 'think', 'also', 'back',
  'after', 'use', 'two', 'how', 'our', 'work', 'first', 'well', 'way',
  'even', 'new', 'want', 'because', 'any', 'these', 'give', 'day', 'most',
  'us', 'is', 'are', 'was', 'were', 'been', 'has', 'had', 'did', 'am'
];

export function computeWordStats(text, stopwords) {
  var stop = new Set(stopwords || []);
  var words = text.match(/[\p{L}\p{N}]+(?:['’-][\p{L}\p{N}]+)*/gu) || [];
  var sentences = text.split(/[.!?]+/).map(function (s) { return s.trim(); }).filter(function (s) { return s.length > 0; }).length;
  var paragraphs = text.split(/\n\s*\n/).map(function (s) { return s.trim(); }).filter(function (s) { return s.length > 0; }).length;

  var freq = new Map();
  for (var i = 0; i < words.length; i++) {
    var w = words[i].toLowerCase().replace(/^['’-]+|['’-]+$/g, '');
    if (w.length < 3 || stop.has(w) || /^\d+$/.test(w)) continue;
    freq.set(w, (freq.get(w) || 0) + 1);
  }
  var keywords = [...freq.entries()]
    .sort(function (a, b) { return b[1] - a[1] || a[0].localeCompare(b[0]); })
    .slice(0, 8)
    .map(function (entry) {
      return { word: entry[0], count: entry[1], percent: words.length ? (entry[1] / words.length) * 100 : 0 };
    });

  return {
    words: words.length,
    characters: text.length,
    charactersNoSpaces: text.replace(/\s/g, '').length,
    sentences: sentences,
    paragraphs: paragraphs,
    lines: text === '' ? 0 : text.split('\n').length,
    readingSeconds: Math.ceil((words.length / 200) * 60),
    speakingSeconds: Math.ceil((words.length / 130) * 60),
    keywords: keywords
  };
}

export function formatDuration(totalSeconds) {
  if (totalSeconds < 60) return totalSeconds + ' sec';
  var minutes = Math.floor(totalSeconds / 60);
  var seconds = totalSeconds % 60;
  if (minutes < 60) return minutes + ' min' + (seconds ? ' ' + seconds + ' sec' : '');
  var hours = Math.floor(minutes / 60);
  var restMin = minutes % 60;
  return hours + ' h' + (restMin ? ' ' + restMin + ' min' : '');
}
