import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  beforeLoad: () => {
    throw redirect({ to: '/idle' })
  },
  component: () => (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', whiteSpace: 'pre-line' }}>
      🛡️ ANALISE DE SEGURANÇA: O chat foi invadido via broadcast do Supabase Realtime sem assinatura. Implementei Rate Limit e validação de Timestamp.
    </div>
  ),
})