// Pedido de 28/10/2026: os agentes de "O que fazemos" se mexem como no vídeo (gesto próprio, piscam e sorriem; o palco dá uma volta pelos seis ao abrir; etapas e fecho chegam pulando). Garante que tudo termina e para, que a volta para quando a pessoa mexe e que "reduzir movimento" deixa tudo parado.
// Mudou de propósito em 30/10/2026 (pedido do dono, seguindo o roteiro de 29/10/2026): os agentes desta página passaram a
// ser os do "Elenco da Sett" em 2D (/img/agentes-2d/*.svg, com as mesmas três expressões). O que o teste garante é o mesmo.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { startSite } from '../support/servidor.mjs';

let site;
let browser;
before(async () => { site = await startSite(); browser = await chromium.launch(); });
after(async () => { await browser?.close(); await site?.close(); });

const GESTOS = { atendimento: 'gira', agenda: 'duplo', pedidos: 'balanca', estoque: 'gira', prospeccao: 'treme', relatorios: 'salta' };

for (const [nome, opcoes] of [['computador', { viewport: { width: 1440, height: 900 } }], ['celular', { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }]]) {
  test(`${nome}: cada agente escolhido faz o seu gesto, pisca, sorri e volta a olhar (sem laço)`, async () => {
    const context = await browser.newContext({ ...opcoes, reducedMotion: 'no-preference' });
    const page = await context.newPage();
    await page.goto(site.origin + '/o-que-fazemos/', { waitUntil: 'load' });
    const falhas = [];
    for (const [ator, gesto] of Object.entries(GESTOS)) {
      await page.locator(`.elenco-escolha button[data-ator="${ator}"]`).click();
      const r = await page.evaluate(() => {
        const a = document.querySelector('.elenco-ator');
        const anims = a.getAnimations();
        return { classe: a.className, anims: anims.length, infinita: anims.some((x) => x.effect.getComputedTiming().iterations === Infinity) };
      });
      if (!r.classe.includes(`gesto-${gesto}`) || r.anims === 0) falhas.push(`${ator}: sem o gesto ${gesto} (${r.classe})`);
      if (r.infinita) falhas.push(`${ator}: animação em laço`);
    }
    // o último escolhido sorri e depois volta aos olhos abertos
    await page.waitForTimeout(1200);
    const sorrindo = await page.getAttribute('.elenco-ator', 'src');
    await page.waitForTimeout(1100);
    const fim = await page.getAttribute('.elenco-ator', 'src');
    if (!sorrindo.endsWith('relatorios-sorri.svg')) falhas.push(`não sorriu (${sorrindo})`);
    if (!fim.endsWith('relatorios-aberto.svg')) falhas.push(`não voltou aos olhos abertos (${fim})`);
    const laco = await page.evaluate(() => document.getAnimations().filter((a) => a.effect?.target?.closest?.('.elenco, .etapas-agentes, .elenco-fila') && a.effect.getComputedTiming().iterations === Infinity).length);
    if (laco) falhas.push(`${laco} animações em laço`);
    await context.close();
    assert.deepEqual(falhas, []);
  });
}

test('ao abrir, o palco dá uma volta pelos agentes; quando a pessoa escolhe, a volta para', async () => {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'no-preference' });
  const page = await context.newPage();
  await page.goto(site.origin + '/o-que-fazemos/', { waitUntil: 'load' });
  await page.mouse.move(5, 890);   // o mouse longe do palco
  await page.waitForTimeout(4200);
  const andou = await page.textContent('.elenco-legenda b');
  assert.notEqual(andou, 'Atendimento', 'a volta pelos agentes não andou');
  await page.locator('.elenco-escolha button[data-ator="estoque"]').click();
  await page.waitForTimeout(4200);
  assert.equal(await page.textContent('.elenco-legenda b'), 'Estoque', 'a volta continuou depois da escolha');
  await context.close();
});

test('com "reduzir movimento", o palco fica parado: sem volta e sem gesto', async () => {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  const page = await context.newPage();
  await page.goto(site.origin + '/o-que-fazemos/', { waitUntil: 'load' });
  await page.waitForTimeout(4200);
  assert.equal(await page.textContent('.elenco-legenda b'), 'Atendimento');
  await page.click('.elenco-escolha button[data-ator="agenda"]');
  const r = await page.evaluate(() => ({ classe: document.querySelector('.elenco-ator').className, anims: document.querySelector('.elenco-ator').getAnimations().length }));
  assert.equal(r.classe, 'elenco-ator');
  assert.equal(r.anims, 0);
  await context.close();
});
