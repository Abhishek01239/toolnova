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

  function escapeHtml(s) {
    return s.replace(/&/g, '&').replace(/</g, '<').replace(/>/g, '>');
  }

  function mdToHtml(md) {
    var lines = md.replace(/\r\n/g, '\n').split('\n');
    var html = [];
    var inList = false;
    for (var i = 0; i < lines.length; i++) {
      var line = lines[i];
      if (line.trim() === '') {
        if (inList) { html.push('</ul>'); inList = false; }
        continue;
      }
      var m;
      if ((m = line.match(/^(#{1,6})\s+(.+)$/))) {
        if (inList) { html.push('</ul>'); inList = false; }
        var level = m[1].length;
        html.push('<h' + level + '>' + inline(m[2]) + '</h' + level + '>');
      } else if (line.match(/^\s*[-*]\s+/)) {
        if (!inList) { html.push('<ul>'); inList = true; }
        html.push('<li>' + inline(line.replace(/^\s*[-*]\s+/, '')) + '</li>');
      } else {
        if (inList) { html.push('</ul>'); inList = false; }
        html.push('<p>' + inline(line) + '</p>');
      }
    }
    if (inList) html.push('</ul>');
    return html.join('\n');
  }

  function inline(s) {
    s = escapeHtml(s);
    s = s.replace(/`([^`]+)`/g, '<code>$1</code>');
    s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    s = s.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
    return s;
  }

  function convert() {
    var md = control('markdown').value;
    var html = mdToHtml(md);
    setOutput('html', html);
    setOutput('preview', html);
    status('Converted.', 'ok');
  }

  onAction('convert', convert);
  onAction('copy', function () {
    var html = outputEl('html').value;
    navigator.clipboard.writeText(html).then(function () {
      status('Copied to clipboard.', 'ok');
    }).catch(function () {
      status('Copy failed.', 'err');
    });
  });
  control('markdown').addEventListener('input', convert);
  convert();
})();
