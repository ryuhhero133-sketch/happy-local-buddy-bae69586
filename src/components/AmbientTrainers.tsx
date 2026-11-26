import { memo, useEffect, useRef, useState } from "react";
import trainerSheet from "@/assets/trainer.png";
import { isWalkable } from "@/game/collision";
import { zoneForMap, zoneSheet } from "@/game/grassZones";
import { PVP_SCHEDULE_MAP_IDS } from "@/game/pvpSchedule";
import type { Species } from "@/game/systems";

type Dir = "down" | "left" | "right" | "up";
const DIR_ROW: Record<Dir, number> = { down: 0, left: 1, right: 2, up: 3 };

/** Cidade Emerald + os 8 mapas de caça. Bots não aparecem em outros mapas. */
const BOT_MAP_IDS = ["emerald", ...PVP_SCHEDULE_MAP_IDS] as const;
const BOT_MAP_SET = new Set<string>(BOT_MAP_IDS);
const TICK_MS = 450;

const NAMES = [
  "Luna", "Ryu", "Mika", "Theo", "Nina", "Kai", "Yuri", "Lia", "Noah", "Iris",
  "Bento", "Akira", "Tina", "Kiko", "Maya", "Zeca", "Lipe", "Sora", "Neko", "Ruby",
  "Davi", "Bia", "Caio", "Duda", "Enzo", "Fefe", "Gabi", "Hugo", "Iara", "Juca",
];

const CITY_LEADERS: Species[] = [
  "pikachu", "eevee", "meowth", "growlithe", "pidgey", "rattata", "oddish", "bulbasaur",
];

const SPEECH_LINES = [
  "Bora treinar!",
  "Esse mato tem Pokémon bom.",
  "Você viu algum shiny por aí?",
  "Tô subindo meu time aos poucos.",
  "Boa sorte na caçada!",
  "A cidade tá movimentada hoje.",
  "Vou dar uma volta e já volto.",
  "Meu Pokémon tá quase evoluindo!",
  "Cuidado com o PvP na hora cheia.",
  "Preciso comprar mais Pokébolas.",
  "Achei um trainer forte ali atrás.",
  "Hoje é dia de farmar bastante.",
];

