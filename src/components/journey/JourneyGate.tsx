import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { JOURNEY_LINES } from "@/game/journey";
import { advanceJourney, hasJourneyResetLocally, hydrateJourneyArrival, journeyStatus,
  preserveLatestJourneySource, type JourneyStatus } from "@/lib/emeraldJourney";
import { isOfflineTest } from "@/lib/offlineTest";
import scene1 from "@/ambiente/map/jorn/1.webp";
import scene2 from "@/ambiente/map/jorn/2.webp";
import scene3 from "@/ambiente/map/jorn/3.webp";
import scene4 from "@/ambiente/map/jorn/4.webp";
import scene5 from "@/ambiente/map/jorn/5.webp";
import scene6 from "@/ambiente/map/jorn/6.webp";
import scene7 from "@/ambiente/map/jorn/7.webp";
import loadingArt from "@/ambiente/map/jorn/emerald 1.webp";
import templeArt from "@/ambiente/map/BOBO/bobo_t2.webp";
import emeraldMap from "@/ambiente/map/EMERALD.webp";
import musicUrl from "@/ambiente/map/jorn/intro-music.m4a";
import typingUrl from "@/ambiente/map/jorn/typing.m4a";
import "./journey.css";

const SCENES = [scene1, scene2, scene3, scene4, scene5, scene6, scene7];
function JourneyLoading({ arrival, error, retry }: { arrival?: boolean; error?: string; retry?: () => void }) {
  return <section className="journey-loading" aria-label={arrival ? "Chegando em Emerald" : "Entrando no Templo BOBO T2"}>
    <img src={arrival ? loadingArt : templeArt} alt="" />
    <div className="journey-loading__caption">
      <strong>{arrival ? "EMERALD" : "TEMPLO · BOBO T2"}</strong>
      <span>{error || (arrival ? "Preparando sua nova jornada…" : "Confirmando seu progresso…")}</span>
      {error && <button type="button" onClick={retry}>Tentar novamente</button>}
    </div>
  </section>;
}

/** Só este componente anima texto/áudio. O jogo não está montado durante a
 * abertura: sem movimento, combate, atalhos, farm offline ou autosave paralelo. */
export function JourneyDialogue({ cursor, preview, busy, error, onAdvance }: {
  cursor: number; preview: boolean; busy: boolean; error: string; onAdvance: () => void;
}) {
  const line = JOURNEY_LINES[cursor] ?? JOURNEY_LINES[0];
  const image = SCENES[line.scene - 1];
  const [shown, setShown] = useState(0);
  const [muted, setMuted] = useState(false);
  const [imageReady, setImageReady] = useState(false);
  const [imageError, setImageError] = useState(false);
  const music = useRef<HTMLAudioElement>(null);
  const typing = useRef<HTMLAudioElement>(null);
  const typingNow = shown < line.text.length;

  useEffect(() => {
    let cancelled = false;
    setImageReady(false); setImageError(false);
    const img = new Image(); img.src = image;
    void img.decode().then(() => { if (!cancelled) setImageReady(true); })
      .catch(() => { if (!cancelled) setImageError(true); });
    // Apenas a PRÓXIMA cena é antecipada; os PNGs originais nunca são baixados.
    const next = SCENES[line.scene];
    if (next) { const preload = new Image(); preload.src = next; }
    return () => { cancelled = true; };
  }, [image, line.scene]);
  useEffect(() => {
    setShown(0);
    if (!imageReady) return;
    const timer = window.setInterval(() => {
      setShown((count) => {
        const next = Math.min(line.text.length, count + 1);
        if (next === line.text.length) window.clearInterval(timer);
        return next;
      });
    }, 26);
    return () => window.clearInterval(timer);
  }, [cursor, line.text, imageReady]);
  const playSound = useCallback(() => {
    if (music.current) {
      music.current.volume = 0.22;
      if (muted || line.silence) music.current.pause();
      else void music.current.play().catch(() => { /* primeiro toque desbloqueia no celular */ });
    }
    if (typing.current) {
      typing.current.volume = 0.13;
      if (muted || !typingNow || busy || !imageReady) typing.current.pause();
      else void typing.current.play().catch(() => {});
    }
  }, [muted, line.silence, typingNow, busy, imageReady]);
  useEffect(playSound, [playSound]);
  useEffect(() => {
    const background = music.current, keys = typing.current;
    return () => { background?.pause(); keys?.pause(); };
  }, []);
  const advance = () => {
    playSound();
    if (busy || !imageReady || imageError) return;
    if (typingNow) { setShown(line.text.length); typing.current?.pause(); return; }
    onAdvance();
  };
  return <section className="journey-screen" role="dialog" aria-modal="true" aria-label="Abertura obrigatória da jornada"
    onKeyDownCapture={(event) => {
      if (["Escape", "w", "a", "s", "d", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key)) {
        event.preventDefault(); event.stopPropagation();
      }
    }}>
    <div className="journey-heading">
      <span>TEMPLO · BOBO T2 · CENA {line.scene}/7</span>
      {preview && <strong>PRÉVIA PRIVADA · SEM RESET DE NÍVEIS</strong>}
    </div>
    <button type="button" autoFocus className={`journey-scene ${line.scene >= 2 && line.scene <= 4 ? "is-square" : ""}`}
      onClick={advance} disabled={busy} aria-label={typingNow ? "Mostrar a fala inteira" : "Continuar a jornada"}>
      <img src={image} alt={`Cena ${line.scene} da jornada`} draggable={false} />
      {imageReady && <div className="journey-dialogue">
        <strong>{line.speaker}</strong>
        <p aria-hidden="true">{line.text.slice(0, shown)}{typingNow && <span>▌</span>}</p>
        <span className="journey-sr-only" aria-live="polite">{line.text}</span>
      </div>}
      {!imageReady && !imageError && <span className="journey-scene__status">Carregando a cena…</span>}
      {imageError && <span className="journey-scene__status">Não foi possível carregar a imagem. Reconecte e recarregue: sua fala está salva.</span>}
    </button>
    <div className="journey-controls">
      <span role="status">{error || (busy ? "Salvando progresso…" : typingNow ? "Toque para mostrar a fala" : "Toque para continuar · progresso salvo na conta")}</span>
      <button type="button" onClick={() => setMuted((value) => !value)} aria-pressed={!muted}>
        {muted ? "Ativar áudio" : "Silenciar"}
      </button>
    </div>
    <audio ref={music} src={musicUrl} loop preload="none" />
    <audio ref={typing} src={typingUrl} loop preload="none" />
  </section>;
}

