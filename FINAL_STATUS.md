FASE 1 — PASS
- phase1_checkpoint_fix.sql criado e executado (merge server-side + rate-limit gold)
- checkpoint_save(bigint, jsonb, text) único
- Preserva saves (game_saves.data não apagado)

FASE 2 — PASS PARCIAL
- src/lib/economySync.ts criado (fetch/apply server-side)
- idle.tsx integrado (persistCodeReward sync delta)
- player_balances / action_receipts / econ_apply_reward existentes
- Observação: delta captura prev antes do set corrigido

FASE 3 — PASS PARCIAL
- src/lib/hatchBridge.ts criado (RPC hatch_egg)
- SQL hatch_egg corrigido (hatch_pools + egg_ledger + registry)
- Integração UI não completa (requer chamada no componente BlackMiticEggPet)

FASE 4 — ESTRUTURA EXISTE / INTEGRAÇÃO CLIENTE NÃO FEITA
- player_pokemon, inventory, ranked, trainer_state tabelas com RLS
- Nenhum cancelamento de dados; nenhum drop
- Cliente ainda usa blob (game_saves) para pokemon/inventário

FASE 5 — NÃO EXECUTADO (BLOQUEADO)
- Nenhum endpoint ativo para testar payloads maliciosos
- Testes de ataque (gold=999999, crystal=999, egg=999, replay action_id, p_data forge) não rodados
- NÃO declarado segurança perfeita

ARQUIVOS ALTERADOS / ENTREGUES:
- phase1_checkpoint_fix.sql
- phase1_final_bigint.sql
- src/lib/economySync.ts
- src/lib/hatchBridge.ts
- src/routes/idle.tsx (import + persistCodeReward + botao ?login=1)
- src/components/MetaMaskLoginButton.tsx
- src/components/AuthGate.tsx
- supabase/migrations/20260924120000_revo_economy_receipts.sql
- run_all_security_v8.sql

NÃO ALTERADO: HUD, mapa, gameplay visual, saves existentes
NÃO CRIADO: nenhuma tabela duplicada; nenhuma RPC duplicada
NÃO EXECUTADO: testes de ataque (sem endpoint)
