# Plano de Implementação - Sistemas Sociais e PvP

Implementação dos sistemas de PvP (Pacífico, Manual, Automático), Party, Guildas e Co-op, integrando-os ao ecossistema do Idle Mon com foco em segurança server-side e interface MMO-style.

## 1. Banco de Dados (Supabase)
Criar a infraestrutura de tabelas necessária para suportar as novas funcionalidades sociais e competitivas.
- `player_pvp_settings`: Armazena o modo atual (peaceful, manual, auto).
- `parties`, `party_members`, `party_invites`: Gerenciamento de grupos de até 5 jogadores.
- `guilds`, `guild_members`, `guild_invites`: Gerenciamento de clãs com hierarquia (Líder, Oficial, Membro).
- `pvp_battles`: Log e estado das batalhas entre treinadores.
- `coop_sessions`: Estrutura base para futuras dungeons e bosses em grupo.

## 2. Lógica de Servidor (Server Functions)
Implementar funções protegidas em `src/lib/pvp.functions.ts`, `src/lib/party.functions.ts` e `src/lib/guild.functions.ts`.
- **PvP**: Validação de alvos (não atacar a si mesmo ou aliados), registro de batalhas e anti-cheat.
- **Party**: Criação, convites (zod validation), entrada/saída e remoção de membros.
- **Guilda**: Criação, promoção/demolição de cargos, convites e gestão de membros.
- **Nearby Players**: Sincronização de posição para alimentar a lista de jogadores próximos.

## 3. Interface do Usuário (HUD/Modais)
- **Seletor de Modo PvP**: Indicador visual (ícone + texto) próximo ao perfil do treinador no `idle.tsx`.
- **Painel Social Unificado**: Novo modal com abas para Party, Guilda, Co-op e Jogadores Próximos.
- **Target PvP**: Indicador visual sobre o jogador selecionado no mapa e HUD de target específico para treinadores inimigos.

## 4. Integração com o Loop do Jogo
- Modificar o sistema de auto-battle em `idle.tsx` para detectar e atacar jogadores se o modo `⚔️ PVP AUTO` estiver ativo.
- Implementar filtros de aliados (Party/Guilda) no sistema de seleção automática de alvos.
- Adicionar feedbacks visuais (toasts e animações) para eventos sociais e início de combate PvP.

## Detalhes Técnicos
- Utilização de `createServerFn` para todas as ações críticas.
- Validação rigorosa com Zod em todos os inputs.
- Implementação de RLS (Row Level Security) nas novas tabelas para garantir que jogadores só alterem seus próprios dados.
- Garantia de que o sistema de batalha existente seja reutilizado para manter a consistência do gameplay.
