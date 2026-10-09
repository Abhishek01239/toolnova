(function () {
  'use strict';
  var root = document.getElementById('tool-app');
  if (!root) return;
  function control(id) { return root.querySelector('[data-control="' + id + '"]'); }
  function outputEl(id) { return root.querySelector('[data-output="' + id + '"]'); }
  function setOutput(id, value) {
    var el = outputEl(id);
    if (!el) return;
    if ('value' in el) el.value = value; else el.textContent = value;
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
    var agent = (control('agent').value || '*').trim() || '*';
    var policy = control('policy').value;
    var paths = control('paths').value.split(/\n/).map(function (p) { return p.trim(); }).filter(Boolean);
    var sitemap = control('sitemap').value.trim();
    var lines = ['User-agent: ' + agent];
    if (policy === 'disallow') {
      lines.push('Disallow: /');
      paths.forEach(function (p) { lines.push('Allow: ' + (p.charAt(0) === '/' ? p : '/' + p)); });
    } else {
      lines.push('Allow: /');
      paths.forEach(function (p) { lines.push('Disallow: ' + (p.charAt(0) === '/' ? p : '/' + p)); });
    }
    if (sitemap) {
      if (!/^https?:\/\//i.test(sitemap)) { status('Sitemap must be an absolute http(s) URL.', 'err'); return; }
      lines.push('', 'Sitemap: ' + sitemap);
    }
    setOutput('result', lines.join('\n') + '\n');
    setStats('summary', [
      ['User-agent', agent],
      ['Path rules', String(paths.length)],
      ['Sitemap', sitemap ? 'yes' : 'no']
    ]);
    status('robots.txt is a crawl hint, not access control.', 'ok');
  }
  onAction('build', build);
  build();
})();
