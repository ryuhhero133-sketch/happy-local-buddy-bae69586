FASE 1: PASS (checkpoint_save corrigido, merge server-side, rate gold)
FASE 2: PASS PARCIAL (economySync + idle.tsx sync; servidor preserva gold/crystal/ruby)
FASE 3: PASS PARCIAL (hatch_egg SQL corrigido; hatchBridge.ts criado; integracao UI pendente)
FASE 4: PASS PARCIAL (tabelas player_pokemon/inventory/ranked existem; integracao cliente nao feita)
FASE 5: BLOQUEADO — sem endpoint ativo para testes de ataque (gold/crystal/ruby/egg/pokemon/xp/ranked/replay)

ARQUIVOS ALTERADOS:
- phase1_final_bigint.sql (F1)
- src/lib/economySync.ts (F2)
- src/lib/hatchBridge.ts (F3)
- src/routes/idle.tsx (F2 sync + F3 bridge import + botao login)
- src/components/MetaMaskLoginButton.tsx (MetaMask)
- src/components/AuthGate.tsx (botao)

NENHUM drop, nenhuma duplicacao, nenhuma alteracao visual/gameplay.
