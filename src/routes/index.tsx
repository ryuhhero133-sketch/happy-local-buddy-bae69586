// IDLE MON - ACESSO LIBERADO OK - ANALISE E FAZ TEST - SINCRONIZAÇÃO DE NÍVEL CORRIGIDA - V14 - REALTIME_FORCE_SYNC_FIX
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { setMaintenanceMode } from '@/lib/maintenance.functions';

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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const releaseMaintenance = async () => {
      try {
        // Forçamos a desativação da manutenção em cada acesso à raiz para garantir que todos entrem
        await setMaintenanceMode({ data: { enabled: false } });
        console.log("Modo de manutenção desativado com sucesso.");
      } catch (err) {
        console.error("Erro ao liberar manutenção:", err);
      } finally {
        setLoading(false);
        navigate({ to: '/idle', replace: true });
      }
    };

    releaseMaintenance();
  }, [navigate]);

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      flexDirection: 'column',
      alignItems: 'center', 
      justifyContent: 'center', 
      background: 'radial-gradient(circle at center, #1a0306 0%, #000 100%)', 
      color: '#fff', 
      fontFamily: 'monospace',
      textAlign: 'center',
      padding: '20px'
    }}>
      <div style={{ 
        padding: '30px', 
        border: '2px solid #7f1d1d', 
        borderRadius: '12px', 
        background: 'rgba(0,0,0,0.8)',
        boxShadow: '0 0 30px rgba(127, 29, 29, 0.4)'
      }}>
        <h1 style={{ color: '#fecaca', marginBottom: '20px', letterSpacing: '4px' }}>IDLE MON</h1>
        <p style={{ fontSize: '14px', color: '#fca5a5', marginBottom: '10px' }}>
          {loading ? "LIBERANDO ACESSO PARA TODOS..." : "ACESSO LIBERADO!"}
        </p>
        <p style={{ fontSize: '10px', opacity: 0.7 }}>Redirecionando para o mapa...</p>
      </div>
    </div>
  );
}
