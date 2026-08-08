// O ERRO AGORA É:
//
// Erro na Edge Function:
// {"code":"NOT_FOUND","message":"Requested function was not found"}
//
// ISSO INDICA QUE O PAINEL ESTÁ CONSEGUINDO CHEGAR AO ENDPOINT DE EDGE FUNCTIONS, PORÉM A FUNÇÃO SOLICITADA NÃO FOI ENCONTRADA.
//
// NÃO CRIE OUTRO FALLBACK.
// NÃO VOLTE PARA ADMIN_SB_KEY NO CLOUDFLARE.
// NÃO ALTERE RLS.
// NÃO ALTERE O BANCO.
//
// FAÇA SOMENTE UMA AUDITORIA DO NOME E DEPLOY DA EDGE FUNCTION.
//
// 1. IDENTIFIQUE EXATAMENTE QUAL NOME DE EDGE FUNCTION O PAINEL ESTÁ CHAMANDO.
//
// 2. IDENTIFIQUE EXATAMENTE QUAL NOME DE EDGE FUNCTION FOI CRIADO NO SUPABASE.
//
// 3. OS DOIS NOMES PRECISAM SER IDÊNTICOS.
//
// 4. CONFIRME QUE A EDGE FUNCTION FOI REALMENTE DEPLOYADA NO MESMO PROJETO SUPABASE DO IDLEMON.
//
// 5. CONFIRME QUE O PAINEL ESTÁ USANDO O SUPABASE_URL DO MESMO PROJETO.
//
// 6. NÃO CONFUNDA:
// - nome do arquivo
// - nome da função
// - nome exibido no painel
// - nome do endpoint
//
// 7. TESTE A EDGE FUNCTION DIRETAMENTE NO AMBIENTE DO SUPABASE ANTES DE TESTAR O PAINEL.
//
// 8. NÃO EXPONHA NENHUMA SERVICE ROLE KEY.
//
// 9. NÃO ALTERE A ARQUITETURA.
//
// ARQUITETURA ESPERADA:
//
// PAINEL ADMIN
// ↓
// SUPABASE EDGE FUNCTION
// ↓
// SUPABASE DATABASE
//
// PRIMEIRO CORRIJA APENAS O "FUNCTION NOT FOUND".
//
// DEPOIS TESTE:
//
// JOGADOR TESTE:
// LEVEL 46 → 47
//
// CONFIRME:
//
// EDGE FUNCTION: ENCONTRADA
// EDGE FUNCTION: EXECUTADA
// BANCO: ATUALIZADO
// PAINEL: MOSTRA 47
// JOGO: MOSTRA 47
//
// SE A FUNÇÃO NÃO EXISTIR NO SUPABASE, FAÇA O DEPLOY DA FUNÇÃO CORRETA.
//
// SE JÁ EXISTIR, CORRIJA SOMENTE A REFERÊNCIA/NOME UTILIZADO PELO PAINEL.
//
// NÃO IMPLEMENTE O SEASON RESET AINDA.
//
// AO FINAL INFORME:
//
// NOME DA EDGE FUNCTION:
// PROJETO SUPABASE:
// EDGE FUNCTION DEPLOYADA: SIM/NÃO
// PAINEL CHAMANDO FUNÇÃO CORRETA: SIM/NÃO
// TESTE 46→47: OK/NÃO
// BANCO ATUALIZADO: OK/NÃO
// SERVICE ROLE NO FRONTEND: NÃO
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
============================================================
MIGRAÇÃO DEFINITIVA DO PAINEL ADMIN — IDLEMON
CLOUDFLARE WORKER → SUPABASE EDGE FUNCTIONS
============================================================

ATENÇÃO:

NÃO QUERO PERDER NENHUMA FUNÇÃO DO MEU PAINEL ADMIN.

O objetivo NÃO é remover funcionalidades.

O objetivo é manter o painel exatamente como ferramenta administrativa e trocar SOMENTE o backend responsável pelas operações privilegiadas.

O PAINEL PRECISA CONTINUAR PERMITINDO:

