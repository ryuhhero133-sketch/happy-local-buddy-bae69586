// Server-only helper: apaga permanentemente um usuário (Auth + tabelas do jogo).
// Usa a Service Role Key (bypassa RLS). Nunca importar em código de cliente.

type Target = { table: string; columns: string[] };

// Tabelas conhecidas do projeto + colunas que referenciam o UUID do usuário.
export const PURGE_TARGETS: Target[] = [
  { table: "profiles", columns: ["id", "user_id"] },
  { table: "players", columns: ["id", "user_id"] },
  { table: "player_data", columns: ["user_id"] },
  { table: "inventory", columns: ["user_id"] },
  { table: "game_saves", columns: ["user_id"] },
  { table: "black_egg_saves", columns: ["user_id"] },
  { table: "ranked_scores", columns: ["user_id"] },
  { table: "ranked_leaderboard", columns: ["user_id"] },
  { table: "market_listings", columns: ["seller_id", "buyer_id"] },
  { table: "marketplace_offers", columns: ["seller_id", "buyer_id"] },
  { table: "marketplace_pokemon", columns: ["seller_id", "buyer_id"] },
  { table: "pending_purchases", columns: ["user_id"] },
  { table: "cashshop_tickets", columns: ["user_id"] },
  { table: "cashshop_messages", columns: ["user_id"] },
  { table: "code_redemptions", columns: ["user_id"] },
  { table: "redeemed_codes", columns: ["user_id"] },
  { table: "guild_members", columns: ["user_id"] },
  { table: "user_roles", columns: ["user_id"] },
];

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value: string): boolean {
  return UUID_RE.test(value);
}

// Erros que significam "essa tabela/coluna não existe aqui" — podem ser ignorados.
function isMissingRelation(code?: string | null): boolean {
  return code === "42P01" || code === "42703" || code === "PGRST204" || code === "PGRST205";
}

export type PurgeResult = {
  userId: string;
  deletedFrom: string[];
  skipped: string[];
  authDeleted: boolean;
};

export async function purgeUserCompletely(userId: string): Promise<PurgeResult> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const admin = supabaseAdmin as any;

  const deletedFrom: string[] = [];
  const skipped: string[] = [];

  // 1) Remove os dados do jogo ANTES de apagar o Auth (evita órfãos se falhar).
  for (const target of PURGE_TARGETS) {
    for (const column of target.columns) {
      const { error } = await admin.from(target.table).delete().eq(column, userId);
      if (!error) {
        deletedFrom.push(`${target.table}.${column}`);
        continue;
      }
      if (isMissingRelation(error.code)) {
        skipped.push(`${target.table}.${column}`);
        continue;
      }
      throw new Error(`Falha ao limpar ${target.table}.${column}: ${error.message}`);
    }
  }

  // 2) Apaga a conta no Auth.
  const { error: authError } = await admin.auth.admin.deleteUser(userId);
  if (authError && !/not.?found/i.test(authError.message ?? "")) {
    throw new Error(`Falha ao excluir o usuário no Auth: ${authError.message}`);
  }

  // 3) Confirma que a conta sumiu.
  const { data: check, error: checkError } = await admin.auth.admin.getUserById(userId);
  if (!checkError && check?.user) {
    throw new Error("O usuário ainda existe no Auth após a exclusão.");
  }

  return { userId, deletedFrom, skipped, authDeleted: true };
}
