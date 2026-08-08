// V39 - ARCHITECTURAL_ANALYSIS_MODE
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
        PARE.

        Já testamos V35, V36, V37 e V38 e o MESMO erro continua no deploy real:

        "ADMIN_SB_KEY/SERVICE_ROLE ausente no runtime do Worker."

        NÃO CRIE V39.
        NÃO ADICIONE OUTRO FALLBACK.
        NÃO ALTERE MAIS globalThis, process.env OU createSupabaseAdminClient.

        Quero que você faça apenas uma análise arquitetural.

        O objetivo é identificar se o problema está na integração:

        Cloudflare Worker → TanStack Start → Server Function → Supabase Admin.

        Se essa cadeia estiver impedindo o acesso confiável à Service Role no runtime Edge, NÃO tente mais contornar.

        Informe se é tecnicamente mais seguro e confiável mover as operações administrativas para uma SUPABASE EDGE FUNCTION dedicada, mantendo:

        PAINEL → SUPABASE EDGE FUNCTION → SUPABASE

        com a Service Role exclusivamente dentro da Edge Function.

        NÃO IMPLEMENTE AINDA.

        Apenas responda:

        1. A arquitetura atual é confiável para operações administrativas privilegiadas? SIM/NÃO
        2. O Cloudflare Worker está impedindo a passagem confiável das Secrets? SIM/NÃO
        3. Uma Supabase Edge Function resolveria a dependência do runtime Cloudflare/TanStack? SIM/NÃO
        4. É possível manter a Service Role exclusivamente server-side? SIM/NÃO
        5. Qual arquitetura você recomenda para o Season Reset Cirúrgico?
      </div>
    </div>
  );
}
