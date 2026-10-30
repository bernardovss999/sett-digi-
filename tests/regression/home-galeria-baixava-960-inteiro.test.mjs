// Bug: os cartões da home baixavam as telas inteiras de 960x1800 (~605 KiB) embora mostrem só o topo recortado.
// Mudou de propósito em 30/10/2026 (roteiro de 29/10/2026, tela 3): a home mostra a prévia EM USO (a captura rola até
// o botão de contato), então precisa da captura inteira — mas de UM caso por vez, só quando a seção chega
// (loading="lazy"), nas versões leves (-960 e -390) e nunca nas de 1440. O peso continua vigiado.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';

test('a cena das prévias da home baixa uma prévia por vez, leve e só quando a seção chega', () => {
  const html = readFileSync('index.html', 'utf8');
  const imgs = [...html.matchAll(/<img [^>]*src="(\/portfolio\/img\/[^"?]+)[^"]*"[^>]*>/g)];
  assert.equal(imgs.length, 2, 'só as duas telas (computador e celular) do caso escolhido');
  for (const [tag, src] of imgs) {
    assert.match(src, /-inicio-(desktop-960|celular-390)\.webp$/, src);
    assert.match(tag, /loading="lazy"/, `${src} sem loading="lazy"`);
    assert.ok(statSync('.' + src).size <= 200 * 1024, `${src} passa de 200 KiB`);
  }
  // as outras prévias só são pedidas quando o visitante escolhe o caso (cenas.js monta o endereço na hora)
  const js = readFileSync('cenas.js', 'utf8');
  assert.match(js, /-inicio-desktop-960\.webp/);
  assert.doesNotMatch(js, /new Image\(\)[^;]*portfolio/);
  assert.doesNotMatch(html + js, /-inicio-desktop\.webp/, 'a captura de 1440 não entra na home');
});
