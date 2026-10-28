// Bug: em 320-360px o cabeçalho dos casos do portfólio e o título "acompanhamento." de Automação com IA passavam da largura da tela.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { startSite } from '../support/servidor.mjs';

let site;
let browser;
before(async () => { site = await startSite(); browser = await chromium.launch(); });
after(async () => { await browser?.close(); await site?.close(); });

for (const largura of [320, 360]) {
  for (const rota of ['/portfolio/', '/agentes-de-ia-para-empresas/']) {
    test(`${rota} sem rolagem horizontal em ${largura}px`, async () => {
      const context = await browser.newContext({ viewport: { width: largura, height: 800 }, reducedMotion: 'reduce' });
      const page = await context.newPage();
      await page.goto(site.origin + rota, { waitUntil: 'load' });
      await page.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 600) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 40)); } });
      const { sw, cw } = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
      await context.close();
      assert.ok(sw <= cw, `scrollWidth ${sw} > clientWidth ${cw}`);
    });
  }
}
