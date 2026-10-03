// HUD da Guilda & Amigos — abas: MISSÕES (captura) | MEMBROS | AMIGOS | CASAR (bloqueado).
// Trade bloqueado por enquanto. Guilda usa Supabase (guildApi); amigos/party são locais.
import { useState } from "react";
import type { Guild, GuildElement } from "@/game/guild";
import { GUILD_ELEMENTS, bonusesFor } from "@/game/guild";
import { GUILD_MISSIONS, type GuildMission } from "@/game/guildMissions";
import type { GuildInvite } from "@/lib/guildApi";
import type { FriendEntry } from "@/game/guildMissions";
import type { PartyRow, PartyMemberRow, PartyInviteRow } from "@/game/party";
import { PARTY_MAX } from "@/game/party";

type Props = {
  guild: Guild | null;
  guildLoading: boolean;
  invites: GuildInvite[];
  friends: FriendEntry[];
  party: { party: PartyRow; members: PartyMemberRow[] } | null;
  partyInvites: PartyInviteRow[];
  missionProgress: Record<string, number>;
  claimedMissions: string[];
  myId: string;
  myName: string;
  myLevel: number;
  myGold: number;
  mySpecies: string | null;
  onCreateGuild: (name: string, element: GuildElement) => void;
  onInviteUsername: (username: string) => void;
  onAcceptInvite: (inv: GuildInvite) => void;
  onDeclineInvite: (id: string) => void;
  onClaimMission: (m: GuildMission) => void;
  onAddFriend: (name: string) => void;
  onRemoveFriend: (name: string) => void;
  onPartyAdd: (target: { id: string; name: string }) => void;
  onPartyRemove: (targetName: string) => void;
  onAcceptPartyInvite: (inv: PartyInviteRow) => void;
  onDeclinePartyInvite: (id: string) => void;
  onLeaveParty: () => void;
  onLeaveGuild: () => void;
  onKickMember: (memberId: string) => void;
  onRefresh: () => void;
};

// Safe array accessors
const safeMembers = (g: Guild | null) => g?.members ?? [];
const safeFriends = (f: FriendEntry[] | undefined) => f ?? [];
const safePartyMembers = (p: { party: PartyRow; members: PartyMemberRow[] } | null) => p?.members ?? [];
const safePartyInvites = (inv: PartyInviteRow[] | undefined) => inv ?? [];
const safeGuildInvites = (inv: GuildInvite[] | undefined) => inv ?? [];

const isInParty = (party: { party: PartyRow; members: PartyMemberRow[] } | null, name: string) =>
  party?.members.some((m) => m.player_name.toLowerCase() === name.toLowerCase()) ?? false;

type SubTab = "missoes" | "membros" | "amigos" | "casar";

const ROLE_LABEL: Record<string, string> = { leader: "LÍDER", vice: "VICE", member: "MEMBRO" };
const ROLE_COLOR: Record<string, string> = { leader: "#f5cf6b", vice: "#c084fc", member: "#8fb8dd" };

