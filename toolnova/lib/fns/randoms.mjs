// Pure-ish random generators: every function takes an injectable rng so it
// can be unit-tested deterministically. In generated client code, the same
// functions run with Math.random (or crypto for security tools).

export function mulberry32(seed) {
  var a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    var t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function randInt(min, max, rng) {
  var r = rng || Math.random;
  var lo = Math.ceil(Math.min(min, max));
  var hi = Math.floor(Math.max(min, max));
  return lo + Math.floor(r() * (hi - lo + 1));
}

export function rollDice(sides, count, rng) {
  var results = [];
  for (var i = 0; i < count; i++) results.push(randInt(1, sides, rng));
  return results;
}

export function flipCoin(rng) {
  var r = rng || Math.random;
  return r() < 0.5 ? 'Heads' : 'Tails';
}

export function yesNo(rng) {
  var r = rng || Math.random;
  return r() < 0.5 ? 'Yes' : 'No';
}

export function randomHexColor(rng) {
  var r = rng || Math.random;
  var hex = '';
  for (var i = 0; i < 6; i++) {
    hex += '0123456789abcdef'[Math.floor(r() * 16)];
  }
  return '#' + hex.toUpperCase();
}

export function randomLetter(rng) {
  var r = rng || Math.random;
  return 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(r() * 26)];
}

export function randomDate(startIso, endIso, rng) {
  var r = rng || Math.random;
  var start = Date.parse(startIso + 'T00:00:00Z');
  var end = Date.parse(endIso + 'T00:00:00Z');
  if (!isFinite(start) || !isFinite(end)) throw new Error('Invalid date range');
  if (end < start) { var t = start; start = end; end = t; }
  var ms = start + r() * (end - start);
  return new Date(ms).toISOString().slice(0, 10);
}
