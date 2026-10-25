// Configuração compartilhada entre o servidor local e a suíte de testes.
// Fonte única de verdade para: o que é publicado (.vercelignore) e os headers (vercel.json).
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

export const ROOT = fileURLToPath(new URL('..', import.meta.url));

export const SITE_ORIGIN = 'https://www.sett.company';

export const VIEWPORTS = [
  { name: 'celular', width: 390, height: 844 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1440, height: 900 },
];

function readLines(file) {
  return readFileSync(join(ROOT, file), 'utf8')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'));
}

// .vercelignore aqui usa só caminhos exatos ou pastas (sem curingas), para que a regra seja
// verificável sem interpretador de glob. Um teste garante essa restrição.
const IGNORED = readLines('.vercelignore').map((entry) => entry.replace(/^\/+/, '').replace(/\/+$/, ''));

export function isPublished(relPath) {
  // Sem distinção de caixa: em Windows/macOS /Docs/x abre docs/x, então o servidor local não pode ser contornado por isso.
  const rel = relPath.split('\\').join('/').toLowerCase();
  return !IGNORED.some((entry) => rel === entry.toLowerCase() || rel.startsWith(entry.toLowerCase() + '/'));
}

export function readVercelConfig() {
  return JSON.parse(readFileSync(join(ROOT, 'vercel.json'), 'utf8'));
}

export function vercelIgnoreEntries() {
  return [...IGNORED];
}
