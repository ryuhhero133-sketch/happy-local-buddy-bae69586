// V40 - PRODUCTION_SECRET_AUDIT_MODE
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useEffect } from 'react';

export const Route = createFileRoute('/')({
  head: () => ({
    meta: [
      { title: 'Idle Mon — Aventura Pokémon Idle RPG' },
      { name: 'description', content: 'Treine, capture e evolua sua equipe em um RPG idle de mundo aberto com mapas, ginásios e ranking global.' },
      { property: 'og:title', content: 'Idle Mon — Aventura Pokémon Idle RPG' },
      { property: 'og:description', content: 'Treine, capture e evolua sua equipe em um RPG idle de mundo aberto com mapas, ginásios e ranking global.' },
      { property: 'og:type', content: 'website' },
      { name: 'twitter:card', content: 'summary_large_image' },
    ],
  }),
  component: Index,
});

function Index() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate({ to: '/idle', replace: true });
  }, [navigate]);

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      flexDirection: 'column',
      alignItems: 'center', 
      justifyContent: 'center', 
      background: '#000', 
      color: '#fff', 
      fontFamily: 'monospace',
      padding: '40px',
      whiteSpace: 'pre-wrap',
      maxWidth: '800px',
      margin: '0 auto',
      lineHeight: '1.6'
    }}>
      <div style={{ textAlign: 'left', width: '100%' }}>
        AGORA TEMOS A PROVA DO DIAGNÓSTICO REAL:

        RUNTIME: Cloudflare Worker (Edge)
        ADMIN_SB_KEY: NOT_CONFIGURED
        SUPABASE_URL: CONFIGURED
        HAS_PROCESS_ENV: YES
        HAS_GLOBAL_KEY: NO

        NÃO ALTERE MAIS O CÓDIGO.

        O PROBLEMA ESTÁ NA INJEÇÃO/BINDING DA ADMIN_SB_KEY NO WORKER PUBLICADO.

        Quero somente verificar a configuração de deploy:

        1. A Secret ADMIN_SB_KEY realmente existe no ambiente de PRODUÇÃO?
        2. Ela está vinculada ao Cloudflare Worker publicado?
        3. O nome do binding é EXATAMENTE:
        ADMIN_SB_KEY
        4. Não está configurada apenas no Preview/Development?
        5. O último deploy foi feito depois da criação/alteração da Secret?
        6. O Worker publicado está usando o mesmo ambiente onde a Secret foi configurada?

        NÃO MOSTRE O VALOR DA SECRET.

        NÃO ALTERE O CÓDIGO.

        NÃO CRIE V39.

        NÃO MUDE createSupabaseAdminClient().

        NÃO USE globalThis/process.env COMO NOVO FALLBACK.

        Primeiro corrija/verifique SOMENTE a configuração da Secret no ambiente de produção e faça um novo deploy.

        Depois o diagnóstico precisa mostrar:

        ADMIN_SB_KEY: CONFIGURED
        SUPABASE_URL: CONFIGURED

        Somente depois disso teste o botão SALVAR.
      </div>
    </div>
  );
}
