(function () {
  'use strict';
  var root = document.getElementById('tool-app');
  if (!root) return;
  function control(id) { return root.querySelector('[data-control="' + id + '"]'); }
  function outputEl(id) { return root.querySelector('[data-output="' + id + '"]'); }
  function setOutput(id, value) {
    var el = outputEl(id);
    if (!el) return;
    if ('value' in el) { el.value = value; } else { el.textContent = value; }
  }
  function onAction(id, fn) {
    var btn = root.querySelector('[data-action="' + id + '"]');
    if (btn) btn.addEventListener('click', function () { fn(btn); });
  }
  function status(msg, kind) {
    var el = root.querySelector('[data-status]');
    if (!el) return;
    el.textContent = msg || '';
    el.className = 'status' + (kind ? ' ' + kind : '');
  }
  function setStats(id, entries) {
    var el = outputEl(id);
    if (!el) return;
    el.innerHTML = '';
    entries.forEach(function (pair) {
      var wrap = document.createElement('div');
      wrap.className = 'stat';
      var dt = document.createElement('dt');
      dt.textContent = pair[0];
      var dd = document.createElement('dd');
      dd.textContent = pair[1];
      wrap.appendChild(dt);
      wrap.appendChild(dd);
      el.appendChild(wrap);
    });
  }
  function readControls(defs) {
    var vals = {};
    defs.forEach(function (d) {
      var el = control(d.id);
      if (!el) { vals[d.id] = d.value; return; }
      if (d.type === 'checkbox') vals[d.id] = el.checked;
      else if (d.type === 'number' || d.type === 'range') vals[d.id] = parseFloat(el.value) || 0;
      else vals[d.id] = el.value;
    });
    return vals;
  }

  var UNITS = {"length":{"baseName":"meter","units":{"Meter (m)":1,"Kilometer (km)":1000,"Centimeter (cm)":0.01,"Millimeter (mm)":0.001,"Micrometer (µm)":0.000001,"Mile (mi)":1609.344,"Yard (yd)":0.9144,"Foot (ft)":0.3048,"Inch (in)":0.0254,"Nautical mile (nmi)":1852}},"mass":{"baseName":"kilogram","units":{"Kilogram (kg)":1,"Gram (g)":0.001,"Milligram (mg)":0.000001,"Metric ton (t)":1000,"Pound (lb)":0.45359237,"Ounce (oz)":0.028349523125,"Stone (st)":6.35029318}},"speed":{"baseName":"meter per second","units":{"Meter/second (m/s)":1,"Kilometer/hour (km/h)":0.2777777777777778,"Mile/hour (mph)":0.44704,"Knot (kn)":0.5144444444444445,"Foot/second (ft/s)":0.3048}},"data":{"baseName":"byte","units":{"Byte (B)":1,"Kilobyte (KB)":1000,"Megabyte (MB)":1000000,"Gigabyte (GB)":1000000000,"Terabyte (TB)":1000000000000,"Kibibyte (KiB)":1024,"Mebibyte (MiB)":1048576,"Gibibyte (GiB)":1073741824,"Tebibyte (TiB)":1099511627776,"Bit (b)":0.125}},"area":{"baseName":"square meter","units":{"Square meter (m²)":1,"Square kilometer (km²)":1000000,"Hectare (ha)":10000,"Acre (ac)":4046.8564224,"Square foot (ft²)":0.09290304,"Square yard (yd²)":0.83612736,"Square mile (mi²)":2589988.110336,"Square inch (in²)":0.00064516}},"volume":{"baseName":"liter","units":{"Liter (L)":1,"Milliliter (mL)":0.001,"Cubic meter (m³)":1000,"Cubic centimeter (cm³)":0.001,"US gallon (gal)":3.785411784,"US quart (qt)":0.946352946,"US pint (pt)":0.473176473,"US cup (cup)":0.2365882365,"US fluid ounce (fl oz)":0.0295735295625,"Tablespoon (tbsp)":0.01478676478125,"Teaspoon (tsp)":0.00492892159375,"Cubic foot (ft³)":28.316846592,"Cubic inch (in³)":0.016387064}},"time":{"baseName":"second","units":{"Second (s)":1,"Millisecond (ms)":0.001,"Minute (min)":60,"Hour (h)":3600,"Day (d)":86400,"Week (wk)":604800,"Month (average)":2629800,"Year (average)":31557600}}};
  var TEMP_UNITS = ["Celsius (°C)","Fahrenheit (°F)","Kelvin (K)"];
  var convertUnit = function convertUnit(factors, value, from, to) {
  if (!(from in factors) || !(to in factors)) {
    throw new Error('Unknown unit');
  }
  return (value * factors[from]) / factors[to];
};
  var convertTemperature = function convertTemperature(value, from, to) {
  var celsius;
  if (from === 'Fahrenheit (°F)') celsius = (value - 32) / 1.8;
  else if (from === 'Kelvin (K)') celsius = value - 273.15;
  else celsius = value;
  if (to === 'Fahrenheit (°F)') return celsius * 1.8 + 32;
  if (to === 'Kelvin (K)') return celsius + 273.15;
  return celsius;
};
  var fmt = function formatMeasurement(n) {
  if (typeof n !== 'number' || !isFinite(n)) return '—';
  if (n !== 0 && (Math.abs(n) < 1e-9 || Math.abs(n) >= 1e15)) return n.toExponential(6);
  return String(parseFloat(n.toPrecision(10)));
};
  var sym = function unitSymbol(label) {
  var m = String(label).match(/\(([^)]+)\)$/);
  return m ? m[1] : String(label);
};

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
  update();
})();
