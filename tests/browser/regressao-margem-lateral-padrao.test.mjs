// Bug: a margem lateral mudava em saltos entre larguras (72px em 1440, 171px em 1902) e não era a mesma proporção da página Sites. Padrão: max(gutter, 9vw, (largura−1800)/2) no computador, igual para menu e seções de Início, Automação, Google, Sites, Portfólio e O que fazemos.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { startSite } from '../support/servidor.mjs';

const ROTAS = ['/', '/agentes-de-ia-para-empresas/', '/gestao-google-meu-negocio/', '/criacao-de-sites/', '/portfolio/', '/o-que-fazemos/', '/marca-e-conteudo/'];
let site;
let browser;
before(async () => { site = await startSite(); browser = await chromium.launch(); });
after(async () => { await browser?.close(); await site?.close(); });

for (const w of [1024, 1280, 1440, 1902, 2560]) {
  test(`${w}px: menu e título começam na margem padrão em todas as páginas`, async () => {
    const context = await browser.newContext({ viewport: { width: w, height: 900 }, reducedMotion: 'reduce' });
    const page = await context.newPage();
    const esperado = Math.max(Math.min(Math.max(w * 0.05, 20), 72), w * 0.09, (w - 1800) / 2);
    const falhas = [];
    for (const rota of ROTAS) {
      await page.goto(site.origin + rota, { waitUntil: 'load' });
      const m = await page.evaluate(() => ({
        marca: document.querySelector('.site-header .brand').getBoundingClientRect().left,
        titulo: document.querySelector('main h1').getBoundingClientRect().left,
        botao: innerWidth - document.querySelector('.site-header > .button').getBoundingClientRect().right,
        rolagem: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      }));
      for (const [k, v] of Object.entries({ marca: m.marca, titulo: m.titulo, botao: m.botao })) {
        if (Math.abs(v - esperado) > 2) falhas.push(`${rota}: ${k}=${Math.round(v)} esperado ${Math.round(esperado)}`);
      }
      if (m.rolagem > 0) falhas.push(`${rota}: rolagem horizontal ${m.rolagem}px`);
    }
    await context.close();
    assert.deepEqual(falhas, []);
  });
}

for (const w of [1024, 1280, 1440, 1902]) {
  test(`${w}px: as telas do portfólio da home ficam dentro da margem padrão`, async () => {
    const context = await browser.newContext({ viewport: { width: w, height: 800 }, reducedMotion: 'reduce' });
    const page = await context.newPage();
    await page.goto(site.origin + '/', { waitUntil: 'load' });
    const r = await page.evaluate(() => {
      // 30/10/2026: as telas do portfólio da home são o laptop e o celular da cena "Sites que facilitam o contato"
      const c = [...document.querySelectorAll('#portfolio .sc-laptop, #portfolio .sc-celular')].map((e) => e.getBoundingClientRect());
      return { esq: Math.min(...c.map((x) => x.left)), dir: innerWidth - Math.max(...c.map((x) => x.right)), margem: parseFloat(getComputedStyle(document.querySelector('.site-header')).paddingLeft) };
    });
    await context.close();
    assert.ok(r.esq >= r.margem - 2, `esquerda ${r.esq} < margem ${r.margem}`);
    assert.ok(r.dir >= r.margem - 2, `direita ${r.dir} < margem ${r.margem}`);
  });
}
