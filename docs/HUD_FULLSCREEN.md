# HUD fullscreen

Branch: `feat/hud-fullscreen-nightcrow-style`.

## Organização

- `src/components/hud/GameHud.tsx`: composição, perfil, recursos, atalhos, minimapa, dock e ações.
- `src/components/hud/QuestTracker.tsx`: acompanhamento das quests existentes, paginação e resgate por callback.
- `src/components/hud/ChatHud.tsx`: filtros do feed existente, rolagem interna e recolhimento.
- `src/components/hud/TargetHud.tsx`: alvo compacto (retrato, nível e HP), com cores por tier.
- `src/components/hud/hudLayout.ts`: interseção entre mapa e viewport e escala adaptativa da HUD.
- `src/components/hud/hud.css`: apresentação isolada por `.revo-game` / `.revo-hud`.
- `src/routes/idle.tsx`: continua proprietário de todo o estado, gameplay, renderização do mundo, persistência e callbacks.

O zoom começa em 100% e pode ser reduzido para 90% e 80%, sem a antiga trava
automática de preenchimento da janela. Em regiões menores, isso pode revelar
bordas ao redor do mapa, em vez de esticar a arte. A escala continua uniforme e
a mesma transformação é usada pelo mundo, câmera e cliques. Restrições específicas
de regiões, como a Esfera Ancestral, continuam preservadas.

A HUD prefere escala visual independente de 80% no desktop, 90% em telas
intermediárias e 100% no mobile. Em mapas pequenos, a escala pode diminuir mais
para caber na imagem. Isso não altera o zoom do navegador nem o tamanho do mapa.

A viewport ocupa a janela; a camada da HUD ignora cliques em áreas vazias.
O mundo continua usando a câmera, dimensões e máscaras originais. A dock não
reserva altura de layout. A aba inicial agora é a batalha, não a ficha de Pokémon.
Painéis completos só abrem sob demanda; clicar novamente no atalho ativo os fecha.

As versões anteriores da topbar, sidebars e dock não são montadas. O código JSX
legado foi mantido desativado nesta primeira migração, para não misturar a
reorganização visual com uma remoção extensa de código do monólito. Os diálogos
de mapa, teleporte, configurações e Forja continuam com os proprietários originais.

## Dados reais e limites

- HP do cartão: HP real do Pokémon líder, identificado no tooltip e no rótulo acessível.
- EN: energia real do treinador. Saciedade continua disponível no menu de mais sistemas.
- Canal: exibe `SOLO`; a rota atual não usa o módulo `mpChannel` nem expõe seletor de canal.
- Minimapa: arte real da região, dimensões reais e marcadores das posições atuais.
- Quests: progresso, alvos, recompensas e regras VIP existentes, sem números de exemplo.
- Chat global continua desativado. O campo informa a indisponibilidade; os eventos funcionam.
- Marketplace continua bloqueado / em breve.
- Notificações mostram somente missões prontas e sinais existentes da Forja. Não há correio fictício.
- O aviso do LOGIN TEST foi movido para a borda inferior. O primeiro render usa o
  mesmo splash do servidor para evitar divergência de hidratação; os fluxos de
  sessão/autenticação existentes não foram alterados.
- O resgate de códigos foi movido para o menu de sistemas adicionais, evitando
  sobreposição com o botão da Forja.
- `TeamHud.tsx` mostra a equipe real à esquerda, com retratos em molduras de
  Pokébola, nível, HP, XP e fome, cores por raridade e acesso aos detalhes/cuidados.
  O cabeçalho abre o gerenciamento da equipe e permite recolher os detalhes sem
  perder os retratos clicáveis. Barras e nomes acompanham as mudanças do time.
- O carregamento local agora preserva até seis integrantes já salvos, em vez de
  descartar todos menos o primeiro. A equipe inicial continua com um Pokémon.
- Hover, clique e modo Auto têm animações discretas, desativadas com
  `prefers-reduced-motion`.
- Nenhum arquivo de backend, migração, integração Supabase ou configuração de Worker faz parte do redesign.

## Validação manual

Utilizar `http://localhost:8080/idle` e o LOGIN TEST, sem usar uma carteira real.

1. Conferir ausência de scroll externo e viewport em toda a janela.
2. Conferir perfil, seis recursos, relógio e atalhos sem interseções.
3. Caminhar com WASD/setas e por clique, inclusive após redimensionar a janela.
4. Ampliar/reduzir zoom, abrir mapa grande e o atlas de teleporte.
5. Trocar de região, verificar coordenadas e posição do marcador.
6. Testar Auto e captura automática em uma região permitida; a cidade deve continuar segura.
7. Abrir/recolher alvos e selecionar um alvo; conferir a barra superior do inimigo.
8. Abrir e fechar cada item da dock, voltar por Escape, conferir mochila, equipe e coleção.
9. Paginar/recolher quests e conferir resgate somente quando elegível.
10. Alternar filtros e recolher chat; não enviar mensagens a backend.
11. Abrir Forja, configurações, notificações e o menu de sistemas adicionais.
12. Recarregar e verificar que o save continua separado do login real.

