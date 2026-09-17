---
title: Remoção segura dos mapas legados
description: Retirar os mapas solicitados sem afetar saves, sistemas compartilhados ou os mapas mantidos.
---

# Plano — Remoção de mapas do Idle Mon

## Resultado esperado
- Remover os 45 IDs solicitados de todos os pontos acessíveis do jogo.
- Manter `arena` (Vale Verdejante), `terra` e `mapinha5` a `mapinha13`, além dos demais mapas não listados.
- Preservar batalha, inventário, contas, progresso, níveis, XP, economia e salvamento.
- Saves antigos que apontem para um mapa removido serão redirecionados com segurança para `arena` ao carregar.

## Alterações

### Registro e carregamento dos mapas
- Reduzir o tipo e o catálogo de mapas aos IDs que permanecerão.
- Remover imports e URLs de imagens usados exclusivamente pelos mapas excluídos.
- Manter assets e módulos compartilhados quando ainda forem usados por outras funções.

### Viagem e mapa-múndi
- Remover pins, seletores, entradas, portais, teletransportes e destinos ligados aos mapas excluídos.
- Ajustar portais dos mapas restantes para nunca apontarem para `cidade` ou outro destino removido; usar `arena` como retorno válido.
- Manter o mapa principal, seus gráficos e sua movimentação intactos.

### Spawns e regras específicas
- Remover pools de Pokémon, multiplicadores, restrições de captura, timers, expulsões e regras especiais exclusivas dos mapas excluídos.
- Remover integrações dos eventos Gelius, Oddish, Governante e Dark somente onde dependem desses mapas.
- Preservar Pokémon, itens, stones e sistemas compartilhados usados fora deles.

### Compatibilidade dos saves
- Continuar aceitando saves existentes sem apagar dados.
- Normalizar `currentMap` e mapas de retorno antigos para `arena` quando o ID não existir mais.

## Verificação
- Fazer busca global final pelos 45 IDs em código executável e revisar referências residuais legítimas, como scripts SQL históricos não executados pelo jogo.
- Executar a validação automática do projeto e corrigir erros de tipos/imports.
- Abrir o jogo, conferir o mapa principal e testar mapa-múndi/viagem em desktop.
- Informar arquivos alterados, lista removida e resultado da validação.
