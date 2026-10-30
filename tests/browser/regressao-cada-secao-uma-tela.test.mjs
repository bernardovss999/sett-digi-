// Bug: no celular e em notebook várias seções passavam da altura da tela (prévias do portfólio, política da Sett Agenda, possibilidades dos agentes, listas de serviços). Regra do site: toda seção tem EXATAMENTE a altura da tela, e nada dentro dela fica cortado; o que não cabe anda para o lado (trilhos).
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { startSite } from '../support/servidor.mjs';

const ROTAS = ['/', '/portfolio/', '/criacao-de-sites/', '/gestao-google-meu-negocio/', '/agentes-de-ia-para-empresas/', '/o-que-fazemos/', '/marca-e-conteudo/', '/sett-agenda.html'];
// celulares (do Android de 640px ao iPhone Pro Max), tablet em pé e computadores
const TELAS = [[360, 640], [375, 667], [390, 844], [412, 915], [430, 932], [768, 1024], [1280, 720], [1366, 768], [1440, 900], [1536, 864], [1920, 1080], [2560, 1440]];

let site;
let browser;
before(async () => { site = await startSite(); browser = await chromium.launch(); });
after(async () => { await browser?.close(); await site?.close(); });

for (const [w, h] of TELAS) {
  test(`${w}x${h}: cada seção de cada página tem a altura da tela e nada dentro dela fica cortado`, async () => {
    const celular = w < 800;
    const context = await browser.newContext({ viewport: { width: w, height: h }, isMobile: celular, hasTouch: celular, reducedMotion: 'reduce' });
    const page = await context.newPage();
    const falhas = [];
    for (const rota of ROTAS) {
      await page.goto(site.origin + rota, { waitUntil: 'load' });
      const r = await page.evaluate(() => {
        const tela = innerHeight - document.querySelector('.site-header').getBoundingClientRect().height;
        const out = [];
        for (const s of document.querySelectorAll('main > section')) {
          const nome = s.id || s.className.split(' ')[0];
          const b = s.getBoundingClientRect();
          if (Math.abs(b.height - tela) > 2) out.push(`${nome}: ${Math.round(b.height)}px numa tela de ${Math.round(tela)}px`);
          // texto e botões visíveis não podem passar da base nem do topo da seção
          // (fora: o que rola dentro de um cartão e o que some num degradê de propósito)
          const cortados = [...s.querySelectorAll('h1, h2, h3, p, li, a, button, img, summary')].filter((e) => {
            if (!e.getClientRects().length || getComputedStyle(e).visibility === 'hidden') return false;
            if (e.closest('details:not([open])') && !e.closest('summary')) return false;   // resposta fechada da FAQ
            // a parte visível: o elemento recortado por cada ancestral que corta (moldura, cartão, trilho)
            let r = e.getBoundingClientRect();
            let v = { top: r.top, bottom: r.bottom, left: r.left, right: r.right };
            for (let p = e.parentElement; p && p !== s; p = p.parentElement) {
              const c = getComputedStyle(p);
              if (/(auto|scroll)/.test(c.overflowY) || (c.maskImage && c.maskImage !== 'none') || p.getAttribute('aria-hidden') === 'true') return false;
              if (/(hidden|clip|auto|scroll)/.test(c.overflowX + c.overflowY)) {
                const q = p.getBoundingClientRect();
                v = { top: Math.max(v.top, q.top), bottom: Math.min(v.bottom, q.bottom), left: Math.max(v.left, q.left), right: Math.min(v.right, q.right) };
              }
            }
            if (v.bottom - v.top < 1 || v.right - v.left < 1) return false;   // fora da vista de propósito (outro cartão do trilho)
            return v.bottom > b.bottom + 1 || v.top < b.top - 1;
          });
          if (cortados.length) out.push(`${nome}: cortado ${cortados.slice(0, 3).map((e) => `<${e.tagName.toLowerCase()}> "${(e.textContent || e.alt || '').trim().slice(0, 30)}"`).join(', ')}`);
        }
        return out;
      });
      falhas.push(...r.map((x) => `${rota} ${x}`));
    }
    await context.close();
    assert.deepEqual(falhas, []);
  });
}

test('celular: a rolagem vertical é livre (sem trava de tela em tela)', async () => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const page = await context.newPage();
  await page.goto(site.origin + '/', { waitUntil: 'load' });
  const r = await page.evaluate(() => ({
    html: getComputedStyle(document.documentElement).scrollSnapType,
    presas: [...document.querySelectorAll('main > section')].filter((s) => getComputedStyle(s).scrollSnapStop === 'always').length,
  }));
  await context.close();
  assert.doesNotMatch(r.html, /\by\b|block|both/);
  assert.equal(r.presas, 0);
});

test('listas que andam para o lado têm um ponto por cartão e chegam ao último cartão', async () => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, reducedMotion: 'reduce' });
  const page = await context.newPage();
  const falhas = [];
  for (const rota of ['/', '/portfolio/', '/o-que-fazemos/', '/agentes-de-ia-para-empresas/', '/sett-agenda.html']) {
    await page.goto(site.origin + rota, { waitUntil: 'load' });
    const r = await page.evaluate(async () => {
      const out = [];
      for (const t of document.querySelectorAll('.service-list, .ex-lista, .process-track, .caminho, .termo, .caso-trilho, .politica')) {
        if (t.scrollWidth <= t.clientWidth + 1) continue;
        const pontos = t.nextElementSibling?.classList.contains('trilho-pontos') ? t.nextElementSibling.children.length : 0;
        if (pontos !== t.children.length) out.push(`${t.className}: ${pontos} pontos para ${t.children.length} cartões`);
        t.scrollLeft = t.scrollWidth;
        await new Promise((ok) => setTimeout(ok, 60));
        const ultimo = t.lastElementChild.getBoundingClientRect();
        if (ultimo.right > innerWidth + 1) out.push(`${t.className}: o último cartão não chega à tela`);
        if (!t.nextElementSibling.lastElementChild.classList.contains('atual')) out.push(`${t.className}: o ponto do último cartão não acende`);
      }
      return out;
    });
    falhas.push(...r.map((x) => `${rota} ${x}`));
  }
  await context.close();
  assert.deepEqual(falhas, []);
});
