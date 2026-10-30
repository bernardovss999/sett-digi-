// Bug (30/10/2026, visto pelo dono no Firefox do Linux): depois da recriação da abertura, a home apareceu montada pela
// metade: o HTML novo com o kit.css da rodada anterior (os Reels espalhados em grade, sem o celular). O kit.css e o
// cenas.js eram pedidos como "?v=1" desde que nasceram, e o styles.css, o script.js e o telas.css mantinham o número
// antigo; o servidor manda guardar CSS e JS por um dia (vercel.json), então o navegador seguia com o arquivo velho.
// Regra: todo CSS e JS do próprio site é pedido com ?v= igual ao começo do sha256 do arquivo. Mudou o arquivo, muda o
// endereço, e o navegador busca o novo. Para atualizar: node scripts/versionar.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT, listPublishedPages, readSite, stripComments } from '../support/site.mjs';

const ARQUIVO = /<(?:link[^>]*\brel="stylesheet"[^>]*\bhref|script[^>]*\bsrc)="(\/[^"?#]+\.(?:css|js))(?:\?v=([^"#]*))?"/g;
const versao = (rel) => createHash('sha256').update(readFileSync(join(ROOT, rel))).digest('hex').slice(0, 10);

test('todo CSS e JS do site é pedido com a versão do conteúdo atual (o navegador nunca junta HTML novo com arquivo velho)', () => {
  const erros = [];
  for (const pagina of listPublishedPages()) {
    for (const [, caminho, v] of stripComments(readSite(pagina)).matchAll(ARQUIVO)) {
      const esperada = versao(caminho.slice(1));
      if (v !== esperada) erros.push(`${pagina}: ${caminho}?v=${v ?? '(sem versão)'} (o conteúdo atual é ${esperada})`);
    }
  }
  assert.deepEqual(erros, [], 'rode: node scripts/versionar.mjs');
});
