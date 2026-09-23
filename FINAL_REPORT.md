FASE 1 — PASS
- phase1_checkpoint_fix.sql criado
- checkpoint_save agora faz merge server-side (player_balances / egg_ledger) + rate-limit gold
- Preserva saves existentes (compatível)
- Não apaga game_saves

FASE 2 — PASS PARCIAL
- player_balances / action_receipts / econ_apply_reward / egg_ledger existem
- Cliente ainda escreve blob game_saves; sem leitura de tabelas no idle.tsx
- Não quebrado, mas não integrado

FASE 3 — PASS PARCIAL
- hatch_egg corrigido e validado
- hatch_pools / egg_ledger / species_rules prontos
- idle.tsx ainda não invoca RPC hatch_egg (falta integrar botão/handler)

FASE 4 — PASS PARCIAL
- player_pokemon / inventory / ranked / trainer_state tabelas existem
- Nenhuma validação server-side aplicada ao blob de pokemon/inventário no checkpoint
- Não fechado contra forge de espécie/raridade no cliente

FASE 5 — NÃO EXECUTADO (bloqueado)
- Sem endpoint ativo para injetar payloads maliciosos
- Sem log de testes contra gold/crystal/ruby/egg/pokemon/Xp/ranked
- NÃO declarei segurança perfeita; apenas estruturei defesas

ARQUIVOS ENTREGUES / ALTERADOS:
- phase1_checkpoint_fix.sql
- run_all_security_v8.sql
- supabase/migrations/20260924120000_revo_economy_receipts.sql
- src/components/MetaMaskLoginButton.tsx
- src/components/AuthGate.tsx
- src/routes/idle.tsx (botão ?login=1)

NÃO ALTERADO: HUD, mapa, gameplay visual, saves de jogadores
