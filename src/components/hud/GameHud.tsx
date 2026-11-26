import { useState, type CSSProperties, type ReactNode } from "react";
import { Bell, ChevronDown, ChevronUp, Coins, Compass, Crosshair, Home, Map, MapPin, Minus, Plus, Settings, Shield, Trophy, Zap } from "lucide-react";
import { ChatHud, type HudMessage } from "./ChatHud";
import { QuestTracker, type HudQuest } from "./QuestTracker";
import { CaptureQuestHud, type CaptureQuestView } from "./CaptureQuestHud";
import type { CaptureChestReward, CaptureChestView } from "@/game/captureQuests";
import { TeamHud, type HudTeamMember } from "./TeamHud";
import { TargetHud, type HudTarget } from "./TargetHud";
import { getHudScale, type HudMapBounds } from "./hudLayout";
import { MainMenu } from "./MainMenu";
import { TouchJoystick } from "./TouchJoystick";
import { TrainerGuide } from "@/components/TrainerGuide";
import "./hud.css";
import "./mobile-landscape.css";

export type HudTab = "pokemon" | "mochila" | "colecao" | "pokedex" | "melhorias" | "sinergia" | "market" | "wallet";
type Point = { x: number; y: number };
export type GameHudProps = {
  name: string; level: number; avatar: string; hp: number; maxHp: number; energy: number; hunger: number;
  stars?: number;
  /** HUD V2 — liberada para todas as contas. */
  newHud?: boolean;
  trainerHp?: number;
  ballCount: number; throws: number; maxThrows: number; gold: number; crystals: number; rubies: number; pepitas?: number;
  pvpTargeted?: boolean;
  pvpMode?: "peace" | "offensive" | "pk";
  /** Janela de PvP ativa no mapa atual. */
  pvpActive?: boolean;
  pvpWindowLabel?: string;
  region: string; mapImage: string; world: { width: number; height: number }; player: Point;
  enemies: Point[]; mapFilter?: string; now: number; zoom: number; auto: boolean; autoCapture: boolean;
  activeTab: string; vip: boolean; questReset: string; quests: HudQuest[]; messages: HudMessage[];
  icons: Record<HudTab | "ball" | "crystal" | "ruby" | "potion", string>;
  forgeNotification: boolean; onTab: (tab: HudTab) => void; onProfile: () => void;
  onMap: () => void; onEvents: () => void; onBigMap: () => void; onSettings: () => void; onCombatSettings: () => void; onRank: () => void;
  onQuests: () => void; onClaimQuest: (id: string) => void; onAuto: () => void;
  onAutoHeal: () => void; autoHealEnabled: boolean; autoHealThreshold: number; potionCount?: number;
  /** Ação contextual de Epic Plant — aparece ao tocar a zona vermelha no ARV. */
  epicPlantPrompt?: boolean;
  epicPlantCasting?: boolean;
  epicPlantCooldownLabel?: string;
  onEpicPlant?: () => void;
  onMapEditor: () => void; mapEditorActive: boolean; mapEditorEnabled?: boolean;
  onPvpMode: () => void;
  onCapture: () => void; onTargets: () => void; targetsOpen: boolean;
  onForge: () => void; onSave: () => void; onShop: () => void; onGuild: () => void; onCode: () => void;
  /** Montaria SAWSBUCK-S3: janela de 24h ativa (ícone visível) + estado on/off + tempo restante. */
  mountActive?: boolean;
  mountOn?: boolean;
  mountLabel?: string;
  onToggleMount?: () => void;
  onZoom: (direction: 1 | -1) => void;
  team: HudTeamMember[]; selectedPetUid: string | null; onSelectPet: (uid: string) => void; onOpenPetCard?: (uid: string) => void;
  onJoystickMove: (x: number, y: number) => void;
  mapBounds: HudMapBounds; viewportWidth: number; target: HudTarget | null;
  guideAccountId?: string;
  captureQuests?: CaptureQuestView[];
  captureQuestMilestones?: number[];
  captureQuestImages?: Record<string, string>;
  captureQuestSheets?: Record<string, string>;
  captureQuestChests?: CaptureChestView[];
  onOpenCaptureChest?: (chestId: string) => CaptureChestReward | null;
};

