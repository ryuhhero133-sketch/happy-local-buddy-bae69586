// Livro de Missões — pixel-art 2D, somente visual.
// Toda a lógica (progresso, recompensas, conclusão) vem via props do idle.tsx.
// Nenhum cálculo de gameplay/economia aqui: só leitura e callbacks existentes.
import { useState } from "react";

export type QuestBookPanelProps = {
  idle: any;
  tasks: any[];
  crystalGreenImg: string;
  npcPng: Record<string, string>;
  SIDE_QUESTS: any[];
  SAGA_NPCS: any;
  SAGA_STAGES: any[];
  SAGA_TOTAL_STAGES: number;
  IDLE_MAPS: any;
  freshSaga: () => any;
  freshSideQuests: () => any;
  sagaRewardText: (r: any) => string;
  sagaProgressTextPure: (st: any, sg: any, items: any, here: boolean) => string;
  sideObjectiveDone: (q: any, sq: any, items: any, map: any) => boolean;
  sideProgressText: (q: any, sq: any, items: any, map: any) => string;
  npcThemeFor: (npc: string) => any;
  starsFor: (n: number) => number;
  onSagaLocate: (npc: any) => void;
  onSagaTalk: (npc: any) => void;
  onClaimTask: (id: string) => void;
  onClose: () => void;
};

type EntryStatus = "active" | "ready" | "claimed" | "locked" | "done";
type Entry = {
  key: string;
  cat: "main" | "daily" | "npc" | "done";
  title: string;
  npcName: string;
  npcPng: string | null;
  frame: string;
  short: string;
  status: EntryStatus;
  progressText: string;
  pct: number;
  desc: string;
  objectives: { label: string; progress: string }[];
  rewards: { emoji?: string; img?: string; label: string }[];
  action: { label: string; onClick: () => void } | null;
};

const STATUS_META: Record<EntryStatus, { label: string; bg: string; fg: string }> = {
  active: { label: "Em andamento", bg: "#4ea8ff", fg: "#0b2038" },
  ready: { label: "Entregar", bg: "#22c55e", fg: "#052e16" },
  claimed: { label: "Concluída", bg: "#22c55e", fg: "#052e16" },
  done: { label: "Concluída", bg: "#22c55e", fg: "#052e16" },
  locked: { label: "Bloqueada", bg: "#6b7280", fg: "#fff" },
};

const CATS = [
  { id: "all", label: "Todas", icon: "📜" },
  { id: "main", label: "Principais", icon: "⭐" },
  { id: "daily", label: "Diárias", icon: "📅" },
  { id: "npc", label: "NPCs", icon: "🗣️" },
  { id: "done", label: "Conquistas", icon: "🏆" },
] as const;

