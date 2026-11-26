# Cakto PIX — Diamantes Vermelhos

## Estado atual

Implementado no banco e no cliente:

- Catálogo server-side `public.cakto_packages` com os três pacotes (1.000, 2.000 e 3.200).
- Pedidos, clientes de cobrança, entregas, eventos de webhook e estornos em tabelas privadas.
- Entrega atômica de `game_saves.idle.items.cr_red` com trava por pedido e evento.
- `purchase_approved` é o único evento que credita diamantes.
- Assinatura HMAC oficial `X-Cakto-Signature` + `X-Cakto-Timestamp` com janela de 5 minutos.
- Idempotência por `requestId` no pedido e por `event_key` no webhook.
- Loja Cash com área de Diamantes Vermelhos, formulário de CPF/telefone, QR Code, copia-e-cola, status e mensagem de aprovação.
- Atualização da HUD após confirmação, sem novo login.

Não publicado ainda:

- Edge Functions `cakto-create-payment`, `cakto-webhook` e `cakto-sync-catalog`.
- Secrets da Cakto.
- Oferta/preço de cada pacote no catálogo.

O código está em `supabase/functions/`. O banco já foi migrado e testado. O catálogo começa com os pacotes **inativos** até a sincronização real; a loja mostra “EM CONFIGURAÇÃO” em vez de inventar preço ou ID.

## Arquitetura

1. Jogador autenticado escolhe um dos três pacotes.
2. `cakto-create-payment` valida o JWT, o pacote e os dados do comprador; cria um pedido `created`; obtém token OAuth2 da Cakto; cria o PIX com `X-Idempotency-Key = requestId`.
3. O pedido guarda `cakto_payment_id`, QR, expiração e valor.
4. A Cakto envia o webhook para `cakto-webhook`.
5. A função valida assinatura, corpo e janela temporal; em `purchase_approved` com `status = paid` e `paymentMethod = pix`, chama `cakto_deliver_order`.
6. A entrega bloqueia o pedido e o save, valida oferta/valor/moeda, credita uma única vez e grava o histórico.
7. O cliente consulta `get_my_cakto_order` e atualiza o saldo exibido.

## Banco

Tabelas:

- `public.cakto_packages` — catálogo público de leitura.
- `private.cakto_orders`
- `private.cakto_order_customers`
- `private.cakto_deliveries`
- `private.cakto_webhook_events`
- `private.cakto_reversals`

RPCs:

- `public.get_my_cakto_order(uuid)` — somente o dono lê.
- `public.cakto_server_create_order(...)` — somente `service_role`.
- `public.cakto_server_save_payment(...)` — somente `service_role`.
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

## Pendências de acesso

### 1. Login do Supabase CLI

O ambiente atual não tem token de acesso para publicar Functions nem gravar secrets.

Em um terminal interativo:

```powershell
npx supabase login
```

Ou crie um token scoped com `edge_functions_write`, `secrets_write` e `projects_read` e configure `SUPABASE_ACCESS_TOKEN`.

### 2. Secrets

Depois do login, configure sem colar valores no chat:

```powershell
npx supabase secrets set --project-ref zdeduwsbzupulomxvfmb `
  CAKTO_CLIENT_ID=... `
  CAKTO_CLIENT_SECRET=...
```

O segredo do webhook é gerado pela própria Cakto ao criar o webhook. Copie `fields.secret` da resposta e grave:

```powershell
npx supabase secrets set --project-ref zdeduwsbzupulomxvfmb CAKTO_WEBHOOK_SECRET=...
```

Status: **pendente**. Nenhum valor foi exibido ou versionado.

### 3. Webhook na Cakto

URL definitiva:

```
https://zdeduwsbzupulomxvfmb.supabase.co/functions/v1/cakto-webhook
```

Eventos:

- `purchase_approved` (obrigatório para entrega)
- `refund`
- `chargeback`
- `pix_gerado`
- `pix_expirado`
- `purchase_refused`

Produtos: os três produtos dos pacotes. A Cakto exige produtos explícitos no webhook.

### 4. Publicar Functions

```powershell
npx supabase functions deploy --remote=zdeduwsbzupulomxvfmb `
  cakto-create-payment cakto-webhook cakto-sync-catalog --use-api
```

### 5. Descobrir IDs e preços reais

Com as credenciais configuradas e as Functions publicadas, entre na conta principal e chame `cakto-sync-catalog`. Ela lê produtos/ofertas reais da Cakto e grava `cakto_offer_id` e `price_cents`. Não há IDs ou preços inventados no projeto.

## Verificação local

```powershell
node --test scripts/cakto.test.mjs
npm run build
```

Os testes cobrem HMAC, janela temporal, UUID, SQL de entrega única, RLS, ausência de crédito em `pix_gerado`, idempotência e a interface da Loja Cash.

## Regra de segurança

Não considerar o pagamento automático ativo antes de:

1. publicar as três Functions;
2. configurar `CAKTO_CLIENT_ID`, `CAKTO_CLIENT_SECRET` e `CAKTO_WEBHOOK_SECRET`;
3. cadastrar o webhook e os três produtos;
4. rodar o catálogo e confirmar preço/oferta;
5. testar um `purchase_approved` real ou de teste com entrega única.
