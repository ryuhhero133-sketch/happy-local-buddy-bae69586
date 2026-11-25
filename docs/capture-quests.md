# Missões 20 — capturas individuais

Cada conta tem as mesmas 20 missões, mas o progresso é individual e fica salvo
no `idle.captureQuests`. A missão conclui quando a espécie indicada é capturada
em qualquer mapa; mapa, nível e chance são apenas a dica de onde encontrar.

O painel aparece no lado direito do HUD. O botão **Ver as 20** abre a lista
completa com o progresso e os pacotes a cada 5.

## Lista

| # | Pokémon | Mapa | Nível | Spawn | Missão |
|---|---|---|---|---|---|
| 01 | Bulbasaur | 01 | 8 | 1% | O Guardião Verde |
| 02 | Pikachu | 01 | 5–8 | 2% | Energia Perdida |
| 03 | Charmander | 02 | 18 | 0,5% | A Última Chama |
| 04 | Eevee | 02 | 16–18 | 1,5% | As Três Evoluções |
| 05 | Squirtle | 03 | 28 | 1% | O Pequeno Marinheiro |
| 06 | Abra | 03 | 24–27 | 3% | Mestre do Teleporte |
| 07 | Growlithe | 03 | 22–26 | 8% | Companheiro Leal |
| 08 | Scyther | 04 | 35–38 | 2,5% | A Lâmina Selvagem |
| 09 | Pinsir | 04 | 35–38 | 2,5% | O Rei dos Insetos |
| 10 | Kangaskhan | 04 | 38 | 1% | Instinto Materno |
| 11 | Gengar | 05 | 46–48 | 3% | A Sombra Perdida |
| 12 | Alakazam | 05 | 48 | 2% | Poder da Mente |
| 13 | Ditto | 05 | 44–47 | 5% | O Impostor |
| 14 | Snorlax | 06 | 60 | 1% | O Gigante Adormecido |
| 15 | Arcanine | 06 | 54–58 | 6% | A Fera Flamejante |
| 16 | Dratini | 06 | 55–59 | 4% | O Dragão Perdido |
| 17 | Dragonair | 06 | 58–60 | 2% | A Serpente Celestial |
| 18 | Lapras | 07 | 75 | 2% | A Canção Glacial |
| 19 | Gyarados | 08 | 84–88 | 5% | A Fúria dos Mares |
| 20 | Dragonite | 08 | 88–90 | 1% | O Último Dragão |

## Prêmios automáticos

| Missões | Recompensa |
|---:|---|
| 5 | 5 Cristais Vermelhos · 50 Poções · 10 Great Balls |
| 10 | 10 Cristais Vermelhos · 100 Poções · 10 Ultra Balls · 1 Orb Menor |
| 15 | 15 Cristais Vermelhos · 150 Poções · 2 Rare Candy · 1 Orb Maior |
| 20 | 30 Cristais Vermelhos · 200 Poções · 1 Master Ball · 1 Orb Supremo |

Os prêmios são entregues uma única vez por conta. O helper
`applyCaptureQuest` marca a captura, libera o pacote e evita duplicação.
