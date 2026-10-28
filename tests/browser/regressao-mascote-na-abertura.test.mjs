// Pedido de 28/10/2026: a órbita da abertura da home saiu; o mascote da Sett (o ponto do vídeo dos agentes) é o único personagem, enquadrado como por uma câmera. Garante que ele aparece inteiro em computador e celular, que os olhos ficam sobre o rosto e que a animação termina e para.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { startSite } from '../support/servidor.mjs';

let site;
let browser;
before(async () => { site = await startSite(); browser = await chromium.launch(); });
after(async () => { await browser?.close(); await site?.close(); });

for (const [w, h, celular] of [[1440, 900], [1318, 656], [1920, 1080], [1024, 768, true], [390, 844, true], [375, 667, true], [320, 568, true]]) {
  test(`${w}x${h}: o mascote é o único personagem da abertura, inteiro e com os olhos no rosto`, async () => {
    const context = await browser.newContext({ viewport: { width: w, height: h }, isMobile: !!celular && w < 800, hasTouch: !!celular && w < 800, reducedMotion: 'reduce' });
    const page = await context.newPage();
    await page.goto(site.origin + '/', { waitUntil: 'load' });
    const r = await page.evaluate(() => {
      const sec = document.querySelector('main > section:first-child');
      const base = sec.querySelector('.mascote-base');
      const b = base.getBoundingClientRect();
      const olhos = [...sec.querySelectorAll('.mascote-olhos')].map((o) => o.getBoundingClientRect());
      const s = sec.getBoundingClientRect();
      return {
        personagens: sec.querySelectorAll('.mascote').length,
        antigos: sec.querySelectorAll('.orbita, .hero-aneis').length,
        carregou: base.complete && base.naturalWidth > 0,
        largura: b.width,
        dentro: b.left >= 0 && b.right <= innerWidth && b.top >= s.top && b.bottom <= s.bottom,
        olhosNoRosto: olhos.every((o) => o.left > b.left + b.width * .2 && o.right < b.right - b.width * .2 && o.top > b.top + b.height * .25 && o.bottom < b.top + b.height * .6),
      };
    });
    await context.close();
    assert.equal(r.personagens, 1);
    assert.equal(r.antigos, 0, 'a órbita ou o anel antigo voltou');
    assert.equal(r.carregou, true, 'imagem do mascote não carregou');
    assert.ok(r.largura >= 115, `mascote pequeno demais: ${r.largura}px`);
    assert.equal(r.dentro, true, 'mascote cortado ou fora da abertura');
    assert.equal(r.olhosNoRosto, true, 'olhos fora do rosto');
  });
}

test('1440x900: a entrada do mascote termina e para (nada em laço)', async () => {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'no-preference' });
  const page = await context.newPage();
  await page.goto(site.origin + '/', { waitUntil: 'load' });
  const r = await page.evaluate(async () => {
    const anims = document.getAnimations().filter((a) => a.effect?.target?.closest?.('.mascote'));
    const infinitas = anims.filter((a) => a.effect.getComputedTiming().iterations === Infinity).length;
    const fim = Math.max(...anims.map((a) => a.effect.getComputedTiming().endTime));
    return { total: anims.length, infinitas, fim };
  });
  await context.close();
  assert.ok(r.total > 0, 'sem animação de entrada');
  assert.equal(r.infinitas, 0);
  assert.ok(r.fim <= 5000, `a entrada dura ${r.fim}ms`);
});
