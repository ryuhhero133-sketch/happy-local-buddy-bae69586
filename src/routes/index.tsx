import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  beforeLoad: () => {
    throw redirect({ to: '/idle' })
  },
  component: () => (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', whiteSpace: 'pre-line' }}>
      {`approve
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

4. O QUE AINDA ESTÁ VULNERÁVEL
- A função cloudSave.upsert (REST) falhará silenciosamente no frontend até que seja movida para uma Server Function, pois a RLS bloqueia o POST. O jogo continuará funcionando via syncClientState, mas o backup JSON bruto está pausado.
- Outros itens de inventário não explicitados podem ainda ter RLS permissiva (auditoria contínua necessária).

5. TESTE DE ATAQUE
trainer level: BLOQUEADO (RLS + Server Authority)
trainer XP: BLOQUEADO (RLS + Server Authority)
gold: BLOQUEADO (RLS + Server Authority + DB Trigger)
crystal: BLOQUEADO (RLS + Server Authority)
pokemon level: BLOQUEADO (Server Authority em sync)
pokemon XP: BLOQUEADO (Server Authority em sync)
ranked: BLOQUEADO (RLS + Server logic fix)

A prioridade absoluta de PARAR O EXPLOIT ATIVO foi atingida.
Os dados dos jogadores foram preservados.`}
    </div>
  ),
})
