// Bug: em sistema de arquivos sem distinção de caixa (Windows/macOS) /Docs/..., /PACKAGE.JSON e /Tests/... eram servidos apesar do .vercelignore
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startSite } from '../support/servidor.mjs';
import { isPublished } from '../../scripts/site-config.mjs';

let site;
before(async () => {
  site = await startSite();
});
after(async () => {
  await site?.close();
});

test('isPublished ignora variações de caixa das entradas de .vercelignore', () => {
  for (const rel of ['Docs/sett/README.md', 'TESTS/static/x.mjs', 'Package.json', 'Sett-Digital-Site.zip', '.GIT/config']) {
    assert.equal(isPublished(rel), false, rel);
  }
});

test('servidor responde 404 a arquivos internos escritos com outra caixa', async () => {
  const served = [];
  for (const path of ['/Docs/sett/README.md', '/PACKAGE.JSON', '/Tests/support/site.mjs', '/Sett-Digital-Site.zip']) {
    const response = await fetch(site.origin + path, { signal: AbortSignal.timeout(3000) });
    if (response.status !== 404) served.push(`${path} -> ${response.status}`);
  }
  assert.deepEqual(served, []);
});
