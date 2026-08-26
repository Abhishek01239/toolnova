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

  var IS_TEMPERATURE = false;
  var FACTORS = {"Meter (m)":1,"Kilometer (km)":1000,"Centimeter (cm)":0.01,"Millimeter (mm)":0.001,"Micrometer (µm)":0.000001,"Mile (mi)":1609.344,"Yard (yd)":0.9144,"Foot (ft)":0.3048,"Inch (in)":0.0254,"Nautical mile (nmi)":1852};
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

  update();
})();
