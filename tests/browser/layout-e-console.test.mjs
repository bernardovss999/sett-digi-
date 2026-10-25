// Testes de navegador (Chromium via Playwright): overflow horizontal e erros de console/CSP.
// Dados sintéticos: o site não recebe formulário nem dados pessoais, então nada é enviado.
import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { startSite } from '../support/servidor.mjs';
import { VIEWPORTS } from '../../scripts/site-config.mjs';
import { listPublishedPages, pagePath } from '../support/site.mjs';

const pages = listPublishedPages();
let site;
let browser;

before(async () => {
  site = await startSite();
  browser = await chromium.launch();
});

after(async () => {
  await browser?.close();
  await site?.close();
});

// reducedMotion 'reduce' estabiliza a medição de overflow; o teste de console usa o padrão
// para que script.js carregue a biblioteca de rolagem suave e a CSP seja exercitada de verdade.
async function openPage(viewport, rel, { onConsole, reducedMotion = 'reduce' } = {}) {
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    deviceScaleFactor: 1,
    reducedMotion,
  });
  const page = await context.newPage();
  if (onConsole) {
    page.on('console', (msg) => msg.type() === 'error' && onConsole(`console: ${msg.text()}`));
    page.on('pageerror', (err) => onConsole(`pageerror: ${err.message}`));
    page.on('requestfailed', (req) => onConsole(`requestfailed: ${req.url()} ${req.failure()?.errorText ?? ''}`));
  }
  await page.goto(site.origin + pagePath(rel), { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  return { context, page };
}

describe('overflow horizontal', () => {
  for (const viewport of VIEWPORTS) {
    for (const rel of pages) {
      test(`${rel} em ${viewport.width}px (${viewport.name}) não tem rolagem horizontal`, async () => {
        const { context, page } = await openPage(viewport, rel);
        try {
          const result = await page.evaluate(() => {
            const width = document.documentElement.clientWidth;
            const found = [];
            for (const el of document.querySelectorAll('body *')) {
              const box = el.getBoundingClientRect();
              if (box.width > 0 && box.right > width + 1) {
                const label = el.id ? '#' + el.id : el.tagName.toLowerCase() + (el.className ? '.' + String(el.className).split(' ')[0] : '');
                found.push({ label, right: Math.round(box.right) });
              }
            }
            // Os mais à direita primeiro: é o que costuma estourar a página.
            found.sort((a, b) => b.right - a.right);
            const offenders = found.slice(0, 5).map((f) => `${f.label} right=${f.right}`);
            return { scrollWidth: document.documentElement.scrollWidth, width, offenders };
          });
          assert.ok(
            result.scrollWidth <= result.width,
            `scrollWidth ${result.scrollWidth} > largura ${result.width}; elementos: ${result.offenders.join(', ') || 'nenhum identificado'}`,
          );
        } finally {
          await context.close();
        }
      });
    }
  }
});

describe('console', () => {
  for (const rel of pages) {
    test(`${rel} carrega sem erro de console, exceção ou violação de CSP`, async () => {
      const problems = [];
      const { context, page } = await openPage(VIEWPORTS[2], rel, {
        onConsole: (problem) => problems.push(problem),
        reducedMotion: 'no-preference',
      });
      try {
        // Dá tempo para script.js inserir a biblioteca externa; falha de CSP aparece como erro de console.
        await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
        assert.deepEqual(problems, []);
      } finally {
        await context.close();
      }
    });
  }
});
