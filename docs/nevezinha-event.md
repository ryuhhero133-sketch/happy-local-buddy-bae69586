# Festival da Nevezinha — evento diário

Aberto pelo NPC da Nevezinha no Emerald (ponto padrão `840, 528`). Se a conta
já tiver um NPC Nevezinha salvo no editor, ele vira o botão; contas sem esse
NPC recebem o mesmo boneco fixo no ponto do mapa.

## Regra diária

- **1 ticket por dia**, liberado automaticamente ao abrir a aba.
- O dia vira à **meia-noite de São Paulo**. Não acumula: no máximo 1.
- O ticket e o prêmio são definidos e creditados **no servidor** antes do vídeo.
- **F5 não rerrola e não duplica**: o prêmio já está no `game_saves`; ao abrir
  de novo, a aba mostra o último prêmio e o item está na mochila.
- Se o jogador fechar a aba no meio do vídeo, o prêmio continua creditado.

## Prêmios

| Prêmio | Chance |
|---|---:|
| Boneco da Nevezinha | 4% (garantido no 20º tiro) |
| Stone Elemental (1–3) | 16% |
| Ultra Ball (1–3) | 10% |
| Pokébolas + Great Balls | 30% |
| Comida Pokémon (Baga + Refeição) | 15% |
| Consolação (Pokébolas) | 25% |

O boneco é um item de coleção na mochila (`nevezinha_doll`). Não é um Pokémon.

## Vídeos

Quatro vídeos do diretório original da Nevezinha foram reduzidos de 1280×720,
~6,6 Mbps para **640×360, H.264 CRF 30, AAC 64 kbps**, com áudio iniciando do
zero e `faststart` para streaming. Total: ~2,3 MB. Eles só são baixados quando
o jogador dá o tiro; nenhum vídeo carrega na abertura do jogo.

- `show.mp4` — boneco apareceu
- `fail.mp4` — tentativa sem boneco (consolação)
- `stone.mp4` — Stone Elemental
- `items.mp4` — bolas/comida

As artes `machine.webp` e `ticket.webp` também foram otimizadas (72 KB juntas).

## Banco

Tabela `public.nevezinha_event_state` fechada para acesso direto; somente
`nevezinha_event_status()` e `nevezinha_event_spin()` (SECURITY DEFINER com
`auth.uid()`) podem ler/gravar. O teste `supabase/tests/nevezinha_event.test.sql`
roda numa subtransação revertida, inclusive no sucesso.

## Se quiser F5 = prêmio perdido

Hoje o prêmio é creditado imediatamente e protegido contra F5. Para tornar o F5
punitivo (ticket consumido e prêmio descartado), é necessário trocar o fluxo
para “reserva + confirmação após o vídeo”. Não foi feito por padrão para não
perder prêmio em queda de rede ou fechamento acidental.
