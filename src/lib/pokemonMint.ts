// ============================================================
// pokemonMint — registra criações legítimas no servidor (best-effort).
// Chamado em lote ANTES do checkpoint (diff dos uids ainda não
// registrados). Nunca bloqueia o save: sem RPC/rede, o jogo segue
// local e o trigger decide no servidor.
// Origens são só auditoria; a prova real é o registro + trigger.
// ============================================================
import { supabase } from "@/integrations/supabase/client";

const MINTED_KEY_PREFIX = "rubym.mint.minted.";
const MINTED_CAP = 2000;
const BATCH = 100;

type MintEntry = {
  uid: string;
  species: string;
  level: number;
  xp: number;
  rarity: string;
  traits: string[];
  origin: string;
};

function mintedKey(): string | null {
  try {
    const raw = localStorage.getItem("rubym.currentUid");
    if (!raw) return null;
    return `${MINTED_KEY_PREFIX}${raw}`;
  } catch {
    return null;
  }
}

function loadMinted(): Set<string> {
  try {
    const k = mintedKey();
    if (!k) return new Set();
    const raw = localStorage.getItem(k);
    if (!raw) return new Set();
    const arr = JSON.parse(raw) as unknown;
    return new Set(Array.isArray(arr) ? arr.filter((x) => typeof x === "string") : []);
  } catch {
    return new Set();
  }
}

function storeMinted(set: Set<string>) {
  try {
    const k = mintedKey();
    if (!k) return;
    const arr = [...set].slice(-MINTED_CAP);
    localStorage.setItem(k, JSON.stringify(arr));
  } catch {
    /* ignore */
  }
}

function guessOrigin(event: unknown): string {
  if (typeof event !== "string" || event.length === 0) return "capture";
  if (event.startsWith("black_mitic")) return "hatch_black";
  if (event.startsWith("emerald_egg")) return "hatch_emerald";
  if (event.startsWith("governante")) return "governante";
  if (event.startsWith("oddish") || event === "arena") return "capture";
  return "capture";
}

function collectNew(snapshot: unknown, minted: Set<string>): MintEntry[] {
  if (!snapshot || typeof snapshot !== "object") return [];
  const root = snapshot as Record<string, unknown>;
  const out: MintEntry[] = [];
  const seen = new Set<string>();
  const push = (m: unknown) => {
    if (!m || typeof m !== "object") return;
    const e = m as Record<string, unknown>;
    const uid = typeof e["uid"] === "string" ? e["uid"] : "";
    if (!uid || seen.has(uid) || minted.has(uid)) return;
    if (typeof e["species"] !== "string") return;
    // Transferências do mercado são provadas pela linha (trigger) — sem mint.
    if (uid.startsWith("bought-")) {
      minted.add(uid);
      return;
    }
    seen.add(uid);
    out.push({
      uid,
      species: e["species"] as string,
      level: typeof e["level"] === "number" ? e["level"] : 1,
      xp: typeof e["xp"] === "number" ? e["xp"] : 0,
      rarity: typeof e["rarity"] === "string" ? (e["rarity"] as string) : "common",
      traits: Array.isArray(e["traits"]) ? (e["traits"] as unknown[]).filter((t): t is string => typeof t === "string") : [],
      origin: guessOrigin(e["event"]),
    });
  };
  const team = root["team"];
  if (Array.isArray(team)) team.forEach(push);
  const bench = root["restingBench"];
  if (Array.isArray(bench)) bench.forEach(push);
  const idle = root["idle"];
  if (idle && typeof idle === "object") {
    const col = (idle as Record<string, unknown>)["collection"];
    if (Array.isArray(col)) col.forEach(push);
  }
  return out;
}

function isBackendMissingError(e: unknown): boolean {
  const msg = e instanceof Error ? `${e.message} ${(e as { code?: unknown }).code ?? ""}` : String(e);
  return /PGRST202|not found|Could not find the function|404/i.test(msg);
}

/**
 * Registra no servidor os uids ainda não registrados deste snapshot.
 * Roda antes do checkpoint_save. Falhas NUNCA bloqueiam o save.
 */
export async function flushMintQueue(snapshot: unknown): Promise<void> {
  let minted: Set<string>;
  try {
    minted = loadMinted();
  } catch {
    return;
  }
  const fresh = collectNew(snapshot, minted);
  if (fresh.length === 0) {
    // Persiste o skip de bought-* mesmo sem nada a registrar.
    storeMinted(minted);
    return;
  }
  try {
    const { data: sess } = await supabase.auth.getSession();
    if (!sess.session?.user?.id) return; // off-line de login: trigger decide depois
  } catch {
    return;
  }
  for (let i = 0; i < fresh.length; i += BATCH) {
    const chunk = fresh.slice(i, i + BATCH);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any).rpc("mint_pokemon_batch", { p_entries: chunk });
      if (error) {
        if (isBackendMissingError(error)) return; // sem migration: trigger também ausente, segue o jogo
        continue; // tenta o resto / de novo no próximo checkpoint
      }
      const accepted = (data as { accepted?: unknown } | null)?.accepted;
      if (!Array.isArray(accepted)) continue; // resposta irreconhecível: trigger decide no save
      for (const u of accepted) if (typeof u === "string") minted.add(u);
    } catch (e) {
      if (isBackendMissingError(e)) return;
      continue;
    }
  }
  // Persiste skips (bought-*) e aceitos para o diff dos próximos flushes.
  storeMinted(minted);
}