type BotDef = {
  id: string;
  index: number;
  mapId: string;
  name: string;
  leader: Species;
  hue: number;
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
  const counts = new Map<string, number>([["emerald", 6]]);
  for (const mapId of PVP_SCHEDULE_MAP_IDS) counts.set(mapId, 3);
  const bots: BotDef[] = [];
  let nameIndex = 0;
  for (const mapId of BOT_MAP_IDS) {
    const count = counts.get(mapId) ?? 3;
    for (let i = 0; i < count; i++) {
      const seed = hashString(`${mapId}:${i}`);
      const random = mulberry32(seed);
      const leaders = leaderPool(mapId);
      const leader = leaders[Math.floor(random() * leaders.length)] ?? "pikachu";
      bots.push({
        id: `ambient-${mapId}-${i}`,
        index: nameIndex,
        mapId,
        name: NAMES[nameIndex % NAMES.length],
        leader,
        hue: (nameIndex * 47 + 20) % 360,
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

function initialBots(mapId: string, worldW: number, worldH: number): Record<string, BotState> {
  const defs = BOTS_BY_MAP.get(mapId) ?? [];
  const result: Record<string, BotState> = {};
  const placed: Array<{ x: number; y: number }> = [];
  const marginX = Math.max(70, worldW * 0.12);
  const marginY = Math.max(80, worldH * 0.12);
  for (const def of defs) {
    const random = mulberry32(def.seed ^ 0x9e3779b9);
    let x = worldW / 2 + (def.index % 2 === 0 ? -1 : 1) * 150;
    let y = worldH / 2 + (def.index % 3 - 1) * 120;
    for (let attempt = 0; attempt < 28; attempt++) {
      const cx = marginX + random() * (worldW - marginX * 2);
      const cy = marginY + random() * (worldH - marginY * 2);
      if (Math.hypot(cx - worldW / 2, cy - worldH / 2) < 130) continue;
      if (placed.some((point) => Math.hypot(point.x - cx, point.y - cy) < 70)) continue;
      x = cx;
      y = cy;
      break;
    }
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
    };
  }
  return result;
}

function chooseTarget(
  mapId: string,
  x: number,
  y: number,
  worldW: number,
  worldH: number,
): { x: number; y: number } | null {
  for (let attempt = 0; attempt < 14; attempt++) {
    const angle = Math.random() * Math.PI * 2;
    const radius = 70 + Math.random() * 230;
    const tx = clamp(x + Math.cos(angle) * radius, 60, worldW - 60);
    const ty = clamp(y + Math.sin(angle) * radius, 80, worldH - 60);
    if (walkable(mapId, tx, ty)) return { x: tx, y: ty };
  }
  return null;
}

type Props = {
  mapId: string;
  worldW: number;
  worldH: number;
};

/**
 * Treinadores ambiente: 100% client-side, sem rede, sem banco e sem save.
 * Só os bots do mapa atual são renderizados/atualizados (3–6 por mapa).
 */
export const AmbientTrainers = memo(function AmbientTrainers({ mapId, worldW, worldH }: Props) {
  const [bots, setBots] = useState<Record<string, BotState>>(() => initialBots(mapId, worldW, worldH));
  const [speech, setSpeech] = useState<Record<string, string>>({});
  const speechTimers = useRef(new Map<string, number>());
  const dimensions = useRef({ mapId, worldW, worldH });

  useEffect(() => {
    const previous = dimensions.current;
    if (previous.mapId === mapId && previous.worldW === worldW && previous.worldH === worldH) return;
    dimensions.current = { mapId, worldW, worldH };
    setBots(initialBots(mapId, worldW, worldH));
    setSpeech({});
  }, [mapId, worldW, worldH]);

  useEffect(() => {
    if (!BOT_MAP_SET.has(mapId)) return;
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
          if (!walkable(mapId, bot.x, bot.y)) {
            const target = chooseTarget(mapId, bot.x, bot.y, worldW, worldH);
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
            const target = chooseTarget(mapId, bot.x, bot.y, worldW, worldH);
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
          if (!walkable(mapId, nx, ny)) {
            const target = chooseTarget(mapId, bot.x, bot.y, worldW, worldH);
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
  }, [mapId, worldW, worldH]);

  useEffect(() => () => {
    for (const timer of speechTimers.current.values()) window.clearTimeout(timer);
    speechTimers.current.clear();
  }, []);

  const say = (bot: BotDef) => {
    const line = SPEECH_LINES[Math.floor(Math.random() * SPEECH_LINES.length)] ?? SPEECH_LINES[0];
    setSpeech((previous) => ({ ...previous, [bot.id]: line }));
    const oldTimer = speechTimers.current.get(bot.id);
    if (oldTimer != null) window.clearTimeout(oldTimer);
    const timer = window.setTimeout(() => {
      speechTimers.current.delete(bot.id);
      setSpeech((previous) => {
        if (!(bot.id in previous)) return previous;
        const next = { ...previous };
        delete next[bot.id];
        return next;
      });
    }, 3_200);
    speechTimers.current.set(bot.id, timer);
  };

  if (!BOT_MAP_SET.has(mapId)) return null;
  const defs = BOTS_BY_MAP.get(mapId) ?? [];

  return (
    <>
      {defs.map((def) => {
        const bot = bots[def.id];
        const sheet = zoneSheet(def.leader);
        if (!bot) return null;
        const line = speech[def.id];
        return (
          <div
            key={def.id}
            style={{
              position: "absolute",
              left: bot.x,
              top: bot.y,
              width: 56,
              height: 56,
              transform: "translate(-50%, -50%)",
              transition: `left ${TICK_MS}ms linear, top ${TICK_MS}ms linear`,
              filter: "drop-shadow(0 3px 3px rgba(0,0,0,0.6))",
              zIndex: Math.round(bot.y),
              pointerEvents: "none",
            }}
          >
            {line && (
              <div style={{
                position: "absolute", left: "50%", bottom: 62, transform: "translateX(-50%)",
                maxWidth: 178, padding: "5px 7px", borderRadius: 7,
                background: "#f7f2e7", color: "#1b1224", border: "1px solid #7c5a2a",
                fontSize: 9, lineHeight: 1.3, fontWeight: 700, textAlign: "center",
                boxShadow: "0 4px 12px rgba(0,0,0,0.45)", pointerEvents: "none", zIndex: 10,
              }}>
                {line}
                <span style={{
                  position: "absolute", left: "50%", bottom: -5, width: 8, height: 8,
                  background: "#f7f2e7", borderRight: "1px solid #7c5a2a",
                  borderBottom: "1px solid #7c5a2a", transform: "translateX(-50%) rotate(45deg)",
                }} />
              </div>
            )}
            <div style={{
              position: "absolute", left: "50%", top: -22, transform: "translateX(-50%)",
              display: "flex", alignItems: "center", gap: 4, whiteSpace: "nowrap",
            }}>
              <div style={{
                fontSize: 10, fontWeight: 700, color: "#fff",
                textShadow: "0 0 3px #000, 1px 1px 0 #000, -1px -1px 0 #000",
                fontFamily: "monospace",
                background: "rgba(20,40,80,0.55)",
                padding: "1px 5px", borderRadius: 4,
                border: `1px solid hsl(${def.hue} 70% 62% / 0.65)`,
                pointerEvents: "auto", cursor: "pointer",
              }}
                onClick={(event) => {
                  event.stopPropagation();
                  say(def);
                }}
                title={`Falar com ${def.name}`}
              >{def.name}</div>
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
              filter: `hue-rotate(${def.hue}deg) saturate(1.05)`,
            }} />
          </div>
        );
      })}
    </>
  );
});
