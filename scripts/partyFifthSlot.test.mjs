import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (file) => readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
const sql = read("supabase/migrations/20261128120000_party_fifth_slot_fix.sql");
const party = read("src/game/party.ts");
const guild = read("src/components/GuildPanel.tsx");
const idle = read("src/routes/idle.tsx");

test("convite pendente antigo não reserva a 5ª vaga para sempre", () => {
  assert.match(sql, /update public\.party_invites\s+set status = 'declined'/);
  assert.match(sql, /created_at < now\(\) - interval '15 minutes'/);
  assert.match(sql, /v_members \+ v_pending >= 5/);
});

test("reconvidar o mesmo jogador renova o convite em vez de lotar a party", () => {
  const fn = sql.slice(sql.indexOf("create or replace function public.invite_player_to_party"), sql.indexOf("create or replace function public.get_my_party"));
  const existing = fn.indexOf("if v_invite_id is not null then");
  const limit = fn.indexOf("if v_members + v_pending >= 5 then");
  assert.ok(existing > 0 && limit > existing, "o convite existente deve ser tratado antes do limite");
  assert.match(fn, /update public\.party_invites set created_at = now\(\) where id = v_invite_id/);
});

test("o líder vê e pode cancelar os convites enviados", () => {
  assert.match(sql, /create or replace function public\.get_my_party/);
  assert.match(sql, /'outgoingInvites', v_outgoing/);
  assert.match(sql, /create or replace function public\.cancel_party_invite/);
  assert.match(sql, /grant execute on function public\.cancel_party_invite\(uuid\) to authenticated/);

  assert.match(party, /outgoingInvites\?: PartyInviteRow\[\]/);
  assert.match(party, /export async function cancelPartyInvite/);
  assert.match(guild, /partyOutgoingInvites: PartyInviteRow\[\]/);
  assert.match(guild, /CONVITES ENVIADOS/);
  assert.match(guild, /onCancelPartyInvite/);
  assert.match(guild, /Cada convite pendente reserva uma das 5 vagas/);
  assert.match(idle, /cancelPartyInvite as cancelPartyInviteRemote/);
  assert.match(idle, /handleCancelPartyInvite/);
  assert.match(idle, /partyOutgoingInvites: party\?\.outgoingInvites \?\? \[\]/);
});
