// Bug: cada página começava o título a uma distância diferente do menu (de 24 a 295px), porque a abertura centralizava o conteúdo na vertical. Padrão: a distância da página Sites, igual em todas.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { startSite } from '../support/servidor.mjs';

const ROTAS = ['/', '/agentes-de-ia-para-empresas/', '/gestao-google-meu-negocio/', '/criacao-de-sites/', '/portfolio/', '/o-que-fazemos/', '/sett-agenda.html'];
let site;
let browser;
before(async () => { site = await startSite(); browser = await chromium.launch(); });
after(async () => { await browser?.close(); await site?.close(); });

for (const [w, h] of [[1902, 977], [1440, 900], [1280, 720], [1024, 768], [390, 844], [360, 640]]) {
  test(`${w}x${h}: o título de todas as páginas começa à mesma distância do menu`, async () => {
    const context = await browser.newContext({ viewport: { width: w, height: h }, reducedMotion: 'reduce' });
    const page = await context.newPage();
    const esperado = Math.min(Math.max(40, w * 0.064), 124);
    const falhas = [];
    for (const rota of ROTAS) {
      await page.goto(site.origin + rota, { waitUntil: 'load' });
      const d = await page.evaluate(() => document.querySelector('main h1').getBoundingClientRect().top - document.querySelector('.site-header').getBoundingClientRect().bottom);
      if (Math.abs(d - esperado) > 2) falhas.push(`${rota}: ${Math.round(d)}px (esperado ${Math.round(esperado)}px)`);
    }
    await context.close();
    assert.deepEqual(falhas, []);
  });
}
