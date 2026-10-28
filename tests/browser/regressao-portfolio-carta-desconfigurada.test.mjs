// Bug: no portfólio (desktop) as molduras ocupavam a largura toda da carta, cobriam o nome e os recursos do site, e a carta ficava mais alta que a tela (1100px numa tela de 656px), tapando o título "Cada negócio tem uma história".
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { startSite } from '../support/servidor.mjs';

const TELAS = [
  [1024, 768], [1280, 720], [1280, 800], [1318, 656], [1366, 768], [1440, 900],
  [1536, 864], [1600, 900], [1920, 1080], [2560, 1440], [3440, 1440],
];

let site;
let browser;
before(async () => { site = await startSite(); browser = await chromium.launch(); });
after(async () => { await browser?.close(); await site?.close(); });

for (const [w, h] of TELAS) {
  test(`${w}x${h}: cada carta do portfólio cabe na tela e as molduras não cobrem o texto`, async () => {
    // com animação ligada: é o modo do baralho, em que a carta gruda e precisa caber na tela
    const context = await browser.newContext({ viewport: { width: w, height: h }, reducedMotion: 'no-preference' });
    const page = await context.newPage();
    await page.goto(site.origin + '/portfolio/', { waitUntil: 'load' });
    const falhas = await page.evaluate(() => {
      const topo = document.querySelector('.site-header').getBoundingClientRect().height;
      const util = innerHeight - topo;
      const cruza = (a, b) => a.left < b.right - 1 && b.left < a.right - 1 && a.top < b.bottom - 1 && b.top < a.bottom - 1;
      const out = [];
      for (const caso of document.querySelectorAll('.caso')) {
        const nome = caso.querySelector('h3').textContent;
        const carta = caso.querySelector('.caso-cartao').getBoundingClientRect();
        if (carta.height > util + 1) out.push(`${nome}: carta de ${Math.round(carta.height)}px numa tela útil de ${Math.round(util)}px`);
        const textos = [...caso.querySelectorAll('.caso-cab, .caso-feitos-bloco')].map((e) => e.getBoundingClientRect());
        for (const sel of ['.tela-desktop', '.tela-celular']) {
          const t = caso.querySelector(sel).getBoundingClientRect();
          if (textos.some((x) => cruza(x, t))) out.push(`${nome}: ${sel} cobre o texto`);
          if (t.right > carta.right + 1 || t.left < carta.left - 1) out.push(`${nome}: ${sel} sai da carta`);
        }
        const feitos = caso.querySelector('.caso-feitos-bloco').getBoundingClientRect();
        if (feitos.width < 220) out.push(`${nome}: coluna de texto espremida (${Math.round(feitos.width)}px)`);
      }
      return out;
    });
    await context.close();
    assert.deepEqual(falhas, []);
  });
}
