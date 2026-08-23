import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  beforeLoad: () => {
    throw redirect({ to: '/idle' })
  },
  component: () => (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', whiteSpace: 'pre-wrap' }}>
      IMPLEMENTAR APENAS PVP + PARTY NO IDLE MON

Não alterar HUD, mapas ou outros sistemas do jogo. Implementar somente visibilidade dos jogadores em tempo real, PvP e Party.

1. JOGADORES EM TEMPO REAL

Atualmente os jogadores não conseguem se ver no mapa.

Implementar sincronização em tempo real da posição dos jogadores.

Cada jogador conectado deve:

aparecer visualmente no mapa para os outros jogadores;

atualizar sua posição ao se movimentar;

ver outros jogadores entrando e saindo;

mostrar nome acima do personagem;

remover jogadores que ficarem offline/desconectados.

Utilizar o sistema em tempo real já disponível no projeto/Supabase, evitando excesso de atualizações e loops.

2. PVP COM TARGET

Adicionar sistema para selecionar outro jogador como TARGET.

Ao clicar em um jogador visível no mapa:

Selecionar Target → atacar os Pokémon daquele jogador.

Mostrar um indicador visual no alvo selecionado.

O jogador poderá:

selecionar outro jogador manualmente;

cancelar o target;

atacar automaticamente os Pokémon do target.

3. MODO PVP AUTOMÁTICO

Adicionar opção:

⚔️ PVP AUTO: ON / OFF

Quando estiver ligado:

procurar jogadores inimigos visíveis no mapa;

selecionar automaticamente um jogador como target;

atacar automaticamente os Pokémon/equipe dele;

após derrotar o alvo, procurar outro jogador disponível;

ignorar membros da própria Party;

permitir desligar o modo a qualquer momento.

Quando o modo estiver desligado, não atacar automaticamente outros jogadores.

4. PARTY

Adicionar sistema simples de Party com até 5 jogadores.

Funções:

convidar jogador;

aceitar convite;

sair da Party;

visualizar membros.

Jogadores da mesma Party são aliados:

não podem ser selecionados automaticamente pelo PvP Auto;

não devem ser atacados automaticamente;

devem aparecer identificados como aliados.

IMPORTANTE

Implementar apenas esses sistemas.

Não redesenhar o jogo.

Não alterar outros sistemas sem necessidade.

Reutilizar o sistema atual de batalha dos Pokémon.

Evitar loops de useEffect, múltiplos ataques simultâneos e duplicação de batalhas.

Validar ações importantes no servidor/banco, não apenas no navegador.

RESULTADO

Os jogadores finalmente devem conseguir se ver e se movimentar juntos no mesmo mapa em tempo real, criar uma Party, selecionar outro jogador como Target e, com o PvP Auto ativado, atacar automaticamente os Pokémon de jogadores inimigos.
    </div>
  ),
})
