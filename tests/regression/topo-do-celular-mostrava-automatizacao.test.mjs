// Bug: no topo do celular aparecia o atalho "Automatização" ao lado do menu; o topo deve ter só a marca e o menu.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { listPublishedPages, readSite } from '../support/site.mjs';

test('nenhuma página publicada tem o atalho do topo (.topo-ia)', () => {
  for (const rel of listPublishedPages()) assert.doesNotMatch(readSite(rel), /class="topo-ia"/, rel);
  assert.doesNotMatch(readSite('styles.css'), /\.topo-ia\b/);
});
