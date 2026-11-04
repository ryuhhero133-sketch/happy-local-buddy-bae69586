import { useState, type CSSProperties, type ReactNode } from "react";
import { Anvil, Bell, BookOpen, ChevronDown, ChevronUp, CloudUpload, Coins, Compass, Crosshair, Gift, Map, MapPin, Minus, Plus, Settings, Shield, Sun, Trophy, Users, Utensils, Zap } from "lucide-react";
import { ChatHud, type HudMessage } from "./ChatHud";
import { QuestTracker, type HudQuest } from "./QuestTracker";
import { TeamHud, type HudTeamMember } from "./TeamHud";
import { TargetHud, type HudTarget } from "./TargetHud";
import { getHudScale, type HudMapBounds } from "./hudLayout";
import "./hud.css";

export type HudTab = "pokemon" | "mochila" | "colecao" | "pokedex" | "melhorias" | "market" | "wallet";
type Point = { x: number; y: number };
export type GameHudProps = {
  name: string; level: number; avatar: string; hp: number; maxHp: number; energy: number; hunger: number;
  trainerHp?: number;
  ballCount: number; throws: number; maxThrows: number; gold: number; crystals: number; rubies: number;
  region: string; mapImage: string; world: { width: number; height: number }; player: Point;
  enemies: Point[]; mapFilter?: string; now: number; zoom: number; auto: boolean; autoCapture: boolean;
  activeTab: string; vip: boolean; questReset: string; quests: HudQuest[]; messages: HudMessage[];
  icons: Record<HudTab | "ball" | "crystal" | "ruby" | "potion", string>;
  forgeNotification: boolean; onTab: (tab: HudTab) => void; onProfile: () => void;
  onMap: () => void; onBigMap: () => void; onSettings: () => void; onCombatSettings: () => void; onRank: () => void;
  onQuests: () => void; onClaimQuest: (id: string) => void; onAuto: () => void;
  onAutoHeal: () => void; autoHealEnabled: boolean; autoHealThreshold: number;
  onCapture: () => void; onTargets: () => void; targetsOpen: boolean;
  onForge: () => void; onSave: () => void; onShop: () => void; onGuild: () => void; onCode: () => void;
  onZoom: (direction: 1 | -1) => void;
  team: HudTeamMember[]; selectedPetUid: string | null; onSelectPet: (uid: string) => void;
  mapBounds: HudMapBounds; viewportWidth: number; target: HudTarget | null;
};

function IconButton({ label, children, onClick, active = false, badge = false }: {
  label: string; children: ReactNode; onClick: () => void; active?: boolean; badge?: boolean;
}) {
  return <button type="button" className={`revo-icon ${active ? "is-active" : ""}`} title={label} aria-label={label} aria-pressed={active} onClick={onClick}>
    {children}{badge && <span className="revo-badge" />}
  </button>;
}

function PlayerHud({ hud }: { hud: GameHudProps }) {
  const hp = Math.max(0, Math.min(hud.maxHp, Math.round(hud.hp)));
  return <button type="button" className="revo-player revo-panel" onClick={hud.onProfile} title="Perfil do treinador · HP do Pokémon líder" aria-label={`Perfil de ${hud.name}, nível ${hud.level}. HP do líder: ${hp}/${hud.maxHp}`}>
    <span className="revo-player__avatar"><img src={hud.avatar} alt="" /><span><Shield /></span></span>
    <span className="revo-player__info">
      <span className="revo-player__name"><strong>{hud.name}</strong><b>Lv. {hud.level}</b></span>
      <span className="revo-player__stat"><span>HP</span><span className="revo-meter revo-meter--hp"><span style={{ width: `${hp / Math.max(1, hud.maxHp) * 100}%` }} /></span><b>{hp}/{hud.maxHp}</b></span>
      <span className="revo-player__stat"><span>EN</span><span className="revo-meter revo-meter--energy"><span style={{ width: `${Math.max(0, Math.min(100, hud.energy))}%` }} /></span><b>{Math.round(hud.energy)}/100</b></span>
      {hud.trainerHp != null && <span className="revo-player__stat" title="Vida do treinador no Safari — fica vulnerável com o Pokémon desmaiado"><span>TR</span><span className="revo-meter revo-meter--hp"><span style={{ width: `${Math.max(0, Math.min(100, hud.trainerHp))}%` }} /></span><b>{hud.trainerHp}/100</b></span>}
    </span>
  </button>;
}

