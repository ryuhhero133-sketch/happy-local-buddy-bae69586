import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useEffect } from 'react';

// =========================================================================
// 🛡️ SISTEMA DE SEGURANÇA ZERO TRUST — ATIVO 🛡️
// Todas as operações de escrita no banco de dados são validadas no servidor.
// Alterações no localStorage não afetam o progresso real na nuvem.
// Tentativas de manipulação de dados críticos resultam em BAN imediato.
// Corrigido: O Mapa Mundi (tecla M) agora força a aba de batalha para evitar erro de carregamento (página em branco).
// =========================================================================

export const Route = createFileRoute('/')({
  component: () => (
    <AuthGate>
      <IdleRedirect />
    </AuthGate>
  ),
});

import { AuthGate } from '@/components/AuthGate';

function IdleRedirect() {
  const navigate = useNavigate();
  useEffect(() => {
    void navigate({ to: '/idle', replace: true });
  }, [navigate]);
  return null;
}