export function GuildPanel(p: Props) {
  const [sub, setSub] = useState<SubTab>("missoes");
  const [newGuildName, setNewGuildName] = useState("");
  const [newGuildEl, setNewGuildEl] = useState<GuildElement>("grass");
  const [inviteName, setInviteName] = useState("");
  const [friendName, setFriendName] = useState("");
  const g = p.guild;
  const isLeader = !!g && g.founderId === p.myId;
  const bonus = g ? bonusesFor(g.level) : null;

  const btn = (bg: string, fg = "#1a0f2a"): React.CSSProperties => ({
    padding: "6px 10px", fontSize: 9, fontWeight: 900, borderRadius: 6, cursor: "pointer",
    background: bg, color: fg, border: "2px solid #1a0f2a", letterSpacing: 0.5,
  });
  const inputStyle: React.CSSProperties = {
    flex: 1, minWidth: 0, padding: "6px 8px", fontSize: 10, borderRadius: 6,
    background: "#0a1830", color: "#fff", border: "2px solid #3a6a9a",
    fontFamily: "inherit",
  };

  const friendActions = (name: string, isFriend: boolean) => (
    <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 4 }}>
      <button
        style={btn("#7dd87d")}
        title="Convidar para a guilda"
        onClick={() => p.onInviteUsername(name)}
      >CONVIDAR</button>
      {isInParty(p.party, name) ? (
        <button style={btn("#9a9a9a", "#fff")} onClick={() => p.onPartyRemove(name)}>SAIR PARTY</button>
      ) : (
        <button style={btn("#7dc4ff")} onClick={() => p.onPartyAdd({ id: "", name })}>CHAMAR PARTY</button>
      )}
      <button
        style={{ ...btn("#3a3a5a", "#8a8aa8"), cursor: "not-allowed", opacity: 0.7 }}
        title="Trade bloqueado por enquanto"
        onClick={() => {}}
      >🔒 TROCA</button>
      {isFriend ? (
        <button style={btn("#c46a6a", "#fff")} onClick={() => p.onRemoveFriend(name)}>- AMIGO</button>
      ) : (
        <button style={btn("#f5cf6b")} onClick={() => p.onAddFriend(name)}>+ AMIGO</button>
      )}
    </div>
  );

  return (
    <div style={{
      background: "linear-gradient(180deg, #0d2240 0%, #081428 60%, #060d1a 100%)",
      border: "3px solid #060d18", borderRadius: 14, padding: 10,
      maxWidth: 740, width: "100%", margin: "0 auto",
      fontFamily: '"Pixelify Sans", ui-monospace, monospace',
    }}>
      {/* Cabeçalho da guilda */}
      {!g ? (
        <div style={{ background: "rgba(0,0,0,0.35)", border: "2px solid #3a6a9a", borderRadius: 10, padding: 10 }}>
          <div style={{ color: "#ffe9a8", fontWeight: 900, fontSize: 13, letterSpacing: 1, marginBottom: 4 }}>🏰 CRIAR GUILDA <span style={{ fontSize: 9, color: "#9ab8d8" }}>(5000 ouro)</span></div>
          <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
            <input value={newGuildName} onChange={(e) => setNewGuildName(e.target.value)} placeholder="Nome da guilda" maxLength={18} style={inputStyle} />
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
            {GUILD_ELEMENTS.map((el) => (
              <button
                key={el.id}
                onClick={() => setNewGuildEl(el.id)}
                title={el.label}
                style={{
                  width: 40, height: 40, borderRadius: 8, cursor: "pointer", overflow: "hidden",
                  border: newGuildEl === el.id ? "2px solid #f5cf6b" : "2px solid #3a6a9a",
                  boxShadow: newGuildEl === el.id ? "0 0 10px rgba(245,207,107,0.7)" : "none",
                  background: "#0a1830", padding: 0,
                }}
              ><img src={el.image} alt={el.label} width={36} height={36} style={{ imageRendering: "pixelated" }} /></button>
            ))}
          </div>
          <button
            style={{ ...btn("linear-gradient(180deg, #7dd87d, #3a9a4a)"), width: "100%" }}
            onClick={() => { if (newGuildName.trim()) p.onCreateGuild(newGuildName.trim(), newGuildEl); }}
          >FUNDAR GUILDA</button>
          <div style={{ fontSize: 9, color: "#8fb8dd", marginTop: 6, fontStyle: "italic" }}>
            Sem guilda? As missões abaixo contam do mesmo jeito — o XP de guilda entra quando você entrar numa.
          </div>
        </div>
      ) : (
        <div style={{ background: "rgba(0,0,0,0.35)", border: "2px solid #f5cf6b", borderRadius: 10, padding: 8, display: "flex", gap: 8, alignItems: "center" }}>
          <img src={GUILD_ELEMENTS.find((e) => e.id === g.element)?.image} alt="" width={44} height={44} style={{ imageRendering: "pixelated", flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ color: "#ffe9a8", fontWeight: 900, fontSize: 13, letterSpacing: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {g.name} <span style={{ fontSize: 9, color: "#f5cf6b" }}>Nv.{g.level}</span>
            </div>
            <div style={{ height: 8, borderRadius: 999, background: "rgba(0,0,0,0.5)", border: "1px solid #f5cf6b88", overflow: "hidden", marginTop: 3 }}>
              <div style={{ width: `${Math.min(100, (g.xp / Math.max(1, 50 * Math.pow(1.55, g.level - 1))) * 100)}%`, height: "100%", background: "linear-gradient(90deg,#f5cf6b,#ff9d2e)" }} />
            </div>
            {bonus && (
              <div style={{ fontSize: 8.5, color: "#8fd08f", marginTop: 3 }}>
                +{Math.round(bonus.xp * 100)}% XP · +{Math.round(bonus.gold * 100)}% Ouro · +{Math.round(bonus.capture * 100)}% Captura · {g.members.length} membros
              </div>
            )}
          </div>
          <button style={btn("#1a2f4d", "#cfe6ff")} onClick={p.onRefresh} title="Recarregar">↻</button>
        </div>
      )}
      {p.guildLoading && <div style={{ fontSize: 9, color: "#8fb8dd", marginTop: 4 }}>Carregando guilda...</div>}

      {/* Sub-abas */}
      <div style={{ display: "flex", gap: 4, marginTop: 8 }}>
        {(["missoes", "membros", "amigos", "casar"] as SubTab[]).map((k) => (
          <button
            key={k}
            onClick={() => setSub(k)}
            style={{
              flex: 1, padding: "6px 0", fontSize: 9, fontWeight: 900, borderRadius: 8, cursor: "pointer",
              background: sub === k ? "linear-gradient(180deg, #2a7ad0, #1a4a8a)" : "rgba(255,255,255,0.06)",
              color: sub === k ? "#fff" : "#8fb8dd", border: "2px solid #060d18",
            }}
          >{k === "missoes" ? "📋 MISSÕES" : k === "membros" ? `👥 MEMBROS${g ? ` ${g.members.length}` : ""}` : k === "amigos" ? `💚 AMIGOS${p.friends.length ? ` ${p.friends.length}` : ""}` : "💍 CASAR 🔒"}</button>
        ))}
      </div>

      {/* MISSÕES */}
      {sub === "missoes" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 8 }}>
          {GUILD_MISSIONS.map((m) => {
            const cur = Math.min(m.target, p.missionProgress[m.id] ?? 0);
            const done = cur >= m.target;
            const claimed = p.claimedMissions.includes(m.id);
            return (
              <div key={m.id} style={{ background: "#f5f0dc", borderRadius: 8, padding: "6px 8px", display: "flex", gap: 8, alignItems: "center" }}>
                <span style={{ fontSize: 22, flexShrink: 0 }}>{m.icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 11, fontWeight: 900, color: "#1e3a5e" }}>{m.title}</div>
                  <div style={{ fontSize: 9.5, color: "#5a7a9a" }}>{m.desc}</div>
                  <div style={{ height: 7, borderRadius: 999, background: "rgba(30,58,94,0.2)", overflow: "hidden", marginTop: 3 }}>
                    <div style={{ width: `${(cur / m.target) * 100}%`, height: "100%", background: done ? "#3a9a4a" : "#2a7ad0" }} />
                  </div>
                  <div style={{ fontSize: 8.5, color: "#5a7a9a", marginTop: 2 }}>
                    {cur}/{m.target} · +{m.rewardGold} ouro{m.rewardCrystals ? ` +${m.rewardCrystals}💎` : ""} · +{m.rewardGuildXp} XP guilda
                  </div>
                </div>
                {claimed ? (
                  <span style={{ fontSize: 9, fontWeight: 900, color: "#3a9a4a" }}>✓ RESGATADO</span>
                ) : (
                  <button
                    style={{ ...btn(done ? "#7dd87d" : "#9a9a9a", done ? "#0b2010" : "#3a3a3a"), opacity: done ? 1 : 0.6, cursor: done ? "pointer" : "not-allowed" }}
                    disabled={!done}
                    onClick={() => p.onClaimMission(m)}
                  >RESGATAR</button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* MEMBROS */}
      {sub === "membros" && (
        <div style={{ marginTop: 8 }}>
          {safePartyInvites(p.partyInvites).length > 0 && (
            <div style={{ background: "rgba(245,207,107,0.1)", border: "1px solid #f5cf6b", borderRadius: 8, padding: 6, marginBottom: 6 }}>
              <div style={{ fontSize: 9, fontWeight: 900, color: "#f5cf6b", marginBottom: 4 }}>✉️ CONVITES DE PARTY RECEBIDOS</div>
              {safePartyInvites(p.partyInvites).map((inv) => (
                <div key={inv.id} style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 4 }}>
                  <span style={{ flex: 1, fontSize: 10, color: "#fff" }}><b>{inv.party_name}</b> <span style={{ color: "#9ab8d8" }}>de {inv.from_name}</span></span>
                  <button style={btn("#7dd87d")} onClick={() => p.onAcceptPartyInvite(inv)}>ACEITAR</button>
                  <button style={btn("#9a9a9a", "#fff")} onClick={() => p.onDeclinePartyInvite(inv.id)}>X</button>
                </div>
              ))}
            </div>
          )}
          {!g ? (
            <div style={{ fontSize: 10, color: "#8fb8dd", fontStyle: "italic", textAlign: "center", padding: 12 }}>
              Você ainda não tem guilda. Crie uma acima ou aceite um convite.
            </div>
          ) : (
            <>
              <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
                <input value={inviteName} onChange={(e) => setInviteName(e.target.value)} placeholder="Username para convidar" style={inputStyle} />
                <button style={btn("#7dd87d")} onClick={() => { if (inviteName.trim()) { p.onInviteUsername(inviteName.trim()); setInviteName(""); } }}>CONVIDAR</button>
              </div>
              {safeMembers(g).map((m) => {
                const isMe = m.id === p.myId;
                const isFriend = safeFriends(p.friends).some((f) => f.name.toLowerCase() === m.name.toLowerCase());
                return (
                  <div key={m.id} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(140,200,255,0.3)", borderRadius: 8, padding: 6, marginBottom: 4 }}>
                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      <span style={{ flex: 1, fontSize: 10, fontWeight: 900, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {m.name} <span style={{ color: "#9ab8d8" }}>Lv.{m.level}</span>
                      </span>
                      <span style={{ fontSize: 8, fontWeight: 900, color: ROLE_COLOR[m.role ?? "member"], border: `1px solid ${ROLE_COLOR[m.role ?? "member"]}`, borderRadius: 4, padding: "1px 5px" }}>
                        {ROLE_LABEL[m.role ?? "member"]}
                      </span>
                      {isLeader && !isMe && (
                        <button style={btn("#c46a6a", "#fff")} onClick={() => p.onKickMember(m.id)}>EXPULSAR</button>
                      )}
                    </div>
                    {!isMe && friendActions(m.name, isFriend)}
                  </div>
                );
              })}
              <button style={{ ...btn("#3a3a5a", "#c9c1ff"), width: "100%", marginTop: 4 }} onClick={p.onLeaveGuild}>SAIR DA GUILDA</button>
            </>
          )}
        </div>
      )}

      {/* AMIGOS */}
      {sub === "amigos" && (
        <div style={{ marginTop: 8 }}>
          {safePartyMembers(p.party).length > 0 && (
            <div style={{ background: "rgba(125,196,255,0.1)", border: "1px solid #7dc4ff", borderRadius: 8, padding: 6, marginBottom: 6 }}>
              <div style={{ fontSize: 9, fontWeight: 900, color: "#7dc4ff", marginBottom: 4 }}>⚔️ MINHA PARTY ({safePartyMembers(p.party).length}/{PARTY_MAX})</div>
              {safePartyMembers(p.party).map((m) => (
                <div key={m.player_id} style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 3 }}>
                  <span style={{ flex: 1, fontSize: 10, color: "#fff" }}>
                    {m.player_name} <span style={{ color: "#9ab8d8" }}>Lv.{m.level}</span>
                  </span>
                  {m.player_id !== p.myId && (
                    <button style={btn("#9a9a9a", "#fff")} onClick={() => p.onPartyRemove(m.player_name)}>TIRAR</button>
                  )}
                </div>
              ))}
            </div>
          )}
          <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
            <input value={friendName} onChange={(e) => setFriendName(e.target.value)} placeholder="Username do amigo" style={inputStyle} />
            <button style={btn("#f5cf6b")} onClick={() => { if (friendName.trim()) { p.onAddFriend(friendName.trim()); setFriendName(""); } }}>+ AMIGO</button>
          </div>
          {safeFriends(p.friends).length === 0 ? (
            <div style={{ fontSize: 10, color: "#8fb8dd", fontStyle: "italic", textAlign: "center", padding: 12 }}>
              Nenhum amigo ainda. Adicione pelo username — depois clique nele para convidar, chamar pra party ou (em breve) trocar.
            </div>
          ) : (
            safeFriends(p.friends).map((f) => {
              const inParty = isInParty(p.party, f.name);
              return (
                <div key={f.name.toLowerCase()} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(140,200,255,0.3)", borderRadius: 8, padding: 6, marginBottom: 4 }}>
                  <div style={{ fontSize: 10, fontWeight: 900, color: "#fff" }}>
                    💚 {f.name}
                    {inParty && <span style={{ marginLeft: 6, fontSize: 8, color: "#7dc4ff" }}>⚔️ NA PARTY</span>}
                  </div>
                  {friendActions(f.name, true)}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* CASAR (bloqueado) */}
      {sub === "casar" && (
        <div style={{ marginTop: 8, textAlign: "center", padding: 24, background: "rgba(0,0,0,0.35)", borderRadius: 10, border: "2px dashed rgba(150,150,255,0.35)" }}>
          <div style={{ fontSize: 34 }}>💍</div>
          <div style={{ fontSize: 12, fontWeight: 900, color: "#c9c1ff", marginTop: 6 }}>CASAMENTO EM BREVE</div>
          <div style={{ fontSize: 9, color: "#8fb8dd", marginTop: 4 }}>Cerimônia, alianças e bônus de casal chegam na próxima fase. 🔒</div>
        </div>
      )}
    </div>
  );
}
