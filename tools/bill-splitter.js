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
  function money(n) { return n.toFixed(2); }

  onAction('calculate', function () {
    status('');
    var total = parseFloat(control('total').value) || 0;
    var people = Math.max(1, parseInt(control('people').value, 10) || 1);
    var tipPct = parseFloat(control('tip').value) || 0;
    var taxPct = parseFloat(control('tax').value) || 0;
    if (total <= 0) {
      status('Enter a bill total greater than zero.', 'error');
      return;
    }
    var taxAmount = total * (taxPct / 100);
    var afterTax = total + taxAmount;
    var tipAmount = afterTax * (tipPct / 100);
    var grand = afterTax + tipAmount;
    var each = grand / people;
    setStats('summary', [
      ['Bill', '$' + money(total)],
      ['Tax (' + taxPct + '%)', '$' + money(taxAmount)],
      ['After tax', '$' + money(afterTax)],
      ['Tip (' + tipPct + '%)', '$' + money(tipAmount)],
      ['Grand total', '$' + money(grand)],
      ['People', String(people)],
      ['Each pays', '$' + money(each)]
    ]);
    setOutput('result', 'Each of the ' + people + ' people should pay $' + money(each) + '.');
    status('Calculated.', 'ok');
  });
})();
