// Bug: scripts/serve.mjs deixava a requisição pendurada (e derrubaria o processo) com percent-encoding inválido, ex.: GET /%
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startSite } from '../support/servidor.mjs';

let site;
before(async () => {
  site = await startSite();
});
after(async () => {
  await site?.close();
});

test('caminho com percent-encoding inválido recebe 400 em vez de travar', async () => {
  for (const path of ['/%', '/%E0%A4%A']) {
    const response = await fetch(site.origin + path, { signal: AbortSignal.timeout(3000) });
    assert.equal(response.status, 400, path);
  }
});

test('o servidor continua respondendo depois de um caminho inválido', async () => {
  await fetch(site.origin + '/%', { signal: AbortSignal.timeout(3000) }).catch(() => {});
  const response = await fetch(site.origin + '/', { signal: AbortSignal.timeout(3000) });
  assert.equal(response.status, 200);
});
