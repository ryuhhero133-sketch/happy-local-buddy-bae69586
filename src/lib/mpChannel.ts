// Multiplayer por canais — lógica pura (sem React, sem I/O).
// REGRAS:
// - Canal 1/2: instâncias privadas. Cada jogador tem seus próprios spawns;
//   Pokémon de outro jogador nunca é sincronizado, atacado ou capturado.
// - Canal 3: cooperação. Spawns compartilhados com identidade determinística
//   (seed = mapa + janela de tempo), para todos os clientes verem o MESMO
//   Pokémon na MESMA posição. Kill/captura é propagada via broadcast e os
//   demais despawnam (sem recompensa dupla). HP é simulado localmente
//   (convergência eventual); a recompensa de party usa a tabela oficial.
// - XP Canal 3: ×1.5 (aplicado onde o XP é calculado; server-side pendente
//   de backend trainer_state — ver relatório da fase).

export type ChannelId = 1 | 2 | 3;

export const CHANNEL_XP_MULT: Record<ChannelId, number> = {
  1: 1.0,
  2: 1.0,
  3: 1.5,
};

// Tabela oficial de party XP (preservada): 1=100% 2=60% 3=45% 4=38% 5=34%.
export function partyXpShare(memberCount: number): number {
  if (memberCount <= 1) return 1.0;
  if (memberCount === 2) return 0.6;
  if (memberCount === 3) return 0.45;
  if (memberCount === 4) return 0.38;
  return 0.34;
}

export const PARTY_MAX = 5;

// Janela de identidade dos spawns compartilhados (10 min).
export const SHARED_EPOCH_MS = 10 * 60 * 1000;

export function sharedEpochFor(now: number): number {
  return Math.floor(now / SHARED_EPOCH_MS);
}

// PRNG determinístico (mulberry32) + hash simples de string.
export function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type SharedSpawn = {
  key: string;
  sp: string;
  level: number;
  rarity: string;
  x: number;
  y: number;
};

const RARITY_TABLE: Array<{ r: string; w: number }> = [
  { r: "common", w: 52 },
  { r: "uncommon", w: 24 },
  { r: "rare", w: 13 },
  { r: "epic", w: 7 },
  { r: "legendary", w: 3 },
  { r: "mythic", w: 0.9 },
  { r: "mythic_shiny", w: 0.1 },
];

function pickRarity(rand: () => number): string {
  const total = RARITY_TABLE.reduce((a, b) => a + b.w, 0);
  let roll = rand() * total;
  for (const e of RARITY_TABLE) {
    roll -= e.w;
    if (roll <= 0) return e.r;
  }
  return "common";
}

// Gera os spawns compartilhados do Canal 3 de forma determinística:
// todos os clientes no mesmo mapa+janela geram a MESMA lista.
export function genSharedSpawns(opts: {
  mapId: string;
  epoch: number;
  count: number;
  worldW: number;
  worldH: number;
  species: string[];
  minLevel: number;
  maxLevel: number;
}): SharedSpawn[] {
  const rand = mulberry32(hashString(`ch3|${opts.mapId}|${opts.epoch}`));
  const pool = opts.species.length > 0 ? opts.species : ["pidgey"];
  const out: SharedSpawn[] = [];
  for (let i = 0; i < opts.count; i++) {
    const sp = pool[Math.floor(rand() * pool.length)];
    const level = Math.max(
      opts.minLevel,
      Math.min(opts.maxLevel, opts.minLevel + Math.floor(rand() * Math.max(1, opts.maxLevel - opts.minLevel + 1))),
    );
    const rarity = pickRarity(rand);
    const x = Math.round(90 + rand() * Math.max(100, opts.worldW - 180));
    const y = Math.round(110 + rand() * Math.max(100, opts.worldH - 220));
    out.push({ key: `${opts.mapId}:${opts.epoch}:${i}`, sp, level, rarity, x, y });
  }
  return out;
}

// Id negativo (fora do contador local) derivado da chave compartilhada.
export function sharedEnemyId(key: string): number {
  return -(hashString(`enemy|${key}`) % 1_000_000_000) - 1;
}

// Tópico de presence por instância lógica (mapa + canal).
export function presenceTopic(mapId: string, channel: ChannelId): string {
  return `mp:${mapId}:c${channel}`;
}

// Tópico do barramento da party (reutiliza padrão existente party-bus-*).
export function partyBusTopic(partyId: string): string {
  return `party-bus-${partyId}`;
}
