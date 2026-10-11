import { frame } from '../../../lib/factories/helpers.mjs';

function calcDiscount(price, disc1, disc2) {
  var p = parseFloat(price);
  var d1 = parseFloat(disc1) || 0;
  var d2 = parseFloat(disc2) || 0;
  if (isNaN(p) || p < 0 || d1 < 0 || d1 > 100 || d2 < 0 || d2 > 100) return null;
  var after1 = p * (1 - d1 / 100);
  var final = after1 * (1 - d2 / 100);
  var savings = p - final;
  return { original: p, afterFirst: after1, final: final, savings: savings, disc1: d1, disc2: d2 };
}

export default function generate(catalogItem, ctx) {
  const entry = {
    id: 'discount-calculator',
    title: 'Discount Calculator',
    h1: 'Discount Calculator — stacked sale price & savings',
    seoTitle: 'Discount Calculator — Free Sale Price & Savings | ToolNova',
    description: 'Calculate final sale price after one or two stacked discounts. See exact savings, intermediate prices and formulas. Free, private, browser-based.',
    intro: 'Enter the original price and up to two discount percentages. Instantly see the price after the first discount, the final price, and total savings. All math stays in your browser.',
    category: 'Calculators',
    keywords: ['discount calculator', 'sale price', 'percent off', 'stacked discount', 'savings calculator'],
    popularity: 82,
    ui: {
      controls: [
        { type: 'number', id: 'price', label: 'Original price', value: 100, min: 0, step: 'any' },
        { type: 'number', id: 'disc1', label: 'First discount %', value: 20, min: 0, max: 100, step: 'any' },
        { type: 'number', id: 'disc2', label: 'Second discount % (optional)', value: 10, min: 0, max: 100, step: 'any' }
      ],
      actions: [{ id: 'calc', label: 'Calculate', primary: true }],
      outputs: [
        { type: 'stats', id: 'summary', label: 'Breakdown' },
        { type: 'textarea', id: 'details', label: 'Details' }
      ]
    },
    howItWorks: [
      'Enter the original price and the first discount percentage.',
      'Optionally add a second discount that applies to the already-discounted price.',
      'Press Calculate to see the intermediate price, final price and total savings.'
    ],
    examples: [
      'A $100 item with 20% then 10% off becomes $72, saving $28.',
      'A 50% discount on $80 leaves $40.',
      'Two 25% discounts on $200 leave $112.50.'
    ],
    faq: [
      { q: 'How do stacked discounts work?', a: 'The second discount is applied to the price after the first discount, not to the original price. This is the standard retail method.' },
      { q: 'Is the calculation private?', a: 'Yes. All math runs entirely in your browser. No data is sent to any server.' },
      { q: 'Can I use more than two discounts?', a: 'The tool supports two. For more, run the result through again as the new original price.' }
    ]
  };

  const js = frame(`  var calcDiscount = ${calcDiscount.toString()};

  onAction('calc', function () {
    var r = calcDiscount(control('price').value, control('disc1').value, control('disc2').value);
    if (!r) { status('Enter a valid price and discount percentages between 0 and 100.'); return; }
    setStats('summary', [
      { label: 'Original', value: r.original.toFixed(2) },
      { label: 'After first', value: r.afterFirst.toFixed(2) },
      { label: 'Final price', value: r.final.toFixed(2) },
      { label: 'You save', value: r.savings.toFixed(2) }
    ]);
    setOutput('details', 'Original: ' + r.original.toFixed(2) + '\nAfter ' + r.disc1 + '%: ' + r.afterFirst.toFixed(2) + '\nAfter additional ' + r.disc2 + '%: ' + r.final.toFixed(2) + '\nTotal savings: ' + r.savings.toFixed(2));
    status('Calculated.');
  });
`);

  return { entry, js };
}

export function selfTest() {
  const r = calcDiscount(100, 20, 10);
  if (!r || Math.abs(r.final - 72) > 0.01) throw new Error('discount math failed');
}
