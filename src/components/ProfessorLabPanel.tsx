// Painel do Professor do Laboratório — HUD estilo Pokédex (inspirado no anexo):
// chapa preta central, strip -TYPE-, coluna -AREA- (continentes), dossiê em papel,
// barras de stats laranja e radar cyan com PODER. Só visualização: nenhum Pokémon
// é adicionado à coleção por aqui. Missões: 3 diálogos → quests com progresso real.
import { useEffect, useMemo, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import { RARITY_COLOR, RARITY_NAME, SPECIES_BASE, type Rarity, type Species } from "@/game/systems";
import { DEX, TYPE_COLOR, TYPE_ICON, type PokeType } from "@/game/movesets";
import { ELEMENT_META, SPECIES_ELEMENTS, type Element as PokeElement } from "@/game/synergies";
import {
  PROF_QUESTS,
  PROF_MAPS,
  profQuestDone,
  profQuestProgress,
  type ProfQuestCtx,
  type ProfQuestId,
  type ProfQuestState,
} from "@/components/professorLabData";
import {
  ANCESTRAL_ENTRIES,
  EGG_NOTE,
  GLOBAL_GOLD_NOTE,
  TIER_META,
  UNIVERSAL_BONUS,
  eggNameFor,
  type AncestralEntry,
} from "@/components/ancestralEncyclopedia";
import {
  SPIRIT_RULES,
  patenteOf,
  patentePrizeReady,
  patentePrizeLabel,
  spiritStateOf,
  vipTierOf,
  type SpiritLogEntry,
  type VipBookId,
} from "@/game/trainerProfile";
import { HATCH_MS, FED_CAP } from "@/game/ancestralEggs";
import eggSeladoUrl from "@/ambiente/Egg selado ancestral.png";
import eggPlusUrl from "@/ambiente/Egg Ancestral Plus.png";
import eggLuckUrl from "@/ambiente/Egg Ancestral Luck.png";
import bauAncUrl from "@/assets/chest-emerald.png";
import { BookArt, PatenteCrown, SpiritWings } from "@/components/trainerProfileArt";
import {
  BOATS,
  BOAT_BY_TIER,
  BOAT_DIR_FLIP_Y,
  BOAT_DIR_ROW,
  BOAT_FRAMES,
  BOAT_SHEET,
  BOAT_SHEET_URL,
  BOAT_SHOP_ICON,
  BOAT_TIER_META,
  OIL_ICON,
  OIL_ITEM,
  OIL_PRICE_GOLD,
  SUCATA_URL,
  WATER_FX,
  WHIRL_BIG,
  WHIRL_FX,
  boatFrameStyle,
  maxFuelOf,
  maxHpOf,
  stripStyle,
  type BoatTier,
  type ShipState,
} from "@/game/ships";

// ============ Mapas do UPDATE (aba MAPAS) — sem ouro, 10⚡ por entrada ============
const MAP_TAGS = "SEM OURO · 10⚡ POR ENTRADA · SEM NÍVEL";

// ============ Incubadora — slots de imagem (coloque suas imgs em IMG abaixo) ============
const IMG: Record<string, string> = {
  egg_common: "",
  egg_epic: "",
  egg_black: "",
  egg_card: "",
};

const INCUB_SLOTS = [
  {
    key: "egg_common",
    icon: "🥚",
    name: "OVOS COMUNS",
    desc: "Chocam com o tempo na incubadora. Até 6 ovos simultâneos por treinador.",
  },
  {
    key: "egg_epic",
    icon: "✨",
    name: "OVOS ÉPICOS & MÍTICOS",
    desc: "Mais tempo de chocagem, recompensas muito melhores nas nascentes.",
  },
  {
    key: "egg_black",
    icon: "🖤",
    name: "BLACK MITIC PLUS",
    desc: "Nasce com 7 traits. Uma troca única com o Governante (Carta da Incubadora).",
  },
  {
    key: "egg_card",
    icon: "🔮",
    name: "CARTA DA INCUBADORA",
    desc: "Entregue ao Governante no Salão e receba 1 Black Mitic Plus Egg.",
  },
];

// ============ Helpers visuais ============
const cut = (px = 14): CSSProperties => ({
  clipPath: `polygon(${px}px 0, 100% 0, 100% calc(100% - ${px}px), calc(100% - ${px}px) 100%, 0 100%, 0 ${px}px)`,
});

const CYAN = "#35e0ff";
const MONO = '"Pixelify Sans", ui-monospace, "Cascadia Mono", monospace';

const rColor = (r: Rarity): string => {
  const v = RARITY_COLOR[r] ?? "#c8b8d0";
  return v.includes("gradient") ? "#f59e0b" : v;
};

const displayName = (sp: string): string => sp.replace(/_/g, " ").toUpperCase();

const BoatBtn = ({
  label, color, onClick, disabled, wide,
}: { label: string; color: string; onClick: () => void; disabled?: boolean; wide?: boolean }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    style={{
      flex: wide ? undefined : "1 1 auto",
      width: wide ? "100%" : undefined,
      marginTop: wide ? 10 : 0,
      padding: "8px 12px",
      cursor: disabled ? "not-allowed" : "pointer",
      fontWeight: 900,
      fontSize: 10,
      letterSpacing: 1,
      fontFamily: MONO,
      color: disabled ? "#5f4a3a" : "#1a0c04",
      background: disabled ? "rgba(80,55,35,0.4)" : color,
      border: `1px solid ${disabled ? "#5f4a3a" : color}`,
      boxShadow: disabled ? "none" : `0 0 14px ${color}88`,
      opacity: disabled ? 0.7 : 1,
    }}
  >
    {label}
  </button>
);

const Section = ({ title, color, children }: { title: string; color: string; children: ReactNode }) => (
  <div style={{ marginTop: 16 }}>
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        color,
        fontSize: 10,
        fontWeight: 900,
        letterSpacing: 2,
        fontFamily: MONO,
        marginBottom: 7,
      }}
    >
      <span style={{ width: 3, height: 12, background: color, boxShadow: `0 0 8px ${color}` }} />
      {title}
    </div>
    {children}
  </div>
);

const STRIP_POWER: Record<string, string> = {
  Baixo: "#8ba0b2",
  Médio: "#7ee6ff",
  Alto: "#ffd94d",
  "Muito Alto": "#ff9558",
  Extremo: "#ff5a5a",
  Suporte: "#7ef2a2",
};

type LabTab = "pesquisa" | "missoes" | "continentes" | "barcos" | "vip" | "perfil" | "incubadora" | "ancestral";

type Props = {
  onClose: () => void;
  gifMap: Partial<Record<Species, string>>;
  professorImg: string;
  quest?: ProfQuestState;
  kills: number;
  captures: number;
  vipActive: boolean;
  vipUntil: number;
  /** Cristais do jogador — moeda da LOJA VIP (aba VIP). */
  crystals?: number;
  /** Compra e ativa um Livro VIP na hora (deduz cristais; efeito igual ao item). */
  onBuyVipBook?: (id: VipBookId) => void;
  onAcceptQuest: (id: ProfQuestId) => void;
  onClaimQuest: () => void;
  /** Viaja para um mapa do UPDATE (instantâneo; 10⚡ de energia após desbloquear). */
  onTravel: (mapId: string) => void;
  /** Loja de barcos da Jornada dos Navegantes. */
  ship?: ShipState;
  gold?: number;
  pepitas?: number;
  oil?: number;
  /** Pontos de sucata da corrida, total no banco e caixas na mochila. */
  scrapPoints?: number;
  scrapBank?: number;
  scrapBag?: number;
  /** Nível do treinador (para desbloqueio de mapas por nível). */
  trainerLevel?: number;
  /** Pokédex: a aba PESQUISA só lista o que já foi capturado ou avistado. */
  caughtSpecies?: string[];
  seenSpecies?: string[];
  /** Coleção com timestamp — missões de shiny exigem captura após o aceite. */
  collection?: { species: string; capturedAt: number }[];
  /** ===== PERFIL DE TREINADOR (aba PERFIL) — tudo derivado de save real ===== */
  trainerXp?: number;
  trainerXpNext?: number;
  trainerName?: string;
  avatarUrl?: string | null;
  /** Bônus VIP ativo (fração de goldMult: 0.20/0.30/0.40 dos livros). */
  vipMult?: number;
  /** Pontuação espiritual -100..+100 (só eventos de trainerProfile.ts). */
  spiritScore?: number;
  spiritLog?: SpiritLogEntry[];
  /** Missões concluídas por origem (para a patente). */
  questsProf?: number;
  questsSide?: number;
  questsSaga?: number;
  sagaFinished?: boolean;
  goldTotal?: number;
  startedAt?: number;
  onBuyBoat: (tier: BoatTier) => void;
  onBuyOil: (qty: number) => void;
  onRefuel: () => void;
  onRepair: () => void;
  /** Converte todas as sucatas da mochila em pontos (1 sucata = 1 ponto). */
  onConvertScrap: () => void;
  // ═══ EGG SELADO ANCESTRAL (aba ANCESTRAL) ═══
  sealedEgg?: { kind: string; entryId: string; species: string; sealedAt: number; fed: number } | null;
  /** Esferas de Safira na mochila (alimento do ovo). */
  esferas?: number;
  /** Quantidade dos 3 ovos ancestrais na mochila. */
  ancEggCounts?: { selado: number; plus: number; luck: number };
  /** Sela o ancestral (itemId do ovo, entryId da enciclopédia). */
  onSealAncestral: (itemId: string, entryId: string) => void;
  /** Alimenta o ovo — n Esferas de Safira por clique (padrão 1). */
  onFeedSealedEgg: (n?: number) => void;
  onHatchSealedEgg: () => void;
  /** Tickets Ancestrais (🎫 única moeda do Baú — item concedido pelo admin). */
  tickets?: number;
  onBuyAncChest?: () => void;
  /** Aba inicial ao abrir o painel (ovo selado → "ancestral"). */
  initialTab?: LabTab;
  /** Timestamp do último prêmio de 7 dias da patente resgatado. */
  patentePrizeAt?: number;
  /** Resgata o prêmio de 7 dias da patente atual. */
  onClaimPatentePrize?: () => void;
};