function ResourceBar({ hud }: { hud: GameHudProps }) {
  const number = (value: number) => Math.floor(value).toLocaleString("pt-BR");
  const resources = [
    { label: "Energia do treinador", icon: <Zap className="revo-energy-icon" />, value: `${Math.round(hud.energy)}%` },
    { label: "Pokébolas comuns na mochila", icon: <img src={hud.icons.ball} alt="" />, value: number(hud.ballCount) },
    { label: "Arremessos disponíveis", icon: <Crosshair className="revo-throws-icon" />, value: `${hud.throws}/${hud.maxThrows}` },
    { label: "Ouro no banco", icon: <Coins className="revo-gold" />, value: number(hud.gold) },
    { label: "Cristais azuis", icon: <img src={hud.icons.crystal} alt="" />, value: number(hud.crystals) },
    { label: "Rubis", icon: <img src={hud.icons.ruby} alt="" />, value: number(hud.rubies) },
  ];
  return <div className="revo-resources" aria-label="Recursos do treinador">{resources.map((resource) =>
    <div key={resource.label} className="revo-resource" title={`${resource.label}: ${resource.value}`} aria-label={`${resource.label}: ${resource.value}`}>{resource.icon}<strong>{resource.value}</strong></div>)}
  </div>;
}

function MinimapHud({ hud }: { hud: GameHudProps }) {
  const [collapsed, setCollapsed] = useState(false);
  const position = (point: Point) => ({ left: `${Math.max(0, Math.min(100, point.x / Math.max(1, hud.world.width) * 100))}%`, top: `${Math.max(0, Math.min(100, point.y / Math.max(1, hud.world.height) * 100))}%` });
  return <section className="revo-minimap revo-panel" aria-label={`Minimapa de ${hud.region}`}>
    <header className="revo-panel__header"><MapPin className="revo-gold" /><strong title={hud.region}>{hud.region}</strong><span className="revo-channel" title="A instância atual não expõe seletor de canal">SOLO</span><button type="button" className="revo-icon" aria-label={collapsed ? "Expandir minimapa" : "Recolher minimapa"} aria-expanded={!collapsed} onClick={() => setCollapsed(!collapsed)}>{collapsed ? <ChevronDown /> : <ChevronUp />}</button></header>
    {!collapsed && <>
      <div className="revo-minimap__body">
        <button type="button" className="revo-minimap__preview" onClick={hud.onBigMap} title="Expandir mapa da região" aria-label="Expandir mapa da região">
          <img src={hud.mapImage} alt={`Mapa de ${hud.region}`} style={{ filter: hud.mapFilter }} />
          {hud.enemies.slice(0, 45).map((enemy, index) => <span key={index} className="revo-minimap__enemy" style={position(enemy)} />)}
          <span className="revo-minimap__player" style={position(hud.player)}><span /></span>
        </button>
        <div className="revo-minimap__tools">
          <IconButton label="Aumentar zoom" onClick={() => hud.onZoom(1)}><Plus /></IconButton>
          <IconButton label="Diminuir zoom" onClick={() => hud.onZoom(-1)}><Minus /></IconButton>
          <IconButton label="Mapa Mundi e teleporte" onClick={hud.onMap}><Map /></IconButton>
        </div>
      </div>
      <footer><span><Compass size={11} /> X {Math.round(hud.player.x)} · Y {Math.round(hud.player.y)}</span><span>{Math.round(hud.zoom * 100)}%</span></footer>
    </>}
  </section>;
}