- EDITAR NÍVEL DO TREINADOR
- EDITAR XP DO TREINADOR
- DAR PRESENTES
- ADICIONAR ITENS
- REMOVER ITENS, QUANDO AUTORIZADO
- ALTERAR MOEDAS, QUANDO AUTORIZADO
- GERENCIAR CONTAS
- VISUALIZAR JOGADORES
- VISUALIZAR POKÉMON
- GERENCIAR POKÉMON
- GERENCIAR INVENTÁRIO
- OUTRAS FUNÇÕES ADMINISTRATIVAS JÁ EXISTENTES

NÃO REMOVA BOTÕES.
NÃO REMOVA TELAS.
NÃO REDUZA O PAINEL.
NÃO MUDE A EXPERIÊNCIA DO ADMIN.

============================================================
OBJETIVO DA MIGRAÇÃO
============================================================

O problema atual é:

Cloudflare Worker + TanStack Start não está entregando
ADMIN_SB_KEY de forma confiável ao runtime Edge.

Já testamos V35, V36, V37 e V38.

O diagnóstico publicado confirmou:

RUNTIME:
Cloudflare Worker (Edge)

SUPABASE_URL:
CONFIGURED

ADMIN_SB_KEY:
NOT_CONFIGURED

Portanto, NÃO quero mais tentativas com:

- process.env
- globalThis
- novos fallbacks
- proxies
- polyfills
- hacks de runtime

A solução definitiva será:

PAINEL ADMIN
↓
SUPABASE EDGE FUNCTION
↓
SUPABASE DATABASE

============================================================
1. MANTER O PAINEL ADMIN
============================================================

O painel atual continua sendo a interface administrativa.

Os botões atuais devem continuar funcionando.

Exemplo:

GERENCIAR CONTAS

Nível:
[ 47 ]

XP:
[ 3430 ]

[ SALVAR ALTERAÇÕES ]

Ao clicar:

PAINEL
↓
SUPABASE EDGE FUNCTION
↓
SUPABASE
↓
BANCO

O administrador NÃO deve perceber uma mudança negativa na interface.

============================================================
2. CRIAR BACKEND ADMINISTRATIVO NO SUPABASE
============================================================

Criar Supabase Edge Functions para as operações administrativas privilegiadas.

A Service Role deve existir SOMENTE no ambiente server-side da Edge Function.

NUNCA expor:

SUPABASE_SERVICE_ROLE_KEY

ou qualquer equivalente no:

- frontend
- bundle JavaScript
- localStorage
- sessionStorage
- HTML
- JSON público
- resposta da API
- logs
- URL
- parâmetros públicos

============================================================
3. PRIMEIRA FUNÇÃO: EDITAR JOGADOR
============================================================

Migrar primeiro a operação equivalente a:

updatePlayerStatsAdmin

A função deve permitir, conforme as permissões existentes:

- alterar nível
- alterar XP
- alterar estatísticas administrativas permitidas

A função NÃO deve aceitar campos arbitrários.

O cliente não pode enviar:

"altere qualquer coluna que eu quiser".

Deve existir uma lista explícita de campos permitidos.

============================================================
4. TESTE OBRIGATÓRIO
============================================================

Depois de implementar:

Selecionar uma conta de TESTE.

Alterar:

NÍVEL:
46 → 47

Clicar:

SALVAR ALTERAÇÕES

Fluxo obrigatório:

PAINEL
↓
SUPABASE EDGE FUNCTION
↓
SUPABASE
↓
BANCO

Confirmar diretamente no banco:

Nível = 47

Depois:

Recarregar o painel.

Confirmar:

Nível = 47

Depois:

Verificar no jogo.

Confirmar:

Nível = 47

NÃO considere concluído apenas porque a função compilou.

A alteração precisa ser REALMENTE persistida.

============================================================
5. SEGUNDA FUNÇÃO: PRESENTES
============================================================

Depois que a edição de jogador funcionar, migrar o sistema de presentes.

O painel deve continuar permitindo:

🎁 ENVIAR PRESENTE

Exemplo:

Jogador:
Nissan

Presente:

Master Ball x10

[ ENVIAR PRESENTE ]

Fluxo:

PAINEL
↓
SUPABASE EDGE FUNCTION
↓
VALIDAÇÃO ADMIN
↓
SUPABASE
↓
INVENTÁRIO/PRESENTE DO JOGADOR

