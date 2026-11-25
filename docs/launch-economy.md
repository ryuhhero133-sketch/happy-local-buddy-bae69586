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

O catálogo e o preço são validados no servidor por
`buy_red_crystal_cash_product('potion_20', versão)`. O cliente não informa
quantidade nem preço.

## Testes

- `supabase/tests/welcome_potion_pack.test.sql`
- `supabase/tests/red_crystal_potion_pack.test.sql`
- `node --test scripts/launchPack.test.mjs`
