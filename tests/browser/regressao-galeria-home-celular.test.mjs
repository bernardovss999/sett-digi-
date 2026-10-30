// Bug: no celular o portfólio da home ("Ideias que ganham vida na tela") era um leque inclinado que saía da tela, com cartas sobrepostas difíceis de tocar, a vitrine ocupava a tela inteira e "Explorar portfólio" ficava escondido.
// Mudou de propósito em 30/10/2026 (roteiro de 29/10/2026, tela 3 "Sites que facilitam o contato"): o leque e a vitrine
// deram lugar à cena do kit — laptop e celular com as prévias em uso, a escolha do caso e o alternador de computador e
// celular. As garantias continuam: nada sobreposto, cada escolha tocável, nada passa da largura da tela e
// "Explorar portfólio" fica à vista.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { startSite } from '../support/servidor.mjs';

let site;
let browser;
before(async () => { site = await startSite(); browser = await chromium.launch(); });
after(async () => { await browser?.close(); await site?.close(); });

const CELULARES = [[320, 568], [360, 640], [375, 667], [390, 844], [412, 915], [430, 932]];

for (const [w, h] of CELULARES) {
  test(`${w}x${h}: casos lado a lado sem sobrepor, cada um tocável, a tela do aparelho inteira e "Explorar portfólio" na tela`, async () => {
    const context = await browser.newContext({ viewport: { width: w, height: h }, isMobile: true, hasTouch: true, reducedMotion: 'reduce' });
    const page = await context.newPage();
    await page.goto(site.origin + '/', { waitUntil: 'load' });
    await page.waitForTimeout(500);   // a página segura a primeira seção até assentar (ou até a pessoa mexer); a rolagem daqui é por código
    await page.evaluate(() => { const s = document.querySelector('#portfolio'); scrollTo(0, s.offsetTop - document.querySelector('.site-header').offsetHeight); });
    const r = await page.evaluate(async () => {
      const casos = [...document.querySelectorAll('#portfolio [data-caso]')];
      const caixas = casos.map((c) => c.getBoundingClientRect());
      const sobre = caixas.some((a, i) => caixas.some((b, j) => j > i && a.right > b.left + 1 && b.right > a.left + 1 && a.bottom > b.top + 1 && b.bottom > a.top + 1));
      const tocaveis = [];
      for (const c of casos) {
        c.scrollIntoView({ inline: 'nearest', block: 'nearest' });
        await new Promise((ok) => setTimeout(ok, 50));
        const b = c.getBoundingClientRect();
        tocaveis.push(c === document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2) && b.height >= 40);
      }
      const tela = document.querySelector('#portfolio .sc-laptop .sc-tela').getBoundingClientRect();
      const pe = document.querySelector('#portfolio .sc-pe .button').getBoundingClientRect();
      const secao = document.querySelector('#portfolio').getBoundingClientRect();
      return {
        sobre, tocaveis,
        aparelho: { l: tela.left, r: tela.right },
        rolagemPagina: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        pe: { visivel: pe.height > 0, dentro: pe.bottom <= secao.bottom && pe.right <= innerWidth },
      };
    });
    await context.close();
    assert.equal(r.sobre, false, 'casos sobrepostos');
    assert.deepEqual(r.tocaveis, [true, true, true, true, true]);
    assert.ok(r.aparelho.l >= 0 && r.aparelho.r <= w, `a tela do laptop corta: ${r.aparelho.l}–${r.aparelho.r}`);
    assert.equal(r.rolagemPagina, 0, 'página com rolagem horizontal');
    assert.equal(r.pe.visivel, true, '"Explorar portfólio" sumiu');
    assert.equal(r.pe.dentro, true, '"Explorar portfólio" fora da tela');
  });
}

for (const [w, h] of [[390, 844], [360, 640]]) {
  test(`${w}x${h}: escolher um caso troca a prévia e o alternador mostra o celular`, async () => {
    const context = await browser.newContext({ viewport: { width: w, height: h }, isMobile: true, hasTouch: true, reducedMotion: 'reduce' });
    const page = await context.newPage();
    await page.goto(site.origin + '/', { waitUntil: 'load' });
    await page.locator('#portfolio [data-caso="2"]').scrollIntoViewIfNeeded();
    await page.locator('#portfolio [data-caso="2"]').tap();
    await page.locator('#portfolio [data-tela="cel"]').tap();
    await page.waitForTimeout(100);
    const r = await page.evaluate(() => {
      const cel = document.querySelector('#portfolio .sc-celular');
      const b = cel.getBoundingClientRect();
      return {
        nome: document.querySelector('[data-sc-nome]').textContent,
        captura: cel.querySelector('.sc-captura').getAttribute('src'),
        vivo: document.querySelector('[data-sc-vivo]').href,
        celVisivel: b.width > 0 && b.left >= 0 && b.right <= innerWidth,
        laptop: getComputedStyle(document.querySelector('#portfolio .sc-laptop')).display,
      };
    });
    await context.close();
    assert.equal(r.nome, 'Barbearia Carvalho');
    assert.match(r.captura, /carvalho-inicio-celular-390\.webp$/);
    assert.equal(r.vivo, 'https://cavalhobarbearia.vercel.app/');
    assert.equal(r.celVisivel, true, 'o celular não apareceu inteiro');
    assert.equal(r.laptop, 'none', 'no celular só uma tela por vez');
  });
}

for (const [w, h] of [[1024, 768], [1280, 720], [1440, 900], [1920, 1080]]) {
  test(`${w}x${h}: no computador o laptop e o celular ficam ao lado do texto, sem encostar nele`, async () => {
    const context = await browser.newContext({ viewport: { width: w, height: h }, reducedMotion: 'reduce' });
    const page = await context.newPage();
    await page.goto(site.origin + '/', { waitUntil: 'load' });
    const r = await page.evaluate(() => {
      const texto = document.querySelector('#portfolio .sc-texto').getBoundingClientRect();
      const laptop = document.querySelector('#portfolio .sc-laptop').getBoundingClientRect();
      const cel = document.querySelector('#portfolio .sc-celular').getBoundingClientRect();
      return { aoLado: laptop.left >= texto.right, celDentro: cel.right <= innerWidth, laptop: laptop.width, cel: cel.width };
    });
    await context.close();
    assert.equal(r.aoLado, true, 'a cena encosta no texto');
    assert.equal(r.celDentro, true, 'o celular passa da tela');
    assert.ok(r.laptop > r.cel * 2, 'o laptop é a tela principal da cena');
  });
}
