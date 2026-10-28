// Bug: com o celular em modo escuro, navegadores que escurecem páginas sozinhos (Chrome com "tema escuro para sites", Samsung Internet) invertiam as cores do site. O site deve ficar idêntico no modo claro e no escuro.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { startSite } from '../support/servidor.mjs';

const ROTAS = ['/', '/portfolio/', '/criacao-de-sites/', '/gestao-google-meu-negocio/', '/agentes-de-ia-para-empresas/', '/o-que-fazemos/', '/sett-agenda.html'];
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

async function foto(browser, esquema, rota) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, colorScheme: esquema, reducedMotion: 'reduce' });
  const page = await context.newPage();
  await page.goto(site.origin + rota, { waitUntil: 'load' });
  await page.addStyleTag({ content: '*{animation:none!important;transition:none!important}' });
  await page.waitForTimeout(150);
  const png = await page.screenshot();
  await context.close();
  return png;
}

for (const rota of ROTAS) {
  test(`${rota}: igual com o celular em modo claro e em modo escuro`, async () => {
    const a = await foto(claro, 'light', rota);
    const b = await foto(escuro, 'dark', rota);
    assert.ok(a.equals(b), 'a página mudou com o modo escuro do aparelho');
  });
}
