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

  async function generate() {
    var text = control('input').value || '';
    if (!text) {
      setOutput('hash', '');
      return;
    }
    try {
      var enc = new TextEncoder();
      var data = enc.encode(text);
      var buf = await crypto.subtle.digest('SHA-512', data);
      var arr = Array.from(new Uint8Array(buf));
      var hex = arr.map(function (b) { return b.toString(16).padStart(2, '0'); }).join('');
      setOutput('hash', hex);
    } catch (e) {
      setOutput('hash', 'Error: ' + e.message);
    }
  }

  function clearAll() {
    control('input').value = '';
    setOutput('hash', '');
  }

  var genBtn = root.querySelector('[data-action="generate"]');
  var clearBtn = root.querySelector('[data-action="clear"]');
  if (genBtn) genBtn.addEventListener('click', generate);
  if (clearBtn) clearBtn.addEventListener('click', clearAll);
})();
