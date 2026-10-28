// Bug: a peça de "O que fazemos" ficava menor e fora do eixo das peças das outras páginas (ficha do Google, celular de Sites), com o texto das frentes quebrando torto. Hoje a peça é o visor (28/10/2026): as leituras ficam dentro dos cantos do enquadramento.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { startSite } from '../support/servidor.mjs';

let site;
let browser;
before(async () => { site = await startSite(); browser = await chromium.launch(); });
after(async () => { await browser?.close(); await site?.close(); });

const centro = async (page, rota, seletor) => {
  await page.goto(site.origin + rota, { waitUntil: 'load' });
  return page.evaluate((s) => {
    const b = document.querySelector(s).getBoundingClientRect();
    return { x: (b.left + b.right) / 2, y: (b.top + b.bottom) / 2, l: b.left, r: b.right };
  }, seletor);
};

for (const [w, h] of [[1318, 656], [1366, 768], [1440, 900], [1920, 1080], [2560, 1440], [1024, 768]]) {
  test(`${w}x${h}: visor no mesmo eixo da ficha do Google e do celular de Sites`, async () => {
    const context = await browser.newContext({ viewport: { width: w, height: h }, reducedMotion: 'reduce' });
    const page = await context.newPage();
    const c = await centro(page, '/o-que-fazemos/', '.foco');
    const g = await centro(page, '/gestao-google-meu-negocio/', '.perfil');
    const s = await centro(page, '/criacao-de-sites/', '.aparelho');
    await context.close();
    assert.ok(Math.abs(c.x - g.x) <= 2 && Math.abs(c.x - s.x) <= 2, `centro x: visor ${c.x}, ficha ${g.x}, celular ${s.x}`);
    assert.ok(Math.abs(c.y - g.y) <= 2 && Math.abs(c.y - s.y) <= 2, `centro y: visor ${c.y}, ficha ${g.y}, celular ${s.y}`);
  });
}

for (const [w, h] of [[1318, 656], [1440, 900], [1920, 1080], [1024, 768], [390, 844], [360, 640], [320, 568]]) {
  test(`${w}x${h}: leituras do visor sem texto estourando e dentro dos cantos do enquadramento`, async () => {
    const context = await browser.newContext({ viewport: { width: w, height: h }, reducedMotion: 'reduce' });
    const page = await context.newPage();
    await page.goto(site.origin + '/o-que-fazemos/', { waitUntil: 'load' });
    const r = await page.evaluate(() => {
      const q = document.querySelector('.foco-cantos').getBoundingClientRect();
      const lis = [...document.querySelectorAll('.foco-frentes li')];
      const estouro = lis.filter((li) => li.scrollWidth > li.clientWidth + 1).map((li) => li.querySelector('a').textContent);
      const fora = lis.filter((li) => { const b = li.getBoundingClientRect(); return b.left < q.left || b.right > q.right || b.top < q.top || b.bottom > q.bottom; }).map((li) => li.querySelector('a').textContent);
      const centro = document.querySelector('.foco-centro').getBoundingClientRect();
      const foco = document.querySelector('.foco').getBoundingClientRect();
      return { estouro, fora, centrado: Math.abs((centro.left + centro.right) / 2 - (foco.left + foco.right) / 2) <= 2 && Math.abs((centro.top + centro.bottom) / 2 - (foco.top + foco.bottom) / 2) <= 2 };
    });
    await context.close();
    assert.deepEqual(r.estouro, []);
    assert.deepEqual(r.fora, [], 'leitura fora do enquadramento');
    assert.equal(r.centrado, true, 'o negócio saiu do centro do visor');
  });
}
