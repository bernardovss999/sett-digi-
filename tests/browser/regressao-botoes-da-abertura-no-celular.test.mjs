// Bug: no celular, os botões da abertura mudavam de página para página (lado a lado em Sites/Google, empilhados nas outras); o padrão é um só: botão em cima, link embaixo, centrados.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { startSite } from '../support/servidor.mjs';

const ROTAS = ['/', '/portfolio/', '/criacao-de-sites/', '/gestao-google-meu-negocio/', '/agentes-de-ia-para-empresas/', '/o-que-fazemos/', '/sett-agenda.html'];
let site;
let browser;
before(async () => { site = await startSite(); browser = await chromium.launch(); });
after(async () => { await browser?.close(); await site?.close(); });

for (const [w, h] of [[320, 568], [390, 844], [430, 932]]) {
  test(`${w}x${h}: botões da abertura empilhados e centrados em todas as páginas`, async () => {
    const context = await browser.newContext({ viewport: { width: w, height: h }, isMobile: true, hasTouch: true, reducedMotion: 'reduce' });
    const page = await context.newPage();
    const falhas = [];
    for (const rota of ROTAS) {
      await page.goto(site.origin + rota, { waitUntil: 'load' });
      const r = await page.evaluate(() => {
        const itens = [...document.querySelectorAll('main > section:first-child .hero-actions > *')].map((e) => e.getBoundingClientRect());
        return itens.map((b) => ({ topo: b.top, fundo: b.bottom, meio: (b.left + b.right) / 2 }));
      });
      if (r.length < 2) continue;
      if (!(r[1].topo >= r[0].fundo - 1)) falhas.push(`${rota}: lado a lado`);
      if (r.some((b) => Math.abs(b.meio - w / 2) > 2)) falhas.push(`${rota}: fora do centro`);
    }
    await context.close();
    assert.deepEqual(falhas, []);
  });
}

test('390x844: a abertura de "O que fazemos" (texto, botões e constelação) cabe numa tela', async () => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, reducedMotion: 'reduce' });
  const page = await context.newPage();
  await page.goto(site.origin + '/o-que-fazemos/', { waitUntil: 'load' });
  const fundo = await page.evaluate(() => Math.max(...[...document.querySelectorAll('.constelacao li')].map((e) => e.getBoundingClientRect().bottom)));
  await context.close();
  assert.ok(fundo <= 844, `constelação termina em ${fundo}px`);
});
