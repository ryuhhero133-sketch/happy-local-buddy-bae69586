// ME EXPLICA COMO RESOLVO ISSO
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
