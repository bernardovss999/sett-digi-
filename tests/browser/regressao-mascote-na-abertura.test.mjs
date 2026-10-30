// Pedido de 28/10/2026: a órbita da abertura da home saiu e o mascote (o Ponto) passou a ser o personagem da abertura.
// 30/10/2026 (roteiro de 29/10/2026): a abertura virou a do protótipo, com o elenco andando e o fundo de Reels.
// Mudou de novo, de propósito, em 30/10/2026 (pedido do dono): sai o elenco andando; ficam os Reels, agora os Stories
// 2D da Sett num tocador que desliza de um Reel para o outro. O que este teste protege continua o mesmo: o personagem
// (o Ponto) e a peça da abertura aparecem inteiros, dentro da abertura, em computador e celular, a órbita antiga não
// volta e nada roda sem que dê para parar: cada Reel toca uma vez, em sequência, e o tocador tem pausa.
// 30/10/2026 (pedido do dono: "recriação da header na estética 2D simpática; está muito desconexa"): os Reels passam a
// tocar num celular 2D, com o Ponto em pé em cima e os cartões das duas áreas em volta. Os cartões entram nas mesmas
// garantias (inteiros, dentro da abertura, sem encostar no texto) e a cena tem de ficar ligada ao texto: o cartão do
// Reel da vez acende junto com a área dele no texto, e o cabeçalho emenda com a abertura.
// 30/10/2026, de novo: a navegação passou a ser a dos Stories (tocar no mini celular passa) e a tela diz isso ao
// visitante, embaixo do celular; a pílula de botões saiu.
// 30/10/2026, no celular (pedido do dono: "a abertura do celular está crua; os Reels não funcionam bem ali"): abaixo de
// 800px os Reels saem e entra a vitrine (o selo com o Ponto, as quatro frentes e a faixa de garantias). O Ponto e as
// peças seguem inteiras dentro da abertura, abaixo do texto e sem se encostar.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { startSite } from '../support/servidor.mjs';

let site;
let browser;
before(async () => { site = await startSite(); browser = await chromium.launch(); });
after(async () => { await browser?.close(); await site?.close(); });

for (const [w, h, celular] of [[1440, 900], [1318, 656], [1920, 1080], [1024, 768, true]]) {
  test(`${w}x${h}: o Reel da vez e o Ponto aparecem inteiros na abertura, ao lado do texto`, async () => {
    const context = await browser.newContext({ viewport: { width: w, height: h }, isMobile: !!celular && w < 800, hasTouch: !!celular && w < 800, reducedMotion: 'reduce' });
    const page = await context.newPage();
    await page.goto(site.origin + '/', { waitUntil: 'load' });
    const r = await page.evaluate(() => {
      const sec = document.querySelector('main > section:first-child');
      const s = sec.getBoundingClientRect();
      const dentro = (q) => q.left >= -1 && q.right <= innerWidth + 1 && q.top >= s.top - 1 && q.bottom <= s.bottom + 1;
      const atual = sec.querySelector('.reel.atual');
      const a = atual.getBoundingClientRect();
      const ponto = sec.querySelector('.reels-ponto').getBoundingClientRect();
      const textos = [...sec.querySelectorAll('h1 .linha, .hero-lead, .areas, .hero-actions > *')].filter((e) => e.getClientRects().length).map((e) => e.getBoundingClientRect());
      const cruza = (x, y) => x.left < y.right && y.left < x.right && x.top < y.bottom && y.top < x.bottom;
      return {
        reels: sec.querySelectorAll('.reel').length,
        atuais: sec.querySelectorAll('.reel.atual').length,
        de2D: [...sec.querySelectorAll('.reel img')].every((i) => /^\/video\/cenas\/[a-z0-9-]+-fim\.webp$/.test(i.getAttribute('src')) && i.complete && i.naturalWidth > 0),
        largura: a.width,
        reelDentro: dentro(a),
        pontoDentro: dentro(ponto),
        encostaNoTexto: textos.some((t) => cruza(t, a)),
        antigos: sec.querySelectorAll('.orbita, .hero-aneis, .mascote').length + document.querySelectorAll('.turma, .feed-fundo').length,
        cartoes: [...sec.querySelectorAll('.reels-cartao')].map((c) => c.getBoundingClientRect()).map((c) => ({ dentro: dentro(c), noTexto: textos.some((t) => cruza(t, c)) })),
        largo: document.documentElement.scrollWidth > innerWidth,
        guia: (() => { const g = [...sec.querySelectorAll('.reels-guia > span')].find((e) => e.getClientRects().length); return g ? { texto: g.textContent, dentro: dentro(g.getBoundingClientRect()) } : null; })(),
      };
    });
    await context.close();
    assert.ok(r.reels >= 6, 'os Reels precisam de pelo menos seis histórias');
    assert.equal(r.atuais, 1);
    assert.equal(r.de2D, true, 'Reel sem o quadro 2D do próprio domínio');
    assert.ok(r.largura >= (h < 700 ? 90 : 120), `Reel pequeno demais: ${r.largura}px`);
    assert.equal(r.reelDentro, true, 'Reel cortado ou fora da abertura');
    assert.equal(r.pontoDentro, true, 'o Ponto ficou fora da abertura');
    assert.equal(r.encostaNoTexto, false, 'o Reel encosta no texto');
    assert.equal(r.antigos, 0, 'a órbita, o mascote antigo ou o elenco andando voltou');
    assert.equal(r.cartoes.length, 4, 'os quatro cartões das duas áreas');
    assert.ok(r.cartoes.every((c) => c.dentro), 'cartão cortado ou fora da abertura');
    assert.ok(r.cartoes.every((c) => !c.noTexto), 'cartão encosta no texto');
    assert.equal(r.largo, false, 'a cena passou da largura da tela');
    assert.match(r.guia?.texto || '', /^(Toque|Clique) no celular para passar/, 'a tela não diz como passar os Stories');
    assert.equal(r.guia.dentro, true, 'o aviso de como passar ficou fora da abertura');
  });
}

