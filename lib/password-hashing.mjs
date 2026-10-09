// Server-only password hashing helper for future Node.js authentication routes.
// Never import this module from browser-delivered code.
//
// Uses Node's built-in scrypt (no external dependency), a unique random salt,
// a versioned encoded format, bounded parameters, and timing-safe comparison.

import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(scryptCallback);
const VERSION = 'scrypt';
const COST = 1 << 15;
const BLOCK_SIZE = 8;
const PARALLELIZATION = 1;
const SALT_BYTES = 16;
const KEY_BYTES = 64;
const MAXMEM = 64 * 1024 * 1024;

function validatePassword(password) {
  if (typeof password !== 'string' || password.length === 0) {
    throw new TypeError('Password must be a non-empty string.');
  }
}

async function derive(password, salt) {
  return scrypt(password, salt, KEY_BYTES, {
    N: COST,
    r: BLOCK_SIZE,
    p: PARALLELIZATION,
    maxmem: MAXMEM
  });
}

/**
 * Hash a password for storage on a trusted server only.
 * Store the complete returned string; never store the original password.
 */
export async function hashPassword(password) {
  validatePassword(password);
  const salt = randomBytes(SALT_BYTES);
  const key = await derive(password, salt);
  return [
    VERSION,
    COST,
    BLOCK_SIZE,
    PARALLELIZATION,
    salt.toString('base64url'),
    key.toString('base64url')
  ].join('$');
}

/**
 * Verify a password against a value returned by hashPassword().
 * Malformed/unsupported encodings return false instead of throwing.
 */
export async function verifyPassword(password, encodedHash) {
  if (typeof password !== 'string' || typeof encodedHash !== 'string') return false;

  const parts = encodedHash.split('$');
  if (parts.length !== 6 || parts[0] !== VERSION) return false;

  const [, costText, blockText, parallelText, saltText, keyText] = parts;
  // Accept only parameters this implementation is explicitly configured to use.
  // This prevents attacker-controlled stored parameters from causing huge work.
  if (costText !== String(COST) ||
      blockText !== String(BLOCK_SIZE) ||
      parallelText !== String(PARALLELIZATION)) return false;

  let salt;
  let expected;
  try {
    salt = Buffer.from(saltText, 'base64url');
    expected = Buffer.from(keyText, 'base64url');
  } catch {
    return false;
  }
  if (salt.length !== SALT_BYTES || expected.length !== KEY_BYTES) return false;

  try {
    const actual = await derive(password, salt);
    return timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}
