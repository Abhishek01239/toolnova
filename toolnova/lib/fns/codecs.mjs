// Pure encoders/decoders. Same serialization contract as transforms.mjs:
// self-contained, no template literals, browser-safe (TextEncoder/TextDecoder
// are available in both Node 20 and all modern browsers).

export function base64Encode(text) {
  var alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  var bytes = new TextEncoder().encode(text);
  var out = '';
  for (var i = 0; i < bytes.length; i += 3) {
    var b1 = bytes[i];
    var b2 = i + 1 < bytes.length ? bytes[i + 1] : undefined;
    var b3 = i + 2 < bytes.length ? bytes[i + 2] : undefined;
    var n = (b1 << 16) | ((b2 || 0) << 8) | (b3 || 0);
    out += alphabet[(n >> 18) & 63];
    out += alphabet[(n >> 12) & 63];
    out += b2 === undefined ? '=' : alphabet[(n >> 6) & 63];
    out += b3 === undefined ? '=' : alphabet[n & 63];
  }
  return out;
}

export function base64Decode(encoded) {
  var alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  var clean = String(encoded).replace(/\s+/g, '');
  if (!/^[A-Za-z0-9+/]*(={0,2})$/.test(clean) || clean.length % 4 === 1) {
    throw new Error('That is not valid Base64 — check for missing or extra characters.');
  }
  var padded = clean.replace(/=+$/, '');
  var bytes = [];
  var buffer = 0;
  var bits = 0;
  for (var i = 0; i < padded.length; i++) {
    var v = alphabet.indexOf(padded[i]);
    buffer = (buffer << 6) | v;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      bytes.push((buffer >> bits) & 0xff);
    }
  }
  return new TextDecoder().decode(new Uint8Array(bytes));
}

export function urlEncode(text) {
  return encodeURIComponent(text);
}

export function urlDecode(text) {
  try {
    return decodeURIComponent(String(text).replace(/\+/g, '%20'));
  } catch (err) {
    throw new Error('That is not valid URL-encoded text (a % escape looks broken).');
  }
}

export function htmlEntityEncode(text) {
  var named = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  return [...text].map(function (ch) {
    if (named[ch]) return named[ch];
    var code = ch.codePointAt(0);
    if (code > 126) return '&#' + code + ';';
    return ch;
  }).join('');
}

export function htmlEntityDecode(text) {
  var named = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'", '&apos;': "'", '&nbsp;': ' ' };
  return String(text)
    .replace(/&#x([0-9a-fA-F]+);/g, function (m, hex) {
      return String.fromCodePoint(parseInt(hex, 16));
    })
    .replace(/&#(\d+);/g, function (m, dec) {
      return String.fromCodePoint(parseInt(dec, 10));
    })
    .replace(/&(amp|lt|gt|quot|apos|nbsp|#39);/g, function (m) {
      return named[m] || m;
    });
}

export function hexEncode(text) {
  var bytes = new TextEncoder().encode(text);
  var out = [];
  for (var i = 0; i < bytes.length; i++) {
    out.push(bytes[i].toString(16).padStart(2, '0'));
  }
  return out.join('');
}

export function hexDecode(text) {
  var clean = String(text).replace(/[\s,]+/g, '').replace(/^0x/i, '');
  if (!/^[0-9a-fA-F]*$/.test(clean) || clean.length % 2 !== 0) {
    throw new Error('That is not valid hexadecimal — it must be pairs of hex digits.');
  }
  var bytes = new Uint8Array(clean.length / 2);
  for (var i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(clean.substr(i * 2, 2), 16);
  }
  return new TextDecoder().decode(bytes);
}

export function binaryEncode(text) {
  var bytes = new TextEncoder().encode(text);
  var out = [];
  for (var i = 0; i < bytes.length; i++) {
    out.push(bytes[i].toString(2).padStart(8, '0'));
  }
  return out.join(' ');
}

export function binaryDecode(text) {
  var groups = String(text).trim().split(/[\s,]+/).filter(Boolean);
  if (!groups.length || !groups.every(function (g) { return /^[01]{8}$/.test(g); })) {
    throw new Error('Binary must be 8-bit groups like 01001000 01101001.');
  }
  var bytes = new Uint8Array(groups.map(function (g) { return parseInt(g, 2); }));
  return new TextDecoder().decode(bytes);
}

export function unicodeEscape(text) {
  return [...text].map(function (ch) {
    var code = ch.codePointAt(0);
    if (code < 128 && ch !== '\\') return ch;
    if (code > 0xffff) return '\\u{' + code.toString(16) + '}';
    return '\\u' + code.toString(16).padStart(4, '0');
  }).join('');
}

export function unicodeUnescape(text) {
  return String(text)
    .replace(/\\u\{([0-9a-fA-F]{1,6})\}/g, function (m, hex) {
      return String.fromCodePoint(parseInt(hex, 16));
    })
    .replace(/\\u([0-9a-fA-F]{4})/g, function (m, hex) {
      return String.fromCharCode(parseInt(hex, 16));
    })
    .replace(/\\\\/g, '\\');
}

export function rot13(text) {
  return String(text).replace(/[A-Za-z]/g, function (ch) {
    var code = ch.charCodeAt(0);
    var base = code >= 97 ? 97 : 65;
    return String.fromCharCode(((code - base + 13) % 26) + base);
  });
}
