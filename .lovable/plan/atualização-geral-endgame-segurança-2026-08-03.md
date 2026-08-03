# Atualização Geral — Endgame + Segurança

## 1. Custo de armazenamento (rápido, risco zero)
- `POKE_VAULT_FEE_SHARDS`: 20.000 -> 30.000 Fragmentos Vermelhos.
- Limite de vagas (`POKE_VAULT_SLOTS = 200`) permanece intacto.
- Nada retroativo: pokémons já guardados continuam guardados.

## 2. Ginásio Medieval como endgame
- Trocar o mapa único do Vale por **3 mapas encadeados**, usando os 3 anexos como arte de fundo:
  - `gym_carmesim` (mapa vermelho de cristais) — entrada.
  - `gym_gelo_sombra` (mapa gelo/sombra) — segundo andar.
  - `gym_arcano` (mapa roxo arcano) — andar final / área Black Mythic.
- Progressão por nível de treinador + taxa de entrada em Fragmentos (crescente por andar).
- Pokémon do ginásio:
  - Novas espécies (Tyranitar, Aggron, Metagross, Garchomp, Hydreigon, Gengar, Dragonite, Absol, Abomasnow etc.), remoção das espécies fracas atuais (Diglett, Sandshrew, Machop, Cubone).
  - HP x, dano x, resistência x por andar; IA mais agressiva (reengajamento, perseguição maior, menos janelas de escape).
  - Captura extremamente difícil (multiplicador de dificuldade por andar aplicado sobre as taxas atuais).
- Drops:
  - Fragmentos Vermelhos mais altos por andar.
  - Novos itens raros com taxas muito baixas: Orb Suprema, Ultra Ball, Pergaminho de Teleporte, Fragmento Antigo, Pedra Mística, Medalha Medieval, Núcleo Arcano, Cristal Negro (ícones novos gerados).
  - Taxas calibradas para não inflacionar economia (itens top na casa de 0,05%–0,5%).

## 3. Área exclusiva Black Mythic
- Dentro de `gym_arcano`: zona liberada só para quem possui pokémon Black Mitic Plus.
- Chefes especiais (Apex arcanos) com HP muito alto e recompensa única (Núcleo Arcano / Cristal Negro garantidos no primeiro abate diário).
- Ambientação própria (overlay roxo, música e partículas).

## 4. Auditoria de segurança — o que já sei
Vetor confirmado pelo invasor: cliente edita estado e envia para a API; validação só depois.

Pontos frágeis atuais:
| # | Ponto | Impacto | Prioridade |
|---|---|---|---|
| 1 | `syncClientState` / save completo aceita o JSON do cliente como verdade (trigger apenas *clampa* teto) | nível/ouro/itens forjados abaixo do cap passam | Crítica |
| 2 | `game_saves` gravável direto pelo cliente via PostgREST (RLS de dono permite UPDATE arbitrário) | reescrita total do progresso | Crítica |
| 3 | Recompensas de kill/captura/baú também calculadas no cliente e persistidas no save | economia forjada | Alta |
| 4 | Ranking derivado do save (já autoritativo via RPC), mas o save é a origem contaminada | ranking falso | Alta |
| 5 | Marketplace / cofre / taxas descontadas no cliente | itens duplicados | Alta |
| 6 | Ausência de log de mutação (só IP em `ip_logs`) | invasão sem rastro | Média |

Correção proposta (sem quebrar ninguém):
- **Fechar a escrita direta**: revogar `INSERT/UPDATE/DELETE` de `authenticated` em `game_saves`; toda gravação passa a ocorrer por RPC `save_game_state` (SECURITY DEFINER) com validação de delta.
- **Validador de delta no servidor** (`enforce_game_save_caps` reescrito + RPC): rejeita/clampa ganhos por segundo acima do plausível (ouro, cristais, prisma, fragmentos, XP, nível, tamanho de coleção), rejeita itens inexistentes no catálogo e quantidades acima de teto por item.
- **Idempotência**: cada save carrega `client_seq`; saves fora de ordem são descartados (evita replay).
- Compatibilidade: nada é resetado; o validador só limita *ganho futuro*. Se o delta é inválido, mantém o valor anterior em vez de zerar.

## 5. Sistema de logs de auditoria
- Nova tabela `audit_events` (user_id, kind, ip, user_agent, device, country, before/after resumido, created_at) + índices.
- Escrita só por SECURITY DEFINER; leitura: dono vê o próprio, admin vê tudo.
- Eventos registrados: login/logout, IP/UA/dispositivo/país, alteração de save (com deltas de moedas/nível/itens/pokémon), compras, vendas, uso de item, chamadas críticas, erros, tentativas suspeitas e ações administrativas.
- Painel de log no HUD (jogador vê o próprio histórico; admin vê filtro por conta/IP).

## 6. Reforço cliente→servidor
- Toda função em `src/lib/game.functions.ts` passa a ignorar valores enviados pelo cliente para stats/level/moedas/recompensa — servidor recalcula a partir do save persistido e das tabelas de `game.balance.server.ts`.
- Zod estrito em toda entrada (whitelist de campos; rejeição de campos desconhecidos).
- Revisão de grants/RLS de todas as tabelas de progresso e ranked; nenhuma escrita direta pelo navegador.

## Riscos e mitigação
- **Risco:** validador de delta agressivo bloqueia jogador legítimo em sessão longa/AFK. **Mitigação:** tolerância generosa por tempo decorrido + log em vez de bloqueio na primeira semana.
- **Risco:** mover save para RPC pode falhar em clientes antigos em cache. **Mitigação:** manter o caminho antigo aceito por período de transição, já com validação, e só então revogar o grant.
- **Risco:** novos mapas pesando no carregamento. **Mitigação:** backgrounds via CDN de assets, carregados por andar.

## Recomendações extras
- Snapshot diário do save por conta (rollback cirúrgico em caso de invasão).
- Índices em `audit_events` e retenção de 90 dias.
- Flags de feature no servidor para ligar/desligar eventos sem republicar.

## Entregas técnicas
- Edições: `src/routes/idle.tsx` (mapas, spawns, drops, dificuldade, painel de logs), `src/lib/game.functions.ts`, `src/lib/cloudSave.ts`, `src/lib/game.balance.server.ts`, `src/lib/ipLog.ts`.
- Novos SQL: `SUPABASE_AUDIT_LOGS.sql`, `SUPABASE_SAVE_AUTHORITATIVE.sql`.
- Novos assets: 3 backgrounds do ginásio + 8 ícones de item raro.
- Relatório final de vulnerabilidades em `SECURITY_AUDIT_REPORT.md`.
