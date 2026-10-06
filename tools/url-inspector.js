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
  function parse() {
    var raw = (control('url').value || '').trim();
    if (!raw) { status('Paste a URL.', 'err'); return; }
    var url;
    try { url = new URL(raw); }
    catch (e) { status('Enter an absolute URL with http:// or https://.', 'err'); return; }
    var lines = [
      'protocol: ' + url.protocol,
      'host: ' + url.host,
      'hostname: ' + url.hostname,
      'port: ' + (url.port || '(default)'),
      'pathname: ' + url.pathname,
      'hash: ' + (url.hash || '(none)')
    ];
    var count = 0;
    url.searchParams.forEach(function (value, key) {
      count++;
      lines.push('query ' + key + ' = ' + value);
    });
    if (!count) lines.push('query: (none)');
    setOutput('result', lines.join('\n'));
    setStats('summary', [
      ['Protocol', url.protocol.replace(':', '')],
      ['Host', url.host],
      ['Query pairs', String(count)],
      ['Hash', url.hash ? 'Yes' : 'No']
    ]);
    status('Parsed the URL.', 'ok');
  }
  onAction('parse', parse);
  parse();
})();
