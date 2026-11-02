(function () {
  'use strict';
  var root = document.getElementById('tool-app');
  if (!root) return;

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined && text !== null) n.textContent = text;
    return n;
  }
  function status(msg, kind) {
    var n = root.querySelector('[data-status]');
    if (!n) return;
    n.textContent = msg || '';
    n.className = 'status' + (kind ? ' ' + kind : '');
  }
  function setOutput(id, value) {
    var node = root.querySelector('[data-output="' + id + '"]');
    if (!node) return;
    if ('value' in node) node.value = value;
    else node.textContent = value;
  }
  function onAction(id, fn) {
    var btn = root.querySelector('[data-action="' + id + '"]');
    if (btn) btn.addEventListener('click', function () { fn(btn); });
    return btn;
  }

  /* styles */
  if (!document.getElementById('i2b64-styles')) {
    var st = document.createElement('style');
    st.id = 'i2b64-styles';
    st.textContent = [
      '.i2b-drop{display:flex;flex-direction:column;align-items:center;gap:6px;padding:34px 20px;text-align:center;border:2px dashed var(--accent-ring);border-radius:16px;background:var(--accent-soft);cursor:pointer;color:var(--text);transition:all .25s ease}',
      '.i2b-drop:hover,.i2b-drop.is-over{border-color:var(--accent);transform:translateY(-2px);box-shadow:0 0 36px -10px var(--accent-ring)}',
      '.i2b-icon{font-size:2rem}',
      '.i2b-hint{color:var(--muted);font-size:.86rem}'
    ].join('\n');
    document.head.appendChild(st);
  }

  var pane = root.querySelector('.tool-pane');
  var zone = el('div', 'i2b-zone');
  var drop = el('div', 'i2b-drop');
  drop.setAttribute('role', 'button');
  drop.setAttribute('tabindex', '0');
  drop.setAttribute('aria-label', 'Choose an image');
  drop.appendChild(el('span', 'i2b-icon', '🖼️'));
  drop.appendChild(el('strong', '', 'Choose an image'));
  drop.appendChild(el('span', 'i2b-hint', 'JPG, PNG, WebP, GIF · stays on this device'));
  var input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  input.hidden = true;

  zone.appendChild(drop);
  zone.appendChild(input);
  var header = pane.querySelector('.pane-header');
  if (header && header.nextSibling) pane.insertBefore(zone, header.nextSibling);
  else pane.appendChild(zone);

  drop.addEventListener('click', function () { input.click(); });
  drop.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); input.click(); }
  });
  ['dragenter', 'dragover'].forEach(function (n) {
    drop.addEventListener(n, function (e) { e.preventDefault(); drop.classList.add('is-over'); });
  });
  drop.addEventListener('dragleave', function (e) { e.preventDefault(); drop.classList.remove('is-over'); });
  drop.addEventListener('drop', function (e) {
    e.preventDefault();
    drop.classList.remove('is-over');
    if (e.dataTransfer && e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
  });
  input.addEventListener('change', function () {
    if (input.files && input.files[0]) handleFile(input.files[0]);
    input.value = '';
  });

  function handleFile(f) {
    if (!f || !f.type.startsWith('image/')) {
      status('Please choose an image file.', 'error');
      return;
    }
    if (f.size > 15 * 1024 * 1024) {
      status('Image is too large (max 15 MB).', 'error');
      return;
    }
    status('Converting…');
    var reader = new FileReader();
    reader.onload = function () {
      setOutput('result', reader.result);
      status('Done. ' + f.name + ' · ' + Math.round(f.size / 1024) + ' KB', 'ok');
    };
    reader.onerror = function () { status('Could not read the file.', 'error'); };
    reader.readAsDataURL(f);
  }

  onAction('copy', function () {
    var out = root.querySelector('[data-output="result"]');
    if (!out || !out.value) { status('Convert an image first.', 'error'); return; }
    navigator.clipboard.writeText(out.value).then(function () {
      status('Copied to clipboard.', 'ok');
    }).catch(function () {
      status('Copy failed — select and copy manually.', 'error');
    });
  });
})();
