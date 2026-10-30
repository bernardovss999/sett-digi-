// Bug: no computador o fundo trocava no meio da tela (sem divisão entre seções), o topo era translúcido e a entrelinha dos títulos encostava o "g" no "i" da linha de baixo.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { startSite } from '../support/servidor.mjs';

let site;
let browser;
before(async () => { site = await startSite(); browser = await chromium.launch(); });
after(async () => { await browser?.close(); await site?.close(); });

test('home em 1440px: seções têm fundo próprio, topo opaco e títulos com entrelinha ≥ 1', async () => {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  const page = await context.newPage();
  await page.goto(site.origin + '/', { waitUntil: 'load' });
  const r = await page.evaluate(() => {
    const cor = (el) => getComputedStyle(el).backgroundColor;
    const lh = (el) => parseFloat(getComputedStyle(el).lineHeight) / parseFloat(getComputedStyle(el).fontSize);
    return {
      campos: document.documentElement.classList.contains('campos'),
      // 30/10/2026: o portfólio da home virou a cena "Sites que facilitam o contato" (#portfolio, campo menta)
      galeria: cor(document.querySelector('#portfolio')),
      vizinhas: [...document.querySelectorAll('main > section')].map(cor),
      hero: cor(document.querySelector('.hero')),
      topo: cor(document.querySelector('.site-header')),
      linhaTitulo: lh(document.querySelector('.hero-title, .section-title')),
    };
  });
  await context.close();
  assert.equal(r.campos, false, 'o body não deve trocar de cor no meio da tela');
  // 30/10/2026 (pedido do dono): só o azul profundo e o claro como fundo de seção; o portfólio (azul) não encosta na abertura,
  // então a garantia que vale é a de baixo: duas vizinhas nunca têm o mesmo fundo
  // cada seção ocupa um campo de cor do kit: duas vizinhas nunca têm o mesmo fundo
  r.vizinhas.forEach((c, i) => { if (i) assert.notEqual(c, r.vizinhas[i - 1], `seções ${i} e ${i + 1} com o mesmo fundo`); });
  assert.match(r.topo, /^rgb\(/, `topo translúcido: ${r.topo}`);
  assert.ok(r.linhaTitulo >= 1, `entrelinha ${r.linhaTitulo}`);
});
