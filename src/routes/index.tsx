import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  beforeLoad: () => {
    throw redirect({ to: '/idle' })
  },
  component: () => (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', whiteSpace: 'pre-line' }}>
      nova loja black mitic plus por diamante negro .. AO COMPRAR JA VEM O POKEMON ALEATORIO COM 6TRAITS
    </div>
  ),
})