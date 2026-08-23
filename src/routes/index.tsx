import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  beforeLoad: () => {
    throw redirect({ to: '/idle' })
  },
  component: () => (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', whiteSpace: 'pre-line' }}>
      ainda ta aprecendo pokemon na casa do treinador,e eu kero que remova os jogador fake plaeer, e habilite modo pvp em mapas.
    </div>
  ),
})