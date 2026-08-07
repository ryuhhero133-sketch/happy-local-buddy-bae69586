import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useEffect } from 'react';
import { AuthGate } from '@/components/AuthGate';

export const Route = createFileRoute('/')({
  component: () => (
    <AuthGate>
      <IdleRedirect />
    </AuthGate>
  ),
});

function IdleRedirect() {
  const navigate = useNavigate();
  useEffect(() => {
    void navigate({ to: '/idle', replace: true });
  }, [navigate]);
  return null;
}