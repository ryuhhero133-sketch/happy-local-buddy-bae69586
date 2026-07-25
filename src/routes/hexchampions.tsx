import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { HEX_MAPS, HEX_RANKS, dwarfLineFor, readTrainerLevel, type HexMap, type HexRank } from "@/game/hexChampions";
import continentBg from "@/assets/hex/continent-bg.jpg";
import sphereUnlocked from "@/assets/hex/sphere-unlocked.png";
import sphereLocked from "@/assets/hex/sphere-locked.png";
import dwarfNpc from "@/assets/hex/dwarf-explorer.png";
import ranksSheet from "@/assets/hex/ranks.png";

export const Route = createFileRoute("/hexchampions")({
  head: () => ({
    meta: [
      { title: "Hexagonal Champions — IDLE MON" },
      { name: "description", content: "O continente endgame dos campeões: esferas hexagonais flutuantes, rank Mastery Ruby, mapas lendários." },
      { property: "og:title", content: "Hexagonal Champions — IDLE MON" },
      { property: "og:description", content: "Obsidiana, cristais, energia roxa. O continente mais memorável do jogo." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HexChampionsPage,
});

// ícone de rank recortado do spritesheet horizontal (6 slots)
function RankIcon({ rank, size = 44 }: { rank: HexRank; size?: number }) {
  const idx = HEX_RANKS.findIndex((r) => r.id === rank); // 0..4, sheet tem 6 slots => usamos 0..4 + shift
  // sheet gerado com 6 medalhas horizontais; mapeamos 5 ranks para slots 0,1,2,3,5 (o 4 é decorativo)
  const slot = idx === 4 ? 5 : idx;
  const slots = 6;
  return (
    <div
      style={{
        width: size, height: size,
        backgroundImage: `url(${ranksSheet})`,
        backgroundSize: `${slots * 100}% 100%`,
        backgroundPosition: `${(slot / (slots - 1)) * 100}% 50%`,
        backgroundRepeat: "no-repeat",
        filter: rank === "ruby" ? "drop-shadow(0 0 10px #ff3b58)" : "drop-shadow(0 0 6px rgba(180,120,255,.6))",
      }}
    />
  );
}

function HexChampionsPage() {
  const [level, setLevel] = useState(0);
  const [selected, setSelected] = useState<HexMap | null>(null);
  const [showRanks, setShowRanks] = useState(false);
  const [cameraTarget, setCameraTarget] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => { setLevel(readTrainerLevel()); }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (selected) setSelected(null);
        else if (showRanks) setShowRanks(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected, showRanks]);

  const mapById = useMemo(() => {
    const m = new Map<string, HexMap>();
    for (const x of HEX_MAPS) m.set(x.id, x);
    return m;
  }, []);

  const unlocked = (m: HexMap) => level >= m.minLevel;

  const cameraStyle: React.CSSProperties = cameraTarget
    ? {
        transform: `translate(${(50 - cameraTarget.x) * 0.6}%, ${(50 - cameraTarget.y) * 0.6}%) scale(1.15)`,
        transition: "transform 1.1s cubic-bezier(.2,.7,.2,1)",
      }
    : { transform: "translate(0,0) scale(1)", transition: "transform 1.1s cubic-bezier(.2,.7,.2,1)" };

  return (
    <div style={styles.page}>
      {/* fundo do continente */}
      <div style={{ ...styles.continent, ...cameraStyle }}>
        <img src={continentBg} alt="Hexagonal Champions" style={styles.continentImg} />

        {/* névoa animada */}
        <div style={styles.mist} />
        <div style={{ ...styles.mist, animationDelay: "-8s", opacity: 0.5 }} />

        {/* conexões SVG entre esferas */}
        <svg style={styles.connections} viewBox="0 0 100 100" preserveAspectRatio="none">
          <defs>
            <linearGradient id="conn" x1="0" x2="1">
              <stop offset="0%" stopColor="#7a3cff" stopOpacity="0.1" />
              <stop offset="50%" stopColor="#c084ff" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#7a3cff" stopOpacity="0.1" />
            </linearGradient>
            <linearGradient id="connDim" x1="0" x2="1">
              <stop offset="0%" stopColor="#2a1240" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#2a1240" stopOpacity="0.3" />
            </linearGradient>
          </defs>
          {HEX_MAPS.flatMap((m) =>
            m.connections
              .filter((cid) => cid > m.id && mapById.has(cid))
              .map((cid) => {
                const t = mapById.get(cid)!;
                const active = unlocked(m) && unlocked(t);
                return (
                  <line
                    key={`${m.id}-${cid}`}
                    x1={m.x} y1={m.y} x2={t.x} y2={t.y}
                    stroke={active ? "url(#conn)" : "url(#connDim)"}
                    strokeWidth={active ? 0.35 : 0.2}
                    strokeDasharray={active ? "0" : "0.8 0.8"}
                    style={{ filter: active ? "drop-shadow(0 0 4px #b06bff)" : "none" }}
                  />
                );
              })
          )}
        </svg>

        {/* esferas */}
        {HEX_MAPS.map((m) => {
          const u = unlocked(m);
          return (
            <button
              key={m.id}
              onClick={() => setSelected(m)}
              style={{
                ...styles.sphere,
                left: `${m.x}%`,
                top: `${m.y}%`,
                filter: u ? "drop-shadow(0 0 14px #b06bff)" : "grayscale(1) brightness(0.55)",
              }}
              className={u ? "hex-float" : "hex-pulse"}
              title={m.name}
            >
              <img src={u ? sphereUnlocked : sphereLocked} alt={m.name} style={styles.sphereImg} />
              <div style={styles.sphereLabel}>
                <span style={{ opacity: u ? 1 : 0.6 }}>{m.name}</span>
                <span style={styles.sphereLevel}>
                  {u ? `Lv ${m.minLevel.toLocaleString()}+` : `🔒 Lv ${m.minLevel.toLocaleString()}`}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* HUD topo */}
      <div style={styles.topbar}>
        <Link to="/idle" style={styles.backBtn}>◀ Voltar ao jogo</Link>
        <div style={styles.title}>
          <span style={styles.titleMain}>HEXAGONAL CHAMPIONS</span>
          <span style={styles.titleSub}>Continente Endgame • Rank Mastery Ruby</span>
        </div>
        <div style={styles.levelChip}>
          <span style={{ opacity: 0.7, fontSize: 11 }}>SEU NÍVEL</span>
          <span style={{ fontSize: 20, fontWeight: 900, color: "#ffd76a" }}>{level.toLocaleString()}</span>
        </div>
      </div>

      {/* painel lateral: teleporte / rede hexagonal */}
      <aside style={styles.sidePanel}>
        <div style={styles.panelHeader}>
          <span>◈ REDE HEXAGONAL</span>
          <button onClick={() => setShowRanks(true)} style={styles.rankButton}>RANKS</button>
        </div>
        <div style={styles.mapList}>
          {HEX_MAPS.map((m) => {
            const u = unlocked(m);
            const rank = HEX_RANKS.find((r) => r.id === m.rank)!;
            return (
              <button
                key={m.id}
                onClick={() => {
                  setCameraTarget({ x: m.x, y: m.y });
                  setTimeout(() => setSelected(m), 700);
                }}
                style={{ ...styles.mapRow, opacity: u ? 1 : 0.6 }}
              >
                <RankIcon rank={m.rank} size={26} />
                <div style={{ flex: 1, textAlign: "left" }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: u ? "#fff" : "#a89bc0" }}>{m.name}</div>
                  <div style={{ fontSize: 10, opacity: 0.7, color: rank.color }}>
                    {rank.name.toUpperCase()} • Lv {m.minLevel.toLocaleString()}
                  </div>
                </div>
                <span style={{ color: u ? "#4be29b" : "#ff6b8a", fontSize: 10, fontWeight: 700 }}>
                  {u ? "◉ ABERTO" : "🔒"}
                </span>
              </button>
            );
          })}
        </div>
      </aside>

      {/* MODAL cinematográfico */}
      {selected && (
        <div style={styles.modalBackdrop} onClick={() => setSelected(null)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={{ position: "relative" }}>
              <img src={selected.banner} alt={selected.name} style={styles.modalBanner} />
              <div style={styles.modalBannerFade} />
              <button style={styles.modalClose} onClick={() => setSelected(null)}>✕ ESC</button>
              <div style={styles.modalTitleWrap}>
                <RankIcon rank={selected.rank} size={54} />
                <div>
                  <div style={styles.modalTitle}>{selected.name}</div>
                  <div style={styles.modalSubtitle}>
                    {HEX_RANKS.find((r) => r.id === selected.rank)?.name.toUpperCase()} • Nível recomendado {selected.minLevel.toLocaleString()}+
                  </div>
                </div>
              </div>
            </div>

            <div style={styles.modalBody}>
              <div style={styles.modalCol}>
                <div style={styles.sectionLabel}>◈ HISTÓRIA</div>
                <p style={styles.modalStory}>{selected.story}</p>
                <div style={styles.sectionLabel}>◈ CURIOSIDADE</div>
                <p style={styles.modalTrivia}>“{selected.trivia}”</p>
              </div>

              <div style={styles.modalCol}>
                <div style={styles.sectionLabel}>👑 BOSS</div>
                <div style={styles.boss}>{selected.boss}</div>

                <div style={styles.sectionLabel}>⚔ POKÉMON</div>
                <div style={styles.chips}>
                  {selected.pokemons.map((p) => <span key={p} style={styles.chip}>{p}</span>)}
                </div>

                <div style={styles.sectionLabel}>💠 DROPS</div>
                <div style={styles.chips}>
                  {selected.drops.map((p) => <span key={p} style={{ ...styles.chip, borderColor: "#7a3cff" }}>{p}</span>)}
                </div>

                <div style={styles.sectionLabel}>🏆 RECOMPENSAS</div>
                <div style={styles.chips}>
                  {selected.rewards.map((p) => <span key={p} style={{ ...styles.chip, borderColor: "#ffd76a", color: "#ffd76a" }}>{p}</span>)}
                </div>
              </div>
            </div>

            {/* rodapé: NPC + botão */}
            <div style={styles.modalFooter}>
              {!unlocked(selected) && (
                <div style={styles.dwarfBox}>
                  <img src={dwarfNpc} alt="Anão Explorador" style={styles.dwarfImg} />
                  <div style={styles.dwarfBubble}>
                    <div style={styles.dwarfName}>Bornik, o Explorador</div>
                    <div style={styles.dwarfLine}>“{dwarfLineFor(selected.id)}”</div>
                    <div style={styles.dwarfHint}>Falta {(selected.minLevel - level).toLocaleString()} níveis.</div>
                  </div>
                </div>
              )}
              <button
                disabled={!unlocked(selected)}
                style={{
                  ...styles.enterBtn,
                  opacity: unlocked(selected) ? 1 : 0.4,
                  cursor: unlocked(selected) ? "pointer" : "not-allowed",
                  background: unlocked(selected)
                    ? "linear-gradient(180deg,#b06bff 0%, #6a2fbf 100%)"
                    : "linear-gradient(180deg,#3a3350 0%, #241a30 100%)",
                }}
                onClick={() => {
                  if (unlocked(selected)) {
                    // gancho para futura navegação real
                    alert("Portal ainda em ativação. Em breve você poderá atravessar!");
                  }
                }}
              >
                {unlocked(selected) ? "ENTRAR NO PORTAL ▶" : "Seu poder ainda não é suficiente para atravessar este portal."}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL Ranks */}
      {showRanks && (
        <div style={styles.modalBackdrop} onClick={() => setShowRanks(false)}>
          <div style={{ ...styles.modal, maxWidth: 980 }} onClick={(e) => e.stopPropagation()}>
            <div style={styles.rankHeader}>
              <div style={styles.modalTitle}>SISTEMA DE RANKS</div>
              <button style={styles.modalClose} onClick={() => setShowRanks(false)}>✕ ESC</button>
            </div>
            <div style={styles.rankGrid}>
              {HEX_RANKS.map((r) => (
                <div
                  key={r.id}
                  style={{
                    ...styles.rankCard,
                    boxShadow: `inset 0 0 60px ${r.glow}22, 0 0 26px ${r.color}55`,
                    borderColor: r.color,
                  }}
                  className={r.id === "ruby" ? "ruby-pulse" : ""}
                >
                  <RankIcon rank={r.id} size={72} />
                  <div style={{ fontSize: 20, fontWeight: 900, color: r.color, marginTop: 8, letterSpacing: 1 }}>
                    {r.name.toUpperCase()}
                  </div>
                  <div style={{ fontSize: 11, opacity: 0.85, marginTop: 6, lineHeight: 1.4 }}>{r.desc}</div>
                  <div style={styles.rankRow}><span>REQ</span><b>Lv {r.minLevel.toLocaleString()}+</b></div>
                  <div style={styles.rankRow}><span>RECOMPENSAS</span></div>
                  <div style={{ fontSize: 10, opacity: 0.8, textAlign: "center", marginTop: 4 }}>{r.rewards}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes floatY { 0%,100% { transform: translate(-50%,-50%) translateY(0px);} 50% { transform: translate(-50%,-50%) translateY(-8px);} }
        @keyframes spinSlow { from { transform: rotate(0deg);} to { transform: rotate(360deg);} }
        @keyframes pulseSoft { 0%,100% { filter: grayscale(1) brightness(.55) drop-shadow(0 0 0 transparent);} 50% { filter: grayscale(.7) brightness(.75) drop-shadow(0 0 10px #7a3cff);} }
        @keyframes mistDrift { 0% { transform: translateX(-10%);} 100% { transform: translateX(10%);} }
        @keyframes rubyPulse { 0%,100% { box-shadow: inset 0 0 60px #ff3b5822, 0 0 30px #ff3b5866;} 50% { box-shadow: inset 0 0 80px #ff3b5844, 0 0 60px #ff3b58aa;} }
        .hex-float { animation: floatY 4.2s ease-in-out infinite; }
        .hex-float img { animation: spinSlow 24s linear infinite; }
        .hex-pulse { animation: pulseSoft 3.4s ease-in-out infinite; }
        .hex-pulse:hover { animation-duration: 1.4s; }
        .ruby-pulse { animation: rubyPulse 2.6s ease-in-out infinite; }
      `}</style>
    </div>
  );
}

const styles = {
  page: {
    position: "fixed", inset: 0, background: "#05010a", color: "#f2ecff",
    overflow: "hidden", fontFamily: "system-ui, sans-serif",
  } as React.CSSProperties,
  continent: {
    position: "absolute", inset: 0, transformOrigin: "50% 50%",
  } as React.CSSProperties,
  continentImg: {
    width: "100%", height: "100%", objectFit: "cover", opacity: 0.9,
  } as React.CSSProperties,
  mist: {
    position: "absolute", inset: 0, pointerEvents: "none",
    background: "radial-gradient(ellipse at 30% 40%, rgba(150,90,255,.18), transparent 60%), radial-gradient(ellipse at 70% 70%, rgba(255,60,120,.10), transparent 60%)",
    animation: "mistDrift 16s ease-in-out infinite alternate",
  } as React.CSSProperties,
  connections: {
    position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none",
  } as React.CSSProperties,
  sphere: {
    position: "absolute", transform: "translate(-50%,-50%)",
    width: 108, height: 108, background: "transparent", border: 0, padding: 0,
    cursor: "pointer",
  } as React.CSSProperties,
  sphereImg: {
    width: "100%", height: "100%", display: "block",
  } as React.CSSProperties,
  sphereLabel: {
    position: "absolute", top: "100%", left: "50%", transform: "translateX(-50%)",
    marginTop: 4, background: "rgba(10,4,20,.85)", border: "1px solid #4a2a70",
    padding: "4px 8px", borderRadius: 4, whiteSpace: "nowrap", fontSize: 11,
    display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
    boxShadow: "0 4px 12px rgba(0,0,0,.6)",
  } as React.CSSProperties,
  sphereLevel: {
    fontSize: 10, color: "#c8a8ff", fontWeight: 700,
  } as React.CSSProperties,
  topbar: {
    position: "absolute", top: 0, left: 0, right: 0, padding: "10px 16px",
    display: "flex", alignItems: "center", justifyContent: "space-between",
    background: "linear-gradient(180deg, rgba(5,1,15,.9), rgba(5,1,15,0))",
    zIndex: 10,
  } as React.CSSProperties,
  backBtn: {
    color: "#f4c04a", textDecoration: "none", fontSize: 13, fontWeight: 700,
    padding: "6px 12px", border: "1px solid #7a5a20", borderRadius: 4,
    background: "rgba(20,10,4,.6)",
  } as React.CSSProperties,
  title: { textAlign: "center", display: "flex", flexDirection: "column", gap: 2 } as React.CSSProperties,
  titleMain: {
    fontSize: 22, fontWeight: 900, letterSpacing: 3, color: "#e6d3ff",
    textShadow: "0 0 18px rgba(180,120,255,.7)",
  } as React.CSSProperties,
  titleSub: { fontSize: 10, letterSpacing: 4, color: "#b48fff", opacity: 0.9 } as React.CSSProperties,
  levelChip: {
    display: "flex", flexDirection: "column", alignItems: "flex-end",
    padding: "6px 12px", border: "1px solid #7a5a20", borderRadius: 4,
    background: "rgba(20,10,4,.7)",
  } as React.CSSProperties,
  sidePanel: {
    position: "absolute", right: 12, top: 70, bottom: 12, width: 290,
    background: "linear-gradient(180deg, rgba(15,5,30,.94), rgba(8,2,18,.94))",
    border: "1px solid #4a2a70", borderRadius: 6, padding: 10,
    display: "flex", flexDirection: "column", gap: 8, zIndex: 10,
    boxShadow: "0 10px 40px rgba(0,0,0,.7), inset 0 0 40px rgba(120,60,220,.08)",
  } as React.CSSProperties,
  panelHeader: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    fontSize: 12, fontWeight: 900, letterSpacing: 2, color: "#e6d3ff",
    paddingBottom: 6, borderBottom: "1px solid #4a2a70",
  } as React.CSSProperties,
  rankButton: {
    background: "linear-gradient(180deg,#ffd76a,#a37812)", color: "#1a0e00",
    border: 0, padding: "4px 10px", borderRadius: 3, fontWeight: 900,
    fontSize: 10, cursor: "pointer", letterSpacing: 1,
  } as React.CSSProperties,
  mapList: { display: "flex", flexDirection: "column", gap: 4, overflowY: "auto", flex: 1 } as React.CSSProperties,
  mapRow: {
    display: "flex", alignItems: "center", gap: 8, padding: "6px 8px",
    background: "rgba(30,15,50,.6)", border: "1px solid #3a2a60",
    borderRadius: 4, cursor: "pointer", color: "#fff",
  } as React.CSSProperties,
  modalBackdrop: {
    position: "fixed", inset: 0, background: "rgba(0,0,0,.82)",
    display: "flex", alignItems: "center", justifyContent: "center",
    zIndex: 100, backdropFilter: "blur(6px)",
  } as React.CSSProperties,
  modal: {
    width: "min(1100px, 94vw)", maxHeight: "92vh", overflowY: "auto",
    background: "linear-gradient(180deg, #120720 0%, #050110 100%)",
    border: "2px solid transparent",
    borderImage: "linear-gradient(135deg, #ffd76a, #7a3cff, #ff3b58) 1",
    borderRadius: 8, boxShadow: "0 30px 80px rgba(0,0,0,.9), 0 0 60px rgba(180,120,255,.3)",
  } as React.CSSProperties,
  modalBanner: {
    width: "100%", height: 320, objectFit: "cover", display: "block",
  } as React.CSSProperties,
  modalBannerFade: {
    position: "absolute", inset: 0,
    background: "linear-gradient(180deg, rgba(0,0,0,.0) 40%, #050110 100%)",
    pointerEvents: "none",
  } as React.CSSProperties,
  modalClose: {
    position: "absolute", top: 10, right: 10, background: "rgba(0,0,0,.7)",
    color: "#fff", border: "1px solid #7a3cff", padding: "4px 10px",
    borderRadius: 4, cursor: "pointer", fontSize: 11, fontWeight: 700,
  } as React.CSSProperties,
  modalTitleWrap: {
    position: "absolute", bottom: 16, left: 20, display: "flex",
    alignItems: "center", gap: 14,
  } as React.CSSProperties,
  modalTitle: {
    fontSize: 34, fontWeight: 900, letterSpacing: 2, color: "#fff",
    textShadow: "0 4px 24px rgba(0,0,0,.9), 0 0 20px rgba(180,120,255,.7)",
  } as React.CSSProperties,
  modalSubtitle: {
    fontSize: 12, color: "#c8a8ff", letterSpacing: 3, marginTop: 2,
  } as React.CSSProperties,
  modalBody: {
    display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, padding: 20,
  } as React.CSSProperties,
  modalCol: { display: "flex", flexDirection: "column", gap: 8 } as React.CSSProperties,
  sectionLabel: {
    fontSize: 10, letterSpacing: 3, color: "#ffd76a", fontWeight: 900,
    marginTop: 8, borderBottom: "1px solid #4a2a70", paddingBottom: 4,
  } as React.CSSProperties,
  modalStory: { fontSize: 13, lineHeight: 1.55, color: "#e0d4f0", margin: 0 } as React.CSSProperties,
  modalTrivia: { fontSize: 12, fontStyle: "italic", color: "#b48fff", margin: 0 } as React.CSSProperties,
  boss: { fontSize: 18, fontWeight: 900, color: "#ff8fa3", textShadow: "0 0 12px rgba(255,60,120,.6)" } as React.CSSProperties,
  chips: { display: "flex", flexWrap: "wrap", gap: 6 } as React.CSSProperties,
  chip: {
    fontSize: 11, padding: "4px 10px", background: "rgba(120,60,220,.15)",
    border: "1px solid #4a2a70", borderRadius: 3, color: "#e6d3ff",
  } as React.CSSProperties,
  modalFooter: {
    padding: 20, borderTop: "1px solid #3a2a60", display: "flex",
    flexDirection: "column", gap: 14,
  } as React.CSSProperties,
  dwarfBox: {
    display: "flex", gap: 14, alignItems: "flex-start",
    background: "rgba(30,15,50,.5)", border: "1px solid #4a2a70",
    borderRadius: 6, padding: 12,
  } as React.CSSProperties,
  dwarfImg: { width: 96, height: 96, objectFit: "contain", flexShrink: 0 } as React.CSSProperties,
  dwarfBubble: { flex: 1 } as React.CSSProperties,
  dwarfName: { fontSize: 12, fontWeight: 900, color: "#ffd76a", letterSpacing: 1 } as React.CSSProperties,
  dwarfLine: { fontSize: 13, color: "#e0d4f0", fontStyle: "italic", marginTop: 4, lineHeight: 1.5 } as React.CSSProperties,
  dwarfHint: { fontSize: 11, color: "#ff8fa3", marginTop: 6, fontWeight: 700 } as React.CSSProperties,
  enterBtn: {
    padding: "14px 22px", fontSize: 15, fontWeight: 900, letterSpacing: 2,
    color: "#fff", border: "1px solid #b06bff", borderRadius: 4,
    textShadow: "0 2px 6px rgba(0,0,0,.6)",
    boxShadow: "0 6px 20px rgba(120,60,220,.4)",
  } as React.CSSProperties,
  rankHeader: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: 20, borderBottom: "1px solid #4a2a70", position: "relative",
  } as React.CSSProperties,
  rankGrid: {
    display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: 14, padding: 20,
  } as React.CSSProperties,
  rankCard: {
    background: "linear-gradient(180deg, rgba(30,15,50,.9), rgba(10,5,20,.9))",
    border: "2px solid", borderRadius: 6, padding: 14,
    display: "flex", flexDirection: "column", alignItems: "center",
    textAlign: "center",
  } as React.CSSProperties,
  rankRow: {
    display: "flex", justifyContent: "space-between", width: "100%",
    fontSize: 11, marginTop: 8, opacity: 0.85, borderTop: "1px dashed #4a2a70",
    paddingTop: 6,
  } as React.CSSProperties,
};
