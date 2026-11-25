# Marketplace global, bônus VIP e mapa do Professor

## Marketplace

O Marketplace substitui o painel antigo e fica **aberto para todas as contas autenticadas**, sem exigir VIP. Ele ocupa a tela inteira no PC e no celular.

- **Itens**: somente a lista explícita aceita pelo servidor pode ser anunciada. Moedas, contadores internos, `safira_verde` e itens fora da lista não entram.
- **Pokémon**: qualquer Pokémon da coleção ou do banco pode ser anunciado, desde que não esteja no time, desmaiado em PvP, protegido, descansando ou seja o **inicial da conta**.
- **Inicial protegido por indivíduo**: novas contas gravam `isStarter: true` e `event: "starter"`. O servidor guarda o UID em `private.market_starter_locks`, então o inicial continua bloqueado mesmo depois de evoluir e mesmo que o save local seja antigo. Contas antigas recebem o UID inicial uma única vez na migration.
- **Custódia**: o anúncio tira o Pokémon/itens da posse do vendedor na mesma transação. A compra entrega um UID novo `bought-…` ao comprador. O cancelamento devolve o Pokémon ao vendedor. Um save antigo do vendedor não consegue restaurar um UID que está ou esteve sob custódia (`private.guard_marketplace_save`).
- **Limites**: 100 anúncios ativos por conta, coleção de 500, estoque de item até 999.999, preço até 50.000.000 em ouro ou 1.000.000 em cristais/safiras. Itens e Pokémon usam as mesmas regras de saldo e de versão do save.
- **Pagamento**: o vendedor recebe em “Meus anúncios” quando o anúncio foi vendido. Pagamentos de itens e Pokémon usam o mesmo RPC `market_pokemon` na ação `claim`.

### RPCs

- `get_marketplace()` — lista pública recente, meus anúncios, pagamentos e o UID inicial.
- `market_list_item(...)` — custódia de itens com preço/versão.
- `market_buy_item(...)` / `market_cancel_listing(...)` / `market_claim_payout(...)` — compra, cancelamento e pagamento de itens.
- `market_pokemon(action, version, listing, pet_uid, price, currency)` — anúncio, compra, cancelamento e pagamento de Pokémon. A ordem de locks é anúncio → save, igual às RPCs antigas.
- Todas exigem `authenticated`, usam `SECURITY DEFINER` com `search_path = ''` e validam a versão do save. `anon` não executa nenhuma delas.

### Interface

`src/components/marketplace/MarketplacePanel.tsx` usa portal para a tela inteira, busca com acentos, filtros por item/Pokémon/moeda/shiny, ordenação, paginação, confirmação antes de qualquer transação e polling leve a cada 30 segundos. A fixture `scripts/previews/marketplace.html` permite revisar a tela sem Supabase; ela não é uma rota do jogo.

## Bônus VIP de 48 horas

- Campanha única `server_bonus_20261125`, criada em 25/11/2026 e com término em **27/11/2026 às 08:15 (horário de Brasília)** / `2026-11-27T11:15:53Z`.
- 275 contas sem VIP ativo receberam **VIP Epic** (`goldMult` e `expMult` de 20%) até o fim da campanha. As 5 contas com VIP anual/livro ativo foram preservadas, sem redução de bônus.
- A concessão é registrada em `private.server_vip_grants`; entrar novamente, trocar de mapa ou salvar **não renova** o prazo. Livros de VIP melhores não são encurtados.
- O cliente sincroniza o bônus ao carregar e a cada 60 segundos enquanto a aba está visível, sem gravar um novo save a cada consulta.

## Mapas do Laboratório

As 14 expedições da aba MAPAS do Professor estão fechadas para todos:

`iceblow`, `monte_floreto`, `rayow`, `sakura_city`, `venenot`, `azulante`, `margrande`, `navegante`, `hallow`, `caverna_brok`, `map_0000`, `map_0055`, `map_0066`, `map_0077`.

O bloqueio vale no cliente (`isMapBlocked`) e no servidor (trigger que devolve `currentMap` para `laboratorio`). O **hub do Laboratório continua acessível** para incubadora, Professor, barcos e demais serviços. A entrada na Caverna de Brok também é recusada enquanto o mapa estiver fechado.

## Códigos de recompensa

Os dois códigos desta campanha têm **3 usos no servidor inteiro**, contados de forma atômica em `private.limited_server_reward_codes`. Cada resgate entrega:

- Código anual: **1 Livro VIP Gold** (`book_vip_60`, 365 dias).
- Código ancestral: **1 Ticket Ancestral** (`ticket_ancestral`).

Apenas os hashes SHA-256 ficam no repositório/banco; os códigos legíveis são enviados diretamente ao dono. O mesmo código pode ser usado pela mesma conta mais de uma vez, desde que ainda existam usos globais. Um `stale` ou falha não consome uso.

## Migrations remotas

- `20261125111543_public_pokemon_marketplace`
- `20261125111553_server_vip_bonus_and_limited_codes`

As migrations incrementam `save_version` e preservam itens, progresso, introdução e jornada. Os avisos novos do advisor são esperados: tabelas do schema `private` têm RLS sem policies (não são expostas) e as RPCs novas são `SECURITY DEFINER` executáveis apenas por `authenticated`; nenhuma RPC nova foi liberada para `anon`.

## Verificação

```powershell
node --test scripts/marketplace.test.mjs scripts/playerPresentation.test.mjs scripts/launchPack.test.mjs scripts/captureQuests.test.mjs scripts/emeraldJourney.test.mjs scripts/mapPublication.test.mjs scripts/grassHunt.test.mjs scripts/hud-layout.test.mjs scripts/hud-target.test.mjs scripts/nevezinhaEvent.test.mjs
npm run build
```

O teste transacional usa um Postgres descartável via PGlite, sem tocar no projeto remoto:

```powershell
$env:PGLITE_MODULE="C:\...\node_modules\@electric-sql\pglite\dist\index.js"
node --test scripts/marketplaceDb.test.mjs
```

A suíte geral contém testes preexistentes que dependem de `esbuild` e de assets locais ausentes; eles não fazem parte desta alteração. A validação visual foi feita no navegador em 390 px, 1440 px e paisagem baixa. Não foi feito um teste ao vivo com duas contas simultâneas.
