// Carrega cada imagem em um canvas offscreen e gera uma grid por tile.
// Cada tile amostra vários pixels e decide pela maioria, e no fim aplica
// uma "abertura" (dilatação) pra que o jogador não trave em sombras ou
// bordas isoladas. Áreas em verde nos mockups = obstáculos.

export type CollisionMapId = string;

const TILE = 18;
const SAMPLES = [
  [0.5, 0.5],
  [0.25, 0.25],
  [0.75, 0.25],
  [0.25, 0.75],
  [0.75, 0.75],
  [0.5, 0.15],
  [0.5, 0.85],
  [0.15, 0.5],
  [0.85, 0.5],
];

type Grid = { cols: number; rows: number; walk: Uint8Array; zone: Uint8Array };

const cache = new Map<CollisionMapId, Grid>();
const loading = new Map<CollisionMapId, Promise<Grid>>();

function isCaveMap(mapId: CollisionMapId): boolean {
  return mapId === "cave2" || mapId === "cave1" || mapId === "forestCave";
}

function hasFootprintCollision(mapId: CollisionMapId): boolean {
  return isCaveMap(mapId) || mapId === "palletRoute" || mapId === "mapinha6" || mapId === "esfera_ancestral" || mapId === "casa1" || mapId === "casa2" || mapId === "land_revo" || mapId === "mapinha10" || mapId === "areia_de_anubis" || mapId === "torre_verdejante" || mapId === "torre_ancestral" || mapId === "elementure" || mapId === "mapa_orange" || mapId === "laboratorio" || isProfUpdateMap(mapId);
}

// Mapas do UPDATE (aba MAPAS do Professor): colisão estilo Laboratório —
// branco puro anda; rosa/amarelo (e qualquer outra cor) bloqueiam.
function isProfUpdateMap(mapId: CollisionMapId): boolean {
  return mapId === "iceblow" || mapId === "monte_floreto" || mapId === "rayow" || mapId === "sakura_city" || mapId === "venenot" || mapId === "hallow" || mapId === "caverna_brok";
}

/** Zona colorida da máscara por matiz: 1 = rosa (água dos rios), 2 = amarelo (luz de caverna). */
function pixelZone(r: number, g: number, b: number): 0 | 1 | 2 {
  const mx = Math.max(r, g, b);
  const mn = Math.min(r, g, b);
  const d = mx - mn;
  if (d === 0) return 0;
  const sat = mx === 0 ? 0 : d / mx;
  let h: number;
  if (mx === r) h = 60 * (((g - b) / d) % 6);
  else if (mx === g) h = 60 * ((b - r) / d + 2);
  else h = 60 * ((r - g) / d + 4);
  if (h < 0) h += 360;
  if (sat > 0.3 && h >= 275 && h <= 345 && mx > 90) return 1;
  // Amarelo = SÓ a luz viva da caverna (amarelo puro e brilhante). Terraço/ocre
  // (~160,176,48) e a escada são amarelados, mas não são luz — não contam.
  if (sat > 0.75 && h >= 45 && h <= 75 && mx >= 235) return 2;
  return 0;
}

