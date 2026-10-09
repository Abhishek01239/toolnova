import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const imageTools = [
  'image-resizer.js',
  'image-compressor.js',
  'images-to-pdf.js',
  'background-remover.js',
  'passport-photo-maker.js'
];
const pdfTools = ['pdf-merger.js', 'split-pdf.js'];

test('image tools enforce a size ceiling and an extension/MIME allowlist before processing', async () => {
  for (const name of imageTools) {
    const source = await readFile(new URL('../tools/' + name, import.meta.url), 'utf8');
    assert.match(source, /MAX_IMAGE_BYTES\s*=\s*20\s*\*\s*1024\s*\*\s*1024/, name + ': missing 20 MiB limit');
    assert.match(source, /f\.size\s*>\s*MAX_IMAGE_BYTES/, name + ': missing size rejection');
    assert.match(source, /var allowed\s*=\s*\{/, name + ': missing image extension/MIME allowlist');
    assert.match(source, /!type\s*\|\|\s*type\s*===\s*allowed\[ext\]/, name + ': does not check MIME/extension consistency');
  }
});

test('PDF tools reject empty, oversized, or non-PDF-named files before parsing', async () => {
  for (const name of pdfTools) {
    const source = await readFile(new URL('../tools/' + name, import.meta.url), 'utf8');
    assert.match(source, /MAX_PDF_BYTES\s*=\s*50\s*\*\s*1024\s*\*\s*1024/, name + ': missing 50 MiB limit');
    assert.match(source, /!\/\\\.pdf\$\/i\.test\(f\.name\)/, name + ': missing .pdf extension check');
    assert.match(source, /f\.size\s*<=\s*0/, name + ': missing empty-file rejection');
    assert.match(source, /f\.size\s*>\s*MAX_PDF_BYTES/, name + ': missing size rejection');
  }
});
