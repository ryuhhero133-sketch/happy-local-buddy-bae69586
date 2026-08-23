import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  beforeLoad: () => {
    throw redirect({ to: '/idle' })
  },
  component: () => (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', whiteSpace: 'pre-line' }}>
      remover jogadores  fake no jogo, e n poder aparecer pokemon na casa do treiandor , esse mapa é apenas para poder acvessar o npc E MUDAR o npc que ta na casa do treinador.  obs n sera ms elyra.. ADC ESSE NPC CORRETAMENTE. PARA ELE FICARDANDO NA CASA E SE COMUNICANDO COM O TREAINDOR
    </div>
  ),
})