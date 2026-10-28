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

  function update() {
    var all = parseInt(control('all').value, 10) || 0;
    var tl = control('tl').value !== '' ? parseInt(control('tl').value, 10) : all;
    var tr = control('tr').value !== '' ? parseInt(control('tr').value, 10) : all;
    var br = control('br').value !== '' ? parseInt(control('br').value, 10) : all;
    var bl = control('bl').value !== '' ? parseInt(control('bl').value, 10) : all;
    var css = 'border-radius: ' + tl + 'px ' + tr + 'px ' + br + 'px ' + bl + 'px;';
    setOutput('css', css);
  }

  ['all','tl','tr','br','bl'].forEach(function(id) {
    var el = control(id);
    if (el) {
      el.addEventListener('input', update);
      el.addEventListener('change', update);
    }
  });
  var copyBtn = root.querySelector('[data-action="copy"]');
  if (copyBtn) {
    copyBtn.addEventListener('click', function() {
      var cssEl = outputEl('css');
      var css = cssEl.value || cssEl.textContent;
      navigator.clipboard.writeText(css).then(function() {
        copyBtn.textContent = 'Copied!';
        setTimeout(function() { copyBtn.textContent = 'Copy CSS'; }, 1500);
      });
    });
  }
  update();
})();
