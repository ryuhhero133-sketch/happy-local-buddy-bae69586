import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import professorPortrait from "@/assets/npc-oak.png";

const REMIND_AFTER_MS = 6 * 60 * 60 * 1000;
const pages = [
  { text: "Olá, treinador! Vou te mostrar o básico em passos rápidos. Você pode fechar o guia a qualquer momento.", target: "" },
  { text: "Para viajar, toque no ícone do Mapa Mundi destacado. Escolha um destino liberado e confirme o teleporte; essas viagens são gratuitas.", target: "world-map" },
  { text: "Comece em Verdejante 1 e explore Valley Plume, Florest Ice e Florest Bone conforme seu time fica mais forte. Os números no mapa são níveis dos Pokémon encontrados.", target: "world-map" },
  { text: "Para chegar ao Pokemarkt, use o Mapa Mundi ou a porta em Revoland. Escolha seus itens e confirme a compra. Para sair, pise na luz junto à porta e confirme a volta a Revoland.", target: "world-map" },
  { text: "Leve Pokébolas na Mochila e ative o botão de captura destacado. Nas batalhas, a captura automática tentará pegar Pokémon conforme as regras do encontro.", target: "capture" },
  { text: "Abra o MENU para organizar seu time em Pokémon e Coleção, consultar a Mochila e ajustar as Configurações.", target: "menu" },
  { text: "Em Eventos você encontra recompensas, incluindo o ovo de pré-registro quando alcançar o nível necessário. Boa jornada!", target: "events" },
] as const;

type GuideState = { completed?: boolean; prompts?: number; nextPromptAt?: number };
function readState(key: string): GuideState {
  try { return JSON.parse(localStorage.getItem(key) ?? "{}") as GuideState; } catch { return {}; }
}
function writeState(key: string, state: GuideState) {
  try { localStorage.setItem(key, JSON.stringify(state)); } catch { /* armazenamento indisponível */ }
}