function BottomDock({ hud }: { hud: GameHudProps }) {
  const [collapsed, setCollapsed] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const items: { id: HudTab; label: string; key?: string; unavailable?: boolean }[] = [
    { id: "pokemon", label: "Pokémon" }, { id: "mochila", label: "Mochila", key: "B" },
    { id: "colecao", label: "Coleção", key: "C" }, { id: "pokedex", label: "Pokédex" },
    { id: "melhorias", label: "Melhorias" }, { id: "market", label: "Marketplace", unavailable: true },
    { id: "wallet", label: "Banco" },
  ];
  return <nav className={`revo-dock ${collapsed ? "is-collapsed" : ""}`} aria-label="Menu principal do jogo">
    <button type="button" className="revo-dock__toggle revo-panel" aria-label={collapsed ? "Expandir menu" : "Recolher menu"} aria-expanded={!collapsed} onClick={() => setCollapsed(!collapsed)}>{collapsed ? <ChevronUp /> : <ChevronDown />}</button>
    {!collapsed && <div className="revo-dock__items revo-panel">{items.map((item) => <button key={item.id} type="button" className={`revo-dock__item ${hud.activeTab === item.id ? "is-active" : ""}`} aria-pressed={hud.activeTab === item.id} aria-disabled={item.unavailable} title={`${item.label}${item.key ? ` (${item.key})` : ""}${item.unavailable ? " · Em breve" : ""}`} onClick={() => hud.onTab(item.id)}>
      <img src={hud.icons[item.id]} alt="" />
      {item.unavailable && <span className="revo-coming-soon">EM BREVE</span>}
      <span>{item.label}</span>
    </button>)}
      <div className="revo-dock__more-wrap">
        <button type="button" className="revo-dock__more" title="Mais sistemas" aria-label="Mais sistemas" aria-expanded={moreOpen} onClick={() => setMoreOpen(!moreOpen)}><ChevronUp /></button>
        {moreOpen && <><button type="button" className="revo-menu-dismiss" aria-label="Fechar mais sistemas" onClick={() => setMoreOpen(false)} /><div className="revo-more-menu revo-panel">
          {[
            { text: "Livro de missões", icon: <BookOpen />, action: hud.onQuests },
            { text: "Guilda", icon: <Users />, action: hud.onGuild },
            { text: "Ranking", icon: <Trophy />, action: hud.onRank },
            { text: "Lojinha Cash", icon: <Shield />, action: hud.onShop },
            { text: "Resgatar código", icon: <Gift />, action: hud.onCode },
            { text: "Salvar na nuvem", icon: <CloudUpload />, action: hud.onSave },
          ].map((item) => <button type="button" key={item.text} onClick={() => { item.action(); setMoreOpen(false); }}>{item.icon}{item.text}</button>)}
          <div className="revo-more-menu__hunger"><Utensils /> Saciedade <strong>{Math.round(hud.hunger)}%</strong></div>
        </div></>}
      </div>
    </div>}
  </nav>;
}

