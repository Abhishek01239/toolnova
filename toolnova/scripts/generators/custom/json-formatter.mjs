import { frame } from '../../../lib/factories/helpers.mjs';

export default function generate(catalogItem, ctx) {
  const entry = {
    id: 'json-formatter',
    title: 'JSON Formatter & Validator',
    h1: 'JSON Formatter, Validator & Minifier',
    seoTitle: 'JSON Formatter & Validator — Beautify, Minify Online | ToolNova',
    description:
      'Format, validate and minify JSON instantly. Precise error location with line and column, key sorting, 2/4-space or tab indent, and file download. Free.',
    intro:
      'Paste raw JSON to beautify, validate or minify it in one click. Errors are pinpointed with line and column, keys can be sorted alphabetically, and the result can be copied or downloaded as a .json file — all offline, in your browser.',
    category: 'JSON',
    keywords: ['json formatter', 'json validator', 'json beautifier', 'json minifier', 'format json online', 'json pretty print', 'validate json'],
    popularity: 91,
    ui: {
      layout: 'single',
      controls: [
        { type: 'textarea', id: 'input', label: 'Paste your JSON', rows: 12, placeholder: '{"hello":"world","numbers":[1,2,3]}' },
        { type: 'select', id: 'indent', label: 'Indentation', value: '2', options: [
          { value: '2', label: '2 spaces' },
          { value: '4', label: '4 spaces' },
          { value: 'tab', label: 'Tab' }
        ] },
        { type: 'checkbox', id: 'sort-keys', label: 'Sort object keys alphabetically (recursive)', checked: false }
      ],
      actions: [
        { id: 'format', label: 'Format / beautify', primary: true },
        { id: 'minify', label: 'Minify' },
        { id: 'validate', label: 'Validate only' },
        { id: 'download', label: 'Download .json' }
      ],
      outputs: [{ type: 'textarea', id: 'output', label: 'Formatted output', rows: 12, large: true }]
    },
    howItWorks: [
      'Paste JSON into the input box and choose Format, Minify or Validate.',
      'Invalid JSON is reported with the parser’s message translated into a line and column position so you can jump straight to the problem.',
      'Formatting supports 2 spaces, 4 spaces or tabs, and can recursively sort object keys — useful when diffing two documents.',
      'Minify removes every unnecessary byte of whitespace and reports how many bytes you saved.',
      'Download writes the current output to a .json file locally. Nothing is uploaded at any point.'
    ],
    examples: [
      'Input `{"a":1,"b":[true,null]}` → Format → pretty-printed with your chosen indentation.',
      'Input `{"a":1,}` → error reported at the trailing comma, with exact line and column.',
      'Minify a 12 KB pretty-printed config to a single line and see the byte savings.'
    ],
    faq: [
      {
        q: 'Why does my JSON fail to parse?',
        a: 'The usual culprits are trailing commas, single quotes instead of double quotes, unquoted keys and comments — none of which JSON allows. The error message shows the exact line and column so the fix is fast.'
      },
      {
        q: 'Does formatting change my data?',
        a: 'No. Formatting and minifying only add or remove whitespace. Key order is preserved exactly unless you explicitly enable key sorting, which never changes values — only the order keys are written in.'
      },
      {
        q: 'Is there a size limit?',
        a: 'Only your browser’s memory. Multi-megabyte JSON files format fine on modern devices. Because everything runs locally, even confidential payloads are safe to paste.'
      },
      {
        q: 'Can it fix my JSON automatically?',
        a: 'It validates and pinpoints errors rather than silently guessing — silent fixes corrupt data. If your input is “JSON-ish” config (comments, trailing commas), strip those first; the error location guides you line by line.'
      }
    ]
  };

  const js = frame(`  function sortKeysDeep(value) {
    if (Array.isArray(value)) return value.map(sortKeysDeep);
    if (value && typeof value === 'object') {
      var out = {};
      Object.keys(value).sort().forEach(function (k) { out[k] = sortKeysDeep(value[k]); });
      return out;
    }
    return value;
  }

  function lineCol(text, index) {
    var before = text.slice(0, index);
    var line = before.split('\\n').length;
    var col = index - before.lastIndexOf('\\n');
    return ' (line ' + line + ', column ' + col + ')';
  }

  function explainError(text, err) {
    var msg = err && err.message ? err.message : 'Invalid JSON';
    var m = msg.match(/position\\s+(\\d+)/i);
    if (m) {
      var idx = parseInt(m[1], 10);
      if (isFinite(idx) && idx <= text.length) msg += lineCol(text, idx);
    }
    return msg;
  }

  function parseInput() {
    var text = control('input').value;
    return JSON.parse(text);
  }

  function byteLength(s) {
    return new TextEncoder().encode(s).length;
  }

  function run(mode) {
    var text = control('input').value;
    if (!text.trim()) {
      status('Paste some JSON first.', '');
      return;
    }
    try {
      var data = parseInput();
      if (control('sort-keys').checked) data = sortKeysDeep(data);
      if (mode === 'validate') {
        var kind = Array.isArray(data) ? 'array' : typeof data;
        status('✓ Valid JSON — top-level ' + kind + ', ' + byteLength(text).toLocaleString('en-US') + ' bytes.', 'ok');
        return;
      }
      if (mode === 'minify') {
        var min = JSON.stringify(data);
        setOutput('output', min);
        var saved = byteLength(text) - byteLength(min);
        status('Minified — saved ' + saved.toLocaleString('en-US') + ' bytes (' + byteLength(min).toLocaleString('en-US') + ' bytes total).', 'ok');
        return;
      }
      var ind = control('indent').value;
      var indent = ind === 'tab' ? '\\t' : parseInt(ind, 10);
      setOutput('output', JSON.stringify(data, null, indent));
      status('✓ Valid JSON, formatted.', 'ok');
    } catch (err) {
      status('✗ ' + explainError(text, err), 'error');
    }
  }

  onAction('format', function () { run('format'); });
  onAction('minify', function () { run('minify'); });
  onAction('validate', function () { run('validate'); });
  onAction('download', function () {
    var content = outputEl('output').value || control('input').value;
    if (!content.trim()) { status('Nothing to download yet.', ''); return; }
    try {
      if (outputEl('output').value) JSON.parse(outputEl('output').value);
    } catch (err) {
      status('Format the JSON first — the output is not valid yet.', 'error');
      return;
    }
    var blob = new Blob([content], { type: 'application/json' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'formatted.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
    status('Downloaded formatted.json.', 'ok');
  });`);

  return { entry, js };
}
