// Bug: seções pequenas e desiguais (menos que uma tela), rolagem horizontal em celulares/monitores variados, faixa de explicações no portfólio da home e a seção "Uma conversa, um caminho" no início do site. Cada seção deve ter pelo menos a altura de uma tela em qualquer tamanho.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { startSite } from '../support/servidor.mjs';

const TELAS = [
  [1280, 720], [1366, 768], [1440, 900], [1920, 1080], [2560, 1440],
  [360, 640], [375, 667], [390, 844], [412, 915], [430, 932],
];
const ROTAS = ['/', '/portfolio/', '/criacao-de-sites/', '/gestao-google-meu-negocio/', '/agentes-de-ia-para-empresas/', '/o-que-fazemos/', '/marca-e-conteudo/', '/sett-agenda.html'];

let site;
let browser;
before(async () => { site = await startSite(); browser = await chromium.launch(); });
after(async () => { await browser?.close(); await site?.close(); });

for (const [w, h] of TELAS) {
  test(`${w}x${h}: toda seção tem pelo menos uma tela, sem rolagem horizontal e com topo opaco`, async () => {
    const context = await browser.newContext({ viewport: { width: w, height: h }, reducedMotion: 'reduce' });
    const page = await context.newPage();
    const falhas = [];
    for (const rota of ROTAS) {
      await page.goto(site.origin + rota, { waitUntil: 'load' });
      const r = await page.evaluate(() => {
        const topo = document.querySelector('.site-header').getBoundingClientRect().height;
        return {
          menor: Math.min(...[...document.querySelectorAll('main > section')].map((s) => s.getBoundingClientRect().height)),
          tela: innerHeight - topo,
          largura: document.documentElement.scrollWidth - document.documentElement.clientWidth,
          fundoTopo: getComputedStyle(document.querySelector('.site-header')).backgroundColor,
        };
      });
      if (r.menor < r.tela - 2) falhas.push(`${rota}: seção de ${Math.round(r.menor)}px < tela ${Math.round(r.tela)}px`);
      if (r.largura > 0) falhas.push(`${rota}: rolagem horizontal de ${r.largura}px`);
      if (!/^rgb\(/.test(r.fundoTopo)) falhas.push(`${rota}: topo translúcido (${r.fundoTopo})`);
    }
    await context.close();
    assert.deepEqual(falhas, []);
  });
}

test('home: portfólio simples e sem a seção "Uma conversa, um caminho"', async () => {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  const page = await context.newPage();
  await page.goto(site.origin + '/', { waitUntil: 'load' });
  const r = await page.evaluate(() => ({
    explicacao: document.querySelectorAll('.galeria-lista').length,
    // 30/10/2026: o link do portfólio fica no pé da cena "Sites que facilitam o contato"
    explorar: !!document.querySelector('#portfolio .sc-pe a[href="/portfolio/"]'),
    processo: !!document.querySelector('#processo'),
    primeira: document.querySelector('main > section').id || document.querySelector('main > section').className,
  }));
  await context.close();
  assert.equal(r.explicacao, 0);
  assert.ok(r.explorar);
  assert.equal(r.processo, false);
});