export function QuestBookPanel(props: QuestBookPanelProps) {
  const {
    idle, tasks, crystalGreenImg, npcPng, SIDE_QUESTS, SAGA_NPCS, SAGA_STAGES,
    SAGA_TOTAL_STAGES, IDLE_MAPS, freshSaga, freshSideQuests, sagaRewardText,
    sagaProgressTextPure, sideObjectiveDone, sideProgressText, npcThemeFor,
    starsFor, onSagaLocate, onSagaTalk, onClaimTask, onClose,
  } = props;

  const [cat, setCat] = useState<string>("all");
  const [selKey, setSelKey] = useState<string | null>(null);

  const sq = idle.sideQuests ?? freshSideQuests();
  const sg = idle.saga ?? freshSaga();

  // ---- Pedidos aceitos + disponíveis (mesma lógica da aba antiga) ----
  const rows = (sq.accepted ?? [])
    .map((id: string) => SIDE_QUESTS.find((q: any) => q.id === id))
    .filter(Boolean);
  const nextRows = (["boby", "san", "nanizinha", "payka", "pan"] as const)
    .flatMap((npc) => {
      const done = sq.completed?.[npc] ?? 0;
      const cooling = SIDE_QUESTS.filter((q: any) => q.npc === npc && sq.claimedAt?.[q.id] && Date.now() - sq.claimedAt[q.id] < 20 * 3600 * 1000);
      const free = SIDE_QUESTS.filter((q: any) => q.npc === npc && !sq.claimedAt?.[q.id] && q.minStars <= starsFor(done) && !(sq.accepted ?? []).includes(q.id));
      if (free.length === 0 || cooling.length >= free.length) return [];
      return [free[0]];
    })
    .slice(0, 3);

  const entries: Entry[] = [];

  // ---- Saga (Principais) ----
  if (sg.finished) {
    entries.push({
      key: "saga-finished", cat: "main", title: "As Memórias Apagadas", npcName: "Saga",
      npcPng: null, frame: "#8a6a3a", short: "Saga concluída", status: "done", progressText: "100%",
      pct: 100, desc: "Você preservou as memórias escolhidas.",
      objectives: [{ label: "Saga concluída", progress: "✓" }],
      rewards: [], action: null,
    });
  } else if (sg.stage >= SAGA_STAGES.length) {
    entries.push({
      key: "saga-choice", cat: "main", title: "A Escolha", npcName: "Saga",
      npcPng: null, frame: "#8a6a3a", short: "Quais dois continuarão?", status: "ready", progressText: "Decidir",
      pct: 100, desc: "Cinco começaram. Dois continuarão.",
      objectives: [{ label: "Escolher dois NPCs", progress: "pendente" }],
      rewards: [], action: { label: "ESCOLHER AGORA 💖", onClick: () => onSagaTalk("choice") },
    });
  } else {
    const st = SAGA_STAGES[sg.stage];
    if (st) {
      const ob = st.objective;
      const here = ob.kind === "visit" ? idle.currentMap === ob.map : false;
      const prog = sagaProgressTextPure(st, sg, idle.items, here);
      const isDone = (() => {
        if (ob.kind === "talk" || ob.kind === "choice") return true;
        if (ob.kind === "kill" || ob.kind === "capture" || ob.kind === "feed_pet" || ob.kind === "feed_trainer") return sg.count >= ob.count;
        if (ob.kind === "item") return (idle.items[ob.itemId] ?? 0) >= ob.qty;
        return here;
      })();
      const claimed = !!sg.claimed?.[st.id];
      const accent = npcThemeFor(st.npc).accent;
      const countMax = (ob.kind === "kill" || ob.kind === "capture" || ob.kind === "feed_pet" || ob.kind === "feed_trainer") ? ob.count : null;
      const pct = countMax != null ? Math.min(100, (sg.count / countMax) * 100) : (isDone ? 100 : 0);
      const rewards = (st.reward ?? []).map((r: any) => {
        if (r.kind === "gold") return { emoji: "🪙", label: `x${r.qty}` };
        if (r.kind === "crystal") return { emoji: "💎", label: `x${r.qty}` };
        return { emoji: "📦", label: `+${r.qty} ${r.itemId}` };
      });
      const npcHere = idle.currentMap === SAGA_NPCS[st.npc]?.map;
      entries.push({
        key: `saga-${st.id}`, cat: "main", title: st.title,
        npcName: SAGA_NPCS[st.npc]?.name ?? st.npc,
        npcPng: npcPng[st.npc] ?? null, frame: accent, short: st.objectiveLabel,
        status: claimed ? "claimed" : isDone ? "ready" : "active",
        progressText: prog, pct,
        desc: `Etapa ${sg.stage + 1}/${SAGA_TOTAL_STAGES}. ${st.objectiveLabel}. ${SAGA_NPCS[st.npc]?.name ?? ""} está em ${(IDLE_MAPS[SAGA_NPCS[st.npc]?.map]?.name ?? "Revoland")}.`,
        objectives: [{ label: st.objectiveLabel, progress: prog }],
        rewards,
        action: { label: npcHere ? (isDone ? "💬 FALAR" : "💬 FALAR") : "🗺️ FALAR — IR ATÉ ELE", onClick: () => onSagaLocate(st.npc) },
      });
    }
  }

  // ---- Pedidos aceitos (NPCs) ----
  for (const q of rows) {
    const ready = sideObjectiveDone(q, sq, idle.items, idle.currentMap);
    const here = SAGA_NPCS[q.npc] ? idle.currentMap === SAGA_NPCS[q.npc].map : false;
    const prog = sideProgressText(q, sq, idle.items, idle.currentMap);
    const pct = q.objective && typeof q.objective.count === "number"
      ? Math.min(100, ((sq.count?.[q.id] ?? 0) / q.objective.count) * 100) : (ready ? 100 : 0);
    entries.push({
      key: `side-${q.id}`, cat: "npc", title: q.title,
      npcName: SAGA_NPCS[q.npc]?.name ?? q.npc,
      npcPng: npcPng[q.npc] ?? null, frame: npcThemeFor(q.npc).accent, short: q.objectiveLabel,
      status: ready ? "ready" : "active", progressText: prog, pct,
      desc: q.desc ?? q.objectiveLabel,
      objectives: [{ label: q.objectiveLabel, progress: prog }],
      rewards: [
        { emoji: "💎", label: `x${q.crystals}` },
        ...((q.bonus ?? []).map((b: any) => ({ emoji: "🎁", label: `+${b.qty} ${b.itemId}` }))),
      ],
      action: { label: here ? (ready ? "🎁 ENTREGAR" : "💬 FALAR") : "🗺️ IR ATÉ ELE", onClick: () => onSagaLocate(q.npc) },
    });
  }

  // ---- Pedidos disponíveis (bloqueados) ----
  for (const q of nextRows) {
    entries.push({
      key: `side-lock-${q.id}`, cat: "npc", title: q.title,
      npcName: SAGA_NPCS[q.npc]?.name ?? q.npc,
      npcPng: npcPng[q.npc] ?? null, frame: "#9ca3af", short: `Requer ★${q.minStars}`,
      status: "locked", progressText: `★${q.minStars} · 💎${q.crystals}`, pct: 0,
      desc: q.desc ?? q.objectiveLabel,
      objectives: [{ label: q.objectiveLabel, progress: "bloqueada" }],
      rewards: [{ emoji: "💎", label: `x${q.crystals}` }],
      action: null,
    });
  }

  // ---- Diárias ----
  for (const t of tasks ?? []) {
    const pct = t.target > 0 ? Math.min(100, (t.progress / t.target) * 100) : 0;
    entries.push({
      key: `daily-${t.id}`, cat: "daily", title: t.title,
      npcName: "Quadro diário", npcPng: null, frame: "#4ea8ff", short: `${t.progress}/${t.target}`,
      status: t.done ? "ready" : "active", progressText: `${t.progress}/${t.target}`, pct,
      desc: t.title,
      objectives: [{ label: t.title, progress: `${t.progress}/${t.target}` }],
      rewards: [{ img: crystalGreenImg, label: `x${t.reward}` }],
      action: t.done ? { label: "COLETAR", onClick: () => onClaimTask(t.id) } : null,
    });
  }

  // ---- Conquistas: pedidos resgatados + saga concluída ----
  const claimedSides = Object.keys(sq.claimedAt ?? {}).filter((id) => !(sq.accepted ?? []).includes(id));
  for (const id of claimedSides) {
    const q = SIDE_QUESTS.find((x: any) => x.id === id);
    if (!q) continue;
    entries.push({
      key: `done-${id}`, cat: "done", title: q.title,
      npcName: SAGA_NPCS[q.npc]?.name ?? q.npc,
      npcPng: npcPng[q.npc] ?? null, frame: "#22c55e", short: "Resgatado",
      status: "claimed", progressText: "✓", pct: 100,
      desc: q.desc ?? q.objectiveLabel,
      objectives: [{ label: q.objectiveLabel, progress: "✓" }],
      rewards: [{ emoji: "💎", label: `x${q.crystals}` }],
      action: null,
    });
  }
  if (sg.finished) {
    for (const n of sg.chosen ?? []) {
      entries.push({
        key: `done-saga-${n}`, cat: "done", title: `${SAGA_NPCS[n]?.name ?? n} ✦ preservado`,
        npcName: "Saga", npcPng: npcPng[n] ?? null, frame: "#22c55e", short: "Saga concluída",
        status: "claimed", progressText: "✓", pct: 100,
        desc: "Memória preservada na saga.",
        objectives: [{ label: "Saga concluída", progress: "✓" }],
        rewards: [],
        action: { label: "Conversar", onClick: () => onSagaTalk(n) },
      });
    }
  }

  const filtered = cat === "all" ? entries : entries.filter((e) => e.cat === cat || (cat === "done" && e.cat === "done"));
  const activeCount = entries.filter((e) => e.status === "active" || e.status === "ready").length;
  const sel = filtered.find((e) => e.key === selKey) ?? filtered[0] ?? null;

  const countFor = (id: string) => id === "all" ? entries.length : entries.filter((e) => e.cat === id).length;

  return (
    <div style={{
      maxWidth: 660, margin: "0 auto", fontFamily: '"Press Start 2P", monospace',
      imageRendering: "pixelated" as any, maxHeight: "72vh", display: "flex", flexDirection: "column",
    }}>
      {/* Capa: header */}
      <div style={{
        background: "linear-gradient(180deg,#ffe9a8 0%,#f5d06a 100%)",
        border: "4px solid #1a0f2a", borderRadius: "10px 10px 0 0",
        padding: "8px 10px", boxShadow: "inset 0 2px 0 rgba(255,255,255,0.7), 0 2px 0 #1a0f2a",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ fontSize: 13, fontWeight: 900, color: "#1a0f2a", letterSpacing: 1, textShadow: "1px 1px 0 #fff" }}>📖 MISSÕES</div>
        <button onClick={onClose} title="Fechar" style={{
          width: 26, height: 26, borderRadius: 6, background: "#e11d48", color: "#fff",
          border: "2px solid #1a0f2a", fontWeight: 900, fontSize: 12, cursor: "pointer",
          boxShadow: "2px 2px 0 #1a0f2a",
        }}>×</button>
      </div>

      {/* Corpo do livro */}
      <div style={{
        display: "grid", gridTemplateColumns: "118px 1fr 1.15fr",
        background: "#3a2415", border: "4px solid #1a0f2a", borderTop: "none",
        borderRadius: "0 0 10px 10px", overflow: "hidden",
        boxShadow: "0 4px 0 #1a0f2a", minHeight: 0, flex: 1,
      }}>
        {/* Lombada: categorias */}
        <div style={{
          background: "linear-gradient(180deg,#2a1a3a 0%,#1a0f2a 100%)",
          borderRight: "3px solid #f5cf6b", padding: 6,
          display: "flex", flexDirection: "column", gap: 4,
        }}>
          {CATS.map((c) => {
            const active = cat === c.id;
            return (
              <button key={c.id} onClick={() => { setCat(c.id); setSelKey(null); }} style={{
                display: "flex", alignItems: "center", gap: 6,
                background: active ? "#f5cf6b" : "rgba(255,255,255,0.06)",
                color: active ? "#1a0f2a" : "#fff",
                border: active ? "2px solid #1a0f2a" : "2px solid rgba(245,207,107,0.35)",
                borderRadius: 6, padding: "6px 6px", fontSize: 8, fontWeight: 900,
                cursor: "pointer", textAlign: "left",
                boxShadow: active ? "2px 2px 0 #1a0f2a" : "none",
              }}>
                <span style={{ fontSize: 12 }}>{c.icon}</span>
                <span style={{ flex: 1 }}>{c.label}</span>
                <span style={{
                  fontSize: 7, background: active ? "#1a0f2a" : "rgba(245,207,107,0.2)",
                  color: active ? "#f5cf6b" : "#ffe9a8", borderRadius: 999, padding: "1px 5px",
                }}>{countFor(c.id)}</span>
              </button>
            );
          })}
          <div style={{ marginTop: "auto", fontSize: 7, color: "#8a7a9c", textAlign: "center", lineHeight: 1.4 }}>
            {activeCount} ativa{activeCount !== 1 ? "s" : ""}
          </div>
        </div>

        {/* Página esquerda: lista */}
        <div style={{
          background: "#f5e6c4", padding: 8, overflowY: "auto", minHeight: 0,
          maxHeight: "60vh", display: "flex", flexDirection: "column", gap: 6,
          borderRight: "3px solid #8a6a3a",
          backgroundImage: "repeating-linear-gradient(0deg, transparent 0 22px, rgba(138,106,58,0.12) 22px 23px)",
        }}>
          {filtered.length === 0 && (
            <div style={{
              background: "#fff8dc", border: "3px dashed #8a6a3a", borderRadius: 8,
              padding: 14, textAlign: "center", fontSize: 9, color: "#5a4a6a", fontWeight: 700,
            }}>
              📖 Nenhuma missão aqui.<br />Fale com os NPCs para aceitar pedidos.
            </div>
          )}
          {filtered.map((e) => {
            const st = STATUS_META[e.status];
            const selected = sel?.key === e.key;
            return (
              <button key={e.key} onClick={() => setSelKey(e.key)} style={{
                display: "flex", gap: 6, alignItems: "center", textAlign: "left",
                background: selected ? "#3a2a4a" : "#fff8dc",
                border: selected ? "3px solid #f5cf6b" : "3px solid #1a0f2a",
                borderRadius: 8, padding: 6, cursor: "pointer",
                boxShadow: selected ? "0 0 10px rgba(245,207,107,0.5), 3px 3px 0 #1a0f2a" : "3px 3px 0 #1a0f2a",
                opacity: e.status === "locked" ? 0.75 : 1,
              }}>
                <span style={{
                  width: 40, height: 40, borderRadius: "50%", flexShrink: 0, overflow: "hidden",
                  background: "#0b0510", border: `2px solid ${selected ? "#f5cf6b" : e.frame}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {e.npcPng ? (
                    <span style={{
                      width: "100%", height: "100%", display: "block",
                      backgroundImage: `url(${e.npcPng})`, backgroundSize: "400% 400%",
                      backgroundPosition: "0% 0%", imageRendering: "pixelated",
                      filter: e.status === "locked" ? "grayscale(0.8)" : "none",
                    }} />
                  ) : (
                    <span style={{ fontSize: 16 }}>📜</span>
                  )}
                </span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: "block", color: selected ? "#ffe9a8" : "#1a0f2a", fontWeight: 900, fontSize: 9, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{e.title}</span>
                  <span style={{ display: "block", color: selected ? "#c9b8d0" : "#5a4a6a", fontSize: 8, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{e.npcName}</span>
                  <span style={{ display: "block", color: selected ? "#9db4d8" : "#8a7a9c", fontSize: 7, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{e.short}</span>
                </span>
                <span style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 2, flexShrink: 0 }}>
                  <span style={{
                    fontSize: 7, fontWeight: 900, padding: "2px 6px", borderRadius: 4,
                    background: st.bg, color: st.fg, border: "2px solid #1a0f2a",
                  }}>{st.label}</span>
                  <span style={{ color: selected ? "#f5cf6b" : "#8a6a3a", fontSize: 10 }}>›</span>
                </span>
              </button>
            );
          })}
        </div>

        {/* Página direita: detalhes */}
        <div style={{ background: "#f5e6c4", padding: 10, overflowY: "auto", minHeight: 0, maxHeight: "60vh" }}>
          {!sel ? (
            <div style={{ fontSize: 9, color: "#5a4a6a", textAlign: "center", paddingTop: 30 }}>
              Selecione uma missão 📖
            </div>
          ) : (
            <>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <span style={{
                  width: 52, height: 52, borderRadius: "50%", flexShrink: 0, overflow: "hidden",
                  background: "#0b0510", border: `3px solid ${sel.frame}`,
                  boxShadow: "0 0 0 2px #f5cf6b, 3px 3px 0 #1a0f2a",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {sel.npcPng ? (
                    <span style={{
                      width: "100%", height: "100%", display: "block",
                      backgroundImage: `url(${sel.npcPng})`, backgroundSize: "400% 400%",
                      backgroundPosition: "0% 0%", imageRendering: "pixelated",
                    }} />
                  ) : (
                    <span style={{ fontSize: 20 }}>📜</span>
                  )}
                </span>
                <span style={{ minWidth: 0 }}>
                  <span style={{ display: "block", color: "#1a0f2a", fontWeight: 900, fontSize: 12 }}>{sel.title}</span>
                  <span style={{ display: "block", color: "#5a4a6a", fontSize: 9, fontWeight: 700 }}>{sel.npcName}</span>
                </span>
              </div>

              <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 11 }}>📋</span>
                <span style={{ fontSize: 10, fontWeight: 900, color: "#1a0f2a" }}>Descrição</span>
                <span style={{ flex: 1, height: 2, background: "rgba(138,106,58,0.4)" }} />
              </div>
              <div style={{ fontSize: 9, color: "#3a2a1a", lineHeight: 1.5, marginTop: 4 }}>{sel.desc}</div>

              <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 11 }}>🎯</span>
                <span style={{ fontSize: 10, fontWeight: 900, color: "#1a0f2a" }}>Objetivos</span>
                <span style={{ flex: 1, height: 2, background: "rgba(138,106,58,0.4)" }} />
              </div>
              {sel.objectives.map((o, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", gap: 6, fontSize: 9, color: "#3a2a1a", marginTop: 4 }}>
                  <span>• {o.label}</span>
                  <span style={{ fontWeight: 900, whiteSpace: "nowrap" }}>{o.progress}</span>
                </div>
              ))}
              {sel.pct > 0 && (
                <div style={{ height: 10, background: "#1a0f2a", borderRadius: 999, padding: 1, marginTop: 6, border: "2px solid #1a0f2a" }}>
                  <div style={{ width: `${sel.pct}%`, height: "100%", background: "linear-gradient(90deg,#4ea8ff,#7ec4ff)", borderRadius: 999 }} />
                </div>
              )}

              <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 11 }}>🎁</span>
                <span style={{ fontSize: 10, fontWeight: 900, color: "#1a0f2a" }}>Recompensas</span>
                <span style={{ flex: 1, height: 2, background: "rgba(138,106,58,0.4)" }} />
              </div>
              <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                {sel.rewards.length === 0 && (
                  <span style={{ fontSize: 8, color: "#5a4a6a" }}>—</span>
                )}
                {sel.rewards.map((r, i) => (
                  <span key={i} style={{
                    display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
                    background: "#3a2a4a", border: "2px solid #1a0f2a", borderRadius: 8,
                    padding: "6px 4px", minWidth: 52,
                    boxShadow: "2px 2px 0 #1a0f2a",
                  }}>
                    {r.img ? (
                      <img src={r.img} alt="" style={{ width: 24, height: 24, imageRendering: "pixelated" }} />
                    ) : (
                      <span style={{ fontSize: 18 }}>{r.emoji ?? "🎁"}</span>
                    )}
                    <span style={{ fontSize: 8, fontWeight: 900, color: "#ffe9a8" }}>{r.label}</span>
                  </span>
                ))}
              </div>

              {sel.action && (
                <button onClick={sel.action.onClick} style={{
                  marginTop: 10, width: "100%",
                  background: "#1a0f2a", color: "#f5cf6b",
                  border: "3px solid #f5cf6b", borderRadius: 8, padding: "8px",
                  fontSize: 10, fontWeight: 900, letterSpacing: 1, cursor: "pointer",
                  boxShadow: "0 0 12px rgba(245,207,107,0.4), 3px 3px 0 #000",
                  fontFamily: "inherit",
                }}>
                  📍 {sel.action.label}
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
