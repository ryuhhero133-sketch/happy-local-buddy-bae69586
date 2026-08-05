import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useEffect } from 'react';
import { AuthGate } from '@/components/AuthGate';

// =========================================================================
// 🛡️ SISTEMA DE SEGURANÇA ZERO TRUST — ATIVO 🛡️
// Todas as operações de escrita no banco de dados são validadas no servidor.
// Alterações no localStorage não afetam o progresso real na nuvem.
// Tentativas de manipulação de dados críticos resultam em BAN imediato.
// Corrigido: Estabilidade do Mapa Mundi e Portais de Viagem restaurada.
// =========================================================================

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