export function TrainerGuide({ accountId }: { accountId: string }) {
  const key = `rubym.guide.v2.${accountId}`;
  const pageKey = `rubym.guide.page.${accountId}`;
  const anchorRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(() => {
    if (typeof window === "undefined") return false;
    const stored = readState(key);
    // Quem já concluiu o guia antigo não recebe novamente a mesma explicação.
    if (localStorage.getItem(`rubym.guide.seen.${accountId}`)) return false;
    return !stored.completed && (stored.prompts ?? 0) < 2 && (stored.nextPromptAt ?? 0) <= Date.now();
  });
  const [page, setPage] = useState(() => {
    try { return Math.max(0, Math.min(pages.length - 1, Number(sessionStorage.getItem(pageKey)) || 0)); } catch { return 0; }
  });
  const [top, setTop] = useState(110);
  const target = pages[page].target;

  useEffect(() => {
    if (open || localStorage.getItem(`rubym.guide.seen.${accountId}`)) return;
    const stored = readState(key);
    if (stored.completed || (stored.prompts ?? 0) >= 2 || !stored.nextPromptAt) return;
    const delay = Math.max(0, stored.nextPromptAt - Date.now());
    const timer = window.setTimeout(() => setOpen(true), delay);
    return () => window.clearTimeout(timer);
  }, [open, accountId, key]);

  useEffect(() => {
    if (!open) return;
    const updatePosition = () => {
      const bottom = anchorRef.current?.getBoundingClientRect().bottom ?? 86;
      setTop(Math.max(8, Math.min(bottom + 8, window.innerHeight - 245)));
    };
    updatePosition();
    window.addEventListener("resize", updatePosition);
    return () => window.removeEventListener("resize", updatePosition);
  }, [open]);

  useEffect(() => {
    if (!open || !target) return;
    const selector = target === "menu" ? ".revo-main-menu-trigger" : `[data-guide-target="${target}"]`;
    const button = document.querySelector<HTMLElement>(selector);
    button?.classList.add("revo-guide-focus");
    return () => button?.classList.remove("revo-guide-focus");
  }, [open, target]);

  const close = (completed: boolean) => {
    const previous = readState(key);
    writeState(key, completed || previous.completed
      ? { completed: true }
      : { prompts: Math.min(2, (previous.prompts ?? 0) + 1), nextPromptAt: Date.now() + REMIND_AFTER_MS });
    try { sessionStorage.removeItem(pageKey); } catch { /* ignore */ }
    setPage(0);
    setOpen(false);
  };
  const next = () => {
    if (page === pages.length - 1) return close(true);
    try { sessionStorage.setItem(pageKey, String(page + 1)); } catch { /* ignore */ }
    setPage(page + 1);
  };

  return <>
    <style>{`
      @keyframes revo-guide-glow { 50% { box-shadow: 0 0 20px 8px #ffe079aa; } }
      .revo-hud .revo-guide-focus { position: relative; z-index: 15; outline: 3px solid #ffe079 !important; outline-offset: 3px; animation: revo-guide-glow 1.3s ease-in-out infinite !important; }
      .revo-hud .revo-guide-focus::after { content: "➜"; position: absolute; right: calc(100% + 8px); top: 50%; transform: translateY(-50%); color: #ffe079; font: bold 25px system-ui; text-shadow: 0 2px 5px #000; pointer-events: none; }
      .revo-guide-card button { cursor: pointer; font: inherit; }
      @media (pointer: coarse) and (orientation: landscape) and (max-height: 650px) {
        .revo-hud .revo-guide-trigger { display: none !important; }
        .revo-guide-card {
          top: auto !important;
          bottom: calc(92px + env(safe-area-inset-bottom));
          left: calc(313px + env(safe-area-inset-left));
          right: max(165px, env(safe-area-inset-right)) !important;
          width: auto !important;
          max-height: calc(100dvh - 105px) !important;
        }
      }
      @media (pointer: coarse) and (orientation: landscape) and (max-height: 650px) and (max-width: 650px) {
        .revo-guide-card { left: calc(210px + env(safe-area-inset-left)); }
      }
    `}</style>
    <button ref={anchorRef} className="revo-guide-trigger" type="button" aria-label="Abrir guia do treinador" onClick={() => { setPage(0); setOpen(true); }}
      style={{ width: "100%", display: "flex", alignItems: "center", gap: 7, borderRadius: 10, padding: "4px 7px", border: "1px solid #d5b66d88", background: "#142632e8", color: "#ffe39c", fontSize: 11, textAlign: "left" }}>
      <img src={professorPortrait} alt="" style={{ width: 28, height: 28, objectFit: "cover", objectPosition: "center 12%", borderRadius: "50%", background: "#385f4e", border: "1px solid #e8cc87" }} />
      <span>❔ Guia do Professor</span>
    </button>
    {open && typeof document !== "undefined" && createPortal(
      <section className="revo-guide-card" role="dialog" aria-label="Guia do Professor" aria-live="polite"
        style={{ position: "fixed", right: "max(8px, env(safe-area-inset-right))", top, zIndex: 12001, width: "min(310px, calc(100vw - 16px))", maxHeight: "min(240px, 55dvh)", overflowY: "auto", border: "2px solid #e8cc87", borderRadius: 14, padding: 11, background: "linear-gradient(155deg, #1c3440, #101d29)", color: "#edf9f2", boxShadow: "0 14px 36px #000b, inset 0 0 0 2px #6d592d" }}>
        <div style={{ display: "flex", gap: 9, alignItems: "center" }}>
          <img src={professorPortrait} alt="Professor" style={{ width: 46, height: 46, flexShrink: 0, objectFit: "cover", objectPosition: "center 12%", borderRadius: "50%", background: "#385f4e", border: "2px solid #e8cc87" }} />
          <div><strong style={{ color: "#ffe39c", fontSize: 12 }}>PROFESSOR</strong><div style={{ fontSize: 10, color: "#b9d3c5" }}>GUIA DO TREINADOR · {page + 1}/{pages.length}</div></div>
        </div>
        <p style={{ margin: "9px 0", fontSize: 12, lineHeight: 1.45 }}>{pages[page].text}</p>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
          <button type="button" onClick={() => close(false)} style={{ padding: "7px 11px", borderRadius: 7, border: "1px solid #bba368", color: "#fff4d1", background: "#31453b" }}>Fechar</button>
          <button type="button" onClick={next} style={{ padding: "7px 11px", borderRadius: 7, border: "1px solid #f5cf6b", color: "#18241d", background: "#d4ab58", fontWeight: 800 }}>{page === pages.length - 1 ? "Concluir ✓" : "Continuar ➜"}</button>
        </div>
      </section>, document.body)}
  </>;
}
