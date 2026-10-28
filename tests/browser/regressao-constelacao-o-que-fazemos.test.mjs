// Pedido de 28/10/2026: a abertura de "O que fazemos" passou por lista de checagem, constelação e visor; na mesma data virou o palco com os agentes do vídeo "Agentes de IA sob medida". Garante os seis agentes, a escolha funcionando, nada sobreposto e tudo dentro da tela.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { startSite } from '../support/servidor.mjs';

let site;
let browser;
before(async () => { site = await startSite(); browser = await chromium.launch(); });
after(async () => { await browser?.close(); await site?.close(); });

for (const [w, h] of [[1902, 977], [1440, 900], [1280, 720], [1024, 768], [390, 844], [360, 640]]) {
  test(`${w}x${h}: palco com os seis agentes, sem sobreposição e dentro da tela`, async () => {
    const celular = w < 800;
    const context = await browser.newContext({ viewport: { width: w, height: h }, isMobile: celular, hasTouch: celular, reducedMotion: 'reduce' });
    const page = await context.newPage();
    await page.goto(site.origin + '/o-que-fazemos/', { waitUntil: 'load' });
    const r = await page.evaluate(() => {
      const el = document.querySelector('.elenco');
      const caixa = el.getBoundingClientRect();
      const partes = ['.elenco-topo', '.elenco-palco', '.elenco-legenda', '.elenco-escolha'].map((s) => el.querySelector(s)).filter((e) => e.getClientRects().length).map((e) => e.getBoundingClientRect());   // em telefone baixo a linha de cima sai
      const cruza = (a, b) => a.bottom > b.top + 1 && b.bottom > a.top + 1 && a.right > b.left + 1 && b.right > a.left + 1;   // em telefone baixo o agente e a legenda ficam lado a lado
      let sobre = 0;
      partes.forEach((a, i) => partes.forEach((b, j) => { if (j > i && cruza(a, b)) sobre += 1; }));
      const ator = el.querySelector('.elenco-ator');
      return {
        agentes: [...el.querySelectorAll('.elenco-escolha button')].map((b) => b.dataset.ator),
        sobre,
        fora: partes.filter((p) => p.top < caixa.top - 1 || p.bottom > caixa.bottom + 1 || p.left < caixa.left - 1 || p.right > caixa.right + 1).length + (caixa.right > innerWidth || caixa.left < 0 ? 1 : 0),
        ator: ator.complete && ator.naturalWidth > 0 && ator.getBoundingClientRect().height > 60,
        antigos: document.querySelectorAll('.ab .perfil, .constelacao, .foco').length,
      };
    });
    await context.close();
    assert.deepEqual(r.agentes, ['atendimento', 'agenda', 'pedidos', 'estoque', 'prospeccao', 'relatorios']);
    assert.equal(r.sobre, 0, 'partes do palco sobrepostas');
    assert.equal(r.fora, 0, 'parte do palco fora da caixa ou da tela');
    assert.equal(r.ator, true, 'o agente em foco não aparece');
    assert.equal(r.antigos, 0, 'uma peça antiga voltou');
  });
}

test('escolher um agente troca o agente em foco, o nome e o que ele faz (clique e teclado)', async () => {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  const page = await context.newPage();
  await page.goto(site.origin + '/o-que-fazemos/', { waitUntil: 'load' });
  await page.click('.elenco-escolha button[data-ator="agenda"]');
  let r = await page.evaluate(() => ({ src: document.querySelector('.elenco-ator').getAttribute('src'), nome: document.querySelector('.elenco-legenda b').textContent, legenda: document.querySelector('.elenco-legenda span').textContent, pressionado: document.querySelector('.elenco-escolha [aria-pressed="true"]').dataset.ator, conta: document.querySelector('.elenco-conta').textContent }));
  assert.deepEqual(r, { src: '/img/agentes/agenda-aberto.webp', nome: 'Agenda', legenda: 'Confirma e remarca horários.', pressionado: 'agenda', conta: '02 / 06' });
  await page.keyboard.press('ArrowRight');
  r = await page.evaluate(() => ({ nome: document.querySelector('.elenco-legenda b').textContent, foco: document.activeElement.dataset.ator }));
  assert.deepEqual(r, { nome: 'Pedidos', foco: 'pedidos' });
  await context.close();
});

test('as etapas da automação e o fecho usam os agentes do vídeo; a faixa "Sob medida. Sob controle." tem as três garantias', async () => {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  const page = await context.newPage();
  await page.goto(site.origin + '/o-que-fazemos/', { waitUntil: 'load' });
  const r = await page.evaluate(() => ({
    etapas: [...document.querySelectorAll('.etapas-agentes img')].map((i) => i.getAttribute('src').split('/').pop()),
    fila: document.querySelectorAll('.elenco-fila img').length,
    garantias: [...document.querySelectorAll('.controle-lista li')].map((li) => li.textContent.trim()),
  }));
  await context.close();
  assert.deepEqual(r.etapas, ['atendimento-aberto.webp', 'estoque-aberto.webp', 'pedidos-aberto.webp', 'relatorios-aberto.webp']);
  assert.equal(r.fila, 7);
  assert.deepEqual(r.garantias, ['Segue as suas regras', 'Seus dados ficam com você', 'Na dúvida, chama você']);
});