function IconButton({ label, children, onClick, active = false, badge = false, className = "", guideTarget }: {
  label: string; children: ReactNode; onClick: () => void; active?: boolean; badge?: boolean; className?: string; guideTarget?: string;
}) {
  return <button type="button" data-guide-target={guideTarget} className={`revo-icon ${active ? "is-active" : ""} ${className}`} title={label} aria-label={label} aria-pressed={active} onClick={onClick}>
    {children}{badge && <span className="revo-badge" />}
  </button>;
}

function PlayerHud({ hud }: { hud: GameHudProps }) {
  const hp = Math.max(0, Math.min(hud.maxHp, Math.round(hud.hp)));
  const pct = Math.round((hp / Math.max(1, hud.maxHp)) * 100);
  const label = `Perfil de ${hud.name}, nível ${hud.level}. HP do líder: ${hp}/${hud.maxHp}`;
  if (!hud.newHud) {
    return <button type="button" className="revo-player revo-panel" onClick={hud.onProfile} title="Perfil do treinador · HP do Pokémon líder" aria-label={label}>
      <span className="revo-player__avatar"><img src={hud.avatar} alt="" /><span><Shield /></span></span>
      <span className="revo-player__info">
        <span className="revo-player__name"><strong>{hud.name}</strong><b>Lv. {hud.level} {hud.stars ? "★".repeat(Math.min(7, hud.stars)) : ""}</b></span>
        <span className="revo-player__stat"><span>HP</span><span className="revo-meter revo-meter--hp"><span style={{ width: `${hp / Math.max(1, hud.maxHp) * 100}%` }} /></span><b>{hp}/{hud.maxHp}</b></span>
        <span className="revo-player__stat"><span>EN</span><span className="revo-meter revo-meter--energy"><span style={{ width: `${Math.max(0, Math.min(100, hud.energy))}%` }} /></span><b>{Math.round(hud.energy)}/100</b></span>
        {hud.trainerHp != null && <span className="revo-player__stat" title="Vida do treinador no Safari — fica vulnerável com o Pokémon desmaiado"><span>TR</span><span className="revo-meter revo-meter--hp"><span style={{ width: `${Math.max(0, Math.min(100, hud.trainerHp))}%` }} /></span><b>{hud.trainerHp}/100</b></span>}
      </span>
    </button>;
  }
  return <button type="button" className="revo-player revo-panel revo-player--ring" onClick={hud.onProfile} title="Perfil do treinador · HP do Pokémon líder" aria-label={label}>
    <span className="revo-player__ring" style={{ ["--pct" as string]: pct } as CSSProperties}>
      <span className="revo-player__ring-inner">
        <img src={hud.avatar} alt="" />
      </span>
    </span>
    <span className="revo-player__info">
      <span className="revo-player__name"><strong>{hud.name}</strong><b>Lv. {hud.level} {hud.stars ? "★".repeat(Math.min(7, hud.stars)) : ""}</b></span>
      <span className="revo-player__hp"><b>{hp}</b><span>/{hud.maxHp} HP</span></span>
      {hud.trainerHp != null && <span className="revo-player__meta">❤ {Math.round(hud.trainerHp)}</span>}
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
    { label: "Pepitas de Ouro", icon: <img src={hud.icons.ruby} alt="" />, value: number(hud.pepitas ?? 0) },
    { label: "Rubis", icon: <img src={hud.icons.ruby} alt="" />, value: number(hud.rubies) },
  ];
  return <div className="revo-resources" aria-label="Recursos do treinador">{resources.map((resource) =>
    <div key={resource.label} className="revo-resource" title={`${resource.label}: ${resource.value}`} aria-label={`${resource.label}: ${resource.value}`}>{resource.icon}<strong>{resource.value}</strong></div>)}
  </div>;
}

