# Festival da Nevezinha — evento diário

Aberto pelo NPC da Nevezinha no Emerald (ponto padrão `840, 528`). Se a conta
já tiver um NPC Nevezinha salvo no editor, ele vira o botão; contas sem esse
NPC recebem o mesmo boneco fixo no ponto do mapa.

## Regra diária

- **3 tiros por dia**, liberados automaticamente ao abrir a aba.
- O dia vira à **meia-noite de São Paulo**. Não acumula: no máximo 3.
- **Tiros 1 e 2:** 70% de chance de falhar. Falha entrega **1 Pokébola +
  1 Poção + 1 Baga** (comida Pokémon).
- **Tiro 3:** prêmio garantido, nunca falha.
- O ticket e o prêmio são definidos e creditados **no servidor** antes do vídeo.
- **F5 não rerrola e não duplica**: o prêmio já está no `game_saves`; ao abrir
  de novo, a aba mostra o último prêmio e o item está na mochila.
- Se o jogador fechar a aba no meio do vídeo, o prêmio continua creditado.

## Prêmios (tiro que não falha)

| Prêmio | Chance |
|---|---:|
| Boneco da Nevezinha | 5% (garantido no 20º) |
| Stone Elemental (1–3) | 25% |
| Ultra Ball (1–3) | 15% |
| Pokébolas + Great Balls | 30% |
| Comida Pokémon (Baga + Refeição) | 25% |

O **Boneco da Nevezinha** é um item **lendário** de coleção na mochila
(`nevezinha_doll`). Enquanto estiver na mochila, concede **+5% de XP** ao time
e ao treinador. Não é um Pokémon.

## Vídeos e ícones

Quatro vídeos do diretório original da Nevezinha foram recodificados em
**1280×720, H.264 CRF 25, AAC 96 kbps**, com áudio iniciando do zero e
`faststart`. Total: ~11,9 MB, mas **cada vídeo só é baixado quando o jogador
dá aquele tiro**. A aba abre sem baixar vídeo.

- `show.mp4` — boneco apareceu (tela cheia)
- `fail.mp4` — falha (1 Pokébola)
- `stone.mp4` — Stone Elemental
- `items.mp4` — bolas/comida

O vídeo ocupa a tela inteira; em paisagem usa `cover` (preenche) e em retrato
`contain` (não corta). As artes `machine.webp` e `ticket.webp` também foram
otimizadas. Os ícones da lista e do resultado são os **ícones reais do jogo**
(Pokébola, Great Ball, Ultra Ball, Baga, Refeição e Stones), não emojis.

## Banco

Tabela `public.nevezinha_event_state` fechada para acesso direto; somente
`nevezinha_event_status()` e `nevezinha_event_spin()` (SECURITY DEFINER com
`auth.uid()`) podem ler/gravar. O teste `supabase/tests/nevezinha_event.test.sql`
roda numa subtransação revertida, inclusive no sucesso.

## F5

Hoje o prêmio é creditado imediatamente e protegido contra F5. Para tornar o F5
punitivo (ticket consumido e prêmio descartado), é necessário trocar o fluxo
para “reserva + confirmação após o vídeo”. Não foi feito por padrão para não
perder prêmio em queda de rede ou fechamento acidental.
