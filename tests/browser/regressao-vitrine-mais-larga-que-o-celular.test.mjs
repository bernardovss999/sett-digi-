// Bug: no celular a vitrine (prévia ampliada) ficava mais larga que a tela e cortava o botão de fechar e os nomes.
// Mudou de propósito em 30/10/2026 (roteiro de 29/10/2026): a home não tem mais a vitrine; a prévia aparece em uso na
// cena "Sites que facilitam o contato". A garantia segue a mesma: no celular, a tela da prévia, o nome e o link para
// abrir o site da prévia cabem na largura da tela.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { startSite } from '../support/servidor.mjs';

let site;
let browser;
before(async () => { site = await startSite(); browser = await chromium.launch(); });
after(async () => { await browser?.close(); await site?.close(); });

test('cena das prévias no celular (390px) cabe na largura da tela, com o nome e o link do site inteiros', async () => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
  const page = await context.newPage();
  await page.goto(site.origin + '/', { waitUntil: 'load' });
  await page.locator('#portfolio').scrollIntoViewIfNeeded();
  await page.locator('#portfolio [data-caso="0"]').click();
  for (const tela of ['desk', 'cel']) {
    await page.click(`#portfolio [data-tela="${tela}"]`);
    const medidas = await page.evaluate(() => {
      const visivel = [...document.querySelectorAll('#portfolio .sc-tela')].filter((e) => e.offsetParent !== null);
      return {
        tela: Math.max(...visivel.map((e) => e.getBoundingClientRect().right)),
        nome: document.querySelector('[data-sc-nome]').getBoundingClientRect().right,
        vivo: document.querySelector('[data-sc-vivo]').getBoundingClientRect(),
        largura: innerWidth,
      };
    });
    assert.ok(medidas.tela <= medidas.largura + 1, `${tela}: a tela da prévia vai até ${medidas.tela}px`);
    assert.ok(medidas.nome <= medidas.largura, `${tela}: o nome vai até ${medidas.nome}px`);
    assert.ok(medidas.vivo.width > 0 && medidas.vivo.right <= medidas.largura, `${tela}: o link do site vai até ${medidas.vivo.right}px`);
  }
  assert.equal(await page.$('dialog.vitrine'), null, 'a vitrine antiga voltou para a home');
  await context.close();
});