export function GameHud(hud: GameHudProps) {
  const [noticesOpen, setNoticesOpen] = useState(false);
  const readyQuests = hud.quests.filter((quest) => !quest.claimed && quest.progress >= quest.target && (!quest.vipOnly || hud.vip)).length;
  const inPanel = hud.activeTab !== "batalha";
  const scale = getHudScale(hud.mapBounds, hud.viewportWidth);
  return <div className="revo-hud-frame" style={{ left: hud.mapBounds.left, top: hud.mapBounds.top, width: hud.mapBounds.width, height: hud.mapBounds.height }}>
    <div className={`revo-hud ${inPanel ? "has-panel" : ""} ${hud.target ? "has-target" : ""}`} style={{ "--hud-scale": scale } as CSSProperties} onKeyDown={(event) => {
    if ((event.key === " " || event.key === "Enter") && (event.target as HTMLElement).closest("button")) event.stopPropagation();
  }}>
    <PlayerHud hud={hud} />
    <ResourceBar hud={hud} />
    <div className="revo-systems" aria-label="Atalhos do jogo">
      <IconButton label="Mapa Mundi" onClick={hud.onMap}><Map /></IconButton>
      <IconButton label="Ranking" onClick={hud.onRank}><Trophy /></IconButton>
      <IconButton label="Notificações" active={noticesOpen} badge={readyQuests > 0 || hud.forgeNotification} onClick={() => setNoticesOpen(!noticesOpen)}><Bell /></IconButton>
      <IconButton label="Configurações" onClick={hud.onSettings}><Settings /></IconButton>
      <div className="revo-clock revo-resource"><Sun /><time dateTime={new Date(hud.now).toISOString()}>{new Date(hud.now).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</time></div>
    </div>
    {noticesOpen && <section className="revo-notices revo-panel" aria-label="Notificações"><header className="revo-panel__header"><Bell /><strong>Notificações</strong></header>
      {readyQuests > 0 && <button type="button" onClick={() => { hud.onQuests(); setNoticesOpen(false); }}>{readyQuests} missão(ões) pronta(s) para resgatar.</button>}
      {hud.forgeNotification && <button type="button" onClick={() => { hud.onForge(); setNoticesOpen(false); }}>Há novidades na Forja.</button>}
      {!readyQuests && !hud.forgeNotification && <p>Você está em dia. Boa aventura!</p>}
    </section>}
    {!inPanel && <>
      {hud.target && <TargetHud target={hud.target} />}
      <TeamHud members={hud.team} selectedUid={hud.selectedPetUid} onSelect={hud.onSelectPet} onManage={() => hud.onTab("pokemon")} />
      <div className="revo-right-stack">
        <MinimapHud hud={hud} />
        <QuestTracker quests={hud.quests} region={hud.region} resetIn={hud.questReset} vip={hud.vip} onClaim={hud.onClaimQuest} onOpen={hud.onQuests} />
      </div>
      <ChatHud messages={hud.messages} />
      <div className="revo-actions" aria-label="Ações de combate">
        <button type="button" className={`revo-auto ${hud.auto ? "is-active" : ""}`} onClick={hud.onAuto} aria-pressed={hud.auto} title={hud.auto ? "Desligar batalha automática (Espaço)" : "Ligar batalha automática (Espaço)"}>
          <span><img src={hud.icons.ball} alt="" /></span><strong>Auto</strong>
        </button>
        <button type="button" className={`revo-potion ${hud.autoHealEnabled ? "is-active" : ""}`} onClick={hud.onAutoHeal} aria-pressed={hud.autoHealEnabled} title={hud.autoHealEnabled ? "Desligar poção automática" : "Ligar poção automática (cura o Pokémon líder)"}>
          <span><img src={hud.icons.potion} alt="" /></span><strong>Potion</strong>
        </button>
        <div className="revo-actions__secondary">
          <IconButton label="Mostrar ou recolher alvos próximos" active={hud.targetsOpen} onClick={hud.onTargets}><Crosshair /></IconButton>
          <IconButton label="Alternar captura automática" active={hud.autoCapture} onClick={hud.onCapture}><img src={hud.icons.ball} alt="" /></IconButton>
          <IconButton label="Configurar combate automático" onClick={hud.onCombatSettings}><Settings /></IconButton>
        </div>
        <button type="button" className="revo-forge revo-panel" onClick={hud.onForge} title="Abrir Forja"><Anvil /><strong>Forja</strong>{hud.forgeNotification && <span className="revo-badge" />}</button>
      </div>
    </>}
    <BottomDock hud={hud} />
    </div>
  </div>;
}
