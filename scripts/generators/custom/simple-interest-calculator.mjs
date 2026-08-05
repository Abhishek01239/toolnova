import { frame } from '../../../lib/factories/helpers.mjs';

function calculateSimpleInterest(principal, rate, time, timeUnit) {
  var p = parseFloat(principal);
  var r = parseFloat(rate);
  var tVal = parseFloat(time);

  if (isNaN(p) || isNaN(r) || isNaN(tVal) || p < 0 || r < 0 || tVal < 0) return null;

  var tYears = tVal;
  if (timeUnit === 'months') {
    tYears = tVal / 12;
  } else if (timeUnit === 'days') {
    tYears = tVal / 365;
  }

  var interest = (p * r * tYears) / 100;
  var total = p + interest;

  return {
    interest: interest,
    total: total,
    tYears: tYears
  };
}

export default function generate(catalogItem, ctx) {
  const entry = {
    id: 'simple-interest-calculator',
    title: 'Simple Interest Calculator',
    h1: 'Simple Interest Calculator — compute interest step by step',
    seoTitle: 'Simple Interest Calculator — Free Online Interest Finder | ToolNova',
    description: 'Calculate simple interest on any principal over days, months, or years. See the exact math and formula applied step by step.',
    intro: 'Determine simple interest easily. Input your principal amount, interest rate, and time period in years, months, or days, and see a step-by-step breakdown of how the interest is calculated.',
    category: 'Finance',
    keywords: ['simple interest', 'interest calculator', 'si formula', 'simple interest formula', 'calculate interest', 'investment calculator'],
    popularity: 80,
    ui: {
      layout: 'single',
      controls: [
        { type: 'number', id: 'principal-amount', label: 'Principal Amount ($)', value: 10000, min: 0.01, max: 100000000, step: 0.01 },
        { type: 'number', id: 'rate-of-interest', label: 'Annual Interest Rate (%)', value: 5, min: 0, max: 100, step: 0.05 },
        { type: 'number', id: 'time-period', label: 'Time Period', value: 3, min: 1, max: 36500, step: 1 },
        { type: 'select', id: 'time-unit', label: 'Time Unit', options: [
          { value: 'years', label: 'Years' },
          { value: 'months', label: 'Months' },
          { value: 'days', label: 'Days' }
        ], value: 'years' }
      ],
      actions: [],
      outputs: [
        { type: 'text', id: 'interest-amount', label: 'Interest Amount' },
        { type: 'text', id: 'total-amount', label: 'Total Amount (Principal + Interest)' },
        { type: 'pre', id: 'formula-step', label: 'Step-by-Step Calculation' }
      ]
    },
    howItWorks: [
      'Enter the starting principal amount (the money invested or borrowed).',
      'Enter the annual interest rate as a percentage.',
      'Enter the time period and choose the unit: Years, Months, or Days.',
      'The calculator converts the time period to years and applies the formula: Interest = (Principal * Rate * Time) / 100.',
      'The step-by-step math, final interest amount, and total accumulated amount are displayed instantly.'
    ],
    examples: [
      'Investing $10,000 at a 5% annual interest rate for 3 years yields exactly $1,500 in simple interest.',
      'Borrowing $5,000 at a 12% annual interest rate for 6 months yields exactly $300 in simple interest.'
    ],
    faq: [
      {
        q: 'What is simple interest?',
        a: 'Simple interest is a quick and easy method of calculating interest charge on a loan or investment. It is determined by multiplying the daily or annual interest rate by the principal amount and by the number of periods that elapse.'
      },
      {
        q: 'What is the formula for simple interest?',
        a: 'The formula is: I = P * R * T, where I is Interest, P is Principal, R is Rate (as a percentage), and T is Time (expressed in years).'
      },
      {
        q: 'How does simple interest differ from compound interest?',
        a: 'Simple interest is calculated only on the initial principal amount. Compound interest is calculated on the principal plus any accumulated interest from previous periods (interest on interest), causing money to grow at a faster rate over time.'
      }
    ]
  };

  const js = frame(`  var calculateSimpleInterest = ${calculateSimpleInterest.toString()};

  function formatCurrency(val) {
    if (val === null || isNaN(val)) return '';
    return '$' + val.toFixed(2);
  }

  function render() {
    var principal = parseFloat(control('principal-amount').value);
    var rate = parseFloat(control('rate-of-interest').value);
    var time = parseFloat(control('time-period').value);
    var timeUnit = control('time-unit').value;

    if (isNaN(principal) || principal < 0 || isNaN(rate) || rate < 0 || isNaN(time) || time < 0) {
      setOutput('interest-amount', '');
      setOutput('total-amount', '');
      setOutput('formula-step', '');
      status('Please enter valid positive values.', 'error');
      return;
    }

    var res = calculateSimpleInterest(principal, rate, time, timeUnit);
    if (!res) {
      setOutput('interest-amount', '');
      setOutput('total-amount', '');
      setOutput('formula-step', '');
      status('Invalid calculation parameters.', 'error');
      return;
    }

    setOutput('interest-amount', formatCurrency(res.interest));
    setOutput('total-amount', formatCurrency(res.total));

    var timeWalkthrough = time.toString() + ' ' + timeUnit;
    if (timeUnit !== 'years') {
      timeWalkthrough += ' (= ' + res.tYears.toFixed(4) + ' years)';
    }

    var stepText = 'Formula: Interest = (Principal * Rate * Time) / 100\\n\\n' +
      '1. Identify inputs:\\n' +
      '   - Principal (P) = ' + formatCurrency(principal) + '\\n' +
      '   - Rate (R)      = ' + rate + '% per year\\n' +
      '   - Time (T)      = ' + timeWalkthrough + '\\n\\n' +
      '2. Calculate Interest:\\n' +
      '   Interest = (' + principal + ' * ' + rate + ' * ' + res.tYears.toFixed(4) + ') / 100\\n' +
      '   Interest = ' + formatCurrency(res.interest) + '\\n\\n' +
      '3. Calculate Total Amount (Principal + Interest):\\n' +
      '   Total = ' + formatCurrency(principal) + ' + ' + formatCurrency(res.interest) + '\\n' +
      '   Total = ' + formatCurrency(res.total);

    setOutput('formula-step', stepText);
    status('Simple interest calculated successfully.', 'ok');
  }

  [
    'principal-amount', 'rate-of-interest', 'time-period', 'time-unit'
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
  var res1 = calculateSimpleInterest(10000, 5, 3, 'years');
  if (!res1 || Math.abs(res1.interest - 1500) > 0.001) {
    throw new Error('calculateSimpleInterest base test failed');
  }

  var res2 = calculateSimpleInterest(5000, 12, 6, 'months');
  if (!res2 || Math.abs(res2.interest - 300) > 0.001) {
    throw new Error('calculateSimpleInterest months test failed');
  }
}
