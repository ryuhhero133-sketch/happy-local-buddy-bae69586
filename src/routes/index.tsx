import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  beforeLoad: () => {
    throw redirect({ to: '/idle' })
  },
  component: () => (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', whiteSpace: 'pre-line' }}>
      EM ALQUIMIA ONDE TEM A FORJA AGORA SERA UMA LOJA DE COMRPAR POKEMON OVOS BLACK MITICO PLUS, COM 6 TRATIS, VAI VIM ALEATORIO O POKEMON QND EU COMPRAR OK. CUSTANDO 10 DIAMANTE NEGRO CADA
    </div>
  ),
})