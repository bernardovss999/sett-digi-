# Arquitetura

Status: verificado em 2026-10-25 a partir do código no commit acef210 (base) e da branch `infra/base-operacional`.

## Componentes e fluxos
- Site estático: `index.html`, `portfolio/index.html`, `agentes-de-ia-para-empresas/index.html`, `sett-agenda.html`.
- Front-end: `styles.css`, `script.js`, `agentes-de-ia-para-empresas/agentes.{js,css}`, `portfolio/portfolio.css`, fontes em `fonts/`.
- Conversão: somente links `https://wa.me/5521936181695`. Nenhum formulário, `fetch` ou endpoint no código publicado.
- Hospedagem prevista: Vercel, domínio https://www.sett.company (não verificado nesta etapa).

## Contratos e dependências
- Único recurso externo carregado pelo navegador: `https://cdn.jsdelivr.net/npm/lenis@1.3.26/dist/lenis.min.js`, inserido por `script.js` só em computador com mouse e sem preferência de movimento reduzido.
- Fontes servidas do próprio domínio. O `sett-digital-site/` antigo usa Google Fonts, mas não é publicado (ver `.vercelignore`).
- Headers e CSP: `vercel.json`. Decisões em `docs/seguranca/README.md`.

## Limites e riscos
- Sem dados pessoais coletados pelo site. O conteúdo do canal `wa.me` é controlado pelo usuário do WhatsApp.
- Dependência de runtime: nenhuma. Dependência de desenvolvimento: `playwright` 1.64.1 (fixa em `package.json`).
- Artefatos antigos (`sett-digital-site/`, `.zip`, PNGs de preview) não são linkados por páginas publicadas; a exclusão está em `.vercelignore`.
