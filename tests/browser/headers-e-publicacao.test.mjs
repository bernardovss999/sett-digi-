// Headers servidos de fato pelo servidor local e arquivos excluídos de .vercelignore não publicados.
import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startSite } from '../support/servidor.mjs';
import { listPublishedPages, pagePath } from '../support/site.mjs';
import { readVercelConfig, vercelIgnoreEntries } from '../../scripts/site-config.mjs';

let site;
before(async () => {
  site = await startSite();
});
after(async () => {
  await site?.close();
});

const globalHeaders = readVercelConfig().headers.find((rule) => rule.source === '/(.*)').headers;

describe('headers servidos', () => {
  for (const rel of listPublishedPages()) {
    test(`${pagePath(rel)} recebe todos os headers globais de vercel.json`, async () => {
      const response = await fetch(site.origin + pagePath(rel));
      assert.equal(response.status, 200);
      for (const { key, value } of globalHeaders) {
        assert.equal(response.headers.get(key.toLowerCase()), value, `header ${key}`);
      }
    });
  }
});

describe('publicação', () => {
  test('entradas de .vercelignore não são servidas (404)', async () => {
    const served = [];
    for (const entry of vercelIgnoreEntries()) {
      const probe = entry.includes('.') ? '/' + entry : '/' + entry + '/';
      const response = await fetch(site.origin + probe);
      if (response.status !== 404) served.push(`${probe} -> ${response.status}`);
    }
    assert.deepEqual(served, []);
  });

  test('a página publicada é servida (controle do próprio teste)', async () => {
    const response = await fetch(site.origin + '/');
    assert.equal(response.status, 200);
  });
});
