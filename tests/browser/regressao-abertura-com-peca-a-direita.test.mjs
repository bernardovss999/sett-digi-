// Bug: a abertura da home tinha só um anel pequeno cortado na borda e a do portfólio tinha o lado direito vazio; as duas ganham uma peça à direita (o mascote da Sett e a pilha de prévias) que não pode encostar no texto nem sair da tela.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { startSite } from '../support/servidor.mjs';

let site;
let browser;
before(async () => { site = await startSite(); browser = await chromium.launch(); });
after(async () => { await browser?.close(); await site?.close(); });

// 30/10/2026 (roteiro de 29/10/2026): a home saiu desta lista de propósito. A abertura dela virou a do protótipo, com o
// fundo de Reels e o elenco andando por cima (ver regressao-mascote-na-abertura); não há mais uma peça parada à direita.
const PECAS = [['/portfolio/', '.pilha', '.pilha-janela']];
// abaixo de 1100px a peça sai do lado e desce para baixo dos botões

for (const [w, h] of [[1100, 700], [1280, 720], [1318, 656], [1366, 768], [1440, 900], [1536, 864], [1920, 1080], [2560, 1440]]) {
  for (const [rota, peca, partes] of PECAS) {
    test(`${w}x${h} ${rota}: ${peca} à direita, grande, sem encostar no texto e dentro da abertura`, async () => {
      const context = await browser.newContext({ viewport: { width: w, height: h }, reducedMotion: 'reduce' });
      const page = await context.newPage();
      await page.goto(site.origin + rota, { waitUntil: 'load' });
      const r = await page.evaluate(([peca, partes]) => {
        const sec = document.querySelector('main > section').getBoundingClientRect();
        const p = document.querySelector(peca).getBoundingClientRect();
        const caixas = [...document.querySelectorAll(partes)].map((e) => e.getBoundingClientRect());
        // o texto: cada linha do título, o parágrafo e os botões (o que realmente tem tinta)
        const textos = [...document.querySelectorAll('main > section:first-child h1 .linha, main > section:first-child .hero-lead, main > section:first-child .hero-actions > *')].map((e) => {
          const range = document.createRange(); range.selectNodeContents(e); return range.getBoundingClientRect();
        });
        const cruza = (a, b) => a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
        return {
          largura: p.width,
          sobre: caixas.concat(p).some((c) => textos.some((t) => cruza(c, t))),
          fora: caixas.some((c) => c.left < 0 || c.right > innerWidth || c.top < sec.top || c.bottom > sec.bottom),
          margem: innerWidth - p.right,
          header: parseFloat(getComputedStyle(document.querySelector('.site-header')).paddingRight),
        };
      }, [peca, partes]);
      await context.close();
      assert.ok(r.largura >= 280, `peça pequena: ${Math.round(r.largura)}px`);
      assert.equal(r.sobre, false, 'peça encosta no texto');
      assert.equal(r.fora, false, 'parte da peça sai da tela ou da abertura');
      assert.ok(Math.abs(r.margem - r.header) <= 2, `borda direita fora da margem padrão (${r.margem} × ${r.header})`);
    });
  }
}
