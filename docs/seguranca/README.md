# Segurança e liberação: Sett Digital

Status em 2026-10-25, branch `infra/liberacao` (base acef210; commit de código revisado a7e1a74, que inclui as correções da revisão do Sentinela sobre 083ae25). Este documento não certifica segurança nem autoriza publicação. A liberação para produção depende dos controles pendentes abaixo, de revisão independente e de autorização do usuário.

## 1. Escopo e riscos

Site estático na Vercel (https://www.sett.company). Não há formulário, endpoint, login, banco nem upload. Toda conversão é link `https://wa.me/5521936181695`, aberto pelo próprio visitante.

| Item | Situação verificada |
|---|---|
| Dados coletados pelo site | Nenhum pelo código publicado. Não há `fetch`, `XMLHttpRequest`, `form` nem `iframe` nas páginas. |
| Terceiros carregados pelo navegador | Nenhum. O Lenis 1.3.26 (rolagem suave, computador) é servido pelo próprio site em `vendor/` desde 31/10/2026. |
| Links para terceiros | `wa.me`, Instagram e demos `*.vercel.app` do portfólio (navegação, não carregamento). |
| Atores | Visitante anônimo; equipe Sett com acesso ao painel da Vercel e ao repositório. |
| Risco principal | Alteração não revisada que mude conteúdo, headers ou publique arquivo interno (ex.: handoffs em `docs/`). Mitigado por `.vercelignore`, testes e revisão. |
| Risco de terceiros | Biblioteca do CDN sem SRI. Se o CDN for comprometido, o script roda na origem. Mitigação pendente: fixar `integrity` no `script.js` (decisão do Nexo/responsável do site, pois altera JS de comportamento). |
| Vazamento de segredos | Nenhum segredo esperado no site. Varredura básica sem achado (ver evidências). Gitleaks não executado localmente. |

## 2. Headers: decisões

Definidos em `vercel.json`, regra `/(.*)`.

- **Strict-Transport-Security: `max-age=31536000`.** Sem `includeSubDomains` e sem `preload`, porque não há inventário dos subdomínios de `sett.company`. Browsers guardam HSTS pelo tempo do `max-age`; antes de subir, confirme no domínio real que HTTPS funciona.
- **Content-Security-Policy aplicada (não Report-Only).** Diretivas:
  - `default-src 'self'`; `script-src 'self' 'sha256-Du+OJKJSbdUgz5nrHeWWINvez6XKDDU/tyj/5c2uvwo='` (URL exata, não o host inteiro; ajustado na revisão SETT-DIGI-02).
  - `style-src 'self' 'unsafe-inline'`: necessário porque o HTML usa muitos `style="--ordem:…"` e há um `<style>` em `sett-agenda.html`. Hash não cobre atributo `style`, então `unsafe-inline` ficou só para estilo, não para script.
  - `img-src 'self'`, `font-src 'self'` (fontes em `/fonts`, sem Google Fonts), `connect-src 'self'`, `frame-src 'none'`, `frame-ancestors 'self'`, `object-src 'none'`, `base-uri 'self'`, `form-action 'self'`.
  - Verificação: no Chromium, com a CSP aplicada, as quatro páginas carregam sem erro de console e a biblioteca Lenis é carregada (HTTP 200 do CDN, `window.Lenis` definido). Mutação removendo o hash faz o teste falhar (`evidencias/mutacoes.txt`).
  - Se um script inline for editado, o hash muda e a página quebra; o teste `cada <script> inline publicado tem hash na script-src` avisa antes.
- **X-Content-Type-Options, Referrer-Policy, Permissions-Policy, X-Frame-Options**: mantidos como estavam.
- **Cache de fontes, imagens e favicon**: mantido.
- **Não aplicado nesta etapa**: COOP/CORP, `upgrade-insecure-requests`, `Reporting-Endpoints`. Não há necessidade demonstrada; fora do escopo de infra.

## 3. Publicação: `.vercelignore`

Entradas (caminhos exatos ou pastas): `tests`, `scripts`, `docs`, `.github`, `node_modules`, `package.json`, `package-lock.json`, `AGENTS.md`, `CLAUDE.md`, `README.md`, `sett-digital-site`, `sett-digital-site.zip`, `sett-digital-preview.png`, `sett-digital-mobile-preview.png`.

- Verificado localmente: `scripts/serve.mjs` responde 404 a essas entradas (teste `entradas de .vercelignore não são servidas`).
- **Não verificado**: se a Vercel aplica `.vercelignore` a deploys por integração Git do painel. A documentação do CLI descreve o arquivo para uploads; confirme no primeiro deploy (ex.: URL de `/docs/sett/README.md` deve dar 404).
- Os artefatos antigos **não foram apagados**. Nenhuma página publicada os referencia (teste de links). Se alguém ainda usa `sett-digital-site/` como site separado, reverta a entrada.

## 4. Controles do gate (LIBERACAO-SEGURA.md)

Estado real em `release.json`. "passed" só quando há evidência executada nesta etapa; o restante fica pendente com motivo.

| ID | Estado | Motivo resumido |
|---|---|---|
| riscos | passed | Inventário acima, conferido com grep no HTML publicado. Revisão independente ainda não feita (ver `revisao`). |
| funcional | pending | Overflow e console automatizados passam; falta inspeção visual/mobile manual. |
| servidor | pending | Sem código de servidor próprio. Candidato a N/A, aguarda revisão distinta. |
| segredos | pending | Varredura básica sem achado; gitleaks não executado; CI não executado. |
| autenticacao | pending | Sem login. Candidato a N/A, aguarda revisão. |
| autorizacao | pending | Sem recursos por usuário. Candidato a N/A, aguarda revisão. |
| uploads | pending | Sem upload. Candidato a N/A, aguarda revisão. |
| abuso | pending | Sem endpoint próprio. Candidato a N/A, aguarda revisão. |
| dependencias | passed | `npm audit`: 0 vulnerabilidades (2026-10-25). Única dependência é de desenvolvimento (`playwright` 1.64.1 fixo). Scan verde não prova ausência de falhas. |
| regressao | pending | Suíte local passa (85/85 em a7e1a74). Falta CI executado no GitHub no commit entregue. |
| hospedagem | pending | Headers verificados só em servidor local. Domínio real, HTTPS e `.vercelignore` na Vercel não verificados. |
| recuperacao | pending | Procedimento escrito em `docs/sett/OPERACAO.md`; não ensaiado. |
| operacao | pending | Sem monitoramento, alertas, responsável nem canal de incidente. |
| revisao | passed | Diff `acef210..083ae25` revisado pelo Sentinela; correções `083ae25..a7e1a74` re-revisadas por Farol (revisor distinto de quem as escreveu). Ver `docs/sett/revisao-SETT-DIGI-02.md` e `docs/seguranca/re-revisao-SETT-DIGI-04.md`. Ressalvas R-06 a R-10 seguem abertas e bloqueiam o gate. Qualquer mudança de código posterior invalida a revisão afetada. |

Sem N/A aceito: os candidatos a N/A exigem justificativa e revisão de pessoa distinta do implementador. Até lá, ficam pendentes.

## 5. Achados abertos (para o Nexo)

Não corrigidos aqui por serem texto, SEO ou decisão visual, fora do escopo de infra.

- **F-01 sitemap (= R-05)** [aceito pelo usuário em 25/10/2026: a página fica como está, inclusive `index, follow`; não torna nenhum controle passed]: `sitemap.xml` não lista `sett-agenda.html`, que é indexável (`robots: index, follow`). Decisão de SEO. (`sitemap.xml` não está no escopo desta tarefa.)
- **F-02 página 404**: não há 404 personalizada; a Vercel mostra a padrão. Exige decisão visual.
- **F-03 artefatos**: confirmar se `sett-digital-site/`, o `.zip` e os PNGs de preview são usados por alguém antes de apagar.
- **F-04 Lenis sem SRI**: `script.js` carrega a biblioteca do CDN sem `integrity`. Recomenda-se fixar o hash do arquivo; altera JS, então precisa de aprovação.

- **R-06** (Sentinela): o teste de overflow usa `scrollWidth`; `overflow-x:hidden` em `html/body` mascararia um elemento largo. Hoje o site não usa isso. Pendente.
- **R-07**: console medido só em 1440 px, no carregamento; cliques (menu, FAQ, demos) não são exercitados sob a CSP. Pendente.
- **R-08**: `.vercelignore` em sintaxe estilo gitignore casaria pastas aninhadas `docs`/`tests`/`scripts`; hoje não existem. Pendente.
- **R-09**: o job `gate-de-liberacao` do CI falha de propósito em push na `main`; Actions e gitleaks fixados por tag, não por SHA. Pendente.
- **R-10** (= F-04): `style-src 'unsafe-inline'` é necessário hoje; Lenis sem SRI. Pendente.

## 6. Não executado nesta etapa

- CI no GitHub (`.github/workflows/ci.yml` foi escrito, não executado).
- gitleaks (não instalado localmente).
- Teste dos headers no domínio real e em HTTPS.
- Ensaio de rollback ou restauração.
- Revisão independente (Sentinela ou outro revisor).
- Inspeção visual manual em celular real.

## 7. Evidências

Saídas reais em `docs/seguranca/evidencias/`:
- `npm-test.txt`: `npm test` no commit a7e1a74, 85 testes, 0 falhas.
- `regressao-antes-e-depois.txt`: os 9 testes de regressão do Sentinela contra 083ae25 (5 falham) e depois (passam).
- `npm-audit.txt`: `found 0 vulnerabilities`.
- `segredos-varredura-basica.txt`: padrões comuns no HEAD, sem casamento (só nomes de arquivo).
- `mutacoes.txt`: duas mutações (feitas em a45b50e) que devem falhar e falharam.
