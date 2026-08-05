import { frame } from '../../../lib/factories/helpers.mjs';

function calcPercentageOf(pct, val) {
  var p = parseFloat(pct);
  var v = parseFloat(val);
  if (isNaN(p) || isNaN(v)) return null;
  return (p / 100) * v;
}

function calcPercentageRatio(val1, val2) {
  var v1 = parseFloat(val1);
  var v2 = parseFloat(val2);
  if (isNaN(v1) || isNaN(v2) || v2 === 0) return null;
  return (v1 / v2) * 100;
}

function calcPercentageChange(val1, val2) {
  var v1 = parseFloat(val1);
  var v2 = parseFloat(val2);
  if (isNaN(v1) || isNaN(v2) || v1 === 0) return null;
  return ((v2 - v1) / v1) * 100;
}

function calcPercentageReverse(val, pct) {
  var v = parseFloat(val);
  var p = parseFloat(pct);
  if (isNaN(v) || isNaN(p) || p === 0) return null;
  return v / (p / 100);
}

export default function generate(catalogItem, ctx) {
  const entry = {
    id: 'percentage-calculator',
    title: 'Percentage Calculator',
    h1: 'Percentage Calculator — multi-purpose percentage tools',
    seoTitle: 'Percentage Calculator — Free Online Percent Finder | ToolNova',
    description: 'Solve any percentage problem: calculate percentage of a value, percentage ratio of two values, percentage increase or decrease, and reverse percentages.',
    intro: 'An all-in-one percentage calculator. Instantly find X% of Y, calculate what percentage one number is of another, determine percentage change from one value to another, or solve reverse percentages.',
    category: 'Math',
    keywords: ['percentage calculator', 'percent of', 'percentage increase', 'percentage change', 'reverse percentage', 'percentage difference'],
    popularity: 85,
    ui: {
      layout: 'single',
      controls: [
        { type: 'number', id: 'p1-pct', label: '1. What is X% of Y? (Percentage %)', value: 15, step: 'any' },
        { type: 'number', id: 'p1-val', label: 'Of value (Y)', value: 200, step: 'any' },
        { type: 'number', id: 'p2-val1', label: '2. X is what % of Y? (Value X)', value: 50, step: 'any' },
        { type: 'number', id: 'p2-val2', label: 'Of value (Y)', value: 200, step: 'any' },
        { type: 'number', id: 'p3-val1', label: '3. Percentage change: From value (X)', value: 100, step: 'any' },
        { type: 'number', id: 'p3-val2', label: 'To value (Y)', value: 150, step: 'any' },
        { type: 'number', id: 'p4-val', label: '4. X is Y% of what? (Value X)', value: 40, step: 'any' },
        { type: 'number', id: 'p4-pct', label: 'Is percent (Y%)', value: 20, step: 'any' }
      ],
      actions: [],
      outputs: [
        { type: 'text', id: 'result-1', label: 'Result 1: X% of Y' },
        { type: 'text', id: 'result-2', label: 'Result 2: X is what % of Y' },
        { type: 'text', id: 'result-3', label: 'Result 3: Percentage change' },
        { type: 'text', id: 'result-4', label: 'Result 4: X is Y% of what' }
      ]
    },
    howItWorks: [
      'Enter values in any of the four sections — each calculator works independently and updates instantly.',
      'Section 1 calculates the final value when a percentage is applied to a base number.',
      'Section 2 calculates the ratio between two numbers and displays it as a percentage.',
      'Section 3 determines the relative difference between a starting value and an ending value, showing the percent increase or decrease.',
      'Section 4 performs a reverse percentage calculation to find the original base amount.'
    ],
    examples: [
      '15% of 200 is 30.',
      '50 is 25% of 200.',
      'The percentage change from 100 to 150 is a 50% increase.',
      'If 40 is 20% of a number, the original number is 200.'
    ],
    faq: [
      {
        q: 'How is a percentage calculated?',
        a: 'A percentage is a fraction of 100. To find the percentage of a number, divide the percentage by 100 and multiply by the number: (percentage / 100) * value.'
      },
      {
        q: 'How do you calculate percentage increase or decrease?',
        a: 'Find the difference between the new value and the old value, divide that difference by the old value, and multiply by 100: ((new - old) / old) * 100. A positive result is an increase, and a negative result is a decrease.'
      },
      {
        q: 'What is a reverse percentage?',
        a: 'A reverse percentage finds the original number when only a portion (the percentage amount) is known. It is calculated by dividing the value by the decimal percentage: value / (percentage / 100).'
      }
    ]
  };

  const js = frame(`  var calcPercentageOf = ${calcPercentageOf.toString()};
  var calcPercentageRatio = ${calcPercentageRatio.toString()};
  var calcPercentageChange = ${calcPercentageChange.toString()};
  var calcPercentageReverse = ${calcPercentageReverse.toString()};

  function formatNumber(num) {
    if (num === null || isNaN(num)) return '';
    if (num % 1 === 0) return num.toString();
    var str = num.toFixed(4);
    return parseFloat(str).toString();
  }

  function render() {
    var p1Pct = parseFloat(control('p1-pct').value);
    var p1Val = parseFloat(control('p1-val').value);
    var r1 = calcPercentageOf(p1Pct, p1Val);
    setOutput('result-1', r1 !== null ? formatNumber(r1) : '');

    var p2Val1 = parseFloat(control('p2-val1').value);
    var p2Val2 = parseFloat(control('p2-val2').value);
    var r2 = calcPercentageRatio(p2Val1, p2Val2);
    setOutput('result-2', r2 !== null ? formatNumber(r2) + '%' : '');

    var p3Val1 = parseFloat(control('p3-val1').value);
    var p3Val2 = parseFloat(control('p3-val2').value);
    var r3 = calcPercentageChange(p3Val1, p3Val2);
    if (r3 !== null) {
      var prefix = r3 > 0 ? '+' : '';
      setOutput('result-3', prefix + formatNumber(r3) + '%');
    } else {
      setOutput('result-3', '');
    }

    var p4Val = parseFloat(control('p4-val').value);
    var p4Pct = parseFloat(control('p4-pct').value);
    var r4 = calcPercentageReverse(p4Val, p4Pct);
    setOutput('result-4', r4 !== null ? formatNumber(r4) : '');

    status('Percentage calculations updated live.', 'ok');
  }

  [
    'p1-pct', 'p1-val',
    'p2-val1', 'p2-val2',
    'p3-val1', 'p3-val2',
    'p4-val', 'p4-pct'
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
  if (calcPercentageOf(15, 200) !== 30) throw new Error('calcPercentageOf failed');
  if (calcPercentageRatio(50, 200) !== 25) throw new Error('calcPercentageRatio failed');
  if (calcPercentageChange(100, 150) !== 50) throw new Error('calcPercentageChange failed');
  if (calcPercentageReverse(40, 20) !== 200) throw new Error('calcPercentageReverse failed');
}