function MinimapHud({ hud }: { hud: GameHudProps }) {
  const [collapsed, setCollapsed] = useState(false);
  const [focused, setFocused] = useState(false);
  const position = (point: Point) => ({ left: `${Math.max(0, Math.min(100, point.x / Math.max(1, hud.world.width) * 100))}%`, top: `${Math.max(0, Math.min(100, point.y / Math.max(1, hud.world.height) * 100))}%` });
  return <section
    className={`revo-minimap revo-panel ${focused ? "is-focused" : "is-passive"} ${hud.newHud ? "is-compass" : ""}`}
    aria-label={`${focused ? "Minimapa em destaque" : "Minimapa discreto"} de ${hud.region}`}
    onClick={() => { if (!focused) setFocused(true); }}
  >
    <header className="revo-panel__header"><MapPin className="revo-gold" /><strong title={hud.region}>{hud.region}</strong><span className="revo-channel" title="A instância atual não expõe seletor de canal">SOLO</span><button type="button" className="revo-icon" aria-label={collapsed ? "Expandir minimapa" : "Recolher minimapa"} aria-expanded={!collapsed} onClick={() => setCollapsed(!collapsed)}>{collapsed ? <ChevronDown /> : <ChevronUp />}</button></header>
    {!collapsed && <>
      <div className="revo-minimap__body">
        <button
          type="button"
          className="revo-minimap__preview"
          onClick={(event) => {
            event.stopPropagation();
            if (!focused) { setFocused(true); return; }
            hud.onBigMap();
          }}
          title={focused ? "Abrir mapa da região" : "Ativar destaque do minimapa"}
          aria-label={focused ? "Abrir mapa da região" : "Ativar destaque do minimapa"}
        >
          <img src={hud.mapImage} alt={`Mapa de ${hud.region}`} style={{ filter: hud.mapFilter }} />
          {hud.enemies.slice(0, 45).map((enemy, index) => <span key={index} className="revo-minimap__enemy" style={position(enemy)} />)}
          <span className="revo-minimap__player" style={position(hud.player)}><span /></span>
        </button>
        <div className="revo-minimap__tools">
          <IconButton label="Aumentar zoom" onClick={() => hud.onZoom(1)}><Plus /></IconButton>
          <IconButton label="Diminuir zoom" onClick={() => hud.onZoom(-1)}><Minus /></IconButton>
          <IconButton label="Mapa Mundi e teleporte" guideTarget="world-map" onClick={hud.onMap}><Map /></IconButton>
        </div>
      </div>
      <footer><span><Compass size={11} /> X {Math.round(hud.player.x)} · Y {Math.round(hud.player.y)}</span><span>{Math.round(hud.zoom * 100)}%</span></footer>
    </>}
  </section>;
}

