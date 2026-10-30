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
- `index.html`, `portfolio/`, `marca-e-conteudo/`, `criacao-de-sites/` (Sites), `gestao-google-meu-negocio/` (Presença digital), `agentes-de-ia-para-empresas/` (Sistemas e agentes de IA), `o-que-fazemos/`, `sett-agenda.html`: páginas publicadas. Nome público: Sett Company. As URLs antigas ficaram; os nomes seguem o media kit de nov/2026.
- `kit.css` (identidade do media kit e as cenas, antes de `telas.css`) e `cenas.js` (cenas que tocam uma vez, com pausa): roteiro de 29/10/2026, ver `docs/sett/roteiro-2026-10-29.md`. Clipes das cenas em `video/cenas/` (450×800, sem áudio, H.264 + AV1, pôster = último quadro); `esboco.js` é a abertura do protótipo.
- `styles.css`, `script.js`, `servicos.css`, `agentes-de-ia-para-empresas/agentes.{js,css}`, `portfolio/portfolio.css`: front-end.
- `tests/static/conteudo.test.mjs`: regras de texto (sem negativas, "negócio" em vez de "empresa" — "marca" vale desde 30/10/2026, Sett Company, sem 7× e sem levantamento interno, 70% com fonte, prévias independentes) e as regras do roteiro (cores do kit, logo com o Ponto, "Exemplo ilustrativo.", cenas sem laço).
- `vercel.json`: headers (HSTS, CSP, demais) e cache. A CSP tem hash do script inline de `classList.add('js')`.
- `.vercelignore`: o que **não** é publicado. Entradas são caminhos exatos ou pastas, sem curingas.
- `scripts/site-config.mjs`: lê `.vercelignore` e `vercel.json`; fonte única para os testes e o servidor local.
- `scripts/serve.mjs`: servidor local que imita os headers e as exclusões da Vercel. Não é hospedagem de produção.
- `tests/static/`: links, ids, arquivos, metadados, sitemap, robots, llms.txt, headers e CSP.
- `tests/browser/`: overflow, console e headers servidos pelo servidor local.
- `tests/regression/`: um arquivo por bug corrigido, nomeado pelo sintoma (sem navegador). Regressões que precisam de navegador ficam em `tests/browser/regressao-*.test.mjs`, para `npm run test:static` seguir sem Playwright.
- `docs/sett/`: memória e handoffs (`memoria.py`, ver `C:\Users\berrr\OpenBot\Shared\Sett-Sites\MEMORIA-E-HANDOFF.md`).
- `docs/seguranca/`: riscos, decisões de headers, `release.json` e evidências do gate.

## Regras do projeto
- Correção de texto visível, CSS ou layout **não** é tarefa de infraestrutura: reporte ao Nexo.
- Todo bug corrigido ganha teste de regressão em `tests/regression/` que falha antes e passa depois. Não enfraqueça assertions para ficar verde.
- Mudou um `<script>` inline? Recalcule o hash e atualize a CSP em `vercel.json`. O teste `cada <script> inline publicado tem hash na script-src` avisa quando falta.
- Mudou um CSS ou JS do site? Rode `node scripts/versionar.mjs`: ele põe em cada `<link>`/`<script>` o `?v=` com o começo do sha256 do arquivo. O navegador guarda CSS e JS por um dia; sem isso, junta o HTML novo com o arquivo velho (aconteceu em 30/10/2026). Teste `css-e-js-velhos-no-cache`.
- Vídeos das cenas: só por `scripts/gerar_cenas.sh` (origem e corte de cada clipe, a partir dos Stories 2D de nov/2026). Sai AV1 720p (o principal, listado primeiro no `<video>`), H.264 540p de reserva e o pôster WebP 540p. `--medir` dá a nota VMAF contra o original. Testes `av1-listado-depois-nunca-tocava` e `arquivos-sem-uso`.
- Leveza: todo arquivo publicado tem de ser usado por alguma página, folha ou script (teste `arquivos-sem-uso`). Tirou uma seção? Tire o CSS, o JS e as imagens dela no mesmo commit.
- Mudou um arquivo que deve ficar fora do ar? Adicione em `.vercelignore` como caminho exato. Teste `entradas de .vercelignore não são servidas` confirma.
- Uma seção = uma tela (`telas.css`, a última folha de todas as páginas; teste `regressao-cada-secao-uma-tela`): toda seção mede exatamente a altura da tela de 360×640 a 2560×1440, e nada dentro dela fica cortado. O que não cabe anda para o LADO (trilhos com pontos; setas nas prévias e na política). No celular a rolagem para de tela em tela (scroll-snap). Conteúdo novo numa seção: rode esse teste.
- Padrões fixos em todas as páginas (cada um tem teste): `<meta name="color-scheme" content="only light">` e viewport com `viewport-fit=cover`; seção com `min-height: calc(100lvh - var(--topo))`; topo do celular só com marca e menu; botões da abertura empilhados e centrados no celular; portfólio da home como fila de cartões iguais (desliza abaixo de 1024px); peças das aberturas internas (ficha, celular, constelação) no mesmo eixo.
- Não apagar `sett-digital-site/`, o `.zip` nem os PNGs de preview: estão apenas excluídos da publicação.
- Não fazer push, merge, deploy ou alterar DNS/Vercel sem autorização explícita do usuário.

## Limites conhecidos
- Headers são verificados só no servidor local e pelo `vercel.json`; não há prova do que o domínio real devolve.
- O CI em `.github/workflows/ci.yml` foi escrito, mas não foi executado no GitHub.
- `scripts/release_gate.py` valida consistência documental, não segurança.