test('1440x900: os Reels tocam um de cada vez, sem laço, e a pausa para de verdade', async () => {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'no-preference' });
  const page = await context.newPage();
  await page.goto(site.origin + '/', { waitUntil: 'load' });
  await page.waitForSelector('.reel.atual video');
  await page.click('[data-reels-pausa]');
  await page.waitForTimeout(300);
  const r = await page.evaluate(() => ({
    rotulo: document.querySelector('[data-reels-pausa]').getAttribute('aria-pressed'),
    tocando: [...document.querySelectorAll('.reel video')].filter((v) => !v.paused).length,
    laco: [...document.querySelectorAll('.reel video')].some((v) => v.loop),
  }));
  // como nos Stories: clicar no lado direito do celular passa
  const tela = await page.locator('.reels-celular').boundingBox();
  await page.mouse.click(tela.x + tela.width * .8, tela.y + tela.height / 2);
  const segundo = await page.evaluate(() => [...document.querySelectorAll('.reel')].findIndex((c) => c.classList.contains('atual')));
  await context.close();
  assert.equal(r.rotulo, 'true');
  assert.equal(r.tocando, 0, 'Reel continuou tocando depois da pausa');
  assert.equal(r.laco, false, 'Reel em laço');
  assert.equal(segundo, 1, 'clicar no lado direito do celular não passou o Story');
});

for (const [w, h] of [[390, 844], [375, 667], [360, 640]]) {
  test(`${w}x${h}: no celular, a vitrine (Ponto, quatro frentes e garantias) aparece inteira, abaixo do texto`, async () => {
    const context = await browser.newContext({ viewport: { width: w, height: h }, isMobile: true, hasTouch: true, reducedMotion: 'reduce' });
    const page = await context.newPage();
    await page.goto(site.origin + '/', { waitUntil: 'load' });
    const r = await page.evaluate(() => {
      const sec = document.querySelector('main > section:first-child').getBoundingClientRect();
      const acoes = document.querySelector('.hero-actions').getBoundingClientRect();
      const caixa = (el) => el.getBoundingClientRect();
      const pecas = [document.querySelector('.selo-ponto'), document.querySelector('.vitrine-faixa'), ...document.querySelectorAll('.selo-frente')];
      const fora = pecas.map((el) => [el.className, caixa(el)]).filter(([, b]) => !b.width || b.top < acoes.bottom - 1 || b.bottom > sec.bottom + 1 || b.left < -1 || b.right > innerWidth + 1).map(([n]) => n);
      const fr = [...document.querySelectorAll('.selo-frente')].map(caixa);
      let encostam = 0;
      fr.forEach((a, i) => fr.slice(i + 1).forEach((b) => { if (a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom) encostam++; }));
      return { reels: getComputedStyle(document.querySelector('.reels')).display, fora, encostam, frentes: fr.length };
    });
    await context.close();
    assert.equal(r.reels, 'none', 'os Reels voltaram ao celular');
    assert.equal(r.frentes, 4);
    assert.deepEqual(r.fora, [], 'peça da vitrine cortada ou fora da abertura');
    assert.equal(r.encostam, 0, 'frentes se encostam');
  });
}

test('1440x900: a cena fica ligada ao texto: o cartão do Reel da vez acende com a área dele, e tocar no cartão leva ao Reel', async () => {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  const page = await context.newPage();
  await page.goto(site.origin + '/', { waitUntil: 'load' });
  const estado = () => page.evaluate(() => ({
    reel: document.querySelector('.reel.atual').dataset.reel,
    cartao: [...document.querySelectorAll('.reels-cartao.aceso')].map((c) => c.dataset.cartao),
    area: [...document.querySelectorAll('.areas .na-vez')].map((li) => li.dataset.area),
    linha: [...document.querySelectorAll('.reels-fios .luz.acesa')].map((l) => l.dataset.cartao),
    linhas: document.querySelectorAll('.reels-fios .fio').length,
  }));
  const inicio = await estado();
  await page.click('.reels-cartao[data-cartao="google"]');
  const google = await estado();
  await page.click('.reels-cartao[data-cartao="agenda"]');
  const agenda = await estado();
  const topo = await page.evaluate(() => {
    const h = getComputedStyle(document.querySelector('.site-header'));
    return { linha: h.borderBottomColor, fundo: h.backgroundColor, hero: getComputedStyle(document.querySelector('.hero')).backgroundColor };
  });
  await context.close();
  assert.equal(inicio.linhas, 4, 'uma linha do Ponto até cada cartão');
  assert.deepEqual(google, { reel: 'alfinete', cartao: ['google'], area: ['marca'], linha: ['google'], linhas: 4 });
  assert.deepEqual(agenda, { reel: 'semana', cartao: ['agenda'], area: ['sistemas'], linha: ['agenda'], linhas: 4 });
  assert.equal(topo.fundo, topo.hero, 'o cabeçalho não tem o fundo da abertura');
  assert.match(topo.linha, /rgba\(.*, 0\)|transparent/, `o cabeçalho separa da abertura com uma linha: ${topo.linha}`);
});