// Cada regra recebe RGB e devolve true se aquele pixel for caminhável.
// Mantemos as regras LARGAS — depois um passe de dilatação cobre o resto.
function pixelWalk(mapId: CollisionMapId, r: number, g: number, b: number, x = 0, y = 0): boolean {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 510;
  const greenDom = g > r + 18 && g > b + 18; // vegetação saturada
  const blueDom = b > r + 25 && b > g + 15; // água

  switch (mapId) {
    // ---- Revoland (mapinha6) com máscara exata COLD6.png ----
    case "mapinha6": {
      // Branco = caminhável; laranja = porta/portal; preto = bloqueado.
      const whitePath = r > 200 && g > 200 && b > 200;
      const orangeDoor = r > 220 && g > 120 && g < 230 && b < 90;
      return whitePath || orangeDoor;
    }
    // ---- Esfera Ancestral (Mapa Banido) com máscara exata ----
    // REGRA: BRANCO = pode andar; PRETO/QUALQUER COR = bloqueado.
    case "esfera_ancestral": {
      return r > 200 && g > 200 && b > 200;
    }
    case "village":
    case "town": {
      // Caminho de tijolo bege/laranja queimado. Bloqueia grama, água, casas escuras.
      const brick = r > 110 && g > 70 && b < 160 && r > b - 5 && r >= g - 10;
      return brick && !greenDom && !blueDom && l > 0.28 && l < 0.9;
    }
    // ---- Route 1 / Route 2 (florestas com trilha + rio) ----
    case "forest":
    case "meadow":
    case "route2":
    case "florestaSecreta": {
      // Trilha de terra batida OU grama curta. Bloqueia árvores escuras,
      // água (azul) e cercas/troncos muito escuros.
      const dirt = r > 95 && r >= g - 10 && b < r - 5 && l > 0.22;
      const anyGrass = greenDom && g > 90 && l > 0.18 && l < 0.78;
      const lightGround = l > 0.45 && Math.abs(r - g) < 60;
      if (blueDom) return false; // rio bloqueia
      const treeShadow = l < 0.18 || (greenDom && l < 0.22);
      if (treeShadow) return false;
      return dirt || anyGrass || lightGround;
    }
    // ---- Route 3 (arquipélago: ilhas de grama com pontes de madeira e água ao redor) ----
    case "route3": {
      const sat = max === 0 ? 0 : (max - min) / max;
      // Água (azul claro perto da praia + azul escuro fundo): azul dominante.
      if (b > r && b >= g - 6 && b - r > 25) return false;
      // Sombras pretas (árvores fechadas, troncos): muito escuro.
      if (l < 0.18) return false;
      // Pedras/rochas cinzas (baixa saturação, médias): bloqueiam.
      if (sat < 0.22 && l < 0.55) return false;
      // Trilha de terra / pranchas de madeira da ponte / areia: tom quente r≥g≥b.
      if (r >= g && g >= b && r > 90 && l > 0.22) return true;
      // Grama (verde dominante de média a clara).
      if (g > r && g > b && g > 100 && l > 0.28 && l < 0.78) return true;
      return false;
    }
    // ---- Laboratorio do Prof. Carvalho (piso bege claro, mesas/maquinas escuras) ----
    case "labo": {
      const sat = max === 0 ? 0 : (max - min) / max;
      if (l < 0.32) return false; // moveis/contornos escuros
      if (greenDom && l < 0.6) return false; // plantas
      if (blueDom && l < 0.55) return false; // tanques/telas azuis
      if (r > 170 && g < 110 && b < 110) return false; // vermelho de equipamentos
      if (sat > 0.45 && l < 0.55) return false; // qualquer cor saturada escura = objeto
      // piso bege/cinza claro
      return l > 0.5 && Math.abs(r - g) < 70;
    }
    // ---- Pokemon Center (interior bege com balcao vermelho) ----
    case "pokecenter":
    case "pkc": {
      // Piso bege/claro caminhavel. Bloqueia balcao vermelho, moveis escuros,
      // paredes e plantas verdes saturadas.
      if (greenDom && l < 0.6) return false; // plantas
      if (r > 150 && g < 90 && b < 90) return false; // vermelho balcao
      if (l < 0.32) return false; // moveis escuros
      // tons bege/cinza claro
      return l > 0.45 && Math.abs(r - g) < 60;
    }
    // ---- Laboratorio (chao roxo escuro, paredes/tanques bloqueados) ----
    case "lab": {
      const sat = max === 0 ? 0 : (max - min) / max;
      // chao = roxo medio (b dominante, saturacao moderada, lum media)
      // bloqueia: areas muito escuras (paredes/cantos) e areas muito brilhantes saturadas (raios/telas/tanques)
      if (l < 0.18) return false; // sombra dura = parede
      if (sat > 0.55 && l < 0.45) return false; // roxo neon saturado = tanque/tela
      if (r > 200 && b > 200 && g < 160) return false; // rosa/magenta brilhante = mew/raios
      return l > 0.18 && l < 0.7; // piso roxo medio
    }
    // ---- Montanha / caverna (105510) ----
    case "mountain": {
      // Caminhos de terra batida bege/marrom claro. Bloqueia pedras escuras e paredes.
      if (l < 0.28) return false; // pedras/paredes escuras
      const sat = max === 0 ? 0 : (max - min) / max;
      if (sat > 0.45 && l < 0.4) return false; // marrom escuro saturado = pedras
      return r > 120 && r >= g - 5 && b < r; // tom terroso
    }
    // ---- Deserto Antigo (mockup 2) ----
    case "desert": {
      // Areia amarelada (boa parte do mapa). Bloqueia verde, azul, ruínas escuras.
      const sand = r > 150 && g > 100 && b < 160 && r > b + 10;
      return sand && !greenDom && !blueDom && l > 0.35;
    }
    // ---- Rota de Pallet / Route 22 (só árvores bloqueiam) ----
    case "palletRoute":
    case "route22": {
      const sat = max === 0 ? 0 : (max - min) / max;
      // Copa de árvore (verde escuro saturado)
      if (greenDom && l < 0.36 && sat > 0.38) return false;
      // Sakura / árvores rosadas
      if (r > 180 && g > 85 && b > 95 && r > g + 16 && r > b + 8 && sat > 0.18) return false;
      // Tronco de árvore (marrom escuro saturado)
      if (r >= g && g >= b && sat > 0.45 && l < 0.22) return false;
      return true;
    }
    // ---- Rota Elite (caminho de pedra com grama) ----
    case "eliteRoute": {
      // Bloqueia água azul e sombras pretas duras; libera grama/caminho.
      if (blueDom) return false;
      if (l < 0.22) return false;
      if (greenDom && l < 0.22) return false;
      return true;
    }
    // ---- Pântano Veneno (roxo/verde tóxico) ----
    case "veneno": {
      const sat = max === 0 ? 0 : (max - min) / max;
      // Bloqueia água/poça muito escura e sombras duras; veneno-roxo saturado escuro também bloqueia.
      if (l < 0.2) return false;
      if (blueDom && l < 0.35) return false;
      if (sat > 0.55 && l < 0.32) return false; // poça tóxica
      return true;
    }
    // ---- Viridian City (cidade com casas, cercas e árvores em torno do caminho) ----
    case "viridian": {
      const sat = max === 0 ? 0 : (max - min) / max;
      // água/lago azul
      if (blueDom && l < 0.6) return false;
      // contornos pretos (paredes, troncos, telhados escuros)
      if (l < 0.22) return false;
      // copa de árvore (verde escuro saturado)
      if (greenDom && l < 0.34 && sat > 0.35) return false;
      // telhados vermelhos
      if (r > 150 && g < 115 && b < 115 && sat > 0.35) return false;
      // telhados laranja/madeira saturada
      if (r > 180 && g > 100 && g < 165 && b < 120 && sat > 0.35) return false;
      // telhados azuis (PK Center) e outros tons frios escuros
      if (b > r && b > g && l < 0.55 && sat > 0.25) return false;
      // paredes/cercas saturadas escuras
      if (sat > 0.45 && l < 0.38) return false;
      // resto (grama, caminho de pedra/terra, piso bege) = caminhável
      return true;
    }

    // ---- Picos de Gelo (mockup 1) ----
    case "ice": {
      // Neve clara / gelo lavanda. Bloqueia paredes escuras de rocha.
      return l > 0.5;
    }
    // ---- Cemiterio (verde acinzentado) e Cemiterio Sombrio (roxo) ----
    case "graveyard":
    case "graveyard_dark": {
      // Caminhos sao bege/cinza claro de baixa saturacao.
      // Bloqueia: arvores, cercas, lapides (verde/roxo escuro saturado ou muito escuro).
      const sat = max === 0 ? 0 : (max - min) / max;
      if (l < 0.32) return false; // muito escuro = obstaculo
      if (sat > 0.32 && l < 0.55) return false; // cor saturada escura = vegetacao/cerca
      return l > 0.35; // resto = caminhavel
    }
    case "crystal": {
      // Caverna de cristal — chão claro azulado.
      return l > 0.45 && b >= r - 30;
    }
    case "volcano": {
      // Rochas médias = caminhável; muito escuro = parede.
      return l > 0.25 && l < 0.85;
    }
    // ---- Caverna 2 (paredes/pedras escuras + caminho areia clara) ----
    case "cave2": {
      const sat = max === 0 ? 0 : (max - min) / max;
      // Contorno preto, parede escura e pedra cinza/lilás ficam sólidos.
      if (l < 0.42) return false;
      if (blueDom || greenDom) return false;
      if (sat < 0.3 && l < 0.62) return false;

      // Só libera chão de areia/terra clara, com tom quente evidente.
      const warmPath = r > 120 && g > 90 && b < 150 && r >= g - 6 && g >= b + 8 && r >= b + 22;
      const brightSand = r > 150 && g > 115 && b < 165 && r >= b + 28 && l > 0.48;
      return (warmPath || brightSand) && l < 0.86;
    }
    case "forestCave": {
      const sat = max === 0 ? 0 : (max - min) / max;
      // Água azul: bloqueia.
      if (b > r && b >= g && b - r > 15) return false;
      // Sombras duras / muito escuro (troncos, base de cliff): bloqueia.
      if (l < 0.20) return false;
      // Copa de árvore (verde MUITO escuro saturado): bloqueia.
      // Mato/grama alta tem verde mid-lightness — NÃO bloqueia.
      if (g > r + 10 && l < 0.22) return false;
      // Cliff/cerca de madeira escura (marrom saturado escuro): bloqueia.
      if (r >= g && g >= b && sat > 0.3 && l < 0.30) return false;
      return true;
    }

    case "cave1": {
      // Bloqueia somente contornos pretos (parede dura) e água azul profunda.
      if (l < 0.18) return false;
      if (blueDom && l < 0.38) return false;
      // Vegetação muito escura bloqueia.
      if (greenDom && l < 0.22) return false;
      // Resto (chão, escadas, pedras, areia clara) libera.
      return true;
    }
    // ---- Máscaras branco/preto (SÓ o branco anda — igual Revoland) ----
    // casa1/casa2/land_revo/mapinha10 + mapas do evento Torre Elemental.
    // Laboratório: branco PURO (>240) — as paredes cinza-claras (~220) NÃO andam.
    case "laboratorio": {
      return r > 240 && g > 240 && b > 240;
    }
    // ---- Mapas do UPDATE (aba MAPAS do Professor) — regra do Laboratório ----
    // BRANCO PURO (>240) anda; rosa, amarelo, preto e demais cores bloqueiam.
    case "iceblow":
    case "monte_floreto":
    case "rayow":
    case "sakura_city":
    case "venenot":
    case "hallow":
    case "caverna_brok": {
      return r > 240 && g > 240 && b > 240;
    }
    case "casa1":
    case "casa2":
    case "land_revo":
    case "mapinha10":
    case "areia_de_anubis":
    case "torre_verdejante":
    case "torre_ancestral":
    case "mapa_orange":
    case "elementure": {
      return r > 200 && g > 200 && b > 200;
    }
    default:
      return true;
  }
}

