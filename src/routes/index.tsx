import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  beforeLoad: () => {
    throw redirect({ to: '/idle' })
  },
  component: () => (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      ANALISE SE TEMOS ALGUMA BRECHA, FAÇA UM PASSEIO NO JOGO PARA SABER SE PRECISAMOS DE ALGUMA PROTEÇÃO ? OUTRA COISA A CASA DO TREINADOR FICA APARECENDO NO MAPA DA CASA DE TREEINADOR, , E TEM POKEMONS APARCENDO TBM, JOGADORES FAKE PLAYER PODEM TIRAR TODOS N VAMOS QUERER +
    </div>
  ),
})
