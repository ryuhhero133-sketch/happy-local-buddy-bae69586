import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  // Root route displays the security status report
  component: () => (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', whiteSpace: 'pre-line', backgroundColor: '#fff0f0', border: '2px solid red' }}>
      {`O problema é que o atacante consegue modificar os valores dos stats no JS/JSON client-side e depois enviar esses valores para a API.

Corrija definitivamente:

Nunca confie em valores críticos enviados pelo frontend.

Stats, level, XP, dano, HP, trainer level, recompensas, moedas e progressão devem ser calculados/validados server-side.

O cliente deve enviar apenas a ação/intenção, nunca o resultado.

Bloqueie UPDATE direto de campos protegidos via RLS.

Use RPCs/triggers/constraints para validar tudo no Supabase.

Mesmo modificando JS, DevTools, REST ou JSON, o jogador não pode alterar stats ou progressão.

Audite todos os endpoints e caminhos de escrita para encontrar bypasses.

Teste enviando valores manipulados diretamente para a API e confirme que o banco rejeita.

Regra principal: se o cliente puder modificar o valor, o servidor nunca deve confiar nele.`}
    </div>
  ),
})
