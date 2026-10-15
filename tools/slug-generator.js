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

  function toSlug(text, sep) {
    if (!text) return '';
    var s = text
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9\s_-]/g, '')
      .trim()
      .replace(/[\s_-]+/g, sep)
      .replace(new RegExp('^' + sep + '+|' + sep + '+$', 'g'), '');
    return s;
  }

  function generate() {
    var text = control('text').value;
    var sep = control('separator').value || '-';
    var slug = toSlug(text, sep);
    setOutput('slug', slug);
    if (slug) status('Slug generated.', 'ok');
    else status('Enter some text first.', 'warn');
  }

  onAction('generate', generate);
  onAction('copy', function () {
    var slug = outputEl('slug').value;
    if (slug && navigator.clipboard) {
      navigator.clipboard.writeText(slug).then(function () {
        status('Copied to clipboard.', 'ok');
      }).catch(function () {
        status('Could not copy.', 'err');
      });
    } else {
      status('Nothing to copy.', 'warn');
    }
  });
  onAction('clear', function () {
    control('text').value = '';
    setOutput('slug', '');
    status('');
    control('text').focus();
  });

  control('text').addEventListener('input', generate);
  generate();
})();
