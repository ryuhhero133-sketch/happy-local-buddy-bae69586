// V41 - SUPABASE_EDGE_FUNCTION_MIGRATION_PLAN
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
        CONFIRMADO. NÃO VAMOS MAIS TENTAR CORRIGIR A INJEÇÃO DA ADMIN_SB_KEY NO CLOUDFLARE WORKER.

        MIGRE AS OPERAÇÕES ADMINISTRATIVAS PRIVILEGIADAS PARA UMA SUPABASE EDGE FUNCTION.

        ARQUITETURA DEFINITIVA:

        PAINEL ADMIN
        ↓
        SUPABASE EDGE FUNCTION
        ↓
        SUPABASE DATABASE

        REQUISITOS:

        1. Criar uma Edge Function server-side dedicada às operações administrativas.

        2. A Service Role deve existir SOMENTE dentro do ambiente seguro da Edge Function.

        3. O Cloudflare Worker não deve mais precisar receber ADMIN_SB_KEY para essas operações.

        4. O frontend nunca pode receber ou conhecer a Service Role.

        5. Não colocar secrets em:
        - bundle
        - localStorage
        - sessionStorage
        - HTML
        - JSON público
        - logs
        - resposta da API

        6. Manter RLS ativo.

        7. Não alterar a estrutura das tabelas existentes sem necessidade.

        8. Migrar primeiro SOMENTE:
        updatePlayerStatsAdmin

        9. O painel deve chamar a Edge Function.

        10. A Edge Function deve validar o administrador antes de executar.

        11. A Edge Function deve aceitar somente operações/campos explicitamente autorizados.

        12. O cliente não pode determinar livremente quais campos protegidos serão modificados.

        13. Registrar auditoria da operação:
        - admin
        - jogador
        - operação
        - data/hora
        - resultado

        14. NÃO IMPLEMENTAR O SEASON RESET AINDA.

        PRIMEIRO TESTE:

        Selecionar uma conta de TESTE.

        Alterar:

        Nível 46 → 47

        Fluxo obrigatório:

        Painel
        → Edge Function
        → Supabase
        → Banco

        Depois:

        → recarregar painel
        → confirmar 47
        → confirmar que o jogo reconhece 47

        NÃO CONSIDERE CONCLUÍDO APENAS POR COMPILAR OU PUBLICAR.

        SÓ CONSIDERE CONCLUÍDO SE A ALTERAÇÃO REAL FOR PERSISTIDA NO BANCO.

        AO FINAL INFORME:

        EDGE FUNCTION: OK/NÃO
        AUTENTICAÇÃO ADMIN: OK/NÃO
        ALTERAÇÃO 46→47: OK/NÃO
        BANCO ATUALIZADO: OK/NÃO
        SERVICE ROLE NO FRONTEND: SIM/NÃO
        RLS DESATIVADO: SIM/NÃO

        SE FALHAR, NÃO CRIE OUTRO FALLBACK.
        INFORME O ERRO EXATO.
      </div>
    </div>
  );
}
