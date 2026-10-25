// Lacuna: nenhum teste exigia que tests/scripts/docs/.github/package*/artefatos antigos estivessem em .vercelignore (remover "docs" mantinha a suíte verde)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isPublished, vercelIgnoreEntries } from '../../scripts/site-config.mjs';

const NAO_PUBLICAR = [
  '.git', '.github', 'node_modules', 'tests', 'scripts', 'docs', 'package.json', 'package-lock.json',
  'AGENTS.md', 'CLAUDE.md', 'README.md', '.vercelignore',
  'sett-digital-site', 'sett-digital-site.zip', 'sett-digital-preview.png', 'sett-digital-mobile-preview.png',
];

const PUBLICAR = [
  'index.html', 'script.js', 'styles.css', 'vercel.json', 'sitemap.xml', 'robots.txt', 'llms.txt', 'sett-agenda.html',
  'favicon.png', 'apple-touch-icon.png', 'fonts/dm-sans.woff2', 'fonts/space-grotesk.woff2',
  'portfolio/index.html', 'portfolio/portfolio.css', 'portfolio/img/compartilhar.jpg',
  'agentes-de-ia-para-empresas/index.html', 'agentes-de-ia-para-empresas/agentes.css', 'agentes-de-ia-para-empresas/agentes.js',
];

test('.vercelignore exclui código, testes, docs, configuração interna e artefatos antigos', () => {
  const naoExcluidos = NAO_PUBLICAR.filter((rel) => isPublished(rel) || isPublished(rel + '/x'));
  assert.deepEqual(naoExcluidos, [], 'faltam em .vercelignore');
});

test('.vercelignore não exclui nada que o site publicado usa', () => {
  assert.deepEqual(PUBLICAR.filter((rel) => !isPublished(rel)), []);
});

test('.vercelignore não contém curingas nem barras que mudariam o casamento na Vercel', () => {
  // Sem "/" no meio: na sintaxe estilo .gitignore isso ancora o padrão na raiz e a suíte local deixaria de espelhar a Vercel.
  assert.deepEqual(vercelIgnoreEntries().filter((e) => /[*?!\[]/.test(e)), []);
});