export function GameHud(hud: GameHudProps) {
  const [noticesOpen, setNoticesOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const readyQuests = hud.quests.filter((quest) => !quest.claimed && quest.progress >= quest.target && (!quest.vipOnly || hud.vip)).length;
  const inPanel = hud.activeTab !== "batalha";
  const scale = getHudScale(hud.mapBounds, hud.viewportWidth);
  return <div className="revo-hud-frame" style={{ left: hud.mapBounds.left, top: hud.mapBounds.top, width: hud.mapBounds.width, height: hud.mapBounds.height }}>
    <div className={`revo-hud ${inPanel ? "has-panel" : ""} ${hud.target ? "has-target" : ""} ${hud.newHud ? "is-newhud" : ""}`} style={{ "--hud-scale": scale } as CSSProperties} onKeyDown={(event) => {
    if ((event.key === " " || event.key === "Enter") && (event.target as HTMLElement).closest("button")) event.stopPropagation();
  }}>
    {!menuOpen && <>
    <PlayerHud hud={hud} />
    <ResourceBar hud={hud} />
    <div className="revo-systems" aria-label="Atalhos do jogo">
      <IconButton label="Ranking" onClick={hud.onRank}><Trophy /></IconButton>
      <IconButton label="Notificações" active={noticesOpen} badge={readyQuests > 0 || hud.forgeNotification} onClick={() => setNoticesOpen(!noticesOpen)}><Bell /></IconButton>
      <IconButton label="Configurações" onClick={hud.onSettings}><Settings /></IconButton>
    </div>
    {noticesOpen && <section className="revo-notices revo-panel" aria-label="Notificações"><header className="revo-panel__header"><Bell /><strong>Notificações</strong></header>
      {readyQuests > 0 && <button type="button" onClick={() => { hud.onQuests(); setNoticesOpen(false); }}>{readyQuests} missão(ões) pronta(s) para resgatar.</button>}
      {hud.forgeNotification && <button type="button" onClick={() => { hud.onForge(); setNoticesOpen(false); }}>Há novidades na Forja.</button>}
      {!readyQuests && !hud.forgeNotification && <p>Você está em dia. Boa aventura!</p>}
    </section>}
    {!inPanel && <>
      {hud.target && <TargetHud target={hud.target} />}
      <TeamHud newHud={!!hud.newHud} members={hud.team} selectedUid={hud.selectedPetUid} onSelect={hud.onSelectPet} onOpenCard={hud.onOpenPetCard} onManage={() => hud.onTab("pokemon")} />
      <div className="revo-right-stack">
        <MinimapHud hud={hud} />
        {!hud.newHud && hud.guideAccountId && <TrainerGuide accountId={hud.guideAccountId} />}
        {hud.newHud
          ? <CaptureQuestHud
              quests={hud.captureQuests ?? []}
              milestones={hud.captureQuestMilestones ?? []}
              pokemonImages={hud.captureQuestImages}
              pokemonSheets={hud.captureQuestSheets}
              chests={hud.captureQuestChests}
              onOpenChest={hud.onOpenCaptureChest}
            />
          : <QuestTracker quests={hud.quests} region={hud.region} resetIn={hud.questReset} vip={hud.vip} onClaim={hud.onClaimQuest} onOpen={hud.onQuests} />}
      </div>
      <ChatHud messages={hud.messages} pvpActive={hud.pvpActive} pvpWindowLabel={hud.pvpWindowLabel} />
      <TouchJoystick onMove={hud.onJoystickMove} />
      <div className="revo-actions" aria-label="Ações de combate">
        {hud.epicPlantPrompt && hud.onEpicPlant && (
          <button
            type="button"
            className={`revo-epic-plant ${!hud.epicPlantCasting && !hud.epicPlantCooldownLabel ? "is-active" : ""}`}
            onClick={hud.onEpicPlant}
            disabled={hud.epicPlantCasting || !!hud.epicPlantCooldownLabel}
            title={hud.epicPlantCooldownLabel
              ? `Epic Plant em recarga: ${hud.epicPlantCooldownLabel}`
              : "Criar ponte Epic Plant na direção em que o treinador está olhando"}
          >
            <span aria-hidden="true">🌿</span>
            <strong>{hud.epicPlantCasting ? "Criando…" : hud.epicPlantCooldownLabel ?? "Epic"}</strong>
          </button>
        )}
        <button type="button" className={`revo-auto ${hud.auto ? "is-active" : ""} ${hud.pvpTargeted ? "is-pvp-targeted" : ""}`} onClick={hud.onAuto} aria-pressed={hud.auto} title={hud.pvpTargeted ? "Alvo PvP marcado — clique em Auto para atacar" : (hud.auto ? "Desligar batalha automática (Espaço)" : "Ligar batalha automática (Espaço)")}>
          <span><img src={hud.icons.ball} alt="" /></span><strong>Auto</strong>
        </button>
        <button type="button" className={`revo-potion ${hud.autoHealEnabled ? "is-active" : ""}`} onClick={hud.onAutoHeal} aria-pressed={hud.autoHealEnabled} title={hud.autoHealEnabled ? "Desligar poção automática" : "Ligar poção automática (cura o Pokémon líder)"}>
          <span><img src={hud.icons.potion} alt="" /></span><strong>Potion</strong>
          <i className="revo-potion__fill" style={{ width: `${Math.min(100, ((hud.potionCount ?? 0) / 20) * 100)}%` } as CSSProperties} />
        </button>
        <div className="revo-actions__secondary">
          {hud.mapEditorEnabled && <IconButton label="Editor de mapa: objetos e Pokémon" active={hud.mapEditorActive} onClick={hud.onMapEditor}><Home /></IconButton>}
          <IconButton label="Mostrar ou recolher alvos próximos" active={hud.targetsOpen} onClick={hud.onTargets}><Crosshair /></IconButton>
          <IconButton
            label={hud.pvpActive
              ? `PvP ativo: ${hud.pvpMode === "pk" ? "PK" : hud.pvpMode === "offensive" ? "Ofensivo" : "Paz"}`
              : "PvP indisponível — janela de Paz (abre na próxima hora cheia)"}
            active={!!hud.pvpActive && hud.pvpMode !== "peace"}
            className={hud.pvpActive ? "revo-pvp-active" : ""}
            onClick={hud.onPvpMode}
          ><Shield /></IconButton>
          <IconButton label={hud.autoCapture ? "Captura automática ligada" : "Captura automática desligada"} guideTarget="capture" className="revo-capture-toggle" active={hud.autoCapture} onClick={hud.onCapture}><img src={hud.icons.ball} alt="" /></IconButton>
          <IconButton label="Configurar combate automático" onClick={hud.onCombatSettings}><Settings /></IconButton>
        </div>
      </div>
    </>}
    </>}
    <MainMenu hud={hud} open={menuOpen} onOpenChange={setMenuOpen} />
    </div>
  </div>;
}
