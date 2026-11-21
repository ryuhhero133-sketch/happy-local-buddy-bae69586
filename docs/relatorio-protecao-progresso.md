# Proteção e auditoria de progresso

## Diagnóstico

- O checkpoint completo usa `game_saves` e um debounce de seis segundos.
  Alterações contínuas podem impedir que esse temporizador chegue ao fim.
  O limite de dois minutos no cliente força uma tentativa, não uma garantia
  de entrega: conexão, sessão, liderança de aba e banco ainda podem falhar.
- Uma resposta de checkpoint podia apagar uma fila local mais recente. Agora
  a fila só é removida quando seu hash coincide com o snapshot confirmado.
- Uma aba que não é líder informava sucesso mesmo sem gravar no servidor.
  Agora a chamada informa que não houve confirmação.
- A hidratação do blob substitui o time e o banco por inteiro; há também
  sincronização de tabelas normalizadas. Investigar conflitos usando as cópias
  disponíveis, sem combinar automaticamente recursos, inventário ou níveis.
- O SQL versionado no repositório registra a chave de idempotência antes de
  verificar versão e limite de ouro. Um replay de uma tentativa rejeitada
  pode receber `duplicate`; conferir a função realmente instalada no banco
  e corrigir transacionalmente antes de confiar nessa resposta. O SQL também
  precisa de concorrência atômica na comparação de versão. Não presumir que
  o SQL do repositório é igual ao que está em produção.
- A morte ARV, outras penalidades e o reset de nível podem reduzir níveis
  legitimamente. Uma regra de máximo permanente reverteria essas ações.
- Fechamento de aba e falta de conexão não garantem que requisições terminem.
  Não limpar dados do navegador de jogadores afetados: fila local, recuperação
  e cofre IndexedDB podem conter a única cópia do progresso.

## Histórico e consulta

`supabase/migrations/20261116130000_progress_audit.sql` cria histórico privado
de snapshots anteriores e novos quando mudam níveis/capturas ou quando ocorre
um checkpoint após dois minutos. Ele registra apenas saves aceitos **depois**
de instalado; não reconstrói progresso que nunca chegou ao servidor. A falha
da auditoria não bloqueia o save e é registrada como aviso no PostgreSQL.
Não há agendamento externo nem relatório de jogadores offline. O crescimento
do banco deve ser monitorado e uma retenção/backup definidos pelo operador
antes de uma limpeza; a migration não apaga histórico.

No SQL Editor, após aplicar a migration, consulte histórico de um jogador:

```sql
select recorded_at, save_version, reason,
       snapshot #>> '{idle,trainerLevel}' as treinador,
       private.progress_level_signature(snapshot) -> 'pokemon' as pokemons
from private.progress_save_history
where user_id = 'UUID-DO-JOGADOR'::uuid
order by recorded_at desc
limit 100;
```

Para a última amostra de cada conta:

```sql
select distinct on (user_id)
       user_id, recorded_at, save_version, reason,
       snapshot #>> '{idle,trainerLevel}' as treinador,
       private.progress_level_signature(snapshot) -> 'pokemon' as pokemons
from private.progress_save_history
order by user_id, recorded_at desc;
```

Essas consultas são administrativas: não exponha os snapshots ou IDs de
jogadores publicamente. O histórico não é uma ferramenta de restauração
automática; confirme identidade, eventos legítimos e backups antes de restaurar.

## Verificações antes de ativar em produção

1. Fazer backup do banco e testar a migration em ambiente de teste com um save
   real, incluindo captura, evolução, reset e morte ARV.
2. Comparar a função `checkpoint_save` instalada com a migration do repositório,
   testar concorrência, replay após rejeição e falhas de rede.
3. Testar duas abas/dispositivos, offline/reconexão e atualização durante
   checkpoint lento; confirmar visualmente a versão gravada no banco.
4. Confirmar capacidade/alertas do banco; o histórico contém snapshots completos.
5. Para casos já afetados, preservar dispositivos, coletar UID, horário e níveis
   e examinar `game_saves`, histórico existente e cópias locais antes de agir.
