// Bug: no celular o portfólio da home ("Ideias que ganham vida na tela") era um leque inclinado que saía da tela, com cartas sobrepostas difíceis de tocar, a vitrine ocupava a tela inteira e "Explorar portfólio" ficava escondido. Agora é uma fila de cartões iguais em toda tela.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { startSite } from '../support/servidor.mjs';

let site;
let browser;
before(async () => { site = await startSite(); browser = await chromium.launch(); });
after(async () => { await browser?.close(); await site?.close(); });

const CELULARES = [[320, 568], [360, 640], [375, 667], [390, 844], [412, 915], [430, 932]];

for (const [w, h] of CELULARES) {
  test(`${w}x${h}: cartões lado a lado sem sobrepor, o primeiro inteiro, cada um tocável, e "Explorar portfólio" na tela`, async () => {
    const context = await browser.newContext({ viewport: { width: w, height: h }, isMobile: true, hasTouch: true, reducedMotion: 'reduce' });
    const page = await context.newPage();
    await page.goto(site.origin + '/', { waitUntil: 'load' });
    await page.waitForTimeout(500);   // a página segura a primeira seção até assentar (ou até a pessoa mexer); a rolagem daqui é por código
    await page.evaluate(() => { const s = document.querySelector('#portfolio'); scrollTo(0, s.offsetTop - document.querySelector('.site-header').offsetHeight); });
    const r = await page.evaluate(async () => {
      const cartas = [...document.querySelectorAll('.leque-carta')];
      const caixas = cartas.map((c) => c.getBoundingClientRect());
      const sobre = caixas.some((a, i) => caixas.some((b, j) => j > i && a.right > b.left + 1 && b.right > a.left + 1));
      const lista = document.querySelector('.leque-lista');
      const tocaveis = [];
      for (const c of cartas) {
        c.scrollIntoView({ inline: 'start', block: 'nearest' });
        await new Promise((ok) => setTimeout(ok, 50));
        const b = c.getBoundingClientRect();
        const alvo = document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 3);
        tocaveis.push(c.contains(alvo));
      }
      lista.scrollLeft = 0;
      const pe = document.querySelector('.leque-pe .button').getBoundingClientRect();
      return {
        sobre,
        primeira: { l: caixas[0].left, r: caixas[0].right },
        desliza: lista.scrollWidth > lista.clientWidth,
        tocaveis,
        rolagemPagina: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        pe: pe.bottom, tela: innerHeight,
        inclinada: cartas.some((c) => getComputedStyle(c).transform !== 'none'),
      };
    });
    await context.close();
    assert.equal(r.sobre, false, 'cartões sobrepostos');
    assert.ok(r.primeira.l >= 0 && r.primeira.r <= w, `primeiro cartão corta: ${r.primeira.l}–${r.primeira.r}`);
    assert.equal(r.desliza, true, 'a fila deveria deslizar para o lado');
    assert.deepEqual(r.tocaveis, [true, true, true, true, true]);
    assert.equal(r.rolagemPagina, 0, 'página com rolagem horizontal');
    assert.ok(r.pe <= r.tela, `"Explorar portfólio" abaixo da tela (${r.pe} > ${r.tela})`);
    assert.equal(r.inclinada, false, 'cartão inclinado (o leque antigo voltou)');
  });
}

for (const [w, h] of [[390, 844], [360, 640]]) {
  test(`${w}x${h}: tocar abre a vitrine como caixa (com o site em volta), não em tela cheia`, async () => {
    const context = await browser.newContext({ viewport: { width: w, height: h }, isMobile: true, hasTouch: true, reducedMotion: 'reduce' });
    const page = await context.newPage();
    await page.goto(site.origin + '/', { waitUntil: 'load' });
    await page.locator('.leque-carta').first().scrollIntoViewIfNeeded();
    await page.locator('.leque-carta').first().tap();
    const r = await page.evaluate(() => {
      const b = document.querySelector('.vitrine').getBoundingClientRect();
      const fecha = document.querySelector('.vitrine-fecha').getBoundingClientRect();
      const vivo = document.querySelector('.vitrine-vivo').getBoundingClientRect();
      return { aberta: document.querySelector('.vitrine').open, l: b.left, r: innerWidth - b.right, t: b.top, b: innerHeight - b.bottom, fecha: fecha.top >= b.top && fecha.right <= b.right, vivo: vivo.bottom <= b.bottom + 1, conta: getComputedStyle(document.querySelector('.vitrine-escolha'), '::before').content };
    });
    await context.close();
    assert.equal(r.aberta, true);
    assert.ok(r.l >= 12 && r.r >= 12 && r.t >= 12 && r.b >= 12, `vitrine encosta na borda: ${JSON.stringify(r)}`);
    assert.ok(r.fecha && r.vivo, 'botão de fechar ou do site fora da caixa');
    assert.equal(r.conta, '"1 de 5"');
  });
}

for (const [w, h] of [[1024, 768], [1280, 720], [1440, 900], [1920, 1080]]) {
  test(`${w}x${h}: no computador as cinco prévias ficam numa linha só, iguais e sem sobrepor`, async () => {
    const context = await browser.newContext({ viewport: { width: w, height: h }, reducedMotion: 'reduce' });
    const page = await context.newPage();
    await page.goto(site.origin + '/', { waitUntil: 'load' });
    const r = await page.evaluate(() => {
      const c = [...document.querySelectorAll('.leque-carta')].map((e) => e.getBoundingClientRect());
      const lista = document.querySelector('.leque-lista');
      return { topos: new Set(c.map((x) => Math.round(x.top))).size, larguras: new Set(c.map((x) => Math.round(x.width))).size, sobre: c.some((a, i) => i && a.left < c[i - 1].right), desliza: lista.scrollWidth > lista.clientWidth + 1 };
    });
    await context.close();
    assert.equal(r.topos, 1, 'prévias em alturas diferentes');
    assert.equal(r.larguras, 1, 'prévias de tamanhos diferentes');
    assert.equal(r.sobre, false);
    assert.equal(r.desliza, false, 'no computador a fila não precisa deslizar');
  });
}
