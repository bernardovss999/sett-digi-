// Bug: o modo claro/escuro do celular podia alterar o site (navegadores que escurecem a página sozinhos); toda página declara color-scheme "only light".
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { listPublishedPages, readSite } from '../support/site.mjs';

test('toda página publicada declara <meta name="color-scheme" content="only light"> e o CSS repete', () => {
  for (const rel of listPublishedPages()) assert.match(readSite(rel), /<meta name="color-scheme" content="only light">/, rel);
  assert.match(readSite('styles.css'), /:root \{ color-scheme: only light;/);
  // o único bloco escuro permitido repete o claro (31/10/2026: o Samsung Internet só para de escurecer quando a página
  // tem um tema escuro próprio); nenhuma cor muda com o modo do aparelho
  const blocos = [...readSite('styles.css').matchAll(/@media \(prefers-color-scheme: dark\) \{([^@]*?\})\s*\}/g)].map((m) => m[1].trim());
  assert.deepEqual(blocos, [':root { color-scheme: only light; }']);
  assert.equal((readSite('styles.css').match(/prefers-color-scheme/g) || []).length, 1 + (readSite('styles.css').match(/\/\*[^*]*prefers-color-scheme/g) || []).length);
  assert.match(readSite('styles.css'), /forced-color-adjust: none/);
  for (const rel of listPublishedPages()) assert.match(readSite(rel), /<meta name="darkreader-lock">/, rel);
});

test('toda página usa a mesma meta de viewport (com viewport-fit=cover para as áreas seguras)', () => {
  for (const rel of listPublishedPages()) {
    assert.match(readSite(rel), /<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">/, rel);
  }
});
