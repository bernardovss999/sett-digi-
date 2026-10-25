# Revisão independente SETT-DIGI-02 (Sentinela)

Commit revisado: `083ae25` (diff `acef210..083ae25`, branch `infra/base-operacional`). Correções: branch `revisao/sentinela`, a partir de `083ae25`; **precisam de nova revisão por outro revisor** antes de contar para o controle `revisao`.

**Veredito: aprovado com ressalvas.** Nenhum defeito que quebre o site ou exponha segredo. A base revisada tinha 1 enfraquecimento de CSP, 2 bugs no servidor local e 1 lacuna de teste, todos corrigidos e testados na branch de revisão.

## Achados
| ID | Gravidade | Onde | Descrição | Estado |
|---|---|---|---|---|
| R-01 | Média (hardening) | `vercel.json` (CSP, `script-src`) | `https://cdn.jsdelivr.net` liberava o CDN inteiro (qualquer pacote npm/GitHub). Só `lenis@1.3.26/dist/lenis.min.js` é usado. | Corrigido: URL exata. Verificado no Chromium: Lenis carrega; `lenis@1.3.25` do mesmo CDN é bloqueado. |
| R-02 | Baixa | `scripts/serve.mjs` `resolveFile` | `GET /%` (percent-encoding inválido) gerava rejeição não tratada: requisição pendurada (sem handler de `unhandledRejection`, o Node derruba o processo). | Corrigido: responde 400. |
| R-03 | Baixa | `scripts/site-config.mjs` `isPublished` | Comparação com distinção de caixa: no Windows/macOS `/Docs/...`, `/PACKAGE.JSON`, `/Sett-Digital-Site.zip` eram servidos (200) apesar do `.vercelignore`. O teste só provava a caixa exata. Na Vercel (Linux) daria 404 de qualquer forma; o servidor local é que não espelhava. | Corrigido: comparação sem distinção de caixa. |
| R-04 | Baixa (lacuna) | `tests/browser/headers-e-publicacao.test.mjs` | Nada exigia entradas específicas em `.vercelignore`: remover `docs` mantinha 76/76 verde. | Corrigido: `tests/regression/vercelignore-entradas-obrigatorias.test.mjs`. |

## Ressalvas abertas (não corrigidas aqui)
- **R-05 Média, esperado pelo autor:** `sett-agenda.html` é indexável e não está em `sitemap.xml`. Nenhum teste exige "toda página indexável está no sitemap" (adicioná-lo agora deixaria a suíte vermelha). Texto/SEO: Nexo.
- **R-06 Baixa:** teste de overflow usa `scrollWidth <= clientWidth`. Com `overflow-x:hidden` em `html/body` um elemento largo fica cortado sem rolagem e o teste não detecta (mutação confirmada). O site hoje usa só `overflow-x: clip` em `.proof`.
- **R-07 Baixa:** erros de console só são medidos em 1440 px com movimento normal; interações (menu, FAQ, demos do `agentes.js`) não são exercitadas, então a CSP não foi testada após cliques.
- **R-08 Baixa:** `.vercelignore` usa sintaxe estilo `.gitignore`: `docs`, `tests`, `scripts` casariam também pastas aninhadas com esses nomes. Hoje não existe nenhuma; o servidor local ancora na raiz.
- **R-09 Info:** job `gate-de-liberacao` falha de propósito em todo push na `main` enquanto houver controle pendente; `main` ficará vermelha. `gitleaks-action@v2` e `actions/*` fixados por tag, não por SHA.
- **R-10 Info:** CSP com `style-src 'unsafe-inline'` é necessária (`style=""` espalhado e `innerHTML` com `style` em `script.js`); Lenis sem SRI (F-04 do autor segue aberto).
- Não verificado: Vercel real (se `.vercelignore` vale para deploy por Git, HSTS/HTTPS no domínio), CI no GitHub, gitleaks.

## Execução
- `npm test` em `083ae25`: 76/76 (Node 24.21 local) e 76/76 em clone limpo com Node 22.23 (sem `tests/regression/`, pasta vazia não versionada).
- Mutações em cópia (26): detectadas 23. Não detectadas: `.vercelignore` sem `docs` (R-04, agora detectada), `noindex` em página do sitemap (R-05), `overflow-x:hidden` mascarando (R-06). 2 mutações inválidas (alvo não encontrado) ignoradas.
- Regressão: 9 testes novos em `tests/regression/`; 5 falharam em `083ae25`+testes (commit `addfc59`), todos passam após a correção. Suíte final: 85/85.
- Gate: `python scripts/release_gate.py ...` retorna 1 (blocked); `release_gate.py` idêntico ao canônico. Nenhum controle `passed` sem evidência; `riscos` e `dependencias` passed têm evidência com hash válido. Com as correções, `vercel.json`/`scripts`/`tests` mudam depois do commit revisado: o gate exigirá novo `commit` e nova evidência após a re-revisão.
- Segredos: varredura por padrões em todo o histórico, sem achados; sem `.env`/chaves versionados; zip antigo contém só 3 arquivos estáticos. gitleaks não executado.
