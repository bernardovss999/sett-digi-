// Pedido de 28/10/2026: a seção de dúvidas da home passou a ter fundo claro. Bug evitado: a pergunta em destaque (hover/toque) ficava ciano claro sobre o fundo claro, quase invisível.
// Mudou de propósito em 30/10/2026 (roteiro de 29/10/2026, tela 5): as dúvidas viraram "Como trabalhamos", com os três
// passos do kit; as respostas e as garantias foram para dentro dos passos. A garantia é a mesma: fundo claro (o claro do
// kit, #fbfaf7) e o passo em destaque legível ao passar o mouse.
// No mesmo dia, pedido do dono: as seções da home alternam azul profundo e claro, e "Como trabalhamos" ficou no azul
// profundo. A garantia que sobra é a do bug: o passo em destaque e o resumo continuam legíveis sobre o fundo.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { startSite } from '../support/servidor.mjs';

let site;
let browser;
before(async () => { site = await startSite(); browser = await chromium.launch(); });
after(async () => { await browser?.close(); await site?.close(); });

test('home: "Como trabalhamos" no azul profundo e passo legível ao passar o mouse', async () => {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  const page = await context.newPage();
  await page.goto(site.origin + '/', { waitUntil: 'load' });
  await page.locator('#como-trabalhamos summary').nth(1).scrollIntoViewIfNeeded();
  await page.locator('#como-trabalhamos summary').nth(1).hover();
  const r = await page.evaluate(() => {
    const lum = (c) => { const m = c.match(/[\d.]+/g).map(Number); const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(m[0]) + 0.7152 * f(m[1]) + 0.0722 * f(m[2]); };
    const contraste = (x, y) => { const a = lum(x); const b = lum(y); return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05); };
    const secao = document.querySelector('#como-trabalhamos');
    const fundo = getComputedStyle(secao).backgroundColor;
    const nome = getComputedStyle(secao.querySelectorAll('.passo-nome')[1]).color;
    const resumo = getComputedStyle(secao.querySelectorAll('.passo-resumo')[1]).color;
    return { fundo, nome: contraste(nome, fundo), resumo: contraste(resumo, fundo), passos: secao.querySelectorAll('details').length };
  });
  await context.close();
  assert.equal(r.fundo, 'rgb(26, 44, 53)');
  assert.equal(r.passos, 3);
  assert.ok(r.nome >= 3, `contraste do passo em destaque ${r.nome.toFixed(2)}`);
  assert.ok(r.resumo >= 4.5, `contraste do resumo ${r.resumo.toFixed(2)}`);
});
