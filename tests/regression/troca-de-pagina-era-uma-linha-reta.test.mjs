// Bug (30/10/2026, visto pelo dono no computador e no celular): ao trocar de página, uma linha reta menta atravessava a
// tela com o Ponto na ponta e a página nova só aparecia recortada atrás dela. Ficava esquisito: o Ponto não fazia nada.
// Regra: sem linha. O Ponto (só o tamanho dele, não a largura da tela) agarra a borda da página nova e a arrasta: a
// página entra deslizando (translate, não recorte) e o Ponto anda com a borda, nas mesmas marcas de tempo e duração.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readSite, stripComments } from '../support/site.mjs';

const css = stripComments(readSite('kit.css'));
const regra = (seletor) => {
  const i = css.indexOf(`${seletor} {`);
  assert.ok(i >= 0, `falta ${seletor}`);
  return css.slice(i, css.indexOf('}', i));
};
const marcas = (nome) => {
  const i = css.indexOf(`@keyframes ${nome} {`);
  assert.ok(i >= 0, `falta @keyframes ${nome}`);
  const corpo = css.slice(i, css.indexOf('\n}', i));
  return [...corpo.matchAll(/(?:^|\n)\s*([\d%, ]+)\s*\{/g)].flatMap(([, m]) => m.split(',').map(s => s.trim()));
};

test('a troca de página não desenha linha: o elemento da transição tem o tamanho do Ponto', () => {
  assert.doesNotMatch(css, /\.trilha-transicao::(?:before|after)/, 'voltou a linha reta');
  const base = regra('.trilha-transicao');
  assert.doesNotMatch(base, /width:\s*100vw/, 'o elemento da transição voltou a ocupar a largura da tela');
  assert.match(base, /width:\s*var\(--ponto-puxa\)/);
});

test('a página nova entra arrastada pelo Ponto (desliza, não é recortada) e os dois andam juntos', () => {
  const pagina = regra('::view-transition-new(root)');
  const ponto = regra('::view-transition-new(trilha)');
  assert.match(pagina, /animation:\s*pagina-puxada var\(--troca\)/);
  assert.match(ponto, /animation:\s*ponto-puxa var\(--troca\)/);
  assert.doesNotMatch(css.slice(css.indexOf('@keyframes pagina-puxada')), /^[^@]*clip-path/, 'a página voltou a ser recortada');
  assert.match(css, /@keyframes pagina-puxada \{\s*0%, 8% \{ translate: -100vw 0;/);
  const p = marcas('pagina-puxada').filter(m => m !== '0%');
  const b = marcas('ponto-puxa').filter(m => m !== '0%');
  assert.deepEqual(p, b, 'o Ponto e a borda da página têm marcas de tempo diferentes');
});
