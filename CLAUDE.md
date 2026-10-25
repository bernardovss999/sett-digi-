# Sett Digital: instruções para agentes

Site estático (HTML/CSS/JS) publicado na Vercel em https://www.sett.company. Sem formulário, API nem banco: toda conversão é link `wa.me`. Ver `AGENTS.md` para o resumo que outras ferramentas leem.

## Comandos
| Comando | O que faz |
|---|---|
| `npm ci` | Instala a única dependência de desenvolvimento (`playwright`, versão fixa). |
| `npx playwright install chromium` | Baixa o Chromium usado pelos testes de navegador (primeira vez). |
| `npm test` | Suíte completa: estáticos, regressão e navegador. Única verificação que vale para "pronto". |
| `npm run test:static` | Só testes sem navegador (links, ids, metadados, sitemap, robots, CSP, regressão). |
| `npm run test:browser` | Overflow em 390/768/1440 px, erros de console/CSP e headers servidos. |
| `npm run serve` | Servidor local em http://127.0.0.1:4173 com os headers de `vercel.json`. |
| `npm run gate` | Gate de liberação (`scripts/release_gate.py`). Sai com 1 enquanto houver controle pendente. |

Python 3 é necessário só para `gate`. No Windows, `python` pode ser outro executável; use o Python 3 disponível.

## Estrutura
- `index.html`, `portfolio/`, `agentes-de-ia-para-empresas/`, `sett-agenda.html`: páginas publicadas.
- `styles.css`, `script.js`, `agentes-de-ia-para-empresas/agentes.{js,css}`, `portfolio/portfolio.css`: front-end.
- `vercel.json`: headers (HSTS, CSP, demais) e cache. A CSP tem hash do script inline de `classList.add('js')`.
- `.vercelignore`: o que **não** é publicado. Entradas são caminhos exatos ou pastas, sem curingas.
- `scripts/site-config.mjs`: lê `.vercelignore` e `vercel.json`; fonte única para os testes e o servidor local.
- `scripts/serve.mjs`: servidor local que imita os headers e as exclusões da Vercel. Não é hospedagem de produção.
- `tests/static/`: links, ids, arquivos, metadados, sitemap, robots, llms.txt, headers e CSP.
- `tests/browser/`: overflow, console e headers servidos pelo servidor local.
- `tests/regression/`: um arquivo por bug corrigido, nomeado pelo sintoma. Vazio até o primeiro bug confirmado.
- `docs/sett/`: memória e handoffs (`memoria.py`, ver `C:\Users\berrr\OpenBot\Shared\Sett-Sites\MEMORIA-E-HANDOFF.md`).
- `docs/seguranca/`: riscos, decisões de headers, `release.json` e evidências do gate.

## Regras do projeto
- Correção de texto visível, CSS ou layout **não** é tarefa de infraestrutura: reporte ao Nexo.
- Todo bug corrigido ganha teste de regressão em `tests/regression/` que falha antes e passa depois. Não enfraqueça assertions para ficar verde.
- Mudou um `<script>` inline? Recalcule o hash e atualize a CSP em `vercel.json`. O teste `cada <script> inline publicado tem hash na script-src` avisa quando falta.
- Mudou um arquivo que deve ficar fora do ar? Adicione em `.vercelignore` como caminho exato. Teste `entradas de .vercelignore não são servidas` confirma.
- Não apagar `sett-digital-site/`, o `.zip` nem os PNGs de preview: estão apenas excluídos da publicação.
- Não fazer push, merge, deploy ou alterar DNS/Vercel sem autorização explícita do usuário.

## Limites conhecidos
- Headers são verificados só no servidor local e pelo `vercel.json`; não há prova do que o domínio real devolve.
- O CI em `.github/workflows/ci.yml` foi escrito, mas não foi executado no GitHub.
- `scripts/release_gate.py` valida consistência documental, não segurança.
