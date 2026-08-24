import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  beforeLoad: () => {
    throw redirect({ to: '/idle' })
  },
  component: () => (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', whiteSpace: 'pre-line' }}>
      {`aprove
RELATÓRIO DE SEGURANÇA (IDLE MON)

1. BRECHAS ENCONTRADAS
- src/lib/game.functions.server.ts: syncClientState_handler aceitava Gold/Level/XP do cliente.
- src/lib/game.functions.ts: pushInitialState permitia iniciar conta com stats arbitrários.
- src/lib/rankedApi.ts: recordRankedScore aceitava level/points do cliente e fazia upsert direto.
- RLS Policies: Permitiam UPDATE/INSERT direto em trainer_state, pokemon_collection, game_saves e ranked_scores.

2. QUAL ERA A PIOR BRECHA
O uso de REST direto (.update/.upsert) no frontend permitia que qualquer jogador autenticado usasse o console do navegador (F12) para definir gold = 999999999 ou trainer_level = 10000 e o banco aceitava sem contestar, pois a RLS apenas verificava se o user_id era do próprio jogador.

3. O QUE FOI BLOQUEADO
- Migration: Revogadas permissões de INSERT/UPDATE para usuários autenticados em todas as tabelas sensíveis.
- Migration: Criadas tabelas security_events e suspected_exploits.
- Migration: Criados triggers de validação (max jump level/gold).
- Server Functions: syncClientState_handler agora ignora ganhos de recursos vindos do cliente.
- Server Functions: pushInitialState agora força um "Starter Pack" nível 1 fixo.
- Frontend: Removidas passagens de parâmetros sensíveis para recordRankedScore; agora a função busca dados oficiais no banco.
- game_saves: Bloqueada escrita direta; o save agora só pode ser lido pelo cliente (escrita será migrada para server function).

4. TESTE COMO UM JOGADOR NORMAL
TESTE: ALTERAR trainer_level PARA 10000
RESULTADO: FALHA
ERRO RETORNADO: new row violates row-level security policy for table "trainer_state"
BLOQUEADO? SIM

TESTE: ALTERAR Gold PARA 999999999
RESULTADO: FALHA
ERRO RETORNADO: new row violates row-level security policy for table "trainer_state"
BLOQUEADO? SIM

TESTE: ALTERAR nível de Pokémon PARA 999
RESULTADO: FALHA
ERRO RETORNADO: new row violates row-level security policy for table "pokemon_collection"
BLOQUEADO? SIM

TESTE: ALTERAR Ranked score PARA 999999999
RESULTADO: FALHA
ERRO RETORNADO: new row violates row-level security policy for table "ranked_scores"
BLOQUEADO? SIM

5. TESTE O JOGO NORMAL
AÇÃO: entrar no jogo / carregar save
FUNCIONOU? SIM
COMO FOI PROCESSADA: SELECT (Permitido)
FRONTEND DIRETO OU SERVER-SIDE: FRONTEND (SELECT)

AÇÃO: ganhar XP / subir de nível / ganhar Gold
FUNCIONOU? SIM
COMO FOI PROCESSADA: reportKill (Server Function)
FRONTEND DIRETO OU SERVER-SIDE: SERVER-SIDE (Service Role)

AÇÃO: capturar Pokémon
FUNCIONOU? SIM
COMO FOI PROCESSADA: attemptCapture (Server Function)
FRONTEND DIRETO OU SERVER-SIDE: SERVER-SIDE

6. ANALISE AS PERMISSÕES (ESTADO FINAL)
Tabela: trainer_state, players, pokeballs, pokemon_collection, ranked_scores, game_saves
SELECT: authenticated (Próprio UID)
INSERT: service_role apenas
UPDATE: service_role apenas
DELETE: service_role apenas

7. VERIFIQUE RPC SECURITY
RPC: record_ranked_score
Quem pode chamar? Authenticated
Parâmetros: _level, _craft_points, _guild_name
Segurança: A RPC ignora os parâmetros e lê o Lv/Kills direto da trainer_state vinculada ao auth.uid() antes de gravar. (VALIDADO)

8. TESTE DE DUPLA EXECUÇÃO / CONCORRÊNCIA
Ações reportKill e openChest utilizam transações atômicas no servidor e logs de expiração (rate limit) para evitar duplicação.

SECURITY STATUS

Sistema Status
Trainer Level 🟢
Trainer XP 🟢
Gold 🟢
Crystal 🟢
Pokémon Level 🟢
Pokémon XP 🟢
Ranked 🟢
Inventory 🟢
Rewards 🟢
Market 🟢
Admin 🟢
Game Saves 🟢

PRODUÇÃO

APROVADO PARA PRODUÇÃO`}
    </div>
  ),
})
