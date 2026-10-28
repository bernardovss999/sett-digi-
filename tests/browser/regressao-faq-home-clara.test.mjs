// Pedido de 28/10/2026: a seção de dúvidas da home passou a ter fundo claro. Bug evitado: a pergunta em destaque (hover/toque) ficava ciano claro sobre o fundo claro, quase invisível.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { startSite } from '../support/servidor.mjs';

let site;
let browser;
before(async () => { site = await startSite(); browser = await chromium.launch(); });
after(async () => { await browser?.close(); await site?.close(); });

test('home: dúvidas com fundo claro e pergunta legível ao passar o mouse', async () => {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  const page = await context.newPage();
  await page.goto(site.origin + '/', { waitUntil: 'load' });
  await page.locator('#faq summary').first().scrollIntoViewIfNeeded();
  await page.locator('#faq summary').first().hover();
  const r = await page.evaluate(() => {
    const lum = (c) => { const m = c.match(/[\d.]+/g).map(Number); const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(m[0]) + 0.7152 * f(m[1]) + 0.0722 * f(m[2]); };
    const fundo = getComputedStyle(document.querySelector('#faq')).backgroundColor;
    const cor = getComputedStyle(document.querySelector('#faq summary')).color;
    const a = lum(cor); const b = lum(fundo);
    return { fundo, contraste: (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05) };
  });
  await context.close();
  assert.equal(r.fundo, 'rgb(240, 242, 237)');
  assert.ok(r.contraste >= 3, `contraste ${r.contraste.toFixed(2)}`);
});
