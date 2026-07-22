// Admin / Secret-code store — frontend-only persistence layered on the
// existing game save (`rubym.save.v2`). Nothing here breaks the game; we
// only mutate the save object's `balls` / `inventory` and add sibling
// localStorage keys for admin state.

export const SAVE_KEY = "rubym.save.v2";
export const ADMIN_KEY = "rubym.admin.v1";
export const BOUND_KEY = "rubym.bound.v1";
export const REWARD_KEY = "rubym.rewardCodeUsed";
export const ADMIN_FLAG = "rubym.isAdmin";
export const ADMIN_CONFIG_KEY = "rubym.admin.config.v1";
export const ADMIN_LOGS_KEY = "rubym.admin.logs.v1";

export const SECRET_REWARD_CODE = "__DISABLED_REWARD__";
export const SECRET_ADMIN_CODE = "RBXADMIN";
export const SECRET_BETA_CODE = "__DISABLED_BETA__";
export const SECRET_MASTERBALL_CODE = "__DISABLED_MASTER__";
export const SECRET_ULTRA200_CODE = "__DISABLED_ULTRA__";
export const LEGACY_ULTRA200_CODES: string[] = [];
export const BETA_KEY = "rubym.betaCodeUsed";


export const MASTERBALL_KEY = "rubym.masterballCodeUsed";
export const ULTRA200_KEY = "rubym.ultra200CodeUsed";

export type BoundMap = Record<string, number>;
export type AdminLog = {
  ts: number;
  actor: string;
  action: string;
  target?: string;
  detail?: string;
};

export type AdminConfig = {
  weather: {
    type: "clear" | "rain" | "snow" | "storm" | "sand" | "eclipse" | "bloodmoon" | "fog" | "meteor";
    intensity: number;
    durationMin: number;
    maps: string[];
  };
  spawn: {
    globalMultiplier: number;
    shinyChance: number;
    perMap: Record<string, { cap: number; rate: "off" | "slow" | "normal" | "fast" | "insane" }>;
  };
  economy: {
    goldMultiplier: number;
    xpMultiplier: number;
    inflation: number;
  };
  events: {
    doubleXp: boolean;
    doubleLoot: boolean;
    shinyEvent: boolean;
    worldBoss: boolean;
  };
  admin: {
    invisible: boolean;
    noclip: boolean;
    fly: boolean;
    speed: number;
  };
};

const DEFAULT_CONFIG: AdminConfig = {
  weather: { type: "clear", intensity: 50, durationMin: 10, maps: [] },
  spawn: {
    globalMultiplier: 1,
    shinyChance: 0.01,
    perMap: {
      town: { cap: 20, rate: "normal" },
      forest: { cap: 35, rate: "normal" },
      crystal: { cap: 30, rate: "normal" },
      volcano: { cap: 40, rate: "fast" },
    },
  },
  economy: { goldMultiplier: 1, xpMultiplier: 1, inflation: 1 },
  events: { doubleXp: false, doubleLoot: false, shinyEvent: false, worldBoss: false },
  admin: { invisible: false, noclip: false, fly: false, speed: 1 },
};

// ---------- low-level helpers ----------
function safeGet<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}
function safeSet(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore */
  }
}

// ---------- flags ----------
export const isRewardUsed = () => safeGet<boolean>(REWARD_KEY, false);
export const setRewardUsed = () => safeSet(REWARD_KEY, true);

export const isAdmin = () => safeGet<boolean>(ADMIN_FLAG, false);
export const setAdmin = (v: boolean) => safeSet(ADMIN_FLAG, v);

// ---------- bound items ----------
export const getBound = (): BoundMap => safeGet<BoundMap>(BOUND_KEY, {});
export const addBound = (id: string, qty: number) => {
  const m = getBound();
  m[id] = (m[id] ?? 0) + qty;
  safeSet(BOUND_KEY, m);
};
export const isBoundLocked = (id: string, currentQty: number, requestedQty: number) => {
  const bound = getBound()[id] ?? 0;
  return currentQty - requestedQty < bound;
};

// ---------- config / logs ----------
export const getConfig = (): AdminConfig => ({
  ...DEFAULT_CONFIG,
  ...safeGet<Partial<AdminConfig>>(ADMIN_CONFIG_KEY, {}),
});
export const saveConfig = (c: AdminConfig) => safeSet(ADMIN_CONFIG_KEY, c);

export const getLogs = (): AdminLog[] => safeGet<AdminLog[]>(ADMIN_LOGS_KEY, []);
export const pushLog = (entry: Omit<AdminLog, "ts">) => {
  const logs = getLogs();
  logs.unshift({ ts: Date.now(), ...entry });
  safeSet(ADMIN_LOGS_KEY, logs.slice(0, 500));
};

