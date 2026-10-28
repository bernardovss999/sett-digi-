// Bug: a constelação de "O que fazemos" ficava menor e fora do eixo das peças das outras páginas (ficha do Google, celular de Sites), com o texto das frentes quebrando torto e os fios soltos.
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
  test(`${w}x${h}: constelação no mesmo eixo da ficha do Google e do celular de Sites`, async () => {
    const context = await browser.newContext({ viewport: { width: w, height: h }, reducedMotion: 'reduce' });
    const page = await context.newPage();
    const c = await centro(page, '/o-que-fazemos/', '.constelacao');
    const g = await centro(page, '/gestao-google-meu-negocio/', '.perfil');
    const s = await centro(page, '/criacao-de-sites/', '.aparelho');
    await context.close();
    assert.ok(Math.abs(c.x - g.x) <= 2 && Math.abs(c.x - s.x) <= 2, `centro x: constelação ${c.x}, ficha ${g.x}, celular ${s.x}`);
    assert.ok(Math.abs(c.y - g.y) <= 2 && Math.abs(c.y - s.y) <= 2, `centro y: constelação ${c.y}, ficha ${g.y}, celular ${s.y}`);
  });
}

for (const [w, h] of [[1318, 656], [1440, 900], [1920, 1080], [1024, 768], [390, 844], [360, 640], [320, 568]]) {
  test(`${w}x${h}: frentes da constelação sem texto estourando e fios encostando nelas`, async () => {
    const context = await browser.newContext({ viewport: { width: w, height: h }, reducedMotion: 'reduce' });
    const page = await context.newPage();
    await page.goto(site.origin + '/o-que-fazemos/', { waitUntil: 'load' });
    const r = await page.evaluate(() => {
      const estouro = [...document.querySelectorAll('.constelacao li')]
        .filter((li) => li.scrollHeight > li.clientHeight + 1 || li.scrollWidth > li.clientWidth + 1)
        .map((li) => li.querySelector('a').textContent);
      // cada fio termina na borda (de cima ou de baixo) da frente do seu canto
      const svg = document.querySelector('.constelacao-fios');
      const m = svg.getScreenCTM();
      const soltos = [...svg.querySelectorAll('path')].filter((p, i) => {
        const fim = p.getPointAtLength(p.getTotalLength());
        const pt = new DOMPoint(fim.x, fim.y).matrixTransform(m);
        const b = document.querySelectorAll('.constelacao li')[i].getBoundingClientRect();
        const naBorda = Math.min(Math.abs(pt.y - b.top), Math.abs(pt.y - b.bottom)) <= 2;
        return !(naBorda && pt.x > b.left && pt.x < b.right);
      }).length;
      return { estouro, soltos };
    });
    await context.close();
    assert.deepEqual(r.estouro, []);
    assert.equal(r.soltos, 0, 'fio que não encosta na frente');
  });
}
