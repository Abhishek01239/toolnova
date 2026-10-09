import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  createTotpCode,
  generateRecoveryCodes,
  generateTotpSecret,
  hashRecoveryCode,
  verifyRecoveryCode,
  verifyTotpCode
} from '../lib/mfa.mjs';

test('TOTP implementation matches the RFC 6238 SHA-1 test vector (six-digit truncation)', () => {
  const secret = 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ';
  assert.equal(createTotpCode(secret, { now: 59_000 }), '287082');
  assert.equal(verifyTotpCode(secret, '287082', { now: 59_000, window: 0 }), true);
  assert.equal(verifyTotpCode(secret, '287083', { now: 59_000, window: 0 }), false);
});

test('TOTP secret generation returns a random Base32 secret suitable for authenticator apps', () => {
  const first = generateTotpSecret();
  const second = generateTotpSecret();
  assert.match(first, /^[A-Z2-7]+$/);
  assert.notEqual(first, second);
  assert.equal(first.length, 32);
});

test('TOTP verification rejects malformed codes, secrets, and unbounded windows', () => {
  assert.equal(verifyTotpCode('not-a-secret', '123456'), false);
  assert.equal(verifyTotpCode('GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ', '12345'), false);
  assert.equal(verifyTotpCode('GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ', 'abcdef'), false);
  assert.equal(verifyTotpCode('GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ', '123456', { window: 99 }), false);
  assert.throws(() => createTotpCode('bad', { now: 59_000 }), /valid Base32 secret/);
});

test('recovery codes are unique high-entropy values and only hashes need persistent storage', () => {
  const codes = generateRecoveryCodes();
  assert.equal(codes.length, 10);
  assert.equal(new Set(codes).size, codes.length);
  for (const code of codes) {
    const digest = hashRecoveryCode(code);
    assert.match(digest, /^[a-f0-9]{64}$/);
    assert.equal(verifyRecoveryCode(code, digest), true);
    assert.equal(verifyRecoveryCode(code + 'x', digest), false);
  }
});

test('recovery code generation enforces safe bounds and verification rejects malformed hashes', () => {
  assert.throws(() => generateRecoveryCodes({ count: 0 }), /count must be/);
  assert.throws(() => generateRecoveryCodes({ bytesPerCode: 8 }), /bytesPerCode must be/);
  assert.throws(() => hashRecoveryCode('short'), /Recovery code must be/);
  assert.equal(verifyRecoveryCode('a'.repeat(32), 'not-a-hash'), false);
});