async function buildGrid(mapId: CollisionMapId, src: string, w: number, h: number): Promise<Grid> {
  return new Promise<Grid>((resolve) => {
    const cols = Math.ceil(w / TILE);
    const rows = Math.ceil(h / TILE);
    const walk = new Uint8Array(cols * rows);
    const zone = new Uint8Array(cols * rows);

    if (typeof window === "undefined" || typeof document === "undefined") {
      walk.fill(1);
      return resolve({ cols, rows, walk, zone });
    }

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) {
          walk.fill(1);
          return resolve({ cols, rows, walk, zone });
        }
        ctx.drawImage(img, 0, 0, w, h);
        const data = ctx.getImageData(0, 0, w, h).data;

        // Amostragem múltipla por tile (maioria simples).
        for (let cy = 0; cy < rows; cy++) {
          for (let cx = 0; cx < cols; cx++) {
            let hits = 0;
            let pinkHits = 0;
            let yellowHits = 0;
            for (const [fx, fy] of SAMPLES) {
              const px = Math.min(w - 1, Math.floor(cx * TILE + fx * TILE));
              const py = Math.min(h - 1, Math.floor(cy * TILE + fy * TILE));
              const idx = (py * w + px) * 4;
              const z = pixelZone(data[idx], data[idx + 1], data[idx + 2]);
              if (z === 1) pinkHits++;
              else if (z === 2) yellowHits++;
              if (pixelWalk(mapId, data[idx], data[idx + 1], data[idx + 2], px, py)) hits++;
            }
            // Cavernas precisam de maioria real pra não deixar cortar parede.
            // Pallet usa 4 amostras: segura contorno de árvore, mas não prende na grama.
            // Cave1: precisa de quase todos pixels escuros pra bloquear — escadas de
            // madeira têm rungs pretos misturados com chão amarelo e devem ser caminháveis.
            const neededHits = mapId === "palletRoute" ? 4 : mapId === "cave1" ? 3 : hasFootprintCollision(mapId) ? 5 : 2;
            walk[cy * cols + cx] = hits >= neededHits ? 1 : 0;
            if (pinkHits >= 3) zone[cy * cols + cx] = 1;
            else if (yellowHits >= 5) zone[cy * cols + cx] = 2;
          }
        }

        // Pallet tem muita copa de árvore clara. Este passe só fecha buracos caminháveis
        // cercados por obstáculos, sem transformar partes abertas de grama em colisão.
        if (mapId === "palletRoute") {
          for (let pass = 0; pass < 1; pass++) {
            const smoothed = new Uint8Array(walk);
            for (let cy = 1; cy < rows - 1; cy++) {
              for (let cx = 1; cx < cols - 1; cx++) {
                const i = cy * cols + cx;
                let blocked = 0;
                for (let oy = -1; oy <= 1; oy++) {
                  for (let ox = -1; ox <= 1; ox++) {
                    if (ox === 0 && oy === 0) continue;
                    if (walk[(cy + oy) * cols + cx + ox] === 0) blocked++;
                  }
                }
                if (walk[i] === 1 && blocked >= 6) smoothed[i] = 0;
                if (walk[i] === 0 && blocked <= 1) smoothed[i] = 1;
              }
            }
            for (let i = 0; i < walk.length; i++) walk[i] = smoothed[i];
          }
        }

        // Passe de dilatação: em cavernas fica desligado pra parede/contorno
        // continuar sólido. Nos outros mapas remove ilhotas de sombra/anti-alias.
        const out = new Uint8Array(walk);
        if (!hasFootprintCollision(mapId)) {
          for (let cy = 0; cy < rows; cy++) {
            for (let cx = 0; cx < cols; cx++) {
              if (walk[cy * cols + cx] === 1) continue;
              let n = 0;
              if (cx > 0 && walk[cy * cols + cx - 1]) n++;
              if (cx < cols - 1 && walk[cy * cols + cx + 1]) n++;
              if (cy > 0 && walk[(cy - 1) * cols + cx]) n++;
              if (cy < rows - 1 && walk[(cy + 1) * cols + cx]) n++;
              if (n >= 2) out[cy * cols + cx] = 1;
            }
          }
        }
        for (let i = 0; i < walk.length; i++) walk[i] = out[i];
        // Laboratório + mapas do UPDATE: anda SÓ na área branca CONECTADA (pintura principal).
        // Remove manchas claras isoladas (painéis/telas/luzes) que passam no
        // threshold mas não fazem parte do caminho pintado.
        if (mapId === "laboratorio" || isProfUpdateMap(mapId)) {
          const total = cols * rows;
          const seenL = new Uint8Array(total);
          const queue: number[] = [];
          let bestStart = -1, bestSize = 0;
          for (let s = 0; s < total; s++) {
            if (walk[s] !== 1 || seenL[s]) continue;
            let size = 0;
            queue.length = 0;
            queue.push(s);
            seenL[s] = 1;
            while (queue.length) {
              const c = queue.pop()!;
              size++;
              const cx = c % cols, cy = Math.floor(c / cols);
              if (cx > 0 && walk[c - 1] === 1 && !seenL[c - 1]) { seenL[c - 1] = 1; queue.push(c - 1); }
              if (cx < cols - 1 && walk[c + 1] === 1 && !seenL[c + 1]) { seenL[c + 1] = 1; queue.push(c + 1); }
              if (cy > 0 && walk[c - cols] === 1 && !seenL[c - cols]) { seenL[c - cols] = 1; queue.push(c - cols); }
              if (cy < rows - 1 && walk[c + cols] === 1 && !seenL[c + cols]) { seenL[c + cols] = 1; queue.push(c + cols); }
            }
            if (size > bestSize) { bestSize = size; bestStart = s; }
          }
          if (bestStart >= 0) {
            const keep = new Uint8Array(total);
            queue.length = 0;
            queue.push(bestStart);
            keep[bestStart] = 1;
            while (queue.length) {
              const c = queue.pop()!;
              const cx = c % cols, cy = Math.floor(c / cols);
              const nbs = [
                cx > 0 ? c - 1 : -1, cx < cols - 1 ? c + 1 : -1,
                cy > 0 ? c - cols : -1, cy < rows - 1 ? c + cols : -1,
              ];
              for (const nb of nbs) {
                if (nb >= 0 && walk[nb] === 1 && !keep[nb]) { keep[nb] = 1; queue.push(nb); }
              }
            }
            for (let i = 0; i < total; i++) walk[i] = keep[i];
          }
        }
      } catch {
        walk.fill(1);
      }
      resolve({ cols, rows, walk, zone });
    };
    img.onerror = () => {
      walk.fill(1);
      resolve({ cols, rows, walk, zone });
    };
    img.src = src;
  });
}

