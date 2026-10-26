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

  function stripHtml(html) {
    var div = document.createElement('div');
    div.innerHTML = html;
    var scripts = div.querySelectorAll('script, style, noscript');
    for (var i = 0; i < scripts.length; i++) {
      scripts[i].remove();
    }
    return (div.textContent || div.innerText || '').replace(/\s+/g, ' ').trim();
  }

  onAction('strip', function () {
    var input = control('input').value;
    if (!input.trim()) {
      status('Paste some HTML first.', 'error');
      return;
    }
    try {
      var text = stripHtml(input);
      setOutput('output', text);
      status('Tags removed. ' + text.length + ' characters remaining.', 'ok');
    } catch (err) {
      setOutput('output', '');
      status('Error: ' + err.message, 'error');
    }
  });

  onAction('clear', function () {
    control('input').value = '';
    setOutput('output', '');
    status('');
    control('input').focus();
  });
})();
