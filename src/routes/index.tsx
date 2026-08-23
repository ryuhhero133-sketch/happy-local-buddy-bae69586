import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  beforeLoad: () => {
    throw redirect({ to: '/idle' })
  },
  component: () => (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', whiteSpace: 'pre-line' }}>
      TA DEMORANDO NASCER OS POKEMONS NO MAPA, E SE EU DER RESFRESH EU KERO QUE PERMANECA OS POKEMONS QUE TAOO NO MAPA E N RESET SPAWN ETC.
    </div>
  ),
})