export function ensureCollision(mapId: CollisionMapId, src: string, w: number, h: number) {
  if (cache.has(mapId) || loading.has(mapId)) return;
  const p = buildGrid(mapId, src, w, h).then((g) => {
    cache.set(mapId, g);
    loading.delete(mapId);
    return g;
  });
  loading.set(mapId, p);
}

export function maskZoneAt(mapId: CollisionMapId, x: number, y: number): 0 | 1 | 2 {
  const g = cache.get(mapId);
  if (!g || !g.zone) return 0;
  const cx = Math.floor(x / TILE);
  const cy = Math.floor(y / TILE);
  if (cx < 0 || cy < 0 || cx >= g.cols || cy >= g.rows) return 0;
  return (g.zone[cy * g.cols + cx] as 0 | 1 | 2) ?? 0;
}

export function isWalkable(mapId: CollisionMapId, x: number, y: number): boolean {
  const g = cache.get(mapId);
  if (!g) return true; // enquanto não carrega, libera

  const cellWalkable = (px: number, py: number) => {
    const cx = Math.floor(px / TILE);
    const cy = Math.floor(py / TILE);
    if (cx < 0 || cy < 0 || cx >= g.cols || cy >= g.rows) return false;
    return g.walk[cy * g.cols + cx] === 1;
  };

  if (!hasFootprintCollision(mapId)) return cellWalkable(x, y);

  // Em mapas com contorno fino, confere um pequeno corpo ao redor do player,
  // não só o ponto central. Na Pallet é menor pra deslizar sem agarrar nas bordas.
  const r = mapId === "palletRoute" ? TILE * 0.32 : TILE * 0.42;

  // Objetos que o jogador pediu pra poder atravessar ("tirar árvores e pedras").
  // A grade é construída em pixels de MUNDO (natural × MAP_DISPLAY_SCALE), então
  // estes rects já estão no mesmo espaço das coordenadas recebidas.
  if (x >= 156 && x <= 202 && y >= 156 && y <= 202) return true;   // vaso planta sup-esq
  if (x >= 788 && x <= 832 && y >= 159 && y <= 198) return true;   // vaso planta sup-dir
  if (x >= 55 && x <= 107 && y >= 478 && y <= 530) return true;    // vaso planta inf-esq
  if (x >= 884 && x <= 940 && y >= 478 && y <= 530) return true;   // vaso planta inf-dir
  if (x >= 78 && x <= 166 && y >= 153 && y <= 302) return true;    // cilindros esq
  if (x >= 826 && x <= 917 && y >= 153 && y <= 302) return true;   // cilindros dir
  if (x >= 156 && x <= 262 && y >= 296 && y <= 380) return true;   // tanque vidro esq
  if (x >= 731 && x <= 841 && y >= 307 && y <= 379) return true;   // tanque vidro dir

  return (
    cellWalkable(x, y) &&
    cellWalkable(x - r, y) &&
    cellWalkable(x + r, y) &&
    cellWalkable(x, y - r) &&
    cellWalkable(x, y + r)
  );
}