// ---------- save patcher ----------
type AnySave = {
  balls?: Record<string, number>;
  inventory?: Record<string, number>;
  gold?: number;
  crystal?: number;
  ruby?: number;
};

export function patchSave(patch: (s: AnySave) => void): AnySave | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as AnySave;
    patch(s);
    localStorage.setItem(SAVE_KEY, JSON.stringify(s));
    return s;
  } catch {
    return null;
  }
}

export function readSave(): AnySave | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    return raw ? (JSON.parse(raw) as AnySave) : null;
  } catch {
    return null;
  }
}

// ---------- reward roll ----------
export type Reward = { id: string; label: string; qty: number; rare?: boolean };

const RANDOM_POOL: { id: string; label: string; min: number; max: number; rare?: boolean }[] = [
  { id: "potion", label: "Potion", min: 3, max: 6 },
  { id: "super-potion", label: "Super Potion", min: 1, max: 3 },
  { id: "hyper-potion", label: "Hyper Potion", min: 1, max: 2, rare: true },
  { id: "ether", label: "Ether", min: 1, max: 2 },
  { id: "rare-candy", label: "Rare Candy", min: 1, max: 2, rare: true },
  { id: "nugget", label: "Nugget", min: 1, max: 1, rare: true },
  { id: "star-piece", label: "Star Piece", min: 1, max: 1, rare: true },
];

function randInt(min: number, max: number) {
  return min + Math.floor(Math.random() * (max - min + 1));
}

/** Builds and APPLIES the reward bundle, marks rewardCodeUsed=true. */
export function grantRewardBundle(): Reward[] {
  const bundle: Reward[] = [
    { id: "pokeball", label: "Pokéball", qty: 10 },
    { id: "fastball", label: "Great Ball", qty: 6 },
    { id: "ultraball", label: "Ultra Ball", qty: 3 },
    { id: "potion", label: "Potion", qty: 5 },
    { id: "revive", label: "Revive", qty: 3 },
  ];
  // 2 random commons
  for (let i = 0; i < 2; i++) {
    const pick = RANDOM_POOL[Math.floor(Math.random() * RANDOM_POOL.length)];
    bundle.push({ id: pick.id, label: pick.label, qty: randInt(pick.min, pick.max), rare: pick.rare });
  }
  // rare chance
  if (Math.random() < 0.25) {
    const rares = RANDOM_POOL.filter((x) => x.rare);
    const pick = rares[Math.floor(Math.random() * rares.length)];
    bundle.push({ id: pick.id, label: `${pick.label} (RARO)`, qty: 1, rare: true });
  }

  patchSave((s) => {
    s.balls = s.balls ?? {};
    s.inventory = s.inventory ?? {};
    for (const r of bundle) {
      if (r.id === "pokeball" || r.id === "fastball" || r.id === "ultraball") {
        s.balls[r.id] = (s.balls[r.id] ?? 0) + r.qty;
      } else {
        s.inventory[r.id] = (s.inventory[r.id] ?? 0) + r.qty;
      }
      addBound(r.id, r.qty);
    }
  });

  setRewardUsed();
  pushLog({ actor: "system", action: "reward_code_redeemed", detail: `${bundle.length} itens` });
  return bundle;
}

// ---------- BETA reward ----------
export const isBetaUsed = () => safeGet<boolean>(BETA_KEY, false);
export const setBetaUsed = () => safeSet(BETA_KEY, true);

/** Builds and APPLIES the beta bundle (incenso, pokebolas, revives + AUTO 3 dias). */
export function grantBetaBundle(): Reward[] {
  const bundle: Reward[] = [
    { id: "pokeball", label: "Pokéball (evento)", qty: 15, rare: true },
    { id: "fastball", label: "Great Ball (evento)", qty: 8, rare: true },
    { id: "revive", label: "Revive (evento)", qty: 5, rare: true },
    { id: "incense", label: "Incenso (evento)", qty: 3, rare: true },
    { id: "auto-3d", label: "AUTO 3 dias", qty: 1, rare: true },
  ];

  patchSave((s) => {
    s.balls = s.balls ?? {};
    s.inventory = s.inventory ?? {};
    for (const r of bundle) {
      if (r.id === "pokeball" || r.id === "fastball" || r.id === "ultraball") {
        s.balls[r.id] = (s.balls[r.id] ?? 0) + r.qty;
        addBound(r.id, r.qty);
      } else if (r.id === "auto-3d") {
        const now = Date.now();
        const threeDays = 3 * 24 * 60 * 60 * 1000;
        const sExt = s as AnySave & { vipUntil?: number; xpBoostUntil?: number };
        sExt.vipUntil = Math.max(sExt.vipUntil ?? 0, now + threeDays);
        sExt.xpBoostUntil = Math.max(sExt.xpBoostUntil ?? 0, now + threeDays);
      } else {
        s.inventory[r.id] = (s.inventory[r.id] ?? 0) + r.qty;
        addBound(r.id, r.qty);
      }
    }
  });

  setBetaUsed();
  pushLog({ actor: "system", action: "beta_code_redeemed", detail: `${bundle.length} itens` });
  return bundle;
}

