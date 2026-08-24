import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  beforeLoad: () => {
    throw redirect({ to: '/idle' })
  },
  component: () => (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', whiteSpace: 'pre-line', backgroundColor: '#f0fff0', border: '2px solid green' }}>
      {`Faça uma auditoria e correção COMPLETA do projeto.

1. CORRIGIR O LOGIN PRIMEIRO

O jogo atualmente pode ficar preso na tela de login e não consegue entrar no jogo. Corrija o fluxo de autenticação e carregamento da sessão sem apagar contas, saves ou progresso.

Verifique Supabase Auth, sessão, refresh token, RLS e carregamento do perfil.

Garanta que uma sessão válida consiga entrar normalmente.

Não sobrescreva save existente com dados vazios/default durante o carregamento.

Se o carregamento do save falhar, NÃO salve estado vazio por cima do save correto.

Corrija loops de login, redirects e falhas de inicialização.

Depois da correção, teste registro → login → sessão → carregamento do save → entrada no jogo.

2. BLOQUEAR MANIPULAÇÃO CLIENT-SIDE

Considere o frontend 100% comprometido. O jogador pode modificar JS, JSON, DevTools, requests REST e chamadas RPC.

NUNCA confie em valores enviados pelo cliente para:

Pokémon stats

level

XP

trainer level

HP/dano/defesa

evolução

raridade

recompensas

moedas/tokens

inventário

drops

ranking

progresso

O cliente deve enviar somente a INTENÇÃO da ação. O servidor/banco deve calcular o resultado verdadeiro.

3. SUPABASE / DATABASE

Bloqueie UPDATE direto de campos protegidos usando RLS.

Use RPCs server-side para operações críticas.

Use triggers e constraints para impedir valores impossíveis.

Valide ownership com auth.uid().

Valide progressão, limites e transições no servidor.

Remova qualquer caminho onde o cliente consiga escrever diretamente valores críticos.

Audite TODOS os endpoints REST/RPC e tabelas públicas.

Verifique se alguma tabela exposta pelo PostgREST está sem RLS.

Elimine triggers conflitantes e mantenha uma única regra de proteção por recurso.

4. TESTE CONTRA MANIPULAÇÃO

Simule um usuário malicioso tentando:

alterar JSON antes do envio;

modificar valores pelo DevTools;

enviar REST diretamente;

enviar level/stats absurdos;

alterar trainer level;

criar XP/recompensa/moeda;

modificar ranking;

alterar Pokémon/inventário.

TODAS essas tentativas devem ser rejeitadas pelo servidor/banco.

5. NÃO QUEBRAR O JOGO

Segurança não pode destruir funcionalidades legítimas.

Depois das alterações, teste obrigatoriamente:
login → sessão → carregamento do save → mapa → Pokémon → batalha → XP → level → inventário → recompensas → logout → login novamente.

Não remova funcionalidades existentes para "resolver" a vulnerabilidade. Corrija a arquitetura.

REGRA FINAL

O frontend pode ser totalmente manipulado e o jogo ainda deve permanecer seguro.

Se um jogador modificar qualquer valor crítico no cliente, o servidor deve ignorar/rejeitar o valor e usar somente dados confiáveis do banco/server-side.

IMPORTANTE: não declare o sistema "seguro" apenas porque existem validações no frontend. A validação definitiva precisa acontecer no Supabase/database/server-side.`}
    </div>
  ),
})
