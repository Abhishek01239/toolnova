import { frame } from '../../../lib/factories/helpers.mjs';

function calculateEMI(loanAmount, interestRate, tenure, tenureType) {
  var p = parseFloat(loanAmount);
  var rYear = parseFloat(interestRate);
  var nVal = parseFloat(tenure);

  if (isNaN(p) || isNaN(rYear) || isNaN(nVal) || p <= 0 || rYear < 0 || nVal <= 0) return null;

  var n = tenureType === 'years' ? nVal * 12 : nVal;
  if (n <= 0) return null;

  // Monthly interest rate
  var r = (rYear / 12) / 100;

  var emi = 0;
  if (r === 0) {
    emi = p / n;
  } else {
    emi = p * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1);
  }

  var totalPayment = emi * n;
  var totalInterest = totalPayment - p;

  return {
    emi: emi,
    totalPayment: totalPayment,
    totalInterest: totalInterest,
    principalPercent: (p / totalPayment) * 100,
    interestPercent: (totalInterest / totalPayment) * 100
  };
}

export default function generate(catalogItem, ctx) {
  const entry = {
    id: 'emi-calculator',
    title: 'EMI Calculator',
    h1: 'EMI Calculator — loan Equated Monthly Installment planner',
    seoTitle: 'EMI Calculator — Free Online Loan Payment Calculator | ToolNova',
    description: 'Calculate Equated Monthly Installments (EMI) for home, car, or personal loans. View monthly payment, total interest payable, and payment breakdown.',
    intro: 'Plan your loans with ease. Calculate your equated monthly installments (EMI) by entering the loan amount, interest rate, and tenure, and see the interest vs. principal split instantly.',
    category: 'Finance',
    keywords: ['emi calculator', 'loan emi', 'home loan emi', 'loan payment calculator', 'mortgage calculator', 'monthly installment'],
    popularity: 80,
    ui: {
      layout: 'single',
      controls: [
        { type: 'number', id: 'loan-amount', label: 'Loan Amount ($)', value: 100000, min: 100, max: 100000000, step: 100 },
        { type: 'number', id: 'interest-rate', label: 'Interest Rate (Annual %)', value: 8.5, min: 0.1, max: 50, step: 0.05 },
        { type: 'number', id: 'loan-tenure', label: 'Tenure', value: 5, min: 1, max: 600, step: 1 },
        { type: 'select', id: 'tenure-type', label: 'Tenure Unit', options: [
          { value: 'years', label: 'Years' },
          { value: 'months', label: 'Months' }
        ], value: 'years' }
      ],
      actions: [],
      outputs: [
        { type: 'text', id: 'monthly-emi', label: 'Monthly Payment (EMI)' },
        { type: 'text', id: 'total-interest', label: 'Total Interest Payable' },
        { type: 'text', id: 'total-payment', label: 'Total Payment (Principal + Interest)' },
        { type: 'stats', id: 'ratio-breakdown', label: 'Payment Ratio Breakdown' }
      ]
    },
    howItWorks: [
      'Enter the total principal amount of the loan you want to borrow.',
      'Enter the annual interest rate offered by the lender.',
      'Choose the loan term duration and select whether it is in Years or Months.',
      'The tool calculates your Equated Monthly Installment (EMI) using the standard compounding formula.',
      'It displays the monthly payment, total interest accrued over the tenure, and the breakdown of principal vs. interest.'
    ],
    examples: [
      'A loan of $100,000 at 8.5% interest for 5 years results in a monthly EMI of $2,051.65, with $23,099.18 in total interest.',
      'A personal loan of $10,000 at 12% interest for 24 months results in an EMI of $470.73 per month.'
    ],
    faq: [
      {
        q: 'What is an EMI?',
        a: 'EMI stands for Equated Monthly Installment. It is a fixed payment amount made by a borrower to a lender at a specified date each calendar month. EMIs are applied to both interest and principal each month, so that over a specified number of years, the loan is fully paid off.'
      },
      {
        q: 'How does interest rate affect EMI?',
        a: 'A higher interest rate increases your monthly EMI and greatly increases the total amount of interest paid over the life of the loan. Even a small increase in the rate can add thousands of dollars to your total cost for long-term loans like mortgages.'
      },
      {
        q: 'Can I pay off my loan early?',
        a: 'Most banks and financial institutions allow early payoff or extra monthly payments, which reduces the total interest owed. This calculator assumes a standard amortization schedule without pre-payments.'
      }
    ]
  };

  const js = frame(`  var calculateEMI = ${calculateEMI.toString()};

  function formatCurrency(val) {
    if (val === null || isNaN(val)) return '';
    return '$' + val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function render() {
    var amount = parseFloat(control('loan-amount').value);
    var rate = parseFloat(control('interest-rate').value);
    var tenure = parseFloat(control('loan-tenure').value);
    var tenureType = control('tenure-type').value;

    if (isNaN(amount) || amount <= 0 || isNaN(rate) || rate < 0 || isNaN(tenure) || tenure <= 0) {
      setOutput('monthly-emi', '');
      setOutput('total-interest', '');
      setOutput('total-payment', '');
      setStats('ratio-breakdown', []);
      status('Please enter valid positive values.', 'error');
      return;
    }

    var res = calculateEMI(amount, rate, tenure, tenureType);
    if (!res) {
      setOutput('monthly-emi', '');
      setOutput('total-interest', '');
      setOutput('total-payment', '');
      setStats('ratio-breakdown', []);
      status('Invalid calculation parameters.', 'error');
      return;
    }

    setOutput('monthly-emi', formatCurrency(res.emi));
    setOutput('total-interest', formatCurrency(res.totalInterest));
    setOutput('total-payment', formatCurrency(res.totalPayment));

    setStats('ratio-breakdown', [
      ['Principal component', res.principalPercent.toFixed(1) + '%'],
      ['Interest component', res.interestPercent.toFixed(1) + '%'],
      ['Total payments', (tenureType === 'years' ? (tenure * 12) : tenure) + ' months']
    ]);

    status('Loan payment details calculated.', 'ok');
  }

  [
    'loan-amount', 'interest-rate', 'loan-tenure', 'tenure-type'
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
  var res = calculateEMI(100000, 8.5, 5, 'years');
  if (!res || Math.abs(res.emi - 2051.65) > 0.05) {
    throw new Error('calculateEMI self-test failed');
  }
}
