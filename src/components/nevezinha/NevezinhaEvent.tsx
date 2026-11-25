import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { supabase } from "@/integrations/supabase/client";
import { adoptAuthoritativeCheckpoint } from "@/lib/saveManager";
import nevezinha from "@/ambiente/map/bb/nevezinha.webp";
import machine from "@/ambiente/nevezinha/machine.webp";
import ticketIcon from "@/ambiente/nevezinha/ticket.webp";
import iconPokeball from "@/assets/items/icon-pokeball.webp";
import iconGreatball from "@/assets/items/icon-greatball.webp";
import iconUltraball from "@/assets/items/icon-ultraball.webp";
import iconBerry from "@/assets/items/icon-berry.webp";
import cakeStrawberry from "@/assets/comida/cake_strawberry.png";
import stoneGrass from "@/assets/chest-grass.webp";
import stoneFire from "@/assets/chest-fire.webp";
import stoneWater from "@/assets/chest-water.webp";
import stoneElectric from "@/assets/chest-electric.webp";
import stoneDark from "@/assets/chest-dark.webp";
import stoneDragon from "@/assets/chest-dragon.webp";
import showVideo from "@/ambiente/nevezinha/show.mp4";
import failVideo from "@/ambiente/nevezinha/fail.mp4";
import stoneVideo from "@/ambiente/nevezinha/stone.mp4";
import itemsVideo from "@/ambiente/nevezinha/items.mp4";
import "./nevezinha-event.css";

type Reward = {
  kind: "doll" | "stone" | "ultra" | "items" | "food" | "fail" | string;
  label: string;
  rarity: string;
  items: Record<string, number>;
  video: "show" | "fail" | "stone" | "items" | string;
};
type EventStatus = {
  tickets: number;
  next_ticket_at?: string;
  pity: number;
  pity_max: number;
  last_result?: Reward | null;
  last_spin_at?: string | null;
};
type SpinResponse = {
  ok: boolean;
  reason?: string;
  reward?: Reward;
  snapshot?: unknown;
  server_version?: number;
  tickets?: number;
  pity?: number;
  next_ticket_at?: string;
};

const VIDEOS: Record<string, string> = {
  show: showVideo,
  fail: failVideo,
  stone: stoneVideo,
  items: itemsVideo,
};
const ITEM_NAMES: Record<string, string> = {
  nevezinha_doll: "Boneco da Nevezinha",
  pokeball: "Pokébola",
  greatball: "Great Ball",
  ultraball: "Ultra Ball",
  berry: "Baga",
  refeicao: "Refeição Completa",
  stone_grass: "Stone Verdejante",
  stone_fire: "Stone Ígnea",
  stone_water: "Stone Aquática",
  stone_electric: "Stone Elétrica",
  stone_dark: "Stone Sombria",
  stone_dragon: "Stone Dragão",
};
const ITEM_IMAGES: Record<string, string> = {
  nevezinha_doll: nevezinha,
  pokeball: iconPokeball,
  greatball: iconGreatball,
  ultraball: iconUltraball,
  berry: iconBerry,
  refeicao: cakeStrawberry,
  stone_grass: stoneGrass,
  stone_fire: stoneFire,
  stone_water: stoneWater,
  stone_electric: stoneElectric,
  stone_dark: stoneDark,
  stone_dragon: stoneDragon,
};
const PRIZES = [
  { image: nevezinha, label: "Boneco da Nevezinha", chance: "5% · lendário · +5% XP" },
  { image: stoneGrass, label: "Stone Elemental", chance: "25%" },
  { image: iconUltraball, label: "Ultra Ball", chance: "15%" },
  { image: iconPokeball, label: "Pokébolas", chance: "30%" },
  { image: iconBerry, label: "Comida Pokémon", chance: "25%" },
  { image: iconPokeball, label: "Falha nos tiros 1–2", chance: "70% · 1 Pokébola" },
];
const itemList = (items: Record<string, number>) =>
  Object.entries(items).map(([id, qty]) => `+${qty} ${ITEM_NAMES[id] ?? id}`).join(" · ");
const itemSummary = (items: Record<string, number>) =>
  Object.entries(items).map(([id, qty]) => `${ITEM_NAMES[id] ?? id} ×${qty}`).join(" · ");

function nextTicketLabel(iso: string | undefined, now: number) {
  const stamp = iso ? Date.parse(iso) : NaN;
  if (!Number.isFinite(stamp)) return "amanhã";
  const remaining = Math.max(0, stamp - now);
  const hours = Math.floor(remaining / 3_600_000);
  const minutes = Math.floor((remaining % 3_600_000) / 60_000);
  return hours > 0 ? `${hours}h ${minutes}min` : `${Math.max(1, minutes)}min`;
}

