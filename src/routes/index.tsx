import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  beforeLoad: () => {
    throw redirect({ to: '/idle' })
  },
  component: () => (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      agora so podemos ver pokemons epico no mapa apartir do nivel 50 ok, e outra coisa, os jogadores podem se ver, E PODEM SE MATAR NO MAPA, QUANDO O MAPA TIVER EM MODO PERICULOSo.. MODO PACIFICO N ATK, E PÁRA O TRINADOR ATACAR O OUTRO BASTA CLICAR NO TARGET DELE.
    </div>
  ),
})