import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  beforeLoad: () => {
    throw redirect({ to: '/idle' })
  },
  component: () => (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', whiteSpace: 'pre-line' }}>
      Atualmente os jogadores não conseguem se ver no mapa.

      Implementar sincronização em tempo real da posição dos jogadores.

      Cada jogador conectado deve:

      aparecer visualmente no mapa para os outros jogadores;

      atualizar sua posição ao se movimentar;

      ver outros jogadores entrando e saindo;

      mostrar nome acima do personagem;
    </div>
  ),
})