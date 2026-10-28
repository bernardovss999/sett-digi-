// Bug: às vezes a página abria na segunda seção, no celular e no computador (voltar no navegador, endereço com #âncora vindo de fora, rolagem de tela em tela "pulando" enquanto fontes e imagens carregavam). Toda abertura começa na primeira seção; só um link interno para um ponto do site (ex.: /portfolio/#caso-suud) leva até ele.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { startSite } from '../support/servidor.mjs';

const ROTAS = ['/', '/portfolio/', '/criacao-de-sites/', '/gestao-google-meu-negocio/', '/agentes-de-ia-para-empresas/', '/o-que-fazemos/', '/sett-agenda.html'];
const APARELHOS = [['celular', { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }], ['computador', { viewport: { width: 1440, height: 900 } }]];

let site;
let browser;
before(async () => { site = await startSite(); browser = await chromium.launch(); });
after(async () => { await browser?.close(); await site?.close(); });

// a primeira seção está inteira no alto da tela, logo abaixo do menu
const naPrimeira = (page) => page.evaluate(() => {
  const s = document.querySelector('main > section').getBoundingClientRect();
  const topo = document.querySelector('.site-header').getBoundingClientRect().bottom;
  return { y: Math.round(scrollY), ok: scrollY === 0 && Math.abs(s.top - topo) <= 1 };
});

for (const [nome, opcoes] of APARELHOS) {
  test(`${nome}: cada página abre na primeira seção, também depois de as fontes e imagens carregarem`, async () => {
    const context = await browser.newContext(opcoes);
    const page = await context.newPage();
    const falhas = [];
    for (const rota of ROTAS) {
      await page.goto(site.origin + rota, { waitUntil: 'load' });
      await page.waitForTimeout(900);
      const r = await naPrimeira(page);
      if (!r.ok) falhas.push(`${rota}: abriu em ${r.y}px`);
    }
    await context.close();
    assert.deepEqual(falhas, []);
  });

  test(`${nome}: endereço com #âncora vindo de fora (WhatsApp, busca) abre na primeira seção`, async () => {
    const context = await browser.newContext(opcoes);
    const page = await context.newPage();
    const falhas = [];
    for (const url of ['/#portfolio', '/#servicos', '/portfolio/#previas', '/o-que-fazemos/#automacao-destaque']) {
      await page.goto('about:blank');   // chega de fora: um documento novo (ir de / para /#x na mesma página é um link da própria página)
      await page.goto(site.origin + url, { waitUntil: 'load' });
      await page.waitForTimeout(600);
      const r = await naPrimeira(page);
      if (!r.ok) falhas.push(`${url}: abriu em ${r.y}px`);
    }
    await context.close();
    assert.deepEqual(falhas, []);
  });

  test(`${nome}: voltar no navegador para uma página já rolada abre na primeira seção`, async () => {
    const context = await browser.newContext(opcoes);
    const page = await context.newPage();
    await page.goto(site.origin + '/', { waitUntil: 'load' });
    await page.evaluate(() => scrollTo({ top: document.querySelectorAll('main > section')[2].offsetTop, behavior: 'instant' }));
    await page.waitForTimeout(300);
    await page.goto(site.origin + '/portfolio/', { waitUntil: 'load' });
    await page.goBack({ waitUntil: 'load' });
    await page.waitForTimeout(600);
    const r = await naPrimeira(page);
    await context.close();
    assert.equal(r.ok, true, `voltou em ${r.y}px`);
  });
}

test('dentro da página, os links para uma seção continuam descendo até ela', async () => {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  const page = await context.newPage();
  await page.goto(site.origin + '/', { waitUntil: 'load' });
  await page.waitForTimeout(500);
  await page.click('.hero-actions a[href="#portfolio"]');
  await page.waitForTimeout(1500);
  const y = await page.evaluate(() => Math.round(document.querySelector('#portfolio').getBoundingClientRect().top - document.querySelector('.site-header').getBoundingClientRect().bottom));
  await context.close();
  assert.ok(Math.abs(y) <= 40, `o portfólio ficou a ${y}px do menu`);
});

test('link interno para um ponto do site ainda leva até ele (prévia do portfólio à vista)', async () => {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  await page.goto(site.origin + '/criacao-de-sites/', { waitUntil: 'load' });
  await page.click('a[href="/portfolio/#caso-cemevi"] >> nth=0');
  await page.waitForLoadState('load');
  await page.waitForTimeout(1200);
  const r = await page.evaluate(() => {
    const t = document.querySelector('#caso-cemevi').getBoundingClientRect();
    return { visivel: t.top >= 0 && t.bottom <= innerHeight && t.left >= 0 && t.right <= innerWidth, y: scrollY };
  });
  await context.close();
  assert.ok(r.y > 0, 'não desceu até as prévias');
  assert.equal(r.visivel, true, 'a prévia pedida não ficou à vista');
});
