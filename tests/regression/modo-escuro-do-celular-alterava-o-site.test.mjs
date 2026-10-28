// Bug: o modo claro/escuro do celular podia alterar o site (navegadores que escurecem a página sozinhos); toda página declara color-scheme "only light".
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { listPublishedPages, readSite } from '../support/site.mjs';

test('toda página publicada declara <meta name="color-scheme" content="only light"> e o CSS repete', () => {
  for (const rel of listPublishedPages()) assert.match(readSite(rel), /<meta name="color-scheme" content="only light">/, rel);
  assert.match(readSite('styles.css'), /:root \{ color-scheme: only light;/);
  assert.doesNotMatch(readSite('styles.css'), /prefers-color-scheme/);
});

test('toda página usa a mesma meta de viewport (com viewport-fit=cover para as áreas seguras)', () => {
  for (const rel of listPublishedPages()) {
    assert.match(readSite(rel), /<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">/, rel);
  }
});
