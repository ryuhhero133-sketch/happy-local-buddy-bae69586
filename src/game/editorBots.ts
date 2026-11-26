import type { Species } from "@/game/systems";
import type { VipTierId } from "@/game/trainerProfile";

export type EditorBotDir = "down" | "left" | "right" | "up";
export type EditorBotFollower = "none" | "nevezinha" | "slime";

export type EditorBot = {
  id: number;
  x: number;
  y: number;
  name: string;
  avatarId: string;
  leaderSpecies: Species;
  vipTier: VipTierId | null;
  follower: EditorBotFollower;
  moving: boolean;
  dir: EditorBotDir;
};

export type EditorBotDraft = Omit<EditorBot, "id" | "x" | "y">;

export const DEFAULT_EDITOR_BOT: EditorBotDraft = {
  name: "Treinador",
  avatarId: "default",
  leaderSpecies: "pikachu",
  vipTier: null,
  follower: "none",
  moving: false,
  dir: "down",
};

const VALID_DIRS = new Set<EditorBotDir>(["down", "left", "right", "up"]);
const VALID_VIP = new Set<VipTierId>(["vip", "vip30", "vip60"]);
const VALID_FOLLOWERS = new Set<EditorBotFollower>(["none", "nevezinha", "slime"]);

/** Dados vindos da nuvem/publicação são tratados como não confiáveis. */
export function normalizeEditorBots(raw: unknown): Record<string, EditorBot[]> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const result: Record<string, EditorBot[]> = {};
  for (const [mapId, list] of Object.entries(raw as Record<string, unknown>)) {
    if (!Array.isArray(list)) continue;
    const bots: EditorBot[] = [];
    list.forEach((value, index) => {
      if (!value || typeof value !== "object") return;
      const item = value as Record<string, unknown>;
      const id = Number(item.id);
      const x = Number(item.x);
      const y = Number(item.y);
      if (!Number.isFinite(id) || !Number.isFinite(x) || !Number.isFinite(y)) return;
      const dir = String(item.dir ?? "down") as EditorBotDir;
      const vip = item.vipTier == null ? null : String(item.vipTier) as VipTierId;
      const follower = String(item.follower ?? "none") as EditorBotFollower;
      bots.push({
        id,
        x,
        y,
        name: String(item.name ?? `Treinador ${index + 1}`).slice(0, 24),
        avatarId: String(item.avatarId ?? "default").slice(0, 40),
        leaderSpecies: String(item.leaderSpecies ?? "pikachu") as Species,
        vipTier: vip && VALID_VIP.has(vip) ? vip : null,
        follower: VALID_FOLLOWERS.has(follower) ? follower : "none",
        moving: item.moving === true,
        dir: VALID_DIRS.has(dir) ? dir : "down",
      });
    });
    if (bots.length) result[mapId] = bots;
  }
  return result;
}
