import { memo, useEffect, useState } from "react";
import trainerSheet from "@/assets/trainer.png";
import { collisionReady, isWalkable } from "@/game/collision";
import { grassTileCenter, isInGrassPatch, type GrassPatch } from "@/game/grassHunt";
import { zoneForMap, zoneSheet } from "@/game/grassZones";
import { PVP_SCHEDULE_MAP_IDS } from "@/game/pvpSchedule";
import { PROFILE_SPRITES, VIP_BOOK_BY_TIER, type VipTierId } from "@/game/trainerProfile";
import type { Species } from "@/game/systems";
import { TrainerActionMenu } from "@/components/TrainerActionMenu";

type Dir = "down" | "left" | "right" | "up";
const DIR_ROW: Record<Dir, number> = { down: 0, left: 1, right: 2, up: 3 };

/** Cidade Emerald + os 8 mapas de caça. Bots não aparecem em outros mapas. */
const BOT_MAP_IDS = ["emerald", ...PVP_SCHEDULE_MAP_IDS] as const;
const BOT_MAP_SET = new Set<string>(BOT_MAP_IDS);
const TICK_MS = 450;

/** 7 na cidade, 5 na Rota 1 e o restante distribuído nos outros mapas de caça. */
const BOT_COUNTS: Record<string, number> = {
  emerald: 7,
  rota1: 5,
  bobo_rota2: 3,
  bobo_uuid: 3,
  bobo_transicao: 3,
  bobo_g11ds: 2,
  bobo_rota_gelo: 2,
  bobo_transicao_gelo: 2,
  bobo_mmmm: 3,
};

const NAMES = [
  "Luna", "Ryu", "Mika", "Theo", "Nina", "Kai", "Yuri", "Lia", "Noah", "Iris",
  "Bento", "Akira", "Tina", "Kiko", "Maya", "Zeca", "Lipe", "Sora", "Neko", "Ruby",
  "Davi", "Bia", "Caio", "Duda", "Enzo", "Fefe", "Gabi", "Hugo", "Iara", "Juca",
];

const CITY_LEADERS: Species[] = [
  "pikachu", "eevee", "meowth", "growlithe", "pidgey", "rattata", "oddish", "bulbasaur",
];

type BotDef = {
  id: string;
  index: number;
  slot: number;
  mapId: string;
  name: string;
  leader: Species;
  vipTier: VipTierId | null;
  seed: number;
};

type BotState = {
  x: number;
  y: number;
  dir: Dir;
  step: number;
  tx: number;
  ty: number;
  pauseUntil: number;
  speed: number;
  patchId: number | null;
};

