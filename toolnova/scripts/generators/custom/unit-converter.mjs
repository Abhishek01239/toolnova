import { frame } from '../../../lib/factories/helpers.mjs';
import { UNITS, TEMP_UNITS, convertUnit, convertTemperature, formatMeasurement, unitSymbol } from '../../../lib/fns/units.mjs';

const KIND_LABELS = {
  length: 'Length', mass: 'Weight / mass', temperature: 'Temperature',
  speed: 'Speed', data: 'Digital storage', area: 'Area', volume: 'Volume', time: 'Time'
};

export default function generate(catalogItem, ctx) {
  const entry = {
    id: 'unit-converter',
    title: 'Unit Converter',
    h1: 'Unit Converter — length, weight, temperature & more',
    seoTitle: 'Unit Converter — Length, Weight, Temperature & More | ToolNova',
    description:
      'Convert length, weight, temperature, speed, area, volume, data and time units instantly with exact conversion factors. Free, fast, no sign-up.',
    intro:
      'One converter for everyday units: length, weight, temperature, speed, area, volume, digital storage and time. Results update live as you type, with the exact conversion factor shown for reference.',
    category: 'Unit Converter',
    keywords: ['unit converter', 'convert units', 'length converter', 'weight converter', 'temperature converter', 'measurement converter', 'inch to cm'],
    popularity: 88,
    ui: {
      controls: [
        { type: 'select', id: 'kind', label: 'Measurement type', value: 'length', options: Object.entries(KIND_LABELS).map(([value, label]) => ({ value, label })) },
        { type: 'number', id: 'value', label: 'Value', value: 1, step: 'any', inputmode: 'decimal' },
        { type: 'select', id: 'from', label: 'From', value: 'Meter (m)', options: Object.keys(UNITS.length.units).map((u) => ({ value: u, label: u })) },
        { type: 'select', id: 'to', label: 'To', value: 'Kilometer (km)', options: Object.keys(UNITS.length.units).map((u) => ({ value: u, label: u })) }
      ],
      actions: [{ id: 'swap', label: '⇄ Swap units' }],
      outputs: [{ type: 'text', id: 'result', label: 'Converted result' }]
    },
    howItWorks: [
      'Choose a measurement type — length, weight, temperature, speed, storage, area, volume or time.',
      'Enter a value and pick the units to convert between; the result updates instantly.',
      'Conversions go through an exact reference unit (or the official formula for temperature), so results stay precise.',
      'The status line shows the unit-to-unit factor, e.g. “1 mi = 1.609344 km”, for quick mental math.',
      'Everything is computed locally in your browser.'
    ],
    examples: [
      '5 Mile (mi) = 8.04672 Kilometer (km).',
      '100 °F = 37.7777777778 °C — temperature uses exact formulas, not factors.',
      '1 Gibibyte (GiB) = 1.073741824 Gigabyte (GB) — both decimal and binary storage units are included.',
      '1 US gallon (gal) = 3.785411784 Liter (L).'
    ],
    faq: [
      {
        q: 'Which unit types are supported?',
        a: 'Length, weight/mass, temperature, speed, digital storage (both SI decimal like MB and IEC binary like MiB), area, volume (US customary and metric) and time. The catalogue covers the units people search for most.'
      },
      {
        q: 'How precise are the conversions?',
        a: 'Factors use internationally defined exact values where they exist (for example 1 inch = 0.0254 meters exactly), and results are displayed to 10 significant digits — more than enough for everyday, engineering and recipe use.'
      },
      {
        q: 'What is the difference between MB and MiB?',
        a: 'Megabyte (MB) is decimal: 1,000,000 bytes. Mebibyte (MiB) is binary: 1,048,576 bytes. Storage makers use MB/GB/TB, while operating systems often report GiB/TiB — this converter includes both so the numbers finally line up.'
      },
      {
        q: 'Why does temperature use formulas instead of factors?',
        a: 'Because Celsius, Fahrenheit and Kelvin do not share a zero point, temperature conversion needs offsets as well as scaling: °F = °C × 1.8 + 32 and K = °C + 273.15. The tool applies the exact formulas for you.'
      }
    ]
  };

  const js = frame(`  var UNITS = ${JSON.stringify(UNITS)};
  var TEMP_UNITS = ${JSON.stringify(TEMP_UNITS)};
  var convertUnit = ${convertUnit.toString()};
  var convertTemperature = ${convertTemperature.toString()};
  var fmt = ${formatMeasurement.toString()};
  var sym = ${unitSymbol.toString()};

  function unitNames(kind) {
    return kind === 'temperature' ? TEMP_UNITS : Object.keys(UNITS[kind].units);
  }

  function convert(kind, v, from, to) {
    return kind === 'temperature' ? convertTemperature(v, from, to) : convertUnit(UNITS[kind].units, v, from, to);
  }

  function fillUnits(kind, keep) {
    var names = unitNames(kind);
    ['from', 'to'].forEach(function (which) {
      var sel = control(which);
      var prev = sel.value;
      sel.innerHTML = '';
      names.forEach(function (name) {
        var opt = document.createElement('option');
        opt.value = name;
        opt.textContent = name;
        sel.appendChild(opt);
      });
      if (keep && names.indexOf(prev) !== -1) {
        sel.value = prev;
      } else {
        sel.value = names[which === 'from' ? 0 : Math.min(1, names.length - 1)];
      }
    });
  }

  function update() {
    var kind = control('kind').value;
    var v = parseFloat(control('value').value);
    var from = control('from').value;
    var to = control('to').value;
    if (!isFinite(v)) {
      setOutput('result', '');
      status('Enter a number to convert.', '');
      return;
    }
    var out = convert(kind, v, from, to);
    setOutput('result', fmt(out) + ' ' + sym(to));
    status('1 ' + sym(from) + ' = ' + fmt(convert(kind, 1, from, to)) + ' ' + sym(to), 'ok');
  }

  control('kind').addEventListener('change', function () { fillUnits(control('kind').value, false); update(); });
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

  fillUnits(control('kind').value, false);
  update();`);

  return { entry, js };
}
