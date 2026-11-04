# Mapas lisos (0000 / 0055 / 0066 / 0077 / xz)

Cinco mapas entram pelo mesmo caminho dos mapas gratuitos do Professor:
**aba MAPAS do Laboratório → VIAJAR · GRÁTIS**. Sem ouro, sem energia e sem
nível de treinador.

| ID interno    | Nome exibido  | PNG                       | Dimensões   | Spawn     | Elemento |
| ------------- | ------------- | ------------------------- | ----------- | --------- | -------- |
| `map_0000`    | Cidade 0000   | `src/ambiente/0000.png`   | 1448 × 1086 | 724, 543  | Normal   |
| `map_0055`    | Trilha 0055   | `src/ambiente/0055.png`   | 1183 × 1329 | 900, 1150 | Terra    |
| `map_0066`    | Lagoa 0066    | `src/ambiente/0066.png`   | 1122 × 1402 | 900, 1150 | Água     |
| `map_0077`    | Bosque 0077   | `src/ambiente/0077.png`   | 1983 × 793  | 1250, 620 | Planta   |
| `map_xz`      | Mundo XZ      | `src/ambiente/xz/xz.png`  | 4071 × 3258 | 872, 1396 | Normal   |

IDs internos com prefixo `map_` para não criar chaves numéricas em objetos
(`IDLE_MAPS["0000"]` seria inválido como identificador em alguns contextos).

## O que torna o mapa "liso"

- **Sem Pokémon**: os quatro estão em `FREE_WALK_MAPS` → pools de spawn vazias
  e snapshots de inimigos limpos ao entrar.
- **Sem objetos**: estão na guarda do `buildObstacles` (que devolve `[]`) e
  baús/orbs são zerados ao trocar de mapa.
- **Sem colisão**: não há máscara. `ProfMapDef.mask` ficou opcional e nenhum
  `ensureCollision()` roda para esses mapas — `isWalkable()` sem grade
  cacheada devolve `true`, então dá andar em qualquer ponto do PNG.
- **Sem eventos de alto nível**: presentes em `NO_HIGH_EVENT_MAPS`.
- **Sem custo**: `free: true` no Professor (sem `reqPts`/`reqLevel`) —
  `profTravelTo` não cobra ouro nem energia.

## Onde foi mexido

- `src/components/professorLabData.ts` — imports dos PNGs, `ProfMapId` e
  `mask?` opcional, os quatro `ProfMapDef`, `PROF_MAPS`, `PROF_MAP_BY_ID` e
  `PROF_SPAWNS`.
- `src/routes/idle.tsx` — imports, `IDLE_MAPS`, guarda do `buildObstacles`,
  `customMapUrls`, `FREE_WALK_MAPS`, `NO_HIGH_EVENT_MAPS`.
- `src/components/ProfessorLabPanel.tsx` — cabeçalho dinâmico da aba MAPAS
  (`{PROF_MAPS.length} MAPAS PARA EXPLORAR`) com texto explicando os grátis.
- `scripts/flatMap.test.mjs` — 27 testes de registro (60 no total da suíte).

## Fora do escopo

Os quatro **não** entraram no HUD "Mapa Mundi" (que cobra energia por
viagem) — coerente com os demais mapas gratuitos do Professor (`azulante`,
`hallow`, `caverna_brok`).

## Como testar (modo LOGIN TEST)

1. `sessionStorage.setItem("idlemon.offline-test","1")` e abrir `/idle`.
2. Mapa Mundi → aba **VILLAGE** → Laboratório "Teleportar · grátis".
3. Falar com o NPC Professor → aba **MAPAS** → `VIAJAR · GRÁTIS`.
4. Conferir: sem 🔒, sem nível, ouro/energia intactos, `enemies: 0`,
   nenhum `.chest-idle`, movimento livre em qualquer direção.