O item precisa realmente aparecer para o jogador.

============================================================
6. ITENS E MOEDAS
============================================================

Manter as funções administrativas existentes para:

- Gold
- Crystal
- Ruby
- Master Ball
- Ultra Ball
- Safari Ball
- Stones
- Eggs
- Incubators
- outros itens existentes

NÃO apagar funcionalidades que já existem.

Cada operação deve possuir validação server-side.

============================================================
7. AUTORIZAÇÃO ADMINISTRATIVA
============================================================

A Edge Function deve verificar que o usuário autenticado possui permissão administrativa.

NÃO confiar em:

- botão escondido
- localStorage
- variável JavaScript
- role enviada pelo navegador
- parâmetro "isAdmin=true"

A autorização deve acontecer server-side.

============================================================
8. RLS
============================================================

NÃO DESATIVAR RLS GLOBALMENTE.

Manter as políticas existentes.

A Service Role será utilizada somente dentro das Edge Functions quando uma operação administrativa realmente exigir privilégio elevado.

============================================================
9. AUDITORIA
============================================================

Toda operação administrativa importante deve gerar log.

Registrar:

- admin_id
- jogador_afetado
- operação
- data/hora
- valores relevantes antes/depois
- resultado
- erro, se houver

NUNCA registrar:

- Service Role
- secrets
- tokens privados
- senhas

============================================================
10. NÃO ALTERAR O BANCO DESNECESSARIAMENTE
============================================================

Não criar novas tabelas se as estruturas atuais já forem suficientes.

Não alterar:

- game_saves
- trainer_state
- profiles
- ranked_scores
- tabelas de Pokémon
- inventário
- Banco Medieval

sem antes verificar a estrutura existente.

Utilize a estrutura atual.

============================================================
11. NÃO IMPLEMENTAR SEASON RESET AINDA
============================================================

IMPORTANTE:

NÃO IMPLEMENTE AINDA:

- Reset Global
- Season Reset
- Delete de Pokémon
- Reset de inventário
- Reset de Banco Medieval

Primeiro precisamos recuperar uma administração funcional e segura.

Depois criaremos o:

SEASON RESET CIRÚRGICO

separadamente.

============================================================
COMO REALIZAR O DEPLOY DA EDGE FUNCTION
============================================================

O erro "NOT_FOUND" indica que a função ainda não existe no seu Supabase.
Para corrigir, você precisa criar a função 'admin-update-player' no seu projeto Supabase:

1. Instale a CLI do Supabase localmente.
2. Execute: supabase functions new admin-update-player
3. Cole o código da função (que validará o Admin e usará a Service Role).
4. Execute: supabase functions deploy admin-update-player
5. Defina a Secret no Supabase: supabase secrets set SERVICE_ROLE_KEY=sua_chave_aqui

A arquitetura TanStack Start + Cloudflare agora está pronta para se conectar assim que a função estiver ativa.

============================================================
12. COMPATIBILIDADE COM O JOGO
============================================================

As alterações feitas pelo painel precisam utilizar a mesma estrutura de dados que o jogo utiliza.

Não criar um segundo sistema de níveis.

Se o jogo utiliza:

trainer_state

game_saves

ou outra fonte oficial,

identificar qual é a fonte de verdade e atualizar corretamente.

O painel e o jogo precisam enxergar o mesmo valor.

============================================================
13. PRESENTES
============================================================

Ao enviar um presente:

NÃO simplesmente alterar visualmente o frontend.

O item deve ser persistido no banco.

Depois:

jogador recarrega o jogo

e o item continua existindo.

============================================================
14. SEGURANÇA CONTRA MANIPULAÇÃO
============================================================

O navegador NÃO pode decidir:

- qual jogador pode ser alterado
- qual operação administrativa pode executar
- quais campos protegidos podem ser modificados

A Edge Function deve validar tudo.

Exemplo:

O navegador solicita:

user_id = X
level = 47

A Edge Function verifica:

1. usuário está autenticado?
2. usuário é admin?
3. user_id existe?
4. level é válido?
5. operação é permitida?
6. executar alteração.

============================================================
15. ERROS
============================================================

Se uma operação falhar:

Mostrar erro claro no painel.

