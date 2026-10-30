// Bug (30/10/2026, relato de visitantes): no celular a rolagem vertical parava de tela em tela (scroll-snap-type: y
// mandatory + scroll-snap-stop: always). Funcionava, mas quem visitava achava o site travado. Regra: a rolagem
// vertical é livre; nenhuma folha publicada liga snap no eixo y nem prende a seção com snap-stop.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { ROOT } from '../support/site.mjs';

const folhas = (dir) => readdirSync(dir).flatMap((nome) => {
  const caminho = join(dir, nome);
  if (['node_modules', '.git', 'sett-digital-site', 'tests', 'docs'].includes(nome)) return [];
  return statSync(caminho).isDirectory() ? folhas(caminho) : nome.endsWith('.css') ? [caminho] : [];
});

test('nenhuma folha trava a rolagem vertical com scroll-snap', () => {
  for (const arquivo of folhas(ROOT)) {
    const css = readFileSync(arquivo, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
    const nome = relative(ROOT, arquivo);
    assert.doesNotMatch(css, /scroll-snap-type:\s*(y|block|both)\b/, `${nome} liga snap vertical`);
    assert.doesNotMatch(css, /scroll-snap-stop:\s*always/, `${nome} prende a rolagem com snap-stop`);
  }
});
