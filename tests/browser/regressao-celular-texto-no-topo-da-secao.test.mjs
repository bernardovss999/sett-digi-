// Bug: no celular o conteúdo das seções ficava centralizado na altura (o título aparecia no meio da tela, com um vão em cima). O título de toda seção começa no topo, à mesma distância da abertura.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { startSite } from '../support/servidor.mjs';

const ROTAS = ['/', '/portfolio/', '/criacao-de-sites/', '/gestao-google-meu-negocio/', '/agentes-de-ia-para-empresas/', '/o-que-fazemos/', '/sett-agenda.html'];
let site;
let browser;
before(async () => { site = await startSite(); browser = await chromium.launch(); });
after(async () => { await browser?.close(); await site?.close(); });

for (const [w, h] of [[360, 640], [375, 667], [390, 844], [412, 915], [430, 932]]) {
  test(`${w}x${h}: o título de cada seção começa no topo, à mesma distância em todas`, async () => {
    const context = await browser.newContext({ viewport: { width: w, height: h }, isMobile: true, hasTouch: true, reducedMotion: 'reduce' });
    const page = await context.newPage();
    const falhas = [];
    for (const rota of ROTAS) {
      await page.goto(site.origin + rota, { waitUntil: 'load' });
      const r = await page.evaluate(() => [...document.querySelectorAll('main > section')].map((s) => {
        const t = s.querySelector('h1, h2');
        const rotulo = s.querySelector(':scope > .section-index:not(:empty), .hero-copy > .eyebrow:first-child');
        const primeiro = rotulo && rotulo.getClientRects().length ? rotulo : t;
        return [s.id || s.className.split(' ')[0], Math.round(primeiro.getBoundingClientRect().top - s.getBoundingClientRect().top)];
      }));
      const base = Math.min(...r.map(([, d]) => d));
      for (const [nome, d] of r) if (d > base + 24) falhas.push(`${rota} ${nome}: título a ${d}px do topo (as outras começam a ~${base}px)`);
    }
    await context.close();
    assert.deepEqual(falhas, []);
  });
}
