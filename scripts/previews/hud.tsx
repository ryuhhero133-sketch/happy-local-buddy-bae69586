// Isolated HUD fixture: no authentication, cloud saves, purchases or real combat.
import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { GameHud, type GameHudProps } from "../../src/components/hud/GameHud";
import mapImage from "../../src/assets/mapinha6.webp";
import avatar from "../../src/CHAR/perfil. char Ash.webp";
import pikachu from "../../src/assets/pikachu.gif";
import bulbasaur from "../../src/assets/bulbasaur.gif";
import ball from "../../src/assets/items/icon-pokeball.webp";
import potion from "../../src/assets/items/icon-potion.webp";
import blueCrystal from "../../src/assets/materials/cristal-blue.webp";
import ruby from "../../src/assets/materials/cristal-red.png";

function Preview() {
  const [size, setSize] = useState({ w: innerWidth, h: innerHeight });
  const [auto, setAuto] = useState(false);
  const [healing, setHealing] = useState(true);
  const [lastAction, setLastAction] = useState("nenhuma");
  const [actions, setActions] = useState(0);
  const [joystick, setJoystick] = useState({ x: 0, y: 0 });
  useEffect(() => {
    const resize = () => setSize({ w: innerWidth, h: innerHeight });
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);
  const action = (name: string) => { setLastAction(name); setActions((value) => value + 1); };
  const noop = () => action("atalho");
  const inset = Number(new URLSearchParams(location.search).get("inset")) || 0;
  const props: GameHudProps = {
    newHud: true, layoutAccountId: "hud-preview", name: "MeiaBok", level: 18, avatar,
    hp: 5076, maxHp: 5076, energy: 99, hunger: 100, ballCount: 447, throws: 100, maxThrows: 100,
    gold: 521111, crystals: 4, redCrystals: 1250, pepitas: 28, rubies: 14360,
    region: "Revoland", mapImage, world: { width: 1402, height: 1122 },
    player: { x: 1269, y: 310 }, enemies: [], now: 0, zoom: .9, auto, autoCapture: true,
    activeTab: "batalha", vip: true, questReset: "1h", quests: [], messages: [
      { id: 1, kind: "system", text: "Segure e arraste a HUD para deixar do seu jeitinho." },
      { id: 2, kind: "cap", text: "Um novo companheiro para sua aventura!" },
    ],
    icons: { pokemon: pikachu, mochila: ball, colecao: ball, pokedex: ball, melhorias: ball, sinergia: ball, market: ball, wallet: ball, ball, crystal: blueCrystal, ruby, potion },
    forgeNotification: false,
    onTab: (tab) => action(tab), onProfile: () => action("perfil"), onMap: noop, onEvents: noop, onBigMap: noop,
    onSettings: noop, onCombatSettings: noop, onRank: noop, onQuests: noop, onClaimQuest: noop,
    onAuto: () => { action("auto"); setAuto((value) => !value); },
    onAutoHeal: () => { action("potion"); setHealing((value) => !value); },
    autoHealEnabled: healing, autoHealThreshold: .5, potionCount: 12,
    onMapEditor: noop, mapEditorActive: false, onPvpMode: noop, onCapture: noop,
    onTargets: noop, targetsOpen: false, onForge: noop, onSave: noop, onShop: noop, onGuild: noop, onCode: noop,
    onZoom: noop,
    team: [
      { uid: "a", name: "Pikachu", image: pikachu, level: 18, rarity: "rare", hp: 5076, maxHp: 5076, xp: 50, maxXp: 100, hunger: 100, fainted: false },
      { uid: "b", name: "Bulbasaur", image: bulbasaur, level: 15, rarity: "epic", hp: 100, maxHp: 100, xp: 20, maxXp: 100, hunger: 90, fainted: false },
    ], selectedPetUid: null, onSelectPet: noop,
    onJoystickMove: (x, y) => setJoystick({ x, y }),
    mapBounds: { left: inset, top: inset, width: size.w - inset * 2, height: size.h - inset * 2 },
    viewportWidth: size.w, target: null, captureQuests: [],
  };
  return <main className="revo-game" style={{ background: `#183a28 url("${mapImage}") center / cover no-repeat` }}>
    <GameHud {...props} />
    <output id="fixture-actions" data-count={actions} data-joystick={JSON.stringify(joystick)} style={{ position: "fixed", bottom: 6, left: "40%", background: "#fff5", padding: "2px 8px", borderRadius: 6, color: "#183b29", fontSize: 10, pointerEvents: "none" }}>Prévia local · ação: {lastAction} ({actions})</output>
  </main>;
}
createRoot(document.getElementById("root")!).render(<Preview />);
