/**
 * Server-only MFA primitives for ToolNova.
 *
 * This module is intentionally not imported by browser-delivered files.
 * Integrate it with a real server-side auth provider/session and persistent
 * storage before claiming MFA is enabled for user accounts.
 */
import { createHmac, randomBytes, createHash, timingSafeEqual } from 'node:crypto';

const BASE32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
const STEP_SECONDS = 30;
const DIGITS = 6;

function encodeBase32(buffer) {
  let bits = 0;
  let value = 0;
  let output = '';
  for (const byte of buffer) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      output += BASE32[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) output += BASE32[(value << (5 - bits)) & 31];
  return output;
}

function decodeBase32(input) {
  if (typeof input !== 'string' || input.length === 0) return null;
  const normalized = input.toUpperCase().replace(/[=\s-]/g, '');
  if (!normalized || /[^A-Z2-7]/.test(normalized)) return null;

  let bits = 0;
  let value = 0;
  const bytes = [];
  for (const char of normalized) {
    value = (value << 5) | BASE32.indexOf(char);
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  if (bits > 0 && (value & ((1 << bits) - 1)) !== 0) return null;
  return Buffer.from(bytes);
}

/** Create a 160-bit random secret for an authenticator app. Store only server-side. */
export function generateTotpSecret() {
  return encodeBase32(randomBytes(20));
}

/** Generate a six-digit RFC 6238 TOTP for internal testing or trusted server use. */
export function createTotpCode(secret, { now = Date.now() } = {}) {
  const key = decodeBase32(secret);
  if (!key || key.length < 10 || !Number.isFinite(now) || now < 0) {
    throw new TypeError('A valid Base32 secret and non-negative timestamp are required');
  }
  const counter = BigInt(Math.floor(now / 1000 / STEP_SECONDS));
  const message = Buffer.alloc(8);
  message.writeBigUInt64BE(counter);
  const digest = createHmac('sha1', key).update(message).digest();
  const offset = digest[digest.length - 1] & 0x0f;
  const binary = digest.readUInt32BE(offset) & 0x7fffffff;
  return String(binary % (10 ** DIGITS)).padStart(DIGITS, '0');
}

/** Verify a six-digit authenticator code with a small, bounded clock-drift window. */
export function verifyTotpCode(secret, code, { now = Date.now(), window = 1 } = {}) {
  if (typeof code !== 'string' || !/^\d{6}$/.test(code)) return false;
  if (!Number.isInteger(window) || window < 0 || window > 2) return false;
  const key = decodeBase32(secret);
  if (!key || key.length < 10 || !Number.isFinite(now) || now < 0) return false;

  const supplied = Buffer.from(code, 'ascii');
  const currentCounter = Math.floor(now / 1000 / STEP_SECONDS);
  for (let offset = -window; offset <= window; offset += 1) {
    const counter = currentCounter + offset;
    if (counter < 0) continue;
    const message = Buffer.alloc(8);
    message.writeBigUInt64BE(BigInt(counter));
    const digest = createHmac('sha1', key).update(message).digest();
    const truncationOffset = digest[digest.length - 1] & 0x0f;
    const binary = digest.readUInt32BE(truncationOffset) & 0x7fffffff;
    const candidate = Buffer.from(String(binary % (10 ** DIGITS)).padStart(DIGITS, '0'), 'ascii');
    if (timingSafeEqual(supplied, candidate)) return true;
  }
  return false;
}

/**
 * Create one-time recovery codes. Return these to the user once; persist only
 * hashes and atomically consume a matching hash after successful use.
 */
export function generateRecoveryCodes({ count = 10, bytesPerCode = 16 } = {}) {
  if (!Number.isInteger(count) || count < 1 || count > 20) {
    throw new RangeError('count must be an integer from 1 to 20');
  }
  if (!Number.isInteger(bytesPerCode) || bytesPerCode < 16 || bytesPerCode > 32) {
    throw new RangeError('bytesPerCode must be an integer from 16 to 32');
  }
  return Array.from({ length: count }, () => randomBytes(bytesPerCode).toString('hex'));
}

/** SHA-256 is suitable for high-entropy random recovery codes; never use for passwords. */
export function hashRecoveryCode(code) {
  if (typeof code !== 'string' || code.length < 32 || code.length > 128) {
    throw new TypeError('Recovery code must be a string of 32 to 128 characters');
  }
  return createHash('sha256').update(code, 'utf8').digest('hex');
}

/** Compare a submitted recovery code with its stored digest in constant time. */
export function verifyRecoveryCode(code, storedHash) {
  if (typeof code !== 'string' || typeof storedHash !== 'string' || !/^[a-f0-9]{64}$/i.test(storedHash)) {
    return false;
  }
  if (code.length < 32 || code.length > 128) return false;
  const supplied = Buffer.from(hashRecoveryCode(code), 'hex');
  const stored = Buffer.from(storedHash, 'hex');
  return timingSafeEqual(supplied, stored);
}
