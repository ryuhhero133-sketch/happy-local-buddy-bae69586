// Online party API. Party state is owned by authenticated Supabase RPCs:
// clients never write party tables directly or choose party leaders/counts.

import type { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sb = supabase as any;

export const PARTY_MAX = 5;
export const PARTY_ONLINE_MS = 90_000;

export type PartyRow = {
  id: string;
  name: string;
  leader_id: string;
  leader_name: string;
  created_at: string;
  updated_at: string;
};

export type PartyMemberRow = {
  party_id: string;
  player_id: string;
  player_name: string;
  level: number;
  map_id: string | null;
  joined_at: string;
  last_seen: string;
  online?: boolean;
};

export type PartyInviteRow = {
  id: string;
  party_id: string;
  party_name: string;
  from_id: string;
  from_name: string;
  target_id: string;
  target_name: string;
  status: "pending" | "accepted" | "declined";
  created_at: string;
};

export type PartyState = {
  party: PartyRow;
  members: PartyMemberRow[];
  /** Convites pendentes enviados pela party; só o líder recebe a lista. */
  outgoingInvites?: PartyInviteRow[];
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function safeLevel(level: number | undefined): number {
  return Math.max(1, Math.min(1_000_000, Math.floor(Number(level) || 1)));
}

function safeMapId(mapId: string | undefined): string | null {
  const value = (mapId ?? "").trim().slice(0, 64);
  return value || null;
}

async function rpc<T>(name: string, params?: Record<string, unknown>): Promise<T> {
  const { data, error } = await sb.rpc(name, params);
  if (error) throw new Error(error.message);
  return data as T;
}

function asPartyState(value: unknown): PartyState | null {
  if (!value || typeof value !== "object") return null;
  const state = value as Partial<PartyState>;
  if (!state.party || !Array.isArray(state.members)) return null;
  return state as PartyState;
}

/** `true` only while the server heartbeat is fresh. */
export function isPartyMemberOnline(
  member: Pick<PartyMemberRow, "last_seen">,
  at = Date.now(),
): boolean {
  const lastSeen = Date.parse(member.last_seen);
  return Number.isFinite(lastSeen) && Math.abs(at - lastSeen) < PARTY_ONLINE_MS;
}

/** Creates a one-person party. The server returns an existing party if present. */
export async function createParty(opts: {
  name?: string;
  leaderId?: string;
  leaderName?: string;
  level: number;
  mapId: string;
}): Promise<PartyRow> {
  // Name/leader fields are intentionally ignored: identity comes from auth.uid().
  void opts.name;
  void opts.leaderId;
  void opts.leaderName;
  return rpc<PartyRow>("create_player_party", {
    p_level: safeLevel(opts.level),
    p_map_id: safeMapId(opts.mapId),
  });
}

/** Loads only the signed-in player's own party. Legacy id parameter is ignored. */
export async function getMyParty(_playerId?: string): Promise<PartyState | null> {
  void _playerId;
  return asPartyState(await rpc<unknown>("get_my_party"));
}

/** Leaves the signed-in player's party; leaders transfer leadership or dissolve it. */
export async function leaveParty(
  _playerId?: string,
  _partyId?: string,
  _isLeader?: boolean,
): Promise<boolean> {
  void _playerId;
  void _partyId;
  void _isLeader;
  return rpc<boolean>("leave_my_party");
}

/** Removes a member only when the authenticated caller is the current leader. */
export async function kickMember(
  _partyId: string,
  _leaderId: string,
  targetId: string,
): Promise<boolean> {
  void _partyId;
  void _leaderId;
  return rpc<boolean>("kick_party_member", { p_member: targetId });
}

/** Transfers leadership only when the authenticated caller is the current leader. */
export async function transferLeadership(
  _partyId: string,
  newLeaderId: string,
  _newLeaderName?: string,
): Promise<boolean> {
  void _partyId;
  void _newLeaderName;
  return rpc<boolean>("transfer_party_leadership", { p_member: newLeaderId });
}

export async function invitePlayerToParty(opts: {
  targetId: string;
  level: number;
  mapId: string;
}): Promise<{ invite_id: string; party_id: string; party_name: string }> {
  if (!UUID_RE.test(opts.targetId)) {
    throw new Error("Este jogador não está disponível para convite online.");
  }
  return rpc("invite_player_to_party", {
    p_target: opts.targetId,
    p_level: safeLevel(opts.level),
    p_map_id: safeMapId(opts.mapId),
  });
}

/** Compatibility wrapper for the unused PartyOverlay. Server ignores supplied names/party ids. */
export async function invitePlayer(opts: {
  partyId?: string;
  partyName?: string;
  fromId?: string;
  fromName?: string;
  targetId: string;
  targetName?: string;
}): Promise<{ invite_id: string; party_id: string; party_name: string }> {
  void opts.partyId;
  void opts.partyName;
  void opts.fromId;
  void opts.fromName;
  void opts.targetName;
  return invitePlayerToParty({ targetId: opts.targetId, level: 1, mapId: "" });
}

/** Lists only invitations addressed to the authenticated user. */
export async function listInvitesFor(_targetId?: string): Promise<PartyInviteRow[]> {
  void _targetId;
  const data = await rpc<unknown>("list_my_party_invites");
  return Array.isArray(data) ? (data as PartyInviteRow[]) : [];
}

export async function acceptInvite(
  invite: Pick<PartyInviteRow, "id">,
  me: { id?: string; name?: string; level: number; mapId: string },
): Promise<string> {
  // ID/name are intentionally ignored: the RPC accepts only the logged-in user.
  void me.id;
  void me.name;
  return rpc<string>("accept_party_invite", {
    p_invite: invite.id,
    p_level: safeLevel(me.level),
    p_map_id: safeMapId(me.mapId),
  });
}

export async function declineInvite(inviteId: string): Promise<boolean> {
  return rpc<boolean>("decline_party_invite", { p_invite: inviteId });
}

/** Líder cancela um convite enviado e libera a vaga reservada. */
export async function cancelPartyInvite(inviteId: string): Promise<boolean> {
  return rpc<boolean>("cancel_party_invite", { p_invite: inviteId });
}

/** Updates the caller's own party heartbeat, level and map. */
export async function pingPresence(
  _playerId: string | undefined,
  mapId: string,
  level: number,
): Promise<boolean> {
  void _playerId;
  return rpc<boolean>("party_presence_heartbeat", {
    p_level: safeLevel(level),
    p_map_id: safeMapId(mapId),
  });
}

// ===== Optional Realtime broadcast bus (combat visual coordination only) =====
export type PartyBroadcastEvent =
  | {
      type: "xp_share";
      fromId: string;
      fromName: string;
      mapId: string;
      xpEach: number;
      channelId?: number;
      spawnKey?: string;
      baseXp?: number;
      targetLevel?: number;
      targetRarity?: string;
    }
  | { type: "kill_ping"; fromId: string; fromName: string; mapId: string; speciesId: string }
  | {
      type: "shared_kill";
      fromId: string;
      fromName: string;
      mapId: string;
      channelId: number;
      spawnKey: string;
      speciesId: string;
    };

export function subscribePartyChannel(
  partyId: string,
  onEvent: (event: PartyBroadcastEvent) => void,
): {
  channel: RealtimeChannel;
  unsubscribe: () => void;
} {
  const channel = supabase.channel(`party-bus-${partyId}`, {
    config: { broadcast: { self: false } },
  });
  channel.on("broadcast", { event: "msg" }, (payload) => {
    const event = payload.payload as PartyBroadcastEvent;
    if (event) onEvent(event);
  });
  channel.subscribe();
  return {
    channel,
    unsubscribe: () => {
      void supabase.removeChannel(channel);
    },
  };
}

export async function broadcastToParty(channel: RealtimeChannel, event: PartyBroadcastEvent) {
  await channel.send({ type: "broadcast", event: "msg", payload: event });
}
