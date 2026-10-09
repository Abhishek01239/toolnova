import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

test('password security guidance requires adaptive password hashing on a trusted server', async () => {
  const readme = await readFile(path.join(ROOT, 'README.md'), 'utf8');
  const section = readme.split('## Security: Password hashing')[1]?.split(/^## /m)[0] || '';
  assert.match(section, /Argon2id/i);
  assert.match(section, /scrypt/i);
  assert.match(section, /unique random salt/i);
  assert.match(section, /Never store plaintext passwords/i);
  assert.match(section, /server-side/i);
  assert.match(section, /constant-time/i);
});

test('current static architecture has no password-authentication endpoints or password storage', async () => {
  for (const relativePath of ['api', 'pages/api', 'app/api', 'src/app/api', 'src/pages/api', 'functions']) {
    await assert.rejects(
      import('node:fs/promises').then(({ access }) => access(path.join(ROOT, relativePath))),
      { code: 'ENOENT' },
      'Unexpected server endpoint directory exists: ' + relativePath
    );
  }

  const pkg = JSON.parse(await readFile(path.join(ROOT, 'package.json'), 'utf8'));
  const dependencies = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
  assert.equal(Object.keys(dependencies).length, 0,
    'Review password hashing/authentication implementation and add implementation-level tests before adding dependencies.');
});
