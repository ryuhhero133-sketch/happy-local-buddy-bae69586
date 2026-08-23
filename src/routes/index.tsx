import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  beforeLoad: () => {
    throw redirect({ to: '/idle' })
  },
  component: () => (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', whiteSpace: 'pre-line' }}>
      ta apárecendo pokemon na casa do treinador, e tbm a sprite da casa do treaindor fica aaparecendo dentro do mapa n pode.
    </div>
  ),
})