(function () {
  'use strict';
  var root = document.getElementById('tool-app');
  if (!root) return;
  function control(id) { return root.querySelector('[data-control="' + id + '"]'); }
  function outputEl(id) { return root.querySelector('[data-output="' + id + '"]'); }
  function setOutput(id, value) {
    var el = outputEl(id);
    if (!el) return;
    if ('value' in el) el.value = value;
    else el.textContent = value;
  }
  function onAction(id, fn) {
    var btn = root.querySelector('[data-action="' + id + '"]');
    if (btn) btn.addEventListener('click', function () { fn(btn); });
  }
  function status(msg) {
    var n = root.querySelector('[data-status]');
    if (n) n.textContent = msg || '';
  }

  function formatXml(xml, mode) {
    var parser = new DOMParser();
    var doc = parser.parseFromString(xml, 'application/xml');
    var err = doc.querySelector('parsererror');
    if (err) throw new Error('Invalid XML');
    if (mode === 'minify') {
      return new XMLSerializer().serializeToString(doc).replace(/>\s+</g, '><');
    }
    var serializer = new XMLSerializer();
    var str = serializer.serializeToString(doc);
    var formatted = '';
    var pad = 0;
    str.replace(/(>)(<)(\/*)/g, '$1\r\n$2$3').split('\r\n').forEach(function (node) {
      var indent = 0;
      if (node.match(/.+<\/\w[^>]*>$/)) indent = 0;
      else if (node.match(/^<\/\w/)) { if (pad !== 0) pad -= 1; }
      else if (node.match(/^<\w[^>]*[^\/]>.*$/)) indent = 1;
      else indent = 0;
      formatted += '  '.repeat(pad) + node + '\n';
      pad += indent;
    });
    return formatted.trim();
  }

  function run() {
    var xml = (control('xml') && control('xml').value || '').trim();
    var mode = (control('mode') && control('mode').value) || 'pretty';
    if (!xml) { setOutput('result', ''); status(''); return; }
    try {
      var out = formatXml(xml, mode);
      setOutput('result', out);
      status('Formatted successfully.');
    } catch (e) {
      setOutput('result', '');
      status('Invalid XML. Check the markup and try again.');
    }
  }

  onAction('format', run);
  onAction('copy', function () {
    var el = outputEl('result');
    if (el && el.value) {
      navigator.clipboard.writeText(el.value).then(function () { status('Copied to clipboard.'); });
    }
  });
  onAction('clear', function () {
    if (control('xml')) control('xml').value = '';
    setOutput('result', '');
    status('');
  });
})();
