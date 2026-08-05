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

  var calculateTipDetails = function calculateTipDetails(bill, tipPct, people, roundType) {
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
};

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

  render();
})();