Exemplo:

"Não foi possível salvar a alteração."

Não mostrar:

- Service Role
- stack trace sensível
- secrets
- informações internas do servidor

Registrar detalhes somente no log server-side apropriado.

============================================================
16. CLOUDflare
============================================================

O Cloudflare Worker continuará servindo o jogo/painel.

PORÉM:

As operações administrativas privilegiadas NÃO devem mais depender de:

ADMIN_SB_KEY

no runtime do Cloudflare Worker.

Não tentar resolver novamente o problema de binding.

A autoridade administrativa será transferida para as Supabase Edge Functions.

============================================================
17. NÃO QUEBRAR O LOGIN
============================================================

Não alterar:

- autenticação existente
- login dos jogadores
- login dos administradores
- sessão
- páginas do jogo

A migração é somente das operações administrativas.

============================================================
18. MIGRAÇÃO GRADUAL
============================================================

Não migre tudo de uma vez.

FASE 1:

Editar nível/XP.

Testar completamente.

FASE 2:

Presentes.

Testar completamente.

FASE 3:

Itens/moedas.

Testar completamente.

FASE 4:

Outras operações administrativas.

Somente depois considerar qualquer operação destrutiva.

============================================================
19. TESTE FINAL DA FASE 1
============================================================

Obrigatoriamente realizar:

TESTE 1:

Jogador Level 46
↓
Painel
↓
Alterar para 47
↓
Salvar
↓
Edge Function
↓
Supabase
↓
Banco = 47

TESTE 2:

Recarregar painel
↓
Level = 47

TESTE 3:

Abrir jogo
↓
Level = 47

TESTE 4:

Alterar novamente:

47 → 48

Confirmar banco = 48.

============================================================
20. TESTE DO PRESENTE
============================================================

Depois:

Enviar:

Master Ball x1

para uma conta de teste.

Confirmar:

Painel → Edge Function → Supabase → Inventário

Depois entrar/recarregar o jogo.

Confirmar:

Master Ball x1 presente.

============================================================
21. CRITÉRIO DE CONCLUSÃO
============================================================

NÃO diga "RESOLVIDO" apenas porque:

- compilou
- publicou
- função existe
- código não apresenta erro

Só considerar concluído quando:

EDITAR NÍVEL:
OK

BANCO:
OK

JOGO:
OK

PRESENTE:
OK

BANCO DO PRESENTE:
OK

JOGO RECEBE PRESENTE:
OK

SERVICE ROLE NO FRONTEND:
NÃO

RLS GLOBAL DESATIVADO:
NÃO

============================================================
22. RELATÓRIO FINAL
============================================================

Ao finalizar, responda exatamente:

ARQUITETURA:
PAINEL → SUPABASE EDGE FUNCTION → SUPABASE

EDIÇÃO DE NÍVEL:
OK/NÃO

XP:
OK/NÃO

PRESENTES:
OK/NÃO

ITENS:
OK/NÃO

BANCO ATUALIZADO:
OK/NÃO

JOGO RECONHECE ALTERAÇÕES:
OK/NÃO

SERVICE ROLE EXPOSTA:
SIM/NÃO

RLS GLOBAL DESATIVADO:
SIM/NÃO

CLOUDFLARE DEPENDENTE DE ADMIN_SB_KEY:
SIM/NÃO

STATUS:
FUNCIONANDO / NÃO RESOLVIDO

============================================================
REGRA ABSOLUTA
============================================================

NÃO APAGAR DADOS.

NÃO RESETAR JOGADORES.

NÃO EXECUTAR RESET GLOBAL.

NÃO DELETAR POKÉMON.

NÃO DELETAR INVENTÁRIO.

NÃO DELETAR BANCO MEDIEVAL.

NÃO DELETAR EQUIPE.

NÃO DESATIVAR RLS.

NÃO EXPOR SERVICE ROLE.

PRIMEIRO FAZER O PAINEL ADMIN VOLTAR A FUNCIONAR ATRAVÉS DA SUPABASE EDGE FUNCTION.

TESTAR COM UMA CONTA.

SOMENTE DEPOIS EXPANDIR PARA AS OUTRAS FUNÇÕES.
============================================================
      </div>
    </div>
  );
}

