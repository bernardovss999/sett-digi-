// Leveza (30/10/2026): o site chegou a publicar 26 MB de vídeos, imagens 3D e scripts que nenhuma página usava mais
// (o esboço da abertura, a galeria antiga, o mascote e os agentes 3D). Todo arquivo publicado precisa ser citado por
// alguma página, folha ou script publicado; os poucos que o navegador ou o Google pedem sozinhos ficam na lista abaixo.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT, listPublishedFiles } from '../support/site.mjs';

const PEDIDOS_SOZINHOS = new Set(['robots.txt', 'sitemap.xml', 'llms.txt', 'vercel.json', 'favicon.png', 'apple-touch-icon.png']);
// montados no JS com o nome do estado: /img/agentes-2d/<agente>-<aberto|pisca|sorri>.svg (script.js, palco dos agentes)
const MONTADOS = /^img\/agentes-2d\/[a-z]+-(aberto|pisca|sorri)\.svg$/;
// os vídeos de cena montados no cenas.js pelo nome: data-reel="semana" ou data-clipes="alfinete alfinete-70"
// -> /video/cenas/<nome>.av1.mp4 e .mp4
const cenaPeloNome = (f, textos) => {
  const m = f.match(/^video\/cenas\/([a-z0-9-]+)(\.av1)?\.mp4$/);
  return !!m && new RegExp(`data-(reel|clipes)="([a-z0-9 -]* )?${m[1]}( [a-z0-9 -]*)?"`).test(textos);
};

test('todo arquivo publicado é usado por alguma página, folha ou script', () => {
  const todos = listPublishedFiles();
  const textos = todos.filter((f) => /\.(html|css|js|xml|txt|json)$/.test(f)).map((f) => readFileSync(join(ROOT, f), 'utf8')).join('\n');
  const sobra = todos.filter((f) => !f.endsWith('.html') && !PEDIDOS_SOZINHOS.has(f) && !MONTADOS.test(f) && !cenaPeloNome(f, textos) && !textos.includes('/' + f));
  assert.deepEqual(sobra, [], 'arquivo publicado sem uso: tire do site ou ponha em .vercelignore');
});
