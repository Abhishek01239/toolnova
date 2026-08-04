import { frame } from '../../../lib/factories/helpers.mjs';

function calculateBMI(weight, weightUnit, height, heightUnit) {
  var w = parseFloat(weight);
  var h = parseFloat(height);
  if (!w || !h || w <= 0 || h <= 0) return null;

  var weightKg = weightUnit === 'lb' ? w * 0.45359237 : w;
  var heightM = heightUnit === 'in' ? h * 0.0254 : h / 100;

  var bmi = weightKg / (heightM * heightM);
  return bmi;
}

function getBMICategory(bmi) {
  if (bmi < 18.5) return 'Underweight';
  if (bmi < 25) return 'Normal weight';
  if (bmi < 30) return 'Overweight';
  return 'Obese';
}

export default function generate(catalogItem, ctx) {
  const entry = {
    id: 'bmi-calculator',
    title: 'BMI Calculator',
    h1: 'BMI Calculator — free & online Body Mass Index tracker',
    seoTitle: 'BMI Calculator — Free Online Body Mass Index Tracker | ToolNova',
    description: 'Calculate your Body Mass Index (BMI) instantly. Supports metric and imperial units, shows your weight category, and provides healthy weight guidance.',
    intro: 'Determine your Body Mass Index (BMI) using height and weight. Discover your BMI category (Underweight, Normal, Overweight, or Obese) and see your target healthy weight range instantly.',
    category: 'Calculators',
    keywords: ['bmi calculator', 'body mass index', 'bmi chart', 'calculate bmi', 'healthy weight range'],
    popularity: 80,
    ui: {
      layout: 'single',
      controls: [
        { type: 'number', id: 'weight', label: 'Weight', value: 70, min: 1, max: 500, step: 0.1 },
        { type: 'select', id: 'weight-unit', label: 'Weight unit', options: [{ value: 'kg', label: 'kg' }, { value: 'lb', label: 'lbs' }], value: 'kg' },
        { type: 'number', id: 'height', label: 'Height', value: 170, min: 1, max: 300, step: 0.1 },
        { type: 'select', id: 'height-unit', label: 'Height unit', options: [{ value: 'cm', label: 'cm' }, { value: 'in', label: 'inches' }], value: 'cm' }
      ],
      actions: [],
      outputs: [
        { type: 'text', id: 'bmi-val', label: 'Your BMI' },
        { type: 'text', id: 'bmi-cat', label: 'Weight Category' },
        { type: 'stats', id: 'guidance', label: 'Healthy Weight Guidance' }
      ]
    },
    howItWorks: [
      'Enter your current weight and select your preferred weight unit (kilograms or pounds).',
      'Enter your height and select your preferred height unit (centimeters or inches).',
      'The tool calculates your Body Mass Index (BMI) instantly using standard medical formulas.',
      'It displays your weight classification (Underweight, Normal, Overweight, or Obese) and calculates the ideal weight range for your height.'
    ],
    examples: [
      'A person weighing 70 kg at a height of 170 cm has a BMI of 24.22 (Normal weight).',
      'A person weighing 180 lbs at a height of 70 inches has a BMI of 25.82 (Overweight).'
    ],
    faq: [
      {
        q: 'What is Body Mass Index (BMI)?',
        a: 'BMI is a simple numerical calculation of body fat based on height and weight. It is widely used by healthcare providers as a quick method to identify if a person is underweight, normal weight, overweight, or obese.'
      },
      {
        q: 'How is BMI calculated?',
        a: 'For metric units, the formula is weight in kilograms divided by height in meters squared (kg/m²). For imperial units, the formula is weight in pounds multiplied by 703, divided by height in inches squared (lbs * 703 / in²).'
      },
      {
        q: 'Is BMI accurate for everyone?',
        a: 'BMI is a general screening tool and has limitations. It may not be accurate for athletes or bodybuilders (who have high muscle mass), pregnant women, or the elderly, as it does not distinguish between muscle mass and fat mass.'
      }
    ]
  };

  const js = frame(`  var calculateBMI = ${calculateBMI.toString()};
  var getBMICategory = ${getBMICategory.toString()};

  function render() {
    var weight = parseFloat(control('weight').value);
    var weightUnit = control('weight-unit').value;
    var height = parseFloat(control('height').value);
    var heightUnit = control('height-unit').value;

    if (!weight || !height || weight <= 0 || height <= 0) {
      setOutput('bmi-val', '');
      setOutput('bmi-cat', '');
      setStats('guidance', []);
      status('Please enter a valid height and weight.', '');
      return;
    }

    var bmi = calculateBMI(weight, weightUnit, height, heightUnit);
    if (!bmi) {
      setOutput('bmi-val', '');
      setOutput('bmi-cat', '');
      setStats('guidance', []);
      status('Invalid input values.', 'error');
      return;
    }

    setOutput('bmi-val', bmi.toFixed(2));
    var cat = getBMICategory(bmi);
    setOutput('bmi-cat', cat);

    // Calculate healthy range: BMI between 18.5 and 24.9
    var minHeightM = heightUnit === 'in' ? height * 0.0254 : height / 100;
    var minWeightKg = 18.5 * minHeightM * minHeightM;
    var maxWeightKg = 24.9 * minHeightM * minHeightM;

    var minWeight, maxWeight, unitLabel;
    if (weightUnit === 'lb') {
      minWeight = minWeightKg / 0.45359237;
      maxWeight = maxWeightKg / 0.45359237;
      unitLabel = 'lbs';
    } else {
      minWeight = minWeightKg;
      maxWeight = maxWeightKg;
      unitLabel = 'kg';
    }

    setStats('guidance', [
      ['Healthy BMI range', '18.5 – 24.9'],
      ['Ideal weight range', minWeight.toFixed(1) + ' – ' + maxWeight.toFixed(1) + ' ' + unitLabel],
      ['Current classification', cat]
    ]);

    status('BMI calculated successfully.', 'ok');
  }

  ['weight', 'weight-unit', 'height', 'height-unit'].forEach(function (id) {
    var el = control(id);
    el.addEventListener('input', render);
    el.addEventListener('change', render);
  });

  render();`);

  return { entry, js };
}

export async function selfTest() {
  var bmiMetric = calculateBMI(70, 'kg', 170, 'cm');
  if (Math.abs(bmiMetric - 24.22) > 0.05) throw new Error('calculateBMI metric test failed');

  var bmiImperial = calculateBMI(180, 'lb', 70, 'in');
  if (Math.abs(bmiImperial - 25.82) > 0.05) throw new Error('calculateBMI imperial test failed');

  if (getBMICategory(18.0) !== 'Underweight') throw new Error('getBMICategory failed');
  if (getBMICategory(22.0) !== 'Normal weight') throw new Error('getBMICategory failed');
  if (getBMICategory(27.0) !== 'Overweight') throw new Error('getBMICategory failed');
  if (getBMICategory(32.0) !== 'Obese') throw new Error('getBMICategory failed');
}
