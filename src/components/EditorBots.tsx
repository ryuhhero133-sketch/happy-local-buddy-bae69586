import { memo, useEffect, useState } from "react";
import trainerSheet from "@/assets/trainer.png";
import nevezinhaUrl from "@/ambiente/map/bb/nevezinha.webp";
import slimeSheetUrl from "@/ambiente/map/pets/slime_sheet.webp";
import { isWalkable } from "@/game/collision";
import { zoneSheet } from "@/game/grassZones";
import { PROFILE_SPRITES, VIP_BOOK_BY_TIER } from "@/game/trainerProfile";
import type { Species } from "@/game/systems";
import type { EditorBot, EditorBotDir } from "@/game/editorBots";
import { TrainerActionMenu } from "@/components/TrainerActionMenu";

const DIR_ROW: Record<EditorBotDir, number> = { down: 0, left: 1, right: 2, up: 3 };
const ROAM_RADIUS = 220;
const TICK_MS = 450;

type Props = {
  mapId: string;
  worldW: number;
  worldH: number;
  bots: EditorBot[];
  editorMode: boolean;
  editorInteractive: boolean;
  selectedBotId: number | null;
  skinUrls: Record<string, string>;
  gifMap: Partial<Record<Species, string>>;
  guildEnabled: boolean;
  onSelect?: (id: number) => void;
  onRemove?: (id: number) => void;
  onStartDrag?: (event: React.PointerEvent<HTMLElement>, id: number, x: number, y: number) => void;
  onDrag?: (event: React.PointerEvent<HTMLElement>) => void;
  onEndDrag?: (event: React.PointerEvent<HTMLElement>) => void;
};

type RoamState = { x: number; y: number; dir: EditorBotDir; step: number; tx: number; ty: number };

function walkable(mapId: string, x: number, y: number): boolean {
  try {
    return isWalkable(mapId, x, y);
  } catch {
    return true;
  }
}

function canStep(mapId: string, from: { x: number; y: number }, to: { x: number; y: number }): boolean {
  const distance = Math.hypot(to.x - from.x, to.y - from.y);
  const steps = Math.max(1, Math.ceil(distance / 8));
  for (let i = 1; i <= steps; i++) {
    const x = from.x + ((to.x - from.x) * i) / steps;
    const y = from.y + ((to.y - from.y) * i) / steps;
    if (!walkable(mapId, x, y)) return false;
  }
  return true;
}

/** Movimento visual simples: o bot passeia perto do ponto onde o dono colocou. */
function useRoaming(bot: EditorBot, active: boolean, mapId: string, worldW: number, worldH: number): RoamState {
  const [state, setState] = useState<RoamState>(() => ({
    x: bot.x, y: bot.y, dir: bot.dir, step: 0, tx: bot.x, ty: bot.y,
  }));

  useEffect(() => {
    setState({ x: bot.x, y: bot.y, dir: bot.dir, step: 0, tx: bot.x, ty: bot.y });
    if (!active) return;
    const timer = window.setInterval(() => {
      setState((previous) => {
        const dx = previous.tx - previous.x;
        const dy = previous.ty - previous.y;
        const distance = Math.hypot(dx, dy);
        if (distance < 10) {
          const angle = Math.random() * Math.PI * 2;
          const radius = 45 + Math.random() * ROAM_RADIUS;
          const tx = Math.max(30, Math.min(worldW - 30, bot.x + Math.cos(angle) * radius));
          const ty = Math.max(30, Math.min(worldH - 30, bot.y + Math.sin(angle) * radius));
          return { ...previous, tx, ty, step: 0 };
        }
        const stepLength = Math.min(20, distance);
        const nx = previous.x + (dx / distance) * stepLength;
        const ny = previous.y + (dy / distance) * stepLength;
        if (!canStep(mapId, previous, { x: nx, y: ny })) return { ...previous, tx: previous.x, ty: previous.y, step: 0 };
        const dir: EditorBotDir = Math.abs(dx) > Math.abs(dy)
          ? (dx > 0 ? "right" : "left")
          : (dy > 0 ? "down" : "up");
        return { ...previous, x: nx, y: ny, dir, step: (previous.step + 1) % 4 };
      });
    }, TICK_MS);
    return () => window.clearInterval(timer);
  }, [active, bot.id, bot.x, bot.y, bot.dir, mapId, worldW, worldH]);

  return state;
}