export const isMasterballUsed = () => safeGet<boolean>(MASTERBALL_KEY, false);
export const setMasterballUsed = () => safeSet(MASTERBALL_KEY, true);

/** Grants 10 Master Balls to the current save. One-time per account. */
export function grantMasterballBundle(): Reward[] {
  const bundle: Reward[] = [{ id: "masterball", label: "Master Ball", qty: 10, rare: true }];
  patchSave((s) => {
    s.balls = s.balls ?? {};
    s.balls.masterball = (s.balls.masterball ?? 0) + 10;
    addBound("masterball", 10);
  });
  setMasterballUsed();
  pushLog({ actor: "system", action: "masterball_code_redeemed", detail: "10x Master Ball" });
  if (typeof window !== "undefined") {
    window.dispatchEvent(new StorageEvent("storage", { key: SAVE_KEY }));
  }
  return bundle;
}

export const isUltra200Used = () => safeGet<boolean>(ULTRA200_KEY, false);
export const setUltra200Used = () => safeSet(ULTRA200_KEY, true);

/** Grants 200 Ultra Balls. One-time per account. */
export function grantUltra200Bundle(): Reward[] {
  const bundle: Reward[] = [{ id: "ultraball", label: "Ultra Ball", qty: 200, rare: true }];
  patchSave((s) => {
    s.balls = s.balls ?? {};
    s.balls.ultraball = (s.balls.ultraball ?? 0) + 200;
    addBound("ultraball", 200);
  });
  setUltra200Used();
  pushLog({ actor: "system", action: "ultra200_code_redeemed", detail: "200x Ultra Ball" });
  if (typeof window !== "undefined") {
    window.dispatchEvent(new StorageEvent("storage", { key: SAVE_KEY }));
  }
  return bundle;
}

// ---------- MYTHVIP30 (ovo mítico + VIP 30d) ----------
export const MYTHVIP30_KEY = "rubym.mythvip30CodeUsed";
export const SECRET_MYTHVIP30_CODE = "MYTHVIP30";
export const isMythVip30Used = () => safeGet<boolean>(MYTHVIP30_KEY, false);
export const setMythVip30Used = () => safeSet(MYTHVIP30_KEY, true);
export function grantMythVip30Bundle(): Reward[] {
  const bundle: Reward[] = [
    { id: "egg_aura", label: "Ovo Mítico ✦", qty: 1, rare: true },
    { id: "vip-30d", label: "VIP 30 dias (+XP/Gold)", qty: 1, rare: true },
  ];
  patchSave((s) => {
    s.inventory = s.inventory ?? {};
    s.inventory.egg_aura = (s.inventory.egg_aura ?? 0) + 1;
    addBound("egg_aura", 1);
    const now = Date.now();
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;
    const sExt = s as AnySave & { vipUntil?: number; xpBoostUntil?: number };
    sExt.vipUntil = Math.max(sExt.vipUntil ?? 0, now + thirtyDays);
    sExt.xpBoostUntil = Math.max(sExt.xpBoostUntil ?? 0, now + thirtyDays);
  });
  setMythVip30Used();
  pushLog({ actor: "system", action: "mythvip30_code_redeemed", detail: "Ovo Mítico + VIP 30d" });
  if (typeof window !== "undefined") window.dispatchEvent(new StorageEvent("storage", { key: SAVE_KEY }));
  return bundle;
}

// ---------- CRYSTAL20K ----------
export const CRYSTAL20K_KEY = "rubym.crystal20kCodeUsed";
export const SECRET_CRYSTAL20K_CODE = "CRYSTAL20K";
export const isCrystal20kUsed = () => safeGet<boolean>(CRYSTAL20K_KEY, false);
export const setCrystal20kUsed = () => safeSet(CRYSTAL20K_KEY, true);
export function grantCrystal20kBundle(): Reward[] {
  const bundle: Reward[] = [{ id: "crystal", label: "Cristal", qty: 20000, rare: true }];
  patchSave((s) => {
    s.crystal = (s.crystal ?? 0) + 20000;
  });
  setCrystal20kUsed();
  pushLog({ actor: "system", action: "crystal20k_code_redeemed", detail: "20000x Cristal" });
  if (typeof window !== "undefined") window.dispatchEvent(new StorageEvent("storage", { key: SAVE_KEY }));
  return bundle;
}

