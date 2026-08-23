import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  beforeLoad: () => {
    throw redirect({ to: '/idle' })
  },
  component: () => (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      IMPLEMENTAR APENAS ESTES SISTEMAS NO IDLE MON
      
      Não alterar HUD, mapas, economia, banco, inventário, sistema de Pokémon, Season, login ou qualquer outro sistema existente. Implementar somente os sistemas abaixo, integrando-os ao jogo atual sem quebrar funcionalidades existentes.
      
      1. SISTEMA DE MODOS DO JOGADOR
      
      Adicionar um seletor de comportamento PvP acessível dentro do jogo.
      
      O jogador poderá escolher entre 3 modos:
      
      🕊️ MODO PACÍFICO
      
      O jogador não inicia combate contra outros jogadores.
      
      O sistema automático ignora completamente jogadores encontrados no mapa.
      
      O jogador continua atacando apenas Pokémon selvagens, NPCs, bosses e inimigos PvE.
      
      Não selecionar automaticamente outros jogadores como target.
      
      🎯 MODO PVP MANUAL
      
      O jogador pode atacar outro jogador somente quando selecionar um alvo manualmente.
      
      Ao clicar/tocar em outro jogador no mapa, abrir ou ativar o TARGET PvP.
      
      O jogador selecionado passa a ser o alvo atual.
      
      Após selecionar o target, iniciar combate entre os Pokémon/equipes dos dois treinadores.
      
      Não atacar automaticamente outros jogadores.
      
      ⚔️ MODO PVP AUTOMÁTICO
      
      O jogador entra em comportamento agressivo.
      
      Detectar jogadores inimigos visíveis dentro do mapa/raio de visão.
      
      Selecionar automaticamente um jogador válido como target.
      
      Iniciar combate automaticamente.
      
      Quando o alvo for derrotado, procurar o próximo jogador disponível.
      
      Não atacar membros da própria Party.
      
      Não atacar membros da própria Guilda, caso estejam no mesmo sistema de proteção de aliados.
      
      O modo deve poder ser desligado instantaneamente pelo jogador, voltando para Pacífico ou PvP Manual.
      
      Adicionar um indicador visual claro próximo ao perfil/HUD mostrando o modo atual:
      
      🕊️ PACÍFICO
      
      🎯 PVP MANUAL
      
      ⚔️ PVP AUTO
      
      2. SISTEMA DE TARGET E COMBATE ENTRE TREINADORES
      
      Implementar sistema de seleção de jogador como alvo.
      
      Quando um jogador estiver em PvP Manual:
      
      Clicar em outro treinador no mapa.
      
      Definir esse jogador como currentTarget.
      
      Mostrar indicador visual sobre o alvo.
      
      Exibir nome do treinador selecionado.
      
      Permitir iniciar o ataque.
      
      Os Pokémon das equipes entram em combate.
      
      O combate deve utilizar o sistema de batalha existente do jogo sempre que possível.
      
      Objetivo do combate
      
      O objetivo é aniquilar/derrotar o treinador adversário através da derrota da equipe de Pokémon dele.
      
      Fluxo:
      
      JOGADOR A seleciona JOGADOR B
              ↓
      TARGET ATIVO
              ↓
      POKÉMON/EQUIPE DE A ATACA
              ↓
      POKÉMON/EQUIPE DE B REAGE
              ↓
      COMBATE CONTINUA
              ↓
      UMA DAS EQUIPES É DERROTADA
              ↓
      TREINADOR PERDEDOR É MARCADO COMO DERROTADO
      
      
      
      Não remover Pokémon permanentemente do jogador. A derrota deve ser tratada como derrota em combate PvP.
      
      Adicionar proteção contra:
      
      atacar a si mesmo;
      
      atacar jogador inexistente/offline;
      
      múltiplos combates duplicados contra o mesmo alvo;
      
      loops infinitos de batalha;
      
      ataques simultâneos duplicados causados por renderização, useEffect ou múltiplas chamadas.
      
      Toda validação importante deve acontecer no servidor/Supabase, não apenas no cliente.
      
      3. SISTEMA DE PARTY
      
      Criar sistema de Party para jogadores jogarem juntos.
      
      Uma Party deve permitir:
      
      convidar outro jogador;
      
      aceitar ou recusar convite;
      
      visualizar membros;
      
      sair da Party;
      
      líder da Party poder remover membros;
      
      impedir convites duplicados;
      
      impedir jogador de entrar em várias Parties ao mesmo tempo.
      
      Estrutura inicial:
      
      PARTY
      ├── Líder
      ├── Membro 2
      ├── Membro 3
      ├── Membro 4
      └── Membro 5
      
      
      
      Utilizar inicialmente limite de 5 jogadores por Party, deixando o sistema preparado para alteração futura.
      
      Adicionar um pequeno painel:
      
      👥 PARTY
      
      PARTY
      Líder: PlayerName
      
      👤 Player 1
      👤 Player 2
      👤 Player 3
      
      [ CONVIDAR ]
      [ SAIR DA PARTY ]
      
      
      
      Regras de integração com PvP
      
      Membros da mesma Party:
      
      não devem ser selecionados automaticamente pelo PvP Auto;
      
      não devem aparecer como inimigos para o sistema automático;
      
      não podem ser atacados acidentalmente pelo sistema de target automático.
      
      Se o jogador tentar selecionar manualmente um membro da Party, bloquear o ataque e mostrar:
      
      "Este jogador faz parte da sua Party."
      
      4. MODO CO-OP
      
      Adicionar Modo Co-op utilizando o sistema de Party.
      
      O Co-op permite que jogadores da mesma Party enfrentem conteúdos juntos.
      
      Nesta primeira implementação, criar a estrutura do sistema sem alterar os mapas existentes.
      
      Regras:
      
      jogadores da mesma Party podem participar do mesmo combate Co-op;
      
      o progresso do combate deve ser sincronizado;
      
      os jogadores devem aparecer como aliados;
      
      o sistema deve suportar futuramente:
      
      Boss Co-op;
      
      Dungeon;
      
      Eventos;
      
      Mapas especiais;
      
      Invasões;
      
      Raids.
      
      Criar uma base reutilizável chamada conceitualmente de:
      
      coop_session
      
      
      
      ou estrutura equivalente.
      
      Estados:
      
      WAITING
      READY
      IN_BATTLE
      FINISHED
      
      
      
      Por enquanto, implementar a infraestrutura e uma interface simples para iniciar uma sessão Co-op entre membros da Party.
      
      5. SISTEMA DE GUILDAS
      
      Criar sistema completo básico de Guildas.
      
      Cada jogador poderá:
      
      criar uma Guilda;
      
      escolher nome;
      
      escolher uma tag curta;
      
      convidar jogadores;
      
      aceitar ou recusar convites;
      
      sair da Guilda;
      
      visualizar membros.
      
      Estrutura inicial
      
      GUILDA
      ├── Líder
      ├── Oficiais
      └── Membros
      
      
      
      Permissões:
      
      👑 LÍDER
      
      criar Guilda;
      
      convidar;
      
      expulsar;
      
      promover membro para Oficial;
      
      remover Oficial;
      
      transferir liderança.
      
      ⭐ OFICIAL
      
      convidar jogadores;
      
      remover membros comuns.
      
      👤 MEMBRO
      
      visualizar informações;
      
      sair da Guilda.
      
      Criar limite inicial configurável de membros, começando em:
      
      MAX_MEMBERS = 30
      
      
      
      Esse valor deve ser centralizado em configuração para facilitar alteração futura.
      
      6. INTERFACE DA GUILDA
      
      Adicionar uma opção no menu social:
      
      👥 SOCIAL
      ├── PARTY
      ├── CO-OP
      ├── GUILDA
      └── JOGADORES PRÓXIMOS
      
      
      
      Dentro de Guilda:
      
      ⚔️ NOME DA GUILDA
      TAG: [IDLE]
      
      Membros: 12 / 30
      
      👑 PlayerLider
      ⭐ PlayerOficial
      👤 PlayerMembro
      
      [ CONVIDAR ]
      [ GERENCIAR ]
      [ SAIR DA GUILDA ]
      
      
      
      Caso o jogador não possua Guilda:
      
      ⚔️ GUILDAS
      
      Você ainda não faz parte de uma Guilda.
      
      [ CRIAR GUILDA ]
      [ ENTRAR EM GUILDA ]
      
      
      
      7. JOGADORES PRÓXIMOS
      
      Criar uma pequena lista de jogadores visíveis/próximos.
      
      Exemplo:
      
      JOGADORES PRÓXIMOS
      
      🟢 PlayerOne
      🎯 PlayerTwo
      ⚔️ PlayerThree
      
      [ CONVIDAR PARTY ]
      [ CONVIDAR GUILDA ]
      [ SELECIONAR TARGET ]
      
      
      
      Essa lista deve ser utilizada também pelo sistema PvP Auto para encontrar possíveis inimigos.
      
      8. ESTRUTURA DE DADOS E SEGURANÇA
      
      Criar ou adaptar tabelas/estruturas necessárias para:
      
      player_pvp_settings
      parties
      party_members
      party_invites
      guilds
      guild_members
      guild_invites
      coop_sessions
      coop_session_members
      pvp_battles
      
      
      
      Os nomes podem ser adaptados à estrutura atual do banco, mas manter organização equivalente.
      
      IMPORTANTE
      
      Não confiar no navegador para validar:
      
      vencedor da batalha;
      
      dano final;
      
      participação;
      
      permissões de Party;
      
      permissões de Guilda;
      
      liderança;
      
      membros;
      
      convites.
      
      Implementar RLS e validações adequadas.
      
      Um jogador só pode alterar informações relacionadas a ele e nunca deve conseguir:
      
      adicionar a si mesmo a qualquer Guilda;
      
      remover outro jogador sem permissão;
      
      se declarar líder pelo client;
      
      alterar resultado de PvP manualmente;
      
      finalizar uma batalha arbitrariamente.
      
      9. NÃO QUEBRAR O JOGO ATUAL
      
      Antes de finalizar:
      
      verificar erros de TypeScript;
      
      verificar imports;
      
      evitar useEffect com loops;
      
      evitar múltiplos intervalos;
      
      limpar listeners e subscriptions;
      
      não criar atualização infinita;
      
      não alterar sistemas existentes fora desta implementação;
      
      reutilizar componentes e sistema de batalha existente sempre que possível.
      
      RESULTADO FINAL ESPERADO
      
      O Idle Mon deverá possuir um novo sistema social e competitivo onde:
      
      PvP Pacífico: o jogador ignora outros jogadores.
      
      PvP Manual: o jogador escolhe um treinador como TARGET e inicia o combate.
      
      PvP Auto: o jogador procura automaticamente jogadores inimigos visíveis e combate contra eles.
      
      Além disso:
      
      jogadores podem criar Party de até 5 membros;
      
      membros da Party são aliados e protegidos do PvP automático;
      
      existe uma estrutura inicial de Co-op;
      
      jogadores podem criar e administrar Guildas;
      
      Party, Co-op, Guilda e Jogadores Próximos ficam centralizados em um novo menu social.
      
      IMPORTANTE: IMPLEMENTAR SOMENTE ESTES SISTEMAS.
      
      Não redesenhar o jogo inteiro, não alterar mapas, não alterar HUD existente e não modificar outros sistemas sem necessidade direta para esta implementação.
    </div>
  ),
})