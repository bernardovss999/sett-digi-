// Configuração de headers em vercel.json e compatibilidade da CSP com o HTML publicado.
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT, listPublishedPages, inlineScripts, readSite } from '../support/site.mjs';
import { readVercelConfig } from '../../scripts/site-config.mjs';

const config = readVercelConfig();
const globalRule = config.headers.find((rule) => rule.source === '/(.*)');
const headerValue = (key) => globalRule?.headers.find((h) => h.key.toLowerCase() === key.toLowerCase())?.value;

// Decisão em docs/seguranca/README.md: CSP aplicada (não Report-Only) porque as páginas atuais
// passam nos testes de navegador. Se a CSP mudar, atualize também esse documento.
const csp = headerValue('Content-Security-Policy') ?? '';

function directive(name) {
  const found = csp
    .split(';')
    .map((d) => d.trim())
    .find((d) => d.split(/\s+/)[0] === name);
  return found ? found.split(/\s+/).slice(1) : null;
}

const sha256Of = (text) => 'sha256-' + createHash('sha256').update(text, 'utf8').digest('base64');

describe('headers de segurança em vercel.json', () => {
  test('regra global existe em "/(.*)"', () => {
    assert.ok(globalRule, 'sem regra para "/(.*)"');
  });

  test('X-Content-Type-Options é nosniff', () => {
    assert.equal(headerValue('X-Content-Type-Options'), 'nosniff');
  });

  test('X-Frame-Options e frame-ancestors bloqueiam enquadramento por terceiros', () => {
    assert.match(headerValue('X-Frame-Options') ?? '', /^(SAMEORIGIN|DENY)$/);
    assert.deepEqual(directive('frame-ancestors'), ["'self'"]);
  });

  test('Strict-Transport-Security com max-age de pelo menos 1 ano', () => {
    const hsts = headerValue('Strict-Transport-Security') ?? '';
    const maxAge = Number(hsts.match(/max-age=(\d+)/)?.[1] ?? 0);
    assert.ok(maxAge >= 31536000, `max-age insuficiente: "${hsts}"`);
  });

  test('HSTS sem includeSubDomains/preload (subdomínios não inventariados)', () => {
    const hsts = headerValue('Strict-Transport-Security') ?? '';
    assert.doesNotMatch(hsts, /includeSubDomains|preload/);
  });

  test('Referrer-Policy e Permissions-Policy presentes', () => {
    assert.ok(headerValue('Referrer-Policy'));
    assert.ok(headerValue('Permissions-Policy'));
  });
});

describe('CSP', () => {
  test('default-src restrito a self', () => {
    assert.deepEqual(directive('default-src'), ["'self'"]);
  });

  test('script-src sem unsafe-inline nem unsafe-eval', () => {
    const sources = directive('script-src') ?? [];
    assert.ok(!sources.includes("'unsafe-inline'"), 'script-src não pode ter unsafe-inline');
    assert.ok(!sources.includes("'unsafe-eval'"), 'script-src não pode ter unsafe-eval');
  });

  test('script-src libera o host da biblioteca Lenis carregada por script.js', () => {
    const scriptJs = readFileSync(join(ROOT, 'script.js'), 'utf8');
    const hosts = [...scriptJs.matchAll(/src\s*=\s*'(https:\/\/[^/']+)/g)].map((m) => m[1]);
    assert.ok(hosts.length > 0, 'esperado ao menos um host externo em script.js');
    for (const host of hosts) {
      assert.ok((directive('script-src') ?? []).includes(host), `script-src sem ${host}`);
    }
  });

  test('cada <script> inline publicado tem hash na script-src', () => {
    const allowed = new Set(directive('script-src') ?? []);
    const missing = [];
    for (const rel of listPublishedPages()) {
      for (const script of inlineScripts(readSite(rel))) {
        if (script.type && script.type !== 'text/javascript') continue;
        const hash = sha256Of(script.body);
        if (!allowed.has(`'${hash}'`)) missing.push(`${rel}: ${hash}`);
      }
    }
    assert.deepEqual(missing, []);
  });

  test('estilos: style-src permite estilos inline (style="" e <style> usados no projeto)', () => {
    assert.ok((directive('style-src') ?? []).includes("'unsafe-inline'"));
  });

  test('fontes e imagens só do próprio domínio (fontes são hospedadas em /fonts)', () => {
    assert.deepEqual(directive('font-src'), ["'self'"]);
    assert.deepEqual(directive('img-src'), ["'self'"]);
  });

  test('object-src none e base-uri restrita', () => {
    assert.deepEqual(directive('object-src'), ["'none'"]);
    assert.deepEqual(directive('base-uri'), ["'self'"]);
  });
});
