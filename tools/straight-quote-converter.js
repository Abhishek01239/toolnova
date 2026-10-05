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


  function clean() {
    var text = control('text').value || '';
    var dashes = control('dashes').checked;
    var invisible = control('invisible').checked;
    var count = 0;
    function swap(re, to) {
      return text.replace(re, function () { count++; return to; });
    }
    text = swap(/[\u201C\u201D\u201E\u201F]/g, '"');
    text = swap(/[\u2018\u2019\u201A\u201B]/g, "'");
    if (dashes) {
      text = swap(/[\u2013\u2014\u2015]/g, '-');
    }
    if (invisible) {
      text = swap(/[\u200B\u200C\u200D\uFEFF]/g, '');
      text = swap(/\u00A0/g, ' ');
    }
    setOutput('result', text);
    setStats('summary', [
      ['Replacements', String(count)],
      ['Characters', String(text.length)]
    ]);
    status(count ? 'Converted special characters.' : 'No matching characters found.', 'ok');
  }
  onAction('clean', clean);

})();
