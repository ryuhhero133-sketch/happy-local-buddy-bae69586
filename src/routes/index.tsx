import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  beforeLoad: () => {
    throw redirect({ to: '/idle' })
  },
  component: () => (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', whiteSpace: 'pre-line' }}>
      HABBILITAR MODO PVP NO JOGO ENTRE TREIANDORES, atacar pokemon no mapa do treinador em modo automatrico e poder ver os outrtos treinadores nio mapa
    </div>
  ),
})