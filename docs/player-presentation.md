# Visuais públicos e cuidado rápido

- Todos os observadores no mesmo mapa veem o selo VIP ativo (Epic, Cristal ou
  Gold), a Nevezinha equipada e a montaria ligada dos outros jogadores.
- A presença envia somente informações visuais em `players.cosmetics`.
  Esses campos não concedem VIP, itens nem benefícios; os saves não são expostos.
- A atualização continua no polling existente de 8 segundos. VIP e montaria
  expirados deixam de aparecer; sair do mapa limpa a presença.
- O calendário de recompensas e o atalho de evento foram retirados da interface.
  O histórico salvo permanece intacto; o NPC da Nevezinha continua funcionando.
- O Mapa Mundi usa as artes existentes, insígnias vetoriais e ícones de itens
  com nomes acessíveis, sem alterar destinos, bloqueios ou recompensas.
- A partir de 50/100 de fome, o líder mostra uma fruta sobre a cabeça.
  Clicar consome 1 Morango (+30) ou, se não houver Morango, 1 Limão (+20).
  Sem fruta, a ação apenas avisa, sem alterar inventário ou Pokémon.

Validação: `node --test scripts/playerPresentation.test.mjs`.

## Banco

A migration `20261125092242_players_cosmetics.sql` acrescenta uma coluna JSONB,
sem alterar permissões nem as políticas existentes de `players`.
RLS e acesso autenticado à coluna foram conferidos. A auditoria também aponta
avisos preexistentes fora desta alteração: [search_path de função](https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable),
[RPCs privilegiados](https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable)
e [proteção de senhas vazadas](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection).
