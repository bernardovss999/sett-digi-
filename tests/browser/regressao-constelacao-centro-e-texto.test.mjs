// Bug: a peça de "O que fazemos" ficava menor e fora do eixo das peças das outras páginas (ficha do Google, celular de Sites), com o texto das frentes quebrando torto. Hoje a peça é o palco dos agentes (28/10/2026).
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
    const c = await centro(page, '/o-que-fazemos/', '.elenco');
    const g = await centro(page, '/gestao-google-meu-negocio/', '.perfil');
    const s = await centro(page, '/criacao-de-sites/', '.aparelho');
    await context.close();
    assert.ok(Math.abs(c.x - g.x) <= 2 && Math.abs(c.x - s.x) <= 2, `centro x: visor ${c.x}, ficha ${g.x}, celular ${s.x}`);
    assert.ok(Math.abs(c.y - g.y) <= 2 && Math.abs(c.y - s.y) <= 2, `centro y: visor ${c.y}, ficha ${g.y}, celular ${s.y}`);
  });
}
