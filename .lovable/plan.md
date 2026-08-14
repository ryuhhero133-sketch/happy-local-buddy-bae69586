# Plano de Implementação: Reset de Nível no Banco Medieval

O objetivo deste plano é garantir que o ritual de reset de temporada do Ancião Glacial também afete os Pokémon guardados no Banco Medieval, e que qualquer Pokémon retirado do cofre tenha seu nível resetado para 1 (garantindo que não haja "bypass" do sistema de temporadas).

## Alterações Propostas

### 1. Atualizar o Ritual de Reset (`handleSeasonReset`)
- Modificar a função `handleSeasonReset` para iterar sobre o array `pokeVault` dentro do estado `idle`.
- Aplicar a lógica de reset (nível 1, XP 0, HP restaurado) a todos os Pokémon no cofre.

### 2. Atualizar a Retirada do Cofre (`withdrawPoke`)
- Modificar a função `withdrawPoke` para que, ao mover um Pokémon do `pokeVault` de volta para a `collection`, o nível e o XP do Pokémon sejam resetados para 1 e 0, respectivamente.
- Isso serve como uma camada adicional de segurança para garantir que Pokémon guardados em seasons anteriores com níveis altos sejam normalizados ao entrar no fluxo de jogo atual.

### 3. Atualizar UI do Banco Medieval
- Alterar o texto informativo no Banco Medieval para refletir que os níveis serão resetados ao retirar os Pokémon, removendo a menção de que eles "não serão resetados".

## Detalhes Técnicos
- Arquivo afetado: `src/routes/idle.tsx`
- Funções a modificar: `handleSeasonReset` (aprox. linha 3006), `withdrawPoke` (aprox. linha 10558).
- A lógica de reset utilizará a função auxiliar `resetPet` já existente para manter a consistência.

---
**Nota:** O Banco Medieval continuará protegendo os Pokémon de serem convertidos em fragmentos (eles permanecem como instâncias), mas seus atributos de progressão (nível/XP) serão reiniciados conforme solicitado.