export function ProfessorLabPanel(props: Props) {
  const {
    onClose, gifMap, professorImg, quest, kills, captures,
    ship, gold, pepitas, oil, scrapPoints, scrapBank, scrapBag, trainerLevel,
    caughtSpecies, seenSpecies, collection,
    trainerXp, trainerXpNext, trainerName, avatarUrl, vipMult,
    spiritScore, spiritLog, questsProf, questsSide, questsSaga, sagaFinished,
    goldTotal, startedAt,
    onBuyBoat, onBuyOil, onRefuel, onRepair, onConvertScrap,
    sealedEgg, esferas, ancEggCounts, onSealAncestral, onFeedSealedEgg, onHatchSealedEgg,
    tickets, onBuyAncChest, initialTab,
    patentePrizeAt, onClaimPatentePrize,
    crystals, onBuyVipBook,
  } = props;
  const scrapCarryPts = scrapPoints ?? 0;
  const scrapBankPts = scrapBank ?? 0;
  const scrapBagN = scrapBag ?? 0;
  const [tab, setTab] = useState<LabTab>(initialTab ?? "pesquisa");
  const [query, setQuery] = useState("");
  const [ancestralOpen, setAncestralOpen] = useState<AncestralEntry | null>(null);
  const [elemFilter, setElemFilter] = useState<PokeElement | null>(null);
  const [sel, setSel] = useState<Species>("charizard");

  const all = useMemo(() => Object.keys(SPECIES_BASE) as Species[], []);
  const dexNo = useMemo(() => {
    const m = new Map<string, number>();
    all.forEach((sp, i) => m.set(sp, i + 1));
    return m;
  }, [all]);

  // Só o que já está no Pokédex: capturado (tem) ou avistado (viu).
  const known = useMemo(
    () => new Set<string>([...(caughtSpecies ?? []), ...(seenSpecies ?? [])]),
    [caughtSpecies, seenSpecies],
  );

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return all.filter((sp) => {
      if (!known.has(sp)) return false;
      if (
        elemFilter &&
        !(SPECIES_ELEMENTS[sp] ?? (["normal"] as PokeElement[])).includes(elemFilter)
      )
        return false;
      if (!q) return true;
      const name = sp
        .replace(/_/g, " ")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
      const qq = q.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      return name.includes(qq);
    });
  }, [all, known, query, elemFilter]);

  // Se a espécie selecionada saiu do recorte do Pokédex, volta para a primeira.
  useEffect(() => {
    if (list.length && !list.includes(sel)) setSel(list[0]);
  }, [list, sel]);

  // Relógio do Ovo Selado (3 dias) — atualiza a 30s para o countdown/progresso.
  const [nowMs, setNowMs] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNowMs(Date.now()), 30_000);
    return () => clearInterval(t);
  }, []);

  const base = SPECIES_BASE[sel];
  const dex = DEX[sel];
  const types: PokeType[] = dex?.types ?? ["Normal"];
  const elements: PokeElement[] = SPECIES_ELEMENTS[sel] ?? ["normal"];
  const mainEl: PokeElement = elements[0] ?? "normal";
  const power = base.hp + base.atk + base.def + base.spa + base.spd + base.spe;
  const moves = dex?.moves ?? [];
  const moveList: { name: string; icon: string; power: string; desc: string }[] =
    moves.length > 0 ? moves : [{ name: "—", icon: "❔", power: "Baixo", desc: "Sem dados" }];
  const idx = dexNo.get(sel) ?? 1;
  const img = gifMap[sel];

  const cycle = (dir: 1 | -1) => {
    const pool = list.length ? list : all;
    const i = pool.indexOf(sel);
    const n = pool[(i + dir + pool.length) % pool.length];
    if (n) setSel(n);
  };

  const TABS = [
    { id: "pesquisa", label: "PESQUISA", icon: "🔬" },
    { id: "missoes", label: "MISSÕES", icon: "📜" },
    { id: "continentes", label: "MAPAS", icon: "🗺️" },
    { id: "barcos", label: "BARCO", icon: "⛵" },
    { id: "vip", label: "VIP", icon: "👑" },
    { id: "perfil", label: "PERFIL", icon: "🎖️" },
    { id: "incubadora", label: "INCUBADORA", icon: "🥚" },
    { id: "ancestral", label: "ANCESTRAL", icon: "💠" },
  ] as const;

  const activeDef = quest?.active ? PROF_QUESTS.find((x) => x.id === quest.active) : undefined;
  // Contexto único de progresso das missões (kills/caps/nível/shiny pós-aceite).
  const capturedSince = (species: string, since: number) =>
    (collection ?? []).some(
      (e) => String(e.species) === species && (e.capturedAt ?? 0) >= since,
    );
  const questCtx: ProfQuestCtx = {
    kills,
    captures,
    level: trainerLevel ?? 1,
    capturedSince,
  };
  const done = profQuestDone(quest, questCtx);
  const activeCur = activeDef ? profQuestProgress(activeDef, quest, questCtx) : 0;
  const completedList = quest?.completed ?? [];

  // ===== PERFIL DE TREINADOR — tudo abaixo é DERIVADO (nada é gravado por UI) =====
  const vipInfo = vipTierOf(props.vipMult, props.vipUntil);
  const spiritInfo = spiritStateOf(spiritScore ?? 0);
  const questTotal = (questsProf ?? 0) + (questsSide ?? 0) + (questsSaga ?? 0);
  const patenteInfo = patenteOf({
    level: trainerLevel ?? 1,
    quests: questTotal,
    kills,
    caught: (caughtSpecies ?? []).length,
    profDone: questsProf ?? 0,
    profTotal: PROF_QUESTS.length,
    sagaFinished: sagaFinished ?? false,
  });
  const xpPct = Math.max(
    0,
    Math.min(100, Math.round(((trainerXp ?? 0) / Math.max(1, trainerXpNext ?? 1)) * 100)),
  );
  const journeyDays = startedAt ? Math.max(1, Math.floor((Date.now() - startedAt) / 86400000)) : 1;
  const spiritPos = Math.max(0, Math.min(100, Math.round((((spiritScore ?? 0) + 100) / 200) * 100)));
  const statTile = (icon: string, label: string, value: string, color: string) => (
    <div
      key={label}
      style={{
        ...cut(10),
        background: "rgba(0,0,0,0.4)",
        border: `1px solid ${color}55`,
        padding: "10px 8px",
        textAlign: "center",
        minWidth: 0,
      }}
    >
      <div style={{ fontSize: 16 }}>{icon}</div>
      <div style={{ color, fontSize: 14, fontWeight: 900, fontFamily: MONO, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis" }}>{value}</div>
      <div style={{ color: "#8ba0b2", fontSize: 8.5, letterSpacing: 1, fontFamily: MONO, marginTop: 2 }}>{label}</div>
    </div>
  );

  const TAB_BTN = (active: boolean, id?: string): CSSProperties => {
    const isAnc = id === "ancestral";
    const isPerf = id === "perfil";
    const on = isAnc ? "#c98cff" : isPerf ? "#ffd94d" : CYAN;
    const glow = isAnc ? "rgba(201,140,255,0.75)" : isPerf ? "rgba(255,217,77,0.7)" : "rgba(53,224,255,0.55)";
    const border = isAnc ? "rgba(201,140,255,0.65)" : isPerf ? "rgba(255,217,77,0.6)" : "rgba(53,224,255,0.35)";
    return {
      padding: "6px 14px",
      cursor: "pointer",
      fontWeight: 900,
      fontSize: 11,
      letterSpacing: 1,
      color: active
        ? isAnc ? "#12002a" : isPerf ? "#241a00" : "#04141a"
        : isAnc ? "#e0c6ff" : isPerf ? "#ffe9a3" : "#9ad9ef",
      background: active ? on : isAnc ? "rgba(201,140,255,0.12)" : isPerf ? "rgba(255,217,77,0.1)" : "rgba(53,224,255,0.07)",
      border: `1px solid ${active ? on : border}`,
      boxShadow: active
        ? `0 0 16px ${glow}`
        : isAnc ? "0 0 7px rgba(201,140,255,0.3)" : isPerf ? "0 0 7px rgba(255,217,77,0.25)" : "none",
      fontFamily: MONO,
    };
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 10060,
        background: "radial-gradient(circle at 50% 40%, rgba(6,24,32,0.88), rgba(0,0,0,0.94))",
        display: "grid",
        placeItems: "center",
        padding: 12,
      }}
    >
      <style>{`
        @keyframes profSpin { to { transform: rotate(360deg); } }
        @keyframes profScan { 0% { transform: translateY(-110%);} 100% { transform: translateY(110%);} }
        @keyframes profGlow { 0%,100% { box-shadow: 0 0 16px rgba(53,224,255,0.45);} 50% { box-shadow: 0 0 30px rgba(53,224,255,0.85);} }
        .profScroll::-webkit-scrollbar { width: 8px; height: 8px; }
        .profScroll::-webkit-scrollbar-track { background: rgba(53,224,255,0.06); }
        .profScroll::-webkit-scrollbar-thumb { background: rgba(53,224,255,0.4); border-radius: 4px; }
      `}</style>

      {/* ===== SHELL (moldura cyan chanfrada) ===== */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          ...cut(18),
          background: `linear-gradient(160deg, ${CYAN}, #0a5f78 60%, ${CYAN})`,
          padding: 2,
          width: "min(1120px, 96vw)",
          height: "min(700px, 93vh)",
          display: "flex",
          filter: "drop-shadow(0 0 26px rgba(53,224,255,0.35))",
        }}
      >
        <div
          className="profScroll"
          style={{
            ...cut(17),
            background: "linear-gradient(180deg, #0c1116 0%, #0a0e12 100%)",
            flex: 1,
            display: "flex",
            flexDirection: "column",
            minWidth: 0,
            overflow: "hidden",
          }}
        >
          {/* ===== HEADER ===== */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr auto 1fr",
              alignItems: "center",
              gap: 8,
              padding: "8px 12px 4px",
            }}
          >
            <div style={{ display: "flex", gap: 6, minWidth: 0 }}>
              <span
                style={{
                  ...cut(6),
                  background: "rgba(53,224,255,0.12)",
                  border: `1px solid rgba(53,224,255,0.5)`,
                  color: CYAN,
                  fontSize: 9,
                  fontWeight: 900,
                  letterSpacing: 1,
                  padding: "3px 8px",
                  fontFamily: MONO,
                  whiteSpace: "nowrap",
                }}
              >
                -AREA- LAB
              </span>
              <span
                style={{
                  ...cut(6),
                  background: "rgba(255,170,60,0.1)",
                  border: "1px solid rgba(255,170,60,0.5)",
                  color: "#ffb14d",
                  fontSize: 9,
                  fontWeight: 900,
                  letterSpacing: 1,
                  padding: "3px 8px",
                  fontFamily: MONO,
                  whiteSpace: "nowrap",
                }}
              >
                RM-2026
              </span>
            </div>

            {/* Chapa central preta estilo anexo */}
            <div
              style={{
                background: "#000",
                border: `2px solid ${CYAN}`,
                boxShadow: `0 0 18px rgba(53,224,255,0.5), inset 0 0 12px rgba(53,224,255,0.25)`,
                padding: "5px 26px",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  color: "#fff",
                  fontWeight: 900,
                  fontSize: 20,
                  letterSpacing: 6,
                  fontFamily: MONO,
                  lineHeight: 1,
                }}
              >
                LAB. POKÉDEX
              </div>
              <div style={{ color: CYAN, fontSize: 8, letterSpacing: 3, fontFamily: MONO }}>
                PROF. CARVALHO · LABORATÓRIO
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                onClick={onClose}
                title="Fechar"
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: "50%",
                  background: "#b91c1c",
                  border: "2px solid #fff",
                  color: "#fff",
                  fontWeight: 900,
                  fontSize: 13,
                  cursor: "pointer",
                  display: "grid",
                  placeItems: "center",
                  boxShadow: "0 0 10px rgba(185,28,28,0.7)",
                }}
              >
                ✕
              </button>
            </div>
          </div>

          {/* ===== STRIP -TYPE- (filtro por elemento) ===== */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "4px 12px 6px",
              borderBottom: "1px solid rgba(53,224,255,0.25)",
              overflowX: "auto",
            }}
          >
            <span
              style={{
                background: "#000",
                border: `1px solid ${CYAN}`,
                color: CYAN,
                fontSize: 9,
                fontWeight: 900,
                letterSpacing: 1,
                padding: "2px 8px",
                fontFamily: MONO,
                flexShrink: 0,
              }}
            >
              -TYPE-
            </span>
            {(Object.keys(ELEMENT_META) as PokeElement[]).map((el) => {
              const m = ELEMENT_META[el];
              const active = elemFilter === el;
              return (
                <button
                  key={el}
                  onClick={() => setElemFilter(active ? null : el)}
                  title={`Filtrar ${m.label}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 3,
                    padding: "2px 7px",
                    fontSize: 9,
                    fontWeight: 900,
                    fontFamily: MONO,
                    letterSpacing: 0.5,
                    whiteSpace: "nowrap",
                    cursor: "pointer",
                    color: active ? "#04141a" : m.color,
                    background: active ? m.color : "rgba(255,255,255,0.04)",
                    border: `1px solid ${active ? m.color : "rgba(255,255,255,0.14)"}`,
                    boxShadow: active ? `0 0 10px ${m.color}88` : "none",
                  }}
                >
                  <span>{m.emoji}</span>
                  {m.label}
                </button>
              );
            })}
            {elemFilter && (
              <button
                onClick={() => setElemFilter(null)}
                style={{
                  padding: "2px 7px",
                  fontSize: 9,
                  fontWeight: 900,
                  fontFamily: MONO,
                  cursor: "pointer",
                  color: "#ff9558",
                  background: "rgba(255,90,90,0.12)",
                  border: "1px solid rgba(255,90,90,0.5)",
                  flexShrink: 0,
                }}
              >
                LIMPAR ✕
              </button>
            )}
          </div>

          {/* ===== TABS ===== */}
          <div style={{ display: "flex", gap: 6, padding: "8px 12px", flexWrap: "wrap" }}>
            {TABS.map((t) => (
              <button key={t.id} onClick={() => setTab(t.id)} style={TAB_BTN(tab === t.id, t.id)}>
                {t.icon} {t.label}
                {t.id === "missoes" && quest?.active && !done && (
                  <span
                    style={{
                      marginLeft: 6,
                      color: "#04141a",
                      background: "#ffd94d",
                      borderRadius: 8,
                      padding: "0 5px",
                      fontSize: 9,
                    }}
                  >
                    ●
                  </span>
                )}
              </button>
            ))}
            <span style={{ flex: 1 }} />
            <span
              style={{
                alignSelf: "center",
                fontSize: 9,
                letterSpacing: 1,
                fontFamily: MONO,
                color: "#5f7f8f",
                paddingRight: 2,
              }}
            >
              PESQUISA VISUAL · NÃO ADQUIRÍVEL
            </span>
          </div>

          {/* ===== CONTEÚDO ===== */}
          <div
            className="profScroll"
            style={{ flex: 1, minHeight: 0, overflow: "auto", padding: "0 12px 12px" }}
          >
            {/* ---------- PESQUISA (layout do anexo) ---------- */}
            {tab === "pesquisa" && (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "190px minmax(0, 1fr) 236px",
                  gap: 10,
                  minHeight: "100%",
                }}
              >
                {/* COLUNA ESQUERDA: -AREA- (continentes) */}
                <div style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: 0 }}>
                  <div
                    style={{
                      ...cut(8),
                      background: "rgba(53,224,255,0.06)",
                      border: `1px solid ${CYAN}`,
                      padding: 8,
                    }}
                  >
                    <div
                      style={{
                        color: CYAN,
                        fontSize: 10,
                        fontWeight: 900,
                        letterSpacing: 2,
                        fontFamily: MONO,
                        marginBottom: 6,
                      }}
                    >
                      -AREA- CONTINENTES
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {PROF_MAPS.map((c) => (
                        <div
                          key={c.id}
                          onClick={() => setTab("continentes")}
                          title="Ver mapa"
                          style={{
                            ...cut(6),
                            background:
                              "linear-gradient(160deg, rgba(6,32,40,0.92), rgba(10,60,72,0.92))",
                            border: "1px solid rgba(53,224,255,0.4)",
                            padding: "6px 7px",
                            cursor: "pointer",
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                            <span style={{ fontSize: 14 }}>{c.emoji}</span>
                            <span
                              style={{
                                color: "#eafcff",
                                fontSize: 9,
                                fontWeight: 900,
                                fontFamily: MONO,
                                lineHeight: 1.15,
                              }}
                            >
                              {c.name}
                            </span>
                          </div>
                          <div
                            style={{
                              color: "#9ad9ef",
                              fontSize: 8,
                              marginTop: 3,
                              fontFamily: MONO,
                            }}
                          >
                            GRÁTIS · {ELEMENT_META[c.element].label}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div
                      style={{
                        color: "#6f95a5",
                        fontSize: 8,
                        marginTop: 6,
                        fontFamily: MONO,
                        textAlign: "center",
                      }}
                    >
                      {MAP_TAGS}
                    </div>
                  </div>

                  <div
                    style={{
                      ...cut(8),
                      background: "#000",
                      border: "1px solid rgba(255,255,255,0.2)",
                      padding: "5px 8px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <span
                      style={{ color: "#8ba0b2", fontSize: 8, letterSpacing: 1, fontFamily: MONO }}
                    >
                      LOCAL
                    </span>
                    <span style={{ color: CYAN, fontSize: 9, fontWeight: 900, fontFamily: MONO }}>
                      LABORATÓRIO
                    </span>
                  </div>
                </div>

                {/* CENTRO: dossiê em papel + seletor */}
                <div style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: 0 }}>
                  <div
                    style={{
                      ...cut(10),
                      flex: 1,
                      minHeight: 300,
                      background:
                        "radial-gradient(circle at 20% 15%, #f7efdd, #e9dfc6 70%, #ddd2b4)",
                      border: "2px solid #14100a",
                      boxShadow: "inset 0 0 26px rgba(120,96,40,0.25), 0 6px 18px rgba(0,0,0,0.5)",
                      padding: 14,
                      position: "relative",
                      display: "flex",
                      flexDirection: "column",
                      overflow: "hidden",
                    }}
                  >
                    {/* scanline decorativa */}
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        pointerEvents: "none",
                        background:
                          "repeating-linear-gradient(0deg, rgba(0,0,0,0.045) 0 1px, transparent 1px 4px)",
                      }}
                    />
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                      <span
                        style={{
                          color: "#3a3226",
                          fontSize: 13,
                          fontWeight: 900,
                          fontFamily: MONO,
                        }}
                      >
                        Nº {String(idx).padStart(3, "0")}
                      </span>
                      <span style={{ flex: 1, height: 2, background: "rgba(40,32,20,0.35)" }} />
                      <button
                        onClick={() => cycle(-1)}
                        title="Anterior"
                        style={{
                          cursor: "pointer",
                          background: "rgba(40,32,20,0.12)",
                          border: "1px solid rgba(40,32,20,0.5)",
                          color: "#2b2318",
                          fontWeight: 900,
                          padding: "1px 8px",
                          borderRadius: 4,
                        }}
                      >
                        ◀
                      </button>
                      <button
                        onClick={() => cycle(1)}
                        title="Próximo"
                        style={{
                          cursor: "pointer",
                          background: "rgba(40,32,20,0.12)",
                          border: "1px solid rgba(40,32,20,0.5)",
                          color: "#2b2318",
                          fontWeight: 900,
                          padding: "1px 8px",
                          borderRadius: 4,
                        }}
                      >
                        ▶
                      </button>
                    </div>

                    <div style={{ display: "flex", gap: 12, minHeight: 0, flex: 1 }}>
                      {/* imagem + nome */}
                      <div
                        style={{
                          width: 168,
                          flexShrink: 0,
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                        }}
                      >
                        <div
                          style={{
                            width: 150,
                            height: 150,
                            display: "grid",
                            placeItems: "center",
                            background:
                              "radial-gradient(circle at 50% 45%, rgba(53,224,255,0.16), rgba(20,16,10,0.06) 70%)",
                            border: "2px dashed rgba(40,32,20,0.55)",
                            borderRadius: 8,
                            overflow: "hidden",
                          }}
                        >
                          {img ? (
                            <img
                              src={img}
                              alt={sel}
                              style={{
                                width: 128,
                                height: 128,
                                objectFit: "contain",
                                imageRendering: "pixelated",
                              }}
                            />
                          ) : (
                            <span style={{ fontSize: 40, opacity: 0.6 }}>❓</span>
                          )}
                        </div>
                        <div
                          style={{
                            marginTop: 8,
                            color: "#1f1a10",
                            fontSize: 17,
                            fontWeight: 900,
                            letterSpacing: 1,
                            textAlign: "center",
                            fontFamily: MONO,
                            lineHeight: 1.05,
                            wordBreak: "break-word",
                          }}
                        >
                          {displayName(sel)}
                        </div>
                        <div
                          style={{
                            display: "flex",
                            gap: 4,
                            marginTop: 6,
                            flexWrap: "wrap",
                            justifyContent: "center",
                          }}
                        >
                          {types.map((t) => (
                            <span
                              key={t}
                              style={{
                                background: TYPE_COLOR[t] ?? "#888",
                                color: "#fff",
                                fontSize: 9,
                                fontWeight: 900,
                                padding: "2px 7px",
                                borderRadius: 10,
                                fontFamily: MONO,
                                textShadow: "1px 1px 0 rgba(0,0,0,0.4)",
                              }}
                            >
                              {TYPE_ICON[t] ?? "✦"} {t}
                            </span>
                          ))}
                        </div>
                        <div
                          style={{
                            display: "flex",
                            gap: 4,
                            marginTop: 5,
                            flexWrap: "wrap",
                            justifyContent: "center",
                          }}
                        >
                          {elements.map((el) => (
                            <span
                              key={el}
                              style={{
                                background: `${ELEMENT_META[el].color}22`,
                                border: `1px solid ${ELEMENT_META[el].color}`,
                                color: "#2b2318",
                                fontSize: 8,
                                fontWeight: 900,
                                padding: "1px 6px",
                                borderRadius: 4,
                                fontFamily: MONO,
                              }}
                            >
                              {ELEMENT_META[el].emoji} {ELEMENT_META[el].label}
                            </span>
                          ))}
                        </div>
                        <span
                          style={{
                            marginTop: 8,
                            background: "#14100a",
                            color: rColor(base.rarity),
                            fontSize: 9,
                            fontWeight: 900,
                            letterSpacing: 1,
                            padding: "3px 10px",
                            borderRadius: 10,
                            fontFamily: MONO,
                          }}
                        >
                          {RARITY_NAME[base.rarity]}
                        </span>
                      </div>

                      {/* biologia + poderes */}
                      <div
                        style={{
                          flex: 1,
                          minWidth: 0,
                          display: "flex",
                          flexDirection: "column",
                          gap: 8,
                        }}
                      >
                        <div
                          style={{ borderBottom: "2px solid rgba(40,32,20,0.5)", paddingBottom: 3 }}
                        >
                          <span
                            style={{
                              color: "#2b2318",
                              fontSize: 12,
                              fontWeight: 900,
                              letterSpacing: 3,
                              fontFamily: MONO,
                            }}
                          >
                            BIOLOGIA
                          </span>
                        </div>
                        <p
                          style={{
                            margin: 0,
                            color: "#3a3226",
                            fontSize: 11.5,
                            lineHeight: 1.5,
                            fontFamily: "Georgia, 'Times New Roman', serif",
                          }}
                        >
                          {displayName(sel)} foi catalogado pelo Prof. Carvalho como espécime do
                          tipo <b>{types.join(" e ")}</b>, de raridade{" "}
                          <b>{RARITY_NAME[base.rarity].toLowerCase()}</b>. Poder base total:{" "}
                          <b>{power}</b>. Hábitos observados em campo: {ELEMENT_META[mainEl].label}{" "}
                          {ELEMENT_META[mainEl].emoji} com afinidade marcante.
                          <br />
                          <br />
                          <span style={{ fontStyle: "italic", opacity: 0.8 }}>
                            Registro de laboratório — este painel é de estudo: escolher aqui NÃO
                            adiciona o Pokémon à sua coleção. Observe os dados antes de qualquer
                            expedição aos novos continentes.
                          </span>
                        </p>

                        <div
                          style={{
                            borderBottom: "2px solid rgba(40,32,20,0.5)",
                            paddingBottom: 3,
                            marginTop: 2,
                          }}
                        >
                          <span
                            style={{
                              color: "#2b2318",
                              fontSize: 12,
                              fontWeight: 900,
                              letterSpacing: 3,
                              fontFamily: MONO,
                            }}
                          >
                            PODERES
                          </span>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                          {moveList.map((mv, i) => (
                            <div
                              key={`${mv.name}-${i}`}
                              style={{
                                background: "rgba(20,16,10,0.07)",
                                border: "1px solid rgba(40,32,20,0.4)",
                                borderRadius: 6,
                                padding: "5px 7px",
                              }}
                            >
                              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                                <span style={{ fontSize: 12 }}>{mv.icon}</span>
                                <span
                                  style={{
                                    color: "#1f1a10",
                                    fontSize: 11,
                                    fontWeight: 900,
                                    fontFamily: MONO,
                                  }}
                                >
                                  {mv.name}
                                </span>
                                <span
                                  style={{
                                    marginLeft: "auto",
                                    fontSize: 8,
                                    fontWeight: 900,
                                    fontFamily: MONO,
                                    color: "#1f1a10",
                                    background: STRIP_POWER[mv.power] ?? "#ccc",
                                    padding: "1px 5px",
                                    borderRadius: 8,
                                  }}
                                >
                                  {mv.power}
                                </span>
                              </div>
                              <div style={{ color: "#5a4f3a", fontSize: 9, marginTop: 2 }}>
                                {mv.desc}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* seletor de pokémons */}
                  <div
                    style={{
                      ...cut(8),
                      background: "rgba(53,224,255,0.05)",
                      border: `1px solid rgba(53,224,255,0.45)`,
                      padding: 8,
                    }}
                  >
                    <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
                      <span
                        style={{
                          color: CYAN,
                          fontSize: 10,
                          fontWeight: 900,
                          letterSpacing: 2,
                          fontFamily: MONO,
                        }}
                      >
                        -ESCOLHER-
                      </span>
                      <input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="buscar pokémon..."
                        style={{
                          flex: 1,
                          minWidth: 0,
                          background: "#050a0d",
                          border: `1px solid rgba(53,224,255,0.4)`,
                          color: "#dff8ff",
                          padding: "4px 8px",
                          fontSize: 11,
                          fontFamily: MONO,
                          borderRadius: 4,
                          outline: "none",
                        }}
                      />
                      <span
                        style={{
                          color: "#5f7f8f",
                          fontSize: 9,
                          fontFamily: MONO,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {list.length} EXIB.
                      </span>
                    </div>
                    <div
                      className="profScroll"
                      style={{
                        display: "flex",
                        gap: 6,
                        overflowX: "auto",
                        paddingBottom: 4,
                        maxHeight: 86,
                        flexWrap: "wrap",
                      }}
                    >
                      {list.length === 0 && (
                        <span
                          style={{ color: "#7fa8ba", fontSize: 11, padding: 8, fontFamily: MONO }}
                        >
                          {known.size === 0
                            ? "Pokédex vazia — capture ou aviste pokémon para catalogá-los aqui."
                            : "Nenhum pokémon com esse filtro."}
                        </span>
                      )}
                      {list.map((sp) => {
                        const active = sp === sel;
                        return (
                          <button
                            key={sp}
                            onClick={() => setSel(sp)}
                            title={displayName(sp)}
                            style={{
                              width: 52,
                              height: 52,
                              flexShrink: 0,
                              cursor: "pointer",
                              display: "grid",
                              placeItems: "center",
                              background: active ? "rgba(53,224,255,0.22)" : "rgba(5,10,13,0.8)",
                              border: `2px solid ${active ? CYAN : "rgba(53,224,255,0.25)"}`,
                              boxShadow: active ? `0 0 12px rgba(53,224,255,0.6)` : "none",
                              borderRadius: 6,
                              padding: 2,
                              position: "relative",
                              overflow: "hidden",
                            }}
                          >
                            {gifMap[sp] ? (
                              <img
                                src={gifMap[sp]}
                                alt=""
                                style={{
                                  width: 40,
                                  height: 40,
                                  objectFit: "contain",
                                  imageRendering: "pixelated",
                                }}
                              />
                            ) : (
                              <span style={{ fontSize: 16, opacity: 0.7 }}>❔</span>
                            )}
                            <span
                              style={{
                                position: "absolute",
                                bottom: 1,
                                right: 3,
                                fontSize: 7,
                                fontWeight: 900,
                                color: active ? CYAN : "#4f7585",
                                fontFamily: MONO,
                              }}
                            >
                              {String(dexNo.get(sp) ?? 0).padStart(3, "0")}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* COLUNA DIREITA: -STATUS- (barras + radar) */}
                <div style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: 0 }}>
                  <div
                    style={{
                      ...cut(8),
                      background: "rgba(53,224,255,0.06)",
                      border: `1px solid ${CYAN}`,
                      padding: 10,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: 8,
                      }}
                    >
                      <span
                        style={{
                          color: CYAN,
                          fontSize: 10,
                          fontWeight: 900,
                          letterSpacing: 2,
                          fontFamily: MONO,
                        }}
                      >
                        -STATUS-
                      </span>
                      <span style={{ color: "#8ba0b2", fontSize: 8, fontFamily: MONO }}>
                        NV SELVAGEM {base.minLv}
                      </span>
                    </div>

                    {(
                      [
                        ["HP", base.hp],
                        ["ATK", base.atk],
                        ["DEF", base.def],
                        ["SP.A", base.spa],
                        ["SP.D", base.spd],
                        ["SPE", base.spe],
                      ] as const
                    ).map(([label, v]) => (
                      <div
                        key={label}
                        style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}
                      >
                        <span
                          style={{
                            width: 34,
                            color: "#9ad9ef",
                            fontSize: 9,
                            fontWeight: 900,
                            fontFamily: MONO,
                          }}
                        >
                          {label}
                        </span>
                        <div
                          style={{
                            flex: 1,
                            height: 14,
                            background: "#06121a",
                            border: "1px solid rgba(53,224,255,0.35)",
                            borderRadius: 3,
                            overflow: "hidden",
                            position: "relative",
                          }}
                        >
                          <div
                            style={{
                              width: `${Math.min(100, (v / 160) * 100)}%`,
                              height: "100%",
                              background: "linear-gradient(90deg, #ff7a1a, #ffb14d)",
                              boxShadow: "0 0 8px rgba(255,138,61,0.7)",
                            }}
                          />
                        </div>
                        <span
                          style={{
                            width: 26,
                            textAlign: "right",
                            color: "#ffd94d",
                            fontSize: 10,
                            fontWeight: 900,
                            fontFamily: MONO,
                          }}
                        >
                          {v}
                        </span>
                      </div>
                    ))}

                    {/* radar / poder */}
                    <div style={{ display: "grid", placeItems: "center", marginTop: 8 }}>
                      <div
                        style={{
                          width: 148,
                          height: 148,
                          borderRadius: "50%",
                          position: "relative",
                          display: "grid",
                          placeItems: "center",
                          background:
                            "radial-gradient(circle, rgba(53,224,255,0.18), rgba(4,12,16,0.9) 72%)",
                          border: `2px solid ${CYAN}`,
                          animation: "profGlow 3.2s ease-in-out infinite",
                        }}
                      >
                        <div
                          style={{
                            position: "absolute",
                            inset: 8,
                            borderRadius: "50%",
                            border: "1px dashed rgba(53,224,255,0.55)",
                            animation: "profSpin 14s linear infinite",
                          }}
                        />
                        <div
                          style={{
                            position: "absolute",
                            inset: 22,
                            borderRadius: "50%",
                            border: "2px solid rgba(53,224,255,0.3)",
                            background:
                              "conic-gradient(from 0deg, rgba(53,224,255,0.35), transparent 30%, transparent 70%, rgba(53,224,255,0.35))",
                            animation: "profSpin 6s linear infinite",
                          }}
                        />
                        <div style={{ textAlign: "center", position: "relative" }}>
                          <div
                            style={{
                              color: "#eafcff",
                              fontSize: 30,
                              fontWeight: 900,
                              fontFamily: MONO,
                              lineHeight: 1,
                              textShadow: `0 0 12px ${CYAN}`,
                            }}
                          >
                            {power}
                          </div>
                          <div
                            style={{
                              color: CYAN,
                              fontSize: 9,
                              fontWeight: 900,
                              letterSpacing: 3,
                              fontFamily: MONO,
                            }}
                          >
                            PODER
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div
                    style={{
                      ...cut(8),
                      background: "rgba(255,170,60,0.08)",
                      border: "1px solid rgba(255,170,60,0.5)",
                      padding: "8px 10px",
                    }}
                  >
                    <div
                      style={{
                        color: "#ffb14d",
                        fontSize: 9,
                        fontWeight: 900,
                        letterSpacing: 1,
                        fontFamily: MONO,
                        marginBottom: 4,
                      }}
                    >
                      AVISO DO LAB
                    </div>
                    <div style={{ color: "#d8c9a8", fontSize: 10, lineHeight: 1.45 }}>
                      Aqui você <b>só observa</b>: escolher um Pokémon não o envia à coleção.
                      Missões e mapas estão nas abas ao topo.
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ---------- MISSÕES (diálogos → quests: kills/caps/shiny/nível) ---------- */}
            {tab === "missoes" && (
              <div style={{ display: "grid", gridTemplateColumns: "220px minmax(0,1fr)", gap: 12 }}>
                <div
                  style={{
                    ...cut(10),
                    background: "rgba(53,224,255,0.06)",
                    border: `1px solid ${CYAN}`,
                    padding: 12,
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{
                      width: 140,
                      height: 140,
                      margin: "0 auto",
                      border: `3px solid ${CYAN}`,
                      borderRadius: 8,
                      overflow: "hidden",
                      background: "#04141a",
                      boxShadow: `0 0 20px rgba(53,224,255,0.45)`,
                    }}
                  >
                    <img
                      src={professorImg}
                      alt="Prof. Carvalho"
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        imageRendering: "pixelated",
                      }}
                    />
                  </div>
                  <div
                    style={{
                      color: "#eafcff",
                      fontWeight: 900,
                      fontSize: 14,
                      marginTop: 8,
                      fontFamily: MONO,
                    }}
                  >
                    PROF. CARVALHO
                  </div>
                  <div style={{ color: CYAN, fontSize: 9, letterSpacing: 2, fontFamily: MONO }}>
                    LABORATÓRIO · PESQUISA
                  </div>
                  <div
                    style={{
                      marginTop: 10,
                      textAlign: "left",
                      background: "rgba(0,0,0,0.45)",
                      border: "1px solid rgba(53,224,255,0.3)",
                      borderRadius: 6,
                      padding: 8,
                    }}
                  >
                    <div
                      style={{ color: "#8ba0b2", fontSize: 9, fontFamily: MONO, marginBottom: 4 }}
                    >
                      PROGRESSO
                    </div>
                    <div style={{ color: "#eafcff", fontSize: 11, lineHeight: 1.5 }}>
                      {quest?.active && activeDef
                        ? done
                          ? `✅ ${activeDef.title} — pronta para resgatar!`
                          : `${activeDef.title} — ${activeDef.objective}`
                        : completedList.length >= PROF_QUESTS.length
                          ? "Todas as missões concluídas! 🎉"
                          : "Nenhuma missão ativa. Escolha um diálogo →"}
                    </div>
                    {quest?.active && activeDef && (
                      <div style={{ marginTop: 6 }}>
                        <div
                          style={{
                            height: 10,
                            background: "#06121a",
                            border: "1px solid rgba(53,224,255,0.4)",
                            borderRadius: 5,
                            overflow: "hidden",
                          }}
                        >
                          <div
                            style={{
                              width: `${Math.min(
                                100,
                                (activeCur / Math.max(1, activeDef.target)) * 100,
                              )}%`,
                              height: "100%",
                              background: done
                                ? "linear-gradient(90deg,#34d399,#7ef2a2)"
                                : `linear-gradient(90deg, #0a5f78, ${CYAN})`,
                              transition: "width .3s",
                            }}
                          />
                        </div>
                        <div
                          style={{ display: "flex", justifyContent: "space-between", marginTop: 3 }}
                        >
                          <span style={{ color: "#9ad9ef", fontSize: 9, fontFamily: MONO }}>
                            {Math.max(0, activeCur)}
                            /{activeDef.target}
                          </span>
                          <span
                            style={{
                              color: done ? "#7ef2a2" : "#5f7f8f",
                              fontSize: 9,
                              fontFamily: MONO,
                            }}
                          >
                            {done ? "PRONTO" : "EM CURSO"}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 10, minWidth: 0 }}>
                  <div
                    style={{
                      color: CYAN,
                      fontSize: 11,
                      fontWeight: 900,
                      letterSpacing: 2,
                      fontFamily: MONO,
                    }}
                  >
                    ESCOLHA UM DIAGNÓLOGO E INICIE UMA MISSÃO
                  </div>
                  {PROF_QUESTS.map((q) => {
                    const isActive = quest?.active === q.id;
                    const isDone = completedList.includes(q.id);
                    const isBusy = !!quest?.active && !isActive;
                    const cur = isActive ? profQuestProgress(q, quest, questCtx) : 0;
                    const ready = isActive && cur >= q.target;
                    return (
                      <div
                        key={q.id}
                        style={{
                          ...cut(10),
                          background: isActive
                            ? "rgba(53,224,255,0.1)"
                            : isDone
                              ? "rgba(126,242,162,0.07)"
                              : "rgba(255,255,255,0.03)",
                          border: `1px solid ${isActive ? CYAN : isDone ? "#7ef2a2" : "rgba(53,224,255,0.3)"}`,
                          padding: 12,
                          display: "flex",
                          gap: 12,
                          alignItems: "flex-start",
                        }}
                      >
                        <div
                          style={{
                            width: 44,
                            height: 44,
                            flexShrink: 0,
                            display: "grid",
                            placeItems: "center",
                            background: "#000",
                            border: `2px solid ${isActive ? CYAN : "rgba(53,224,255,0.5)"}`,
                            borderRadius: 8,
                            color: CYAN,
                            fontSize: 20,
                            fontWeight: 900,
                            fontFamily: MONO,
                          }}
                        >
                          {q.letter}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              display: "flex",
                              gap: 8,
                              alignItems: "baseline",
                              flexWrap: "wrap",
                            }}
                          >
                            <span
                              style={{
                                color: "#eafcff",
                                fontSize: 14,
                                fontWeight: 900,
                                fontFamily: MONO,
                              }}
                            >
                              {q.title}
                            </span>
                            <span style={{ color: "#ffb14d", fontSize: 10, fontFamily: MONO }}>
                              🎁 {q.reward}
                            </span>
                          </div>
                          <div
                            style={{
                              color: "#9ad9ef",
                              fontSize: 12,
                              marginTop: 4,
                              lineHeight: 1.45,
                            }}
                          >
                            “{q.quote}”
                          </div>
                          <div
                            style={{
                              display: "flex",
                              gap: 10,
                              marginTop: 6,
                              alignItems: "center",
                              flexWrap: "wrap",
                            }}
                          >
                            <span style={{ color: "#8ba0b2", fontSize: 10, fontFamily: MONO }}>
                              OBJETIVO: {q.objective}
                            </span>
                            {q.metric === "shiny" && q.species && gifMap[q.species as Species] && (
                              <img
                                src={gifMap[q.species as Species]}
                                alt=""
                                title={q.species.replace(/_/g, " ").toUpperCase()}
                                style={{
                                  width: 34,
                                  height: 34,
                                  objectFit: "contain",
                                  imageRendering: "pixelated",
                                  filter: "drop-shadow(0 0 6px rgba(255,151,225,0.85))",
                                }}
                              />
                            )}
                            {isActive && (
                              <span
                                style={{
                                  color: done ? "#7ef2a2" : "#ffd94d",
                                  fontSize: 10,
                                  fontWeight: 900,
                                  fontFamily: MONO,
                                }}
                              >
                                {Math.max(0, cur)}/{q.target}
                              </span>
                            )}
                          </div>
                          <div style={{ marginTop: 8 }}>
                            {isDone ? (
                              <span
                                style={{
                                  padding: "6px 16px",
                                  background: "rgba(126,242,162,0.15)",
                                  border: "1px solid #7ef2a2",
                                  color: "#7ef2a2",
                                  fontWeight: 900,
                                  fontSize: 11,
                                  borderRadius: 6,
                                  fontFamily: MONO,
                                }}
                              >
                                ✓ CONCLUÍDA
                              </span>
                            ) : isActive ? (
                              <button
                                onClick={props.onClaimQuest}
                                disabled={!ready}
                                style={{
                                  padding: "6px 18px",
                                  cursor: ready ? "pointer" : "not-allowed",
                                  background: ready
                                    ? "linear-gradient(180deg,#7ef2a2,#34d399)"
                                    : "#132028",
                                  border: `1px solid ${ready ? "#7ef2a2" : "rgba(53,224,255,0.3)"}`,
                                  color: ready ? "#04141a" : "#5f7f8f",
                                  fontWeight: 900,
                                  fontSize: 11,
                                  borderRadius: 6,
                                  fontFamily: MONO,
                                  boxShadow: ready ? "0 0 14px rgba(126,242,162,0.5)" : "none",
                                }}
                              >
                                {ready ? "🎁 RESGATAR RECOMPENSA" : "EM ANDAMENTO..."}
                              </button>
                            ) : (
                              <button
                                onClick={() => props.onAcceptQuest(q.id)}
                                disabled={isBusy}
                                style={{
                                  padding: "6px 18px",
                                  cursor: isBusy ? "not-allowed" : "pointer",
                                  background: isBusy
                                    ? "#132028"
                                    : `linear-gradient(180deg, ${CYAN}, #0a8fb0)`,
                                  border: `1px solid ${CYAN}`,
                                  color: isBusy ? "#5f7f8f" : "#04141a",
                                  fontWeight: 900,
                                  fontSize: 11,
                                  borderRadius: 6,
                                  fontFamily: MONO,
                                  boxShadow: isBusy ? "none" : "0 0 14px rgba(53,224,255,0.5)",
                                }}
                              >
                                {isBusy ? "OUTRA MISSÃO ATIVA" : "▶ ACEITAR MISSÃO"}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ---------- MAPAS (UPDATE) — teleporte grátis pelo Professor ---------- */}
            {tab === "continentes" && (
              <div>
                <div
                  style={{
                    color: CYAN,
                    fontSize: 12,
                    fontWeight: 900,
                    letterSpacing: 2,
                    fontFamily: MONO,
                    marginBottom: 4,
                  }}
                >
                  5 MAPAS PARA EXPLORAR
                </div>
                <div style={{ color: "#8ba0b2", fontSize: 11, marginBottom: 12 }}>
                  Expedições do laboratório — sem custo de ouro;10 de energia por entrada
                  (após desbloquear). Alguns mapas têm pokémons selvagens e nível próprio.
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                    gap: 12,
                  }}
                >
                  {PROF_MAPS.map((c) => {
                    const m = ELEMENT_META[c.element];
                    const lockedPts = c.reqPts != null && scrapBankPts < c.reqPts;
                    const lockedLv = c.reqLevel != null && (trainerLevel ?? 1) < c.reqLevel;
                    const locked = lockedPts || lockedLv;
                    const reqLabel = c.reqPts != null
                      ? `${scrapBankPts}/${c.reqPts} PTS`
                      : `NV ${(trainerLevel ?? 1)}/${c.reqLevel}`;
                    return (
                      <div
                        key={c.id}
                        style={{
                          ...cut(14),
                          border: `2px solid ${locked ? "#4a3a28" : m.color}`,
                          background: "#0a0e12",
                          overflow: "hidden",
                          boxShadow: locked ? "0 0 18px rgba(60,40,10,0.5)" : `0 0 20px ${m.color}44`,
                          display: "flex",
                          flexDirection: "column",
                          position: "relative",
                        }}
                      >
                        {/* arte real do mapa */}
                        <div
                          style={{
                            height: 150,
                            position: "relative",
                            borderBottom: `2px solid ${locked ? "#4a3a28" : m.color}`,
                            overflow: "hidden",
                          }}
                        >
                          <img
                            src={c.bg}
                            alt={c.name}
                            style={{
                              position: "absolute",
                              inset: 0,
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                              filter: locked ? "grayscale(0.85) brightness(0.35)" : "none",
                            }}
                          />
                          <div
                            style={{
                              position: "absolute",
                              inset: 0,
                              background:
                                "linear-gradient(180deg, rgba(4,10,14,0.1) 40%, rgba(4,10,14,0.88) 100%)",
                            }}
                          />
                          {locked && (
                            <div
                              style={{
                                position: "absolute", inset: 0,
                                display: "flex", flexDirection: "column",
                                alignItems: "center", justifyContent: "center", gap: 6,
                                background: "radial-gradient(circle at 50% 45%, rgba(20,12,4,0.25) 0%, rgba(8,5,2,0.78) 100%)",
                              }}
                            >
                              <img
                                src={BOAT_SHOP_ICON}
                                alt=""
                                style={{
                                  width: 84, height: 56, objectFit: "contain",
                                  imageRendering: "pixelated",
                                  filter: "drop-shadow(0 0 12px rgba(201,138,75,0.85))",
                                  opacity: 0.95,
                                }}
                              />
                              <span style={{ fontSize: 30, lineHeight: 1, textShadow: "0 0 14px rgba(255,200,80,0.8)" }}>🔒</span>
                              <span
                                style={{
                                  color: "#ffd94d", fontSize: 11, fontWeight: 900,
                                  letterSpacing: 2, fontFamily: MONO,
                                  textShadow: "1px 1px 0 #000",
                                }}
                              >
                                BLOQUEADO
                              </span>
                              <span
                                style={{
                                  color: "#c9a06b", fontSize: 10, fontWeight: 900,
                                  fontFamily: MONO, letterSpacing: 1,
                                }}
                              >
                                {reqLabel}
                              </span>
                            </div>
                          )}
                          <span
                            style={{
                              position: "absolute",
                              top: 8,
                              left: 8,
                              background: locked ? "#4a3a28" : m.color,
                              color: locked ? "#c9a06b" : "#04141a",
                              fontSize: 9,
                              fontWeight: 900,
                              letterSpacing: 1,
                              padding: "3px 8px",
                              borderRadius: 10,
                              fontFamily: MONO,
                            }}
                          >
                            {m.emoji} {m.label}
                          </span>
                          {!locked && (
                            <span
                              style={{
                                position: "absolute",
                                top: 8,
                                right: 8,
                                color: "#ffd94d",
                                fontSize: 11,
                                fontWeight: 900,
                                textShadow: "1px 1px 0 #000",
                                fontFamily: MONO,
                              }}
                            >
                              {"★".repeat(c.stars)}
                            </span>
                          )}
                          <span
                            style={{
                              position: "absolute",
                              bottom: 8,
                              left: 10,
                              color: locked ? "#8a7a60" : "#fff",
                              fontSize: 16,
                              fontWeight: 900,
                              letterSpacing: 1,
                              fontFamily: MONO,
                              textShadow: "2px 2px 0 #000",
                            }}
                          >
                            {c.emoji} {c.name}
                          </span>
                        </div>
                        <div
                          style={{
                            padding: 12,
                            display: "flex",
                            flexDirection: "column",
                            gap: 8,
                            flex: 1,
                          }}
                        >
                          {locked ? (
                            <div
                              style={{
                                background: "rgba(201,138,75,0.08)",
                                border: "1px dashed rgba(201,138,75,0.55)",
                                borderRadius: 6,
                                color: "#c9a06b",
                                fontSize: 10,
                                fontWeight: 900,
                                letterSpacing: 0.5,
                                fontFamily: MONO,
                                textAlign: "center",
                                padding: "8px 6px",
                                lineHeight: 1.6,
                              }}
                            >
                              🔒 {c.reqPts != null
                                ? `ENTREGUE ${c.reqPts} PTS DE SUCATA AO PROFESSOR`
                                : `TREINADOR NV ${c.reqLevel} NECESSÁRIO`}
                              <div style={{ fontSize: 9, marginTop: 4, color: "#8a7a60", fontWeight: 700 }}>
                                {c.reqPts != null
                                  ? "Troque sucatas por pontos na aba BARCO"
                                  : "Suba de nível para desbloquear"}
                              </div>
                            </div>
                          ) : (
                            <>
                          <div
                            style={{
                              background: "rgba(126,242,122,0.08)",
                              border: "1px dashed rgba(126,242,122,0.55)",
                              borderRadius: 6,
                              color: "#7ef27a",
                              fontSize: 9,
                              fontWeight: 900,
                              letterSpacing: 0.5,
                              fontFamily: MONO,
                              textAlign: "center",
                              padding: "4px 6px",
                            }}
                          >
                            {c.free ? "SEM OURO · GRÁTIS · SEM NÍVEL" : MAP_TAGS}
                          </div>
                          <div
                            style={{
                              color: "#9ab5c2",
                              fontSize: 11.5,
                              lineHeight: 1.5,
                              flex: 1,
                            }}
                          >
                            {c.desc}
                          </div>
                          <button
                            onClick={() => props.onTravel(c.id)}
                            style={{
                              ...cut(8),
                              padding: "9px 10px",
                              cursor: "pointer",
                              background: "linear-gradient(180deg, #7ef27a, #3fbf5f)",
                              border: "2px solid #eafff0",
                              color: "#04141a",
                              fontSize: 12,
                              fontWeight: 900,
                              letterSpacing: 2,
                              fontFamily: MONO,
                              boxShadow: "0 0 14px rgba(126,242,122,0.5)",
                            }}
                          >
                            {c.free ? "🚀 VIAJAR · GRÁTIS" : "🚀 VIAJAR · 10⚡"}
                          </button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ---------- BARCO (loja da Jornada dos Navegantes) ---------- */}
            {tab === "barcos" && (
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <span style={{ color: "#c98a4b", fontSize: 12, fontWeight: 900, letterSpacing: 2, fontFamily: MONO }}>
                    ⛵ ESTaleIRO DO PROFESSOR
                  </span>
                  <span style={{ color: "#8a6a4b", fontSize: 10, fontFamily: MONO, marginLeft: "auto" }}>
                    🪙 {gold ?? 0} &nbsp;·&nbsp; 🥇 {pepitas ?? 0} &nbsp;·&nbsp; 🛢️ {oil ?? 0}
                  </span>
                </div>
                <div style={{ fontSize: 11, marginBottom: 12, lineHeight: 1.6, color: "#a98a6b" }}>
                  Sem barco não se entra em Azulante, Mar Grande nem Navegante. O casco é a sua
                  resistência e o combustível é o tempo que você navega — cada unidade de Óleo
                  enche o tanque inteiro.
                </div>

                {/* Status do barco atual */}
                {(() => {
                  const t = ship?.tier;
                  if (!t) {
                    return (
                      <div
                        style={{
                          ...cut(12), padding: 14, marginBottom: 14,
                          border: "1px dashed rgba(201,138,75,0.5)",
                          background: "rgba(60,30,10,0.3)", color: "#c9a882",
                          fontSize: 11, textAlign: "center", fontFamily: MONO,
                        }}
                      >
                        ⛵ VOCÊ NÃO TEM BARCO — escolha um casco abaixo
                      </div>
                    );
                  }
                  const d = BOAT_BY_TIER[t];
                  const m = BOAT_TIER_META[t];
                  const hp = ship?.hp ?? 0;
                  const fuel = ship?.fuel ?? 0;
                  const maxHp = maxHpOf(t);
                  const maxFuel = maxFuelOf(t);
                  const bar = (label: string, val: number, max: number, color: string) => (
                    <div style={{ marginTop: 8 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, fontFamily: MONO, color: "#c9a882" }}>
                        <span>{label}</span>
                        <span>{Math.round(val)} / {max}</span>
                      </div>
                      <div style={{ height: 10, marginTop: 3, background: "rgba(0,0,0,0.6)", border: `1px solid ${color}66`, overflow: "hidden" }}>
                        <div style={{
                          width: `${Math.max(0, Math.min(100, (val / max) * 100))}%`, height: "100%",
                          background: `linear-gradient(90deg, ${color}, ${color}88)`,
                          boxShadow: `0 0 10px ${m.glow}`, transition: "width .25s ease",
                        }} />
                      </div>
                    </div>
                  );
                  return (
                    <div
                      style={{
                        ...cut(12), padding: 14, marginBottom: 14,
                        border: `2px solid ${m.neon}`,
                        background: `linear-gradient(150deg, ${m.wood}44, rgba(20,10,4,0.92) 60%)`,
                        boxShadow: `0 0 22px ${m.glow}, inset 0 0 26px ${m.neon}18`,
                      }}
                    >
                      <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                        <div
                          style={{
                            width: 72, height: 72, flexShrink: 0,
                            backgroundImage: `url("${BOAT_SHOP_ICON}")`,
                            backgroundSize: "contain",
                            backgroundRepeat: "no-repeat",
                            backgroundPosition: "center",
                            filter: `drop-shadow(0 0 8px ${m.glow})`,
                            imageRendering: "pixelated",
                          }}
                        />
                        <div style={{ flex: 1, minWidth: 170 }}>
                          <div style={{ color: m.neon, fontSize: 9, fontWeight: 900, fontFamily: MONO, letterSpacing: 1.5 }}>
                            {m.label} · EM SERVIÇO
                          </div>
                          <div style={{ color: "#fff", fontSize: 16, fontWeight: 900, marginTop: 2 }}>{d.name}</div>
                          <div style={{ color: "#a98a6b", fontSize: 9.5, marginTop: 3, lineHeight: 1.45 }}>{d.desc}</div>
                        </div>
                      </div>
                      {bar("🔧 RESISTÊNCIA (HP)", hp, maxHp, "#7cffb2")}
                      {bar("⛽ COMBUSTÍVEL", fuel, maxFuel, "#ffb347")}
                      <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
                        <BoatBtn label="⛽ ABASTECER (1 Óleo)" color="#ffb347" onClick={onRefuel} disabled={(oil ?? 0) <= 0 || fuel >= maxFuel} />
                        <BoatBtn label={`🔧 REPARAR (${Math.floor(maxHp * 0.25)} 🪙)`} color="#7cffb2" onClick={onRepair} disabled={hp >= maxHp} />
                      </div>
                    </div>
                  );
                })()}

                {/* ===== SALDO ===== */}
                <div
                  style={{
                    ...cut(12), padding: 12, marginBottom: 14,
                    border: "2px solid #c98a4b",
                    background: "linear-gradient(140deg, rgba(201,138,75,0.14), rgba(14,8,4,0.92) 60%)",
                  }}
                >
                  <div style={{
                    display: "flex", alignItems: "center", gap: 10,
                    paddingBottom: 10, marginBottom: 10,
                    borderBottom: "1px solid rgba(201,138,75,0.28)",
                  }}>
                    <div style={{ flexShrink: 0, width: 52, height: 52 }}>
                      <img
                        src={SUCATA_URL}
                        alt="Sucata"
                        style={{
                          width: "100%", height: "100%", objectFit: "contain",
                          imageRendering: "pixelated",
                          filter: "drop-shadow(0 0 10px rgba(201,138,75,0.8))",
                        }}
                      />
                    </div>
                    <div style={{ flex: 1, minWidth: 150 }}>
                      <div style={{ color: "#a98a6b", fontSize: 9, fontWeight: 900, letterSpacing: 1.5, fontFamily: MONO }}>
                        NA MOCHILA
                      </div>
                      <div style={{
                        fontSize: 26, fontWeight: 900, marginTop: 1, lineHeight: 1,
                        color: "#c98a4b", fontFamily: MONO,
                      }}>
                        {scrapBagN} caixa(s) · {scrapCarryPts} pts
                      </div>
                    </div>
                    {scrapBagN > 0 && (
                      <button
                        onClick={onConvertScrap}
                        title="1 caixa de sucata = 1 ponto permanente"
                        style={{
                          ...cut(8), padding: "8px 14px", cursor: "pointer",
                          background: "linear-gradient(180deg, #ffb84d, #c97a2b)",
                          border: "2px solid #ffe9c0", color: "#1a0e04",
                          fontSize: 11, fontWeight: 900, letterSpacing: 1,
                          fontFamily: MONO, boxShadow: "0 0 14px rgba(255,184,77,0.55)",
                          whiteSpace: "nowrap",
                        }}
                      >
                        ♻️ TROCAR {scrapBagN} → +{scrapBagN} PTS
                      </button>
                    )}
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 8 }}>
                    <div style={{
                      ...cut(8), background: "rgba(0,0,0,0.4)",
                      border: "1px solid rgba(201,138,75,0.5)", padding: "8px 10px",
                    }}>
                      <div style={{ color: "#8ba0b2", fontSize: 8.5, fontWeight: 900, letterSpacing: 1, fontFamily: MONO }}>
                        ENTREGUES
                      </div>
                      <div style={{ color: "#c98a4b", fontSize: 20, fontWeight: 900, marginTop: 2, fontFamily: MONO }}>
                        {scrapBankPts} pts
                      </div>
                    </div>
                    <div style={{
                      ...cut(8), background: "rgba(0,0,0,0.4)",
                      border: "1px solid rgba(255,217,77,0.35)", padding: "8px 10px",
                    }}>
                      <div style={{ color: "#8ba0b2", fontSize: 8.5, fontWeight: 900, letterSpacing: 1, fontFamily: MONO }}>
                        PEPITAS DE OURO
                      </div>
                      <div style={{ color: "#ffd94d", fontSize: 20, fontWeight: 900, marginTop: 2, fontFamily: MONO }}>
                        {pepitas ?? 0}
                      </div>
                    </div>
                    <div style={{
                      ...cut(8), background: "rgba(0,0,0,0.4)",
                      border: "1px solid rgba(245,207,107,0.35)", padding: "8px 10px",
                    }}>
                      <div style={{ color: "#8ba0b2", fontSize: 8.5, fontWeight: 900, letterSpacing: 1, fontFamily: MONO }}>
                        OURO
                      </div>
                      <div style={{ color: "#f5cf6b", fontSize: 20, fontWeight: 900, marginTop: 2, fontFamily: MONO }}>
                        {(gold ?? 0).toLocaleString("pt-BR")}
                      </div>
                    </div>
                    <div style={{
                      ...cut(8), background: "rgba(0,0,0,0.4)",
                      border: "1px solid rgba(201,138,75,0.35)", padding: "8px 10px",
                    }}>
                      <div style={{ color: "#8ba0b2", fontSize: 8.5, fontWeight: 900, letterSpacing: 1, fontFamily: MONO }}>
                        ÓLEO
                      </div>
                      <div style={{ color: "#c98a4b", fontSize: 20, fontWeight: 900, marginTop: 2, fontFamily: MONO }}>
                        {oil ?? 0}
                      </div>
                    </div>
                  </div>
                </div>
                {/* ===== COMPRA DE ÓLEO ===== */}
                <div
                  style={{
                    ...cut(12),
                    display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap",
                    padding: 12, marginBottom: 14,
                    border: "2px solid #c98a4b",
                    background: "linear-gradient(140deg, rgba(201,138,75,0.16), rgba(14,8,4,0.92) 60%)",
                    boxShadow: "0 0 18px rgba(201,138,75,0.45)",
                  }}
                >
                  <img
                    src={OIL_ICON}
                    alt="Óleo"
                    style={{ width: 62, height: 62, objectFit: "contain", imageRendering: "pixelated", filter: "drop-shadow(0 0 8px rgba(201,138,75,0.8))" }}
                  />
                  <div style={{ flex: 1, minWidth: 190 }}>
                    <div style={{ color: "#c98a4b", fontSize: 9, fontWeight: 900, letterSpacing: 1.5, fontFamily: MONO }}>
                      COMBUSTÍVEL DO ESTALEIRO
                    </div>
                    <div style={{ color: "#fff", fontSize: 16, fontWeight: 900, marginTop: 3 }}>🛢️ Óleo</div>
                    <div style={{ color: "#a98a6b", fontSize: 10, marginTop: 4, lineHeight: 1.55 }}>
                      Cada unidade enche o tanque INTEIRO do barco. Compre nos postos ⛽ do mapa
                      ou aqui. Você tem <b style={{ color: "#ffd94d" }}>{oil ?? 0}</b> unidade(s).
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <BoatBtn label={`×1 · ${OIL_PRICE_GOLD} 🪙`} color="#c98a4b" onClick={() => onBuyOil(1)} />
                    <BoatBtn label={`×5 · ${OIL_PRICE_GOLD * 5} 🪙`} color="#c98a4b" onClick={() => onBuyOil(5)} />
                    <BoatBtn label={`×20 · ${OIL_PRICE_GOLD * 20} 🪙`} color="#e0a85b" onClick={() => onBuyOil(20)} />
                  </div>
                </div>

                {/* Grade de cascos */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
                  {BOATS.map((b) => {
                    const m = BOAT_TIER_META[b.tier];
                    const owned = ship?.tier === b.tier;
                    const rank: Record<BoatTier, number> = { comum: 0, raro: 1, epico: 2, lendario: 3 };
                    const worse = ship?.tier && rank[ship.tier] >= rank[b.tier];
                    const canGold = (gold ?? 0) >= b.priceGold;
                    const canPep = (pepitas ?? 0) >= b.pricePepitas;
                    return (
                      <div
                        key={b.id}
                        style={{
                          ...cut(14), overflow: "hidden",
                          border: `2px solid ${m.neon}`,
                          background: `linear-gradient(160deg, ${m.wood}3d, rgba(14,8,4,0.94) 62%)`,
                          boxShadow: owned ? `0 0 26px ${m.glow}, inset 0 0 26px ${m.neon}22` : `0 0 12px ${m.glow}`,
                          opacity: worse && !owned ? 0.55 : 1,
                        }}
                      >
                        <div style={{ height: 3, background: `linear-gradient(90deg, transparent, ${m.neon}, transparent)` }} />
                        <div style={{ padding: "10px 12px 12px" }}>
                          <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                            <div
                              style={{
                                width: 46, height: 62, flexShrink: 0,
                                backgroundImage: `url("${BOAT_SHOP_ICON}")`,
                                backgroundSize: "contain",
                                backgroundRepeat: "no-repeat",
                                backgroundPosition: "center",
                                filter: `drop-shadow(0 0 6px ${m.glow})`,
                                imageRendering: "pixelated",
                              }}
                            />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 4 }}>
                                <span style={{ fontSize: 9, fontWeight: 900, fontFamily: MONO, letterSpacing: 1, color: "#2a1408", background: m.neon, padding: "2px 7px" }}>
                                  {m.label}
                                </span>
                                {owned && <span style={{ fontSize: 9, fontFamily: MONO, color: "#7cffb2" }}>✔</span>}
                              </div>
                              <div style={{ color: "#fff", fontSize: 14, fontWeight: 900, marginTop: 6 }}>{b.name}</div>
                            </div>
                          </div>
                          <div style={{ color: "#a98a6b", fontSize: 9.5, marginTop: 6, lineHeight: 1.5, minHeight: 30 }}>{b.desc}</div>

                          <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
                            <span style={{ fontSize: 9, fontFamily: MONO, color: "#7cffb2", border: "1px solid #7cffb255", padding: "2px 6px" }}>🔧 {b.hp} HP</span>
                            <span style={{ fontSize: 9, fontFamily: MONO, color: "#ffb347", border: "1px solid #ffb34755", padding: "2px 6px" }}>⛽ {b.fuelSec}s</span>
                            <span style={{ fontSize: 9, fontFamily: MONO, color: "#7fd8ff", border: "1px solid #7fd8ff55", padding: "2px 6px" }}>⚡ {b.speed.toFixed(2)}×</span>
                            <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 9, fontFamily: MONO, color: "#c98a4b", border: "1px solid #c98a4b55", padding: "1px 6px" }}>
                              <img src={OIL_ICON} alt="" style={{ width: 11, height: 11, objectFit: "contain", imageRendering: "pixelated" }} />
                              {b.oilPerTank} Óleo
                            </span>
                          </div>

                          <div style={{ marginTop: 10, paddingTop: 8, borderTop: `1px solid ${m.neon}44`, display: "flex", flexDirection: "column", gap: 4 }}>
                            <span style={{ fontSize: 10, fontFamily: MONO, color: canGold ? "#ffd94d" : "#ff6b6b" }}>
                              🪙 {b.priceGold.toLocaleString("pt-BR")} {canGold ? "" : "(faltam)"}
                            </span>
                            {b.pricePepitas > 0 && (
                              <span style={{ fontSize: 10, fontFamily: MONO, color: canPep ? "#ffd94d" : "#ff6b6b" }}>
                                🥇 {b.pricePepitas} Pepitas de Ouro {canPep ? "" : "(faltam)"}
                              </span>
                            )}
                          </div>

                          <BoatBtn
                            label={owned ? "EM USO" : worse ? "INFERIOR AO SEU" : b.tier === "lendario" ? "CONSTRUIR AURORA" : "CONSTRUIR"}
                            color={m.neon}
                            onClick={() => onBuyBoat(b.tier)}
                            disabled={owned || !!worse}
                            wide
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ---------- ANCESTRAL (enciclopédia de Pokémon raros) ---------- */}
            {tab === "ancestral" && (
              <div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    flexWrap: "wrap",
                    marginBottom: 4,
                  }}
                >
                  <span style={{ color: "#c98cff", fontSize: 12, fontWeight: 900, letterSpacing: 2, fontFamily: MONO }}>
                    💠 ENCICLOPÉDIA ANCESTRAL
                  </span>
                  <span
                    style={{
                      fontSize: 10,
                      fontFamily: MONO,
                      color: "#04141a",
                      background: "#c98cff",
                      borderRadius: 10,
                      padding: "2px 8px",
                      fontWeight: 900,
                      letterSpacing: 1,
                      boxShadow: "0 0 14px rgba(201,140,255,0.7)",
                    }}
                  >
                    {ANCESTRAL_ENTRIES.length} REGISTROS
                  </span>
                </div>
                <div style={{ color: "#8ba0b2", fontSize: 11, marginBottom: 12, lineHeight: 1.6 }}>
                  Modelos de coleção para o treinador conhecer. Raridade extrema e alta: existem, valem a
                  estudo e cada um tem o seu ovo. Nenhum destes Pokémon é adicionado ao jogo por aqui.
                </div>

                {/* Bônus econômicos universais */}
                <div
                  style={{
                    ...cut(12),
                    border: "1px solid rgba(201,140,255,0.45)",
                    background: "linear-gradient(135deg, rgba(201,140,255,0.10), rgba(53,224,255,0.05))",
                    padding: 12,
                    marginBottom: 14,
                  }}
                >
                  <div style={{ color: "#e0a8ff", fontSize: 11, fontWeight: 900, letterSpacing: 1.5, fontFamily: MONO, marginBottom: 8 }}>
                    BÔNUS ECONÔMICOS UNIVERSAIS · TODOS OS 17
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 8 }}>
                    {UNIVERSAL_BONUS.map((b) => (
                      <div
                        key={b.label}
                        style={{
                          ...cut(8),
                          background: "rgba(0,0,0,0.4)",
                          border: "1px solid rgba(201,140,255,0.3)",
                          padding: "8px 10px",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                          <span style={{ color: "#ffd94d", fontSize: 15, fontWeight: 900, fontFamily: MONO }}>{b.value}</span>
                          <span style={{ color: "#cfe4f2", fontSize: 10, fontWeight: 700 }}>{b.label}</span>
                        </div>
                        <div style={{ color: "#6f8798", fontSize: 9, marginTop: 2, lineHeight: 1.45 }}>{b.desc}</div>
                      </div>
                    ))}
                    <div
                      style={{
                        ...cut(8),
                        background: "rgba(255,217,77,0.07)",
                        border: "1px solid rgba(255,217,77,0.45)",
                        padding: "8px 10px",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                        <span style={{ color: "#ffd94d", fontSize: 15, fontWeight: 900, fontFamily: MONO }}>5×</span>
                        <span style={{ color: "#cfe4f2", fontSize: 10, fontWeight: 700 }}>Ouro global</span>
                      </div>
                      <div style={{ color: "#6f8798", fontSize: 9, marginTop: 2, lineHeight: 1.45 }}>
                        Implementado à parte do Trait de +50% — validado no balanceamento do servidor.
                      </div>
                    </div>
                  </div>
                  <div style={{ color: "#5f7f8f", fontSize: 9, marginTop: 8, lineHeight: 1.55, fontFamily: MONO }}>
                    {GLOBAL_GOLD_NOTE}
                  </div>
                </div>

                {/* ═══ EGG SELADO ANCESTRAL — ovo ativo, alimentação e selar ═══ */}
                <div
                  style={{
                    ...cut(12),
                    border: sealedEgg ? "2px solid #c98cff" : "1px solid rgba(201,140,255,0.45)",
                    background: "linear-gradient(135deg, rgba(201,140,255,0.14), rgba(10,14,18,0.92) 60%)",
                    padding: 12,
                    marginBottom: 14,
                    boxShadow: sealedEgg ? "0 0 26px rgba(201,140,255,0.35)" : "none",
                  }}
                >
                  <div style={{ color: "#e0a8ff", fontSize: 11, fontWeight: 900, letterSpacing: 1.5, fontFamily: MONO, marginBottom: 8 }}>
                    EGG SELADO ANCESTRAL
                  </div>

                  {sealedEgg ? (() => {
                    const elapsed = Math.max(0, nowMs - sealedEgg.sealedAt);
                    const rem = Math.max(0, HATCH_MS - elapsed);
                    const pct = Math.min(100, (elapsed / HATCH_MS) * 100);
                    const fed = sealedEgg.fed ?? 0;
                    const ready = rem <= 0 || fed >= FED_CAP;
                    const dd = Math.floor(rem / 86_400_000);
                    const hh = Math.floor((rem % 86_400_000) / 3_600_000);
                    const mm = Math.floor((rem % 3_600_000) / 60_000);
                    const kindLbl = sealedEgg.kind === "plus" ? "PLUS" : sealedEgg.kind === "luck" ? "LUCK" : "SELADO";
                    const kindCol = sealedEgg.kind === "plus" ? "#ffd94d" : sealedEgg.kind === "luck" ? "#7cffb2" : "#c98cff";
                    const ancSp = sealedEgg.species as Species;
                    return (
                      <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                        <div style={{ width: 74, height: 74, ...cut(8), background: "rgba(0,0,0,0.5)", border: `2px solid ${kindCol}`, display: "grid", placeItems: "center", boxShadow: `0 0 18px ${kindCol}88`, flexShrink: 0 }}>
                          {gifMap[ancSp] ? (
                            <img src={gifMap[ancSp]} alt={sealedEgg.species} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                          ) : (
                            <span style={{ fontSize: 30 }}>🥚</span>
                          )}
                        </div>
                        <div style={{ flex: 1, minWidth: 210 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                            <span style={{ color: "#fff", fontSize: 14, fontWeight: 900, letterSpacing: 0.6 }}>{String(sealedEgg.species).toUpperCase()}</span>
                            <span style={{ fontSize: 9, fontWeight: 900, fontFamily: MONO, color: "#04141a", background: kindCol, padding: "2px 6px", letterSpacing: 1 }}>OVO {kindLbl}</span>
                          </div>
                          <div style={{ height: 10, background: "rgba(0,0,0,0.55)", border: "1px solid rgba(255,255,255,0.18)", marginTop: 7, position: "relative", overflow: "hidden" }}>
                            <div style={{ position: "absolute", inset: 0, width: `${pct}%`, background: ready ? "linear-gradient(90deg,#7cffb2,#35e0ff)" : `linear-gradient(90deg,${kindCol},#c98cff)`, transition: "width .4s ease" }} />
                          </div>
                              <div style={{ color: ready ? "#7cffb2" : "#ffd94d", fontSize: 11, fontWeight: 800, fontFamily: MONO, marginTop: 5 }}>
                                {ready
                                  ? fed >= FED_CAP ? "PRONTO — 300/300 ESFERAS! LIBERE!" : "PRONTO — LIBERE O ANCESTRAL!"
                                  : `Libera em ${dd}d ${hh}h ${mm}min (3 dias)`}
                              </div>
                              <div style={{ color: "#93a9ba", fontSize: 10, marginTop: 4 }}>
                                Alimentado: <b style={{ color: fed >= FED_CAP ? "#ffd94d" : "#e0a8ff" }}>{fed}/{FED_CAP}</b> esferas · Esferas na mochila: <b style={{ color: "#35e0ff" }}>{esferas ?? 0}</b>
                                {(esferas ?? 0) > 0 && fed < FED_CAP ? " · 300/300 = choca antes do tempo" : ""}
                              </div>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 7, minWidth: 176 }}>
                          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 5 }}>
                            {[1, 10, 50, "MÁX"].map((b) => {
                              const canFeed = (esferas ?? 0) > 0 && fed < FED_CAP;
                              const qty = b === "MÁX" ? Math.max(1, Math.min(esferas ?? 0, FED_CAP - fed)) : (b as number);
                              return (
                                <button
                                  key={String(b)}
                                  onClick={() => onFeedSealedEgg(qty)}
                                  disabled={!canFeed}
                                  style={{
                                    ...cut(5), padding: "8px 0", fontWeight: 900, fontSize: 10, letterSpacing: 1, fontFamily: MONO,
                                    cursor: canFeed ? "pointer" : "not-allowed",
                                    color: "#04141a", border: "none",
                                    background: canFeed ? "#35e0ff" : "#2a3b47",
                                    boxShadow: canFeed ? "0 0 12px rgba(53,224,255,0.5)" : "none",
                                    opacity: canFeed ? 1 : 0.6,
                                  }}
                                >
                                  {b === "MÁX" ? "MÁX" : `+${b}`}
                                </button>
                              );
                            })}
                          </div>
                          <div style={{ color: "#93a9ba", fontSize: 9, textAlign: "center", fontFamily: MONO }}>🫧 ALIMENTAR COM ESFERAS</div>
                          <button
                            onClick={onHatchSealedEgg}
                            disabled={!ready}
                            style={{
                              ...cut(6), padding: "9px 0", fontWeight: 900, fontSize: 10.5, letterSpacing: 1.4, fontFamily: MONO,
                              cursor: ready ? "pointer" : "not-allowed",
                              color: ready ? "#04141a" : "#8ba0b2", border: "none",
                              background: ready ? "#ffd94d" : "#22303a",
                              boxShadow: ready ? "0 0 22px rgba(255,217,77,0.6)" : "none",
                              opacity: ready ? 1 : 0.7,
                            }}
                          >
                            {ready ? "🐣 LIBERAR ANCESTRAL" : "🔒 AINDA SELADO"}
                          </button>
                        </div>
                      </div>
                    );
                  })() : (() => {
                    const opts = [
                      { id: "egg_anc_selado", label: "SELADO", img: eggSeladoUrl, col: "#c98cff", hint: "≥12 traits", n: ancEggCounts?.selado ?? 0 },
                      { id: "egg_anc_plus", label: "PLUS", img: eggPlusUrl, col: "#ffd94d", hint: "16 traits", n: ancEggCounts?.plus ?? 0 },
                      { id: "egg_anc_luck", label: "LUCK", img: eggLuckUrl, col: "#7cffb2", hint: "+3 DOURADOS", n: ancEggCounts?.luck ?? 0 },
                    ];
                    const totalOvos = opts.reduce((s, o) => s + o.n, 0);
                    return (
                      <div>
                        <div style={{ color: "#93a9ba", fontSize: 10.5, lineHeight: 1.6, marginBottom: 8 }}>
                          Toque num <b style={{ color: "#e0a8ff" }}>card do ancestral</b> abaixo para ver as infos e selar direto no card de ovos dele ·
                          O ovo libera em <b>3 DIAS</b> (ou já, com <b>300 Esferas</b>) — e libera EXATAMENTE o escolhido.
                        </div>

                        {/* Ovos na mochila — só ilustração, com os ícones da pasta */}
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(155px, 1fr))", gap: 8 }}>
                          {opts.map((o) => (
                            <div key={o.id} style={{ ...cut(8), background: "rgba(0,0,0,0.42)", border: `1px solid ${o.n > 0 ? `${o.col}88` : "rgba(255,255,255,0.14)"}`, padding: "8px 10px", display: "flex", alignItems: "center", gap: 9 }}>
                              <img src={o.img} alt="" style={{ width: 40, height: 40, objectFit: "contain", filter: o.n > 0 ? `drop-shadow(0 0 8px ${o.col})` : "grayscale(1)", opacity: o.n > 0 ? 1 : 0.5 }} />
                              <div>
                                <div style={{ color: o.col, fontSize: 10, fontWeight: 900, fontFamily: MONO }}>OVO {o.label}</div>
                                <div style={{ color: o.n > 0 ? "#7cffb2" : "#6f8798", fontSize: 9 }}>na mochila: {o.n} · {o.hint}</div>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* origem dos ovos */}
                        <div style={{ marginTop: 10, ...cut(8), background: "rgba(255,217,77,0.07)", border: "1px dashed rgba(255,217,77,0.45)", padding: "9px 11px", color: "#5f7f8f", fontSize: 9, lineHeight: 1.55 }}>
                          Sem ovos? Toque num card do ancestral e use <b style={{ color: "#ffd94d" }}>SELAR</b> lá. PLUS e LUCK saem do <b style={{ color: "#ffd94d" }}>BAÚ ANCESTRAL</b> (aba INCUBADORA — 1 🎫 Ticket do admin).
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Grade de cards NFT */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
                    gap: 12,
                  }}
                >
                  {ANCESTRAL_ENTRIES.map((e) => {
                    const tier = TIER_META[e.tier];
                    const ancTotal = (ancEggCounts?.selado ?? 0) + (ancEggCounts?.plus ?? 0) + (ancEggCounts?.luck ?? 0);
                    return (
                      <button
                        key={e.id}
                        onClick={() => setAncestralOpen(e)}
                        style={{
                          ...cut(14),
                          position: "relative",
                          cursor: "pointer",
                          textAlign: "left",
                          padding: 0,
                          background: `linear-gradient(160deg, ${e.accent}22, rgba(0,0,0,0.92) 55%)`,
                          border: `2px solid ${e.accent}`,
                          boxShadow: `0 0 18px ${tier.glow}, inset 0 0 22px ${e.accent}18`,
                          color: "#fff",
                          overflow: "hidden",
                          transition: "transform .12s ease, box-shadow .12s ease",
                        }}
                        onMouseEnter={(ev) => {
                          ev.currentTarget.style.transform = "translateY(-3px) scale(1.02)";
                          ev.currentTarget.style.boxShadow = `0 0 34px ${tier.glow}, inset 0 0 28px ${e.accent}30`;
                        }}
                        onMouseLeave={(ev) => {
                          ev.currentTarget.style.transform = "none";
                          ev.currentTarget.style.boxShadow = `0 0 18px ${tier.glow}, inset 0 0 22px ${e.accent}18`;
                        }}
                      >
                        {/* moldura holográfica superior */}
                        <div
                          style={{
                            height: 3,
                            background: `linear-gradient(90deg, transparent, ${e.accent}, transparent)`,
                          }}
                        />
                        <div style={{ position: "relative", height: 150, background: "rgba(0,0,0,0.55)", overflow: "hidden" }}>
                          {e.image ? (
                            <img
                              src={e.image}
                              alt={e.name}
                              style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
                            />
                          ) : (
                            <div style={{ height: "100%", display: "grid", placeItems: "center", color: e.accent, fontSize: 40, opacity: 0.5 }}>
                              ❔
                            </div>
                          )}
                          <div
                            style={{
                              position: "absolute",
                              top: 6,
                              left: 8,
                              fontSize: 9,
                              fontWeight: 900,
                              fontFamily: MONO,
                              color: "#04141a",
                              background: tier.color,
                              padding: "2px 6px",
                              letterSpacing: 1,
                              boxShadow: `0 0 12px ${tier.glow}`,
                            }}
                          >
                            {tier.label}
                          </div>
                          <div
                            style={{
                              position: "absolute",
                              top: 6,
                              right: 8,
                              fontSize: 9,
                              fontWeight: 900,
                              fontFamily: MONO,
                              color: e.accent,
                              background: "rgba(0,0,0,0.7)",
                              border: `1px solid ${e.accent}`,
                              padding: "2px 5px",
                            }}
                          >
                            #{String(e.number).padStart(2, "0")}
                          </div>
                        </div>

                        <div style={{ padding: "10px 12px 12px" }}>
                          <div style={{ color: "#fff", fontSize: 13, fontWeight: 900, letterSpacing: 0.4, lineHeight: 1.2 }}>
                            {e.name}
                          </div>
                          <div style={{ color: tier.color, fontSize: 9, fontWeight: 700, fontFamily: MONO, marginTop: 3, letterSpacing: 0.6 }}>
                            {e.types.join(" / ").toUpperCase()}
                          </div>
                          <div style={{ color: "#93a9ba", fontSize: 9.5, marginTop: 6, lineHeight: 1.45, minHeight: 28 }}>
                            {e.specialty}
                          </div>
                          <div
                            style={{
                              marginTop: 8,
                              paddingTop: 7,
                              borderTop: `1px solid ${e.accent}44`,
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              gap: 6,
                            }}
                          >
                            <span style={{ color: "#cfe4f2", fontSize: 9, fontWeight: 700 }}>
                              TRAIT · <span style={{ color: e.accent }}>{e.trait}</span>
                            </span>
                            <span
                              style={{
                                fontSize: 10,
                                filter: ancTotal > 0
                                  ? "drop-shadow(0 0 8px rgba(255,217,77,1)) drop-shadow(0 0 18px rgba(255,217,77,0.8))"
                                  : "grayscale(0.8)",
                                opacity: ancTotal > 0 ? 1 : 0.5,
                              }}
                              title={ancTotal > 0 ? `${eggNameFor(e.name)} — você tem ovo! Clique e SELAR.` : eggNameFor(e.name)}
                            >
                              🥚
                            </span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div style={{ color: "#5f7f8f", fontSize: 9, marginTop: 12, lineHeight: 1.55, fontFamily: MONO }}>
                  {EGG_NOTE}
                </div>

                {/* ---------- MODAL DE DETALHES ---------- */}
                {ancestralOpen && (() => {
                  const d = ancestralOpen;
                  const dt = TIER_META[d.tier];
                  return (
                    <div
                      onClick={() => setAncestralOpen(null)}
                      style={{
                        position: "fixed",
                        inset: 0,
                        zIndex: 10090,
                        background: "rgba(0,0,0,0.82)",
                        display: "grid",
                        placeItems: "center",
                        padding: 12,
                      }}
                    >
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="profScroll"
                        style={{
                          ...cut(18),
                          width: "min(720px, 100%)",
                          maxHeight: "min(86vh, 860px)",
                          overflow: "auto",
                          background: `linear-gradient(165deg, ${d.accent}1f, #060b10 60%)`,
                          border: `2px solid ${d.accent}`,
                          boxShadow: `0 0 40px ${dt.glow}`,
                          padding: 18,
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "flex-start", gap: 14, flexWrap: "wrap" }}>
                          {/* arte */}
                          <div
                            style={{
                              position: "relative",
                              width: 168,
                              height: 168,
                              flexShrink: 0,
                              background: "rgba(0,0,0,0.6)",
                              border: `2px solid ${d.accent}`,
                              boxShadow: `0 0 26px ${dt.glow}, inset 0 0 26px ${d.accent}22`,
                              display: "grid",
                              placeItems: "center",
                              overflow: "hidden",
                            }}
                          >
                            {d.image ? (
                              <img src={d.image} alt={d.name} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                            ) : (
                              <span style={{ fontSize: 48, color: d.accent, opacity: 0.5 }}>❔</span>
                            )}
                            <div
                              style={{
                                position: "absolute",
                                bottom: 0,
                                left: 0,
                                right: 0,
                                textAlign: "center",
                                fontSize: 9,
                                fontWeight: 900,
                                fontFamily: MONO,
                                letterSpacing: 2,
                                color: "#04141a",
                                background: dt.color,
                                padding: "3px 0",
                              }}
                            >
                              #{String(d.number).padStart(2, "0")}
                            </div>
                          </div>

                          {/* cabeçalho */}
                          <div style={{ flex: 1, minWidth: 220 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                              <span
                                style={{
                                  fontSize: 9,
                                  fontWeight: 900,
                                  fontFamily: MONO,
                                  letterSpacing: 1,
                                  color: "#04141a",
                                  background: dt.color,
                                  padding: "2px 8px",
                                }}
                              >
                                {dt.label}
                              </span>
                              <span style={{ color: "#6f8798", fontSize: 10, fontFamily: MONO }}>{d.category}</span>
                            </div>
                            <div
                              style={{
                                color: "#fff",
                                fontSize: 24,
                                fontWeight: 900,
                                letterSpacing: 0.5,
                                marginTop: 6,
                                textShadow: `0 0 18px ${dt.glow}`,
                              }}
                            >
                              {d.name}
                            </div>
                            <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
                              {d.types.map((t) => (
                                <span
                                  key={t}
                                  style={{
                                    fontSize: 9,
                                    fontWeight: 900,
                                    fontFamily: MONO,
                                    color: d.accent,
                                    border: `1px solid ${d.accent}`,
                                    padding: "2px 7px",
                                    letterSpacing: 0.5,
                                  }}
                                >
                                  {t}
                                </span>
                              ))}
                            </div>
                            <div style={{ marginTop: 10, fontSize: 10, color: "#93a9ba", lineHeight: 1.5 }}>
                              <span style={{ color: "#5f7f8f", fontWeight: 900 }}>ESPECIALIDADE: </span>
                              {d.specialty}
                            </div>
                            <div
                              style={{
                                marginTop: 10,
                                ...cut(8),
                                border: `1px solid ${d.accent}`,
                                background: `${d.accent}18`,
                                padding: "8px 10px",
                              }}
                            >
                              <div style={{ fontSize: 9, fontWeight: 900, fontFamily: MONO, letterSpacing: 1, color: "#5f7f8f" }}>
                                TRAIT EXCLUSIVO
                              </div>
                              <div style={{ color: d.accent, fontSize: 14, fontWeight: 900, marginTop: 2, textShadow: `0 0 12px ${dt.glow}` }}>
                                {d.trait}
                              </div>
                              <div style={{ color: "#93a9ba", fontSize: 9.5, marginTop: 4, lineHeight: 1.5 }}>
                                Concede todos os bônus econômicos universais da enciclopédia.
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* descrição */}
                        <Section title="DESCRIÇÃO" color={d.accent}>
                          <p style={{ margin: 0, fontSize: 11.5, lineHeight: 1.7, color: "#c6d8e6" }}>{d.description}</p>
                        </Section>

                        {/* habilidades */}
                        <Section title="HABILIDADES" color={d.accent}>
                          <div style={{ display: "grid", gap: 8 }}>
                            {d.abilities.map((a, i) => (
                              <div
                                key={a.name}
                                style={{
                                  display: "flex",
                                  gap: 10,
                                  alignItems: "flex-start",
                                  ...cut(8),
                                  background: "rgba(0,0,0,0.42)",
                                  border: `1px solid ${d.accent}44`,
                                  padding: "8px 10px",
                                }}
                              >
                                <span
                                  style={{
                                    fontSize: 10,
                                    fontWeight: 900,
                                    fontFamily: MONO,
                                    color: "#04141a",
                                    background: d.accent,
                                    minWidth: 18,
                                    height: 18,
                                    display: "grid",
                                    placeItems: "center",
                                    flexShrink: 0,
                                  }}
                                >
                                  {i + 1}
                                </span>
                                <div>
                                  <div style={{ color: "#fff", fontSize: 11.5, fontWeight: 900 }}>{a.name}</div>
                                  <div style={{ color: "#93a9ba", fontSize: 10.5, marginTop: 2, lineHeight: 1.55 }}>{a.text}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </Section>

                        {/* função no jogo */}
                        <Section title="FUNÇÃO NO JOGO" color={d.accent}>
                          <div style={{ fontSize: 11, lineHeight: 1.65, color: "#c6d8e6" }}>{d.role}</div>
                        </Section>

                        {/* ovo — SELAR este ancestral (aqui mesmo, nos cards de ovo) */}
                        <Section title="OVO — SELAR ESTE ANCESTRAL" color="#ffd94d">
                          {(() => {
                            const rows = [
                              { id: "egg_anc_selado", label: "SELADO", img: eggSeladoUrl, col: "#c98cff", n: ancEggCounts?.selado ?? 0, hint: "≥12 traits" },
                              { id: "egg_anc_plus", label: "PLUS", img: eggPlusUrl, col: "#ffd94d", n: ancEggCounts?.plus ?? 0, hint: "16 traits" },
                              { id: "egg_anc_luck", label: "LUCK", img: eggLuckUrl, col: "#7cffb2", n: ancEggCounts?.luck ?? 0, hint: "+3 DOURADOS" },
                            ];
                            const busy = !!sealedEgg;
                            return (
                              <>
                                <div style={{ ...cut(8), background: "rgba(255,217,77,0.07)", border: "1px solid rgba(255,217,77,0.4)", padding: "9px 11px", marginBottom: 8, display: "flex", alignItems: "center", gap: 10 }}>
                                  <span style={{ fontSize: 26, filter: "drop-shadow(0 0 10px rgba(255,217,77,1))" }}>🥚</span>
                                  <div>
                                    <div style={{ color: "#ffd94d", fontSize: 11.5, fontWeight: 900, fontFamily: MONO }}>{eggNameFor(d.name)}</div>
                                    <div style={{ color: "#93a9ba", fontSize: 9.5, marginTop: 2, lineHeight: 1.5 }}>
                                      Sela <b style={{ color: "#fff" }}>{d.name.toUpperCase()}</b> no ovo — libera em <b style={{ color: "#ffd94d" }}>3 DIAS</b> (ou já, com <b>300/300 Esferas</b>) · só um ovo por vez
                                    </div>
                                  </div>
                                </div>
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 8 }}>
                                  {rows.map((r) => {
                                    const can = r.n > 0 && !busy;
                                    return (
                                      <button
                                        key={r.id}
                                        onClick={() => { if (can) { onSealAncestral(r.id, d.id); setAncestralOpen(null); } }}
                                        disabled={!can}
                                        style={{
                                          ...cut(8),
                                          cursor: can ? "pointer" : "not-allowed",
                                          background: r.n > 0 ? `linear-gradient(160deg, ${r.col}33, rgba(0,0,0,0.75))` : "rgba(0,0,0,0.45)",
                                          border: `2px solid ${r.n > 0 ? r.col : "rgba(255,255,255,0.14)"}`,
                                          boxShadow: can ? `0 0 16px ${r.col}aa, inset 0 0 18px ${r.col}22` : "none",
                                          padding: "9px 8px",
                                          color: "#fff",
                                          opacity: can ? 1 : 0.62,
                                          textAlign: "center",
                                        }}
                                      >
                                        <img src={r.img} alt="" style={{ width: 40, height: 40, objectFit: "contain", filter: r.n > 0 ? `drop-shadow(0 0 8px ${r.col})` : "grayscale(1)" }} />
                                        <div style={{ color: r.col, fontSize: 10.5, fontWeight: 900, fontFamily: MONO, letterSpacing: 1, marginTop: 3 }}>OVO {r.label}</div>
                                        <div style={{ color: r.n > 0 ? "#7cffb2" : "#6f8798", fontSize: 9, marginTop: 2 }}>na mochila: {r.n} · {r.hint}</div>
                                        <div style={{ color: can ? "#04141a" : "#5f7f8f", background: can ? r.col : "transparent", fontSize: 9.5, fontWeight: 900, letterSpacing: 1, marginTop: 6, padding: can ? "4px 0" : 0, border: can ? "none" : "1px dashed rgba(255,255,255,0.2)" }}>
                                          {busy ? "OCUPADO — LIBERE O OVO" : r.n > 0 ? `SELAR · ${d.name.toUpperCase()}` : "SEM OVO"}
                                        </div>
                                      </button>
                                    );
                                  })}
                                </div>
                                <div style={{ color: "#5f7f8f", fontSize: 9, marginTop: 7, lineHeight: 1.5 }}>
                                  Sem ovos? PLUS e LUCK saem do BAÚ ANCESTRAL (aba INCUBADORA — 1 🎫 Ticket do admin).
                                </div>
                              </>
                            );
                          })()}
                        </Section>

                        {/* bônus econômicos */}
                        <Section title="BÔNUS ECONÔMICOS" color="#ffd94d">
                          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 7 }}>
                            {UNIVERSAL_BONUS.map((b) => (
                              <div key={b.label} style={{ ...cut(8), background: "rgba(0,0,0,0.42)", border: "1px solid rgba(255,217,77,0.3)", padding: "7px 9px" }}>
                                <div style={{ color: "#ffd94d", fontSize: 13, fontWeight: 900, fontFamily: MONO }}>{b.value}</div>
                                <div style={{ color: "#cfe4f2", fontSize: 9, fontWeight: 700, marginTop: 1 }}>{b.label}</div>
                              </div>
                            ))}
                          </div>
                          <div style={{ color: "#5f7f8f", fontSize: 9, marginTop: 8, lineHeight: 1.55, fontFamily: MONO }}>{GLOBAL_GOLD_NOTE}</div>
                        </Section>

                        <button
                          onClick={() => setAncestralOpen(null)}
                          style={{
                            marginTop: 16,
                            width: "100%",
                            padding: "10px 0",
                            cursor: "pointer",
                            fontWeight: 900,
                            fontSize: 11,
                            letterSpacing: 2,
                            fontFamily: MONO,
                            color: "#04141a",
                            background: d.accent,
                            border: "none",
                            boxShadow: `0 0 20px ${dt.glow}`,
                          }}
                        >
                          FECHAR
                        </button>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* ---------- VIP ---------- */}
            {tab === "vip" && (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)",
                  gap: 12,
                }}
              >
                <div
                  style={{
                    ...cut(12),
                    background:
                      "linear-gradient(160deg, rgba(255,217,77,0.14), rgba(10,14,18,0.9) 60%)",
                    border: "2px solid #ffd94d",
                    padding: 16,
                    boxShadow: "0 0 24px rgba(255,217,77,0.25)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 30 }}>👑</span>
                    <div>
                      <div
                        style={{
                          color: "#ffd94d",
                          fontSize: 20,
                          fontWeight: 900,
                          letterSpacing: 3,
                          fontFamily: MONO,
                        }}
                      >
                        CLUBE VIP
                      </div>
                      <div
                        style={{
                          color: "#c8b890",
                          fontSize: 10,
                          letterSpacing: 1,
                          fontFamily: MONO,
                        }}
                      >
                        STATUS:{" "}
                        {props.vipActive ? (
                          <span style={{ color: "#7ef2a2" }}>
                            ATIVO ·{" "}
                            {props.vipUntil > Date.now()
                              ? `${Math.ceil((props.vipUntil - Date.now()) / 86400000)} dia(s)`
                              : "—"}
                          </span>
                        ) : (
                          <span style={{ color: "#ff8a8a" }}>INATIVO</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 8 }}>
                    {[
                      ["📈", "+30% Ouro e EXP por 30 dias (Livro VIP 30d)"],
                      ["🚀", "+40% Ouro e EXP por 1 ANO (Livro VIP Anual)"],
                      ["🏷️", "Anunciar no Mercado é exclusivo VIP"],
                      ["⭐", "Acesso à quest diária dourada (Coleta Dourada)"],
                      ["🎁", "Bônus extras em pacotes premium"],
                    ].map(([ic, txt]) => (
                      <div
                        key={txt}
                        style={{
                          display: "flex",
                          gap: 8,
                          alignItems: "center",
                          background: "rgba(0,0,0,0.35)",
                          border: "1px solid rgba(255,217,77,0.3)",
                          borderRadius: 6,
                          padding: "7px 10px",
                        }}
                      >
                        <span style={{ fontSize: 15 }}>{ic}</span>
                        <span style={{ color: "#efe3c0", fontSize: 11.5 }}>{txt}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 12, minWidth: 0 }}>
                  <div
                    style={{
                      ...cut(12),
                      background: "rgba(53,224,255,0.06)",
                      border: `1px solid ${CYAN}`,
                      padding: 16,
                    }}
                  >
                    <div
                      style={{
                        color: CYAN,
                        fontSize: 12,
                        fontWeight: 900,
                        letterSpacing: 2,
                        fontFamily: MONO,
                        marginBottom: 10,
                      }}
                    >
                      COMO OBTER O VIP
                    </div>
                    {[
                      [
                        "1️⃣",
                        "LOJA VIP",
                        "Compre os 3 Livros VIP nesta aba com 💎 Cristais — o efeito ativa na hora e o CLUBE VIP acende no perfil.",
                      ],
                      [
                        "2️⃣",
                        "CÓDIGOS",
                        "Resgate códigos promocionais oficiais (ex.: VIP30A/B/C) na aba CONFIG.",
                      ],
                      [
                        "3️⃣",
                        "PACOTES",
                        "Pacotes premium da loja podem trazer Livros VIP junto com ovos e cristais.",
                      ],
                    ].map(([n, t, d]) => (
                      <div
                        key={n}
                        style={{
                          display: "flex",
                          gap: 10,
                          padding: "9px 0",
                          borderBottom: "1px dashed rgba(53,224,255,0.25)",
                        }}
                      >
                        <span style={{ fontSize: 18 }}>{n}</span>
                        <div>
                          <div
                            style={{
                              color: "#eafcff",
                              fontWeight: 900,
                              fontSize: 12,
                              fontFamily: MONO,
                            }}
                          >
                            {t}
                          </div>
                          <div
                            style={{
                              color: "#9ab5c2",
                              fontSize: 11.5,
                              marginTop: 2,
                              lineHeight: 1.45,
                            }}
                          >
                            {d}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div
                    style={{
                      ...cut(12),
                      background: "rgba(255,217,77,0.08)",
                      border: "1px dashed rgba(255,217,77,0.5)",
                      padding: 12,
                      color: "#d8c9a8",
                      fontSize: 11,
                      lineHeight: 1.5,
                    }}
                  >
                    Dica do Professor: o efeito do Livro VIP acumula duração. Ative antes de farmeos
                    longos para aproveitar o bônus de ouro e EXP em cada batalha.
                  </div>
                </div>

                {/* ===== LOJA VIP — compra direta com 💎 cristais (efeito ativa na hora) ===== */}
                <div
                  style={{
                    ...cut(12),
                    gridColumn: "1 / -1",
                    background: "linear-gradient(160deg, rgba(255,217,77,0.10), rgba(10,14,18,0.92) 60%)",
                    border: "1px solid rgba(255,217,77,0.55)",
                    padding: 14,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 8,
                      marginBottom: 10,
                    }}
                  >
                    <div
                      style={{
                        color: "#ffd94d",
                        fontSize: 13,
                        fontWeight: 900,
                        letterSpacing: 2,
                        fontFamily: MONO,
                      }}
                    >
                      LOJA VIP
                    </div>
                    <div style={{ color: CYAN, fontSize: 12, fontFamily: MONO, fontWeight: 700 }}>
                      💎 {(crystals ?? 0).toLocaleString("pt-BR")} cristais
                    </div>
                  </div>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(3, minmax(0,1fr))",
                      gap: 10,
                    }}
                  >
                    {[
                      { id: "book_vip" as VipBookId, name: "EPIC ✦", desc: "+20% ouro e EXP · 1 hora", price: 10_000 },
                      { id: "book_vip_30" as VipBookId, name: "CRISTAL ✦✦", desc: "+30% ouro e EXP · 30 dias", price: 30_000 },
                      { id: "book_vip_60" as VipBookId, name: "GOLD ✦✦✦", desc: "+40% ouro e EXP · 1 ANO", price: 50_000 },
                    ].map((b) => {
                      const can = (crystals ?? 0) >= b.price;
                      return (
                        <button
                          key={b.id}
                          type="button"
                          onClick={() => can && onBuyVipBook?.(b.id)}
                          style={{
                            background: "rgba(0,0,0,0.45)",
                            border: `1px solid ${can ? "rgba(255,217,77,0.7)" : "rgba(255,217,77,0.2)"}`,
                            borderRadius: 8,
                            padding: 12,
                            cursor: can ? "pointer" : "not-allowed",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            gap: 8,
                            fontFamily: MONO,
                          }}
                        >
                          <BookArt id={b.id} size={46} />
                          <div style={{ color: "#ffd94d", fontWeight: 900, fontSize: 12, letterSpacing: 1 }}>
                            Livro VIP {b.name}
                          </div>
                          <div style={{ color: "#efe3c0", fontSize: 10.5, lineHeight: 1.4 }}>{b.desc}</div>
                          <div style={{ color: can ? "#7ef2a2" : "#ff8a8a", fontWeight: 900, fontSize: 12 }}>
                            💎 {b.price.toLocaleString("pt-BR")}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* ---------- PERFIL DE TREINADOR (identidade · prestígio · espiritual) ---------- */}
            {tab === "perfil" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {/* A — cabeçalho de identidade + B — nível/XP */}
                <div
                  style={{
                    ...cut(14),
                    background: "linear-gradient(180deg, rgba(255,217,77,0.10), rgba(0,0,0,0.45))",
                    border: "1px solid rgba(255,217,77,0.55)",
                    boxShadow: "0 0 24px rgba(255,217,77,0.18)",
                    padding: 16,
                    display: "flex",
                    gap: 14,
                    alignItems: "center",
                    flexWrap: "wrap",
                  }}
                >
                  <div
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: 8,
                      border: "2px solid rgba(255,217,77,0.7)",
                      overflow: "hidden",
                      flex: "0 0 auto",
                      background: "rgba(0,0,0,0.45)",
                      display: "grid",
                      placeItems: "center",
                    }}
                  >
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt=""
                        style={{ width: "100%", height: "100%", objectFit: "cover", imageRendering: "pixelated" }}
                      />
                    ) : (
                      <span style={{ fontSize: 26 }}>🧑‍🎤</span>
                    )}
                  </div>

                  <div style={{ minWidth: 0, flex: "1 1 170px" }}>
                    <div
                      style={{
                        color: "#ffe9a3",
                        fontSize: 17,
                        fontWeight: 900,
                        letterSpacing: 2,
                        fontFamily: MONO,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {trainerName || "Treinador"}
                    </div>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 7 }}>
                      <span
                        style={{
                          color: "#04141a",
                          background: CYAN,
                          fontSize: 9.5,
                          fontWeight: 900,
                          letterSpacing: 1,
                          fontFamily: MONO,
                          padding: "2px 7px",
                          borderRadius: 4,
                        }}
                      >
                        NV {trainerLevel ?? 1}
                      </span>
                      <span
                        style={{
                          color: "#120b00",
                          background: patenteInfo.current.color,
                          fontSize: 9.5,
                          fontWeight: 900,
                          letterSpacing: 1,
                          fontFamily: MONO,
                          padding: "2px 7px",
                          borderRadius: 4,
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        <PatenteCrown id={patenteInfo.current.id} size={11} />
                        {patenteInfo.current.name}
                      </span>
                      {vipInfo.active && (
                        <span
                          style={{
                            color: "#241a00",
                            background: "#ffd94d",
                            fontSize: 9.5,
                            fontWeight: 900,
                            letterSpacing: 1,
                            fontFamily: MONO,
                            padding: "2px 7px",
                            borderRadius: 4,
                          }}
                        >
                          VIP {vipInfo.stars}
                        </span>
                      )}
                      <span
                        style={{
                          color: "#0b1116",
                          background: spiritInfo.color,
                          fontSize: 9.5,
                          fontWeight: 900,
                          letterSpacing: 1,
                          fontFamily: MONO,
                          padding: "2px 7px",
                          borderRadius: 4,
                        }}
                      >
                        {spiritInfo.name}
                      </span>
                    </div>
                  </div>

                  {/* B — barra de XP do treinador */}
                  <div style={{ flex: "1 1 220px", minWidth: 190 }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: 9.5,
                        color: "#9ad9ef",
                        fontFamily: MONO,
                        letterSpacing: 1,
                      }}
                    >
                      <span>NÍVEL {trainerLevel ?? 1}</span>
                      <span>
                        {trainerXp ?? 0}/{trainerXpNext ?? 1} XP
                      </span>
                    </div>
                    <div
                      style={{
                        height: 10,
                        background: "rgba(0,0,0,0.55)",
                        border: "1px solid rgba(53,224,255,0.4)",
                        borderRadius: 5,
                        marginTop: 4,
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          height: "100%",
                          width: `${xpPct}%`,
                          background: "linear-gradient(90deg, #2aa9c9, #7ee6ff)",
                          boxShadow: "0 0 8px rgba(53,224,255,0.7)",
                          transition: "width .4s",
                        }}
                      />
                    </div>
                    <div style={{ fontSize: 9, color: "#8ba0b2", marginTop: 4, fontFamily: MONO }}>
                      {xpPct}% para o próximo nível
                    </div>
                  </div>
                </div>

                {/* C · D · E — cards principais (responsivos) */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(min(250px, 100%), 1fr))",
                    gap: 12,
                    alignItems: "stretch",
                  }}
                >
                  {/* C — VIP (3 categorias reais de livro) */}
                  <div
                    style={{
                      ...cut(12),
                      background: "rgba(255,217,77,0.06)",
                      border: `1px solid rgba(255,217,77,${vipInfo.active ? 0.7 : 0.25})`,
                      boxShadow: vipInfo.active ? "0 0 18px rgba(255,217,77,0.25)" : "none",
                      padding: 14,
                      display: "flex",
                      flexDirection: "column",
                    }}
                  >
                    <div
                      style={{
                        color: "#ffd94d",
                        fontSize: 11,
                        fontWeight: 900,
                        letterSpacing: 2,
                        fontFamily: MONO,
                      }}
                    >
                      👑 CLUBE VIP {vipInfo.stars}
                    </div>
                    <div style={{ display: "flex", gap: 8, alignItems: "flex-end", margin: "12px 0 8px" }}>
                      <BookArt id="book_vip" size={34} dim={vipInfo.bookId !== "book_vip"} />
                      <BookArt id="book_vip_30" size={42} dim={vipInfo.bookId !== "book_vip_30"} />
                      <BookArt id="book_vip_60" size={50} dim={vipInfo.bookId !== "book_vip_60"} />
                    </div>
                    <div style={{ fontSize: 10.5, fontFamily: MONO, letterSpacing: 1 }}>
                      {vipInfo.active ? (
                        <span style={{ color: "#7ef2a2" }}>
                          ATIVO · {vipInfo.label} · +{vipInfo.bonusPct}% · {vipInfo.remainingLabel}
                        </span>
                      ) : (
                        <span style={{ color: "#ff8a8a" }}>INATIVO · use um Livro VIP</span>
                      )}
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 10, flex: 1 }}>
                      {(vipInfo.benefits.length
                        ? vipInfo.benefits
                        : [
                            "Venda de Pokémon por Cristais no Mercado",
                            "Missão diária Coleta Dourada (quest VIP)",
                            "Distinção ✦ dourada no seu nome",
                          ]
                      ).map((b) => (
                        <div
                          key={b}
                          style={{
                            display: "flex",
                            gap: 7,
                            alignItems: "center",
                            background: "rgba(0,0,0,0.35)",
                            border: "1px solid rgba(255,217,77,0.25)",
                            borderRadius: 5,
                            padding: "6px 8px",
                            fontSize: 10,
                            color: vipInfo.active ? "#efe3c0" : "#9c947e",
                          }}
                        >
                          <span>✦</span>
                          <span>{b}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* D — alinhamento espiritual */}
                  <div
                    style={{
                      ...cut(12),
                      background:
                        spiritInfo.id === "luz"
                          ? "rgba(255,233,163,0.07)"
                          : spiritInfo.id === "sombras"
                            ? "rgba(139,92,240,0.10)"
                            : "rgba(126,230,255,0.06)",
                      border: `1px solid ${spiritInfo.color}aa`,
                      boxShadow: `0 0 16px ${spiritInfo.color}44`,
                      padding: 14,
                      display: "flex",
                      flexDirection: "column",
                    }}
                  >
                    <div
                      style={{
                        color: spiritInfo.color,
                        fontSize: 11,
                        fontWeight: 900,
                        letterSpacing: 2,
                        fontFamily: MONO,
                      }}
                    >
                      ✨ ALINHAMENTO ESPIRITUAL
                    </div>

                    <div style={{ display: "grid", placeItems: "center", margin: "10px 0 4px" }}>
                      <SpiritWings state={spiritInfo.id} size={34} />
                    </div>
                    <div
                      style={{
                        color: spiritInfo.color,
                        fontSize: 16,
                        fontWeight: 900,
                        letterSpacing: 3,
                        fontFamily: MONO,
                        textAlign: "center",
                      }}
                    >
                      {spiritInfo.name}
                    </div>
                    <div style={{ color: "#a9bccb", fontSize: 10, textAlign: "center", marginTop: 3 }}>
                      {spiritInfo.desc}
                    </div>

                    {/* medidor -100..+100 com marcas em ±20 */}
                    <div style={{ marginTop: 12 }}>
                      <div
                        style={{
                          position: "relative",
                          height: 12,
                          borderRadius: 6,
                          background:
                            "linear-gradient(90deg, #6d28d9 0%, #b48cff 30%, #7ee6ff 50%, #ffe9a3 70%, #f2c94c 100%)",
                          border: "1px solid rgba(255,255,255,0.25)",
                        }}
                      >
                        <span
                          style={{
                            position: "absolute",
                            left: "40%",
                            top: 0,
                            bottom: 0,
                            width: 1,
                            background: "rgba(0,0,0,0.5)",
                          }}
                        />
                        <span
                          style={{
                            position: "absolute",
                            left: "60%",
                            top: 0,
                            bottom: 0,
                            width: 1,
                            background: "rgba(0,0,0,0.5)",
                          }}
                        />
                        <span
                          style={{
                            position: "absolute",
                            left: `calc(${spiritPos}% - 7px)`,
                            top: -3,
                            width: 14,
                            height: 18,
                            borderRadius: 4,
                            background: "#fff",
                            border: "2px solid #0b0b12",
                            boxShadow: `0 0 10px ${spiritInfo.color}`,
                            transition: "left .4s",
                          }}
                        />
                      </div>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          fontSize: 8.5,
                          color: "#8ba0b2",
                          fontFamily: MONO,
                          letterSpacing: 1,
                          marginTop: 4,
                        }}
                      >
                        <span>SOMBRAS −100</span>
                        <span style={{ color: spiritInfo.color, fontWeight: 900 }}>
                          {(spiritScore ?? 0) > 0 ? "+" : ""}
                          {spiritScore ?? 0}
                        </span>
                        <span>LUZ +100</span>
                      </div>
                    </div>

                    {/* como evoluir (regras reais, centralizadas) */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 5, marginTop: 10 }}>
                      {Object.values(SPIRIT_RULES).map((r) => (
                        <div
                          key={r.kind}
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            gap: 8,
                            background: "rgba(0,0,0,0.35)",
                            border: `1px solid ${spiritInfo.color}33`,
                            borderRadius: 5,
                            padding: "5px 8px",
                            fontSize: 9.5,
                            color: "#cfe4ef",
                          }}
                        >
                          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {r.label}
                          </span>
                          <span style={{ color: "#7ef2a2", fontWeight: 900, fontFamily: MONO }}>
                            +{r.delta}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* histórico */}
                    <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 4 }}>
                      {(spiritLog ?? []).length === 0 ? (
                        <div style={{ fontSize: 9.5, color: "#8ba0b2", fontStyle: "italic" }}>
                          Nenhuma decisão registrada ainda — conclua missões para moldar seu caminho.
                        </div>
                      ) : (
                        (spiritLog ?? []).slice(0, 3).map((e, i) => (
                          <div
                            key={`${e.at}-${i}`}
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              gap: 8,
                              fontSize: 9,
                              color: "#9ad9ef",
                              fontFamily: MONO,
                            }}
                          >
                            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {e.delta > 0 ? "+" : ""}
                              {e.delta} · {e.label}
                            </span>
                            <span style={{ color: "#6d8494", flex: "0 0 auto" }}>
                              {new Date(e.at).toLocaleString("pt-BR", {
                                day: "2-digit",
                                month: "2-digit",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* E — patente (derivada: nível + missões + feitos) */}
                  <div
                    style={{
                      ...cut(12),
                      background: `${patenteInfo.current.color}12`,
                      border: `1px solid ${patenteInfo.current.color}bb`,
                      boxShadow: `0 0 18px ${patenteInfo.current.color}33`,
                      padding: 14,
                      display: "flex",
                      flexDirection: "column",
                    }}
                  >
                    <div
                      style={{
                        color: patenteInfo.current.color,
                        fontSize: 11,
                        fontWeight: 900,
                        letterSpacing: 2,
                        fontFamily: MONO,
                      }}
                    >
                      🏆 PATENTE
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "10px 0 4px" }}>
                      <PatenteCrown id={patenteInfo.current.id} size={38} />
                      <div>
                        <div
                          style={{
                            color: patenteInfo.current.color,
                            fontSize: 17,
                            fontWeight: 900,
                            letterSpacing: 2,
                            fontFamily: MONO,
                          }}
                        >
                          {patenteInfo.current.name}
                        </div>
                        <div style={{ color: "#a9bccb", fontSize: 9.5 }}>{patenteInfo.current.desc}</div>
                      </div>
                    </div>

                    {patenteInfo.isMax ? (
                      <div
                        style={{
                          marginTop: 10,
                          background: "rgba(127,240,162,0.12)",
                          border: "1px solid rgba(127,240,162,0.5)",
                          borderRadius: 6,
                          padding: "8px 10px",
                          color: "#7ef2a2",
                          fontSize: 10.5,
                          fontWeight: 900,
                          letterSpacing: 1,
                          fontFamily: MONO,
                          textAlign: "center",
                        }}
                      >
                        ✓ PATENTE MÁXIMA ALCANÇADA
                      </div>
                    ) : (
                      <>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            fontSize: 9,
                            color: "#8ba0b2",
                            fontFamily: MONO,
                            letterSpacing: 1,
                            marginTop: 8,
                          }}
                        >
                          <span>PRÓXIMA: {patenteInfo.next?.name}</span>
                          <span>{patenteInfo.progressPct}%</span>
                        </div>
                        <div
                          style={{
                            height: 8,
                            background: "rgba(0,0,0,0.55)",
                            border: "1px solid rgba(255,255,255,0.2)",
                            borderRadius: 4,
                            marginTop: 4,
                            overflow: "hidden",
                          }}
                        >
                          <div
                            style={{
                              height: "100%",
                              width: `${patenteInfo.progressPct}%`,
                              background: patenteInfo.current.color,
                              boxShadow: `0 0 8px ${patenteInfo.current.color}`,
                              transition: "width .4s",
                            }}
                          />
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 5, marginTop: 10 }}>
                          {patenteInfo.checks.map((c) => (
                            <div
                              key={c.label}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 7,
                                background: "rgba(0,0,0,0.35)",
                                border: `1px solid ${c.ok ? "rgba(127,240,162,0.4)" : "rgba(255,138,138,0.3)"}`,
                                borderRadius: 5,
                                padding: "5px 8px",
                                fontSize: 9.5,
                                color: c.ok ? "#bdf5d0" : "#e7b1b1",
                              }}
                            >
                              <span style={{ fontWeight: 900 }}>{c.ok ? "✓" : "✗"}</span>
                              <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {c.label}
                              </span>
                              <span style={{ fontFamily: MONO, color: c.ok ? "#7ef2a2" : "#ff8a8a" }}>
                                {c.need <= 0 ? "—" : `${c.have}/${c.need}`}
                              </span>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                    {/* 🎁 Prêmio de 7 dias da patente atual (spec: ciclo semanal) */}
                    {(() => {
                      const prize = patenteInfo.current.prize;
                      const ready = patentePrizeReady(patentePrizeAt, nowMs);
                      const itemLabels: Record<string, string> = {
                        esfera_safira: "Esfera de Safira",
                        egg_anc_selado: "Egg Selado Ancestral",
                      };
                      const parts: string[] = [];
                      if (prize.gold) parts.push(`🪙 ${prize.gold.toLocaleString("pt-BR")} ouro`);
                      if (prize.crystals) parts.push(`💎 ${prize.crystals} cristais`);
                      for (const [k, v] of Object.entries(prize.items ?? {})) parts.push(`${itemLabels[k] ?? k} ×${v}`);
                      return (
                        <div
                          style={{
                            ...cut(8),
                            marginTop: 10,
                            background: ready ? "rgba(127,240,162,0.10)" : "rgba(0,0,0,0.35)",
                            border: `1px solid ${ready ? "rgba(127,240,162,0.55)" : "rgba(255,255,255,0.16)"}`,
                            boxShadow: ready ? "0 0 16px rgba(127,240,162,0.28)" : "none",
                            padding: "9px 10px",
                          }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                            <span style={{ color: "#ffd94d", fontSize: 10, fontWeight: 900, letterSpacing: 1.4, fontFamily: MONO }}>
                              🎁 PRÊMIO DE 7 DIAS
                            </span>
                            <span style={{ color: ready ? "#7ef2a2" : "#8ba0b2", fontSize: 9.5, fontWeight: 900, fontFamily: MONO }}>
                              {ready ? "PRONTO" : patentePrizeLabel(patentePrizeAt, nowMs)}
                            </span>
                          </div>
                          <div style={{ color: "#cfe4f2", fontSize: 9.5, marginTop: 5, lineHeight: 1.55 }}>
                            {parts.join(" · ")}
                          </div>
                          <button
                            onClick={() => { if (ready) onClaimPatentePrize?.(); }}
                            disabled={!ready}
                            style={{
                              width: "100%",
                              marginTop: 7,
                              padding: "7px 0",
                              border: "none",
                              cursor: ready ? "pointer" : "not-allowed",
                              fontWeight: 900,
                              fontSize: 10,
                              letterSpacing: 1.6,
                              fontFamily: MONO,
                              color: ready ? "#04141a" : "#6d8494",
                              background: ready ? "#7ef2a2" : "#22303a",
                              boxShadow: ready ? "0 0 18px rgba(127,240,162,0.5)" : "none",
                              opacity: ready ? 1 : 0.7,
                            }}
                          >
                            {ready ? "RESGATAR PRÊMIO" : `AGUARDE · ${patentePrizeLabel(patentePrizeAt, nowMs)}`}
                          </button>
                        </div>
                      );
                    })()}
                    <div style={{ fontSize: 8.5, color: "#6d8494", marginTop: 8, lineHeight: 1.5 }}>
                      Patente calculada a partir do seu save (nível, missões concluídas, derrotas e
                      capturas). Nada pode ser alterado por aqui.
                    </div>
                  </div>
                </div>

                {/* F — estatísticas / feitos reais */}
                <div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      color: "#ffd94d",
                      fontSize: 10,
                      fontWeight: 900,
                      letterSpacing: 2,
                      fontFamily: MONO,
                      marginBottom: 7,
                    }}
                  >
                    <span style={{ width: 3, height: 12, background: "#ffd94d", boxShadow: "0 0 8px #ffd94d" }} />
                    FEITOS
                  </div>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(min(110px, 100%), 1fr))",
                      gap: 8,
                    }}
                  >
                    {statTile("⚔️", "DERROTAS", String(kills), "#ff9558")}
                    {statTile("🔴", "CAPTURAS", String(captures), "#ff8a8a")}
                    {statTile("📚", "ESPÉCIES", `${(caughtSpecies ?? []).length}/${(seenSpecies ?? []).length}`, "#7ee6ff")}
                    {statTile("📜", "MISSÕES", String(questTotal), "#7ef2a2")}
                    {statTile("🪙", "OURO TOTAL", String(goldTotal), "#ffd94d")}
                    {statTile("⏳", "DIAS", String(journeyDays), "#c98cff")}
                  </div>
                </div>
              </div>
            )}

            {/* ---------- INCUBADORA ---------- */}
            {tab === "incubadora" && (
              <div>
                <div
                  style={{
                    color: CYAN,
                    fontSize: 12,
                    fontWeight: 900,
                    letterSpacing: 2,
                    fontFamily: MONO,
                  }}
                >
                  🥚 INCUBADORA
                </div>
                <div style={{ color: "#8ba0b2", fontSize: 11, marginTop: 4, marginBottom: 12 }}>
                  Ícones ilustrativos — cada slot abaixo aceita sua imagem (preencha o objeto IMG
                  neste arquivo).
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
                    gap: 12,
                  }}
                >
                  {INCUB_SLOTS.map((s) => {
                    const src = IMG[s.key];
                    return (
                      <div
                        key={s.key}
                        style={{
                          ...cut(10),
                          background: "rgba(53,224,255,0.05)",
                          border: "1px solid rgba(53,224,255,0.4)",
                          padding: 12,
                          textAlign: "center",
                        }}
                      >
                        <div
                          style={{
                            width: 96,
                            height: 96,
                            margin: "0 auto",
                            display: "grid",
                            placeItems: "center",
                            border: "2px dashed rgba(53,224,255,0.55)",
                            borderRadius: 10,
                            background: "rgba(0,0,0,0.45)",
                            overflow: "hidden",
                          }}
                        >
                          {src ? (
                            <img
                              src={src}
                              alt={s.name}
                              style={{ width: "100%", height: "100%", objectFit: "cover" }}
                            />
                          ) : (
                            <div>
                              <div style={{ fontSize: 34 }}>{s.icon}</div>
                              <div
                                style={{
                                  color: "#4f7585",
                                  fontSize: 8,
                                  fontFamily: MONO,
                                  marginTop: 2,
                                }}
                              >
                                IMG AQUI
                              </div>
                            </div>
                          )}
                        </div>
                        <div
                          style={{
                            color: "#eafcff",
                            fontSize: 12,
                            fontWeight: 900,
                            marginTop: 10,
                            fontFamily: MONO,
                            letterSpacing: 1,
                          }}
                        >
                          {s.name}
                        </div>
                        <div
                          style={{ color: "#9ab5c2", fontSize: 11, marginTop: 6, lineHeight: 1.45 }}
                        >
                          {s.desc}
                        </div>
                      </div>
                    );
                  })}
                </div>
                {/* ═══ ANCESTRAIS — ilustração dos ovos + BAÚ (única fonte Plus/Luck) ═══ */}
                <div
                  style={{
                    ...cut(10),
                    marginTop: 14,
                    background: "linear-gradient(135deg, rgba(201,140,255,0.10), rgba(53,224,255,0.05))",
                    border: "1px solid rgba(201,140,255,0.45)",
                    padding: 12,
                  }}
                >
                  <div style={{ color: "#e0a8ff", fontSize: 11, fontWeight: 900, letterSpacing: 1.5, fontFamily: MONO, marginBottom: 9 }}>
                    🥚 OVOS ANCESTRAIS — INCUBAM NA ABA ANCESTRAL
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 8 }}>
                    {[
                      { key: "selado", img: eggSeladoUrl, name: "EGG SELADO", col: "#c98cff", desc: "≥12 traits. Vem de eventos/premios do admin.", n: ancEggCounts?.selado ?? 0 },
                      { key: "plus", img: eggPlusUrl, name: "ANCESTRAL PLUS", col: "#ffd94d", desc: "16 traits. Só do Baú Ancestral.", n: ancEggCounts?.plus ?? 0 },
                      { key: "luck", img: eggLuckUrl, name: "ANCESTRAL LUCK", col: "#7cffb2", desc: "+3 DOURADOS. Só do Baú Ancestral.", n: ancEggCounts?.luck ?? 0 },
                    ].map((o) => (
                      <div key={o.key} style={{ ...cut(8), background: "rgba(0,0,0,0.45)", border: `1px solid ${o.col}66`, padding: "10px 10px", textAlign: "center" }}>
                        <img src={o.img} alt={o.name} style={{ width: 64, height: 64, objectFit: "contain", filter: `drop-shadow(0 0 10px ${o.col}aa)` }} />
                        <div style={{ color: o.col, fontSize: 10, fontWeight: 900, fontFamily: MONO, marginTop: 6, letterSpacing: 1 }}>{o.name}</div>
                        <div style={{ color: "#93a9ba", fontSize: 9, marginTop: 4, lineHeight: 1.45 }}>{o.desc}</div>
                        <div style={{ color: o.n > 0 ? "#7cffb2" : "#6f8798", fontSize: 9, marginTop: 5, fontFamily: MONO }}>na mochila: {o.n}</div>
                      </div>
                    ))}
                  </div>

                  {/* BAÚ ANCESTRAL — compra (sorteia Plus ou Luck) */}
                  <div
                    style={{
                      ...cut(8),
                      marginTop: 10,
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      flexWrap: "wrap",
                      background: "rgba(255,217,77,0.08)",
                      border: "1px dashed rgba(255,217,77,0.55)",
                      padding: "10px 12px",
                    }}
                  >
                    <img src={bauAncUrl} alt="Baú Ancestral" style={{ width: 56, height: 56, objectFit: "contain", imageRendering: "pixelated", filter: "drop-shadow(0 0 10px rgba(255,217,77,0.7))" }} />
                    <div style={{ flex: 1, minWidth: 170 }}>
                      <div style={{ color: "#ffd94d", fontSize: 12, fontWeight: 900, fontFamily: MONO, letterSpacing: 1 }}>🎁 BAÚ ANCESTRAL</div>
                      <div style={{ color: "#cfe4f2", fontSize: 10, marginTop: 3, lineHeight: 1.5 }}>
                        Única forma de ganhar os ovos <b>PLUS</b> e <b>LUCK</b> — abre na hora (com animação!) e sorteia um dos dois. Paga <b>1 🎫 Ticket Ancestral</b> (item concedido pelo admin).
                      </div>
                      <div style={{ color: (tickets ?? 0) > 0 ? "#7cffb2" : "#8ba0b2", fontSize: 10, marginTop: 4, fontWeight: 900, fontFamily: MONO }}>
                        🎫 Tickets: {tickets ?? 0}
                      </div>
                    </div>
                    <button
                      onClick={() => { if ((tickets ?? 0) >= 1) onBuyAncChest?.(); }}
                      disabled={(tickets ?? 0) < 1}
                      style={{
                        ...cut(6), padding: "9px 16px", border: "none",
                        fontWeight: 900, fontSize: 10.5, letterSpacing: 1.2, fontFamily: MONO,
                        cursor: (tickets ?? 0) >= 1 ? "pointer" : "not-allowed",
                        color: "#04141a",
                        background: (tickets ?? 0) >= 1 ? "#ffd94d" : "#3a3320",
                        boxShadow: (tickets ?? 0) >= 1 ? "0 0 18px rgba(255,217,77,0.55)" : "none",
                        opacity: (tickets ?? 0) >= 1 ? 1 : 0.7,
                      }}
                    >
                      {(tickets ?? 0) >= 1 ? "ABRIR BAÚ · 1 🎫" : "SEM TICKET 🎫"}
                    </button>
                  </div>
                </div>

                <div
                  style={{
                    ...cut(10),
                    marginTop: 14,
                    background: "rgba(255,170,60,0.08)",
                    border: "1px dashed rgba(255,170,60,0.5)",
                    padding: 12,
                    color: "#d8c9a8",
                    fontSize: 11.5,
                    lineHeight: 1.5,
                  }}
                >
                  <b style={{ color: "#ffb14d" }}>Como funciona:</b> ovos ativados chocam com o
                  tempo e vão direto para a coleção. O <b>Cristal do Despertar</b> adianta o
                  progresso de um ovo para 69%. Limite de 6 ovos simultâneos — escolha bem o que
                  chocar primeiro!
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
