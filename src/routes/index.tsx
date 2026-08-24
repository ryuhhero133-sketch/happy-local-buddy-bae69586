import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  beforeLoad: () => {
    throw redirect({ to: '/idle' })
  },
  component: () => (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', whiteSpace: 'pre-line' }}>
      {`🚨 EMERGÊNCIA DE SEGURANÇA — IDLE MON ESTÁ SENDO EXPLORADO

Jogadores estão conseguindo alterar dados do jogo diretamente.

Os dados alterados incluem:

nível dos Pokémon

XP dos Pokémon

nível do treinador

XP do treinador

Gold

Crystal

Ranked

Craft Points

possivelmente outros valores econômicos

Isso deve ser tratado como INCIDENTE DE SEGURANÇA ATIVO.

OBJETIVO IMEDIATO

NÃO fazer uma grande refatoração visual.

NÃO apagar jogadores.

NÃO resetar saves.

Primeiro identificar e FECHAR todas as formas pelas quais um usuário autenticado está conseguindo escrever valores arbitrários no Supabase.

FASE 1 — INVESTIGAÇÃO IMEDIATA

Procure em TODO o projeto por chamadas que permitam ao frontend alterar diretamente:

trainer_level
trainerLevel
xp
experience
gold
crystal
ruby
currency
craft_points
pokemon
pokemon_level
level
ranked
ranked_scores
ranked_leaderboard
game_saves
inventory



Procure especificamente por:

.insert(
.update(
.upsert(
.rpc(
supabase.from(



Para CADA ocorrência, entregue:

ARQUIVO:
LINHA:
TABELA/RPC:
VALORES QUE O CLIENTE ENVIA:
RISCO:



Classifique:

🔴 CRÍTICO — jogador pode escolher valores arbitrários

🟠 ALTO — jogador pode alterar dados próprios sem validação

🟡 MÉDIO — alteração limitada, mas manipulável

🟢 BAIXO

FASE 2 — BLOQUEIO IMEDIATO

Faça uma migration de emergência.

IMPORTANTE:

Antes de alterar qualquer policy, analise as policies existentes e preserve SELECT necessário para o jogo continuar funcionando.

O frontend NÃO pode ter permissão direta para alterar:

nível do treinador

XP

Gold

Crystal

Ruby

Craft Points

nível de Pokémon

XP de Pokémon

stats de Pokémon

score do Ranked

posição no Ranked

recompensas

ownership de Pokémon

Remova permissões diretas de UPDATE/INSERT que permitam alteração arbitrária desses valores.

Especialmente procure policies perigosas como:

USING (true)
WITH CHECK (true)



ou policies onde apenas existe:

auth.uid() = user_id



mas o usuário ainda pode escolher livremente:

trainer_level = 10000
gold = 999999999
crystal = 999999999
pokemon_level = 999



Isso NÃO é proteção suficiente.

FASE 3 — RANKED

Analise imediatamente:

ranked_scores
ranked_leaderboard
record_ranked_score



O cliente NÃO pode informar como verdade:

_level
_craft_points
score
rank



Se a RPC atual recebe valores enviados pelo navegador, considere isso vulnerável.

Altere para que a função busque os valores verdadeiros no banco.

O fluxo deve ser:

CLIENTE
↓
solicita atualização
↓
RPC
↓
busca dados oficiais do jogador
↓
calcula score
↓
atualiza ranking



Nunca:

cliente envia level = 10000
↓
banco aceita



FASE 4 — TREINADOR

Identifique onde estão armazenados:

trainer_level
trainer_xp
craft_points
gold
crystal



Verifique se o frontend faz algo parecido com:

supabase
  .from(...)
  .update({
     trainer_level: valor,
     gold: valor,
     crystal: valor
  })



ou envia esses valores dentro de:

game_saves.data



Se sim, reporte imediatamente.

O cliente pode solicitar uma AÇÃO.

Ele não pode definir o RESULTADO.

Exemplo correto:

cliente:
complete_battle(battle_id)

servidor:
valida batalha
calcula XP
calcula Gold
calcula Crystal
atualiza jogador



FASE 5 — POKÉMON

Investigue onde o nível e XP dos Pokémon são salvos.

Procure estruturas como:

pokemon.level
pokemon.xp
level:
xp:
experience:



Identifique se existe qualquer caminho onde o navegador consegue salvar diretamente:

level = 999
xp = 999999999



Bloqueie escrita direta nesses campos.

Não permita que o usuário possa enviar um Pokémon completo alterado para o banco e substituir o original sem validação.

FASE 6 — GAME_SAVES

Analise a tabela game_saves.

Determine exatamente se ela permite algo como:

user_id correto
+
data = qualquer JSON



Se isso for verdade, é uma brecha crítica.

Porque um usuário autenticado pode simplesmente enviar:

{
  "trainerLevel": 10000,
  "gold": 999999999,
  "crystal": 999999999
}



e o banco aceitar.

NÃO simplesmente desative o save e quebre o jogo.

Primeiro implemente um bloqueio de emergência.

Se possível, crie validação server-side para impedir mudanças absurdas e campos proibidos enquanto a arquitetura definitiva não está pronta.

Quero também identificar:

máximo salto de level permitido

máximo ganho de XP

máximo ganho de Gold

máximo ganho de Crystal

máximo nível possível de Pokémon

FASE 7 — DETECTAR O QUE JÁ FOI ALTERADO

NÃO apague nada.

Crie uma investigação para encontrar jogadores suspeitos.

Procure:

trainer_level muito acima do esperado



XP incompatível com o level



Gold ou Crystal com aumento impossível



Pokémon acima do nível permitido



Craft Points anormais



Ranked incompatível com o progresso



Não aplique punição automática ainda.

Crie uma lista:

SUSPECTED_EXPLOITS



com:

user_id
username
reason
value
expected_range
created_at



FASE 8 — LOG DE SEGURANÇA

Crie:

security_events



Campos sugeridos:

id
user_id
event_type
severity
table_name
old_value
new_value
metadata
created_at



Registre tentativas bloqueadas como:

ILLEGAL_LEVEL_CHANGE
ILLEGAL_CURRENCY_CHANGE
ILLEGAL_POKEMON_CHANGE
ILLEGAL_RANKED_CHANGE
INVALID_SAVE



FASE 9 — NÃO CONFIE NO FRONTEND

Faça uma lista de todos os lugares onde atualmente existe:

FRONTEND → BANCO → VALOR IMPORTANTE



Exemplo:

frontend
↓
trainer_level = 5000
↓
update database



Esses são os pontos prioritários.

Quero uma tabela:

SistemaArquivoCampoCliente pode alterar?Risco

Inclua:

treinador

XP

Gold

Crystal

Ruby

Pokémon

inventário

Ranked

Market

Eggs

Rewards

FASE 10 — TESTE DE ATAQUE

Depois de aplicar o bloqueio, teste o próprio projeto.

Tente, como usuário comum autenticado, alterar diretamente valores absurdos usando as mesmas APIs disponíveis ao frontend.

Teste tentativas como:

trainer_level = 10000



gold = 999999999



crystal = 999999999



pokemon.level = 999



ranked score = 999999999



O resultado esperado é:

PERMISSION DENIED



ou:

VALIDATION FAILED



Se alguma tentativa funcionar, o sistema ainda está vulnerável.

RELATÓRIO OBRIGATÓRIO

ANTES DE FAZER UMA REFATORAÇÃO GRANDE, me entregue:

1. BRECHAS ENCONTRADAS

Arquivo + linha + explicação.

2. QUAL ERA A PIOR BRECHA

Explique exatamente como os jogadores poderiam alterar dados.

3. O QUE FOI BLOQUEADO

Liste migration, RLS, RPC e código alterado.

4. O QUE AINDA ESTÁ VULNERÁVEL

Seja honesto.

5. TESTE DE ATAQUE

Mostre:

trainer level: BLOQUEADO / NÃO BLOQUEADO
trainer XP: BLOQUEADO / NÃO BLOQUEADO
gold: BLOQUEADO / NÃO BLOQUEADO
crystal: BLOQUEADO / NÃO BLOQUEADO
pokemon level: BLOQUEADO / NÃO BLOQUEADO
pokemon XP: BLOQUEADO / NÃO BLOQUEADO
ranked: BLOQUEADO / NÃO BLOQUEADO`}
    </div>

  ),
})
