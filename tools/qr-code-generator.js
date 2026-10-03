(function () {
  'use strict';
  var root = document.getElementById('tool-app');
  if (!root) return;

  var LIB_URLS = [
    'https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.js',
    'https://cdnjs.cloudflare.com/ajax/libs/qrcode-generator/1.4.4/qrcode.min.js'
  ];
  var GROUPS = {
    text: ['text'],
    upi: ['upiid', 'upiname', 'upiamount', 'upinote'],
    whatsapp: ['wanumber', 'wamsg'],
    wifi: ['ssid', 'wifipass', 'wifisec'],
    email: ['emailto', 'emailsub', 'emailbody'],
    phone: ['phone'],
    sms: ['smsnumber', 'smsbody']
  };
  var current = null;
  var libPromise = null;
  var timer = null;
  var runId = 0;

  /* ---------- tiny helpers ---------- */
  function control(id) { return root.querySelector('[data-control="' + id + '"]'); }
  function outputEl(id) { return root.querySelector('[data-output="' + id + '"]'); }
  function val(id, fallback) {
    var n = control(id);
    return n ? String(n.value) : fallback;
  }
  function trimmed(id) { return val(id, '').trim(); }
  function el(tag, cls, text) {
    var node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text !== undefined && text !== null) node.textContent = text;
    return node;
  }
  function status(msg, kind) {
    var node = root.querySelector('[data-status]');
    if (!node) return;
    node.textContent = msg || '';
    node.className = 'status' + (kind ? ' ' + kind : '');
  }
  function setStats(id, entries) {
    var node = outputEl(id);
    if (!node) return;
    node.innerHTML = '';
    entries.forEach(function (pair) {
      var wrap = document.createElement('div');
      wrap.className = 'stat';
      var dt = document.createElement('dt');
      dt.textContent = pair[0];
      var dd = document.createElement('dd');
      dd.textContent = pair[1];
      wrap.appendChild(dt);
      wrap.appendChild(dd);
      node.appendChild(wrap);
    });
  }
  function onAction(id, fn) {
    var btn = root.querySelector('[data-action="' + id + '"]');
    if (btn) btn.addEventListener('click', function () { fn(btn); });
  }
  function download(blob, name) {
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 5000);
  }
  function toBinary(text) {
    var bytes = new TextEncoder().encode(text);
    var s = '';
    for (var i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
    return s;
  }

  /* ---------- styles (self-contained, uses the site's theme variables) ---------- */
  if (!document.getElementById('qr-generator-styles')) {
    var st = document.createElement('style');
    st.id = 'qr-generator-styles';
    st.textContent = [
      '.qr-stage{display:flex;flex-direction:column;align-items:center;gap:12px;margin-bottom:8px}',
      '.qr-box{width:100%;max-width:340px;aspect-ratio:1/1;display:grid;place-items:center;background:#fff;border-radius:18px;border:1px solid var(--border);padding:12px;box-shadow:0 0 44px -14px var(--accent-ring)}',
      '.qr-box canvas{width:100%;height:100%;display:block}',
      '.qr-empty{color:#566;font-size:.9rem;text-align:center;padding:16px;line-height:1.5}'
    ].join('\n');
    document.head.appendChild(st);
  }

  /* ---------- preview stage inside the result pane ---------- */
  var panes = root.querySelectorAll('.tool-pane');
  var outPane = panes[1] || panes[0];
  var stage = el('div', 'qr-stage');
  var box = el('div', 'qr-box');
  var canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  canvas.setAttribute('role', 'img');
  canvas.setAttribute('aria-label', 'Generated QR code');
  canvas.style.display = 'none';
  var emptyEl = el('div', 'qr-empty', 'Fill in the details to generate your QR code.');
  box.appendChild(canvas);
  box.appendChild(emptyEl);
  stage.appendChild(box);
  var outHeader = outPane.querySelector('.pane-header');
  if (outHeader && outHeader.nextSibling) outPane.insertBefore(stage, outHeader.nextSibling);
  else outPane.appendChild(stage);

  function showEmpty(message, isError) {
    canvas.style.display = 'none';
    emptyEl.style.display = '';
    emptyEl.textContent = message;
    setStats('summary', [['Characters', '\u2014'], ['QR version', '\u2014'], ['Image size', '\u2014']]);
    status(isError ? message : '', isError ? 'error' : '');
  }

  /* ---------- QR engine (loaded on demand) ---------- */
  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.src = src;
      s.async = true;
      s.onload = resolve;
      s.onerror = function () { reject(new Error('load failed')); };
      document.head.appendChild(s);
    });
  }
  function ensureLib() {
    if (window.qrcode) return Promise.resolve(window.qrcode);
    if (!libPromise) {
      libPromise = LIB_URLS.reduce(function (chain, url) {
        return chain.catch(function () {
          return loadScript(url).then(function () {
            if (!window.qrcode) throw new Error('engine missing');
          });
        });
      }, Promise.reject(new Error('start'))).then(function () {
        return window.qrcode;
      }).catch(function () {
        libPromise = null;
        throw new Error('Could not load the QR engine. Check your internet connection and try again.');
      });
    }
    return libPromise;
  }

  /* ---------- what goes inside the QR code ---------- */
  function wifiEscape(s) { return s.replace(/([\\;,:"])/g, '\\$1'); }
  function content(type) {
    switch (type) {
      case 'upi': {
        var id = trimmed('upiid').replace(/\s+/g, '');
        if (!id) return '';
        if (id.indexOf('@') < 1) throw new Error('That UPI ID looks incomplete — it should look like name@bank.');
        var url = 'upi://pay?pa=' + id;
        var name = trimmed('upiname');
        if (name) url += '&pn=' + encodeURIComponent(name);
        var amount = parseFloat(trimmed('upiamount'));
        if (amount > 0) url += '&am=' + amount.toFixed(2);
        url += '&cu=INR';
        var note = trimmed('upinote');
        if (note) url += '&tn=' + encodeURIComponent(note);
        return url;
      }
      case 'whatsapp': {
        var digits = trimmed('wanumber').replace(/\D/g, '');
        if (!digits) return '';
        if (digits.length < 8) throw new Error('Enter the number with its country code, for example 919876543210.');
        var msg = trimmed('wamsg');
        return 'https://wa.me/' + digits + (msg ? '?text=' + encodeURIComponent(msg) : '');
      }
      case 'wifi': {
        var ssid = trimmed('ssid');
        if (!ssid) return '';
        var sec = val('wifisec', 'WPA');
        var pass = val('wifipass', '');
        return 'WIFI:T:' + sec + ';S:' + wifiEscape(ssid) + ';' + (sec !== 'nopass' && pass ? 'P:' + wifiEscape(pass) + ';' : '') + ';';
      }
      case 'email': {
        var to = trimmed('emailto');
        if (!to) return '';
        var params = [];
        var sub = trimmed('emailsub');
        var body = trimmed('emailbody');
        if (sub) params.push('subject=' + encodeURIComponent(sub));
        if (body) params.push('body=' + encodeURIComponent(body));
        return 'mailto:' + to + (params.length ? '?' + params.join('&') : '');
      }
      case 'phone': {
        var num = trimmed('phone').replace(/[^\d+]/g, '');
        return num ? 'tel:' + num : '';
      }
      case 'sms': {
        var sn = trimmed('smsnumber').replace(/[^\d+]/g, '');
        if (!sn) return '';
        return 'SMSTO:' + sn + ':' + trimmed('smsbody');
      }
      default:
        return val('text', '').trim();
    }
  }

  /* ---------- drawing ---------- */
  function draw(qr, size, fg) {
    var n = qr.getModuleCount();
    var q = 4;
    var cell = size / (n + 2 * q);
    canvas.width = size;
    canvas.height = size;
    var ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = fg;
    for (var r = 0; r < n; r++) {
      for (var c = 0; c < n; c++) {
        if (!qr.isDark(r, c)) continue;
        var x0 = Math.round((c + q) * cell);
        var x1 = Math.round((c + q + 1) * cell);
        var y0 = Math.round((r + q) * cell);
        var y1 = Math.round((r + q + 1) * cell);
        ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
      }
    }
  }
  function svgString(qr, fg) {
    var n = qr.getModuleCount();
    var q = 4;
    var total = n + 2 * q;
    var d = [];
    for (var r = 0; r < n; r++) {
      for (var c = 0; c < n; c++) {
        if (qr.isDark(r, c)) d.push('M' + (c + q) + ' ' + (r + q) + 'h1v1h-1z');
      }
    }
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + total + ' ' + total + '" shape-rendering="crispEdges">' +
      '<rect width="' + total + '" height="' + total + '" fill="#ffffff"/>' +
      '<path d="' + d.join('') + '" fill="' + fg + '"/></svg>';
  }

  function generate() {
    var myRun = ++runId;
    var text;
    try {
      text = content(val('type', 'text'));
    } catch (e) {
      current = null;
      showEmpty(e.message, true);
      return;
    }
    if (!text) {
      current = null;
      showEmpty('Fill in the details to generate your QR code.', false);
      return;
    }
    ensureLib().then(function (qrcode) {
      if (myRun !== runId) return;
      var qr;
      try {
        qr = qrcode(0, val('ecc', 'M'));
        qr.addData(toBinary(text), 'Byte');
        qr.make();
      } catch (e) {
        current = null;
        showEmpty('That is too much data for one QR code. Try shorter text or a lower error-correction level.', true);
        return;
      }
      var size = parseInt(val('size', '512'), 10) || 512;
      var fg = val('color', '#000000');
      draw(qr, size, fg);
      current = { qr: qr, fg: fg, size: size };
      emptyEl.style.display = 'none';
      canvas.style.display = '';
      var modules = qr.getModuleCount();
      setStats('summary', [
        ['Characters', String(text.length)],
        ['QR version', String((modules - 17) / 4)],
        ['Image size', size + ' px']
      ]);
      status('');
    }).catch(function (err) {
      if (myRun !== runId) return;
      showEmpty(err.message || 'Something went wrong. Please try again.', true);
    });
  }
  function schedule() {
    if (timer) clearTimeout(timer);
    timer = setTimeout(generate, 180);
  }

  /* ---------- show only the fields for the chosen type ---------- */
  function syncGroups() {
    var type = val('type', 'text');
    Object.keys(GROUPS).forEach(function (g) {
      GROUPS[g].forEach(function (id) {
        var f = root.querySelector('[data-field="' + id + '"]');
        if (f) f.style.display = g === type ? '' : 'none';
      });
    });
  }
  function onChange(e) {
    if (e.target && e.target.getAttribute('data-control') === 'type') syncGroups();
    schedule();
  }
  root.addEventListener('input', onChange);
  root.addEventListener('change', onChange);

  /* ---------- downloads ---------- */
  onAction('png', function () {
    if (!current) { status('Fill in the details first, then download.', 'error'); return; }
    canvas.toBlob(function (blob) {
      if (!blob) { status('Could not create the image. Please try again.', 'error'); return; }
      download(blob, 'qr-code.png');
      status('Downloaded qr-code.png.', 'ok');
    }, 'image/png');
  });
  onAction('svg', function () {
    if (!current) { status('Fill in the details first, then download.', 'error'); return; }
    download(new Blob([svgString(current.qr, current.fg)], { type: 'image/svg+xml' }), 'qr-code.svg');
    status('Downloaded qr-code.svg.', 'ok');
  });

  syncGroups();
  generate();
})();
