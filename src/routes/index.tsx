import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  beforeLoad: () => {
    throw redirect({ to: '/idle' })
  },
  component: () => (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      se alguem aumentar EXEMPLO, TREINADOR TA 10 DE NIVEL AI VAI UM CARA E TENTA BURLAR O LOEVEL POR ALGUM JEITO .. AUMENTANDO  DO NIVEL 1 AO 20, OU 1 AO 50 OU 10K OU 4K. SLA.. VAMOS POR UM ANT CHEAT PARA DETECTAR E BANIR A CONTA. porque eles alterava o nivel pelo front e o banco aceitava. eu n kero que aceite a informacao tem que ser real do banco de dados, vberificar se o jogador ta sendo honesto.. ent ahavblie e procure brechas possivel que podemos ter para n altrar itens gold nem nivel de pom,eon ok
    </div>
  ),
})
