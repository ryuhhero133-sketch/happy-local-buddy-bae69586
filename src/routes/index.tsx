import { createFileRoute } from '@tanstack/react-router';

// =========================================================================
// 🛡️ SISTEMA DE SEGURANÇA ZERO TRUST — ATIVO 🛡️
// Todas as operações de escrita no banco de dados são validadas no servidor.
// Alterações no localStorage não afetam o progresso real na nuvem.
// Tentativas de manipulação de dados críticos resultam em BAN imediato.
// ENT CORRIGI POR OMAPA MUNDI TAVA NORMAL MOSTRANDO OS CONTINENTS ETC.. REVISE ISSO
// =========================================================================

export const Route = createFileRoute('/')({
  component: () => (
    <AuthGate>
      <IdleRedirect />
    </AuthGate>
  ),
});

import { AuthGate } from '@/components/AuthGate';
