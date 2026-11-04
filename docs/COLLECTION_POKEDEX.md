# Coleção e Pokédex — HUD de registro

## Organização

- `src/components/collection/CollectionPanel.tsx`: janela compartilhada, moldura
  azul-marinho/dourada, abas, categorias laterais, progresso, busca, ordenação,
  dez cartões por página, retrato e detalhes à direita.
- `src/components/collection/collectionModel.ts`: filtros, ordenação, progresso,
  nomes, números nacionais conhecidos e elegibilidade visual para fragmentação.
- `src/components/collection/collection.css`: visual e adaptação para telas estreitas.
- `src/routes/idle.tsx`: adaptador dos dados reais e callbacks. Os layouts antigos
  permanecem desativados, como nas demais migrações da HUD.

## Dados e regras

- Coleção mantém cada captura individual, inclusive duplicatas, nível atual do
  integrante do time, evento, raridade, proteção, traits e pontos de craft.
- Detalhes completos abrem a ficha existente. Cadeados usam a chave original
  `rubym.colecao.locked.v1`; favoritos são uma preferência visual separada em
  `rubym.collection.favorites.v1` e **não** substituem a proteção.
- Fragmentação unitária ou em lote passa pela confirmação e pelas validações
  originais. Pokémon protegidos ou no time não são elegíveis.
- Pokédex usa o catálogo real de `SPECIES_BASE`, junto dos registros históricos.
  Entradas não vistas aparecem em silhueta. Capturas e encontros reais controlam
  os estados Visto/Capturado. Não modifica o registro de captura ou encontro.
- Tipos, movimentos e cores usam `getDex`, `TYPE_COLOR` e `TYPE_ICON` do jogo.
- Progresso conta espécies/formas distintas presentes no catálogo, não quantidade
  de capturas, e não usa o total fictício de 721 da imagem.
- Números nacionais conhecidos são estáveis e independem da ordenação/paginação.
  Formas especiais herdam o número da espécie base quando possível; números
  desconhecidos não são inventados.
- A aba Registros substitui conquistas inexistentes por estatísticas reais.
  Bônus de Coleção é informativa: nenhum bônus de XP/ouro/cristal foi criado.
- Sem alterações de backend, APIs, dados de produção ou regras de combate.

## Verificação

`node --test scripts/collection.test.mjs scripts/inventory.test.mjs scripts/hud-layout.test.mjs scripts/hud-target.test.mjs`

33 testes aprovados, incluindo dez testes novos para números, progresso sem
duplicatas, eventos, filtros, favoritos, proteção, ordenação, paginação, estado
vazio, silhuetas da Pokédex e recorte de folhas de animação 4×4.

TypeScript estrito dos novos componentes/modelo e ESLint sem a regra de
formatação Prettier: aprovados. Build e verificações globais não certificados
na máquina de 2 GB, conforme as limitações registradas em `HUD_FULLSCREEN.md`.

Validar no LOGIN TEST: abas, busca, filtros, estrelas, navegação entre páginas,
ficha original, cadeados e confirmação de fragmentação. Conferir moldura e
rolagem interna em desktop e mobile.

### LOGIN TEST — navegador integrado

Verificado em 800×611 com os dados isolados existentes (um Charmander no time):

- Coleção: progresso real 1/242; tamanho da janela 764×575, centralizada.
- Favorito marcado, persistido e listado na aba Favoritos.
- Proteção ativada/persistida e removida novamente; fragmentação do integrante
  do time permaneceu desabilitada.
- Registros e Bônus de Coleção exibiram informações sem recompensas fictícias.
- Pokédex: dez cartões por página e 25 páginas para o catálogo de 242 entradas.
- Silhuetas para os não vistos e detalhes habilitados para o capturado.
- Navegação à segunda página, filtro Capturados e busca sem resultados aprovados.
- Sem imagens quebradas ou rolagem externa. Capturas de tela conferidas.

Essa checagem usa interações DOM, não certifica todos os cliques nativos nem
o fluxo destrutivo de confirmação de fragmentação. Revisão final mobile e
build completo ainda pendentes. Nenhum dado de produção foi usado.
