import { frame } from '../../../lib/factories/helpers.mjs';
import { computeWordStats, formatDuration, COMMON_WORDS } from '../../../lib/fns/wordcount.mjs';

export default function generate(catalogItem, ctx) {
  const entry = {
    id: 'word-counter',
    title: 'Word Counter',
    h1: 'Word Counter — count words, characters & reading time',
    seoTitle: 'Word Counter — Count Words, Characters & Reading Time | ToolNova',
    description:
      'Count words, characters, sentences and paragraphs instantly, with reading time and keyword density. Free, private, no sign-up — runs in your browser.',
    intro:
      'Paste or type any text to get instant live statistics: word count, characters with and without spaces, sentences, paragraphs, estimated reading and speaking time, plus the most-used keywords. Nothing is uploaded — counting happens in your browser.',
    category: 'Text',
    keywords: ['word counter', 'character counter', 'word count online', 'count words', 'reading time calculator', 'text counter', 'keyword density'],
    popularity: 92,
    ui: {
      layout: 'single',
      controls: [
        {
          type: 'textarea',
          id: 'text',
          label: 'Your text',
          rows: 13,
          placeholder: 'Start typing or paste your text here — statistics update live as you type…',
          mono: false
        }
      ],
      actions: [{ id: 'clear', label: 'Clear text' }],
      outputs: [
        { type: 'stats', id: 'stats', label: 'Live statistics' },
        { type: 'pre', id: 'keywords', label: 'Top keywords (density)' }
      ]
    },
    howItWorks: [
      'Type or paste your text into the box — every statistic updates live with each keystroke.',
      'Words are counted using Unicode-aware boundaries, so it works for any language and script.',
      'Reading time assumes 200 words per minute; speaking time assumes a calm 130 words per minute.',
      'The keyword list shows your most frequent meaningful words (common words like “the” are filtered out) and their density percentage.',
      'Use the Clear button to start over. Nothing you type is stored or sent anywhere.'
    ],
    examples: [
      'Paste a 1,500-word blog post to confirm it reads in about 7–8 minutes.',
      'Draft a 280-character social post and watch the character count stay honest in real time.',
      'Check keyword density before publishing an article to avoid over-using a term.'
    ],
    faq: [
      {
        q: 'How are words counted?',
        a: 'A word is any run of letters or numbers, including internal apostrophes and hyphens (so “it’s” and “high-quality” count as one word each). Matching is Unicode-aware, which means accented and non-Latin scripts count correctly too.'
      },
      {
        q: 'Does it count characters with and without spaces?',
        a: 'Yes. You get both numbers: total characters including whitespace, and characters with all whitespace removed — the metric most form limits care about.'
      },
      {
        q: 'How accurate is the reading time estimate?',
        a: 'It assumes an average adult reading speed of 200 words per minute and a speaking pace of 130 words per minute. Real times vary with content difficulty, so treat it as a solid estimate rather than an exact figure.'
      },
      {
        q: 'Is there a limit to how much text I can paste?',
        a: 'No hard limit — everything is computed locally in your browser. Even a full novel processes instantly on a modern device, and your text never leaves your machine.'
      }
    ]
  };

  const js = frame(`  var STOP_WORDS = ${JSON.stringify(COMMON_WORDS)};
  var compute = ${computeWordStats.toString()};
  var fmtDuration = ${formatDuration.toString()};

  function render() {
    var stats = compute(control('text').value, STOP_WORDS);
    setStats('stats', [
      ['Words', stats.words.toLocaleString('en-US')],
      ['Characters', stats.characters.toLocaleString('en-US')],
      ['No spaces', stats.charactersNoSpaces.toLocaleString('en-US')],
      ['Sentences', stats.sentences.toLocaleString('en-US')],
      ['Paragraphs', stats.paragraphs.toLocaleString('en-US')],
      ['Lines', stats.lines.toLocaleString('en-US')],
      ['Reading time', fmtDuration(stats.readingSeconds)],
      ['Speaking time', fmtDuration(stats.speakingSeconds)]
    ]);
    var kw = stats.keywords.map(function (k) {
      return k.word + ' — ' + k.count + '× (' + k.percent.toFixed(1) + '%)';
    });
    setOutput('keywords', kw.length ? kw.join('\\n') : '—');
    if (stats.words > 0) status(stats.words.toLocaleString('en-US') + ' words counted.', 'ok');
    else status('');
  }

  control('text').addEventListener('input', render);
  onAction('clear', function () {
    control('text').value = '';
    control('text').focus();
    render();
  });
  render();`);

  return { entry, js };
}
