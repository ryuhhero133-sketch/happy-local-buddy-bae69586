import { useEffect, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import type { GameHudProps, HudTab } from "./GameHud";
import menuTriggerIcon from "@/skill/srg/Pknamao.png";
import menuBase from "@/ambiente/aba/menu1.png";
import menuEffect from "@/ambiente/aba/efet.png";
import iconPokemon from "@/ambiente/aba/men ic/Quest.png";
import iconMochila from "@/ambiente/aba/men ic/Mochila.gif";
import iconColecao from "@/ambiente/aba/men ic/Reward.png";
import iconPokedex from "@/ambiente/aba/men ic/Pokedex.png";
import iconMissoes from "@/ambiente/aba/men ic/Main Quest.png";
import iconGuilda from "@/ambiente/aba/men ic/Guilda.png";
import iconMapa from "@/ambiente/aba/men ic/Mapa.png";
import iconLoja from "@/ambiente/aba/men ic/Loja.png";
import iconForja from "@/ambiente/aba/men ic/Forja.png";
import iconBanco from "@/ambiente/aba/men ic/Banco.png";
import iconConfig from "@/ambiente/aba/men ic/Opções.png";
import iconPerfil from "@/ambiente/aba/men ic/Perfil.png";
import iconSinergia from "@/ambiente/aba/men ic/Sinergia.png";
import iconMercado from "@/ambiente/aba/men ic/Markt.png";
import iconMontaria from "@/CHAR/montaria.png";
import "./main-menu.css";

type MenuItem = { label: string; icon: string; color: string; x: number; y: number; action: () => void };

export function MainMenu({ hud, open, onOpenChange }: { hud: GameHudProps; open: boolean; onOpenChange: (open: boolean) => void }) {

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") { event.preventDefault(); onOpenChange(false); }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onOpenChange]);

  const navigate = (tab: HudTab) => { onOpenChange(false); hud.onTab(tab); };
  const act = (callback: () => void) => { onOpenChange(false); callback(); };
  const items: MenuItem[] = [
    { label: "Pokémon", icon: iconPokemon, color: "#f36b64", x: 22.7, y: 37.5, action: () => navigate("pokemon") },
    { label: "Mochila", icon: iconMochila, color: "#eaa946", x: 50, y: 37.5, action: () => navigate("mochila") },
    { label: "Coleção", icon: iconColecao, color: "#6bbaf5", x: 77.5, y: 37.5, action: () => navigate("colecao") },
    { label: "Pokédex", icon: iconPokedex, color: "#f47b64", x: 22.7, y: 51.5, action: () => navigate("pokedex") },
    { label: "Missões", icon: iconMissoes, color: "#e9c86a", x: 50, y: 51.5, action: () => act(hud.onQuests) },
    { label: "Guilda", icon: iconGuilda, color: "#ed8661", x: 77.5, y: 51.5, action: () => act(hud.onGuild) },
    { label: "Mapa", icon: iconMapa, color: "#87d7a2", x: 22.7, y: 65.5, action: () => act(hud.onMap) },
    { label: "Loja", icon: iconLoja, color: "#efb768", x: 50, y: 65.5, action: () => act(hud.onShop) },
    { label: "Forja", icon: iconForja, color: "#aaa9f1", x: 77.5, y: 65.5, action: () => act(hud.onForge) },
    { label: "Banco", icon: iconBanco, color: "#f8d476", x: 22.7, y: 79.5, action: () => navigate("wallet") },
    { label: "Configurações", icon: iconConfig, color: "#a6d4ef", x: 50, y: 79.5, action: () => act(hud.onSettings) },
    { label: "Perfil", icon: iconPerfil, color: "#f6a6a9", x: 77.5, y: 79.5, action: () => act(hud.onProfile) },
  ];
  const extras: { label: string; icon?: string; action: () => void }[] = [
    { label: "Sinergia", icon: iconSinergia, action: () => navigate("sinergia") },
    { label: "Mercado", icon: iconMercado, action: () => navigate("market") },
    { label: "Código", action: () => act(hud.onCode) },
    { label: "Salvar", action: () => act(hud.onSave) },
  ];

  return <>
    <button className="revo-mobile-bag" type="button" title="Mochila" aria-label="Abrir ou fechar Mochila" onClick={() => navigate("mochila")}>
      <img src={iconMochila} alt="" /><span>Mochila</span>
    </button>
    {hud.mountActive && (
      <button
        className={`revo-mount-toggle${hud.mountOn ? " is-on" : ""}`}
        type="button"
        title={hud.mountOn ? `Montaria SAWSBUCK-S3 ligada · ${hud.mountLabel} restantes. Clique para desmontar.` : `Montaria SAWSBUCK-S3 desligada · ${hud.mountLabel} restantes. Clique para montar.`}
        aria-label={hud.mountOn ? "Desmontar montaria" : "Montar montaria"}
        aria-pressed={!!hud.mountOn}
        onClick={() => hud.onToggleMount?.()}
      >
        <img src={iconMontaria} alt="" />
        <span>{hud.mountLabel}</span>
      </button>
    )}
    <button className="revo-main-menu-trigger" type="button" aria-label={open ? "Fechar menu principal" : "Abrir menu principal"} aria-expanded={open} onClick={() => onOpenChange(!open)}>
      <img className="revo-main-menu-trigger__art" src={menuTriggerIcon} alt="" /><span>MENU</span>
    </button>
    {open && createPortal(<div className="revo-main-menu-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onOpenChange(false); }}>
      <section className="revo-main-menu" role="dialog" aria-modal="true" aria-label="Menu principal" style={{ backgroundImage: `url(${menuBase})` }}>
        <button className="revo-main-menu__close" type="button" aria-label="Fechar menu principal" onClick={() => onOpenChange(false)} />
        {items.map((item) => <button className="revo-main-menu__item" key={item.label} type="button" title={item.label} onClick={item.action} style={{ "--menu-x": `${item.x}%`, "--menu-y": `${item.y}%`, "--menu-accent": item.color, "--menu-effect": `url(${menuEffect})` } as CSSProperties}>
          <span className="revo-main-menu__symbol" aria-hidden="true"><img src={item.icon} alt="" /></span><span className="revo-main-menu__label">{item.label}</span>
        </button>)}
        <div className="revo-main-menu__extras" aria-label="Mais sistemas">
          {extras.map((item) => <button key={item.label} type="button" onClick={item.action}>{item.icon && <img src={item.icon} alt="" aria-hidden="true" />}{item.label}</button>)}
        </div>
      </section>
    </div>, document.body)}
  </>;
}
