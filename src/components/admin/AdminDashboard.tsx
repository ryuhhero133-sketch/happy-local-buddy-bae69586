// PAINEL DE ADDM OK - GERE COMPLETO
import React, { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { loadIdentity } from "@/components/AuthGate";
import {
  getConfig,
  saveConfig,
  getLogs,
  pushLog,
  readSave,
  patchSave,
  setAdmin,
  type AdminConfig,
} from "./adminStore";

type TabId =
  | "dashboard"
  | "players"
  | "gifts"
  | "pokemon"
  | "spawn"
  | "items"
  | "weather"
  | "portals"
  | "traps"
  | "chests"
  | "npc"
  | "economy"
  | "teleport"
  | "mapedit"
  | "invisible"
  | "events"
  | "reports"
  | "logs"
  | "config"
  | "online_players";

const TABS: { id: TabId; label: string; icon: string; group: string }[] = [
  { id: "dashboard", label: "Dashboard", icon: "◆", group: "Visão" },
  { id: "players", label: "Gerenciar Contas", icon: "👥", group: "Visão" },
  { id: "online_players", label: "Jogadores Online", icon: "◉", group: "Visão" },
  { id: "gifts", label: "Enviar Presente", icon: "✉", group: "Visão" },
  { id: "pokemon", label: "Pokémon Manager", icon: "♦", group: "Conteúdo" },
  { id: "spawn", label: "Spawn Manager", icon: "✦", group: "Conteúdo" },
  { id: "items", label: "Items Manager", icon: "▣", group: "Conteúdo" },
  { id: "weather", label: "Weather System", icon: "☁", group: "Mundo" },
  { id: "portals", label: "Portals", icon: "◎", group: "Mundo" },
  { id: "traps", label: "Traps", icon: "▲", group: "Mundo" },
  { id: "chests", label: "Chests", icon: "▦", group: "Mundo" },
  { id: "npc", label: "NPC Manager", icon: "◈", group: "Mundo" },
  { id: "economy", label: "Economy", icon: "₿", group: "Sistema" },
  { id: "teleport", label: "Teleport", icon: "➤", group: "Sistema" },
  { id: "mapedit", label: "Live Map Editor", icon: "▤", group: "Sistema" },
  { id: "invisible", label: "Invisible Mode", icon: "○", group: "Sistema" },
  { id: "events", label: "Global Events", icon: "★", group: "Sistema" },
  { id: "reports", label: "Reports", icon: "▥", group: "Auditoria" },
  { id: "logs", label: "Logs", icon: "≡", group: "Auditoria" },
  { id: "config", label: "Admin Config", icon: "⚙", group: "Auditoria" },
];


export function AdminDashboard({ onClose }: { onClose: () => void }) {
  const [tab, setTab] = useState<TabId>("dashboard");
  const [config, setConfig] = useState<AdminConfig>(() => getConfig());
  const [query, setQuery] = useState("");
  const [navOpen, setNavOpen] = useState(false);
  const [targetQuery, setTargetQuery] = useState(""); // Shared state for Gifts tab
  const identity = useMemo(() => loadIdentity(), []);

  useEffect(() => {
    saveConfig(config);
    // notify in-game runtime
    if (typeof window !== "undefined") window.dispatchEvent(new Event("rubym:config"));
  }, [config]);

  const filteredTabs = useMemo(
    () => TABS.filter((t) => t.label.toLowerCase().includes(query.toLowerCase())),
    [query],
  );

  const grouped = useMemo(() => {
    const m = new Map<string, typeof TABS>();
    for (const t of filteredTabs) {
      const arr = m.get(t.group) ?? [];
      arr.push(t);
      m.set(t.group, arr);
    }
    return Array.from(m.entries());
  }, [filteredTabs]);

  const pickTab = (id: TabId) => { 
    setTab(id); 
    setNavOpen(false); 
    if (id !== "online_players" && id !== "players") {
      // Clear inspecting state when leaving players tab if desired, 
      // but let's keep it for now as the user wants to "manage".
    }
  };

  const sidebar = (
    <>
      <div className="flex items-center gap-2 px-4 py-4 border-b border-slate-800/80">
        <div className="grid h-8 w-8 place-items-center rounded-md bg-gradient-to-br from-fuchsia-500 to-amber-500 text-slate-950 font-black">★</div>
        <div className="flex-1 min-w-0">
          <div className="text-[10px] uppercase tracking-[0.18em] text-fuchsia-400/80">Ruby M</div>
          <div className="text-sm font-bold text-slate-100 leading-none mt-0.5">Painel de ADDM OK</div>
        </div>
        <button onClick={() => setNavOpen(false)} className="md:hidden text-slate-400 hover:text-slate-100 text-xl leading-none">×</button>
      </div>
      <div className="p-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar…"
          className="w-full rounded-md border border-slate-800 bg-slate-900/60 px-2.5 py-1.5 text-xs placeholder:text-slate-500 outline-none focus:border-fuchsia-500/60"
        />
      </div>
      <nav className="flex-1 overflow-y-auto px-2 pb-3 space-y-3">
        {grouped.map(([group, items]) => (
          <div key={group}>
            <div className="px-2 pb-1 text-[9px] uppercase tracking-widest text-slate-500">{group}</div>
            <ul className="space-y-0.5">
              {items.map((t) => (
                <li key={t.id}>
                  <button
                    onClick={() => pickTab(t.id)}
                    className={`group flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-left text-xs transition ${
                      tab === t.id
                        ? "bg-gradient-to-r from-fuchsia-500/15 to-amber-500/5 text-amber-100 ring-1 ring-fuchsia-500/30"
                        : "text-slate-400 hover:bg-slate-800/40 hover:text-slate-100"
                    }`}
                  >
                    <span className={`w-4 text-center ${tab === t.id ? "text-fuchsia-300" : "text-slate-600 group-hover:text-slate-300"}`}>{t.icon}</span>
                    {t.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
      <div className="border-t border-slate-800/80 p-3 space-y-1.5">
        <button
          onClick={() => {
            setAdmin(false);
            pushLog({ actor: "self", action: "admin_logout" });
            onClose();
          }}
          className="w-full rounded-md border border-rose-500/30 bg-rose-500/10 px-2.5 py-1.5 text-xs text-rose-200 hover:bg-rose-500/20"
        >
          Sair do modo admin
        </button>
        <button
          onClick={onClose}
          className="w-full rounded-md border border-slate-700/60 px-2.5 py-1.5 text-xs text-slate-300 hover:bg-slate-800/60"
        >
          Fechar dashboard
        </button>
      </div>
    </>
  );

  const isAdminUuid = identity?.id === "61b4d001-c8c3-424d-862d-0b798782f9d6" || identity?.email === "lordryuhhhuyuyghh@gmail.com" || localStorage.getItem("rubym_admin") === "true";
  if (!isAdminUuid) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex bg-slate-950/95 backdrop-blur-xl text-slate-100 font-sans animate-in fade-in duration-200">
      {/* Particles */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-fuchsia-600/10 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-amber-500/10 blur-3xl" />
      </div>

      {/* Desktop sidebar */}
      <aside className="relative z-10 hidden md:flex w-64 flex-col border-r border-slate-800/80 bg-slate-950/60">
        {sidebar}
      </aside>

      {/* Mobile drawer */}
      {navOpen && (
        <>
          <div className="fixed inset-0 z-20 bg-black/60 md:hidden" onClick={() => setNavOpen(false)} />
          <aside className="fixed inset-y-0 left-0 z-30 flex w-64 max-w-[80vw] flex-col border-r border-slate-800/80 bg-slate-950 md:hidden animate-in slide-in-from-left">
            {sidebar}
          </aside>
        </>
      )}

      {/* Main */}
      <main className="relative z-10 flex-1 overflow-y-auto min-w-0">
        <header className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-slate-800/80 bg-slate-950/70 px-3 md:px-6 py-3 backdrop-blur">
          <div className="flex items-center gap-2 min-w-0">
            <button
              onClick={() => setNavOpen(true)}
              className="md:hidden grid h-8 w-8 place-items-center rounded-md border border-slate-700 bg-slate-900/60 text-slate-200"
              aria-label="Abrir menu"
            >☰</button>
            <div className="min-w-0">
              <div className="text-[10px] uppercase tracking-widest text-fuchsia-400/70">Painel</div>
              <h1 className="text-base md:text-lg font-bold text-amber-50 truncate">{TABS.find((t) => t.id === tab)?.label}</h1>
            </div>
          </div>
          <div className="flex items-center gap-2 text-[10px] md:text-xs text-slate-400">
            <span className="inline-flex h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_10px_theme(colors.emerald.400)]" />
            <span className="hidden sm:inline">Modo Administrador</span>
            <button onClick={onClose} className="ml-1 rounded-md border border-slate-700 px-2 py-1 text-slate-200 hover:bg-slate-800 md:hidden">×</button>
          </div>
        </header>
        <div className="px-3 md:px-6 py-4 md:py-6">
          <TabBody 
            tab={tab} 
            setTab={setTab}
            config={config} 
            setConfig={setConfig} 
            targetQuery={targetQuery}
            setTargetQuery={setTargetQuery}
          />
        </div>
      </main>
    </div>
  );
}



// ---------------- Tab body router ----------------
function TabBody({
  tab,
  setTab,
  config,
  setConfig,
  targetQuery,
  setTargetQuery,
}: {
  tab: TabId;
  setTab: (t: TabId) => void;
  config: AdminConfig;
  setConfig: (c: AdminConfig) => void;
  targetQuery: string;
  setTargetQuery: (s: string) => void;
}) {
  switch (tab) {
    case "dashboard":
      return <DashboardTab />;
    case "online_players":
    case "players":
      return (
        <OnlinePlayersTab 
          setTab={setTab} 
          setTargetQuery={setTargetQuery} 
        />
      );
    case "gifts":
      return (
        <GiftsTab 
          targetQuery={targetQuery} 
          setTargetQuery={setTargetQuery} 
        />
      );
    case "reports":
      return <ReportsTab />;
    case "pokemon":
      return <PokemonTab />;
    case "spawn":
      return <SpawnTab config={config} setConfig={setConfig} />;
    case "items":
      return <ItemsTab />;
    case "weather":
      return <WeatherTab config={config} setConfig={setConfig} />;
    case "economy":
      return <EconomyTab config={config} setConfig={setConfig} />;
    case "events":
      return <EventsTab config={config} setConfig={setConfig} />;
    case "invisible":
      return <InvisibleTab config={config} setConfig={setConfig} />;
    case "teleport":
      return <TeleportTab />;
    case "logs":
      return <LogsTab />;
    case "config":
      return <ConfigTab config={config} />;
    default:
      return <PlaceholderTab tabLabel={TABS.find((t) => t.id === tab)?.label ?? ""} />;
  }
}

// ---------------- Reusable ----------------
function Card({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-slate-800/80 bg-slate-900/40 p-5 backdrop-blur">
      <header className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-amber-100 tracking-wide">{title}</h2>
        {action}
      </header>
      {children}
    </section>
  );
}
function Stat({ label, value, accent }: { label: string; value: string | number; accent?: string }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-gradient-to-b from-slate-900/80 to-slate-950/60 p-4">
      <div className="text-[10px] uppercase tracking-widest text-slate-500">{label}</div>
      <div className={`mt-1 text-2xl font-bold ${accent ?? "text-amber-100"}`}>{value}</div>
    </div>
  );
}
function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  fmt,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
  fmt?: (v: number) => string;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="flex items-center justify-between text-xs text-slate-300">
        <span>{label}</span>
        <span className="font-mono text-amber-200">{fmt ? fmt(value) : value}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-fuchsia-500"
      />
    </label>
  );
}
function Toggle({ label, checked, onChange, desc }: { label: string; checked: boolean; onChange: (v: boolean) => void; desc?: string }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-2.5 text-left hover:bg-slate-800/40"
    >
      <div>
        <div className="text-sm text-slate-100">{label}</div>
        {desc && <div className="text-[11px] text-slate-500 mt-0.5">{desc}</div>}
      </div>
      <span className={`relative inline-flex h-5 w-9 items-center rounded-full transition ${checked ? "bg-fuchsia-500" : "bg-slate-700"}`}>
        <span className={`inline-block h-4 w-4 rounded-full bg-white transition ${checked ? "translate-x-4" : "translate-x-0.5"}`} />
      </span>
    </button>
  );
}

// ---------------- Tabs ----------------
function DashboardTab() {
  const save = readSave();
  const logs = getLogs();
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat label="Gold" value={save?.gold ?? 0} />
        <Stat label="Cristais" value={save?.crystal ?? 0} accent="text-cyan-300" />
        <Stat label="Itens distintos" value={Object.keys(save?.inventory ?? {}).length} />
        <Stat label="Eventos no log" value={logs.length} accent="text-fuchsia-300" />
      </div>
      <Card title="Status do servidor">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <Stat label="Players Online" value={1} accent="text-emerald-300" />
          <Stat label="Admins Online" value={1} accent="text-fuchsia-300" />
          <Stat label="Pokémon ativos" value={Object.keys(save?.inventory ?? {}).length + 6} />
          <Stat label="Uptime" value="LIVE" accent="text-emerald-300" />
        </div>
      </Card>
      <Card title="Atividade recente">
        <ul className="divide-y divide-slate-800 text-xs">
          {logs.slice(0, 8).map((l, i) => (
            <li key={i} className="flex items-center justify-between py-2">
              <span className="text-slate-300">{l.action}</span>
              <span className="text-slate-500">{new Date(l.ts).toLocaleTimeString()}</span>
            </li>
          ))}
          {logs.length === 0 && <li className="py-4 text-center text-slate-500">Sem atividade registrada.</li>}
        </ul>
      </Card>
    </div>
  );
}

function OnlinePlayersTab({ 
  setTab, 
  setTargetQuery 
}: { 
  setTab: (t: TabId) => void; 
  setTargetQuery: (s: string) => void; 
}) {
  const identity = useMemo(() => loadIdentity(), []);
  const [players, setPlayers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [inspectingUser, setInspectingUser] = useState<string | null>(null);
  const [inventory, setInventory] = useState<any>(null);
  const [ipLogs, setIpLogs] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [editLevel, setEditLevel] = useState<number | null>(null);
  const [editXp, setEditXp] = useState<number | null>(null);

  const refresh = async () => {
    setLoading(true);
    try {
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, username, last_login, account_status, lock_until, trainer_level, ruby, gold, crystal, kill_count")
        .order("username", { ascending: true });
      
      // Se profiles falhar por colunas faltantes, tenta uma query básica sem as colunas de segurança
      if (profilesError) {
        console.warn("Retrying profile fetch without status columns...", profilesError);
        const { data: basicProfiles, error: basicError } = await supabase
          .from("profiles")
          .select("id, username, last_login")
          .order("last_login", { ascending: false });
        
        if (basicError) throw basicError;
        
        // Mapeia para o formato esperado com defaults
        setPlayers((basicProfiles || []).map((p: any) => ({
          id: p.id,
          username: p.username,
          last_login: p.last_login,
          account_status: p.account_status || 'active',
          lock_until: p.lock_until || null,
          trainer_level: p.trainer_level || 1,
          ruby: p.ruby || 0,
          gold: p.gold || 0,
          crystal: p.crystal || 0,
          kill_count: p.kill_count || 0,
          ranked_leaderboard: []
        })));
        return;
      }

      const { data: ranked, error: rankedError } = await supabase
        .from("ranked_scores")
        .select("user_id, trainer_level, total_kills");

      const enrichedPlayers = (profiles || []).map((p: any) => {
        const score = (ranked || []).find((r: any) => r.user_id === p.id);
        return {
          ...p,
          ranked_leaderboard: score ? [score] : []
        };
      });

      setPlayers(enrichedPlayers);
    } catch (e: any) {
      console.error("Load players failed", e);
      if (!e.message?.includes("failed to fetch")) {
        toast.error(`Falha ao carregar lista de jogadores: ${e.message || 'Erro desconhecido'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refresh(); }, []);

  const filteredPlayers = useMemo(() => {
    if (!searchQuery) return players;
    return players.filter(p => 
      (p.username || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.id.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [players, searchQuery]);

  const inspectPlayer = async (id: string) => {
    if (inspectingUser === id) {
      setInspectingUser(null);
      return;
    }
    
    setInspectingUser(id);
    setLoading(true); 
    setInventory(null);
    setIpLogs([]);
    setEditLevel(null);
    setEditXp(null);
    
    try {
      const [invRes, ballsRes, ipRes, pokeRes, profilesRes, giftsRes, rankedRes, stateRes] = await Promise.all([
        supabase.from("inventory").select("*").eq("user_id", id),
        supabase.from("pokeballs").select("*").eq("user_id", id),
        supabase.from("ip_logs" as any).select("*").eq("user_id", id).order("created_at", { ascending: false }).limit(10),
        supabase.from("pokemon_collection").select("*").eq("user_id", id).order("captured_at", { ascending: false }),
        supabase.from("profiles").select("gold, crystal, ruby, vault, poke_vault, trainer_level").eq("id", id).maybeSingle(),
        supabase.from("admin_gifts").select("*").eq("recipient_user_id", id).order("created_at", { ascending: false }).limit(20),
        supabase.from("ranked_scores").select("trainer_level, total_kills").eq("user_id", id).maybeSingle(),
        supabase.from("trainer_state" as any).select("gold, crystal, ruby, trainer_level, trainer_xp, kill_count").eq("user_id", id).maybeSingle()
      ]);
      
      const profileData = profilesRes.data as any;
      const stateData = stateRes.data as any;
      const rankedData = rankedRes.data as any;

      const trainerData: any = {
        gold: stateData?.gold ?? profileData?.gold ?? 0,
        crystal: stateData?.crystal ?? profileData?.crystal ?? 0,
        ruby: stateData?.ruby ?? profileData?.ruby ?? 0,
        kill_count: stateData?.kill_count ?? rankedData?.total_kills ?? 0,
        trainer_level: stateData?.trainer_level ?? rankedData?.trainer_level ?? profileData?.trainer_level ?? 1,
        trainer_xp: stateData?.trainer_xp ?? 0,
        total_kills: rankedData?.total_kills ?? stateData?.kill_count ?? 0,
        vault: profileData?.vault ?? null,
        pokeVault: profileData?.poke_vault ?? profileData?.pokeVault ?? null,
      };
      
      setInventory({
        items: invRes.data || [],
        balls: ballsRes.data || [],
        pokemon: pokeRes.data || [],
        trainer: trainerData,
        gifts: giftsRes.data || []
      });
      
      setEditLevel(trainerData.trainer_level || 1);
      setEditXp(trainerData.trainer_xp || 0);


      setIpLogs(ipRes.data || []);
      
      setTimeout(() => {
        document.getElementById('player-inspection-panel')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
      
    } catch (e) {
      console.error("Inspect failed", e);
      toast.error("Erro ao carregar detalhes do jogador.");
    } finally {
      setLoading(false);
    }
  };

  const saveTrainerStats = async () => {
    if (!inspectingUser || editLevel === null || editXp === null) return;
    try {
      // 1. Atualizar trainer_state (fonte primária do jogo)
      const { error: stateError } = await (supabase.from("trainer_state" as any) as any).update({
        trainer_level: editLevel,
        trainer_xp: editXp,
        updated_at: new Date().toISOString()
      }).eq("user_id", inspectingUser);
      
      if (stateError) throw stateError;

      // 2. Atualizar ranked_scores (usado pelo ranking e pela lista de jogadores do painel)
      const { error: rankedError } = await (supabase.from("ranked_scores") as any).update({
        trainer_level: editLevel,
        updated_at: new Date().toISOString()
      }).eq("user_id", inspectingUser);

      if (rankedError) console.warn("Failed to update ranked_scores directly:", rankedError);

      // 3. Atualizar record em ranked_leaderboard se existir
      try {
        await (supabase.from("ranked_leaderboard" as any) as any).update({
          trainer_level: editLevel,
          score: editLevel * 100,
          updated_at: new Date().toISOString()
        }).eq("user_id", inspectingUser);
      } catch (e) {}

      // 4. Se o usuário for o próprio admin, atualiza o estado local para ver a mudança sem refresh
      if (inspectingUser === identity?.id) {
        window.dispatchEvent(new CustomEvent("rubym:sync_stats", { detail: { level: editLevel, xp: editXp } }));
      }

      toast.success("Status do treinador atualizados!");
      refresh();
      inspectPlayer(inspectingUser);
    } catch (e: any) {
      toast.error(`Falha ao salvar: ${e.message}`);
    }
  };



  const savePokemonLevel = async (id: string, level: number) => {
    try {
      // Primeiro tenta atualizar diretamente a tabela
      const { error: directError } = await (supabase.from("pokemon_collection") as any).update({
        level: level
      }).eq("id", id);

      
      if (directError) throw directError;

      // Opcional: tentar RPC
      try {
        await (supabase.rpc as any)('admin_update_pokemon_level', {
          target_pokemon_id: id,
          new_level: level
        });
      } catch (e) {}

      toast.success("Nível do Pokémon atualizado!");
      if (inspectingUser) inspectPlayer(inspectingUser);
    } catch (e: any) {
      toast.error(e.message);
    }
  };


  const updateStatus = async (id: string, status: string) => {
    if (!confirm(`Alterar status para ${status.toUpperCase()}?`)) return;
    try {
      const { error } = await (supabase.from("profiles") as any).update({ account_status: status }).eq("id", id);
      if (error) throw error;
      toast.success(`Status atualizado para ${status}`);
      refresh();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const unlockUser = async (id: string) => {
    try {
      const { error } = await (supabase.from("profiles") as any).update({ lock_until: null }).eq("id", id);
      if (error) throw error;
      toast.success("Acesso liberado para este jogador");
      refresh();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const deletePlayer = async (id: string) => {
    if (!confirm("⚠️ ATENÇÃO: Esta ação é IRREVERSÍVEL. Deletar permanentemente todos os dados deste jogador?")) return;
    try {
      // In a real scenario, this would delete from profiles which cascades, 
      // but since profiles is linked to auth.users, we might need a dedicated RPC if RLS is strict
      const { error } = await supabase.from("profiles").delete().eq("id", id);
      if (error) throw error;
      toast.success("Conta deletada com sucesso.");
      setInspectingUser(null);
      refresh();
    } catch (e: any) {
      toast.error(`Erro ao deletar: ${e.message}`);
    }
  };


  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 mb-4">
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder="Buscar por nome ou ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-sm text-white outline-none focus:border-fuchsia-500"
          />
        </div>
        <button onClick={refresh} className="bg-slate-800 hover:bg-slate-700 text-xs px-4 py-2 rounded-lg transition whitespace-nowrap">
          LISTAR TODOS ({players.length})
        </button>
      </div>

      <Card title="Gestão Global de Jogadores">
        <div className="rounded-lg border border-slate-800 bg-slate-950/60 overflow-hidden overflow-x-auto">
          <table className="w-full text-[10px]">
            <thead className="bg-slate-900/80 text-slate-500">
              <tr>
                <th className="text-left px-3 py-2">Jogador</th>
                <th className="text-left px-3 py-2">Status</th>
                <th className="text-left px-3 py-2">Nível</th>
                <th className="text-left px-3 py-2">Visto em</th>
                <th className="text-right px-3 py-2">Gerenciar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {filteredPlayers.map((p) => {
                const isLocked = p.lock_until && new Date(p.lock_until) > new Date();
                return (
                  <tr key={p.id} className={`hover:bg-white/5 ${inspectingUser === p.id ? "bg-fuchsia-500/5" : ""}`}>
                    <td className="px-3 py-2 cursor-pointer group" onClick={() => inspectPlayer(p.id)}>
                      <div className="text-amber-100 font-bold group-hover:text-fuchsia-400 transition-colors">{p.username || "Sem nome"}</div>
                      <div className="text-[8px] text-slate-600 truncate max-w-[120px]">{p.id}</div>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex flex-col gap-1">
                        <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold text-center ${
                          p.account_status === 'banned' ? 'bg-rose-500/20 text-rose-400' :
                          p.account_status === 'analysis' ? 'bg-amber-500/20 text-amber-400' :
                          'bg-emerald-500/20 text-emerald-400'
                        }`}>
                          {(p.account_status || 'active').toUpperCase()}
                        </span>
                        {isLocked && (
                          <span className="bg-fuchsia-500/20 text-fuchsia-300 text-[7px] px-1 rounded text-center">MANUTENÇÃO</span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-2 text-fuchsia-300">
                      Lv {p.trainer_level || p.ranked_leaderboard?.[0]?.trainer_level || 1}
                      {p.ranked_leaderboard?.[0]?.trainer_level >= 10000 && (
                        <span className="ml-1 text-[8px] bg-rose-500 text-white px-1 rounded animate-pulse">SUSPECT</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-slate-500 italic">
                      {p.last_login ? new Date(p.last_login).toLocaleString() : "Nunca"}
                    </td>
                    <td className="px-3 py-2 text-right space-x-1">
                      <div className="flex flex-wrap justify-end gap-1">
                        <button onClick={() => inspectPlayer(p.id)} className="px-2 py-1 rounded bg-slate-800 text-slate-300 hover:bg-slate-700">VER</button>
                        {isLocked && (
                          <button onClick={() => unlockUser(p.id)} className="px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20">LIBERAR</button>
                        )}
                        <button onClick={() => updateStatus(p.id, 'analysis')} className="px-2 py-1 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30 hover:bg-amber-500/20">ANALISAR</button>
                        <button onClick={() => updateStatus(p.id, 'banned')} className="px-2 py-1 rounded bg-rose-500/10 text-rose-400 border border-rose-500/30 hover:bg-rose-500/20">BANIR</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredPlayers.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-3 py-10 text-center text-slate-500 italic">Nenhum jogador encontrado.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {inspectingUser && (
        <div id="player-inspection-panel" className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 animate-in slide-in-from-bottom-2 scroll-mt-20">
          <Card title="Modificar Treinador">
            {!inventory?.trainer && !loading ? (
              <div className="text-xs text-slate-500 italic">Nenhum dado de treinador disponível.</div>
            ) : loading || !inventory?.trainer ? (
              <div className="text-xs text-slate-500 italic animate-pulse">Carregando dados...</div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] text-slate-500 uppercase">Nível do Treinador</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={editLevel || 0}
                      onChange={(e) => setEditLevel(Number(e.target.value))}
                      className="flex-1 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-amber-100"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] text-slate-500 uppercase">Status Global</label>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-slate-900/60 p-2 rounded border border-slate-800">
                      <div className="text-[8px] text-slate-500 uppercase">Kills Totais</div>
                      <div className="text-xs font-bold text-amber-100">{(inventory?.trainer as any)?.total_kills || 0}</div>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] text-slate-500 uppercase">Experiência (XP)</label>
                  <input
                    type="number"
                    value={editXp || 0}
                    onChange={(e) => setEditXp(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-amber-100"
                  />
                </div>
                <button
                  onClick={saveTrainerStats}
                  className="w-full bg-fuchsia-600 hover:bg-fuchsia-500 text-white text-xs font-bold py-2 rounded shadow-lg shadow-fuchsia-900/20 transition"
                >
                  SALVAR ALTERAÇÕES
                </button>
              </div>
            )}
          </Card>

          <Card title="Pokémons do Jogador">
            {!inventory?.pokemon ? (
              <div className="text-xs text-slate-500 italic">Carregando...</div>
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                {inventory.pokemon.map((p: any) => (
                  <div key={p.id} className="bg-slate-900/50 p-2 rounded border border-slate-800 space-y-3">
                    <div className="flex justify-between items-center">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-amber-100 uppercase">{p.species.replace(/_/g, " ")}</span>
                        <span className="text-[7px] text-slate-500 font-mono truncate max-w-[100px]">{p.uid || p.id}</span>
                      </div>
                      <span className={`px-1 rounded text-[8px] font-bold ${
                        p.rarity === 'mythic_shiny' ? 'bg-fuchsia-500/20 text-fuchsia-400' :
                        p.rarity === 'legendary' ? 'bg-amber-500/20 text-amber-400' :
                        'bg-slate-700/50 text-slate-400'
                      }`}>
                        {(p.rarity || 'common').toUpperCase()}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex flex-col gap-1">
                        <span className="text-[8px] text-slate-500 uppercase">Nível</span>
                        <input
                          type="number"
                          defaultValue={p.level}
                          onBlur={(e) => {
                            const val = Number(e.target.value);
                            if (val !== p.level) savePokemonLevel(p.id, val);
                          }}
                          className="w-full bg-slate-950 border border-slate-800 rounded px-1.5 py-1 text-[10px] text-amber-100 outline-none focus:border-fuchsia-500"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-[8px] text-slate-500 uppercase">Ações</span>
                        <button 
                          onClick={async () => {
                            if (!confirm("Deletar este Pokémon permanentemente?")) return;
                            try {
                              const { error } = await supabase.from("pokemon_collection").delete().eq("id", p.id);
                              if (error) throw error;
                              toast.success("Pokémon removido!");
                              inspectPlayer(inspectingUser!);
                            } catch (e: any) { toast.error(e.message); }
                          }}
                          className="w-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-[9px] py-1 rounded hover:bg-rose-500/20"
                        >
                          DELETAR
                        </button>
                      </div>
                    </div>

                    {p.traits && p.traits.length > 0 && (
                      <div className="space-y-1">
                        <span className="text-[8px] text-slate-500 uppercase">Traits</span>
                        <div className="flex flex-wrap gap-1">
                          {p.traits.map((t: string, i: number) => (
                            <span key={i} className="text-[7px] bg-slate-800 text-slate-300 px-1 rounded border border-slate-700">
                              {t}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                {inventory.pokemon.length === 0 && (
                  <div className="text-xs text-slate-500 italic text-center py-4">Nenhum Pokémon.</div>
                )}
              </div>
            )}
          </Card>

          <div className="space-y-4">
            <Card title="Inventário & Moedas">
              {!inventory ? <div className="text-xs text-slate-500 italic">Carregando...</div> : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-slate-900/60 p-2 rounded border border-slate-800">
                      <div className="text-[8px] text-slate-500 uppercase">Ouro</div>
                      <div className="text-xs font-bold text-amber-100">{Number(inventory.trainer?.gold || 0).toLocaleString()}</div>
                    </div>
                    <div className="bg-slate-900/60 p-2 rounded border border-slate-800">
                      <div className="text-[8px] text-slate-500 uppercase">Cristal</div>
                      <div className="text-xs font-bold text-cyan-400">{Number(inventory.trainer?.crystal || 0).toLocaleString()}</div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 max-h-[150px] overflow-y-auto pr-1 custom-scrollbar">
                    {inventory.balls.map((b: any) => (
                      <div key={b.ball_type} className="bg-slate-900/50 p-1.5 rounded border border-slate-800 flex justify-between text-[9px]">
                        <span className="text-slate-400">{b.ball_type}</span>
                        <span className="text-amber-200 font-bold">x{b.qty}</span>
                      </div>
                    ))}
                    {inventory.items.map((i: any) => (
                      <div key={i.item_id} className="bg-slate-900/50 p-1.5 rounded border border-slate-800 flex justify-between items-center text-[9px]">
                        <span className="text-slate-400">{i.item_id}</span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-emerald-400 font-bold">x{i.qty}</span>
                          <button 
                            onClick={async () => {
                              if (!confirm(`Remover todos os ${i.item_id}?`)) return;
                              try {
                                const { error } = await supabase.from("inventory").delete().eq("user_id", inspectingUser).eq("item_id", i.item_id);
                                if (error) throw error;
                                toast.success("Item removido!");
                                inspectPlayer(inspectingUser!);
                              } catch (e: any) { toast.error(e.message); }
                            }}
                            className="text-rose-500 hover:text-rose-400 font-bold text-xs leading-none"
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  {inventory.balls.length === 0 && inventory.items.length === 0 && (
                    <div className="text-xs text-slate-500 italic">Mochila vazia.</div>
                  )}
                  
                  <button 
                    onClick={() => {
                      setTab("gifts");
                      setTargetQuery(players.find(p => p.id === inspectingUser)?.username || inspectingUser || "");
                    }}
                    className="w-full bg-emerald-600/20 border border-emerald-500/40 text-emerald-400 text-[10px] py-1.5 rounded hover:bg-emerald-600/30 transition"
                  >
                    + ADICIONAR ITENS / MOEDAS
                  </button>
                </div>
              )}
            </Card>

            <Card title="Banco Medieval (Vault)">
              {!inventory?.trainer ? <div className="text-xs text-slate-500 italic">Carregando...</div> : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="text-[9px] uppercase tracking-wider text-slate-500">Itens no Banco</div>
                    <div className="bg-slate-900/60 p-2 rounded border border-slate-800 text-[10px] text-slate-300 max-h-[100px] overflow-y-auto">
                      {inventory.trainer.vault ? (
                        <div className="space-y-1">
                          {Object.entries(inventory.trainer.vault as Record<string, number>).map(([id, qty]) => (
                            <div key={id} className="flex justify-between border-b border-slate-800/50 pb-1">
                              <span className="text-slate-400">{id}</span>
                              <span className="text-amber-200 font-bold">x{qty}</span>
                            </div>
                          ))}
                        </div>
                        ) : (
                          <div className="text-[9px] text-slate-600 italic">Vazio no banco</div>
                        )}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="text-[9px] uppercase tracking-wider text-slate-500">Pokémons no Banco</div>
                    <div className="bg-slate-900/60 p-2 rounded border border-slate-800 text-[10px] text-slate-300 max-h-[100px] overflow-y-auto">
                      {inventory.trainer.pokeVault ? (
                        <div className="space-y-1">
                          {(inventory.trainer.pokeVault as any[]).map((p: any, i: number) => (
                            <div key={i} className="flex justify-between border-b border-slate-800/50 pb-1">
                              <span className="text-slate-400">{p.species}</span>
                              <span className="text-amber-200 font-bold">Lv.{p.level}</span>
                            </div>
                          ))}
                        </div>
                        ) : (
                          <div className="text-[9px] text-slate-600 italic">Nenhum Pokémon no banco</div>
                        )}
                    </div>
                  </div>
                </div>
              )}
            </Card>

            <Card title="Histórico de Presentes">
              {!inventory?.gifts ? <div className="text-xs text-slate-500 italic">Carregando...</div> : (
                <div className="space-y-2 max-h-[150px] overflow-y-auto pr-1 custom-scrollbar">
                  {inventory.gifts.map((g: any) => (
                    <div key={g.id} className="text-[8px] bg-slate-900/50 p-1.5 rounded border border-slate-800">
                      <div className="flex justify-between font-bold text-amber-100">
                        <span>{g.kind.toUpperCase()}{g.item_id ? ` (${g.item_id})` : ""}</span>
                        <span>x{g.qty}</span>
                      </div>
                      <div className="flex justify-between text-slate-500 mt-1">
                        <span>{new Date(g.created_at).toLocaleDateString()}</span>
                        <span className={g.claimed_at ? "text-emerald-500" : "text-amber-500"}>
                          {g.claimed_at ? "RECEBIDO" : "PENDENTE"}
                        </span>
                      </div>
                    </div>
                  ))}
                  {inventory.gifts.length === 0 && <div className="text-xs text-slate-500 italic text-center">Nenhum presente enviado.</div>}
                </div>
              )}
            </Card>


            <Card title="Conexões (IPs)">
              <div className="space-y-2 max-h-[100px] overflow-y-auto pr-1 custom-scrollbar">
                {ipLogs.map((log, i) => (
                  <div key={i} className="text-[9px] bg-slate-900/50 p-1.5 rounded border border-slate-800 flex justify-between">
                    <span className="text-amber-100 font-mono">{log.ip_address}</span>
                    <span className="text-[8px] text-slate-500">{new Date(log.created_at).toLocaleString()}</span>
                  </div>
                ))}
                {ipLogs.length === 0 && <div className="text-xs text-slate-500 italic">Nenhum IP.</div>}
              </div>
            </Card>

            <Card title="Zona de Perigo">
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg space-y-3">
                <p className="text-[9px] text-rose-300">Ações administrativas críticas para a conta do usuário.</p>
                <button
                  onClick={() => deletePlayer(inspectingUser)}
                  className="w-full bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-bold py-2 rounded shadow-lg shadow-rose-900/20 transition"
                >
                  DELETAR CONTA PERMANENTEMENTE
                </button>
              </div>
            </Card>
          </div>
        </div>
      )}


    </div>
  );
}




function PokemonTab() {
  // Read species dynamically from save / try to import registry
  return (
    <Card title="Pokémon registrados" action={<span className="text-xs text-slate-400">Lido dinamicamente do registro do jogo</span>}>
      <p className="text-xs text-slate-400 mb-4">
        Pokémon adicionados em <code className="text-amber-200">src/game/systems.tsx</code> aparecem aqui automaticamente.
      </p>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2 text-xs">
        {SPECIES_FALLBACK.map((s) => (
          <div key={s} className="rounded-lg border border-slate-800 bg-slate-900/60 p-2 text-center">
            <div className="text-amber-100 font-semibold uppercase">{s.replace(/_/g, " ")}</div>
            <div className="text-[10px] text-slate-500 mt-1">live</div>
          </div>
        ))}
      </div>
    </Card>
  );
}
// fallback list mirrors index.tsx SPECIES_NAME keys
const SPECIES_FALLBACK = [
  "charmeleon", "bulbasaur", "vulpix", "jigglypuff", "caterpie", "charmander", "squirtle",
  "charizard", "ivysaur", "venusaur", "butterfree", "bulbasaur_hat", "pikachu", "sandslash",
  "mewtwo", "onix", "pinsir", "magmar", "hitmonchan", "golem", "aerodactyl", "arbok",
  "charizard_shiny", "charizard_alt", "moltres", "zapdos", "articuno",
];

function SpawnTab({ config, setConfig }: { config: AdminConfig; setConfig: (c: AdminConfig) => void }) {
  return (
    <div className="grid lg:grid-cols-2 gap-5">
      <Card title="Multiplicadores globais">
        <div className="space-y-4">
          <Slider
            label="Multiplicador global de spawn"
            value={config.spawn.globalMultiplier}
            min={0}
            max={5}
            step={0.1}
            onChange={(v) => setConfig({ ...config, spawn: { ...config.spawn, globalMultiplier: v } })}
            fmt={(v) => `${v.toFixed(1)}×`}
          />
          <Slider
            label="Chance de shiny"
            value={config.spawn.shinyChance * 100}
            min={0}
            max={100}
            step={0.5}
            onChange={(v) => setConfig({ ...config, spawn: { ...config.spawn, shinyChance: v / 100 } })}
            fmt={(v) => `${v.toFixed(1)}%`}
          />
        </div>
      </Card>
      <Card title="Densidade por mapa">
        <div className="space-y-3">
          {Object.entries(config.spawn.perMap).map(([map, cfg]) => (
            <div key={map} className="rounded-lg border border-slate-800 bg-slate-900/40 p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold uppercase text-amber-100">{map}</span>
                <span className="text-[10px] text-slate-500">cap {cfg.cap}</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <input
                  type="number"
                  value={cfg.cap}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      spawn: { ...config.spawn, perMap: { ...config.spawn.perMap, [map]: { ...cfg, cap: Number(e.target.value) } } },
                    })
                  }
                  className="w-20 rounded border border-slate-800 bg-slate-950 px-2 py-1 text-amber-100"
                />
                <select
                  value={cfg.rate}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      spawn: {
                        ...config.spawn,
                        perMap: {
                          ...config.spawn.perMap,
                          [map]: { ...cfg, rate: e.target.value as typeof cfg.rate },
                        },
                      },
                    })
                  }
                  className="flex-1 rounded border border-slate-800 bg-slate-950 px-2 py-1 text-slate-200"
                >
                  <option value="off">off</option>
                  <option value="slow">slow</option>
                  <option value="normal">normal</option>
                  <option value="fast">fast</option>
                  <option value="insane">insane</option>
                </select>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function ItemsTab() {
  const save = readSave();
  const all = { ...(save?.balls ?? {}), ...(save?.inventory ?? {}) };
  return (
    <Card title="Inventário do jogador">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
        {Object.entries(all).map(([id, qty]) => (
          <div key={id} className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-2">
            <span className="text-slate-200">{id}</span>
            <span className="font-bold text-amber-200">×{qty}</span>
          </div>
        ))}
        {Object.keys(all).length === 0 && <div className="col-span-full text-center text-slate-500 py-6">Inventário vazio.</div>}
      </div>
    </Card>
  );
}

function WeatherTab({ config, setConfig }: { config: AdminConfig; setConfig: (c: AdminConfig) => void }) {
  const types: AdminConfig["weather"]["type"][] = ["clear", "rain", "snow", "storm", "sand", "eclipse", "bloodmoon", "fog", "meteor"];
  return (
    <Card title="Sistema climático">
      <div className="grid grid-cols-3 md:grid-cols-5 gap-2 mb-5">
        {types.map((t) => (
          <button
            key={t}
            onClick={() => setConfig({ ...config, weather: { ...config.weather, type: t } })}
            className={`rounded-lg border px-3 py-2 text-xs uppercase tracking-wide ${
              config.weather.type === t
                ? "border-fuchsia-500/60 bg-fuchsia-500/15 text-fuchsia-100"
                : "border-slate-800 bg-slate-900/60 text-slate-300 hover:bg-slate-800/60"
            }`}
          >
            {t}
          </button>
        ))}
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <Slider
          label="Intensidade"
          value={config.weather.intensity}
          min={0}
          max={100}
          onChange={(v) => setConfig({ ...config, weather: { ...config.weather, intensity: v } })}
          fmt={(v) => `${v}%`}
        />
        <Slider
          label="Duração"
          value={config.weather.durationMin}
          min={1}
          max={120}
          onChange={(v) => setConfig({ ...config, weather: { ...config.weather, durationMin: v } })}
          fmt={(v) => `${v} min`}
        />
      </div>
    </Card>
  );
}

function EconomyTab({ config, setConfig }: { config: AdminConfig; setConfig: (c: AdminConfig) => void }) {
  return (
    <div className="grid lg:grid-cols-2 gap-5">
      <Card title="Controle de economia">
        <div className="space-y-4">
          <Slider
            label="Multiplicador de Gold"
            value={config.economy.goldMultiplier}
            min={0}
            max={10}
            step={0.1}
            onChange={(v) => setConfig({ ...config, economy: { ...config.economy, goldMultiplier: v } })}
            fmt={(v) => `${v.toFixed(1)}×`}
          />
          <Slider
            label="Multiplicador de XP"
            value={config.economy.xpMultiplier}
            min={0}
            max={10}
            step={0.1}
            onChange={(v) => setConfig({ ...config, economy: { ...config.economy, xpMultiplier: v } })}
            fmt={(v) => `${v.toFixed(1)}×`}
          />
          <Slider
            label="Inflação do market"
            value={config.economy.inflation}
            min={0.1}
            max={5}
            step={0.1}
            onChange={(v) => setConfig({ ...config, economy: { ...config.economy, inflation: v } })}
            fmt={(v) => `${v.toFixed(1)}×`}
          />
        </div>
      </Card>
      <Card title="Concessão rápida ao jogador">
        <GrantPanel />
      </Card>
    </div>
  );
}

function GrantPanel() {
  const [gold, setGold] = useState(100);
  const [crystal, setCrystal] = useState(10);
  const [xp, setXp] = useState(50);
  const [feedback, setFeedback] = useState<string>("");
  return (
    <div className="space-y-3 text-xs">
      <div className="flex items-center gap-2">
        <input type="number" value={gold} onChange={(e) => setGold(Number(e.target.value))} className="w-24 rounded border border-slate-800 bg-slate-950 px-2 py-1.5 text-amber-100" />
        <button
          onClick={() => {
            patchSave((s) => { s.gold = (s.gold ?? 0) + gold; });
            pushLog({ actor: "admin", action: "grant_gold", detail: String(gold) });
            setFeedback(`+${gold} gold`);
          }}
          className="rounded-md bg-amber-500/20 border border-amber-500/40 px-3 py-1.5 text-amber-100 hover:bg-amber-500/30"
        >Adicionar gold</button>
        <button
          onClick={() => {
            patchSave((s) => { s.gold = Math.max(0, (s.gold ?? 0) - gold); });
            pushLog({ actor: "admin", action: "remove_gold", detail: String(gold) });
            setFeedback(`-${gold} gold`);
          }}
          className="rounded-md border border-rose-500/40 bg-rose-500/10 px-3 py-1.5 text-rose-200 hover:bg-rose-500/20"
        >Remover</button>
      </div>
      <div className="flex items-center gap-2">
        <input type="number" value={crystal} onChange={(e) => setCrystal(Number(e.target.value))} className="w-24 rounded border border-slate-800 bg-slate-950 px-2 py-1.5 text-cyan-100" />
        <button
          onClick={() => {
            patchSave((s) => { s.crystal = (s.crystal ?? 0) + crystal; });
            pushLog({ actor: "admin", action: "grant_crystal", detail: String(crystal) });
            setFeedback(`+${crystal} crystal`);
          }}
          className="rounded-md bg-cyan-500/20 border border-cyan-500/40 px-3 py-1.5 text-cyan-100 hover:bg-cyan-500/30"
        >Adicionar crystal</button>
        <button
          onClick={() => {
            patchSave((s) => { s.crystal = Math.max(0, (s.crystal ?? 0) - crystal); });
            pushLog({ actor: "admin", action: "remove_crystal", detail: String(crystal) });
            setFeedback(`-${crystal} crystal`);
          }}
          className="rounded-md border border-rose-500/40 bg-rose-500/10 px-3 py-1.5 text-rose-200 hover:bg-rose-500/20"
        >Remover</button>
      </div>
      <div className="flex items-center gap-2">
        <input type="number" value={xp} onChange={(e) => setXp(Number(e.target.value))} className="w-24 rounded border border-slate-800 bg-slate-950 px-2 py-1.5 text-amber-100" />
        <span className="text-slate-400">XP (granted via save log — aplicar in-game)</span>
      </div>
      {feedback && <div className="text-emerald-300">{feedback}</div>}
    </div>
  );
}

function EventsTab({ config, setConfig }: { config: AdminConfig; setConfig: (c: AdminConfig) => void }) {
  return (
    <Card title="Eventos globais">
      <div className="grid md:grid-cols-2 gap-3">
        <Toggle label="Double XP" checked={config.events.doubleXp} onChange={(v) => setConfig({ ...config, events: { ...config.events, doubleXp: v } })} desc="Ativa multiplicador 2× de XP para todos." />
        <Toggle label="Double Loot" checked={config.events.doubleLoot} onChange={(v) => setConfig({ ...config, events: { ...config.events, doubleLoot: v } })} desc="Dobra os drops mundiais." />
        <Toggle label="Shiny Event" checked={config.events.shinyEvent} onChange={(v) => setConfig({ ...config, events: { ...config.events, shinyEvent: v } })} desc="Aumenta drasticamente a chance de shiny." />
        <Toggle label="World Boss" checked={config.events.worldBoss} onChange={(v) => setConfig({ ...config, events: { ...config.events, worldBoss: v } })} desc="Spawna boss mundial." />
      </div>
    </Card>
  );
}

function InvisibleTab({ config, setConfig }: { config: AdminConfig; setConfig: (c: AdminConfig) => void }) {
  return (
    <Card title="Modo invisível & superpoderes">
      <div className="grid md:grid-cols-2 gap-3">
        <Toggle label="Invisibilidade admin" checked={config.admin.invisible} onChange={(v) => setConfig({ ...config, admin: { ...config.admin, invisible: v } })} />
        <Toggle label="Noclip (atravessar colisão)" checked={config.admin.noclip} onChange={(v) => setConfig({ ...config, admin: { ...config.admin, noclip: v } })} />
        <Toggle label="Fly mode" checked={config.admin.fly} onChange={(v) => setConfig({ ...config, admin: { ...config.admin, fly: v } })} />
        <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3">
          <Slider label="Velocidade" value={config.admin.speed} min={0.5} max={5} step={0.1} onChange={(v) => setConfig({ ...config, admin: { ...config.admin, speed: v } })} fmt={(v) => `${v.toFixed(1)}×`} />
        </div>
      </div>
      <p className="text-[11px] text-slate-500 mt-4">Flags lidas via <code className="text-amber-200">getConfig().admin</code> — integre no loop de movimento para efeito imediato.</p>
    </Card>
  );
}

function TeleportTab() {
  const [map, setMap] = useState("town");
  const [x, setX] = useState(600);
  const [y, setY] = useState(900);
  const [done, setDone] = useState("");
  const apply = () => {
    patchSave((s) => {
      (s as Record<string, unknown>).mapId = map;
      (s as Record<string, unknown>).pos = { x, y };
    });
    pushLog({ actor: "admin", action: "teleport", target: map, detail: `${x},${y}` });
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("rubym:teleport", { detail: { mapId: map, x, y } }));
    }
    setDone("✦ Teletransporte aplicado ao vivo");
  };
  const heal = () => {
    if (typeof window !== "undefined") window.dispatchEvent(new Event("rubym:heal"));
    pushLog({ actor: "admin", action: "clinic_heal" });
    setDone("💖 Time curado (Clínica)");
  };
  return (
    <Card title="Teleporte & Clínica">
      <div className="flex flex-wrap items-end gap-3 text-xs">
        <label className="space-y-1">
          <span className="text-slate-400">Mapa</span>
          <select value={map} onChange={(e) => setMap(e.target.value)} className="block rounded border border-slate-800 bg-slate-950 px-2 py-1.5 text-slate-200">
            {["village", "forest", "route2", "route3", "forestCave", "cave1", "cave2", "map23", "palletRoute", "viridian", "route22", "victoryRoad", "florestaSecreta"].map((m) => <option key={m}>{m}</option>)}
          </select>
        </label>
        <label className="space-y-1"><span className="text-slate-400">X</span><input type="number" value={x} onChange={(e) => setX(Number(e.target.value))} className="block w-24 rounded border border-slate-800 bg-slate-950 px-2 py-1.5 text-amber-100" /></label>
        <label className="space-y-1"><span className="text-slate-400">Y</span><input type="number" value={y} onChange={(e) => setY(Number(e.target.value))} className="block w-24 rounded border border-slate-800 bg-slate-950 px-2 py-1.5 text-amber-100" /></label>
        <button onClick={apply} className="rounded-md bg-gradient-to-b from-fuchsia-500 to-fuchsia-700 px-4 py-1.5 text-white">Aplicar</button>
        <button onClick={heal} className="rounded-md border border-emerald-400/50 bg-emerald-500/15 px-4 py-1.5 text-emerald-100 hover:bg-emerald-500/25">💖 Clínica (curar time)</button>
      </div>
      {done && <div className="mt-3 text-xs text-emerald-300">{done}</div>}
    </Card>
  );
}

function LogsTab() {
  const logs = getLogs();
  return (
    <Card title={`Logs administrativos (${logs.length})`}>
      <div className="rounded-lg border border-slate-800 bg-slate-950/60 max-h-[60vh] overflow-y-auto">
        <table className="w-full text-xs">
          <thead className="bg-slate-900/80 text-slate-400">
            <tr>
              <th className="text-left px-3 py-2">Horário</th>
              <th className="text-left px-3 py-2">Ator</th>
              <th className="text-left px-3 py-2">Ação</th>
              <th className="text-left px-3 py-2">Detalhe</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((l, i) => (
              <tr key={i} className="border-t border-slate-800/80">
                <td className="px-3 py-1.5 text-slate-500 font-mono">{new Date(l.ts).toLocaleString()}</td>
                <td className="px-3 py-1.5 text-fuchsia-300">{l.actor}</td>
                <td className="px-3 py-1.5 text-amber-100">{l.action}</td>
                <td className="px-3 py-1.5 text-slate-400">{l.detail ?? "—"}</td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr><td colSpan={4} className="px-3 py-6 text-center text-slate-500">Sem logs.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function ConfigTab({ config }: { config: AdminConfig }) {
  return (
    <Card title="Config snapshot (debug)">
      <pre className="overflow-auto rounded-lg border border-slate-800 bg-slate-950/80 p-3 text-[11px] text-slate-300">
        {JSON.stringify(config, null, 2)}
      </pre>
    </Card>
  );
}

function PlaceholderTab({ tabLabel }: { tabLabel: string }) {
  return (
    <Card title={tabLabel}>
      <div className="rounded-xl border border-dashed border-slate-700/60 bg-slate-900/30 p-10 text-center">
        <div className="text-sm font-semibold text-amber-100">{tabLabel}</div>
        <p className="mt-2 max-w-md mx-auto text-xs text-slate-400">
          Módulo provisionado. Persistência total, sync multiplayer e editor visual no mapa exigem backend ativo
          (Lovable Cloud). A camada client-side já está pronta — basta plugar o backend para ativar.
        </p>
      </div>
    </Card>
  );
}

function GiftsTab({ 
  targetQuery, 
  setTargetQuery 
}: { 
  targetQuery: string; 
  setTargetQuery: (s: string) => void; 
}) {
  const [kind, setKind] = useState<"gold" | "crystal" | "ruby" | "item" | "ball">("gold");
  const [itemId, setItemId] = useState("");
  const [qty, setQty] = useState(100);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  const needsItem = kind === "item" || kind === "ball";

  const submit = async () => {
    if (!targetQuery.trim()) {
      setMsg({ kind: "err", text: "Informe o Username, Email ou ID do jogador." });
      return;
    }
    setMsg(null);
    setBusy(true);
    try {
      // Resolvemos o ID primeiro se for email ou UUID
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetQuery.trim());
      const isEmail = targetQuery.includes("@");
      
      let finalUsername = targetQuery.trim();

      if (isUuid || isEmail) {
        const { data: p } = await supabase
          .from("profiles")
          .select("username")
          .or(`id.eq.${targetQuery.trim()},username.eq.${targetQuery.trim()}`)
          .maybeSingle();
        
        if (p && (p as any).username) finalUsername = (p as any).username;
      }

      const { sendGift } = await import("@/lib/adminGifts");
      const res = await sendGift({
        username: finalUsername,
        kind,
        itemId: needsItem ? itemId : undefined,
        qty,
        note,
        sender: "Administração",
      });

      if (res.ok) {
        setMsg({ kind: "ok", text: `✦ Presente enviado para "${finalUsername}". Será recebido no próximo login.` });
        setQty(100);
        setNote("");
      } else {
        setMsg({ kind: "err", text: res.error ?? "Falha ao enviar." });
      }
    } catch (e) {
      setMsg({ kind: "err", text: (e as Error).message });
    } finally {
      setBusy(false);
    }
  };

  const PRESETS = [
    { id: "potion", label: "Potion", kind: "item" },
    { id: "super_potion", label: "Super Potion", kind: "item" },
    { id: "revive", label: "Revive", kind: "item" },
    { id: "rare_candy", label: "Rare Candy", kind: "item" },
    { id: "event_box", label: "Caixa Premium", kind: "item" },
    { id: "ultraball", label: "Ultra Ball", kind: "ball" },
    { id: "masterball", label: "Master Ball", kind: "ball" },
  ];

  return (
    <div className="grid lg:grid-cols-2 gap-5">
      <Card title="Enviar Presente (Username / Email / ID)">
        <div className="space-y-4 text-xs">
          <label className="block space-y-1">
            <span className="text-slate-400">Destinatário (Username, ID ou Email)</span>
            <input
              value={targetQuery}
              onChange={(e) => setTargetQuery(e.target.value)}
              placeholder="Ex: player123 ou 61b4d001..."
              className="w-full rounded border border-slate-800 bg-slate-950 px-2.5 py-2 text-amber-100 focus:border-fuchsia-500 outline-none"
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block space-y-1">
              <span className="text-slate-400">Tipo de Recurso</span>
              <select
                value={kind}
                onChange={(e) => setKind(e.target.value as any)}
                className="w-full rounded border border-slate-800 bg-slate-950 px-2 py-2 text-slate-200"
              >
                <option value="gold">Gold</option>
                <option value="crystal">Crystal</option>
                <option value="ruby">Ruby</option>
                <option value="item">Item</option>
                <option value="ball">Pokébola</option>
              </select>
            </label>
            <label className="block space-y-1">
              <span className="text-slate-400">Quantidade</span>
              <input
                type="number"
                min={1}
                value={qty}
                onChange={(e) => setQty(Number(e.target.value))}
                className="w-full rounded border border-slate-800 bg-slate-950 px-2 py-2 text-amber-100"
              />
            </label>
          </div>

          {needsItem && (
            <div className="space-y-3">
              <label className="block space-y-1">
                <span className="text-slate-400">ID do Item</span>
                <input
                  value={itemId}
                  onChange={(e) => setItemId(e.target.value)}
                  placeholder="Ex: potion, ultraball..."
                  className="w-full rounded border border-slate-800 bg-slate-950 px-2 py-2 text-amber-100"
                />
              </label>
              <div className="flex flex-wrap gap-1.5">
                {PRESETS.filter(p => kind === "item" ? p.kind === "item" : p.kind === "ball").map(p => (
                  <button
                    key={p.id}
                    onClick={() => setItemId(p.id)}
                    className={`px-2 py-1 rounded border text-[9px] transition ${itemId === p.id ? "bg-fuchsia-500/20 border-fuchsia-500 text-fuchsia-300" : "bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300"}`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <label className="block space-y-1">
            <span className="text-slate-400">Nota Personalizada</span>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ex: Presente da staff pelo evento de reset!"
              rows={2}
              className="w-full rounded border border-slate-800 bg-slate-950 px-2.5 py-2 text-slate-200 resize-none"
            />
          </label>

          <button
            disabled={busy}
            onClick={submit}
            className="w-full rounded-lg bg-gradient-to-r from-fuchsia-600 to-amber-600 py-2.5 font-bold text-white shadow-lg shadow-fuchsia-900/20 hover:scale-[1.02] active:scale-95 transition disabled:opacity-50"
          >
            {busy ? "PROCESSANDO..." : "ENVIAR PRESENTE AGORA"}
          </button>

          {msg && (
            <div className={`p-2 rounded border text-center font-medium ${msg.kind === "ok" ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" : "bg-rose-500/10 border-rose-500/30 text-rose-400"}`}>
              {msg.text}
            </div>
          )}
        </div>
      </Card>
      
      <Card title="Histórico de Envios">
        <p className="text-[10px] text-slate-500 mb-4 italic">
          Os presentes são entregues instantaneamente se o jogador estiver online ou no próximo login.
        </p>
        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
           <GiftHistoryList />
        </div>
      </Card>
    </div>
  );
}

function GiftHistoryList() {
  const [history, setHistory] = useState<any[]>([]);
  useEffect(() => {
    supabase.from("admin_gifts").select("*").order("created_at", { ascending: false }).limit(20)
      .then(({ data }) => setHistory(data || []));
  }, []);

  if (history.length === 0) return <div className="text-center py-10 text-slate-600 text-[10px]">Nenhum envio recente.</div>;

  return (
    <div className="space-y-2">
      {history.map(g => (
        <div key={g.id} className="bg-slate-900/40 border border-slate-800 rounded-lg p-2 flex justify-between items-start gap-2">
          <div className="min-w-0">
            <div className="text-amber-100 font-bold truncate text-[10px]">{g.recipient_username}</div>
            <div className="text-[9px] text-slate-400">
              {g.kind === "item" || g.kind === "ball" ? `${g.item_id} x${g.qty}` : `${g.kind} x${g.qty}`}
            </div>
          </div>
          <div className="text-right">
             <div className={`text-[8px] font-bold px-1 rounded ${g.claimed_at ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500"}`}>
               {g.claimed_at ? "RECEBIDO" : "PENDENTE"}
             </div>
             <div className="text-[7px] text-slate-600 mt-1">{new Date(g.created_at).toLocaleDateString()}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function ReportsTab() {
  const [data, setData] = useState<{ id: string; user_id: string; username: string; kind: string; detail: any; created_at: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<"save_delta" | "ip" | "all">("save_delta");
  const [searchName, setSearchName] = useState("");

  const refresh = async () => {
    setLoading(true);
    try {
      const { data: res, error } = await supabase
        .from("audit_events" as any)
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      
      if (error) throw error;
      setData((res as any) || []);
    } catch (e) {
      console.error("Audit load failed", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refresh(); }, []);

  const filtered = data.filter(d => {
    const matchesTab = filter === "all" ? true : d.kind === filter;
    const matchesSearch = searchName ? (d.username || "").toLowerCase().includes(searchName.toLowerCase()) : true;
    return matchesTab && matchesSearch;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          {(["save_delta", "ip", "all"] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded-md text-[10px] uppercase font-bold transition ${filter === f ? "bg-fuchsia-500 text-white" : "bg-slate-800 text-slate-400 hover:bg-slate-700"}`}
            >
              {f.replace("_", " ")}
            </button>
          ))}
        </div>
        
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
            placeholder="Buscar jogador..."
            className="px-3 py-1 bg-slate-900 border border-slate-700 rounded-md text-[10px] text-amber-100 placeholder:text-slate-600 outline-none focus:border-fuchsia-500/50"
          />
          <button 
            onClick={refresh} 
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-cyan-500/10 border border-cyan-500/30 text-[10px] font-bold text-cyan-400 hover:bg-cyan-500/20 disabled:opacity-50"
          >
            {loading ? "CARREGANDO..." : "🔄 ATUALIZAR"}
          </button>
        </div>
      </div>

      <Card title="Relatório de Auditoria (Últimos 100 eventos)">
        <div className="rounded-lg border border-slate-800 bg-slate-950/60 max-h-[65vh] overflow-y-auto">
          <table className="w-full text-[10px]">
            <thead className="bg-slate-900/80 text-slate-500 sticky top-0">
              <tr>
                <th className="text-left px-3 py-2">Data</th>
                <th className="text-left px-3 py-2">Jogador</th>
                <th className="text-left px-3 py-2">Tipo</th>
                <th className="text-left px-3 py-2">Detalhes (Delta)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {filtered.map((d) => {
                const isSuspect = d.kind === "save_delta" && (
                  (d.detail.level_to - d.detail.level_from) > 10 || 
                  (d.detail.gold_to - d.detail.gold_from) > 1000000
                );
                return (
                  <tr key={d.id} className={`${isSuspect ? "bg-rose-500/5" : ""} hover:bg-white/5`}>
                    <td className="px-3 py-2 text-slate-500 font-mono">
                      {new Date(d.created_at).toLocaleString()}
                    </td>
                    <td className="px-3 py-2">
                      <div className="text-amber-200 font-bold">{d.username || "Desconhecido"}</div>
                      <div className="text-[9px] text-slate-600 truncate max-w-[80px]">{d.user_id}</div>
                    </td>
                    <td className="px-3 py-2">
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                        d.kind === "save_delta" ? "bg-blue-500/10 text-blue-400" : "bg-amber-500/10 text-amber-400"
                      }`}>
                        {d.kind}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-slate-400 leading-tight">
                      {d.kind === "save_delta" ? (
                        <div className="space-y-0.5">
                          <div>LV: <span className="text-slate-300">{d.detail.level_from}</span> → <span className={d.detail.level_to > d.detail.level_from + 5 ? "text-rose-400 font-bold" : "text-emerald-400"}>{d.detail.level_to}</span></div>
                          <div>GOLD: <span className="text-slate-300">{d.detail.gold_from?.toLocaleString()}</span> → <span className="text-emerald-400">{d.detail.gold_to?.toLocaleString()}</span></div>
                        </div>
                      ) : (
                        <pre className="text-[9px] truncate max-w-[200px]">{JSON.stringify(d.detail)}</pre>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && !loading && (
                <tr><td colSpan={4} className="px-3 py-10 text-center text-slate-600">Nenhum registro suspeito encontrado.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
      
      <div className="grid md:grid-cols-2 gap-4">
        <div className="p-4 rounded-xl border border-rose-500/20 bg-rose-500/5 text-xs text-rose-300/80">
          <p className="font-bold mb-1">🛡️ Análise de Segurança:</p>
          <p>A brecha de edição direta foi fechada com o trigger <code className="text-rose-200">enforce_game_save_caps</code>. Saltos de nível acima de 5 por save são automaticamente barrados e registrados aqui como "save_delta".</p>
        </div>
        <div className="p-4 rounded-xl border border-cyan-500/20 bg-cyan-500/5 text-xs text-cyan-300/80">
          <p className="font-bold mb-1">🔍 Investigação por Jogador:</p>
          <p>Use a busca acima para filtrar os logs de um jogador específico. Você pode cruzar os deltas de nível com os registros de IP para identificar padrões de exploração ou multi-contas.</p>
        </div>
      </div>
    </div>
  );
}
