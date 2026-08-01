// Unit conversion tables (value = how many base units one unit contains)
// plus pure conversion functions. Functions are serialization-safe.

export const UNITS = {
  length: {
    baseName: 'meter',
    units: {
      'Meter (m)': 1,
      'Kilometer (km)': 1000,
      'Centimeter (cm)': 0.01,
      'Millimeter (mm)': 0.001,
      'Micrometer (µm)': 1e-6,
      'Mile (mi)': 1609.344,
      'Yard (yd)': 0.9144,
      'Foot (ft)': 0.3048,
      'Inch (in)': 0.0254,
      'Nautical mile (nmi)': 1852
    }
  },
  mass: {
    baseName: 'kilogram',
    units: {
      'Kilogram (kg)': 1,
      'Gram (g)': 0.001,
      'Milligram (mg)': 1e-6,
      'Metric ton (t)': 1000,
      'Pound (lb)': 0.45359237,
      'Ounce (oz)': 0.028349523125,
      'Stone (st)': 6.35029318
    }
  },
  speed: {
    baseName: 'meter per second',
    units: {
      'Meter/second (m/s)': 1,
      'Kilometer/hour (km/h)': 0.2777777777777778,
      'Mile/hour (mph)': 0.44704,
      'Knot (kn)': 0.5144444444444445,
      'Foot/second (ft/s)': 0.3048
    }
  },
  data: {
    baseName: 'byte',
    units: {
      'Byte (B)': 1,
      'Kilobyte (KB)': 1e3,
      'Megabyte (MB)': 1e6,
      'Gigabyte (GB)': 1e9,
      'Terabyte (TB)': 1e12,
      'Kibibyte (KiB)': 1024,
      'Mebibyte (MiB)': 1048576,
      'Gibibyte (GiB)': 1073741824,
      'Tebibyte (TiB)': 1099511627776,
      'Bit (b)': 0.125
    }
  },
  area: {
    baseName: 'square meter',
    units: {
      'Square meter (m²)': 1,
      'Square kilometer (km²)': 1e6,
      'Hectare (ha)': 1e4,
      'Acre (ac)': 4046.8564224,
      'Square foot (ft²)': 0.09290304,
      'Square yard (yd²)': 0.83612736,
      'Square mile (mi²)': 2589988.110336,
      'Square inch (in²)': 0.00064516
    }
  },
  volume: {
    baseName: 'liter',
    units: {
      'Liter (L)': 1,
      'Milliliter (mL)': 0.001,
      'Cubic meter (m³)': 1000,
      'Cubic centimeter (cm³)': 0.001,
      'US gallon (gal)': 3.785411784,
      'US quart (qt)': 0.946352946,
      'US pint (pt)': 0.473176473,
      'US cup (cup)': 0.2365882365,
      'US fluid ounce (fl oz)': 0.0295735295625,
      'Tablespoon (tbsp)': 0.01478676478125,
      'Teaspoon (tsp)': 0.00492892159375,
      'Cubic foot (ft³)': 28.316846592,
      'Cubic inch (in³)': 0.016387064
    }
  },
  time: {
    baseName: 'second',
    units: {
      'Second (s)': 1,
      'Millisecond (ms)': 0.001,
      'Minute (min)': 60,
      'Hour (h)': 3600,
      'Day (d)': 86400,
      'Week (wk)': 604800,
      'Month (average)': 2629800,
      'Year (average)': 31557600
    }
  }
};

export const TEMP_UNITS = ['Celsius (°C)', 'Fahrenheit (°F)', 'Kelvin (K)'];

// factor-table conversion; value * factor[from] = base units
export function convertUnit(factors, value, from, to) {
  if (!(from in factors) || !(to in factors)) {
    throw new Error('Unknown unit');
  }
  return (value * factors[from]) / factors[to];
}

// temperature needs real formulas — self-contained for serialization
export function convertTemperature(value, from, to) {
  var celsius;
  if (from === 'Fahrenheit (°F)') celsius = (value - 32) / 1.8;
  else if (from === 'Kelvin (K)') celsius = value - 273.15;
  else celsius = value;
  if (to === 'Fahrenheit (°F)') return celsius * 1.8 + 32;
  if (to === 'Kelvin (K)') return celsius + 273.15;
  return celsius;
}

export function formatMeasurement(n) {
  if (typeof n !== 'number' || !isFinite(n)) return '—';
  if (n !== 0 && (Math.abs(n) < 1e-9 || Math.abs(n) >= 1e15)) return n.toExponential(6);
  return String(parseFloat(n.toPrecision(10)));
}

// Short human symbol for a "Name (sym)" option label.
export function unitSymbol(label) {
  var m = String(label).match(/\(([^)]+)\)$/);
  return m ? m[1] : String(label);
}
