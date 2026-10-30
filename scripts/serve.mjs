#!/usr/bin/env node
// Servidor estático local para testes e revisão manual. Imita a hospedagem na Vercel só no que
// importa aqui: aplica os headers de vercel.json e responde 404 ao que .vercelignore exclui.
// Não é a hospedagem de produção: HTTPS, HSTS efetivo no domínio e cache de borda ficam fora.
// Uso: node scripts/serve.mjs [porta]   (padrão 4173, somente 127.0.0.1)
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ROOT, isPublished, readVercelConfig } from './site-config.mjs';

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.mp4': 'video/mp4',
  '.woff2': 'font/woff2',
  '.svg': 'image/svg+xml',
};

// Vercel casa cada "source" como caminho inteiro; os padrões do projeto usam só (.*) e grupos simples.
function headersFor(urlPath) {
  const headers = {};
  for (const rule of readVercelConfig().headers ?? []) {
    if (new RegExp('^' + rule.source + '$').test(urlPath)) {
      for (const { key, value } of rule.headers) headers[key] = value;
    }
  }
  return headers;
}

function resolveFile(urlPath) {
  let decoded;
  try {
    decoded = decodeURIComponent(urlPath);
  } catch {
    return null; // percent-encoding inválido (ex.: /%): vira 400 em vez de rejeição não tratada
  }
  const rel = normalize(decoded.endsWith('/') ? decoded + 'index.html' : decoded).replace(/^[\\/]+/, '');
  const full = join(ROOT, rel);
  if (!full.startsWith(ROOT) || rel.split(sep).includes('..')) return null;
  return { full, rel: rel.split(sep).join('/') };
}

export function createSiteServer() {
  return createServer(async (req, res) => {
    const { pathname } = new URL(req.url, 'http://127.0.0.1');
    const target = resolveFile(pathname);
    const send = (status, body) => {
      res.writeHead(status, { 'content-type': 'text/plain; charset=utf-8' });
      res.end(body);
    };
    if (!target) return send(400, 'Caminho inválido');
    if (!isPublished(target.rel)) return send(404, 'Não encontrado');
    try {
      const info = await stat(target.full);
      if (!info.isFile()) return send(404, 'Não encontrado');
      const body = await readFile(target.full);
      res.writeHead(200, {
        'content-type': TYPES[extname(target.full)] ?? 'application/octet-stream',
        ...headersFor(pathname),
      });
      res.end(req.method === 'HEAD' ? undefined : body);
    } catch {
      send(404, 'Não encontrado');
    }
  });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const port = Number(process.argv[2] ?? 4173);
  createSiteServer().listen(port, '127.0.0.1', () => {
    console.log(`Sett Digi em http://127.0.0.1:${port}/ (Ctrl+C para parar)`);
  });
}
