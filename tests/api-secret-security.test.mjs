import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdir, readFile, access } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

async function exists(relativePath) {
  try {
    await access(path.join(ROOT, relativePath));
    return true;
  } catch {
    return false;
  }
}

async function filesUnder(relativePath) {
  const absolute = path.join(ROOT, relativePath);
  if (!(await exists(relativePath))) return [];
  const entries = await readdir(absolute, { withFileTypes: true });
  const found = [];
  for (const entry of entries) {
    const child = path.join(relativePath, entry.name);
    if (entry.isDirectory()) found.push(...await filesUnder(child));
    else if (entry.isFile() && /\.(?:js|mjs|cjs|html|json|css|ts|tsx|jsx)$/.test(entry.name)) found.push(child);
  }
  return found;
}

test('browser-delivered source contains no common provider API secret formats', async () => {
  const browserRoots = [
    'public',
    'tools',
    'components',
    'pages',
    'scripts/generators/custom',
    'dist'
  ];
  const files = (await Promise.all(browserRoots.map(filesUnder))).flat();
  const secretPatterns = [
    { name: 'OpenAI-style secret key', regex: /\bsk-[A-Za-z0-9_-]{20,}\b/ },
    { name: 'Groq API key', regex: /\bgsk_[A-Za-z0-9_-]{20,}\b/ },
    { name: 'Hugging Face token', regex: /\bhf_[A-Za-z0-9]{20,}\b/ },
    { name: 'Google API key', regex: /\bAIza[0-9A-Za-z_-]{30,}\b/ },
    { name: 'AWS access key ID', regex: /\bAKIA[0-9A-Z]{16}\b/ }
  ];
  const findings = [];
  for (const file of files) {
    const source = await readFile(path.join(ROOT, file), 'utf8');
    for (const pattern of secretPatterns) {
      if (pattern.regex.test(source)) findings.push(file + ': ' + pattern.name);
    }
    assert.doesNotMatch(source, /\bprocess\.env\b/,
      file + ' is browser-delivered code and must not read server environment variables.');
  }
  assert.deepEqual(findings, [],
    'Potential API secrets found in browser-delivered files: ' + findings.join('; '));
});

test('the optional AI pipeline reads provider keys from the Node server/CI environment', async () => {
  const aiSource = await readFile(path.join(ROOT, 'lib/ai.mjs'), 'utf8');
  const readme = await readFile(path.join(ROOT, 'README.md'), 'utf8');
  assert.match(aiSource, /process\.env\.GROQ_API_KEY/);
  assert.match(aiSource, /process\.env\.OPENCODE_API_KEY/);
  assert.match(readme, /GitHub.*Secrets and variables.*Actions/i);
  assert.match(readme, /API secrets.*server-side/i);
});

test('environment files are ignored by Git', async () => {
  const gitignore = await readFile(path.join(ROOT, '.gitignore'), 'utf8');
  assert.match(gitignore, /^\.env\s*$/m);
  assert.match(gitignore, /^\.env\.\*\s*$/m);
});
