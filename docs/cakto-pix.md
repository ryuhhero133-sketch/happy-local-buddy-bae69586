# Cakto PIX — Diamantes Vermelhos

## Estado atual

Implementado no banco e no cliente:

- Catálogo server-side `public.cakto_packages` com os três pacotes (1.000, 2.000 e 3.200).
- Pedidos, clientes de cobrança, entregas, eventos de webhook e estornos em tabelas privadas.
- Entrega atômica de `game_saves.idle.items.cr_red` com trava por pedido e evento.
- `purchase_approved` é o único evento que credita diamantes.
- Assinatura HMAC oficial `X-Cakto-Signature` + `X-Cakto-Timestamp` com janela de 5 minutos.
- Idempotência por `requestId` no pedido e por `event_key` no webhook.
- Loja Cash com carrossel de banners no topo e abas **CARDS** / **ITENS**; os banners abrem os cards dos pacotes.
- Cards com as três artes dos baús, preço vindo do servidor e botão **COMPRAR** para escolher PIX ou cartão.
- Formulário de CPF/telefone, QR Code, copia-e-cola, status e mensagem de aprovação.
- A opção **CARTÃO** leva à página oficial de pagamento em outra aba pelo botão **COMPRAR**; nenhum dado de cartão passa pelo jogo.
- Textos visíveis da loja não exibem o nome do provedor. URLs reais, assinatura e integração continuam inalteradas.
- Atualização da HUD após confirmação, sem novo login.

Publicado e ativo:

- Edge Functions `cakto-create-payment`, `cakto-create-checkout`, `cakto-webhook` e `cakto-sync-catalog` no projeto `zdeduwsbzupulomxvfmb`.
- Secrets `CAKTO_CLIENT_ID`, `CAKTO_CLIENT_SECRET` e `CAKTO_WEBHOOK_SECRET` gravados no Supabase.
- Webhook ativo na Cakto (id `88497`), com os três produtos e os eventos `purchase_approved`, `refund`, `chargeback`, `pix_gerado`, `pix_expirado` e `purchase_refused`.
- Ofertas reais gravadas no catálogo:
  - Baú Inicial: oferta `32wppyv`, R$ 25,00.
  - Baú Avançado: oferta `69zbhbz`, R$ 48,00.
  - Baú Supremo: oferta `3e8aise`, R$ 69,90.

Pendente de validação final:

- Um `purchase_approved` real de PIX, feito pelo jogo, com conferência de crédito único e atualização da HUD.
- Um pagamento real de cartão pelo checkout hospedado, com `callback`/`sck` localizando o pedido e crédito único.
- Rotacionar o `client_secret` da Cakto, que apareceu no chat durante a configuração.

## Arquitetura

1. Jogador autenticado escolhe um dos três pacotes.
2. **PIX:** `cakto-create-payment` valida o JWT, o pacote e os dados do comprador; cria um pedido; obtém token OAuth2 da Cakto; cria o PIX com `X-Idempotency-Key = requestId`.
3. **Cartão:** `cakto-create-checkout` cria o pedido e um token aleatório, e devolve `https://pay.cakto.com.br/{oferta}?callback={token}&sck={pedido}`. O jogador paga na página oficial da Cakto; o jogo nunca recebe dados do cartão.
4. A Cakto envia o webhook para `cakto-webhook`.
5. A função valida assinatura, corpo e janela temporal; localiza o pedido por `sck`, `callback` ou `checkoutUrl`; em `purchase_approved` com `status = paid`, oferta principal (`offer_type = main`) e produto único, chama `cakto_deliver_order`.
6. A entrega bloqueia o pedido e o save, valida oferta/valor/moeda, credita uma única vez e grava o histórico. Um Pix aprovado depois de `pix_expirado` também é creditado, como o próprio fluxo da Cakto prevê.
7. O cliente consulta `get_my_cakto_order` e hidrata o checkpoint oficial para atualizar a HUD sem novo login, tanto no PIX quanto no checkout de cartão.

