# Safari (`sa`)

O ID de save/teleporte continua `sa`; o nome visível é Safari.
Cada entrada custa 1.000 ouro + 10 Pepitas de Ouro (sem energia extra).
O débito e a mudança de mapa usam a mesma atualização de estado; sem saldo,
não há viagem. Clicar no mapa atual não cobra novamente. Voltar após morte cobra.

## Encontros especiais

Os spawns normais são Pokémon de Planta épicos: Bulbasaur, Ivysaur, Venusaur,
Oddish, Gloom, Vileplume, Bellsprout, Weepinbell, Victreebel, Exeggcute e Exeggutor.
A cada 20 derrotas de qualquer Pokémon no Safari, libera um encontro com
Snorlax, Snorlax Mítico, Kabutops, Kabutops Shiny ou Aerodactyl.
O progresso e os encontros já liberados ficam salvos; entrar novamente não
libera especiais extras. O contador antigo dos drops de cristal é separado.
Snorlax/Kabutops/Aerodactyl: Black Mítico (tier técnico `mythic_shiny`,
evento `safari:black_mitic`); variantes Mítico/Shiny: `mythic`, aura rosa.
Isso reutiliza os tiers existentes sem alterar regras globais de raridade.

Todos os selvagens: nível inteiro aleatório de 30 a 600, com chances iguais.
Os níveis são independentes do nível do treinador. Grades originais 4×4:
baixo/esquerda/direita/cima; quatro frames por linha, sem espelhar a sheet.
Ícones recortados separados para a coleção. Scripts preservam os originais.

## Captura

- Apenas Ultra Ball / Safari Ball; nenhuma outra bola é consumida nesses encontros.
- `safariUltraThrows` fica no save do jogador e acumula entre esses encontros.
- Ultra Ball: 0% nos primeiros 70; 2% na 71ª, crescendo 2 pontos por
  lançamento até 20% na 80ª e seguintes. Não há captura garantida.
- Safari Ball: 2% desde o primeiro lançamento; não aumenta o contador de Ultras.
- Capturar com qualquer uma das duas reinicia o contador.
- Preferência de bola disponível em Configurar Auto; Auto prioriza Safari Ball.
- Tanto o fluxo manual quanto o automático usam `src/game/safari.ts`.
- Os limites existentes de arremessos/encontro e recuperação são preservados.

## Chuva / drops

Mesmo ciclo de chuva dos mapas aquáticos: dois minutos de chuva, dois limpos.
`safariDefeats` conta apenas derrotas desses cinco Pokémon em `sa`.
A cada dez, cai um cristal azul no chão, com brilho azul suave. Só recolher
o drop acrescenta uma unidade a `bank.crystals`. Expiração normal de drops.

## Efeitos e skills

As auras reutilizam a névoa pulsante dos Black Mitic Plus, em violeta escuro
ou rosa/pérola, com seis esferas rosas e cinco estrelas em órbitas opostas,
halo suave e ondas expansivas, sem chamas. Auto e Poção exibem dois anéis giratórios e ON quando ativos;
o movimento respeita a preferência de acessibilidade por animações reduzidas.

Cada espécie especial tem cinco skills do catálogo existente, com pelo menos
duas áreas e três elementos. Seleção exclusiva de `sa`, prioridade para áreas,
ordem variada e sem repetir a última skill. Mantém range, engajamento,
cast, cooldown e limite de três conjuradores simultâneos do sistema existente.
`safariSkillIds()` em `src/game/safari.ts` registra as pools por espécie.

Selvagens percorrem destinos distantes dentro do campo andável, respeitando
obstáculos. Nascimentos priorizam pontos afastados dos outros selvagens,
com separação mínima de 240 px. A vegetação usa até 96 plantas animadas
em uma grade irregular de 12×8 cobrindo o campo andável, sem bloquear passagem.
Com o líder desmaiado, esferas podem atingir o treinador (100 HP, 15 por impacto,
desviável). Ao chegar a zero, retorna ao Laboratório e desliga o Auto.
Os mapas Cidade 0000 / Trilha 0055 / Lagoa 0066 / Bosque 0077 / Mundo XZ ficam
bloqueados pela lista central `BLOCKED_LAB_MAPS` em `src/game/mapAccess.ts`.

Validações: `node --test scripts/safari.test.mjs scripts/saMap.test.mjs scripts/saPlants.test.mjs`.
Regras executadas localmente; nenhuma migração ou alteração de backend.
