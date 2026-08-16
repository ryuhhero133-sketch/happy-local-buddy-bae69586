// ⚠️ DIAGNÓSTICO DE ASSETS CONCLUÍDO
// 
// CAUSA RAIZ:
// A alteração recente em 'src/lib/assetUrl.ts' removeu o 'CURRENT_ORIGIN' e parou de anexar a origem para assets gerenciados pelo Lovable (ex: /__l5e/assets-v1/...) que não fossem do projeto legado.
// Além disso, os arquivos .asset.json do Continente 4 contêm URLs assinadas do Supabase que expiram em 15-60 minutos, causando tela preta após a expiração do token.
// 
// IMPACTOS:
// 1. Mapas do Continente 4: As URLs assinadas expiram.
// 2. GIFs e Skins: Pararam de carregar porque o frontend não estava mais resolvendo o caminho relativo para a origem correta.
// 3. Estabilidade: URLs assinadas em arquivos estáticos (.asset.json) são voláteis e não devem ser usadas para assets fixos do jogo.
// 
// PLANO DE CORREÇÃO:
// 1. Restaurar a resolução de origem em 'assetUrlFromJson' para garantir que GIFs e Skins voltem a funcionar.
// 2. Implementar fallback para o Continente 4 enquanto as imagens não são movidas para um bucket público.
// 
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