## Banco

Tabelas:

- `public.cakto_packages` — catálogo público de leitura.
- `private.cakto_orders` — inclui `checkout_token` único para o checkout hospedado.
- `private.cakto_order_customers`
- `private.cakto_deliveries`
- `private.cakto_webhook_events`
- `private.cakto_reversals`

RPCs:

- `public.get_my_cakto_order(uuid)` — somente o dono lê.
- `public.cakto_server_create_order(...)` — somente `service_role`.
- `public.cakto_server_save_payment(...)` — somente `service_role`.
- `public.cakto_server_prepare_checkout(uuid, text)` — cria/reaproveita o token e a URL do checkout hospedado.
- `public.cakto_server_order_by_checkout(text)` — localiza o pedido pelo token do webhook.
- `public.cakto_deliver_order(...)` — somente `service_role`.
- `public.cakto_mark_order_event(...)` — somente `service_role`.
- `public.cakto_mark_order_reversed(...)` — somente `service_role`.

Testes executados no banco:

- Pedido de teste com 1.000 diamantes creditou uma vez.
- Reenvio do mesmo evento retornou `event_already_processed` e não creditou de novo.
- O saldo `cr_red` foi alterado apenas na primeira entrega.
- Reembolso mudou o pedido para `refunded` e gravou o histórico.
- Jogador autenticado lê apenas o próprio pedido; `anon` não lê.
- Jogador não pode criar pedido, entregar diamantes ou alterar catálogo.
- Todas as alterações de teste foram revertidas.

## Configuração aplicada

- [x] Login do Supabase CLI concluído.
- [x] Escopos da chave Cakto: `read`, `write`, `products`, `offers`, `payments` e `webhooks`.
- [x] Secrets gravados no projeto `zdeduwsbzupulomxvfmb` (valores nunca versionados).
- [x] Webhook ativo na Cakto, id `88497`, com os três produtos e os seis eventos.
- [x] Functions publicadas.
- [x] Ofertas e preços reais gravados no catálogo e pacotes ativados.

### Reaplicar configuração

Arquivo local (ignorado pelo Git, nunca cole valores no chat):

```powershell
# supabase/.env.cakto.local
CAKTO_CLIENT_ID=...
CAKTO_CLIENT_SECRET=...
CAKTO_WEBHOOK_SECRET=...
```

```powershell
npx supabase secrets set --remote=zdeduwsbzupulomxvfmb `
  --env-file supabase/.env.cakto.local --yes

npx supabase functions deploy --remote=zdeduwsbzupulomxvfmb --use-api --yes `
  cakto-create-payment cakto-create-checkout cakto-webhook cakto-sync-catalog
```

URL do webhook:

```
https://zdeduwsbzupulomxvfmb.supabase.co/functions/v1/cakto-webhook
```

Eventos: `purchase_approved`, `refund`, `chargeback`, `pix_gerado`, `pix_expirado` e `purchase_refused`.

## Verificação local

```powershell
node --test scripts/cakto.test.mjs
bun run build
```

Os testes cobrem HMAC, janela temporal, UUID, os três pacotes, SQL de entrega única, RLS, ausência de crédito em `pix_gerado`, aprovação tardia após `pix_expirado`, idempotência e a interface da Loja Cash.

## Regra de segurança

Não considerar o pagamento automático ativo antes de:

- [x] publicar as três Functions;
- [x] configurar `CAKTO_CLIENT_ID`, `CAKTO_CLIENT_SECRET` e `CAKTO_WEBHOOK_SECRET`;
- [x] cadastrar o webhook e os três produtos;
- [x] confirmar preço/oferta no catálogo;
- [ ] testar um `purchase_approved` real com entrega única e HUD atualizada.

Depois do teste, rotacionar o `client_secret` da Cakto porque ele apareceu no chat durante a configuração.
