import { frame, composeSEO, standardFaq, finalizeEntry } from './helpers.mjs';
import { UNITS, TEMP_UNITS, convertUnit, convertTemperature, formatMeasurement, unitSymbol } from '../fns/units.mjs';

export const id = 'unit-converter';

export function generate(catalogItem, ctx) {
  const kind = catalogItem.params?.kind;
  const isTemp = kind === 'temperature';
  const table = isTemp ? null : UNITS[kind]?.units;
  if (!isTemp && !table) throw new Error(`${catalogItem.id}: unknown unit kind "${kind}"`);

  const unitNames = isTemp ? TEMP_UNITS : Object.keys(table);
  if (unitNames.length < 2) throw new Error(`${catalogItem.id}: need at least two units`);

  const title = catalogItem.params.title;
  const { description, intro, seoTitle } = composeSEO(title, catalogItem.blurb, ctx.site);

  const options = unitNames.map((u) => ({ value: u, label: u }));
  const sample = catalogItem.params.sampleValue ?? 1;
  const convert = isTemp
    ? (v, a, b) => convertTemperature(v, a, b)
    : (v, a, b) => convertUnit(table, v, a, b);

  const exampleResult = formatMeasurement(convert(sample, unitNames[0], unitNames[1]));
  const factorLine = `1 ${unitSymbol(unitNames[0])} = ${formatMeasurement(convert(1, unitNames[0], unitNames[1]))} ${unitSymbol(unitNames[1])}`;

  const entry = {
    id: catalogItem.id,
    title,
    h1: catalogItem.params.h1 || `${title} — free & online`,
    intro,
    blurb: catalogItem.blurb,
    ui: {
      controls: [
        { type: 'number', id: 'value', label: 'Value', value: sample, step: 'any', inputmode: 'decimal' },
        { type: 'select', id: 'from', label: 'From', options, value: unitNames[0] },
        { type: 'select', id: 'to', label: 'To', options, value: unitNames[1] }
      ],
      actions: [{ id: 'swap', label: '⇄ Swap units' }],
      outputs: [{ type: 'text', id: 'result', label: 'Converted result' }]
    },
    howItWorks: [
      'Enter the value you want to convert.',
      'Pick the unit you are converting from and the unit you want.',
      'The result updates instantly as you type, together with the exact conversion factor.',
      isTemp
        ? 'Temperature conversions use the standard Celsius/Fahrenheit/Kelvin formulas.'
        : `Conversions go through the ${UNITS[kind].baseName} as the exact reference unit, so precision is preserved.`,
      'Everything happens in your browser — no data is sent to any server.'
    ],
    examples: [
      `${sample} ${unitNames[0]} = ${exampleResult} ${unitNames[1]}.`,
      `Quick reference: ${factorLine}.`,
      'Type a new value or swap the dropdowns — the result recalculates instantly.'
    ],
    faq: catalogItem.faq || [
      {
        q: `How do I convert ${unitSymbol(unitNames[0])} to ${unitSymbol(unitNames[1])}?`,
        a: `Enter your value, select ${unitNames[0]} in the “From” box and ${unitNames[1]} in the “To” box. For reference, ${factorLine}.`
      },
      ...standardFaq(title, catalogItem.blurb).slice(1)
    ],
    description,
    seoTitle
  };

  const js = frame(`  var IS_TEMPERATURE = ${isTemp};
  var FACTORS = ${JSON.stringify(table || {})};
  var convertUnit = ${convertUnit.toString()};
  var convertTemperature = ${convertTemperature.toString()};
  var fmt = ${formatMeasurement.toString()};
  var sym = ${unitSymbol.toString()};

  function convert(v, from, to) {
    return IS_TEMPERATURE ? convertTemperature(v, from, to) : convertUnit(FACTORS, v, from, to);
  }

  function update() {
    var v = parseFloat(control('value').value);
    var from = control('from').value;
    var to = control('to').value;
    if (!isFinite(v)) {
      setOutput('result', '');
      status('Enter a number to convert.', '');
      return;
    }
    var out = convert(v, from, to);
    setOutput('result', fmt(out) + ' ' + sym(to));
    status('1 ' + sym(from) + ' = ' + fmt(convert(1, from, to)) + ' ' + sym(to), 'ok');
  }

  ['value', 'from', 'to'].forEach(function (id) {
    var el = control(id);
    el.addEventListener('input', update);
    el.addEventListener('change', update);
  });

  onAction('swap', function () {
    var from = control('from');
    var to = control('to');
    var tmp = from.value;
    from.value = to.value;
    to.value = tmp;
    update();
  });

  update();`);

  return { entry: finalizeEntry(entry, catalogItem, ctx), js };
}
