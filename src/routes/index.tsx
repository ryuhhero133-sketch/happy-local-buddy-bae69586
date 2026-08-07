import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useAuth } from '@/components/AuthGate';
import { useEffect } from 'react';

export const Route = createFileRoute('/')({
  component: Index,
});

function Index() {
  const { session } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Redireciona para /idle se houver sessão
    if (session) {
      navigate({ to: '/idle' });
    }
  }, [session, navigate]);

  return null;
}
