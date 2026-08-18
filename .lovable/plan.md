# Plano de Implementação: Visualização de Recursos e Pokémon no Banco Medieval

O objetivo é transformar o "Banco Medieval" (anteriormente Carteira) em uma central onde o jogador possa visualizar não apenas suas moedas (Ouro e Cristais), mas também os itens e Pokémon que possui, reforçando a temática de "resgate" e gestão de recursos.

## Mudanças Propostas

### 1. Atualização da Interface `WalletScreen` (Banco Medieval)
- Adição de abas ou seções para alternar entre "Moedas/Câmbio", "Itens" e "Pokémon".
- Integração da lista de Pokémon (`collection`) e itens (`items`) na tela de Banco.
- Estilização temática condizente com o "Banco Medieval", usando tons dourados, obsidiana e pergaminho.

### 2. Seção "Cofre de Itens"
- Exibição em grade dos itens do jogador com quantidades.
- Uso de filtros básicos (Consumíveis, Stones, Especiais).

### 3. Seção "Cofre de Pokémon"
- Exibição compacta da coleção do jogador.
- Indicação visual de Pokémon que estão no time vs. os que estão no "cofre" (reserva).

### 4. Refatoração de Fluxo
- Passagem de props adicionais (`items`, `collection`, `gifMap`, `onOpenColecaoDetail`) para o componente `WalletScreen` dentro de `TabOverlay`.
- Atualização do botão "RESGATAR TUDO" para servir como um atalho de sincronização visual, com feedback aprimorado.

## Detalhes Técnicos
- O arquivo `src/routes/idle.tsx` será o foco das edições.
- O componente `WalletScreen` será expandido para aceitar as novas props de dados.
- Utilização de `overflow-y: auto` para garantir que a navegação seja fluida mesmo com muitos itens.
- Preservação da lógica de câmbio (Gold ⇄ Crystals) existente.

---
**Nota:** Nenhuma lógica de banco de dados (Supabase) será alterada, apenas a visualização frontal dos dados já carregados no estado da aplicação.