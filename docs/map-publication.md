# Mapas públicos e nomes MP

## O que os jogadores veem

- O **Mapa Mundi continua no visual original**: continente, regiões, ginásios,
  insígnias, temporada e recompensas. Não existe uma lista com todos os mapas.
- O único botão removido foi **“Todos os mapas (atlas antigo)”**.
- Os mapas criados, os teleportes e os matos são acessados **andando pelo mundo
  e usando os TPs publicados**, não por uma lista no Mapa Mundi.
- O HUD, as falas da saga e os avisos de teleporte usam **MP1, MP2, MP3…**
  (`src/game/mapLabels.ts`) em vez dos títulos internos.
- O editor do dono continua mostrando os nomes reais para facilitar a edição.

## Publicação

A edição do dono é publicada na tabela `public.map_editor_published` e lida
por `map_editor_published_data()`. O cliente guarda um cache local
(`rubym.published-maps.v1`) e mescla assim:

1. cache/publicação global (base para todas as contas);
2. edição local do navegador;
3. edição da conta (`map_editor_saves`, só para o dono).

Assim, a conta do dono nunca perde uma edição recente, e as outras contas veem
os matos, spawns e teleportes publicados.

### Como republicar

No editor de mapa do dono existe o botão **“🌍 Publicar mapas para todos”**.
Ele salva a edição na conta e chama `publish_map_editor_defaults()`.

## Caverna BOBO MMM

- Os 93 matos (verde, rosa e roxo) da edição do dono entram na publicação.
- A zona de mato 9 foi criada em `src/game/grassZones.ts` com Zubat, Geodude,
  Diglett, Machop, Sandshrew, Ekans, Cubone e Onix.
- Além da zona, três spawns fixos garantem Pokémon visíveis perto da entrada:
  Zubat (Nv 6), Geodude (Nv 7) e Machop (Nv 8).
- O Auto continua entrando no canteiro mais próximo e patrulhando um spot curto.

## ARV

O mapa ARV foi removido do jogo e do atlas. As imagens pesadas
(`src/skill/srg/arv.webp`, `src/ambiente/arvcolisao.jpg`) e o vídeo de morte
(`src/ambiente/DDT.mp4`) não são mais importados, então não entram no build.
Saves antigos com `currentMap: "arv"` caem automaticamente em `mapinha6`.

## Mapas de evento

`arena`, `esfera_ancestral`, `rota_pinsir`, `deserto_alaka`,
`areia_de_anubis`, `torre_verdejante`, `torre_ancestral`, `elementure`,
`florest_shiny` e `cristal_cave` continuam entrando pelos caminhos próprios
(NPC/evento), não por uma lista no Mapa Mundi.

## Objetos automáticos

Rota 1, Emerald e todos os mapas `bobo_*` não recebem mais árvores ou pedras
automáticas. Nesses mapas o jogo mostra somente os objetos publicados pelo
editor (matos, árvores, pedras, NPCs e TPs que o dono colocou).
