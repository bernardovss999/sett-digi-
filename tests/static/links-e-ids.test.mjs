// Links internos, âncoras, ids duplicados e arquivos referenciados (sem navegador).
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  fileForPath,
  idsOf,
  listPublishedPages,
  pagePath,
  readSite,
  referencesOf,
  resolveLocal,
} from '../support/site.mjs';

const pages = listPublishedPages();

describe('links internos e âncoras', () => {
  for (const rel of pages) {
    test(`${rel}: links internos apontam para página publicada existente`, () => {
      const html = readSite(rel);
      const problems = [];
      for (const ref of referencesOf(html).filter((r) => r.kind === 'link')) {
        const target = resolveLocal(ref.value, pagePath(rel));
        if (target === null) continue;
        if (target.invalid) {
          problems.push(`href inválido: ${ref.value}`);
          continue;
        }
        const file = fileForPath(target.pathname);
        if (!file) problems.push(`destino inexistente: ${ref.value}`);
      }
      assert.deepEqual(problems, []);
    });

    test(`${rel}: fragmentos (#id) internos existem no destino`, () => {
      const html = readSite(rel);
      const problems = [];
      for (const ref of referencesOf(html).filter((r) => r.kind === 'link')) {
        const target = resolveLocal(ref.value, pagePath(rel));
        if (!target || target.invalid || !target.hash) continue;
        const file = fileForPath(target.pathname);
        if (!file || !file.endsWith('.html')) continue;
        if (!idsOf(readSite(file)).includes(target.hash)) {
          problems.push(`âncora ausente em ${file}: #${target.hash}`);
        }
      }
      assert.deepEqual(problems, []);
    });
  }
});

describe('ids', () => {
  for (const rel of pages) {
    test(`${rel}: não há id duplicado`, () => {
      const ids = idsOf(readSite(rel));
      const seen = new Set();
      const duplicated = new Set();
      for (const id of ids) {
        if (seen.has(id)) duplicated.add(id);
        seen.add(id);
      }
      assert.deepEqual([...duplicated], []);
    });
  }
});

describe('arquivos referenciados', () => {
  for (const rel of pages) {
    test(`${rel}: stylesheet, script, imagem, fonte e og:image existem`, () => {
      const html = readSite(rel);
      const missing = [];
      for (const ref of referencesOf(html).filter((r) => r.kind === 'resource')) {
        // Externos (CDN, fontes de terceiros) não existem no repositório: fora deste teste.
        const target = resolveLocal(ref.value, pagePath(rel));
        if (!target || target.invalid) continue;
        if (!fileForPath(target.pathname)) missing.push(`${ref.tag} ${ref.value}`);
      }
      assert.deepEqual(missing, []);
    });
  }
});
