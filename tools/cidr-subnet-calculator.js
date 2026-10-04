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

  function ipToInt(ip) {
    var parts = String(ip).trim().split('.');
    if (parts.length !== 4) return null;
    var n = 0;
    for (var i = 0; i < 4; i++) {
      if (!/^\d+$/.test(parts[i])) return null;
      var oct = Number(parts[i]);
      if (oct > 255) return null;
      n = (n * 256) + oct;
    }
    return n >>> 0;
  }
  function intToIp(n) {
    return [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255].join('.');
  }
  function calc() {
    var ip = ipToInt(control('ip').value);
    var prefix = parseInt(control('prefix').value, 10);
    if (ip === null) { status('Enter a valid IPv4 address.', 'err'); return; }
    if (!isFinite(prefix) || prefix < 0 || prefix > 32) { status('Prefix must be an integer from 0 to 32.', 'err'); return; }
    var mask = prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0;
    var network = (ip & mask) >>> 0;
    var broadcast = (network | (~mask >>> 0)) >>> 0;
    var hosts = prefix >= 31 ? (prefix === 32 ? 1 : 2) : Math.pow(2, 32 - prefix) - 2;
    var first = prefix >= 31 ? network : (network + 1) >>> 0;
    var last = prefix >= 31 ? broadcast : (broadcast - 1) >>> 0;
    var wildcard = (~mask) >>> 0;
    var cidr = intToIp(network) + '/' + prefix;
    setOutput('result', cidr + '\nMask: ' + intToIp(mask) + '\nRange: ' + intToIp(first) + ' – ' + intToIp(last));
    setStats('summary', [
      ['CIDR', cidr],
      ['Subnet mask', intToIp(mask)],
      ['Wildcard mask', intToIp(wildcard)],
      ['Network', intToIp(network)],
      ['Broadcast', intToIp(broadcast)],
      ['First address', intToIp(first)],
      ['Last address', intToIp(last)],
      ['Usable hosts', String(hosts)]
    ]);
    status('Calculated ' + cidr + '.', 'ok');
  }
  onAction('calc', calc);
  calc();

})();
