import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  beforeLoad: () => {
    throw redirect({ to: '/idle' })
  },
  component: () => (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', whiteSpace: 'pre-line' }}>
      verificar RLS para que n aaja nenhuma alteeracao de nivel gold, xp , xp de pokemon. etc. nem no ranked nem marketplace OK
    </div>
  ),
})