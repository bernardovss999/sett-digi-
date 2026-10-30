// Bug (30/10/2026, achado ao aplicar o roteiro de 29/10/2026): o palco dos agentes de "O que fazemos" dizia que o Agente
// de Atendimento "Responde seus clientes no WhatsApp". A automação de WhatsApp para clientes ainda não existe, e a regra
// do roteiro é que nenhuma cena prometa isso. O mesmo texto está na cartela do episódio de Atendimento do "Elenco da
// Sett": no site, esse clipe termina antes da cartela.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT, listPublishedPages, readSite } from '../support/site.mjs';

const PROMESSA = /respond\w* (seus|aos|os) clientes (no|pelo) WhatsApp/i;

test('nenhuma página nem cena promete atendimento automático de clientes no WhatsApp', () => {
  for (const rel of listPublishedPages()) assert.doesNotMatch(readSite(rel), PROMESSA, rel);
  // 30/10/2026: o esboco.js saiu do site (nenhuma página o carregava); a lista segue com todo JS publicado
  for (const js of ['script.js', 'cenas.js', 'agentes-de-ia-para-empresas/agentes.js']) {
    assert.doesNotMatch(readFileSync(join(ROOT, js), 'utf8'), PROMESSA, js);
  }
});
