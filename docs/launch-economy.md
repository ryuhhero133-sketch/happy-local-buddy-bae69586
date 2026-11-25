# Liberação: HUD, pacote de Poções e Loja Cash

## HUD branca

A HUD nova (`newHud`) agora é usada por **todas as contas**. Não depende mais
do ID do dono.

## Pacote de boas-vindas

- Cada conta recebe **200 Poções** uma única vez.
- A concessão fica em `private.welcome_potion_grants`.
- O RPC `claim_welcome_potions()` adiciona as Poções ao save e devolve o
  snapshot oficial; o cliente adota o checkpoint e atualiza a mochila.
- Contas que já tinham entrado e nunca receberam são atendidas no próximo login.
- Se o save ainda não existir (conta nova), o cliente tenta novamente por alguns
  segundos.
- A função é idempotente: chamadas seguintes retornam `already_granted`.

## Loja Cash — Cristal Vermelho

Novo produto na Loja Cash:

| Produto | Preço | Entrega |
|---|---:|---|
| 20 Poções | 1 Cristal Vermelho | +20 Poções na mochila |
| Pokébola Slime | 100 Cristais Vermelhos | +1 Pokébola Slime |

A Loja Cash agora pede **confirmação** antes de debitar os Cristais Vermelhos.
O item concedido precisa estar na lista `allowedItems` do checkpoint local; foi
corrigido para Poções, Pokébola Slime e os demais itens do catálogo.

## Slime

- Slimes aparecem nos mapas BOBO, com limite de 4 vivos.
- **Pokébola, Great Ball, Ultra Ball e Master Ball não capturam Slime.**
- Só a **Pokébola Slime** captura; custa 100 Cristais Vermelhos.
- Ao capturar, o Slime vira o item de troféu `slime_pet` na mochila.

O catálogo e o preço são validados no servidor por
`buy_red_crystal_cash_product('potion_20', versão)`. O cliente não informa
quantidade nem preço.

## Código de recompensa NEVENATALINOSPLUS44YHWH

O código `NEVENATALINOSPLUS44YHWH` pode ser resgatado **2 vezes por conta**.
A trava é atômica no servidor, na tabela `private.reward_code_uses`; depois do
segundo uso o RPC responde `already_used`.

Cada resgate entrega:

- 100 Ultra Balls;
- 200 Pokébolas;
- 300 Poções;
- 300 Morangos;
- 20 tiros da Nevezinha;
- 50 Stones de cada elemento (Planta, Fogo, Água, Elétrica, Sombria e Dracônica);
- 10 Livros de Ataque;
- 20 Orbs Supremos de XP;
- 3 Discos de Habilidade (Raiz Aprisionante, Combustão e Maré Cortante).

O resgate roda em `redeem_nevenatalinos_code()`, que atualiza o save, os
tickets e devolve o checkpoint oficial para o cliente adotar. Antes de somar os
20 tiros, a função aplica o reset diário de 3 tiros, então o bônus não é
reduzido quando o Festival é aberto no mesmo dia.

## Testes

- `supabase/tests/welcome_potion_pack.test.sql`
- `supabase/tests/red_crystal_potion_pack.test.sql`
- `node --test scripts/launchPack.test.mjs`
- `node --test scripts/captureQuests.test.mjs`
