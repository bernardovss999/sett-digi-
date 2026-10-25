// Title, description, canonical, JSON-LD, sitemap, robots e llms.txt (sem navegador).
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  SITE_ORIGIN,
  ROOT,
  fileForPath,
  jsonLdBlocks,
  listPublishedPages,
  openingTags,
  pagePath,
  readSite,
} from '../support/site.mjs';

const pages = listPublishedPages();

function metaContent(html, key, value) {
  const tag = openingTags(html).find((t) => t.name === 'meta' && t.attrs[key] === value);
  return tag?.attrs.content ?? null;
}

function canonicalOf(html) {
  const tag = openingTags(html).find((t) => t.name === 'link' && t.attrs.rel === 'canonical');
  return tag?.attrs.href ?? null;
}

function titleOf(html) {
  const m = html.match(/<title>([\s\S]*?)<\/title>/);
  return m ? m[1].trim() : '';
}

describe('metadados obrigatórios', () => {
  for (const rel of pages) {
    test(`${rel}: title, description e canonical presentes e coerentes com o caminho`, () => {
      const html = readSite(rel);
      assert.ok(titleOf(html).length > 0, 'title vazio');
      assert.ok((metaContent(html, 'name', 'description') ?? '').trim().length > 0, 'meta description vazia');
      const canonical = canonicalOf(html);
      assert.ok(canonical, 'canonical ausente');
      assert.equal(canonical, SITE_ORIGIN + pagePath(rel), 'canonical não corresponde ao caminho da página');
    });

    test(`${rel}: og:url e og:title acompanham o canonical`, () => {
      const html = readSite(rel);
      assert.equal(metaContent(html, 'property', 'og:url'), canonicalOf(html));
      assert.ok(metaContent(html, 'property', 'og:title'), 'og:title ausente');
    });

    test(`${rel}: idioma pt-BR, charset e viewport declarados`, () => {
      const html = readSite(rel);
      assert.match(html, /<html[^>]*\slang="pt-BR"/);
      assert.match(html, /<meta\s+charset="utf-8"/i);
      assert.match(metaContent(html, 'name', 'viewport') ?? '', /width=device-width/);
    });

    test(`${rel}: toda imagem tem atributo alt (pode ser vazio para decorativa)`, () => {
      const semAlt = openingTags(readSite(rel)).filter((t) => t.name === 'img' && t.attrs.alt === undefined);
      assert.deepEqual(semAlt.map((t) => t.attrs.src), []);
    });

    test(`${rel}: JSON-LD é JSON válido`, () => {
      for (const block of jsonLdBlocks(readSite(rel))) {
        let parsed;
        assert.doesNotThrow(() => {
          parsed = JSON.parse(block);
        }, 'bloco ld+json não é JSON');
        assert.ok(parsed['@context'], 'JSON-LD sem @context');
      }
    });
  }
});

describe('sitemap e robots', () => {
  const sitemap = readFileSync(join(ROOT, 'sitemap.xml'), 'utf8');
  const robots = readFileSync(join(ROOT, 'robots.txt'), 'utf8');
  const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);

  test('sitemap: cada <loc> pertence ao domínio e aponta para página publicada', () => {
    for (const loc of locs) {
      assert.ok(loc.startsWith(SITE_ORIGIN + '/'), `fora do domínio: ${loc}`);
      const path = new URL(loc).pathname;
      assert.ok(fileForPath(path), `URL do sitemap sem página publicada: ${loc}`);
    }
  });

  test('sitemap: cada URL tem canonical da própria página (mesma URL)', () => {
    for (const loc of locs) {
      const path = new URL(loc).pathname;
      const file = fileForPath(path);
      assert.equal(canonicalOf(readSite(file)), loc, `canonical de ${file} difere do sitemap`);
    }
  });

  test('robots: aponta para o sitemap no mesmo domínio', () => {
    assert.match(robots, new RegExp(`^Sitemap: ${SITE_ORIGIN.replace(/\./g, '\\.')}/sitemap\\.xml$`, 'm'));
  });

  test('robots: não bloqueia páginas publicadas', () => {
    const disallows = [...robots.matchAll(/^Disallow:\s*(\S*)/gm)].map((m) => m[1]);
    for (const rel of pages) {
      const path = pagePath(rel);
      const blocked = disallows.filter((d) => d && path.startsWith(d));
      assert.deepEqual(blocked, [], `${path} bloqueado por robots.txt`);
    }
  });
});

describe('llms.txt', () => {
  test('todo link https://www.sett.company/ do llms.txt aponta para página publicada', () => {
    const txt = readFileSync(join(ROOT, 'llms.txt'), 'utf8');
    const links = [...txt.matchAll(/\]\((https?:\/\/[^)\s]+)\)/g)].map((m) => m[1]);
    assert.ok(links.length > 0, 'llms.txt sem links');
    for (const link of links) {
      assert.ok(link.startsWith(SITE_ORIGIN + '/'), `link fora do domínio: ${link}`);
      assert.ok(fileForPath(new URL(link).pathname), `llms.txt aponta para página inexistente: ${link}`);
    }
  });
});
