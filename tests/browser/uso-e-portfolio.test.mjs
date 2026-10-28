// Uso no navegador: nada sublinhado, recarregar volta ao topo, e o portfólio da home
// (leque + prévia ampliada) abre, troca e fecha sem prender a página.
import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { startSite } from '../support/servidor.mjs';
import { listPublishedPages, pagePath } from '../support/site.mjs';

const paginas = listPublishedPages().filter((rel) => rel !== 'sett-agenda.html');
let site;
let browser;

before(async () => {
  site = await startSite();
  browser = await chromium.launch();
});
after(async () => {
  await browser?.close();
  await site?.close();
});

async function abre(rel, { width = 1440, height = 900 } = {}) {
  const context = await browser.newContext({ viewport: { width, height }, reducedMotion: 'reduce' });
  const page = await context.newPage();
  await page.goto(site.origin + pagePath(rel), { waitUntil: 'load' });
  return { context, page };
}

describe('sem sublinhado', () => {
  for (const rel of paginas) {
    test(`${rel}: nenhum link visível tem sublinhado ou traço embaixo`, async () => {
      const { context, page } = await abre(rel);
      const sublinhados = await page.$$eval('a', (links) => links
        // a linha divisória das listas clicáveis (a linha inteira é o link) não é sublinhado de texto
        .filter((a) => a.offsetParent !== null && !a.closest('.faq-list') && !a.classList.contains('service-card'))
        .filter((a) => {
          const c = getComputedStyle(a);
          const borda = parseFloat(c.borderBottomWidth) > 0 && c.borderBottomStyle !== 'none' && !a.classList.contains('button');
          return c.textDecorationLine.includes('underline') || borda;
        })
        .map((a) => a.textContent.trim().slice(0, 40)));
      await context.close();
      assert.deepEqual(sublinhados, []);
    });
  }
});

describe('recarregar', () => {
  test('recarregar a página no meio da rolagem volta ao topo, com o cabeçalho à vista', async () => {
    const { context, page } = await abre('index.html');
    await page.evaluate(() => scrollTo(0, 3000));
    await page.waitForTimeout(200);
    await page.reload({ waitUntil: 'load' });
    await page.waitForTimeout(300);
    const y = await page.evaluate(() => scrollY);
    const topo = await page.$eval('.site-header', (h) => h.getBoundingClientRect().top);
    await context.close();
    assert.equal(y, 0);
    assert.equal(topo, 0);
  });
});

describe('portfólio da home', () => {
  for (const [nome, tela] of [['computador', { width: 1440, height: 900 }], ['celular', { width: 390, height: 844 }]]) {
    test(`${nome}: clicar numa prévia abre a vitrine; troca de prévia; Esc fecha e a página volta a rolar`, async () => {
      const { context, page } = await abre('index.html', tela);
      await page.locator('#portfolio').scrollIntoViewIfNeeded();
      // no celular as telas se sobrepõem: toca-se a que está por cima (a primeira); no computador, a segunda
      const k = nome === 'celular' ? 0 : 1;
      await page.locator('.leque-carta').nth(k).click();
      assert.equal(await page.$eval('.vitrine', (d) => d.open), true);
      assert.equal(await page.textContent('#vitrine-nome'), ['Suud', 'Casa Viva Itacoá'][k]);
      // as telas cabem na caixa (só o topo do site, nada rolando por dentro)
      const cabe = await page.$eval('.vitrine-telas', (t) => [...t.querySelectorAll('.vitrine-janela, .vitrine-celular')]
        .filter((e) => e.offsetParent !== null)
        .every((e) => { const a = t.getBoundingClientRect(), b = e.getBoundingClientRect(); return b.top >= a.top - 1 && b.bottom <= a.bottom + 1 && b.left >= a.left - 1 && b.right <= a.right + 1; }));
      assert.equal(cabe, true, 'tela da prévia saiu da caixa');
      await page.click('.vitrine [data-passo="1"]');
      assert.equal(await page.textContent('#vitrine-nome'), ['Casa Viva Itacoá', 'Barbearia Carvalho'][k]);
      await page.keyboard.press('Escape');
      await page.waitForTimeout(100);   // o evento "close" do <dialog> chega numa tarefa seguinte
      assert.equal(await page.$eval('.vitrine', (d) => d.open), false);
      assert.equal(await page.evaluate(() => getComputedStyle(document.documentElement).overflow), 'visible');
      await context.close();
    });
  }

  test('clicar fora da caixa fecha a vitrine', async () => {
    const { context, page } = await abre('index.html');
    await page.locator('#portfolio').scrollIntoViewIfNeeded();
    await page.locator('.leque-carta').first().click();
    await page.mouse.click(8, 450);
    assert.equal(await page.$eval('.vitrine', (d) => d.open), false);
    await context.close();
  });
});
