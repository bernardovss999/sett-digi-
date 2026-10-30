// Bug: o título da seção "Política de privacidade" (Sett Agenda/Google) ficava invisível (cor igual ao fundo) e cada cabeçalho tinha tamanho, alinhamento e espaçamento próprios. Todo cabeçalho segue o modelo da página Sites.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { startSite } from '../support/servidor.mjs';

const ROTAS = ['/', '/portfolio/', '/criacao-de-sites/', '/gestao-google-meu-negocio/', '/agentes-de-ia-para-empresas/', '/o-que-fazemos/', '/marca-e-conteudo/', '/sett-agenda.html'];
let site;
let browser;
before(async () => { site = await startSite(); browser = await chromium.launch(); });
after(async () => { await browser?.close(); await site?.close(); });

const MEDE = () => {
  const lum = (c) => { const m = c.match(/[\d.]+/g).map(Number); const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(m[0]) + 0.7152 * f(m[1]) + 0.0722 * f(m[2]); };
  const fundo = (e) => { while (e) { const c = getComputedStyle(e).backgroundColor; const m = c.match(/[\d.]+/g); if (m && (m.length < 4 || +m[3] > 0.5)) return c; e = e.parentElement; } return 'rgb(255,255,255)'; };
  const h1 = document.querySelector('main h1');
  const cs = getComputedStyle(h1);
  const contraste = [...document.querySelectorAll('main h1, main h2')].map((e) => {
    const a = lum(getComputedStyle(e).color); const b = lum(fundo(e));
    return { t: e.textContent.trim().slice(0, 30), c: (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05) };
  }).filter((o) => o.c < 3);
  return { px: parseFloat(cs.fontSize), linha: +(parseFloat(cs.lineHeight) / parseFloat(cs.fontSize)).toFixed(2), alinha: cs.textAlign, contraste, vw: innerWidth };
};

for (const [w, h, alinha] of [[1440, 900, 'left'], [1920, 1080, 'left'], [390, 844, 'center'], [360, 640, 'center']]) {
  test(`${w}x${h}: todo cabeçalho tem a mesma formatação (alinhamento ${alinha}) e nenhum título some`, async () => {
    const context = await browser.newContext({ viewport: { width: w, height: h }, reducedMotion: 'reduce' });
    const page = await context.newPage();
    const medidas = {};
    for (const rota of ROTAS) {
      await page.goto(site.origin + rota, { waitUntil: 'load' });
      medidas[rota] = await page.evaluate(MEDE);
    }
    await context.close();
    const invisiveis = Object.entries(medidas).flatMap(([r, m]) => m.contraste.map((c) => `${r}: "${c.t}" contraste ${c.c.toFixed(1)}`));
    assert.deepEqual(invisiveis, []);
    for (const [rota, m] of Object.entries(medidas)) assert.equal(m.alinha, alinha, `${rota}: alinhamento ${m.alinha}`);
    const linhas = new Set(Object.values(medidas).map((m) => m.linha));
    assert.equal(linhas.size, 1, `entrelinhas diferentes: ${[...linhas]}`);
    // mesmo token de tamanho: só varia o que a largura do título realmente muda (todos usam a mesma fórmula)
    const tamanhos = Object.entries(medidas).map(([r, m]) => `${r}=${m.px}`);
    assert.equal(new Set(Object.values(medidas).map((m) => m.px)).size, 1, `tamanhos diferentes: ${tamanhos.join(' ')}`);
  });
}
