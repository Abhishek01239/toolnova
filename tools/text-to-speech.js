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

  var current = null;

  onAction('speak', function () {
    status('');
    if (!window.speechSynthesis) {
      status('Speech synthesis is not supported in this browser.', 'error');
      return;
    }
    var text = control('text').value.trim();
    if (!text) {
      status('Please enter some text to speak.', 'error');
      return;
    }
    window.speechSynthesis.cancel();
    var utter = new SpeechSynthesisUtterance(text);
    utter.rate = parseFloat(control('rate').value) || 1;
    utter.pitch = parseFloat(control('pitch').value) || 1;
    utter.onstart = function () {
      status('Speaking\u2026', 'ok');
      setStats('summary', [['Status', 'Speaking'], ['Characters', String(text.length)]]);
    };
    utter.onend = function () {
      status('Finished.', 'ok');
      setStats('summary', [['Status', 'Finished'], ['Characters', String(text.length)]]);
    };
    utter.onerror = function (e) {
      status('Speech error: ' + (e.error || 'unknown'), 'error');
    };
    current = utter;
    window.speechSynthesis.speak(utter);
  });

  onAction('stop', function () {
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    status('Stopped.', 'ok');
    setStats('summary', [['Status', 'Stopped']]);
  });
})();
