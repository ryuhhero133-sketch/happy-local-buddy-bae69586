// O OURO AGORA N PRECISA SER COLETADO, PARA SOMAR NA BARRA, DE CIMA, APOS MATAR JA SOMA COMO COLETADO OK, O CRISTAL AGORA N DROPA DE POKEMONS, E O FRAGMENTO FRAGMENTO VERMELHO PODE DROPAR DE ALGUNS POKEMONS RAROS, MOSTRAR EFEITO AO DROPAR..

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