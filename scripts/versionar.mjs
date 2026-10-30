// Põe em cada <link rel="stylesheet"> e <script src> do próprio site a versão do conteúdo do arquivo (?v= com o começo
// do sha256). O servidor manda o navegador guardar CSS e JS por um dia; com a versão no endereço, um arquivo que mudou
// vira outro endereço e nunca se junta a um HTML de outra época (REG do teste tests/regression/css-e-js-velhos-no-cache).
// Uso: node scripts/versionar.mjs   (rode depois de mexer em qualquer CSS ou JS; o teste acusa se esquecer)
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT } from './site-config.mjs';
import { listPublishedPages } from '../tests/support/site.mjs';

const ARQUIVO = /(<(?:link[^>]*\brel="stylesheet"[^>]*\bhref|script[^>]*\bsrc)=")(\/[^"?#]+\.(?:css|js))(?:\?v=[^"#]*)?"/g;
const versoes = new Map();
const versao = (rel) => {
  if (!versoes.has(rel)) versoes.set(rel, createHash('sha256').update(readFileSync(join(ROOT, rel))).digest('hex').slice(0, 10));
  return versoes.get(rel);
};

let trocadas = 0;
for (const pagina of listPublishedPages()) {
  const antes = readFileSync(join(ROOT, pagina), 'utf8');
  const depois = antes.replace(ARQUIVO, (_, inicio, caminho) => `${inicio}${caminho}?v=${versao(caminho.slice(1))}"`);
  if (depois !== antes) { writeFileSync(join(ROOT, pagina), depois); trocadas += 1; }
}
console.log(`${trocadas} página(s) atualizada(s); ${versoes.size} arquivo(s) versionado(s).`);
