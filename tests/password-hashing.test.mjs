import { test } from 'node:test';
import assert from 'node:assert/strict';
import { hashPassword, verifyPassword } from '../lib/password-hashing.mjs';

test('hashPassword stores a salted scrypt hash, not the plaintext password', async () => {
  const password = 'correct horse battery staple 42!';
  const encoded = await hashPassword(password);
  const parts = encoded.split('$');

  assert.equal(parts.length, 6);
  assert.equal(parts[0], 'scrypt');
  assert.equal(parts[1], String(1 << 15));
  assert.notEqual(encoded, password);
  assert.equal(Buffer.from(parts[4], 'base64url').length, 16);
  assert.equal(Buffer.from(parts[5], 'base64url').length, 64);
});

test('identical passwords receive different random salts and hashes', async () => {
  const first = await hashPassword('same password');
  const second = await hashPassword('same password');

  assert.notEqual(first, second);
  assert.notEqual(first.split('$')[4], second.split('$')[4]);
});

test('verifyPassword accepts the correct password and rejects an incorrect one', async () => {
  const encoded = await hashPassword('correct password');
  assert.equal(await verifyPassword('correct password', encoded), true);
  assert.equal(await verifyPassword('incorrect password', encoded), false);
});

test('verifyPassword safely rejects malformed or unsupported hashes', async () => {
  for (const malformed of [
    '',
    'sha256$abc',
    'scrypt$999999999$8$1$bad$bad',
    'scrypt$32768$8$1$bad$bad',
    null,
    42
  ]) {
    assert.equal(await verifyPassword('password', malformed), false);
  }
});

test('hashPassword rejects missing or non-string passwords', async () => {
  await assert.rejects(() => hashPassword(''), /non-empty string/);
  await assert.rejects(() => hashPassword(null), /non-empty string/);
});
