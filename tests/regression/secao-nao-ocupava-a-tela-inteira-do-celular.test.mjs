// Bug: no iPhone a seção media a tela com a barra do Safari aberta (svh) e a próxima seção aparecia por baixo da barra; cada seção tem a altura da tela inteira (lvh).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readSite } from '../support/site.mjs';

test('as seções usam min-height: calc(100lvh - var(--topo)) como última regra de altura', () => {
  const css = readSite('styles.css');
  const regra = ':root main > section.section-grid, :root main > section.hero, :root main > section.ab, :root main > section.port-hero { min-height: calc(100lvh - var(--topo)); }';
  assert.ok(css.includes(regra), 'regra de lvh sumiu');
  // nada depois dela volta a medir a seção por svh/vh
  const depois = css.slice(css.lastIndexOf(regra) + regra.length);
  assert.doesNotMatch(depois, /main > section[^{]*\{[^}]*min-height: calc\(100s?vh/);
});
