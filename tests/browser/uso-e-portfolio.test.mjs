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

// Mudou de propósito em 30/10/2026 (roteiro de 29/10/2026, tela 3): a vitrine que abria por cima da página saiu. A
// prévia aparece em uso na própria seção: o rascunho vira o site e o caminho até o contato (o botão de WhatsApp da
// prévia) fica marcado na tela que está à vista. Segue garantido que a página nunca fica presa.
describe('portfólio da home', () => {
  for (const [nome, tela] of [['computador', { width: 1440, height: 900 }], ['celular', { width: 390, height: 844 }]]) {
    test(`${nome}: escolher uma prévia troca o site na tela e marca o caminho até o contato`, async () => {
      const { context, page } = await abre('index.html', tela);
      await page.locator('#portfolio').scrollIntoViewIfNeeded();
      await page.locator('#portfolio [data-caso="1"]').click();
      await page.waitForFunction(() => document.querySelector('[data-sites]').classList.contains('contato'));
      const r = await page.evaluate(() => {
        const palco = document.querySelector('[data-sites]');
        const ativa = palco.querySelector(palco.dataset.telaAtiva === 'cel' ? '.sc-celular' : '.sc-laptop');
        const tela = ativa.querySelector('.sc-tela').getBoundingClientRect();
        const alvo = ativa.querySelector('.sc-alvo').getBoundingClientRect();
        const meio = { x: alvo.left + alvo.width / 2, y: alvo.top + alvo.height / 2 };
        return {
          nome: document.querySelector('[data-sc-nome]').textContent,
          captura: ativa.querySelector('.sc-captura').getAttribute('src'),
          alvoNaTela: meio.x >= tela.left && meio.x <= tela.right && meio.y >= tela.top && meio.y <= tela.bottom,
          alvoVisivel: getComputedStyle(ativa.querySelector('.sc-alvo')).opacity === '1',
          caminho: document.querySelector('[data-sc-caminho]').textContent,
          overflow: getComputedStyle(document.documentElement).overflow,
        };
      });
      await context.close();
      assert.equal(r.nome, 'Casa Viva Itacoá');
      assert.match(r.captura, /casaviva-inicio-/);
      assert.equal(r.alvoVisivel, true, 'o caminho até o contato não foi marcado');
      assert.equal(r.alvoNaTela, true, 'a marca do contato ficou fora da tela da prévia');
      assert.match(r.caminho, /^O caminho até o contato/);
      assert.equal(r.overflow, 'visible', 'a página ficou presa');
    });
  }
});
