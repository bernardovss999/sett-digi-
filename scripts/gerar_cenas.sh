#!/bin/bash
# Gera os clipes de video/cenas/ a partir dos Stories 2D de novembro/2026 (1080x1920, 60 qps, com som).
# Cada clipe sai em três arquivos, sem áudio, 30 qps, tocando uma vez (o laço fica a cargo do site, que não usa):
#   <nome>.av1.mp4  AV1 720x1280 (o principal: Chrome, Firefox, Edge e Safari com AV1)
#   <nome>.mp4      H.264 540x960 (reserva para quem não toca AV1, como iPhones mais antigos)
#   <nome>-fim.webp o último quadro, 540x960 (pôster: com "reduzir movimento" é o que fica na tela)
# Medido em 30/10/2026 contra o original em 720x1280 (VMAF): AV1 ~95 e H.264 ~86, contra ~81 dos clipes
# antigos (450x800), e mais leves. Para conferir depois de mudar algo: scripts/gerar_cenas.sh --medir
# Uso: MOTIONS="<pasta 'Sett - Motion para Stories'>" scripts/gerar_cenas.sh [--medir] [nome ...]
set -euo pipefail
MOTIONS=${MOTIONS:-"$HOME/GoogleDrive/02 PROJETOS/Sett Company/CONTEUDOS NOVEMBRO 2026/Sett - Motion para Stories"}
SAIDA="$(cd "$(dirname "$0")/.." && pwd)/video/cenas"
E="04 · Elenco da Sett (2D, 6 episódios)"

# nome | arquivo de origem (dentro de MOTIONS) | duração (vazio = inteiro)
# O alfinete para antes da transição escura; o Atendimento para antes da cartela, que promete atender no WhatsApp
# (tests/regression/cena-prometia-atendimento-no-whatsapp); os outros episódios do Elenco param na cartela.
CLIPES=(
  "ponto-abre|01 · O Ponto (2D)/O Ponto - Story 1 de 3.mp4|"
  "ponto-fecha|01 · O Ponto (2D)/O Ponto - Story 3 de 3.mp4|"
  "semana|03 · Uma semana comum (2D)/Uma semana comum - Story 1 de 2.mp4|"
  "elenco-atendimento|$E/1 · Atendimento/Elenco da Sett · Atendimento - completo.mp4|2.8"
  "elenco-agenda|$E/2 · Agenda/Elenco da Sett · Agenda - completo.mp4|8.0"
  "elenco-pedidos|$E/3 · Pedidos/Elenco da Sett · Pedidos - completo.mp4|8.0"
  "elenco-estoque|$E/4 · Estoque/Elenco da Sett · Estoque - completo.mp4|8.0"
  "elenco-prospeccao|$E/5 · Prospecção/Elenco da Sett · Prospecção - completo.mp4|8.0"
  "elenco-relatorios|$E/6 · Relatórios/Elenco da Sett · Relatórios - completo.mp4|8.0"
  "rascunho-vivo|05 · Rascunho vivo (2D)/Rascunho vivo - Story 1 de 3.mp4|"
  "trilho|06 · Trilho e bifurcação (2D)/Trilho e bifurcação - Story 1 de 2.mp4|"
  "domino|07 · Dominó na escada (2D)/Dominó na escada - Story 1 de 3.mp4|"
  "alfinete|08 · O alfinete (2D)/O alfinete - Story 1 de 2.mp4|7.3"
  "alfinete-70|08 · O alfinete (2D)/O alfinete - Story 2 de 2.mp4|"
)

MEDIR=0
[ "${1:-}" = "--medir" ] && { MEDIR=1; shift; }
SO=("$@")

ff() { ffmpeg -nostdin -loglevel error -y "$@"; }
vmaf() {   # nota VMAF do clipe contra o original, os dois em 720x1280 e 30 qps
  ffmpeg -nostdin -nostats -i "$1" ${3:+-t "$3"} -i "$2" -lavfi \
    "[0:v]scale=720:1280:flags=bicubic,setpts=PTS-STARTPTS,format=yuv420p[a];[1:v]scale=720:1280:flags=lanczos,fps=30,setpts=PTS-STARTPTS,format=yuv420p[b];[a][b]libvmaf=n_threads=$(nproc)" \
    -f null - 2>&1 | grep -o 'VMAF score: [0-9.]*' | cut -d' ' -f3
}

for linha in "${CLIPES[@]}"; do
  IFS='|' read -r nome origem dur <<< "$linha"
  if [ ${#SO[@]} -gt 0 ] && [[ ! " ${SO[*]} " =~ " $nome " ]]; then continue; fi
  src="$MOTIONS/$origem"
  [ -f "$src" ] || { echo "falta: $src" >&2; exit 1; }
  corte=(); [ -n "$dur" ] && corte=(-t "$dur")
  if [ $MEDIR = 0 ]; then
    ff "${corte[@]}" -i "$src" -an -vf "scale=720:1280:flags=lanczos,fps=30" -c:v libsvtav1 -svtav1-params log-level=0 \
      -crf 60 -preset 4 -g 240 -pix_fmt yuv420p -movflags +faststart "$SAIDA/$nome.av1.mp4" 2>/dev/null
    ff "${corte[@]}" -i "$src" -an -vf "scale=540:960:flags=lanczos,fps=30" -c:v libx264 -preset veryslow -tune animation \
      -crf 33 -profile:v high -pix_fmt yuv420p -movflags +faststart "$SAIDA/$nome.mp4"
    if [ -n "$dur" ]; then ff -ss "$(awk "BEGIN{print $dur-0.1}")" -i "$src" -frames:v 1 -vf "scale=540:960:flags=lanczos" -c:v libwebp -quality 75 -compression_level 6 "$SAIDA/$nome-fim.webp"
    else ff -sseof -0.05 -i "$src" -frames:v 1 -vf "scale=540:960:flags=lanczos" -c:v libwebp -quality 75 -compression_level 6 "$SAIDA/$nome-fim.webp"; fi
  fi
  printf '%-20s av1 %4d KB  h264 %4d KB  pôster %3d KB' "$nome" $(( $(stat -c%s "$SAIDA/$nome.av1.mp4") / 1024 )) \
    $(( $(stat -c%s "$SAIDA/$nome.mp4") / 1024 )) $(( $(stat -c%s "$SAIDA/$nome-fim.webp") / 1024 ))
  [ $MEDIR = 1 ] && printf '  VMAF av1 %s  h264 %s' "$(vmaf "$SAIDA/$nome.av1.mp4" "$src" "$dur")" "$(vmaf "$SAIDA/$nome.mp4" "$src" "$dur")"
  echo
done