export function JourneyGate({ userId, children }: { userId?: string; children: ReactNode }) {
  const [status, setStatus] = useState<JourneyStatus | null>(null);
  const [ready, setReady] = useState(false);
  const [arrival, setArrival] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const generation = useRef(0);
  const boot = useCallback(async (restartPreview = false) => {
    const request = ++generation.current;
    setError(""); setReady(false); setArrival(false); setStatus(null);
    if (isOfflineTest()) { setReady(true); return; }
    if (!userId) { setError("Entre na sua conta para confirmar sua jornada."); return; }
    try {
      const result = await journeyStatus(restartPreview);
      if (request !== generation.current) return;
      if (!result.required) {
        // F5 após o commit, antes de atualizar o cache: o servidor vence os
        // anti-downgrades locais, sem reaplicar o reset ou dar outra estrela.
        if (result.reset_applied_at && !hasJourneyResetLocally()) {
          setArrival(true);
          await hydrateJourneyArrival(userId);
        }
        if (request === generation.current) setReady(true);
      } else {
        await preserveLatestJourneySource(userId, result.has_save === false);
        if (request === generation.current) setStatus(result);
      }
    } catch {
      if (request === generation.current) setError("Não foi possível confirmar seu progresso. Reconecte e tente novamente; nenhuma fala será pulada.");
    }
  }, [userId]);
  useEffect(() => {
    void boot();
    const replay = () => { void boot(true); };
    window.addEventListener("rubym:journey-preview", replay);
    return () => { generation.current++; window.removeEventListener("rubym:journey-preview", replay); };
  }, [boot]);
  const advance = async () => {
    if (!status?.version || busyRef.current || !userId) return;
    busyRef.current = true; setBusy(true); setError("");
    try {
      const response = await advanceJourney(status.version, status.cursor ?? 0);
      if (response.completed) {
        setArrival(true);
        const image = new Image(); image.src = emeraldMap;
        await Promise.all([hydrateJourneyArrival(userId, response), image.decode(),
          new Promise((resolve) => window.setTimeout(resolve, 1800))]);
        setReady(true);
      } else setStatus((current) => current ? { ...current, cursor: response.cursor } : current);
    } catch {
      setArrival(false);
      setError("Não consegui confirmar o salvamento. Toque para tentar de novo; sua jornada continua nesta fala.");
    } finally { busyRef.current = false; setBusy(false); }
  };
  if (ready) return <>{children}</>;
  if (arrival) return <JourneyLoading arrival error={error} retry={() => { void boot(); }} />;
  if (!status) return <JourneyLoading error={error} retry={() => { void boot(); }} />;
  return <JourneyDialogue cursor={status.cursor ?? 0} preview={status.preview} busy={busy} error={error} onAdvance={() => { void advance(); }} />;
}
