import { frame } from '../../../lib/factories/helpers.mjs';
import { LATIN_WORDS, makeWords, makeSentences, makeParagraphs, capitalize } from '../../../lib/fns/lorem.mjs';

export default function generate(catalogItem, ctx) {
  const entry = {
    id: 'lorem-ipsum-generator',
    title: 'Lorem Ipsum Generator',
    h1: 'Lorem Ipsum Generator — placeholder text',
    seoTitle: 'Lorem Ipsum Generator — Paragraphs, Sentences, Words | ToolNova',
    description:
      'Generate lorem ipsum placeholder text by paragraphs, sentences or words. Classic start option, HTML paragraph wrapping, copy in one click. Free.',
    intro:
      'Generate clean placeholder text for mockups and layouts — by paragraph, sentence or exact word count. Start with the classic “Lorem ipsum dolor sit amet”, optionally wrap paragraphs in HTML tags, and copy everything in one click.',
    category: 'Generators',
    keywords: ['lorem ipsum', 'lorem ipsum generator', 'placeholder text', 'dummy text', 'filler text', 'sample text generator'],
    popularity: 76,
    ui: {
      controls: [
        { type: 'select', id: 'type', label: 'Generate', value: 'paragraphs', options: [
          { value: 'paragraphs', label: 'Paragraphs' },
          { value: 'sentences', label: 'Sentences' },
          { value: 'words', label: 'Words (exact count)' }
        ] },
        { type: 'number', id: 'count', label: 'How many?', value: 3, min: 1, max: 100, step: 1 },
        { type: 'checkbox', id: 'classic', label: 'Start with “Lorem ipsum dolor sit amet…”', checked: true },
        { type: 'checkbox', id: 'html', label: 'Wrap paragraphs in <p> tags', checked: false }
      ],
      actions: [{ id: 'generate', label: 'Generate text', primary: true }],
      outputs: [{ type: 'textarea', id: 'output', label: 'Placeholder text', rows: 12, large: true }]
    },
    howItWorks: [
      'Choose paragraphs, sentences or an exact word count — then hit Generate.',
      'The classic option always opens with “Lorem ipsum dolor sit amet, consectetur…”, the sentence counts vary naturally like real prose.',
      'Enable HTML wrapping and each paragraph is emitted inside <p>…</p> tags, ready to paste into a template.',
      'Copy the whole result with one click. Text is generated locally from a 120-word Latin vocabulary.'
    ],
    examples: [
      '3 paragraphs for a landing-page mockup — enough to judge typography and spacing.',
      '12 words for a tagline placeholder: a realistic length without inventing copy.',
      'Enable <p> wrapping and paste the output straight into static HTML.'
    ],
    faq: [
      {
        q: 'What is lorem ipsum?',
        a: 'It is scrambled Latin derived from a 45 BC text by Cicero. Because the word lengths and letter patterns resemble real English, it lets designers judge layout and typography without readable copy distracting the viewer.'
      },
      {
        q: 'Why use placeholder text instead of real copy?',
        a: 'Real copy is distracting during design reviews — stakeholders read it instead of judging the layout. Neutral filler keeps attention on spacing, hierarchy and readability until copy is ready.'
      },
      {
        q: 'Is the generated text the same every time?',
        a: 'No — sentences are assembled randomly from a Latin word list on each click, so you get fresh filler every time (with the classic opening kept when that option is enabled).'
      },
      {
        q: 'Can I use lorem ipsum on a live site?',
        a: 'It is meant for drafts and mockups only. Search engines and users treat leftover placeholder text as unfinished content, so always replace it before launch.'
      }
    ]
  };

  const js = frame(`  var LATIN = ${JSON.stringify(LATIN_WORDS)};
  ${capitalize.toString()}
  ${makeWords.toString()}
  ${makeSentences.toString()}
  ${makeParagraphs.toString()}

  function go() {
    var type = control('type').value;
    var count = parseInt(control('count').value, 10);
    if (!isFinite(count)) count = 3;
    count = Math.max(1, Math.min(100, count));
    var classic = control('classic').checked;
    var text;
    if (type === 'words') {
      text = capitalize(makeWords(count, LATIN, Math.random, classic).join(' ')) + '.';
    } else if (type === 'sentences') {
      text = makeSentences(count, LATIN, Math.random, classic);
    } else {
      text = makeParagraphs(count, LATIN, Math.random, classic);
      if (control('html').checked) {
        text = text.split('\\n\\n').map(function (p) { return '<p>' + p + '</p>'; }).join('\\n');
      }
    }
    setOutput('output', text);
    var words = (text.replace(/<[^>]+>/g, ' ').match(/\\S+/g) || []).length;
    status(words.toLocaleString('en-US') + ' words generated.', 'ok');
  }

  onAction('generate', go);
  ['type', 'count', 'classic', 'html'].forEach(function (id) {
    control(id).addEventListener('change', go);
  });
  go();`);

  return { entry, js };
}
