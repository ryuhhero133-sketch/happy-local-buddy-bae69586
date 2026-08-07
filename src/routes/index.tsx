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
        // Correcting the call to the server function
        await setMaintenanceMode({ data: { enabled: false } });
        console.log("Modo de manutenção desativado.");
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
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000', color: '#fff', fontFamily: 'monospace' }}>
      {loading ? "LIBERANDO ACESSO PARA OS JOGADORES..." : "REDIRECIONANDO..."}
    </div>
  );
}

