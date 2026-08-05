import { frame } from '../../../lib/factories/helpers.mjs';

function calculateTipDetails(bill, tipPct, people, roundType) {
  var b = parseFloat(bill);
  var t = parseFloat(tipPct);
  var p = parseInt(people, 10);
  if (isNaN(b) || isNaN(t) || isNaN(p) || b < 0 || t < 0 || p < 1) return null;

  var rawTip = b * (t / 100);
  var rawTotal = b + rawTip;
  var rawShare = rawTotal / p;

  var tip = rawTip;
  var total = rawTotal;
  var share = rawShare;

  if (roundType === 'tip') {
    tip = Math.round(rawTip);
    total = b + tip;
    share = total / p;
  } else if (roundType === 'total') {
    total = Math.round(rawTotal);
    tip = total - b;
    share = total / p;
  } else if (roundType === 'person') {
    share = Math.round(rawShare);
    total = share * p;
    tip = total - b;
  }

  return {
    bill: b,
    tipPct: t,
    people: p,
    tip: tip,
    total: total,
    share: share,
    tipPerPerson: tip / p,
    billPerPerson: b / p
  };
}

export default function generate(catalogItem, ctx) {
  const entry = {
    id: 'tip-calculator',
    title: 'Tip Calculator',
    h1: 'Tip Calculator — split bill & calculate tip instantly',
    seoTitle: 'Tip Calculator — Free Online Bill Splitter | ToolNova',
    description: 'Calculate tips easily and split the bill with friends. Features custom tip percentages, split count, and smart rounding options. Free and private.',
    intro: 'A premium tip calculator and bill splitter. Easily determine the exact tip amount, split the total bill among any number of people, and apply smart rounding options for simple payments.',
    category: 'Calculators',
    keywords: ['tip calculator', 'gratuity calculator', 'split bill', 'bill splitter', 'calculate tip', 'restaurant tip'],
    popularity: 80,
    ui: {
      layout: 'single',
      controls: [
        { type: 'number', id: 'bill-amount', label: 'Bill amount ($)', value: 100, min: 0.01, max: 1000000, step: 0.01 },
        { type: 'number', id: 'tip-percentage', label: 'Tip percentage (%)', value: 15, min: 0, max: 100, step: 0.5 },
        { type: 'number', id: 'people-count', label: 'Number of people', value: 2, min: 1, max: 1000, step: 1 },
        { type: 'select', id: 'round-direction', label: 'Rounding options', options: [
          { value: 'none', label: 'Do not round' },
          { value: 'tip', label: 'Round tip amount' },
          { value: 'total', label: 'Round total bill' },
          { value: 'person', label: 'Round share per person' }
        ], value: 'none' }
      ],
      actions: [],
      outputs: [
        { type: 'text', id: 'tip-amount', label: 'Total tip' },
        { type: 'text', id: 'total-amount', label: 'Total bill (with tip)' },
        { type: 'text', id: 'share-amount', label: 'Each person pays' },
        { type: 'stats', id: 'breakdown', label: 'Details per person' }
      ]
    },
    howItWorks: [
      'Enter the total bill amount before tip.',
      'Enter your preferred tip percentage (presets like 15% or 20% are common, or choose your own).',
      'Specify the number of people sharing the bill (defaults to 2).',
      'Select a rounding option to round the tip, total bill, or individual share to the nearest dollar.',
      'The split details update live, showing the total tip, overall total, and individual shares.'
    ],
    examples: [
      'A $100 bill with a 15% tip split between 2 people results in a $15 total tip and $57.50 per person.',
      'A $85.50 bill with an 18% tip split among 3 people rounded to the nearest dollar per person results in each paying exactly $34.00.'
    ],
    faq: [
      {
        q: 'What is the standard tip percentage?',
        a: 'In many countries, particularly the United States, standard tips range from 15% to 20% of the pre-tax bill. For exceptional service, 22% or more is common, while 10% is typical for basic service.'
      },
      {
        q: 'How does the rounding feature work?',
        a: 'Rounding makes paying cash or splitting card payments easier. You can round the total tip, the total bill, or each person’s individual share. The calculator automatically adjusts the other figures to ensure the math remains perfectly balanced.'
      },
      {
        q: 'Is my financial data secure?',
        a: 'Yes, completely. The tip calculator runs entirely in your local browser using client-side JavaScript. None of your inputs, bill amounts, or calculations are sent to a server.'
      }
    ]
  };

  const js = frame(`  var calculateTipDetails = ${calculateTipDetails.toString()};

  function formatCurrency(val) {
    if (val === null || isNaN(val)) return '';
    return '$' + val.toFixed(2);
  }

  function render() {
    var bill = parseFloat(control('bill-amount').value);
    var tipPct = parseFloat(control('tip-percentage').value);
    var people = parseInt(control('people-count').value, 10);
    var roundType = control('round-direction').value;

    if (isNaN(bill) || bill < 0 || isNaN(tipPct) || tipPct < 0 || isNaN(people) || people < 1) {
      setOutput('tip-amount', '');
      setOutput('total-amount', '');
      setOutput('share-amount', '');
      setStats('breakdown', []);
      status('Please enter valid input values.', 'error');
      return;
    }

    var res = calculateTipDetails(bill, tipPct, people, roundType);
    if (!res) {
      setOutput('tip-amount', '');
      setOutput('total-amount', '');
      setOutput('share-amount', '');
      setStats('breakdown', []);
      status('Invalid calculations.', 'error');
      return;
    }

    setOutput('tip-amount', formatCurrency(res.tip));
    setOutput('total-amount', formatCurrency(res.total));
    setOutput('share-amount', formatCurrency(res.share));

    setStats('breakdown', [
      ['Bill per person', formatCurrency(res.billPerPerson)],
      ['Tip per person', formatCurrency(res.tipPerPerson)],
      ['Total per person', formatCurrency(res.share)]
    ]);

    status('Tip and split calculated successfully.', 'ok');
  }

  [
    'bill-amount', 'tip-percentage', 'people-count', 'round-direction'
  ].forEach(function (id) {
    var el = control(id);
    if (el) {
      el.addEventListener('input', render);
      el.addEventListener('change', render);
    }
  });

  render();`);

  return { entry, js };
}

export async function selfTest() {
  var res1 = calculateTipDetails(100, 15, 2, 'none');
  if (!res1 || Math.abs(res1.tip - 15) > 0.001 || Math.abs(res1.share - 57.5) > 0.001) {
    throw new Error('calculateTipDetails base test failed');
  }

  var resRound = calculateTipDetails(85.50, 18, 3, 'person');
  if (!resRound || Math.abs(resRound.share - 34.00) > 0.001) {
    throw new Error('calculateTipDetails rounding test failed');
  }
}
