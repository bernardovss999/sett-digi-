# Operação

Status: parcial. Comandos verificados localmente; hospedagem, alertas e recuperação ainda não validados.

## Setup e configuração sem segredos
- `npm ci` e `npx playwright install chromium` (uma vez por máquina).
- Nenhuma variável de ambiente ou segredo é necessário para o site ou para os testes.

## Comandos de teste e critérios
- `npm test`: deve terminar com `fail 0`. Saída de referência em `docs/seguranca/evidencias/`.
- `npm run serve` para revisão manual em http://127.0.0.1:4173.

## Deploy e rollback autorizados
- Publicação só com autorização explícita do usuário. Nenhum deploy foi feito por esta branch.
- Rollback previsto: reimplantar o commit anterior na Vercel (procedimento não ensaiado).

## Backup e recuperação
- O código é o backup: está no Git (`origin` GitHub). Não há banco nem upload de usuário.
- Restauração de artefato antigo não foi ensaiada.
