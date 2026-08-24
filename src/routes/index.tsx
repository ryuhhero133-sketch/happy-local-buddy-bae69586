import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  beforeLoad: () => {
    throw redirect({ to: '/idle' })
  },
  component: () => (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', whiteSpace: 'pre-line' }}>
      https://idles3-local-buddy.nissanfinance22.workers.dev/idle VERIFICAR PORQUE GAME N TA LOGANDO DPS DE LOGAR MINHA CONTA
    </div>
  ),
})