function hashString(value: string): number {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let value = Math.imul(state ^ (state >>> 15), 1 | state);
    value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value;
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function leaderPool(mapId: string): Species[] {
  if (mapId === "emerald") return CITY_LEADERS.filter((species) => !!zoneSheet(species));
  const zone = zoneForMap(mapId);
  const species = (zone ?? [])
    .map((entry) => entry.species as Species)
    .filter((entry) => !!zoneSheet(entry));
  return species.length ? species : CITY_LEADERS.filter((entry) => !!zoneSheet(entry));
}

function buildBots(): BotDef[] {
  const bots: BotDef[] = [];
  let nameIndex = 0;
  for (const mapId of BOT_MAP_IDS) {
    const count = BOT_COUNTS[mapId] ?? 2;
    for (let slot = 0; slot < count; slot++) {
      const seed = hashString(`${mapId}:${slot}`);
      const random = mulberry32(seed);
      const leaders = leaderPool(mapId);
      const leader = leaders[Math.floor(random() * leaders.length)] ?? "pikachu";
      const vipTier: VipTierId | null = nameIndex % 5 === 1 ? "vip60" : nameIndex % 5 === 3 ? "vip" : null;
      bots.push({
        id: `ambient-${mapId}-${slot}`,
        index: nameIndex,
        slot,
        mapId,
        name: NAMES[nameIndex % NAMES.length],
        leader,
        vipTier,
        seed,
      });
      nameIndex += 1;
    }
  }
  return bots;
}

const BOTS = buildBots();
const BOTS_BY_MAP = new Map<string, BotDef[]>();
for (const bot of BOTS) {
  const list = BOTS_BY_MAP.get(bot.mapId) ?? [];
  list.push(bot);
  BOTS_BY_MAP.set(bot.mapId, list);
}

function walkable(mapId: string, x: number, y: number): boolean {
  try {
    return isWalkable(mapId, x, y);
  } catch {
    return true;
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function patchById(patches: GrassPatch[], id: number | null): GrassPatch | null {
  if (id == null) return null;
  return patches.find((patch) => patch.id === id) ?? null;
}

/** Confere o caminho inteiro do passo, não só o destino, para não atravessar paredes finas. */
function canStep(
  mapId: string,
  from: { x: number; y: number },
  to: { x: number; y: number },
  patch: GrassPatch | null,
): boolean {
  const distance = Math.hypot(to.x - from.x, to.y - from.y);
  const steps = Math.max(1, Math.ceil(distance / 8));
  for (let i = 1; i <= steps; i++) {
    const x = from.x + ((to.x - from.x) * i) / steps;
    const y = from.y + ((to.y - from.y) * i) / steps;
    if (!walkable(mapId, x, y)) return false;
    if (patch && !isInGrassPatch(patch, { x, y })) return false;
  }
  return true;
}

function initialBots(
  mapId: string,
  worldW: number,
  worldH: number,
  grassPatches: GrassPatch[],
): Record<string, BotState> {
  const defs = BOTS_BY_MAP.get(mapId) ?? [];
  const patches = grassPatches.filter((patch) => patch.tiles.length > 0);
  const result: Record<string, BotState> = {};
  const placed: Array<{ x: number; y: number }> = [];
  const marginX = Math.max(70, worldW * 0.12);
  const marginY = Math.max(80, worldH * 0.12);

  for (const def of defs) {
    const random = mulberry32(def.seed ^ 0x9e3779b9);
    const patch = patches.length ? patches[def.slot % patches.length] : null;
    let x = worldW / 2;
    let y = worldH / 2;
    let found = false;

    if (patch) {
      for (let attempt = 0; attempt < 32; attempt++) {
        const tile = patch.tiles[Math.floor(random() * patch.tiles.length)] ?? patch.tiles[0];
        const point = grassTileCenter(tile, 28);
        if (!walkable(mapId, point.x, point.y)) continue;
        if (!isInGrassPatch(patch, point)) continue;
        if (placed.some((other) => Math.hypot(other.x - point.x, other.y - point.y) < 30)) continue;
        x = point.x;
        y = point.y;
        found = true;
        break;
      }
    } else {
      for (let attempt = 0; attempt < 64; attempt++) {
        const cx = marginX + random() * (worldW - marginX * 2);
        const cy = marginY + random() * (worldH - marginY * 2);
        if (Math.hypot(cx - worldW / 2, cy - worldH / 2) < 130) continue;
        if (placed.some((point) => Math.hypot(point.x - cx, point.y - cy) < 70)) continue;
        if (!walkable(mapId, cx, cy)) continue;
        x = cx;
        y = cy;
        found = true;
        break;
      }
    }

    // Nunca posiciona em colisão nem fora do mato: melhor não spawnar.
    if (!found) continue;

    placed.push({ x, y });
    result[def.id] = {
      x,
      y,
      dir: "down",
      step: 0,
      tx: x,
      ty: y,
      pauseUntil: 0,
      speed: 18 + (def.index % 5) * 3,
      patchId: patch?.id ?? null,
    };
  }
  return result;
}

function chooseTarget(
  mapId: string,
  bot: BotState,
  worldW: number,
  worldH: number,
  patches: GrassPatch[],
): { x: number; y: number } | null {
  const patch = patchById(patches, bot.patchId);
  if (patch) {
    for (let attempt = 0; attempt < 20; attempt++) {
      const tile = patch.tiles[Math.floor(Math.random() * patch.tiles.length)] ?? patch.tiles[0];
      const point = grassTileCenter(tile, 28);
      if (!isInGrassPatch(patch, point)) continue;
      if (!walkable(mapId, point.x, point.y)) continue;
      return point;
    }
    return null;
  }

  for (let attempt = 0; attempt < 14; attempt++) {
    const angle = Math.random() * Math.PI * 2;
    const radius = 70 + Math.random() * 230;
    const tx = clamp(bot.x + Math.cos(angle) * radius, 60, worldW - 60);
    const ty = clamp(bot.y + Math.sin(angle) * radius, 80, worldH - 60);
    if (walkable(mapId, tx, ty)) return { x: tx, y: ty };
  }
  return null;
}

type Props = {
  mapId: string;
  worldW: number;
  worldH: number;
  grassPatches: GrassPatch[];
  guildEnabled: boolean;
};

/**
 * Treinadores ambiente: 100% client-side, sem rede, sem banco e sem save.
 * Só o mapa atual é renderizado. Nos mapas de caça ficam dentro do mato;
 * na cidade ficam em áreas livres, nunca sobre colisão.
 */
export const AmbientTrainers = memo(function AmbientTrainers({
  mapId,
  worldW,
  worldH,
  grassPatches,
  guildEnabled,
}: Props) {
  const [ready, setReady] = useState(() => collisionReady(mapId));
  const [bots, setBots] = useState<Record<string, BotState>>({});
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const hasGrass = grassPatches.some((patch) => patch.tiles.length > 0);
  // Nos mapas de caça, espera o mato carregar para nunca nascer fora dele.
  const canPlace = ready && (mapId === "emerald" || hasGrass);

  useEffect(() => {
    if (collisionReady(mapId)) {
      setReady(true);
      return;
    }
    setReady(false);
    const timer = window.setInterval(() => {
      if (collisionReady(mapId)) {
        setReady(true);
        window.clearInterval(timer);
      }
    }, 200);
    return () => window.clearInterval(timer);
  }, [mapId]);

  useEffect(() => {
    if (!canPlace) return;
    setBots(initialBots(mapId, worldW, worldH, grassPatches));
    setMenuFor(null);
  }, [canPlace, mapId, worldW, worldH, grassPatches]);

  useEffect(() => {
    if (!canPlace || !BOT_MAP_SET.has(mapId)) return;
    const defs = BOTS_BY_MAP.get(mapId) ?? [];
    if (!defs.length) return;
    const timer = window.setInterval(() => {
      setBots((previous) => {
        const now = Date.now();
        let changed = false;
        const next = { ...previous };
        for (const def of defs) {
          const bot = previous[def.id];
          if (!bot) continue;
          const patch = patchById(grassPatches, bot.patchId);
          const onGrass = !patch || isInGrassPatch(patch, { x: bot.x, y: bot.y });
          if (!walkable(mapId, bot.x, bot.y) || !onGrass) {
            const target = chooseTarget(mapId, bot, worldW, worldH, grassPatches);
            if (target) {
              next[def.id] = {
                ...bot,
                x: target.x,
                y: target.y,
                tx: target.x,
                ty: target.y,
                step: 0,
                pauseUntil: now + 300 + Math.random() * 800,
              };
              changed = true;
            }
            continue;
          }
          if (now < bot.pauseUntil) {
            if (bot.step !== 0) {
              next[def.id] = { ...bot, step: 0 };
              changed = true;
            }
            continue;
          }
          const dx = bot.tx - bot.x;
          const dy = bot.ty - bot.y;
          const distance = Math.hypot(dx, dy);
          if (distance < 12) {
            const target = chooseTarget(mapId, bot, worldW, worldH, grassPatches);
            next[def.id] = {
              ...bot,
              step: 0,
              tx: target?.x ?? bot.x,
              ty: target?.y ?? bot.y,
              pauseUntil: now + 450 + Math.random() * 3_000,
            };
            changed = true;
            continue;
          }
          const stepLength = Math.min(bot.speed, distance);
          const nx = bot.x + (dx / distance) * stepLength;
          const ny = bot.y + (dy / distance) * stepLength;
          if (!canStep(mapId, bot, { x: nx, y: ny }, patch)) {
            const target = chooseTarget(mapId, bot, worldW, worldH, grassPatches);
            next[def.id] = {
              ...bot,
              step: 0,
              tx: target?.x ?? bot.x,
              ty: target?.y ?? bot.y,
              pauseUntil: now + 350 + Math.random() * 1_200,
            };
            changed = true;
            continue;
          }
          const dir: Dir = Math.abs(dx) > Math.abs(dy)
            ? (dx > 0 ? "right" : "left")
            : (dy > 0 ? "down" : "up");
          next[def.id] = {
            ...bot,
            x: nx,
            y: ny,
            dir,
            step: (bot.step + 1) % 4,
          };
          changed = true;
        }
        return changed ? next : previous;
      });
    }, TICK_MS);
    return () => window.clearInterval(timer);
  }, [canPlace, mapId, worldW, worldH, grassPatches]);

  if (!canPlace || !BOT_MAP_SET.has(mapId)) return null;
  const defs = BOTS_BY_MAP.get(mapId) ?? [];

  return (
    <>
      {defs.map((def) => {
        const bot = bots[def.id];
        if (!bot) return null;
        const sheet = zoneSheet(def.leader);
        const vipImg = def.vipTier ? PROFILE_SPRITES.books[VIP_BOOK_BY_TIER[def.vipTier]] : null;
        const menuOpen = menuFor === def.id;
        return (
          <div
            key={def.id}
            onClick={(event) => {
              event.stopPropagation();
              setMenuFor((current) => current === def.id ? null : def.id);
            }}
            title={`Interagir com ${def.name}`}
            style={{
              position: "absolute",
              left: bot.x,
              top: bot.y,
              width: 56,
              height: 56,
              transform: "translate(-50%, -50%)",
              transition: `left ${TICK_MS}ms linear, top ${TICK_MS}ms linear`,
              filter: "drop-shadow(0 3px 3px rgba(0,0,0,0.6))",
              zIndex: Math.round(bot.y) + (menuOpen ? 20000 : 0),
              pointerEvents: "auto",
              cursor: "pointer",
            }}
          >
            <div style={{
              position: "absolute", left: "50%", top: -22, transform: "translateX(-50%)",
              display: "flex", alignItems: "center", gap: 4, whiteSpace: "nowrap",
            }}>
              {vipImg && (
                <img
                  src={vipImg}
                  alt="VIP"
                  title={def.vipTier === "vip60" ? "Jogador VIP GOLD" : "Jogador VIP EPIC"}
                  draggable={false}
                  style={{ height: 20, width: "auto", imageRendering: "pixelated", filter: "drop-shadow(0 2px 2px rgba(0,0,0,.65))" }}
                />
              )}
              <div style={{
                fontSize: 10, fontWeight: 700, color: "#fff",
                textShadow: "0 0 3px #000, 1px 1px 0 #000, -1px -1px 0 #000",
                fontFamily: "monospace",
                background: def.vipTier ? "rgba(120,52,0,0.78)" : "rgba(20,40,80,0.55)",
                padding: "1px 5px", borderRadius: 4,
                border: `1px solid ${def.vipTier ? "#ffb347" : "rgba(107,178,255,0.6)"}`,
              }}>{def.vipTier ? "✦ " : ""}{def.name}</div>
            </div>
            {sheet && (
              <div style={{
                position: "absolute", left: 34, top: 33, width: 34, height: 34,
                backgroundImage: `url(${sheet})`, backgroundSize: "400% 400%",
                backgroundPosition: `${bot.step * 33.333}% ${DIR_ROW[bot.dir] * 33.333}%`,
                imageRendering: "pixelated", pointerEvents: "none",
                filter: "drop-shadow(0 2px 2px rgba(0,0,0,0.6))",
              }} />
            )}
            <div style={{
              width: "100%", height: "100%",
              backgroundImage: `url(${trainerSheet})`,
              backgroundSize: "400% 400%",
              backgroundPosition: `${bot.step * 33.333}% ${DIR_ROW[bot.dir] * 33.333}%`,
              imageRendering: "pixelated",
            }} />
            {menuOpen && (
              <TrainerActionMenu
                name={def.name}
                onClose={() => setMenuFor(null)}
                guildEnabled={guildEnabled}
                onGuild={() => setMenuFor(null)}
                onFriend={() => setMenuFor(null)}
                onParty={() => setMenuFor(null)}
              />
            )}
          </div>
        );
      })}
    </>
  );
});
