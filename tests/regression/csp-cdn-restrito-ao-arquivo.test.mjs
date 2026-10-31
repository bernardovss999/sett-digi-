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

// 31/10/2026: o Lenis passou a ser servido pelo próprio site (vendor/); a script-src não libera mais nenhuma URL externa.
test('script-src não libera URL externa e script.js só carrega script do próprio site', () => {
  const scriptJs = readFileSync(join(ROOT, 'script.js'), 'utf8');
  assert.deepEqual([...scriptJs.matchAll(/\.src\s*=\s*'(https?:\/\/[^']+)'/g)].map((m) => m[1]), []);
  assert.deepEqual(scriptSrc.filter((s) => /^https?:/.test(s)), []);
  assert.match(scriptJs, /\.src = '\/vendor\/lenis-1\.3\.26\.min\.js'/);
});
