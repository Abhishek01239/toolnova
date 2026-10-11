import { frame } from '../../../lib/factories/helpers.mjs';

function calcMargin(cost, price, mode) {
  var c = parseFloat(cost);
  var p = parseFloat(price);
  if (isNaN(c) || isNaN(p) || c < 0 || p < 0) return null;
  if (mode === 'from-cost-price') {
    if (p === 0) return null;
    var margin = ((p - c) / p) * 100;
    var markup = c === 0 ? null : ((p - c) / c) * 100;
    return { cost: c, price: p, margin: margin, markup: markup };
  }
  return null;
}

export default function generate(catalogItem, ctx) {
  const entry = {
    id: 'margin-calculator',
    title: 'Margin Calculator',
    h1: 'Margin & Markup Calculator — profit from cost & price',
    seoTitle: 'Margin Calculator — Free Profit Margin & Markup | ToolNova',
    description: 'Convert between cost, selling price, margin and markup. See formulas and exact figures. Free, private, browser-based calculator.',
    intro: 'Enter cost and selling price to instantly see profit margin and markup percentages, or use the other modes. All calculations stay local.',
    category: 'Finance',
    keywords: ['margin calculator', 'markup calculator', 'profit margin', 'gross margin'],
    popularity: 75,
    ui: {
      controls: [
        { type: 'number', id: 'cost', label: 'Cost price', value: 80, min: 0, step: 'any' },
        { type: 'number', id: 'price', label: 'Selling price', value: 100, min: 0, step: 'any' }
      ],
      actions: [{ id: 'calc', label: 'Calculate', primary: true }],
      outputs: [{ type: 'stats', id: 'summary', label: 'Result' }]
    },
    howItWorks: [
      'Enter the cost price and the selling price.',
      'Press Calculate to see the profit margin (on selling price) and markup (on cost).',
      'Read the exact percentages and the profit amount.'
    ],
    examples: [
      'Cost 80, price 100 → margin 20%, markup 25%.',
      'Cost 50, price 75 → margin 33.33%, markup 50%.',
      'Cost 200, price 200 → margin 0%.'
    ],
    faq: [
      { q: 'What is the difference between margin and markup?', a: 'Margin is profit as a percentage of the selling price. Markup is profit as a percentage of the cost price. They are related but not the same number.' },
      { q: 'Is the tool private?', a: 'Yes. Everything runs in your browser. No data leaves your device.' },
      { q: 'How is margin calculated?', a: 'Margin = ((selling price − cost) / selling price) × 100. Markup = ((selling price − cost) / cost) × 100.' }
    ]
  };

  const js = frame(`  var calcMargin = ${calcMargin.toString()};

  onAction('calc', function () {
    var r = calcMargin(control('cost').value, control('price').value, 'from-cost-price');
    if (!r) { status('Enter valid non-negative cost and price.'); return; }
    setStats('summary', [
      { label: 'Cost', value: r.cost.toFixed(2) },
      { label: 'Price', value: r.price.toFixed(2) },
      { label: 'Margin %', value: r.margin.toFixed(2) + '%' },
      { label: 'Markup %', value: (r.markup === null ? 'N/A' : r.markup.toFixed(2) + '%') }
    ]);
    status('Calculated.');
  });
`);

  return { entry, js };
}

export function selfTest() {
  const r = calcMargin(80, 100, 'from-cost-price');
  if (!r || Math.abs(r.margin - 20) > 0.01) throw new Error('margin math failed');
}
