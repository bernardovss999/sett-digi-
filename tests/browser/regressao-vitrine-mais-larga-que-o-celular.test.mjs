// Bug: no celular a vitrine (prévia ampliada) ficava mais larga que a tela e cortava o botão de fechar e os nomes.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { startSite } from '../support/servidor.mjs';

let site;
let browser;
before(async () => { site = await startSite(); browser = await chromium.launch(); });
after(async () => { await browser?.close(); await site?.close(); });

test('vitrine aberta no celular (390px) cabe na largura da tela, com o botão de fechar inteiro', async () => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
  const page = await context.newPage();
  await page.goto(site.origin + '/', { waitUntil: 'load' });
  await page.locator('#portfolio').scrollIntoViewIfNeeded();
  await page.locator('.leque-carta').first().click();
  const medidas = await page.evaluate(() => ({
    caixa: document.querySelector('.vitrine-caixa').getBoundingClientRect().right,
    fecha: document.querySelector('.vitrine-fecha').getBoundingClientRect().right,
    vivo: document.querySelector('.vitrine-vivo').getBoundingClientRect().right,
    largura: innerWidth,
  }));
  await context.close();
  assert.ok(medidas.caixa <= medidas.largura + 1, `caixa vai até ${medidas.caixa}px`);
  assert.ok(medidas.fecha <= medidas.largura, `botão de fechar vai até ${medidas.fecha}px`);
  assert.ok(medidas.vivo <= medidas.largura, `botão do site vai até ${medidas.vivo}px`);
});