const REVOLAND_ORANGE_DOORS = [
  { x0: 922, y0: 289, x1: 980, y1: 343 },
  { x0: 319, y0: 336, x1: 366, y1: 397 },
  { x0: 404, y0: 817, x1: 452, y1: 865 },
  { x0: 937, y0: 824, x1: 979, y1: 884 },
] as const;

export function isRevolandOrangeDoor(x: number, y: number): boolean {
  return REVOLAND_ORANGE_DOORS.some((door) =>
    x >= door.x0 && x <= door.x1 && y >= door.y0 && y <= door.y1
  );
}

export function markWalkableRect(
  mapId: CollisionMapId,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  const g = cache.get(mapId);
  if (!g) {
    const pending = loading.get(mapId);
    if (pending) pending.then(() => markWalkableRect(mapId, x, y, w, h));
    return;
  }
  const x0 = Math.max(0, Math.floor(x / TILE));
  const y0 = Math.max(0, Math.floor(y / TILE));
  const x1 = Math.min(g.cols - 1, Math.floor((x + w) / TILE));
  const y1 = Math.min(g.rows - 1, Math.floor((y + h) / TILE));
  for (let cy = y0; cy <= y1; cy++) {
    for (let cx = x0; cx <= x1; cx++) g.walk[cy * g.cols + cx] = 1;
  }
}

export function markBlockedRect(
  mapId: CollisionMapId,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  const g = cache.get(mapId);
  if (!g) {
    const pending = loading.get(mapId);
    if (pending) pending.then(() => markBlockedRect(mapId, x, y, w, h));
    return;
  }
  const x0 = Math.max(0, Math.floor(x / TILE));
  const y0 = Math.max(0, Math.floor(y / TILE));
  const x1 = Math.min(g.cols - 1, Math.floor((x + w) / TILE));
  const y1 = Math.min(g.rows - 1, Math.floor((y + h) / TILE));
  for (let cy = y0; cy <= y1; cy++) {
    for (let cx = x0; cx <= x1; cx++) g.walk[cy * g.cols + cx] = 0;
  }
}
