import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { HEX_MAPS, HEX_RANKS, dwarfLineFor, readTrainerLevel, type HexMap, type HexRank } from "@/game/hexChampions";
import continentBg from "@/assets/hex/continent-bg-v2.jpg";
import sphereUnlocked from "@/assets/hex/sphere-unlocked.png";
import sphereLocked from "@/assets/hex/sphere-locked.png";
import dwarfNpc from "@/assets/hex/dwarf-explorer.png";
import ranksSheet from "@/assets/hex/ranks.png";

export const Route = createFileRoute("/hexchampions")({
  head: () => ({
    meta: [
      { title: "Hexagonal Champions — Templo do Governante" },
      { name: "description", content: "Continente endgame de obsidiana viva. Use Esferas de Alma para viajar entre mapas lendários." },
      { property: "og:title", content: "Hexagonal Champions — Continente Obsidiana" },
      { property: "og:description", content: "Obsidiana, cristais violetas, energia púrpura. AAA endgame." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HexChampionsPage,
});

// categorias para o tab-bar inferior (filtro puramente cosmético/visual)
type CategoryId = "all" | "cidades" | "templos" | "especiais" | "caminhos" | "runas";
const CATEGORIES: Array<{ id: CategoryId; label: string; icon: string; ids?: string[] }> = [
  { id: "all", label: "TODOS", icon: "◈" },
  { id: "cidades", label: "CIDADES", icon: "🏛", ids: ["citadel", "arena", "eternal_colosseum"] },
  { id: "templos", label: "TEMPLOS", icon: "⛩", ids: ["temple_infinity", "hall_legends", "ruby_sanctuary"] },
  { id: "especiais", label: "MAPAS ESPECIAIS", icon: "◇", ids: ["crystal_eclipse", "shadow_nexus", "ruby_throne"] },
  { id: "caminhos", label: "CAMINHOS ANTIGOS", icon: "✧", ids: ["crystal_valley", "obsidian_mine"] },
  { id: "runas", label: "RUNAS DE PODER", icon: "☾", ids: ["dragon_crown"] },
];

function RankIcon({ rank, size = 44 }: { rank: HexRank; size?: number }) {
  const idx = HEX_RANKS.findIndex((r) => r.id === rank);
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

// Painel ornado dourado-púrpura (reusa em todos os cantos)
function OrnatePanel({ children, style, title }: { children: React.ReactNode; style?: React.CSSProperties; title?: string }) {
  return (
    <div
      style={{
        position: "relative",
        background: "linear-gradient(180deg, rgba(20,8,36,0.92) 0%, rgba(8,3,18,0.94) 100%)",
        border: "1px solid rgba(200,150,80,0.45)",
        borderRadius: 6,
        padding: 14,
        boxShadow: "0 12px 40px rgba(0,0,0,0.65), inset 0 0 40px rgba(120,60,220,0.09), 0 0 0 1px rgba(255,215,120,0.08)",
        ...style,
      }}
    >
      {/* cantos ornados */}
      {[
        { top: -1, left: -1, borderTop: "2px solid #f0c96a", borderLeft: "2px solid #f0c96a" },
        { top: -1, right: -1, borderTop: "2px solid #f0c96a", borderRight: "2px solid #f0c96a" },
        { bottom: -1, left: -1, borderBottom: "2px solid #f0c96a", borderLeft: "2px solid #f0c96a" },
        { bottom: -1, right: -1, borderBottom: "2px solid #f0c96a", borderRight: "2px solid #f0c96a" },
      ].map((c, i) => (
        <span
          key={i}
          style={{
            position: "absolute", width: 14, height: 14, pointerEvents: "none",
            ...c,
          }}
        />
      ))}
      {title && (
        <div style={{
          textAlign: "center", fontSize: 11, letterSpacing: 4, color: "#f0c96a",
          fontWeight: 900, paddingBottom: 8, marginBottom: 10, borderBottom: "1px solid rgba(200,150,80,0.25)",
          textShadow: "0 0 10px rgba(240,201,106,0.4)",
        }}>
          {title}
        </div>
      )}
      {children}
    </div>
  );
}

function HexChampionsPage() {
  const [level, setLevel] = useState(0);
  const [selected, setSelected] = useState<HexMap | null>(null);
  const [showRanks, setShowRanks] = useState(false);
  const [cameraTarget, setCameraTarget] = useState<{ x: number; y: number } | null>(null);
  const [category, setCategory] = useState<CategoryId>("all");

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

  // Esferas de Alma: 1 esfera a cada 1000 níveis acima de 9000 (cap 99)
  const soulSpheres = Math.max(0, Math.min(99, Math.floor((level - 9000) / 1000)));

  // filtro por categoria
  const visibleMaps = useMemo(() => {
    if (category === "all") return HEX_MAPS;
    const cat = CATEGORIES.find((c) => c.id === category);
    if (!cat?.ids) return HEX_MAPS;
    const set = new Set(cat.ids);
    return HEX_MAPS.filter((m) => set.has(m.id));
  }, [category]);
  const visibleIds = useMemo(() => new Set(visibleMaps.map((m) => m.id)), [visibleMaps]);

  const cameraStyle: React.CSSProperties = cameraTarget
    ? {
        transform: `translate(${(50 - cameraTarget.x) * 0.55}%, ${(50 - cameraTarget.y) * 0.55}%) scale(1.18)`,
        transition: "transform 1.1s cubic-bezier(.2,.7,.2,1)",
      }
    : { transform: "translate(0,0) scale(1)", transition: "transform 1.1s cubic-bezier(.2,.7,.2,1)" };

  return (
    <div style={styles.page}>
      {/* fundo do continente + vinheta */}
      <div style={{ ...styles.continent, ...cameraStyle }}>
        <img src={continentBg} alt="Templo do Governante" style={styles.continentImg} />
        <div style={styles.mist} />
        <div style={{ ...styles.mist, animationDelay: "-8s", opacity: 0.5 }} />
      </div>
      <div style={styles.vignette} />

      {/* conexões SVG */}
      <svg style={styles.connections} viewBox="0 0 100 100" preserveAspectRatio="none">
        <defs>
          <linearGradient id="conn" x1="0" x2="1">
            <stop offset="0%" stopColor="#7a3cff" stopOpacity="0.15" />
            <stop offset="50%" stopColor="#e0a4ff" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#7a3cff" stopOpacity="0.15" />
          </linearGradient>
        </defs>
        {HEX_MAPS.flatMap((m) =>
          m.connections
            .filter((cid) => cid > m.id && mapById.has(cid))
            .map((cid) => {
              const t = mapById.get(cid)!;
              const active = unlocked(m) && unlocked(t);
              const dim = !(visibleIds.has(m.id) && visibleIds.has(t.id));
              return (
                <line
                  key={`${m.id}-${cid}`}
                  x1={m.x} y1={m.y} x2={t.x} y2={t.y}
                  stroke={active ? "url(#conn)" : "rgba(120,60,180,0.35)"}
                  strokeWidth={active ? 0.32 : 0.18}
                  strokeDasharray={active ? "0" : "0.8 0.8"}
                  opacity={dim ? 0.15 : 1}
                  style={{ filter: active ? "drop-shadow(0 0 4px #c58bff)" : "none" }}
                />
              );
            })
        )}
      </svg>

      {/* esferas hexagonais */}
      {HEX_MAPS.map((m) => {
        const u = unlocked(m);
        const visible = visibleIds.has(m.id);
        return (
          <button
            key={m.id}
            onClick={() => setSelected(m)}
            style={{
              ...styles.sphere,
              left: `${m.x}%`,
              top: `${m.y}%`,
              filter: u ? "drop-shadow(0 0 16px #c58bff)" : "grayscale(1) brightness(0.55)",
              opacity: visible ? 1 : 0.25,
              zIndex: visible ? 5 : 2,
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

      {/* ===== TÍTULO TOP-LEFT ===== */}
      <div style={{ position: "absolute", top: 22, left: 22, width: 340, zIndex: 10 }}>
        <OrnatePanel>
          <div style={{ fontSize: 10, letterSpacing: 6, color: "#c8a6ff", fontWeight: 700, textAlign: "left" }}>
            TERCEIRO CONTINENTE
          </div>
          <div style={{
            fontSize: 34, lineHeight: 1, fontWeight: 900, letterSpacing: 3, color: "#f0c96a",
            marginTop: 6, textShadow: "0 0 24px rgba(240,201,106,0.55), 0 2px 0 rgba(0,0,0,0.6)",
            fontFamily: "'Georgia', serif",
          }}>
            HEXAGONAL<br />CHAMPIONS
          </div>
          <div style={{ height: 1, background: "linear-gradient(90deg, transparent, #f0c96a, transparent)", margin: "12px 0" }} />
          <p style={{ fontSize: 12, lineHeight: 1.55, color: "#c8b8d8", margin: 0 }}>
            Este continente foi transformado em Obsidiana viva pelo poder do Governante do Rubi. Use as{" "}
            <b style={{ color: "#c58bff" }}>Esferas de Alma</b> para viajar entre mapas e descobrir seus segredos.
          </p>
        </OrnatePanel>
      </div>

      {/* ===== ESFERAS DE ALMA TOP-RIGHT ===== */}
      <div style={{ position: "absolute", top: 22, right: 22, width: 220, zIndex: 10 }}>
        <OrnatePanel title="ESFERAS DE ALMA">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 14, marginTop: 2 }}>
            <div style={styles.soulOrb} className="hex-float">
              <div style={styles.soulOrbCore} />
            </div>
            <div style={{ fontSize: 36, fontWeight: 900, color: "#e6d3ff", textShadow: "0 0 14px #c58bff" }}>
              {soulSpheres}
            </div>
          </div>
          <div style={{ fontSize: 10, color: "#a89bc0", textAlign: "center", marginTop: 10, lineHeight: 1.5 }}>
            Use Esferas de Alma para se teleportar para mapas desbloqueados.
          </div>
          <button
            style={{
              marginTop: 10, width: "100%", padding: "6px 10px",
              background: "linear-gradient(180deg, rgba(60,30,90,0.9), rgba(30,12,50,0.9))",
              border: "1px solid #7a5aa8", borderRadius: 4, color: "#e6d3ff",
              fontSize: 10, fontWeight: 900, letterSpacing: 2, cursor: "pointer",
            }}
            onClick={() => alert("Ganhe 1 Esfera a cada 1.000 níveis acima de Lv 9.000. Ou drop raro em bosses.")}
          >
            COMO OBTER
          </button>
        </OrnatePanel>
      </div>

      {/* ===== LEGENDA + BÚSSOLA BOTTOM-LEFT ===== */}
      <div style={{ position: "absolute", left: 22, bottom: 90, width: 220, zIndex: 10 }}>
        <OrnatePanel title="LEGENDA">
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[
              { icon: "◆", color: "#c58bff", label: "Mapa Desbloqueado" },
              { icon: "◇", color: "#6a5a80", label: "Mapa Bloqueado" },
              { icon: "✦", color: "#ffd76a", label: "Mapas Especiais" },
              { icon: "●", color: "#4be29b", label: "Você está aqui" },
            ].map((r) => (
              <div key={r.label} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 11, color: "#c8b8d8" }}>
                <span style={{ color: r.color, fontSize: 16, textShadow: `0 0 6px ${r.color}` }}>{r.icon}</span>
                {r.label}
              </div>
            ))}
          </div>
        </OrnatePanel>
        {/* bússola */}
        <div style={{ marginTop: 12, textAlign: "center" }}>
          <div style={styles.compassOuter} className="compass-spin">
            <div style={styles.compassInner}>
              <span style={{ position: "absolute", top: 6, left: "50%", transform: "translateX(-50%)", fontSize: 12, color: "#f0c96a", fontWeight: 900 }}>N</span>
              <div style={styles.compassArrow} />
            </div>
          </div>
        </div>
      </div>

      {/* ===== TELEPORTE RÁPIDO RIGHT SIDEBAR ===== */}
      <div style={{ position: "absolute", right: 22, top: 220, bottom: 220, width: 300, zIndex: 10, display: "flex", flexDirection: "column" }}>
        <OrnatePanel title="TELEPORTE RÁPIDO" style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ overflowY: "auto", display: "flex", flexDirection: "column", gap: 4, flex: 1, paddingRight: 4 }}>
            {HEX_MAPS.map((m) => {
              const u = unlocked(m);
              const rank = HEX_RANKS.find((r) => r.id === m.rank)!;
              const cost = Math.max(1, Math.ceil((m.minLevel - 9000) / 5000));
              return (
                <button
                  key={m.id}
                  onClick={() => {
                    setCameraTarget({ x: m.x, y: m.y });
                    setTimeout(() => setSelected(m), 650);
                  }}
                  style={{ ...styles.teleportRow, opacity: u ? 1 : 0.55 }}
                >
                  <RankIcon rank={m.rank} size={26} />
                  <div style={{ flex: 1, textAlign: "left", minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 800, color: u ? "#e6d3ff" : "#8a7ba0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {m.name}
                    </div>
                    <div style={{ fontSize: 9, color: rank.color, letterSpacing: 1, fontWeight: 700 }}>
                      {rank.name.toUpperCase()} · LV {m.minLevel.toLocaleString()}
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <div style={styles.soulOrbMini} />
                    <span style={{ fontSize: 11, fontWeight: 900, color: u ? "#c58bff" : "#5a4a70" }}>{cost}</span>
                  </div>
                </button>
              );
            })}
          </div>
          <button
            onClick={() => setShowRanks(true)}
            style={{
              marginTop: 8, padding: "8px 10px",
              background: "linear-gradient(180deg, rgba(240,201,106,0.9), rgba(160,120,40,0.9))",
              border: "1px solid #f0c96a", borderRadius: 4, color: "#1a0e00",
              fontSize: 11, fontWeight: 900, letterSpacing: 2, cursor: "pointer",
            }}
          >
            VER RANKS
          </button>
        </OrnatePanel>
      </div>

      {/* ===== MISSÃO DIÁRIA BOTTOM-RIGHT ===== */}
      <div style={{ position: "absolute", right: 22, bottom: 90, width: 300, zIndex: 10 }}>
        <OrnatePanel title="MISSÃO DIÁRIA">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
            <div style={{ fontSize: 12, color: "#c8b8d8", lineHeight: 1.4 }}>
              Complete 3 masmorras<br />neste continente
            </div>
            <div style={{ fontSize: 16, fontWeight: 900, color: "#f0c96a", background: "rgba(30,15,50,0.7)", border: "1px solid #7a5a20", padding: "6px 12px", borderRadius: 4 }}>
              0/3
            </div>
          </div>
          <div style={{ height: 1, background: "linear-gradient(90deg, transparent, rgba(240,201,106,0.4), transparent)", margin: "10px 0" }} />
          <div style={{ fontSize: 10, letterSpacing: 3, color: "#f0c96a", fontWeight: 900, textAlign: "center", marginBottom: 8 }}>
            RECOMPENSA
          </div>
          <div style={{ display: "flex", justifyContent: "center", gap: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={styles.soulOrbMini} />
              <span style={{ fontSize: 13, fontWeight: 900, color: "#c58bff" }}>50</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 14 }}>🪙</span>
              <span style={{ fontSize: 13, fontWeight: 900, color: "#f0c96a" }}>1000</span>
            </div>
          </div>
        </OrnatePanel>
      </div>

      {/* ===== TAB BAR INFERIOR (filtros) ===== */}
      <div style={styles.bottomTabWrap}>
        <div style={styles.bottomTabBar}>
          {CATEGORIES.map((c) => {
            const active = category === c.id;
            return (
              <button
                key={c.id}
                onClick={() => setCategory(c.id)}
                style={{
                  ...styles.tabBtn,
                  color: active ? "#f0c96a" : "#8a7ba0",
                  textShadow: active ? "0 0 10px rgba(240,201,106,0.6)" : "none",
                  borderBottom: active ? "2px solid #f0c96a" : "2px solid transparent",
                }}
              >
                <span style={{ fontSize: 16 }}>{c.icon}</span>
                <span style={{ fontSize: 10, letterSpacing: 2, fontWeight: 900 }}>{c.label}</span>
              </button>
            );
          })}
        </div>
        <div style={styles.helperRow}>
          <span>◆ Arraste a câmera pelos destinos.</span>
          <span>Clique em um destino para viajar.</span>
          <span style={{ color: "#c58bff" }}>Esferas de Alma são consumidas ao teleportar.</span>
        </div>
      </div>

      {/* ===== HUD topo: nível + voltar ===== */}
      <div style={styles.topbar}>
        <Link to="/idle" style={styles.backBtn}>◀ VOLTAR</Link>
        <div style={styles.levelChip}>
          <span style={{ opacity: 0.7, fontSize: 10, letterSpacing: 2 }}>SEU NÍVEL</span>
          <span style={{ fontSize: 20, fontWeight: 900, color: "#f0c96a" }}>{level.toLocaleString()}</span>
        </div>
      </div>

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
                <p style={styles.modalTrivia}>"{selected.trivia}"</p>
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
                  {selected.rewards.map((p) => <span key={p} style={{ ...styles.chip, borderColor: "#f0c96a", color: "#f0c96a" }}>{p}</span>)}
                </div>
              </div>
            </div>

            <div style={styles.modalFooter}>
              {!unlocked(selected) && (
                <div style={styles.dwarfBox}>
                  <img src={dwarfNpc} alt="Anão Explorador" style={styles.dwarfImg} />
                  <div style={styles.dwarfBubble}>
                    <div style={styles.dwarfName}>Bornik, o Explorador</div>
                    <div style={styles.dwarfLine}>"{dwarfLineFor(selected.id)}"</div>
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
                    ? "linear-gradient(180deg,#c58bff 0%, #6a2fbf 100%)"
                    : "linear-gradient(180deg,#3a3350 0%, #241a30 100%)",
                }}
                onClick={() => {
                  if (unlocked(selected)) alert("Portal ainda em ativação. Em breve você poderá atravessar!");
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
        @keyframes spinCompass { from { transform: rotate(0deg);} to { transform: rotate(360deg);} }
        @keyframes pulseSoft { 0%,100% { filter: grayscale(1) brightness(.55) drop-shadow(0 0 0 transparent);} 50% { filter: grayscale(.7) brightness(.75) drop-shadow(0 0 10px #7a3cff);} }
        @keyframes mistDrift { 0% { transform: translateX(-10%);} 100% { transform: translateX(10%);} }
        @keyframes rubyPulse { 0%,100% { box-shadow: inset 0 0 60px #ff3b5822, 0 0 30px #ff3b5866;} 50% { box-shadow: inset 0 0 80px #ff3b5844, 0 0 60px #ff3b58aa;} }
        @keyframes soulPulse { 0%,100% { box-shadow: 0 0 20px #c58bff, inset 0 0 20px #7a3cff;} 50% { box-shadow: 0 0 40px #e0a4ff, inset 0 0 30px #c58bff;} }
        .hex-float { animation: floatY 4.2s ease-in-out infinite; }
        .hex-float img { animation: spinSlow 24s linear infinite; }
        .hex-pulse { animation: pulseSoft 3.4s ease-in-out infinite; }
        .hex-pulse:hover { animation-duration: 1.4s; }
        .ruby-pulse { animation: rubyPulse 2.6s ease-in-out infinite; }
        .compass-spin > div { animation: spinCompass 40s linear infinite; }
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
    width: "100%", height: "100%", objectFit: "cover", opacity: 0.95,
  } as React.CSSProperties,
  vignette: {
    position: "absolute", inset: 0, pointerEvents: "none",
    background: "radial-gradient(ellipse at center, transparent 40%, rgba(5,1,15,0.85) 100%)",
    zIndex: 1,
  } as React.CSSProperties,
  mist: {
    position: "absolute", inset: 0, pointerEvents: "none",
    background: "radial-gradient(ellipse at 30% 40%, rgba(150,90,255,.15), transparent 60%), radial-gradient(ellipse at 70% 70%, rgba(255,60,120,.08), transparent 60%)",
    animation: "mistDrift 16s ease-in-out infinite alternate",
  } as React.CSSProperties,
  connections: {
    position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 3,
  } as React.CSSProperties,
  sphere: {
    position: "absolute", transform: "translate(-50%,-50%)",
    width: 96, height: 96, background: "transparent", border: 0, padding: 0,
    cursor: "pointer", transition: "opacity 0.4s ease",
  } as React.CSSProperties,
  sphereImg: { width: "100%", height: "100%", display: "block" } as React.CSSProperties,
  sphereLabel: {
    position: "absolute", top: "100%", left: "50%", transform: "translateX(-50%)",
    marginTop: 4, background: "rgba(10,4,20,.9)", border: "1px solid #4a2a70",
    padding: "4px 8px", borderRadius: 4, whiteSpace: "nowrap", fontSize: 11,
    display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
    boxShadow: "0 4px 12px rgba(0,0,0,.6)",
  } as React.CSSProperties,
  sphereLevel: { fontSize: 10, color: "#c8a8ff", fontWeight: 700 } as React.CSSProperties,

  topbar: {
    position: "absolute", top: 22, left: "50%", transform: "translateX(-50%)",
    display: "flex", alignItems: "center", gap: 14, zIndex: 11,
  } as React.CSSProperties,
  backBtn: {
    color: "#f0c96a", textDecoration: "none", fontSize: 11, fontWeight: 900,
    padding: "8px 16px", border: "1px solid #7a5a20", borderRadius: 4,
    background: "rgba(20,10,4,.8)", letterSpacing: 3,
  } as React.CSSProperties,
  levelChip: {
    display: "flex", flexDirection: "column", alignItems: "center",
    padding: "6px 16px", border: "1px solid #7a5a20", borderRadius: 4,
    background: "rgba(20,10,4,.8)",
  } as React.CSSProperties,

  // orbs
  soulOrb: {
    width: 60, height: 60, borderRadius: "50%",
    background: "radial-gradient(circle at 35% 30%, #f0d6ff, #c58bff 40%, #4a1a80 100%)",
    boxShadow: "0 0 30px #c58bff, inset 0 0 20px #7a3cff",
    animation: "soulPulse 3s ease-in-out infinite",
    position: "relative",
  } as React.CSSProperties,
  soulOrbCore: {
    position: "absolute", top: "20%", left: "25%", width: "30%", height: "20%",
    background: "rgba(255,255,255,0.6)", borderRadius: "50%", filter: "blur(4px)",
  } as React.CSSProperties,
  soulOrbMini: {
    width: 14, height: 14, borderRadius: "50%",
    background: "radial-gradient(circle at 35% 30%, #f0d6ff, #c58bff 50%, #4a1a80)",
    boxShadow: "0 0 8px #c58bff",
  } as React.CSSProperties,

  // teleport list rows
  teleportRow: {
    display: "flex", alignItems: "center", gap: 10, padding: "8px 10px",
    background: "rgba(30,15,50,.55)", border: "1px solid rgba(120,80,170,0.35)",
    borderRadius: 4, cursor: "pointer", color: "#fff", textAlign: "left",
    transition: "background 0.15s",
  } as React.CSSProperties,

  // compass
  compassOuter: {
    width: 96, height: 96, borderRadius: "50%",
    border: "2px solid #7a5a20", background: "radial-gradient(circle, rgba(20,8,36,0.85), rgba(8,3,18,0.95))",
    display: "inline-flex", alignItems: "center", justifyContent: "center",
    boxShadow: "0 0 20px rgba(240,201,106,0.25), inset 0 0 20px rgba(120,60,220,0.3)",
    position: "relative",
  } as React.CSSProperties,
  compassInner: {
    width: 84, height: 84, borderRadius: "50%", border: "1px dashed rgba(200,150,80,0.4)",
    position: "relative", display: "flex", alignItems: "center", justifyContent: "center",
  } as React.CSSProperties,
  compassArrow: {
    width: 0, height: 0, borderLeft: "8px solid transparent", borderRight: "8px solid transparent",
    borderBottom: "34px solid #f0c96a", filter: "drop-shadow(0 0 6px #f0c96a)",
  } as React.CSSProperties,

  // bottom tabs
  bottomTabWrap: {
    position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 10,
    display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
    background: "linear-gradient(180deg, transparent, rgba(5,1,15,0.9) 60%)",
    paddingBottom: 12,
  } as React.CSSProperties,
  bottomTabBar: {
    display: "flex", gap: 4, padding: "8px 14px",
    background: "linear-gradient(180deg, rgba(20,8,36,0.9), rgba(8,3,18,0.95))",
    border: "1px solid rgba(200,150,80,0.4)", borderRadius: 6,
    boxShadow: "0 -4px 30px rgba(120,60,220,0.15), 0 0 0 1px rgba(255,215,120,0.06)",
  } as React.CSSProperties,
  tabBtn: {
    display: "flex", alignItems: "center", gap: 8,
    padding: "8px 16px", background: "transparent", border: 0, cursor: "pointer",
    transition: "color 0.15s",
  } as React.CSSProperties,
  helperRow: {
    display: "flex", gap: 18, fontSize: 10, color: "#8a7ba0", letterSpacing: 1,
    marginTop: 4,
  } as React.CSSProperties,

  // MODAL styles (mesmos de antes)
  modalBackdrop: {
    position: "fixed", inset: 0, background: "rgba(0,0,0,.85)",
    display: "flex", alignItems: "center", justifyContent: "center",
    zIndex: 100, backdropFilter: "blur(6px)",
  } as React.CSSProperties,
  modal: {
    width: "min(1100px, 94vw)", maxHeight: "92vh", overflowY: "auto",
    background: "linear-gradient(180deg, #120720 0%, #050110 100%)",
    border: "2px solid transparent",
    borderImage: "linear-gradient(135deg, #f0c96a, #7a3cff, #ff3b58) 1",
    borderRadius: 8, boxShadow: "0 30px 80px rgba(0,0,0,.9), 0 0 60px rgba(180,120,255,.3)",
  } as React.CSSProperties,
  modalBanner: { width: "100%", height: 320, objectFit: "cover", display: "block" } as React.CSSProperties,
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
  modalSubtitle: { fontSize: 12, color: "#c8a8ff", letterSpacing: 3, marginTop: 2 } as React.CSSProperties,
  modalBody: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, padding: 20 } as React.CSSProperties,
  modalCol: { display: "flex", flexDirection: "column", gap: 8 } as React.CSSProperties,
  sectionLabel: {
    fontSize: 10, letterSpacing: 3, color: "#f0c96a", fontWeight: 900,
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
  dwarfName: { fontSize: 12, fontWeight: 900, color: "#f0c96a", letterSpacing: 1 } as React.CSSProperties,
  dwarfLine: { fontSize: 13, color: "#e0d4f0", fontStyle: "italic", marginTop: 4, lineHeight: 1.5 } as React.CSSProperties,
  dwarfHint: { fontSize: 11, color: "#ff8fa3", marginTop: 6, fontWeight: 700 } as React.CSSProperties,
  enterBtn: {
    padding: "14px 22px", fontSize: 15, fontWeight: 900, letterSpacing: 2,
    color: "#fff", border: "1px solid #c58bff", borderRadius: 4,
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
