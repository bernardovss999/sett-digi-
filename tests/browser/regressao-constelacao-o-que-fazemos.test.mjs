// Pedido de 28/10/2026: a lista de checagem da abertura de "O que fazemos" virou a constelação (negócio no centro, quatro frentes ligadas). Garante que os quatro links existem, nada se sobrepõe e tudo cabe na tela.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { startSite } from '../support/servidor.mjs';

let site;
let browser;
before(async () => { site = await startSite(); browser = await chromium.launch(); });
after(async () => { await browser?.close(); await site?.close(); });

for (const [w, h] of [[1902, 977], [1440, 900], [1024, 768], [390, 844], [360, 640]]) {
  test(`${w}x${h}: constelação com 4 frentes, sem sobreposição e dentro da tela`, async () => {
    const context = await browser.newContext({ viewport: { width: w, height: h }, reducedMotion: 'reduce' });
    const page = await context.newPage();
    await page.goto(site.origin + '/o-que-fazemos/', { waitUntil: 'load' });
    const r = await page.evaluate(() => {
      const caixas = [...document.querySelectorAll('.constelacao li'), document.querySelector('.constelacao-centro')].map((e) => e.getBoundingClientRect());
      const cruza = (a, b) => !(a.right <= b.left || b.right <= a.left || a.bottom <= b.top || b.bottom <= a.top);
      let sobre = 0;
      caixas.forEach((a, i) => caixas.forEach((b, j) => { if (j > i && cruza(a, b)) sobre += 1; }));
      return {
        links: [...document.querySelectorAll('.constelacao li a')].map((a) => a.getAttribute('href')),
        sobre,
        fora: caixas.filter((c) => c.left < 0 || c.right > innerWidth).length,
        lista: document.querySelectorAll('.ab .perfil').length,
      };
    });
    await context.close();
    assert.deepEqual(r.links, ['#sites', '#google', '#redes-sociais', '#automacao']);
    assert.equal(r.sobre, 0, 'caixas sobrepostas');
    assert.equal(r.fora, 0, 'caixa fora da tela');
    assert.equal(r.lista, 0, 'a lista de checagem antiga voltou');
  });
}
