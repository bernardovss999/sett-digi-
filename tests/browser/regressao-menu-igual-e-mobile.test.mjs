// Bug: a página Sett Agenda tinha um menu antigo ("Agentes de IA", "Dúvidas") diferente das outras. Todas as páginas usam o mesmo menu, e no celular o menu abre, mostra os 7 links sem estourar a tela e fecha.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { startSite } from '../support/servidor.mjs';

const ROTAS = ['/', '/portfolio/', '/criacao-de-sites/', '/gestao-google-meu-negocio/', '/agentes-de-ia-para-empresas/', '/o-que-fazemos/', '/sett-agenda.html'];
let site;
let browser;
before(async () => { site = await startSite(); browser = await chromium.launch(); });
after(async () => { await browser?.close(); await site?.close(); });

test('todas as páginas têm o mesmo menu (desktop, celular e atalho do topo)', async () => {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  const menus = {};
  for (const rota of ROTAS) {
    await page.goto(site.origin + rota, { waitUntil: 'load' });
    menus[rota] = await page.evaluate(() => ['.desktop-nav a', '#mobile-nav a', '.topo-ia'].map((s) => [...document.querySelectorAll(s)].map((a) => `${a.getAttribute('href')} ${a.textContent.trim()}`).join(' | ')).join(' || '));
  }
  await context.close();
  for (const rota of ROTAS) assert.equal(menus[rota], menus['/'], rota);
});

for (const [w, h] of [[320, 568], [390, 844], [430, 932]]) {
  test(`${w}x${h}: menu do celular abre, cabe na tela e fecha em todas as páginas`, async () => {
    const context = await browser.newContext({ viewport: { width: w, height: h }, isMobile: true, hasTouch: true, reducedMotion: 'reduce' });
    const page = await context.newPage();
    const falhas = [];
    for (const rota of ROTAS) {
      await page.goto(site.origin + rota, { waitUntil: 'load' });
      await page.locator('.menu-toggle').tap();
      const aberto = await page.evaluate(() => {
        const nav = document.querySelector('#mobile-nav');
        const r = nav.getBoundingClientRect();
        const links = [...nav.querySelectorAll('a')].filter((a) => a.getBoundingClientRect().height >= 40);
        return { visivel: nav.classList.contains('is-open') && getComputedStyle(nav).visibility === 'visible' && r.height > 0, dentro: r.left >= 0 && r.right <= innerWidth, links: links.length };
      });
      if (!aberto.visivel) falhas.push(`${rota}: menu não abriu`);
      if (!aberto.dentro) falhas.push(`${rota}: menu passa da tela`);
      if (aberto.links < 7) falhas.push(`${rota}: só ${aberto.links} links com toque ≥ 40px`);
      await page.locator('.menu-toggle').tap();
      await page.waitForTimeout(250);
      const fechado = await page.evaluate(() => !document.querySelector('#mobile-nav').classList.contains('is-open') && getComputedStyle(document.querySelector('#mobile-nav')).visibility === 'hidden' && document.querySelector('.menu-toggle').getAttribute('aria-expanded') === 'false');
      if (!fechado) falhas.push(`${rota}: menu não fechou`);
    }
    await context.close();
    assert.deepEqual(falhas, []);
  });
}
