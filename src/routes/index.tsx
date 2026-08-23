import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  beforeLoad: () => {
    throw redirect({ to: '/idle' })
  },
  component: () => (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', whiteSpace: 'pre-line' }}>
      IMPLEMENTAR COMPRA NA FORJA POR DIAMANTE NEGRO,. CRIAR O ITEM DIAMANTE NEGRO, COMPRAR  OVOS BLACK MITICO PLUS AO ABRIRO OVO VAI VIM POKEMON ALEATORIO COM 6 TRAITS
    </div>
  ),
})