// ---------- CHARIZ50 (ovo Charizard Lv50 + 2k cristal) ----------
export const CHARIZ50_KEY = "rubym.chariz50CodeUsed";
export const SECRET_CHARIZ50_CODE = "CHARIZ50";
export const isChariz50Used = () => safeGet<boolean>(CHARIZ50_KEY, false);
export const setChariz50Used = () => safeSet(CHARIZ50_KEY, true);
export function grantChariz50Bundle(): Reward[] {
  const bundle: Reward[] = [
    { id: "egg_charizard", label: "Ovo Mítico Charizard (Lv 50)", qty: 1, rare: true },
    { id: "crystal", label: "Cristal", qty: 2000, rare: true },
  ];
  patchSave((s) => {
    s.inventory = s.inventory ?? {};
    s.inventory.egg_charizard = (s.inventory.egg_charizard ?? 0) + 1;
    addBound("egg_charizard", 1);
    s.crystal = (s.crystal ?? 0) + 2000;
  });
  setChariz50Used();
  pushLog({ actor: "system", action: "chariz50_code_redeemed", detail: "Ovo Charizard Lv50 + 2k Cristal" });
  if (typeof window !== "undefined") window.dispatchEvent(new StorageEvent("storage", { key: SAVE_KEY }));
  return bundle;
}

// ---------- EMERALD60 (60 Esmeraldas) ----------
export const EMERALD60_KEY = "rubym.emerald60CodeUsed";
export const SECRET_EMERALD60_CODE = "EMERALD60";
const CASHSHOP_EMERALD_KEY = "rubym.cashshop.emerald.v1";
export const isEmerald60Used = () => safeGet<boolean>(EMERALD60_KEY, false);
export const setEmerald60Used = () => safeSet(EMERALD60_KEY, true);
export function grantEmerald60Bundle(): Reward[] {
  const bundle: Reward[] = [{ id: "emerald", label: "Esmeralda", qty: 60, rare: true }];
  if (typeof window !== "undefined") {
    try {
      const cur = parseInt(localStorage.getItem(CASHSHOP_EMERALD_KEY) ?? "0", 10) || 0;
      localStorage.setItem(CASHSHOP_EMERALD_KEY, String(cur + 60));
    } catch { /* ignore */ }
  }
  setEmerald60Used();
  pushLog({ actor: "system", action: "emerald60_code_redeemed", detail: "60x Esmeralda" });
  return bundle;
}

export function tryRedeemCode(code: string):
  | { kind: "reward"; bundle: Reward[] }
  | { kind: "beta"; bundle: Reward[] }
  | { kind: "masterball"; bundle: Reward[] }
  | { kind: "admin" }
  | { kind: "already-used" }
  | { kind: "invalid" } {
  const c = code.trim().toUpperCase().replace(/[\s\-_]/g, "");
  const ultraCodes = [SECRET_ULTRA200_CODE, ...LEGACY_ULTRA200_CODES].map((x) => x.toUpperCase().replace(/[\s\-_]/g, ""));
  if (c === SECRET_REWARD_CODE) {
    if (isRewardUsed()) return { kind: "already-used" };
    return { kind: "reward", bundle: grantRewardBundle() };
  }
  if (c === SECRET_BETA_CODE) {
    if (isBetaUsed()) return { kind: "already-used" };
    return { kind: "beta", bundle: grantBetaBundle() };
  }
  if (c === SECRET_MASTERBALL_CODE) {
    if (isMasterballUsed()) return { kind: "already-used" };
    return { kind: "masterball", bundle: grantMasterballBundle() };
  }
  if (ultraCodes.includes(c)) {
    if (isUltra200Used()) return { kind: "already-used" };
    return { kind: "masterball", bundle: grantUltra200Bundle() };
  }
  if (c === SECRET_MYTHVIP30_CODE) {
    if (isMythVip30Used()) return { kind: "already-used" };
    return { kind: "masterball", bundle: grantMythVip30Bundle() };
  }
  if (c === SECRET_CRYSTAL20K_CODE) {
    if (isCrystal20kUsed()) return { kind: "already-used" };
    return { kind: "masterball", bundle: grantCrystal20kBundle() };
  }
  if (c === SECRET_CHARIZ50_CODE || c === "CHARIZARD50" || c === "CHARIZ50LV" || c === "CHAR50") {
    if (isChariz50Used()) {
      // permite re-resgatar limpando a flag manualmente via console; por ora, entrega novamente
      safeSet(CHARIZ50_KEY, false);
    }
    return { kind: "masterball", bundle: grantChariz50Bundle() };
  }

  if (c === SECRET_EMERALD60_CODE) {
    if (isEmerald60Used()) return { kind: "already-used" };
    return { kind: "masterball", bundle: grantEmerald60Bundle() };
  }

  if (c === SECRET_ADMIN_CODE) {
    setAdmin(true);
    pushLog({ actor: "self", action: "admin_unlocked" });
    return { kind: "admin" };
  }
  return { kind: "invalid" };
}

