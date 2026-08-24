# Plano de Emergência: Proteção Anti-Exploit Idle Mon

Implementação de segurança multicamada para fechar vulnerabilidades de alteração direta de dados e garantir autoridade do servidor.

## Investigação (Fase 1)
- **Brecha Crítica**: `syncClientState_handler` em `src/lib/game.functions.server.ts` aceita `level` e `xp` de Pokémon vindos do cliente sem validação.
- **Brecha Crítica**: `pushInitialState` permite bootstrapping de contas novas com valores escolhidos pelo usuário.
- **Vulnerabilidade RLS**: Diversas chamadas `.update()` no frontend (`PokemonMarketPanel.tsx`, `AuthGate.tsx`) sugerem políticas RLS que permitem escrita direta por usuários autenticados.

## Bloqueio e Segurança (Fases 2-6)

### 1. Migration de Emergência (RLS & Funções)
- Revogar permissões de `INSERT/UPDATE` para `authenticated` nas tabelas: `trainer_state`, `pokemon_collection`, `pokeballs`, `inventory`, `ranked_scores`, `ranked_leaderboard`.
- Garantir que apenas `service_role` ou funções `SECURITY DEFINER` possam escrever.
- Criar tabela `security_events` e `suspected_exploits`.

### 2. Refatoração de Sincronização
- Modificar `syncClientState_handler` para NUNCA aceitar níveis ou XP do cliente. O servidor passará a ser a única autoridade para progressão.
- Implementar `reportKill` como a única forma legítima de ganhar XP/Gold, com validação de tempo (anti-flood).

### 3. Segurança do Ranked
- Refatorar RPCs de ranking para buscar o nível e kills diretamente da tabela `trainer_state` do banco, ignorando parâmetros enviados pelo cliente.

### 4. Proteção de Saves
- Adicionar `last_sync_at` e validação de hash/timestamp para evitar ataques de replay ou rollback.

## Auditoria e Log (Fases 7-8)
- Implementar trigger no banco para registrar mudanças suspeitas em `suspected_exploits` (ex: saltos de nível > 100 em um segundo).

## Detalhes Técnicos
- **Mudança na RLS**: `DROP POLICY ... ON public.trainer_state; CREATE POLICY ... FOR SELECT TO authenticated USING (auth.uid() = user_id);` (removendo ALL/UPDATE).
- **Validação Server-Side**: Uso de `zod` rigoroso em todas as entradas.
- **Bloqueio F12/DevTools**: Reforçar no frontend para dificultar ataques básicos (já iniciado, mas expandir).

---
**Nota**: Não haverá reset de saves ou deleção de jogadores nesta fase, apenas o fechamento das portas de entrada de dados falsos.
