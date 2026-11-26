import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("TOP RANKED is a server snapshot refreshed by cron every 6 hours", () => {
  const sql = read("supabase/migrations/20261126130000_ranked_snapshot_6h.sql");
  assert.match(sql, /create table if not exists public\.ranked_snapshot/);
  assert.match(sql, /create or replace function public\.refresh_global_ranked_snapshot\(\)/);
  assert.match(sql, /insert into public\.ranked_snapshot/);
  assert.match(sql, /from public\.game_saves s/);
  assert.match(sql, /order by r\.trainer_level desc, r\.craft_points desc/);
  assert.match(sql, /from public\.ranked_snapshot r/);
  assert.match(sql, /order by r\.rank_position asc/);
  assert.match(sql, /cron\.schedule\(\s*'refresh-global-ranked-6h',\s*'0 \*\/6 \* \* \*'/);
  assert.match(sql, /select public\.refresh_global_ranked_snapshot\(\)/);
});

test("only authenticated players read the snapshot; writes stay owner/cron-only", () => {
  const sql = read("supabase/migrations/20261126130000_ranked_snapshot_6h.sql");
  assert.match(sql, /revoke all on table public\.ranked_snapshot from anon, authenticated/);
  assert.match(sql, /grant select on table public\.ranked_snapshot to authenticated/);
  assert.match(sql, /revoke all on function public\.refresh_global_ranked_snapshot\(\) from public, anon, authenticated/);
  assert.doesNotMatch(sql, /grant (insert|update|delete) on table public\.ranked_snapshot/i);
});

test("client shows the real snapshot time and never invents six-hour data", () => {
  const api = read("src/lib/rankedApi.ts");
  assert.match(api, /refreshed_at\?: string \| null/);
  assert.match(api, /A RPC já devolve o snapshot na posição oficial/);
  assert.doesNotMatch(api.slice(api.indexOf("export async function fetchTopRanked"), api.indexOf("// Ranking do evento Grass Oddish")), /\.sort\(/);
  const idle = read("src/routes/idle.tsx");
  assert.match(idle, /top\[0\]\?\.refreshed_at/);
  assert.match(idle, /atualiza a cada 6h/);
  assert.match(idle, /snapshot \$\{new Date\(rankSnapshotAt\)/);
});
