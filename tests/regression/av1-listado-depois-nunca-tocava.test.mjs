// Bug (30/10/2026, achado na otimização dos vídeos): cada cena tinha um arquivo AV1 (mais leve e mais nítido) e um
// H.264, mas o H.264 vinha primeiro no <video>. O navegador toca a primeira fonte que consegue, e todo navegador toca
// H.264: o AV1 nunca era baixado. Regra: o AV1 vem antes; o H.264 fica de reserva (iPhones sem AV1). E as duas
// versões de toda cena citada existem em video/cenas/ (scripts/gerar_cenas.sh gera as duas e o pôster).
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT, listPublishedPages, readSite, stripComments } from '../support/site.mjs';

const fontes = (texto) => [...texto.matchAll(/<source[^>]*\b(?:data-)?src="([^"]+)"/g)].map((m) => m[1]);

test('em todo <video> das páginas, o AV1 vem antes do H.264 e as duas versões existem', () => {
  let videos = 0;
  for (const pagina of listPublishedPages()) {
    for (const [video] of stripComments(readSite(pagina)).matchAll(/<video\b[\s\S]*?<\/video>/g)) {
      const lista = fontes(video);
      if (!lista.length) continue;
      videos += 1;
      assert.match(lista[0], /\.av1\.mp4$/, `${pagina}: a primeira fonte não é o AV1 (${lista.join(', ')})`);
      for (const f of lista) assert.ok(existsSync(join(ROOT, f)), `${pagina}: falta ${f}`);
      const cena = lista[0].replace(/\.av1\.mp4$/, '');
      assert.ok(lista.includes(`${cena}.mp4`), `${pagina}: falta a reserva H.264 de ${cena}`);
    }
  }
  assert.ok(videos > 0);
});

test('os vídeos montados pelo cenas.js também oferecem o AV1 primeiro', () => {
  const js = readFileSync(join(ROOT, 'cenas.js'), 'utf8');
  const montagens = [...js.matchAll(/innerHTML = `(<source[^`]*)`/g)].map((m) => fontes(m[1]));
  assert.ok(montagens.length > 0);
  for (const lista of montagens) assert.match(lista[0], /\.av1\.mp4$/, `cenas.js: ${lista.join(', ')}`);
});
