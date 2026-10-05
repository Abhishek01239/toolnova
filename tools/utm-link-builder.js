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


  function build() {
    var raw = control('url').value.trim();
    if (!raw) { status('Enter a landing page URL.', 'err'); return; }
    var url;
    try { url = new URL(raw); }
    catch (e) { status('Enter a full URL starting with http:// or https://.', 'err'); return; }
    var fields = [
      ['utm_source', control('source').value.trim()],
      ['utm_medium', control('medium').value.trim()],
      ['utm_campaign', control('campaign').value.trim()],
      ['utm_term', control('term').value.trim()],
      ['utm_content', control('content').value.trim()]
    ];
    if (!fields[0][1] || !fields[1][1] || !fields[2][1]) { status('Source, medium and campaign are required.', 'err'); return; }
    fields.forEach(function (pair) {
      if (pair[1]) url.searchParams.set(pair[0], pair[1]);
    });
    setOutput('result', url.toString());
    setStats('summary', fields.filter(function (p) { return p[1]; }).map(function (p) { return [p[0], p[1]]; }));
    status('Built the campaign URL.', 'ok');
  }
  onAction('build', build);
  build();

})();
