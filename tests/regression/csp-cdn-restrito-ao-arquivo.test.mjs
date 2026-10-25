// Fraqueza: script-src liberava https://cdn.jsdelivr.net inteiro (qualquer pacote npm/GitHub), não só o arquivo Lenis que script.js carrega
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT, readVercelConfig } from '../../scripts/site-config.mjs';

const csp = readVercelConfig()
  .headers.find((rule) => rule.source === '/(.*)')
  .headers.find((h) => h.key === 'Content-Security-Policy').value;
const scriptSrc = csp
  .split(';')
  .map((d) => d.trim().split(/\s+/))
  .find(([name]) => name === 'script-src')
  .slice(1);

test('script-src não libera host externo inteiro (só URL com caminho)', () => {
  const hostsAbertos = scriptSrc.filter((s) => /^https:\/\/[^/]+\/?$/.test(s));
  assert.deepEqual(hostsAbertos, []);
});

test('script-src libera exatamente a URL externa carregada por script.js', () => {
  const scriptJs = readFileSync(join(ROOT, 'script.js'), 'utf8');
  const urls = [...scriptJs.matchAll(/\.src\s*=\s*'(https:\/\/[^']+)'/g)].map((m) => m[1]);
  assert.ok(urls.length > 0, 'script.js deixou de carregar script externo; revise este teste');
  for (const url of urls) assert.ok(scriptSrc.includes(url), `script-src sem ${url}`);
});
