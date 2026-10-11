import { frame } from '../../../lib/factories/helpers.mjs';

function calcGST(amount, rate, inclusive) {
  var a = parseFloat(amount);
  var r = parseFloat(rate);
  if (isNaN(a) || isNaN(r) || a < 0 || r < 0) return null;
  var net, tax, gross;
  if (inclusive) {
    gross = a;
    net = a / (1 + r / 100);
    tax = gross - net;
  } else {
    net = a;
    tax = a * (r / 100);
    gross = net + tax;
  }
  return { net: net, tax: tax, gross: gross, rate: r, inclusive: inclusive };
}

export default function generate(catalogItem, ctx) {
  const entry = {
    id: 'gst-calculator',
    title: 'GST Calculator',
    h1: 'GST Calculator — add or remove tax instantly',
    seoTitle: 'GST Calculator — Free Inclusive & Exclusive Tax | ToolNova',
    description: 'Add or remove GST from any amount at any rate. Shows net price, tax amount and gross total. Free, private, runs in your browser.',
    intro: 'Choose whether the amount includes GST or not, enter the rate, and see the exact net, tax and gross figures. Useful for invoices, receipts and pricing.',
    category: 'Finance',
    keywords: ['gst calculator', 'gst inclusive', 'gst exclusive', 'tax calculator', 'vat calculator'],
    popularity: 80,
    ui: {
      controls: [
        { type: 'number', id: 'amount', label: 'Amount', value: 1000, min: 0, step: 'any' },
        { type: 'number', id: 'rate', label: 'GST rate %', value: 18, min: 0, step: 'any' },
        { type: 'select', id: 'mode', label: 'Amount is', value: 'exclusive', options: [{ value: 'exclusive', label: 'Exclusive (add GST)' }, { value: 'inclusive', label: 'Inclusive (remove GST)' }] }
      ],
      actions: [{ id: 'calc', label: 'Calculate', primary: true }],
      outputs: [{ type: 'stats', id: 'summary', label: 'Result' }]
    },
    howItWorks: [
      'Enter the amount and the GST rate.',
      'Select whether the amount already includes GST or not.',
      'Press Calculate to see net price, tax component and gross total.'
    ],
    examples: [
      '1000 exclusive at 18% becomes 1180 gross (tax 180).',
      '1180 inclusive at 18% has net 1000 and tax 180.',
      '500 exclusive at 5% becomes 525.'
    ],
    faq: [
      { q: 'What is the difference between inclusive and exclusive?', a: 'Exclusive means GST is added on top of the amount. Inclusive means the amount already contains the GST and the tool extracts the net and tax portions.' },
      { q: 'Is my data private?', a: 'Yes. The calculation happens entirely in your browser. Nothing is uploaded.' },
      { q: 'Can I use it for other taxes?', a: 'Yes. Any percentage tax works the same way; just enter the rate.' }
    ]
  };

  const js = frame(`  var calcGST = ${calcGST.toString()};

  onAction('calc', function () {
    var inclusive = control('mode').value === 'inclusive';
    var r = calcGST(control('amount').value, control('rate').value, inclusive);
    if (!r) { status('Enter a valid non-negative amount and rate.'); return; }
    setStats('summary', [
      { label: 'Net', value: r.net.toFixed(2) },
      { label: 'Tax', value: r.tax.toFixed(2) },
      { label: 'Gross', value: r.gross.toFixed(2) }
    ]);
    status('Calculated.');
  });
`);

  return { entry, js };
}

export function selfTest() {
  const r = calcGST(1000, 18, false);
  if (!r || Math.abs(r.gross - 1180) > 0.01) throw new Error('gst math failed');
}
