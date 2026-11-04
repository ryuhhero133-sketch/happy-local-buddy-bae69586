# Mochila — HUD azul-marinho e dourada

## Estrutura

- `src/components/inventory/InventoryPanel.tsx`: janela, seis abas, categorias,
  busca, grade 6×4 paginada, detalhes, quantidade, ações e visuais.
- `src/components/inventory/inventoryModel.ts`: classificação, filtros, raridades
  visuais e limites seguros de quantidade.
- `src/components/inventory/inventory.css`: moldura, painéis e adaptação mobile.
- `src/routes/idle.tsx`: adaptador dos itens e callbacks existentes. A mochila
  anterior não é montada; seu JSX permanece como legado nesta migração.

## Regras preservadas

- Quantidades e imagens vêm dos itens existentes, sem capacidade fictícia.
- “Expandir” amplia a janela, não compra espaços.
- Somente poção e livros básicos ATK/DEF permitem usar várias unidades.
- Rare Candy mantém a ação de 2 unidades por 100 de energia do baú.
- Pokébolas, materiais e itens de outros sistemas não são consumidos pela UI.
- Cofre é somente leitura e usa chaves distintas (`vault:`).
- Equipamentos e skins continuam usando os callbacks originais. Venda de pedras
  mantém lotes de 250 por 2 safiras; forja mantém requisitos anteriores.
- Z usa o item selecionado; X pede confirmação para descartar uma unidade; Esc
  fecha. O antigo listener da mochila foi removido para evitar consumo duplicado.
- Sem alterações de backend, migrações ou dados de produção.

## Validação

`node --test scripts/inventory.test.mjs scripts/hud-layout.test.mjs scripts/hud-target.test.mjs`

Resultado: 23 testes aprovados. TypeScript dos dois novos arquivos TS/TSX aprovado
com `--strict --noEmit --skipLibCheck`. ESLint destes arquivos aprovado com a
regra de formatação Prettier desabilitada.

A verificação TypeScript global não concluiu por falta de memória nesta máquina
de 2 GB. O servidor Vite também atingiu o limite de heap de 384 MB ao carregar o
jogo; isso não equivale a uma validação completa de build ou integração.

Conferir no LOGIN TEST: seleção, busca, abas, paginação, uso unitário/em lote,
cofre, venda, forja, equipamentos, skins e layouts desktop/mobile.

### Navegador local

Vite com heap de 640 MB conseguiu carregar o jogo. Verificação via DOM, somente
no LOGIN TEST, em 800×611 e com fixture isolada de 40 tipos (34 itens e seis
equipamentos):

- 24 slots na primeira página; 16 na segunda; exatamente uma seleção por página.
- Aba Pokébolas: três tipos e uso direto desabilitado.
- Categoria Ovos: nove tipos; ovo ancestral sem ação de chocar.
- Janela de visuais: seis espaços de equipamento e cinco skins acessíveis.
- “Máx.” da poção selecionou as 25 unidades existentes.
- Sem rolagem externa ou imagens quebradas na mochila nesse tamanho.

O teste encadeado de consumo/busca foi interrompido pelo reload do Vite durante
a atualização da rota; não é contabilizado como aprovado. Captura de tela não
disponível porque a janela do navegador integrado não estava visível. Revisão
visual final desktop/mobile e testes de venda/cofre/forja ainda pendentes.