Resoluções desktop prioritárias: 1920×1080, 1672×941, 1366×768 e 1280×720.
Também há fallback para telas estreitas, mas a referência visual é desktop.

## Comandos

O repositório utiliza `bun.lock`; não regenerar versões com npm sem necessidade.

```powershell
npm run build
npm run lint
node node_modules/typescript/bin/tsc --noEmit
git diff --check
```

Em máquinas com pouca RAM, executar build, TypeScript e navegador separadamente.
Falha por falta de memória não significa validação aprovada; deve ser registrada
separadamente de erros de código.

## Resultado da validação nesta máquina

- Navegador Chrome headless, somente LOGIN TEST: quatro resoluções desktop
  prioritárias e os tamanhos extras 800×614 e 390×844.
- Viewport com as mesmas dimensões da janela; sem scroll externo, sem ícones
  quebrados e sem interseções nos pares principais verificados (perfil/recursos,
  recursos/atalhos, chat/dock, minimapa+quests/ações).
- Cliques reais de mouse: recolher/expandir chat, quests e dock; paginar quests;
  abrir/fechar mochila; alternar captura automática; abrir/fechar Forja; abrir
  mapa grande. Todos passaram.
- Movimento com teclado: coordenadas alteradas após pressionar D, aprovado.
- Nenhuma exceção JavaScript na última execução.
- TypeScript dos três novos componentes: aprovado (`--noEmit --skipLibCheck`).
- ESLint dos novos componentes sem a regra de formatação Prettier: aprovado.
- Sintaxe TSX da rota principal e componentes: aprovada por `transpileModule`.
- `git diff --check`: aprovado.
- Build de produção: 3.201 módulos transformados, mas a gravação final falhou
  com `ENOSPC` (disco sem espaço). A saída parcial gerada foi removida. **Build
  completo não certificado.**
- `npm run lint -- --quiet`: não concluiu, por falta de memória no heap de
  384 MB. A máquina possui 2 GB de RAM. **Lint global não certificado.**
- Combate completo em campo, teleporte entre regiões e integrações online não
  foram certificados por esses testes. Backend/Supabase continuam bloqueados
  no LOGIN TEST; não houve teste ou alteração de dados de produção.

### Revisão: equipe lateral e escala compacta

Validação com Chrome headless em perfil temporário próprio, LOGIN TEST e uma
fixture local de seis Pokémon com níveis, fome e raridades diferentes:

- 1672×941, 1920×1080, 1366×768, 1280×720, 800×614 e 390×844: viewport integral,
  sem scroll externo, sem imagens quebradas e sem sobreposição equipe/chat.
- Seis retratos renderizados, com cores de tier e três barras por integrante.
- Clique real no segundo Pokémon abriu os detalhes corretos.
- Recolher a equipe manteve os seis retratos clicáveis.
- Zoom 100% → 90% → 80%; nova tentativa de reduzir manteve o mínimo em 80%.
- Os seis integrantes permaneceram após recarregar a página.
- Preferência de movimento reduzido respeitada; nenhuma exceção JavaScript.
- TypeScript dos quatro componentes da HUD aprovado; lint funcional da HUD
  aprovado com a regra de formatação Prettier desativada.

As limitações de build completo/lint global descritas acima continuam registradas.

### Revisão: alvo compacto, recursos menores e HUD dentro do mapa

- A HUD agora é ancorada na interseção da imagem real do mundo com a viewport,
  usando a mesma câmera, offsets de centralização e escala do renderizador.
  Bordas pretas de zoom-out não são usadas como área para perfil, equipe ou HUD.
- O alvo antigo não é mais montado. A apresentação nova mostra apenas retrato,
  nível e barra de HP, com nome, HP numérico e indicação de elite disponíveis na
  descrição acessível/tooltip, sem poluição visual.
- Cores do alvo: comum verde, incomum verde-água, raro azul, épico roxo,
  lendário laranja, mítico rosa e mítico shiny rosa-lilás. Spritesheets mantêm
  frame e direção originais. Não houve mudança na seleção ou lógica de combate.
- Cápsulas de recursos: 24 px de altura visual no desktop em escala de 80%,
  contra 32 px antes, além de ícones e largura máxima menores.
- A dock se centraliza no espaço disponível entre chat e ações, inclusive
  quando a imagem fica menor que a janela.

Testes automatizados reproduzíveis (sem nova dependência):

```powershell
node --test --test-concurrency=1 scripts/hud-layout.test.mjs scripts/hud-target.test.mjs
```

Resultado: **16 testes aprovados**, incluindo ancoragem em zoom-out, resize,
escala adaptativa, conteúdo mínimo do alvo, sete cores de tier, limites de HP
e recorte de spritesheets.

Também foi validado em Chrome headless com LOGIN TEST, equipe de seis Pokémon
e combate local no Mapinha 7: seis resoluções em zoom de 80%, perfil/equipe/alvo
dentro da imagem, sem scroll externo, sem imagens quebradas, sem conflito da
dock com o chat e sem exceções JavaScript. Alvo com aproximadamente 106×35 px
no desktop; TypeScript dos componentes da HUD aprovado.
