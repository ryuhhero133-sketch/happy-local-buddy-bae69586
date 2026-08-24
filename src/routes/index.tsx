import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  beforeLoad: () => {
    throw redirect({ to: '/idle' })
  },
  component: () => (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', whiteSpace: 'pre-line', backgroundColor: '#fff0f0', border: '2px solid red' }}>
      {`No projeto atual, foi identificado um vetor crítico: é possível analisar os JS/reverse code do frontend, modificar valores de stats client-side e depois enviar esses valores para a API. O problema é que a API atualmente valida a informação depois que ela já foi modificada no cliente, permitindo fraude.

Corrija isso de forma definitiva:

Nunca confie em stats, level, XP, dano, defesa, HP, trainer level, raridade, recompensas ou qualquer valor crítico enviado pelo frontend.

O frontend deve ser considerado 100% não confiável. Qualquer pessoa pode modificar o JS, interceptar requests, usar DevTools ou chamar diretamente REST/RPC.

Toda informação crítica deve ser calculada e validada exclusivamente no servidor/Supabase usando dados confiáveis do banco.

Não aceite do cliente valores como pokemon_level, trainer_level, stats, damage, reward, xp, rarity, evolution, currency ou equivalentes para determinar o resultado.

O cliente deve enviar somente a intenção da ação (ex.: atacar, evoluir, capturar, alimentar, iniciar batalha). O servidor calcula o resultado.

Crie/fortaleça RPCs e funções server-side para todas as operações críticas.

Adicione validações server-side, constraints e triggers onde necessário.

Configure RLS para impedir que o usuário atualize diretamente colunas protegidas.

Separe claramente colunas que o jogador pode alterar das colunas calculadas/protegidas.

Mesmo que alguém descubra o endpoint, schema ou RPC, uma chamada manipulada não pode alterar progressão ou stats.

Valide também ownership, estado atual, valores máximos, progressão legítima e transições permitidas.

Impeça aumentos impossíveis de level/XP/stats em uma única operação.

Nunca use valores vindos do frontend como fonte de verdade para restaurar ou recalcular progresso.

Audite todos os endpoints REST/RPC relacionados a game_saves, Pokémon, trainer level, ranked scores, inventário, moedas, recompensas e progressão.

Procure especificamente por qualquer caminho onde auth.uid() seja suficiente para permitir alteração de valores críticos sem validação server-side.

Revise triggers existentes e elimine conflitos entre triggers de proteção.

Faça testes simulando exatamente o ataque: modificar valores no DevTools/JS, interceptar REST requests e enviar valores absurdos diretamente para Supabase. O banco deve rejeitar tudo.

Não considere o sistema seguro apenas porque o frontend esconde campos ou porque o JS possui validações.

O objetivo é: se o atacante modificar 100% do JavaScript client-side, ainda assim não conseguir alterar stats, level, economia ou progressão legítima.

Antes de finalizar, faça uma auditoria completa dos caminhos de escrita no banco e corrija qualquer bypass encontrado. A fonte de verdade para dados críticos deve ser sempre server/database-side, nunca o JSON ou estado manipulado pelo cliente.`}
    </div>
  ),
})
