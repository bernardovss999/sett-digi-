// Bug: com o celular em modo escuro, navegadores que escurecem páginas sozinhos (Chrome com "tema escuro para sites", Samsung Internet) invertiam as cores do site. O site deve ficar idêntico no modo claro e no escuro.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { startSite } from '../support/servidor.mjs';

const ROTAS = ['/', '/portfolio/', '/criacao-de-sites/', '/gestao-google-meu-negocio/', '/agentes-de-ia-para-empresas/', '/o-que-fazemos/', '/marca-e-conteudo/', '/sett-agenda.html'];
let site;
let claro;
let escuro;
before(async () => {
  site = await startSite();
  claro = await chromium.launch();
  // o escurecimento automático do Chrome (o mesmo do "tema escuro para sites" do Android)
  escuro = await chromium.launch({ args: ['--blink-settings=forceDarkModeEnabled=true', '--enable-features=WebContentsForceDark'] });
});
after(async () => { await claro?.close(); await escuro?.close(); await site?.close(); });

// 30/10/2026 (pedido do dono: "inalterável no modo claro e no escuro, no computador e no celular"): a comparação passou
// a valer também no computador e em TODAS as seções de cada página, não só na primeira tela do celular.
const APARELHOS = [
  ['celular', { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }],
  ['computador', { viewport: { width: 1440, height: 900 } }],
];

async function fotos(browser, esquema, rota, aparelho) {
  const context = await browser.newContext({ ...aparelho, colorScheme: esquema, reducedMotion: 'reduce' });
  const page = await context.newPage();
  await page.goto(site.origin + rota, { waitUntil: 'load' });
  // 31/10/2026: os Reels da abertura tocam sozinhos em todo aparelho; o quadro do vídeo muda entre as duas fotos, então
  // o vídeo sai da foto (fica o pôster, que é imagem e entra na comparação)
  await page.addStyleTag({ content: '*{animation:none!important;transition:none!important} .reel video{visibility:hidden!important}' });
  // a página segura a primeira tela até a primeira mexida da pessoa (script.js, item 0): o gesto libera a rolagem
  await page.evaluate(() => window.dispatchEvent(new WheelEvent('wheel')));
  const n = await page.evaluate(() => document.querySelectorAll('main > section').length);
  const pngs = [];
  for (let i = 0; i < n; i++) {
    await page.evaluate((i) => {
      const s = document.querySelectorAll('main > section')[i];
      window.scrollTo({ top: s.getBoundingClientRect().top + scrollY - document.querySelector('.site-header').offsetHeight, behavior: 'instant' });
    }, i);
    await page.waitForTimeout(150);
    // a seção no mesmo estado nas duas fotos: todas as aparições no fim (o que se compara é a cor), as imagens que estão
    // de fato na tela carregadas (dentro da largura também: as dos trilhos fora da vista só baixam quando chegam)
    await page.evaluate(() => document.querySelectorAll('.reveal').forEach((e) => e.classList.add('is-visible')));
    await page.waitForFunction(() => [...document.images].filter((img) => {
      const r = img.getBoundingClientRect();
      return r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth && r.width > 0;
    }).every((img) => img.complete), null, { timeout: 8000 }).catch(() => {});
    await page.evaluate(() => document.fonts.ready.then(() => new Promise((ok) => requestAnimationFrame(() => requestAnimationFrame(ok)))));
    pngs.push(await page.screenshot());
  }
  await context.close();
  return pngs;
}

// Duas instâncias do navegador (uma com o escurecimento forçado) às vezes rasterizam diferente um ou outro pixel de uma
// imagem reduzida (as capturas das prévias). Isso não é o bug: o escurecimento inverte as cores da tela quase inteira.
// Conta os pixels que mudaram de verdade (algum canal com mais de 24 de diferença) e aceita até 0,02% da tela.
async function pixelsDiferentes(x, y) {
  const page = await claro.newPage();
  const r = await page.evaluate(async ([p, q]) => {
    const carrega = (src) => new Promise((ok) => { const i = new Image(); i.onload = () => ok(i); i.src = src; });
    const [i1, i2] = await Promise.all([carrega(p), carrega(q)]);
    const dados = (img) => { const c = document.createElement('canvas'); c.width = img.width; c.height = img.height; const g = c.getContext('2d'); g.drawImage(img, 0, 0); return g.getImageData(0, 0, c.width, c.height).data; };
    const d1 = dados(i1); const d2 = dados(i2);
    let n = 0;
    for (let k = 0; k < d1.length; k += 4) if (Math.max(Math.abs(d1[k] - d2[k]), Math.abs(d1[k + 1] - d2[k + 1]), Math.abs(d1[k + 2] - d2[k + 2])) > 24) n += 1;
    return { n, total: d1.length / 4 };
  }, [`data:image/png;base64,${x.toString('base64')}`, `data:image/png;base64,${y.toString('base64')}`]);
  await page.close();
  return { fracao: r.n / r.total };
}

for (const [nome, aparelho] of APARELHOS) {
  for (const rota of ROTAS) {
    test(`${rota}: igual no ${nome} em modo claro e em modo escuro, seção por seção`, async () => {
      const a = await fotos(claro, 'light', rota, aparelho);
      const b = await fotos(escuro, 'dark', rota, aparelho);
      assert.equal(a.length, b.length);
      const diferentes = [];
      for (let i = 0; i < a.length; i++) {
        if (a[i].equals(b[i])) continue;
        const px = await pixelsDiferentes(a[i], b[i]);
        if (px.fracao > 0.0002) diferentes.push(`${i + 1} (${(px.fracao * 100).toFixed(3)}% da tela)`);
      }
      assert.deepEqual(diferentes, [], `seções que mudaram com o modo escuro: ${diferentes.join(', ')}`);
    });
  }
}
