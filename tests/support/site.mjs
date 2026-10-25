// Utilitários dos testes estáticos: leitura do site publicado e análise de HTML por regex.
// Sem parser externo: o HTML do projeto é estático e controlado. Se a marcação ficar complexa
// a ponto de a regex errar, troque por um parser em vez de afrouxar a asserção.
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { ROOT, SITE_ORIGIN, isPublished } from '../../scripts/site-config.mjs';

const SKIP_DIRS = new Set(['.git', 'node_modules', 'test-results', 'playwright-report']);

export function listPublishedFiles(dir = ROOT) {
  const out = [];
  for (const name of readdirSync(dir)) {
    if (SKIP_DIRS.has(name)) continue;
    const full = join(dir, name);
    const rel = relative(ROOT, full).split(sep).join('/');
    if (!isPublished(rel)) continue;
    if (statSync(full).isDirectory()) out.push(...listPublishedFiles(full));
    else out.push(rel);
  }
  return out.sort();
}

export function listPublishedPages() {
  return listPublishedFiles().filter((rel) => rel.endsWith('.html'));
}

// index.html -> /, portfolio/index.html -> /portfolio/, sett-agenda.html -> /sett-agenda.html
export function pagePath(rel) {
  if (rel === 'index.html') return '/';
  if (rel.endsWith('/index.html')) return '/' + rel.slice(0, -'index.html'.length);
  return '/' + rel;
}

export function readSite(rel) {
  return readFileSync(join(ROOT, rel), 'utf8');
}

export function stripComments(html) {
  return html.replace(/<!--[\s\S]*?-->/g, '');
}

const ATTR = /([^\s"'<>\/=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;

function decodeEntities(value) {
  return value.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
}

function parseAttributes(raw) {
  const attrs = {};
  for (const m of raw.matchAll(ATTR)) {
    const value = m[2] ?? m[3] ?? m[4] ?? '';
    attrs[m[1].toLowerCase()] = decodeEntities(value);
  }
  return attrs;
}

// Todas as tags de abertura (com atributos) do HTML, sem comentários.
export function openingTags(html) {
  const tags = [];
  for (const m of stripComments(html).matchAll(/<([a-zA-Z][a-zA-Z0-9-]*)\b([^>]*)>/g)) {
    tags.push({ name: m[1].toLowerCase(), attrs: parseAttributes(m[2]) });
  }
  return tags;
}

// Conteúdo bruto de <script> sem src (executado pelo navegador).
export function inlineScripts(html) {
  const out = [];
  for (const m of stripComments(html).matchAll(/<script(\s[^>]*)?>([\s\S]*?)<\/script>/g)) {
    const attrs = parseAttributes(m[1] ?? '');
    if (!('src' in attrs)) out.push({ type: attrs.type ?? '', body: m[2] });
  }
  return out;
}

export function jsonLdBlocks(html) {
  return [...stripComments(html).matchAll(/<script\s+type="application\/ld\+json"\s*>([\s\S]*?)<\/script>/g)].map(
    (m) => m[1],
  );
}

export function idsOf(html) {
  return openingTags(html)
    .map((tag) => tag.attrs.id)
    .filter((id) => id !== undefined);
}

// Referências a arquivos e páginas que o navegador ou o usuário seguem.
export function referencesOf(html) {
  const refs = [];
  for (const { name, attrs } of openingTags(html)) {
    if (name === 'a' && attrs.href) refs.push({ kind: 'link', tag: name, value: attrs.href });
    if (name === 'link' && attrs.href) refs.push({ kind: 'resource', tag: name, value: attrs.href, rel: attrs.rel });
    if ((name === 'script' || name === 'img' || name === 'source') && attrs.src) {
      refs.push({ kind: 'resource', tag: name, value: attrs.src });
    }
    if ((name === 'img' || name === 'source') && attrs.srcset) {
      for (const candidate of attrs.srcset.split(',')) {
        const url = candidate.trim().split(/\s+/)[0];
        if (url) refs.push({ kind: 'resource', tag: name, value: url });
      }
    }
    if (name === 'meta' && (attrs.property === 'og:image' || attrs.name === 'twitter:image') && attrs.content) {
      refs.push({ kind: 'resource', tag: name, value: attrs.content });
    }
  }
  return refs;
}

// Resolve uma referência de página para caminho publicado. Retorna null para externos.
// Entrada: href/src da página de origem (caminho de URL, ex.: '/portfolio/').
export function resolveLocal(value, fromPagePath) {
  if (/^(mailto:|tel:|javascript:|data:)/i.test(value)) return null;
  let url;
  try {
    url = new URL(value, SITE_ORIGIN + fromPagePath);
  } catch {
    return { invalid: true, value };
  }
  if (url.origin !== SITE_ORIGIN) return null;
  return { pathname: decodeURIComponent(url.pathname), hash: decodeURIComponent(url.hash.slice(1)) };
}

// Mapeia caminho de URL para arquivo publicado existente, ou null.
export function fileForPath(pathname) {
  const clean = pathname.replace(/^\/+/, '');
  const candidates = pathname.endsWith('/') ? [clean + 'index.html'] : [clean, clean + '/index.html'];
  for (const candidate of candidates) {
    if (existsSync(join(ROOT, candidate)) && statSync(join(ROOT, candidate)).isFile() && isPublished(candidate)) {
      return candidate;
    }
  }
  return null;
}

export { ROOT, SITE_ORIGIN };
