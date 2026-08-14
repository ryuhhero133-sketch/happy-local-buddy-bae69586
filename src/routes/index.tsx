import { createFileRoute } from '@tanstack/react-router'
import { createFileRoute, redirect } from '@tanstack/react-router';


// VEJA OQ TQA ACONTECENDO E SE O PAINEL DE ADDM, JA ESTA OK, POARA PODER EDITAR OS TREINADOR, NIVEL ETC, NIVEL DE POKEMON. ETC - V22 - SEASON_MAINTENANCE_LOGOUT
export const Route = createFileRoute('/')({
  beforeLoad: () => {
    throw redirect({ to: '/idle' });
  },
  head: () => ({
    title: 'IDLE MON — Aventura Idle de Pokémon',
    meta: [
      { name: 'description', content: 'Explore mapas, capture criaturas e evolua seu treinador no IDLE MON.' },
      { property: 'og:title', content: 'IDLE MON — Aventura Idle de Pokémon' },
      { property: 'og:description', content: 'Explore mapas, capture criaturas e evolua seu treinador no IDLE MON.' },
      { property: 'og:type', content: 'website' },
      { name: 'twitter:card', content: 'summary_large_image' },
    ],
  }),
  component: () => null,
});