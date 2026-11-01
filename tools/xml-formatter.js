(function () {
  'use strict';
  var root = document.getElementById('tool-app');
  if (!root) return;
  function control(id) { return root.querySelector('[data-control="' + id + '"]'); }
  function setOutput(id, value) {
    var el = root.querySelector('[data-output="' + id + '"]');
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

  function formatXml(xml, indentSize) {
    var parser = new DOMParser();
    var doc = parser.parseFromString(xml, 'application/xml');
    var parseError = doc.querySelector('parsererror');
    if (parseError) throw new Error(parseError.textContent.split('\n')[0] || 'Invalid XML');
    var serializer = new XMLSerializer();
    var raw = serializer.serializeToString(doc);
    // Simple indent
    var indent = ' '.repeat(indentSize);
    var formatted = '';
    var pad = 0;
    raw.replace(/(>)(<)(\/?)/g, '$1\n$2$3').split('\n').forEach(function (node) {
      var indentChange = 0;
      if (node.match(/^<\/?\w[^>]*[^\/]>$/)) indentChange = 1;
      if (node.match(/^<\//)) indentChange = -1;
      if (indentChange < 0) pad += indentChange;
      formatted += indent.repeat(Math.max(0, pad)) + node + '\n';
      if (indentChange > 0) pad += indentChange;
    });
    return formatted.trim();
  }

  function run() {
    var text = control('input').value;
    if (!text.trim()) {
      status('Paste some XML first.', 'error');
      setOutput('output', '');
      return;
    }
    try {
      var ind = parseInt(control('indent').value, 10) || 2;
      var formatted = formatXml(text, ind);
      setOutput('output', formatted);
      status('✓ Formatted XML.', 'ok');
    } catch (err) {
      status('✗ ' + (err.message || 'Invalid XML'), 'error');
      setOutput('output', '');
    }
  }

  onAction('format', run);
  onAction('clear', function () {
    control('input').value = '';
    setOutput('output', '');
    status('');
  });
})();