function EditorBotSprite({
  mapId,
  worldW,
  worldH,
  bot,
  editorMode,
  editorInteractive,
  selected,
  skinUrls,
  gifMap,
  guildEnabled,
  onSelect,
  onRemove,
  onStartDrag,
  onDrag,
  onEndDrag,
}: {
  mapId: string;
  worldW: number;
  worldH: number;
  bot: EditorBot;
  editorMode: boolean;
  editorInteractive: boolean;
  selected: boolean;
  skinUrls: Record<string, string>;
  gifMap: Partial<Record<Species, string>>;
  guildEnabled: boolean;
  onSelect?: (id: number) => void;
  onRemove?: (id: number) => void;
  onStartDrag?: (event: React.PointerEvent<HTMLElement>, id: number, x: number, y: number) => void;
  onDrag?: (event: React.PointerEvent<HTMLElement>) => void;
  onEndDrag?: (event: React.PointerEvent<HTMLElement>) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const roaming = useRoaming(bot, bot.moving && !editorMode, mapId, worldW, worldH);
  useEffect(() => { if (editorMode) setMenuOpen(false); }, [editorMode]);
  const x = editorMode ? bot.x : roaming.x;
  const y = editorMode ? bot.y : roaming.y;
  const dir = editorMode ? bot.dir : roaming.dir;
  const step = editorMode ? 0 : roaming.step;
  const avatar = skinUrls[bot.avatarId] ?? trainerSheet;
  const leaderGif = gifMap[bot.leaderSpecies];
  const leaderSheet = zoneSheet(bot.leaderSpecies);
  const vipImg = bot.vipTier ? PROFILE_SPRITES.books[VIP_BOOK_BY_TIER[bot.vipTier]] : null;
  const clickable = !editorMode || editorInteractive;

  return (
    <div
      data-editor-entity={editorInteractive ? "bot" : undefined}
      onClick={(event) => {
        event.stopPropagation();
        if (editorInteractive) {
          onSelect?.(bot.id);
          return;
        }
        if (!editorMode) setMenuOpen((open) => !open);
      }}
      onContextMenu={(event) => {
        if (!editorMode || !editorInteractive) return;
        event.preventDefault();
        event.stopPropagation();
        onRemove?.(bot.id);
      }}
      onPointerDown={(event) => {
        if (editorInteractive) onStartDrag?.(event, bot.id, bot.x, bot.y);
      }}
      onPointerMove={(event) => {
        if (editorInteractive) onDrag?.(event);
      }}
      onPointerUp={(event) => {
        if (editorInteractive) onEndDrag?.(event);
      }}
      onPointerCancel={(event) => {
        if (editorInteractive) onEndDrag?.(event);
      }}
      title={editorInteractive ? `Editar ${bot.name}` : `Interagir com ${bot.name}`}
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: 56,
        height: 56,
        transform: "translate(-50%, -50%)",
        transition: editorMode ? undefined : `left ${TICK_MS}ms linear, top ${TICK_MS}ms linear`,
        filter: selected ? "drop-shadow(0 0 6px #ffe08a) drop-shadow(0 3px 3px rgba(0,0,0,0.6))" : "drop-shadow(0 3px 3px rgba(0,0,0,0.6))",
        zIndex: Math.round(y) + (menuOpen ? 20000 : 0),
        pointerEvents: clickable ? "auto" : "none",
        cursor: clickable ? (editorInteractive ? "grab" : "pointer") : "default",
        touchAction: editorInteractive ? "none" : undefined,
      }}
    >
      <div style={{ position: "absolute", left: "50%", top: -22, transform: "translateX(-50%)", display: "flex", alignItems: "center", gap: 4, whiteSpace: "nowrap" }}>
        {vipImg && <img src={vipImg} alt="VIP" title={bot.vipTier === "vip60" ? "VIP GOLD" : bot.vipTier === "vip30" ? "VIP CRISTAL" : "VIP EPIC"} draggable={false} style={{ height: 20, width: "auto", imageRendering: "pixelated", filter: "drop-shadow(0 2px 2px rgba(0,0,0,.65))" }} />}
        <div style={{
          fontSize: 10, fontWeight: 700, color: "#fff",
          textShadow: "0 0 3px #000, 1px 1px 0 #000, -1px -1px 0 #000",
          fontFamily: "monospace",
          background: bot.vipTier ? "rgba(120,52,0,0.78)" : "rgba(20,40,80,0.55)",
          padding: "1px 5px", borderRadius: 4,
          border: `1px solid ${selected ? "#ffe08a" : bot.vipTier ? "#ffb347" : "rgba(107,178,255,0.6)"}`,
        }}>{bot.vipTier ? "✦ " : ""}{bot.name}</div>
      </div>

      {bot.follower === "nevezinha" && (
        <img src={nevezinhaUrl} alt="" draggable={false} style={{ position: "absolute", left: -22, top: 14, width: 34, height: 34, objectFit: "contain", imageRendering: "pixelated", pointerEvents: "none", filter: "drop-shadow(0 2px 2px rgba(0,0,0,.5))" }} />
      )}
      {bot.follower === "slime" && (
        <div style={{ position: "absolute", left: 28, top: 14, width: 40, height: 40, backgroundImage: `url(${slimeSheetUrl})`, backgroundSize: "400% 300%", backgroundPosition: "0% 0%", animation: "slimeWalk 0.72s steps(4, end) infinite", imageRendering: "pixelated", pointerEvents: "none", filter: "drop-shadow(0 2px 2px rgba(0,0,0,.5))" }} />
      )}

      {leaderGif ? (
        <img src={leaderGif} alt="" draggable={false} style={{ position: "absolute", left: 32, top: 30, width: 36, height: 36, imageRendering: "pixelated", pointerEvents: "none", filter: "drop-shadow(0 2px 2px rgba(0,0,0,.6))" }} />
      ) : leaderSheet ? (
        <div style={{ position: "absolute", left: 34, top: 31, width: 36, height: 36, backgroundImage: `url(${leaderSheet})`, backgroundSize: "400% 400%", backgroundPosition: `${step * 33.333}% ${DIR_ROW[dir] * 33.333}%`, imageRendering: "pixelated", pointerEvents: "none", filter: "drop-shadow(0 2px 2px rgba(0,0,0,.6))" }} />
      ) : null}

      <div style={{
        width: "100%", height: "100%",
        backgroundImage: `url(${avatar})`,
        backgroundSize: "400% 400%",
        backgroundPosition: `${step * 33.333}% ${DIR_ROW[dir] * 33.333}%`,
        imageRendering: "pixelated",
      }} />

      {menuOpen && !editorMode && (
        <TrainerActionMenu
          name={bot.name}
          onClose={() => setMenuOpen(false)}
          guildEnabled={guildEnabled}
          onGuild={() => setMenuOpen(false)}
          onFriend={() => setMenuOpen(false)}
          onParty={() => setMenuOpen(false)}
        />
      )}
    </div>
  );
}

export const EditorBots = memo(function EditorBots({
  mapId,
  worldW,
  worldH,
  bots,
  editorMode,
  editorInteractive,
  selectedBotId,
  skinUrls,
  gifMap,
  guildEnabled,
  onSelect,
  onRemove,
  onStartDrag,
  onDrag,
  onEndDrag,
}: Props) {
  if (!bots.length) return null;
  return (
    <>
      {bots.map((bot) => (
        <EditorBotSprite
          key={bot.id}
          mapId={mapId}
          worldW={worldW}
          worldH={worldH}
          bot={bot}
          editorMode={editorMode}
          editorInteractive={editorInteractive}
          selected={selectedBotId === bot.id}
          skinUrls={skinUrls}
          gifMap={gifMap}
          guildEnabled={guildEnabled}
          onSelect={onSelect}
          onRemove={onRemove}
          onStartDrag={onStartDrag}
          onDrag={onDrag}
          onEndDrag={onEndDrag}
        />
      ))}
    </>
  );
});
