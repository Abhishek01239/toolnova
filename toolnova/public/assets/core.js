/* ToolNova core runtime — loaded (deferred) on every page.
   Handles: theme toggle, copy-to-clipboard buttons, range value display. */
(function () {
  'use strict';

  /* ---- Theme toggle ---- */
  function currentTheme() {
    return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
  }
  function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    try { localStorage.setItem('tn-theme', theme); } catch (e) { /* private mode */ }
  }
  document.querySelectorAll('[data-theme-toggle]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      setTheme(currentTheme() === 'dark' ? 'light' : 'dark');
    });
  });

  /* ---- Copy buttons ---- */
  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext !== false) {
      return navigator.clipboard.writeText(text);
    }
    // Fallback for very old browsers / insecure contexts.
    return new Promise(function (resolve, reject) {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand('copy');
        resolve();
      } catch (err) {
        reject(err);
      } finally {
        document.body.removeChild(ta);
      }
    });
  }

  document.addEventListener('click', function (event) {
    var btn = event.target.closest('[data-copy]');
    if (!btn) return;
    var target = document.querySelector(btn.getAttribute('data-copy'));
    if (!target) return;
    var text = 'value' in target ? target.value : target.textContent;
    if (!text) return;
    var original = btn.textContent;
    copyText(text).then(function () {
      btn.textContent = 'Copied ✓';
      btn.classList.add('copied');
      setTimeout(function () {
        btn.textContent = original;
        btn.classList.remove('copied');
      }, 1600);
    }).catch(function () {
      btn.textContent = 'Copy failed';
      setTimeout(function () { btn.textContent = original; }, 1600);
    });
  });

  /* ---- Range inputs: keep the value bubble in sync ---- */
  document.querySelectorAll('input[type="range"][data-control]').forEach(function (range) {
    var out = document.querySelector('[data-range-value="' + range.getAttribute('data-control') + '"]');
    if (!out) return;
    range.addEventListener('input', function () { out.textContent = range.value; });
  });
})();
