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

  function toPascal(s) {
    return s.replace(/(^|[-_\s]+)([a-z])/gi, function(_, __, c) { return c.toUpperCase(); }).replace(/[^a-zA-Z0-9]/g, '');
  }

  function generateTs(value, name, interfaces) {
    if (value === null) return 'any';
    var t = typeof value;
    if (t === 'string') return 'string';
    if (t === 'number') return 'number';
    if (t === 'boolean') return 'boolean';
    if (Array.isArray(value)) {
      if (value.length === 0) return 'any[]';
      var itemType = generateTs(value[0], name + 'Item', interfaces);
      return itemType + '[]';
    }
    if (t === 'object') {
      var ifaceName = toPascal(name) || 'Anonymous';
      if (interfaces[ifaceName]) return ifaceName;
      var props = [];
      Object.keys(value).forEach(function(k) {
        var propType = generateTs(value[k], ifaceName + toPascal(k), interfaces);
        props.push('  ' + k + ': ' + propType + ';');
      });
      interfaces[ifaceName] = 'export interface ' + ifaceName + ' {\n' + props.join('\n') + '\n}';
      return ifaceName;
    }
    return 'any';
  }

  function run() {
    var text = control('input').value.trim();
    if (!text) {
      status('Paste some JSON first.', 'error');
      setOutput('output', '');
      return;
    }
    try {
      var data = JSON.parse(text);
      var rootName = (control('rootname').value || 'Root').trim() || 'Root';
      var interfaces = {};
      var rootType = generateTs(data, rootName, interfaces);
      var output = Object.values(interfaces).join('\n\n');
      if (!output) output = 'export type ' + toPascal(rootName) + ' = ' + rootType + ';';
      setOutput('output', output);
      status('✓ Generated TypeScript interfaces.', 'ok');
    } catch (err) {
      status('✗ Invalid JSON: ' + (err.message || 'parse error'), 'error');
      setOutput('output', '');
    }
  }

  onAction('generate', run);
  onAction('clear', function() {
    control('input').value = '';
    setOutput('output', '');
    status('');
  });
})();
