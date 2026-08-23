import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  beforeLoad: () => {
    throw redirect({ to: '/idle' })
  },
  component: () => (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', whiteSpace: 'pre-line' }}>
      KERO QUE NA FORJA VC CRIE MS UM ICONE DELOJA  COM EFEITO NEGRO, PÁRA PODER COMPRAR UM CARD BLACKMITICO, TEM QUE TER DIAMANTE NEGRO, CRIAR O ITEM DIAMANTE NEGRO TBM, E AO COMPRAR O CARD. ELE ABRE UMA ANIMAÇÃO ME DANDO UM POKEMON ALEATORIO BLACK MITICO PLUS COM 6 TRAITS OK. cada card 100 diamante negro
    </div>
  ),
})