export function NevezinhaEvent({ userId, onClose, onReward }: {
  userId?: string;
  onClose: () => void;
  onReward: (items: Record<string, number>, message: string) => void;
}) {
  const [status, setStatus] = useState<EventStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [spinning, setSpinning] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [result, setResult] = useState<Reward | null>(null);
  const [lastResult, setLastResult] = useState<Reward | null>(null);
  const [videoOpen, setVideoOpen] = useState(false);
  const [videoDone, setVideoDone] = useState(false);
  const [videoLoading, setVideoLoading] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [playBlocked, setPlayBlocked] = useState(false);
  const [muted, setMuted] = useState(false);
  const [now, setNow] = useState(Date.now());
  const videoRef = useRef<HTMLVideoElement>(null);

  const refresh = async () => {
    setLoading(true);
    setError("");
    try {
      const { data, error: rpcError } = await (supabase as any).rpc("nevezinha_event_status");
      if (rpcError) throw rpcError;
      if (!data || typeof data.tickets !== "number") throw new Error("Resposta inválida");
      setStatus(data as EventStatus);
      setLastResult((data.last_result as Reward | null) ?? null);
    } catch {
      setError("Não foi possível abrir o Festival agora. Confira sua conexão e tente de novo.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(timer);
  }, []);
  useEffect(() => {
    if (!videoOpen || !result) return;
    const timer = window.setTimeout(() => {
      const video = videoRef.current;
      if (!video) return;
      video.currentTime = 0;
      video.muted = muted;
      void video.play().catch(() => setPlayBlocked(true));
    }, 120);
    return () => window.clearTimeout(timer);
  }, [videoOpen, result]);
  useEffect(() => {
    if (videoRef.current) videoRef.current.muted = muted;
  }, [muted, videoOpen]);

  const playVideo = () => {
    const video = videoRef.current;
    if (!video) return;
    setPlayBlocked(false);
    video.currentTime = 0;
    video.muted = muted;
    void video.play().catch(() => setPlayBlocked(true));
  };
  const finishVideo = () => {
    videoRef.current?.pause();
    setVideoLoading(false);
    setVideoDone(true);
  };
  const closeResult = () => {
    videoRef.current?.pause();
    setVideoOpen(false);
    setVideoDone(false);
    setVideoLoading(false);
    setResult(null);
    setVideoError(false);
    setPlayBlocked(false);
  };
  const handleSpin = async () => {
    if (spinning || loading || !status || status.tickets < 1 || !userId) return;
    setSpinning(true);
    setError("");
    setNotice("");
    setResult(null);
    setVideoDone(false);
    setVideoLoading(true);
    setVideoError(false);
    setPlayBlocked(false);
    try {
      const { data, error: rpcError } = await (supabase as any).rpc("nevezinha_event_spin");
      if (rpcError) throw rpcError;
      const response = data as SpinResponse;
      if (!response?.ok || !response.reward) {
        if (response?.reason === "no_ticket") {
          setStatus((current) => current ? { ...current, tickets: 0, next_ticket_at: response.next_ticket_at } : current);
          setError("O tiro de hoje já foi usado. Volte no próximo dia.");
        } else if (response?.reason === "save_not_ready") {
          setError("Seu progresso ainda não sincronizou. Aguarde alguns segundos e tente de novo.");
        } else {
          setError("Não foi possível concluir o tiro. Tente novamente.");
        }
        return;
      }
      setStatus((current) => current ? {
        ...current,
        tickets: response.tickets ?? Math.max(0, (current.tickets ?? 1) - 1),
        pity: response.pity ?? current.pity,
        next_ticket_at: response.next_ticket_at ?? current.next_ticket_at,
        last_result: response.reward,
      } : current);
      setLastResult(response.reward);
      setResult(response.reward);
      if (userId && response.snapshot && typeof response.server_version === "number") {
        try {
          await adoptAuthoritativeCheckpoint(userId, response.snapshot, response.server_version, "before-nevezinha");
        } catch {
          setNotice("O prêmio já está salvo na conta. Se o jogo recarregar, ele aparece na mochila.");
        }
      }
      onReward(response.reward.items, itemList(response.reward.items));
      setVideoOpen(true);
    } catch {
      setError("Não consegui falar com o servidor. Nenhum ticket foi gasto; tente novamente.");
      void refresh();
    } finally {
      setSpinning(false);
    }
  };

  const content = (
    <div className="neve-backdrop" role="presentation" onClick={(event) => {
      if (event.target === event.currentTarget && !spinning && !videoOpen) onClose();
    }}>
      <section className="neve-panel" role="dialog" aria-modal="true" aria-label="Festival da Nevezinha" onClick={(event) => event.stopPropagation()}>
        <header className="neve-head">
          <div className="neve-title">❄ FESTIVAL DA NEVEZINHA ❄</div>
          <button type="button" className="neve-close" onClick={onClose} disabled={spinning || videoOpen} aria-label="Fechar Festival">✕</button>
        </header>
        <div className="neve-body">
          <aside className="neve-card neve-mascot">
            <div className="neve-card-title">MASCOTE DO EVENTO</div>
            <img src={nevezinha} alt="Nevezinha" draggable={false} />
            <strong>Nevezinha</strong>
            <p>Boneco lendário do festival: +5% de XP enquanto estiver na mochila. Não é garantido em todo tiro.</p>
            <div className="neve-pity-label"><span>Sorte do boneco</span><b>{status?.pity ?? 0}/{status?.pity_max ?? 20}</b></div>
            <div className="neve-bar"><i style={{ width: `${Math.min(100, ((status?.pity ?? 0) / Math.max(1, status?.pity_max ?? 20)) * 100)}%` }} /></div>
          </aside>

          <main className="neve-machine">
            <div className={`neve-machine-art ${spinning ? "is-spinning" : ""}`}>
              <img src={machine} alt="Máquina de presentes da Nevezinha" draggable={false} width={640} height={640} />
            </div>
            <div className="neve-ticket">
              <img src={ticketIcon} alt="" width={40} height={40} />
              <strong>{status?.tickets ?? 0}</strong>
              <span>tiro{(status?.tickets ?? 0) === 1 ? "" : "s"} hoje</span>
            </div>
            <button type="button" className="neve-spin" onClick={() => { void handleSpin(); }}
              disabled={loading || spinning || !status || status.tickets < 1 || !userId}>
              {spinning ? "Preparando o tiro..." : loading ? "Carregando..." : status && status.tickets > 0 ? "DAR O TIRO" : "VOLTE AMANHÃ"}
              <span>{status && status.tickets > 0 ? `3 tiros por dia · restam ${status.tickets}` : loading ? "" : `próximo ticket em ${nextTicketLabel(status?.next_ticket_at, now)}`}</span>
            </button>
            <p className="neve-hint">Tiros 1 e 2 podem falhar; o 3º sempre dá um prêmio. Falha entrega só 1 Pokébola. O prêmio é salvo no servidor antes do vídeo; F5 não perde nem rerrola.</p>
            {error && <p className="neve-error" role="alert">{error}</p>}
            {notice && <p className="neve-notice">{notice}</p>}
            {lastResult && !result && (
              <div className="neve-last">
                <span>Último prêmio</span>
                <strong>{itemSummary(lastResult.items)}</strong>
                <small>já creditado na mochila</small>
              </div>
            )}
            {!loading && !status && (
              <button type="button" className="neve-retry" onClick={() => { void refresh(); }}>Tentar abrir de novo</button>
            )}
          </main>

          <aside className="neve-card neve-prizes">
            <div className="neve-card-title">PRÊMIOS DO TIRO</div>
            <ul>
              {PRIZES.map((prize) => <li key={prize.label}>
                <span className="neve-prize-icon"><img src={prize.image} alt="" draggable={false} /></span>
                <span><strong>{prize.label}</strong><small>{prize.chance}</small></span>
              </li>)}
            </ul>
            <p>3 tiros por dia. O contador volta à meia-noite (horário de São Paulo).</p>
          </aside>
        </div>
        <footer className="neve-foot">3 tiros por dia · recompensas creditadas no save da conta</footer>
      </section>

      {result && videoOpen && (
        <div className="neve-video-backdrop" role="dialog" aria-modal="true" aria-label="Resultado do tiro da Nevezinha">
          <div className="neve-video-frame">
            {!videoDone ? (
              <>
                <video
                  key={result.video}
                  ref={videoRef}
                  className="neve-video"
                  src={VIDEOS[result.video] ?? itemsVideo}
                  autoPlay
                  playsInline
                  preload="auto"
                  onLoadedData={() => setVideoLoading(false)}
                  onCanPlay={() => setVideoLoading(false)}
                  onPlaying={() => setVideoLoading(false)}
                  onEnded={finishVideo}
                  onError={() => { setVideoError(true); setVideoLoading(false); finishVideo(); }}
                />
                {videoLoading && <div className="neve-video-loading">Carregando vídeo...</div>}
                <div className="neve-video-controls">
                  <button type="button" onClick={finishVideo}>Pular vídeo</button>
                  <button type="button" onClick={() => setMuted((value) => !value)}>{muted ? "Ativar som" : "Silenciar"}</button>
                </div>
                {playBlocked && <button type="button" className="neve-video-play" onClick={playVideo}>▶ Reproduzir vídeo</button>}
              </>
            ) : (
              <div className="neve-result">
                <span className="neve-result-kicker">{videoError ? "Vídeo indisponível · prêmio salvo" : result.kind === "fail" ? "NÃO FOI DESSA VEZ" : "VOCÊ GANHOU"}</span>
                <div className={`neve-result-prize is-${result.rarity}`}>
                  <div className="neve-result-icons">
                    {Object.entries(result.items).map(([id, qty]) => (
                      <span key={id} className="neve-result-item">
                        <img src={ITEM_IMAGES[id] ?? nevezinha} alt="" draggable={false} />
                        <b>×{qty}</b>
                        <small>{ITEM_NAMES[id] ?? id}</small>
                      </span>
                    ))}
                  </div>
                  <strong>{result.label}</strong>
                  <p>{itemSummary(result.items)}</p>
                </div>
                <p className="neve-result-note">Prêmio já creditado na sua mochila. Você pode fechar sem perder nada.</p>
                <button type="button" className="neve-result-ok" onClick={closeResult}>OBA!</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
  return typeof document === "undefined" ? null : createPortal(content, document.body);
}
