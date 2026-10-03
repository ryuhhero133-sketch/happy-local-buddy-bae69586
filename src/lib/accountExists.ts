// Regra de existência de conta — pura e testável (sem imports).
//
// Por que existe: `profiles.username` era gravado no PRIMEIRO passo do
// onboarding (só o nome) e sozinho já marcava a conta como "existente".
// Resultado: qualquer F5/relogin após digitar o nome pulava skin/starter
// para sempre, entrava com charmander default e cimentava as flags.
//
// Regra correta: username é necessário mas NÃO suficiente. Exige 2ª prova
// de onboarding REALMENTE concluído:
//   1) avatar_url (skin confirmada), OU
//   2) pokemon_collection com linhas (starter/captura), OU
//   3) game_saves com progresso real (nunca um save fresco).
// `trainer_state` vazio é IGNORADO (bootstrap_player cria linha p/ novos).
export type AccountSignals = {
  username: string | null | undefined;
  avatarUrl: string | null | undefined;
  hasCollection: boolean;
  saveHasProgress: boolean;
};

export function computeIsExisting(s: AccountSignals): boolean {
  const hasName = !!(s.username && s.username.trim().length > 0);
  if (!hasName) return false;
  if (s.avatarUrl && s.avatarUrl.trim().length > 0) return true;
  if (s.hasCollection) return true;
  if (s.saveHasProgress) return true;
  return false;
}

/**
 * game_saves.data com "progresso real"? Um save fresco (freshIdle +
 * charmander lv1 default, 0 ouro) NÃO conta — auto-save pode criá-lo
 * antes do onboarding terminar.
 */
export function saveShowsProgress(data: unknown): boolean {
  try {
    if (!data || typeof data !== "object") return false;
    const d = data as {
      team?: Array<{ level?: unknown; xp?: unknown }>;
      idle?: {
        bank?: { gold?: unknown; crystals?: unknown };
        totals?: { captured?: unknown; kills?: unknown };
      };
    };
    if (Array.isArray(d.team)) {
      for (const p of d.team) {
        if ((Number(p?.level) || 1) > 1) return true;
        if ((Number(p?.xp) || 0) > 0) return true;
      }
    }
    const bank = d.idle?.bank;
    if ((Number(bank?.gold) || 0) > 0) return true;
    if ((Number(bank?.crystals) || 0) > 0) return true;
    const totals = d.idle?.totals;
    if ((Number(totals?.captured) || 0) > 0) return true;
    if ((Number(totals?.kills) || 0) > 0) return true;
    return false;
  } catch {
    return false;
  }
}
