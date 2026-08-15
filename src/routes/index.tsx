// EU TBM KERO QUE APARECA ESSE MAPA LA NO CONTINENT 4. PARA QUE EU POSSA ME MOVER PARA ELE , E TENHA O MAPA NRMAL QUE ACABAMOS DE ADD. CONTNENT 4 HAVERA VARIOS MAPAS POREM EU TO ENVIANDO OS MAPAS .. KERO QUYE VC ORGANIZE ISSO .. E N TIRE O MAPA QND EU CLOCAR UM OUTRO;;
import { createFileRoute, redirect } from '@tanstack/react-router';

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
