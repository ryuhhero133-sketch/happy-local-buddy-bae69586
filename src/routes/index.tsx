import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  beforeLoad: () => {
    throw redirect({ to: '/idle' })
  },
  component: () => (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', whiteSpace: 'pre-line' }}>
      crie 6 codigos de recompensa .. de 6 ovos black mitic plus , com 6traits , ao abrir cada ovo vai vim um pokemon aleatorio, codigos unicos. e tbm kero 6 codgios de 10k de cristal, 20k k de cristal, 50k de cristal e 100k de cristal.
    </div>
  ),
})