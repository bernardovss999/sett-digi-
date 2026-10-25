# Re-revisão SETT-DIGI-04 (Farol)

Escopo: diff `083ae25..a7e1a74` (branch `revisao/sentinela`, correções do Sentinela). Revisor: Farol, que não escreveu essas correções. Data: 2026-10-25.

**Veredito: aprovado.** Nenhum defeito novo e nenhum teste enfraquecido.

## O que foi lido e conferido
- `vercel.json`: `script-src` passou de `https://cdn.jsdelivr.net` para `https://cdn.jsdelivr.net/npm/lenis@1.3.26/dist/lenis.min.js`, igual à URL de `script.js`. Restante da CSP idêntico.
- `scripts/serve.mjs` `resolveFile`: `decodeURIComponent` dentro de try/catch; erro vira `null`, o que o handler já trata com 400. Sem mudança de comportamento para caminhos válidos.
- `scripts/site-config.mjs` `isPublished`: comparação com `toLowerCase()` nos dois lados. Só aumenta o que é bloqueado no servidor local; a Vercel (Linux) já diferencia caixa e bloquearia pelo menos o mesmo.
- `tests/static/headers-e-csp.test.mjs`: a asserção do host passou a exigir a URL exata (mais estrita). Nenhuma outra asserção removida ou relaxada.
- `tests/regression/` (9 testes em 4 arquivos): cada um tem comentário de uma linha com o defeito; os dois testes de CSP olham a configuração real, não valores copiados.
- `docs/seguranca/README.md`: só a descrição da CSP mudou.

## Execução
- `npm test` em `a7e1a74`: 85 testes, 85 passam, 0 falhas (Node 24.21). Evidência: `evidencias/npm-test.txt`.
- Regressão contra `083ae25` (cópia limpa + os 4 arquivos): 9 testes, 5 falham (2 de CSP por host inteiro, `/%` e 2 de caixa em `.vercelignore`), 4 passam; os 4 que passam são controles. Evidência: `evidencias/regressao-antes-e-depois.txt`.
- Mutação em cópia de `a7e1a74`: removida a linha `docs` de `.vercelignore` -> `vercelignore-entradas-obrigatorias` falha (pass 2, fail 1).
- `npm audit`: 0 vulnerabilidades. Varredura básica por padrões em 32 commits: sem casamento. gitleaks não executado.

## Limites
- Não reexecutei as 26 mutações do Sentinela; confiei no relato delas e refiz só a de R-04 e a base das regressões.
- Esta revisão não cobre Vercel real, CI no GitHub, inspeção visual manual nem as ressalvas R-05 a R-10, que seguem abertas.
- Sou revisor das correções, mas autor da base `a45b50e..083ae25`; a base foi revisada pelo Sentinela.
