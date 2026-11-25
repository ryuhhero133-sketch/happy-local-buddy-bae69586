> Status: manutenção removida e `private.emerald_journey_config.enabled = true`. A introdução é obrigatória; o reset único acontece ao concluir as 53 páginas.

# Jornada de abertura — liberação oficial

**Liberação oficial ativa.**

O banco foi instalado com `private.emerald_journey_config.enabled = false`.
Somente a conta proprietária recebe uma **prévia privada**, com progresso
independente e **sem conversão de níveis ou concessão de estrelas**.
O editor possui “Rever abertura (prévia sem reset)”.

## Ativar somente após autorização para a versão oficial

1. Validar a prévia no computador e no celular deitado, incluindo F5 no diálogo.
2. Confirmar backup, deploy do cliente e publicação dos mapas/TPs da versão oficial.
3. Com os jogadores ainda em manutenção, executar administrativamente:

```sql
update private.emerald_journey_config
set enabled = true
where id and version = 'emerald_journey_v1';
```

4. Só então liberar os jogadores usando o procedimento de manutenção.
   A ativação acima **não** altera o bloqueio de manutenção, a HUD beta ou o
   acesso privado aos demais mapas.

## Fluxo oficial

- Qualquer conta nova ou antiga, sem conclusão oficial, passa pelas cenas 1–7
  no Templo BOBO T2. O jogo não monta até concluir: sem movimento ou farm.
- Cada página salva seu cursor no servidor. Sem confirmação, não avança.
  F5 e outro navegador retomam a página confirmada; não há botão de pular.
- A última página faz, no mesmo commit, backup integral + conversão + conclusão.
- Treinador e todos os Pokémon (time, líder, coleção e banco) voltam ao **Nv. 1,
  XP 0**. A XP é zerada para não devolver os níveis antigos no próximo ganho.
- Estrelas permanentes adicionais: abaixo de 100 = 0; 100–149 = 1;
  150–299 = 2; 300+ = 4. Mesmo UID nas várias listas recebe a mesma conversão.
- Estrelas/rebirths permanentes anteriores são preservados, respeitando o teto
  de sete estrelas. Itens, moedas, VIP, raridades, traits e Pokémon não são apagados.
- Imagem `emerald 1.webp` durante o loading; chegada em Emerald, `(768, 512)`.
- Replay, F5 e duas chamadas simultâneas não refazem a conversão.
- Um save anterior ao reset é recusado pelo servidor. Bases locais antigas vão
  para recuperação em vez de ressuscitar níveis.

Os backups ficam em `private.emerald_journey_backups`, sem acesso pelo cliente.
O progresso tem RLS de leitura por conta; apenas os RPCs podem avançá-lo.

## Validação

`node --test scripts/emeraldJourney.test.mjs`

`supabase/tests/emerald_journey.test.sql` testa os RPCs numa subtransação
**sempre revertida**, inclusive no sucesso. Não efetiva resets em contas.

As artes PNG e os áudios originais enviados foram mantidos no diretório local.
O jogo importa somente WebP e áudio M4A/AAC (compatível com iPhone): música de
75s (~375 KB) e digitação (~3 KB). O OGG/Opus foi descartado porque o Safari
não o reproduz em todas as versões de iOS.
