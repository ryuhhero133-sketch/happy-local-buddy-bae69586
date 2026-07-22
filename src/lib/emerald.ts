// Esmeralda balance helpers — shared between Cash Shop and Marketplace.
// Storage: localStorage per UID + mirror no user_metadata do Supabase.

const EMERALD_KEY_LEGACY = "rubym.cashshop.emerald.v1";

export function emeraldKeyFor(uid?: string | null): string {
  return uid ? `rubym.cashshop.emerald.v2.${uid}` : EMERALD_KEY_LEGACY;
}

export function readEmeraldFor(uid?: string | null): number {
  try {
    const k = emeraldKeyFor(uid);
    let v = localStorage.getItem(k);
    if (v == null && uid) {
      const legacy = localStorage.getItem(EMERALD_KEY_LEGACY);
      if (legacy != null) {
        localStorage.setItem(k, legacy);
        v = legacy;
      }
    }
    const n = v ? parseInt(v, 10) : 0;
    return Number.isFinite(n) ? Math.max(0, n) : 0;
  } catch { return 0; }
}

export function writeEmeraldFor(uid: string | null | undefined, n: number) {
  const val = Math.max(0, Math.floor(n));
  try { localStorage.setItem(emeraldKeyFor(uid), String(val)); } catch { /* ignore */ }
  if (uid) {
    import("@/integrations/supabase/client").then(({ supabase }) => {
      supabase.auth.updateUser({ data: { emeralds: val } }).catch(() => { /* offline: ok */ });
    }).catch(() => { /* ignore */ });
  }
  // Notifica listeners no mesmo tab (Storage event não dispara localmente).
  try { window.dispatchEvent(new CustomEvent("rubym:emerald", { detail: { uid, val } })); } catch { /* ignore */ }
}

export function spendEmeraldFor(uid: string | null | undefined, amount: number): boolean {
  const cur = readEmeraldFor(uid);
  if (cur < amount) return false;
  writeEmeraldFor(uid, cur - amount);
  return true;
}

export function grantEmeraldFor(uid: string | null | undefined, amount: number) {
  writeEmeraldFor(uid, readEmeraldFor(uid) + Math.max(0, Math.floor(amount)));
}
