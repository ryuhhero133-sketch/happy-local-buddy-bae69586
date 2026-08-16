// ⚠️ IMPORTANTE: depois das alterações recentes no sistema de assets, alguns mapas desapareceram e Pokémon que utilizavam GIF também deixaram de aparecer.
// 
// NÃO faça novas alterações globais no carregamento de assets ainda.
// 
// Quero primeiro um diagnóstico completo:
// 
// Verifique se os arquivos dos mapas que desapareceram ainda existem no Storage.
// 
// Verifique se os GIFs dos Pokémon que desapareceram ainda existem no Storage.
// 
// Compare as referências/URLs dos assets antes e depois das alterações recentes.
// 
// Verifique se a função assetUrlFromJson está afetando outros tipos de assets além dos mapas do Continente 4.
// 
// Identifique exatamente quais arquivos estão retornando 403, 404 ou URL inválida.
// 
// Verifique se o último deploy/build incluiu todos os PNG, JPG, GIF e .asset.json.
// 
// NÃO substitua nem apague os assets atuais.
// 
// Se houver backup ou versão anterior funcionando, compare o carregador de assets com a versão anterior.
// 
// Preciso saber exatamente se os arquivos desapareceram do Storage ou se apenas estão deixando de ser carregados pelo frontend.
// 
// O objetivo é corrigir SOMENTE o problema dos mapas do Continente 4 sem quebrar mapas, GIFs, Pokémon ou qualquer outro asset existente.
// 
// Antes de alterar novamente o código, apresente a causa exata encontrada.
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
