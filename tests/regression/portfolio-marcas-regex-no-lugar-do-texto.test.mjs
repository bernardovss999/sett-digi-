// Bug: a troca de textos deixou "\1" e "\2" literais no portfólio, no lugar do lead, do título e da introdução das prévias.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { listPublishedPages, readSite } from '../support/site.mjs';

test('nenhuma página publicada tem marca de grupo de regex ("\\1", "\\2") no lugar do texto', () => {
  const sujas = listPublishedPages().filter((rel) => /\\[1-9]/.test(readSite(rel)));
  assert.deepEqual(sujas, []);
});

test('portfólio: a abertura tem o lead e as prévias têm título e introdução', () => {
  const html = readSite('portfolio/index.html');
  assert.match(html, /<p class="hero-lead[^"]*"[^>]*>Prévias independentes mostram/);
  assert.match(html, /<h2 id="previas-title"[^>]*>Cada negócio/);
  assert.match(html, /<p class="section-text[^"]*">Estas demonstrações são projetos conceituais/);
});
