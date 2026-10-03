import { Fragment, useEffect, useRef, useState, type ReactNode, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { fetchCloudSave, SAVE_KEY } from "@/lib/cloudSave";
import { claimSnapshotOwner, clearSnapshotOwner } from "@/lib/saveManager";
import { computeIsExisting, saveShowsProgress } from "@/lib/accountExists";
import { makePet } from "@/game/systems";
import perfilChar01Png from "@/CHAR/perfil. char 01.png";
import perfilChar02Png from "@/CHAR/perfil. char 02.png";
import perfilCharF1Png from "@/CHAR/perfil. char f1.png";
import perfilCharF2Png from "@/CHAR/perfil. char f2.png";
import charmanderGif from "@/assets/charmander.gif";
import bulbasaurGif from "@/assets/bulbasaur.gif";
import squirtleGif from "@/assets/squirtle.gif";
import MetaMaskLoginButton from "@/components/MetaMaskLoginButton";
import type { Session } from "@supabase/supabase-js";
import { checkMaintenanceMode, isAdmin as checkIsAdmin } from "@/lib/maintenance.functions";
import { updateActiveSession, getActiveSessionToken, clearActiveSession } from "@/lib/session.functions";


const loginBgAsset = { url: "/login-bg.png" };
// Arte nova IDLEMON REVO — salve a imagem como public/login-splash.jpg.
// Se o arquivo ainda não existir, o CSS cai para /login-bg.png sozinho.
const loginSplashUrl = "/login-splash.jpg";

export const IDENTITY_KEY = "rubym.identity.v1";
export const GUEST_KEY = "rubym.guest.v1";
export const SESSION_TOKEN_KEY = "rubym.sessionToken.v1";

export type LocalIdentity = {
  id: string;
  name: string;
  secretKey: string;
  createdAt: number;
};

const log = (...args: unknown[]) => console.log("[AuthGate]", ...args);
const warn = (...args: unknown[]) => console.warn("[AuthGate]", ...args);
const IDLE_KEY = "rubym.idle.v1";
const CLOUD_PRELOADED_KEY = "rubym.cloud.preloaded.v1";
const CURRENT_UID_KEY = "rubym.currentUid";

/** Limpeza SOMENTE local (nunca toca o Supabase). Remove todo `rubym.*`
 * da conta anterior, preservando s� o marcador de uid vigente � e solta o
 * dono do snapshot em mem�ria (anti-clobber). */
function wipeLocalGameData() {
  try {
    const keep = new Set<string>([CURRENT_UID_KEY]);
    const toRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k) continue;
      if (keep.has(k)) continue;
      if (k.startsWith("rubym.")) toRemove.push(k);
    }
    toRemove.forEach((k) => localStorage.removeItem(k));
  } catch { /* ignore */ }
  clearSnapshotOwner();
}

function isCloudBlob(value: unknown): value is { idle?: unknown; team?: unknown[]; restingBench?: unknown[]; party?: unknown[] } {
  if (!value || typeof value !== "object") return false;
  const blob = value as { idle?: unknown; team?: unknown; restingBench?: unknown; party?: unknown };
  return Boolean(blob.idle || Array.isArray(blob.team) || Array.isArray(blob.restingBench) || Array.isArray(blob.party));
}

export function loadIdentity(): LocalIdentity | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(IDENTITY_KEY);
    if (!raw) return null;
    const id = JSON.parse(raw) as LocalIdentity;
    if (!id?.name || !id?.id) return null;
    return id;
  } catch {
    return null;
  }
}

function writeIdentity(id: string, name: string) {
  const identity: LocalIdentity = { id, name, secretKey: "", createdAt: Date.now() };
  try {
    localStorage.setItem(IDENTITY_KEY, JSON.stringify(identity));
  } catch {
    /* ignore */
  }
  return identity;
}

/**
 * Garante que existe linha em `profiles` para esse usuário e devolve
 * o username (ou null se ainda não foi escolhido). Não depende do trigger SQL.
 */
async function ensureProfile(userId: string): Promise<{ username: string | null; avatarUrl: string | null }> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any;
  log("ensureProfile: select", userId);
  const sel = await sb.from("profiles").select("id, username, avatar_url").eq("id", userId).maybeSingle();
  if (sel.error) {
    // Banco sem a tabela (setup ainda não rodado): não trava o login.
    // O jogo segue local; perfil/sync ativam sozinhos quando a tabela existir.
    const code = (sel.error as { code?: unknown }).code;
    const msg = String((sel.error as { message?: unknown }).message ?? sel.error);
    if (code === "42P01" || code === "PGRST205" || /relation .* does not exist|not find|404/i.test(msg)) {
      warn("ensureProfile: tabela profiles ausente — seguindo em modo local");
      return { username: null, avatarUrl: null };
    }
    warn("ensureProfile select error", sel.error);
    throw sel.error;
  }
  if (sel.data) {
    log("ensureProfile: row exists", sel.data);
    return {
      username: (sel.data.username as string | null) ?? null,
      avatarUrl: (sel.data.avatar_url as string | null) ?? null,
    };
  }
  log("ensureProfile: inserting row (trigger ausente?)");
  const ins = await sb.from("profiles").upsert({ id: userId, username: null, avatar_url: null }, { onConflict: "id" });
  if (ins.error) {
    // Race: outra aba/trigger criou. Re-leitura.
    warn("ensureProfile insert error (tentando re-ler)", ins.error);
    const sel2 = await sb.from("profiles").select("username, avatar_url").eq("id", userId).maybeSingle();
    if (sel2.error) throw sel2.error;
    return {
      username: (sel2.data?.username as string | null) ?? null,
      avatarUrl: (sel2.data?.avatar_url as string | null) ?? null,
    };
  }
  return { username: null, avatarUrl: null };
}

async function preloadCloudSave(userId: string) {
  try {
    log("preloadCloudSave start", userId);
    const cloud = await fetchCloudSave(userId);
    // Anti-corrida: se a sess�o mudou durante o fetch, descarta o resultado.
    // Sem isso, um preload(A) tardio sobrescreve os globais de B.
    try {
      const { data } = await supabase.auth.getSession();
      if ((data.session?.user?.id ?? null) !== userId) {
        log("preloadCloudSave descartado: uid mudou durante o fetch");
        return;
      }
    } catch {
      // Sem sess�o verific�vel: n�o grava nada (fail-closed).
      log("preloadCloudSave descartado: sess�o n�o verific�vel");
      return;
    }
    if (isCloudBlob(cloud)) {
      if (cloud.idle) localStorage.setItem(IDLE_KEY, JSON.stringify(cloud.idle));
      const party = Array.isArray(cloud.party)
        ? cloud.party
        : [...(Array.isArray(cloud.team) ? cloud.team : []), ...(Array.isArray(cloud.restingBench) ? cloud.restingBench : [])];
      if (party.length > 0) {
        localStorage.setItem(SAVE_KEY, JSON.stringify({ party }));
        // Se o save da nuvem já tem pokémon, o inicial JÁ foi escolhido —
        // não pode reabrir o modal de starter em outro navegador/F5.
        try { localStorage.setItem("rubym.starter.chosen", "1"); } catch { /* ignore */ }
      }
      localStorage.setItem(CLOUD_PRELOADED_KEY, userId);
      log("preloadCloudSave: save restaurado do servidor");
    } else {
      localStorage.removeItem(CLOUD_PRELOADED_KEY);
      log("preloadCloudSave: nenhum save remoto");
    }
  } catch (e) {
    try { localStorage.removeItem(CLOUD_PRELOADED_KEY); } catch { /* ignore */ }
    warn("preloadCloudSave falhou", e);
  }
}

type Mode = "login" | "signup" | "reset";

/* ───────────────────────────── AUTH GATE ───────────────────────────── */

export function AuthGate({ children }: { children: ReactNode }) {
  const [maintenance, setMaintenance] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [bypassCode, setBypassCode] = useState("");
  const [isBypassed, setIsBypassed] = useState(() => {
    if (typeof window === "undefined") return false;
    const email = localStorage.getItem("rubym.user_email");
    if (email === "lordryuhhhuyuyghh@gmail.com") return true;
    return localStorage.getItem("rubym.maintenance_bypass") === "true";
  });

  const [mounted, setMounted] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [identity, setIdentity] = useState<LocalIdentity | null>(null);
  const [needsChar, setNeedsChar] = useState(false);
  const [suggestedName, setSuggestedName] = useState("");
  const [checking, setChecking] = useState(true);
  const [bootstrapping, setBootstrapping] = useState(false);
  const [recoveryMode, setRecoveryMode] = useState(false);

  useEffect(() => {
    setMounted(true);

    if (typeof window !== "undefined") {
      if (
        window.location.hash.includes("type=recovery") ||
        window.location.search.includes("recovery=1")
      ) {
        setRecoveryMode(true);
      }
    }

    const { data: sub } = supabase.auth.onAuthStateChange((event, sess) => {
      log("authStateChange", event, sess?.user?.id);
      setSession(sess);
      if (event === "PASSWORD_RECOVERY") setRecoveryMode(true);
      if (event === "SIGNED_IN" && sess?.user?.id) {
        if (sess.user.email) localStorage.setItem("rubym.user_email", sess.user.email);
        if (sess.user.email === "lordryuhhhuyuyghh@gmail.com") setIsBypassed(true);
        try {
          const prev = localStorage.getItem(CURRENT_UID_KEY);
          if (prev && prev !== sess.user.id) {
            // Conta diferente — limpa o save local da conta anterior
            wipeLocalGameData();
          }
          localStorage.setItem(CURRENT_UID_KEY, sess.user.id);
        } catch { /* ignore */ }
      }
      if (event === "SIGNED_OUT") {
        setIdentity(null);
        setNeedsChar(false);
        try {
          localStorage.removeItem(IDENTITY_KEY);
          // Logout real: limpa dados locais para evitar vazamento entre contas.
          wipeLocalGameData();
          localStorage.removeItem(CURRENT_UID_KEY);
          // Clear server-side active session
          void clearActiveSession();
        } catch {
          /* ignore */
        }
      }
    });

    // Em F5 não desloga: a sessão ativa é necessária para reidratar/salvar no Supabase
    // antes de qualquer cache local ser usado. Logout manual continua limpando tudo.
    const loadInitialSession = async () => {
      // Force checking=false after 8s no matter what (fallback if Supabase hangs)
      const fallbackTimer = setTimeout(() => {
        log("initial session timeout - forcing checking=false");
        setChecking(false);
      }, 8000);
      
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);
        const { data } = await supabase.auth.getSession();
        clearTimeout(timeoutId);
        clearTimeout(fallbackTimer);
        log("initial session", data.session?.user?.id ?? null);
        setSession(data.session);
      } catch (e) {
        log("initial session failed", e);
        setSession(null);
      } finally {
        clearTimeout(fallbackTimer);
        setChecking(false);
      }
    };

    // Check maintenance immediately and periodically
    const checkMaint = async () => {
      try {
        const { enabled } = await checkMaintenanceMode();
        setMaintenance(enabled);
        
        if (enabled) {
          const email = localStorage.getItem("rubym.user_email");
          const hasBypass = email === "lordryuhhhuyuyghh@gmail.com" || localStorage.getItem("rubym.maintenance_bypass") === "true";
          
          if (hasBypass) {
            setIsAdmin(true);
            return;
          }

          const { isAdmin: adminStatus } = await checkIsAdmin();
          setIsAdmin(adminStatus);
          
          if (!adminStatus) {
            const { data: { session: currentSess } } = await supabase.auth.getSession();
            if (currentSess) {
              console.log("[Maintenance] Kicking non-admin user");
              await supabase.auth.signOut();
              window.location.reload();
            }
          }
        }
      } catch (err) {
        console.error("[AuthGate] Maintenance check failed:", err);
      }
    };

    checkMaint();
    const interval = setInterval(checkMaint, 15000); // Check every 15 seconds for faster kick

    return () => {
      sub.subscription.unsubscribe();
      clearInterval(interval);
    };


  }, []);

  // Load initial session only on client side
  useEffect(() => {
    // Guaranteed fallback: force checking=false after 8s no matter what
    const guaranteedFallback = setTimeout(() => {
      log("Guaranteed fallback - forcing checking=false");
      setChecking(false);
    }, 8000);

    const loadInitialSession = async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);
        const { data } = await supabase.auth.getSession();
        clearTimeout(timeoutId);
        clearTimeout(guaranteedFallback);
        log("initial session", data.session?.user?.id ?? null);
        setSession(data.session);
      } catch (e) {
        log("initial session failed", e);
        setSession(null);
      } finally {
        clearTimeout(guaranteedFallback);
        setChecking(false);
      }
    };
    void loadInitialSession();

    return () => clearTimeout(guaranteedFallback);
  }, []);

  // Effect to handle session changes and re-verify admin status
  useEffect(() => {
    if (maintenance && session?.user) {
      checkIsAdmin().then(({ isAdmin: adminStatus }) => {
        const email = localStorage.getItem("rubym.user_email");
        const hasBypass = email === "lordryuhhhuyuyghh@gmail.com" || localStorage.getItem("rubym.maintenance_bypass") === "true";
        
        if (hasBypass) {
          setIsAdmin(true);
          return;
        }

        setIsAdmin(adminStatus);
        if (!adminStatus) {
          supabase.auth.signOut().then(() => window.location.reload());
        }
      });
    }
  }, [session, maintenance]);


  // Single-session enforcement: PRIMEIRA sess�o vence, SEGUNDA � recusada
  const [sessionRejected, setSessionRejected] = useState(false);
  const sessionTokenRef = useRef<string | null>(null);

  useEffect(() => {
    if (!session?.user?.id) return;
    if (sessionRejected) return;

    const token = crypto.randomUUID();
    sessionTokenRef.current = token;

    const initSession = async () => {
      try {
        const res = await updateActiveSession({ data: { token } });
        if (!res.ok && res.error === "SESSION_TAKEN") {
          console.warn("[AuthGate] Second session rejected - account already active elsewhere");
          setSessionRejected(true);
          await supabase.auth.signOut();
        }
      } catch (e) {
        console.error("Failed to update active session", e);
      }
    };
    initSession();

    // Heartbeat to keep session alive (update timestamp)
    const interval = setInterval(async () => {
      if (sessionTokenRef.current) {
        await updateActiveSession({ data: { token: sessionTokenRef.current } }).catch(() => {});
      }
    }, 30000); // Every 30s
    return () => clearInterval(interval);
  }, [session?.user?.id, sessionRejected]);

  // Show rejection screen
  if (sessionRejected) {
    return (
      <PanelShell title="SESS�O RECUSADA">
        <div style={{ textAlign: "center", padding: 20 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>??</div>
          <h2 style={{ color: "#ff6b6b", fontSize: 16, marginBottom: 8 }}>Sess�o duplicada detectada</h2>
          <p style={{ color: "#9adcff", marginBottom: 16, lineHeight: 1.5 }}>
            Esta conta j� est� conectada em outra aba/janela.<br />
            A sess�o original permanece ativa.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{ padding: "10px 20px", background: "#2f9df0", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer" }}
          >
            Recarregar e tentar novamente
          </button>
        </div>
      </PanelShell>
    );
  }



  // Quando logado: garante profile, decide se precisa criar treinador,
  // pré-carrega save da nuvem.
  // Bootstrap apenas quando o USER ID muda. O Supabase emite TOKEN_REFRESHED
  // ao trocar de aba / voltar do minimizado, criando um novo objeto session
  // — sem esse guard, o efeito re-executava, mostrava o splash e re-hidratava
  // o save da nuvem por cima do estado atual (parecia um "refresh").
  const bootstrappedUidRef = useRef<string | null>(null);
  const currentUid = session?.user?.id ?? null;
  useEffect(() => {
    if (!currentUid) { bootstrappedUidRef.current = null; return; }
    if (recoveryMode) return;
    if (bootstrappedUidRef.current === currentUid) return;
    bootstrappedUidRef.current = currentUid;
    // Isolamento A?B: a sess�o pode ter sido restaurada sem evento SIGNED_IN
    // (F5) com res�duos de outra conta no armazenamento. Se o uid vigente
    // diverge do marcador ou da identidade local, limpa TUDO (local) ANTES
    // de qualquer hidrata��o/preload. Nunca toca o banco aqui.
    try {
      const storedUid = localStorage.getItem(CURRENT_UID_KEY);
      const ident = loadIdentity();
      if ((storedUid && storedUid !== currentUid) || (ident && ident.id !== currentUid)) {
        log("uid divergente do armazenamento � wipe local antes de hidratar");
        wipeLocalGameData();
      }
      localStorage.setItem(CURRENT_UID_KEY, currentUid);
    } catch { /* ignore */ }
    let cancelled = false;
    (async () => {
      setBootstrapping(true);
      const uid = currentUid;
      try {
        const profile = await ensureProfile(uid);
        const username = profile.username;
        const avatarUrl = profile.avatarUrl;
        if (cancelled) return;

        // Inicializa linhas do jogador no banco novo (best-effort; ignora se RPC ausente).
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        void (supabase as any).rpc("bootstrap_player").then(
          () => log("bootstrap_player ok"),
          (e: unknown) => warn("bootstrap_player ignorado", e),
        );

        // Determina se é jogador existente via servidor (não localStorage).
        // REGRA (accountExists): username sozinho NÃO prova onboarding — era
        // gravado no 1º passo. Exige 2ª prova: avatar_url (skin) OU
        // pokemon_collection (starter/captura) OU game_saves com progresso real.
        // trainer_state é ignorado pois bootstrap_player cria linha vazia para novos.
        const hasName = !!(username && username.trim().length > 0);
        let isExisting = false;
        if (hasName) {
          if (avatarUrl && avatarUrl.trim().length > 0) {
            isExisting = true;
          } else {
            try {
              const [pokeRes, saveRes] = await Promise.all([
                (supabase as any).from("pokemon_collection").select("id").eq("user_id", uid).limit(1),
                (supabase as any).from("game_saves").select("data").eq("user_id", uid).maybeSingle(),
              ]);
              const hasPoke = Array.isArray(pokeRes?.data) && pokeRes.data.length > 0;
              const saveData = saveRes?.data?.data ?? null;
              isExisting = computeIsExisting({
                username,
                avatarUrl,
                hasCollection: hasPoke,
                saveHasProgress: saveShowsProgress(saveData),
              });
            } catch { /* ignora, trata como novo */ }
            if (cancelled) return;
          }
        }

        if (isExisting) {
          // Jogador existente: hidrata antes de liberar o jogo (evita flash level 1 / starter)
          try { await preloadCloudSave(uid); } catch {}
          if (cancelled) return;
          // Aqui username sempre existe (regra accountExists exige nome + 2ª prova).
          const finalName = username!;
          setIdentity(writeIdentity(uid, finalName));
          if (avatarUrl && typeof avatarUrl === "string" && avatarUrl.startsWith("char")) {
            try { localStorage.setItem("rubym.setup.skin", avatarUrl); localStorage.setItem("rubym.skin.v1", avatarUrl); } catch { /* ignore */ }
          }
          try { localStorage.setItem("rubym.starter.chosen", "1"); localStorage.setItem("rubym.setup.done", "1"); } catch {}
          setNeedsChar(false);
        } else {
          log("carteira nova ou onboarding incompleto — exibindo CreateCharacterScreen");
          // Pré-preenche com o nome parcial, se houver (não usa como definitivo).
          setSuggestedName(username ?? "");
          setIdentity(null);
          setNeedsChar(true);
        }
      } catch (e) {
        warn("bootstrap falhou", e);
        setSuggestedName("");
        setIdentity(null);
        setNeedsChar(true);
      } finally {
        if (!cancelled) setBootstrapping(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [currentUid, recoveryMode]);


  if (!mounted || checking) return <SplashScreen label="Conectando ao servidor..." />;

  if (maintenance && !isAdmin && !isBypassed) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-black text-red-500 font-mono text-center relative overflow-hidden">
        {/* Animated background to show it's active */}
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-b from-red-900/50 to-transparent animate-pulse" />
        </div>
        
        <div className="relative z-10 max-w-md space-y-6 border-4 border-red-600 p-10 rounded-xl bg-black/90 shadow-[0_0_50px_rgba(185,28,28,0.4)] transform hover:scale-[1.02] transition-transform">
          <div className="inline-block p-4 border-2 border-red-600 rounded-full animate-bounce">
            <span className="text-4xl">⚠️</span>
          </div>
          <h1 className="text-3xl font-black tracking-[0.2em] uppercase">MANUTENÇÃO</h1>
          <div className="h-1 w-full bg-red-900 rounded-full overflow-hidden">
            <div className="h-full bg-red-500 animate-[loading_2s_infinite]" style={{ width: '40%' }} />
          </div>
          
          <div className="space-y-4">
            <p className="text-base leading-relaxed font-bold">
              Servidor em atualização técnica.
            </p>
            
            <div className="pt-2">
              <input
                type="password"
                placeholder="CÓDIGO DE ACESSO"
                value={bypassCode}
                onChange={(e) => setBypassCode(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && bypassCode === "ryuh333") {
                    localStorage.setItem("rubym.maintenance_bypass", "true");
                    setIsBypassed(true);
                  }
                }}
                className="w-full bg-red-950/30 border border-red-900 text-red-500 px-4 py-3 rounded text-center font-black placeholder:text-red-900 focus:outline-none focus:border-red-600 transition-colors"
              />
              {bypassCode === "ryuh333" && (
                <button
                  onClick={() => {
                    localStorage.setItem("rubym.maintenance_bypass", "true");
                    setIsBypassed(true);
                  }}
                  className="w-full mt-2 py-2 bg-red-600 text-white font-black hover:bg-red-500 transition-colors"
                >
                  ACESSAR AGORA
                </button>
              )}
            </div>
          </div>

          <div className="pt-6">
            <button 
              onClick={() => window.location.reload()}
              className="w-full px-8 py-4 border-2 border-red-900 hover:border-red-600 text-red-600 hover:text-red-500 font-black tracking-widest transition-all active:scale-95"
            >
              ATUALIZAR STATUS
            </button>
          </div>
          <p className="text-[10px] opacity-50 pt-4 uppercase tracking-widest">
            Apenas administradores autorizados
          </p>
        </div>
        <style>{`
          @keyframes loading {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(250%); }
          }
        `}</style>
      </div>
    );
  }




  if (recoveryMode) {
    return <ResetPasswordScreen onDone={() => setRecoveryMode(false)} />;
  }

  if (typeof window !== "undefined" && window.location.search.includes("login")) return <PanelShell title="ENTRAR"><form className="space-y-3"><MetaMaskLoginButton /><button type="button" onClick={() => window.location.href="/?login=1"} className="w-full py-2 bg-amber-600 text-black font-black">RECARREGAR LOGIN</button></form></PanelShell>;
  // Sem sessão: SOMENTE MetaMask (fluxo convidado "ENTRAR NO MUNDO" removido).
  if (!session) {
    return (
      <PanelShell title="ENTRAR">
        <div className="space-y-3">
          <p className="text-xs" style={{ color: "#fecaca" }}>
            Conecte sua carteira MetaMask para jogar. Cada carteira tem seu próprio treinador.
          </p>
          <MetaMaskLoginButton />
        </div>
      </PanelShell>
    );
  }

  if (bootstrapping) return <SplashScreen label="Carregando perfil..." />;

  if (needsChar || !identity) {
    return (
      <CreateCharacterScreen
        userId={session.user.id}
        defaultName={(suggestedName || session.user.email?.split("@")[0]) ?? ""}
        onCreated={(name) => {
          setIdentity(writeIdentity(session.user.id, name));
          setNeedsChar(false);
        }}
      />
    );
  }

  return <Fragment key={session.user.id}>{children}</Fragment>;
}

/* ───────────────────────────── UI helpers ─────────────────────────── */

function SplashScreen({ label }: { label: string }) {
  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 font-mono"
      style={{
        background: "radial-gradient(ellipse at top, #3a0a0f 0%, #1a0306 60%, #000 100%)",
        color: "#fecaca",
      }}
    >
      {label}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  autoComplete,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
  disabled?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-xs block mb-1" style={{ color: "#fecaca" }}>
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        disabled={disabled}
        className="w-full px-3 py-2 rounded outline-none text-sm disabled:opacity-60"
        style={{ background: "#120406", color: "#fff5f5", border: "2px solid #7f1d1d" }}
      />
    </label>
  );
}


function StarField() {
  // Deterministic pseudo-random stars so SSR/client match
  const stars = Array.from({ length: 80 }, (_, i) => {
    const seed = (i * 9301 + 49297) % 233280;
    const r1 = seed / 233280;
    const r2 = ((i * 7919) % 1000) / 1000;
    const r3 = ((i * 6271) % 1000) / 1000;
    const r4 = ((i * 3499) % 1000) / 1000;
    return {
      left: `${r1 * 100}%`,
      top: `${r2 * 100}%`,
      size: 1 + r3 * 2,
      delay: r4 * 6,
      duration: 2 + r3 * 4,
      opacity: 0.4 + r4 * 0.6,
    };
  });
  const shooting = Array.from({ length: 3 }, (_, i) => ({
    top: `${10 + i * 25}%`,
    delay: i * 3.5,
  }));
  return (
    <>
      <style>{`
        @keyframes rubym-twinkle { 0%,100%{opacity:.15;transform:scale(.8)} 50%{opacity:1;transform:scale(1.15)} }
        @keyframes rubym-shoot {
          0% { transform: translate3d(-10vw,-10vh,0) rotate(20deg); opacity:0 }
          10% { opacity:1 }
          70% { opacity:1 }
          100% { transform: translate3d(110vw,60vh,0) rotate(20deg); opacity:0 }
        }
        @keyframes rubym-pulse-glow { 0%,100%{opacity:.35} 50%{opacity:.7} }
      `}</style>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 30% 20%, rgba(239,68,68,0.18), transparent 40%), radial-gradient(circle at 75% 80%, rgba(168,85,247,0.15), transparent 45%)",
          animation: "rubym-pulse-glow 8s ease-in-out infinite",
        }}
      />
      <div aria-hidden className="pointer-events-none absolute inset-0">
        {stars.map((s, i) => (
          <span
            key={i}
            style={{
              position: "absolute",
              left: s.left,
              top: s.top,
              width: s.size,
              height: s.size,
              background: i % 7 === 0 ? "#fca5a5" : "#fff",
              borderRadius: "50%",
              boxShadow: `0 0 ${s.size * 3}px ${i % 7 === 0 ? "#ef4444" : "#fff"}`,
              opacity: s.opacity,
              animation: `rubym-twinkle ${s.duration}s ease-in-out ${s.delay}s infinite`,
            }}
          />
        ))}
        {shooting.map((s, i) => (
          <span
            key={`sh-${i}`}
            style={{
              position: "absolute",
              top: s.top,
              left: 0,
              width: 120,
              height: 2,
              background:
                "linear-gradient(90deg, transparent, #fff, #fca5a5, transparent)",
              borderRadius: 2,
              filter: "drop-shadow(0 0 6px #ef4444)",
              animation: `rubym-shoot 7s linear ${s.delay}s infinite`,
            }}
          />
        ))}
      </div>
    </>
  );
}

function PanelShell({ children, title }: { children: ReactNode; title?: string }) {
  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 font-mono relative overflow-hidden"
      style={{ background: "#04121f" }}
    >
      {/* Background art — splash nova com fallback para a antiga */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          backgroundImage: `url(${loginSplashUrl}), url(${loginBgAsset.url})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          filter: "brightness(0.9) saturate(1.1)",
        }}
      />
      {/* Vignette azul */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(4,18,31,0.15) 0%, rgba(4,18,31,0.55) 65%, rgba(0,4,10,0.92) 100%)",
        }}
      />
      {/* Subtle scanlines */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, rgba(0,0,0,0.15) 0px, rgba(0,0,0,0.15) 1px, transparent 1px, transparent 3px)",
          mixBlendMode: "multiply",
        }}
      />

      {/* Panel */}
      <div className="relative w-full" style={{ maxWidth: 380 }}>
        <div
          aria-hidden
          className="absolute -inset-3 pointer-events-none"
          style={{
            background: "radial-gradient(ellipse at center, rgba(255,201,60,0.28), transparent 70%)",
            filter: "blur(18px)",
          }}
        />
        <div
          className="relative"
          style={{
            padding: 2,
            background: "linear-gradient(180deg, #ffe27a 0%, #b8862a 45%, #4a2f0c 100%)",
            borderRadius: 10,
            boxShadow: "0 20px 60px rgba(0,0,0,0.85), 0 0 22px rgba(255,201,60,0.35)",
          }}
        >
          <div
            className="relative"
            style={{
              padding: "26px 22px 22px",
              background:
                "linear-gradient(180deg, rgba(6,22,38,0.94), rgba(10,38,64,0.94))",
              borderRadius: 8,
              backdropFilter: "blur(6px)",
              WebkitBackdropFilter: "blur(6px)",
            }}
          >
            <div className="text-center mb-1">
              <div
                className="text-lg font-bold"
                style={{
                  color: "#ffc93c",
                  textShadow:
                    "2px 2px 0 #144a7a, 3px 3px 0 #000, 0 0 14px rgba(255,201,60,0.7)",
                  fontFamily: '"Press Start 2P", ui-monospace, monospace',
                  letterSpacing: "4px",
                }}
              >
                IDLEMON
              </div>
              <div
                className="text-lg font-bold"
                style={{
                  color: "#7ec8f0",
                  textShadow:
                    "2px 2px 0 #0b3556, 3px 3px 0 #000, 0 0 14px rgba(126,200,240,0.7)",
                  fontFamily: '"Press Start 2P", ui-monospace, monospace',
                  letterSpacing: "4px",
                }}
              >
                REVO
              </div>
            </div>
            <div
              className="text-center mb-4"
              style={{
                color: "#ffe27a",
                fontSize: 9,
                letterSpacing: "2px",
                textShadow: "1px 1px 0 #000",
              }}
            >
              A JORNADA REVO • MERCADO IDLE DE 2026
            </div>

            {title && (
              <div
                className="text-center text-[10px] tracking-[4px] mb-3 pb-2"
                style={{
                  color: "#9adcff",
                  textShadow: "1px 1px 0 #000",
                  borderBottom: "1px dashed rgba(126,200,240,0.35)",
                }}
              >
                ◆ {title} ◆
              </div>
            )}
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}


function PrimaryButton({
  children,
  disabled,
  type = "submit",
  onClick,
}: {
  children: ReactNode;
  disabled?: boolean;
  type?: "submit" | "button";
  onClick?: () => void;
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className="w-full py-2 rounded font-bold tracking-wider transition active:scale-95 disabled:opacity-50"
      style={{
        background: "linear-gradient(180deg, #2f9df0, #14568f)",
        color: "#ffffff",
        border: "2px solid #0b3556",
        textShadow: "1px 1px 0 rgba(0,0,0,0.5)",
        boxShadow: "0 0 12px rgba(47,157,240,0.45)",
      }}
    >
      {children}
    </button>
  );
}


function ErrorBox({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div
      className="text-xs px-2 py-1 rounded"
      style={{ background: "#3b0d0d", color: "#fecaca", border: "1px solid #b91c1c" }}
    >
      {message}
    </div>
  );
}

function InfoBox({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div
      className="text-xs px-2 py-1 rounded"
      style={{ background: "#0b3a18", color: "#bbf7d0", border: "1px solid #15803d" }}
    >
      {message}
    </div>
  );
}


/* ───────────────────────────── Login / Signup / Reset ─────────────── */

function AuthScreen({ kickedMessage }: { kickedMessage?: string | null }) {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [betaKey, setBetaKey] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Fluxo de reset por CÓDIGO (OTP de 6 dígitos vindo no e-mail)
  const [resetStep, setResetStep] = useState<"email" | "code">("email");
  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPasswordConfirm, setNewPasswordConfirm] = useState("");

  // Normaliza telefone: somente dígitos, máx 20.
  const normalizePhone = (v: string) => v.replace(/\D+/g, "").slice(0, 20);

  // Chave beta válida = ao menos 12 caracteres alfanuméricos
  // (ignorando hífens, espaços e demais separadores).
  const isBetaKeyValid = (raw: string) => {
    const stripped = raw.replace(/[^A-Za-z0-9]/g, "");
    return stripped.length >= 12;
  };

  const switchMode = (m: Mode) => {
    setMode(m);
    setError(null);
    setInfo(null);
    setResetStep("email");
    setResetCode("");
    setNewPassword("");
    setNewPasswordConfirm("");
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    if (!email.trim() && mode !== "reset") return setError("Informe seu e-mail.");
    setBusy(true);
    try {
      if (mode === "login") {
        log("signIn", email);
        const { error, data } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) throw error;
        log("signIn ok", data.user?.id);
      } else if (mode === "signup") {
        if (password.length < 6) throw new Error("Senha precisa ter ao menos 6 caracteres.");
        const betaOk = betaKey.trim().length > 0 && isBetaKeyValid(betaKey);
        log("signUp", email);
        const { error, data } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        log("signUp ok", { user: data.user?.id, session: !!data.session, betaOk });

        // Guarda telefone localmente (campo opcional, sem coluna no DB).
        try {
          const ph = normalizePhone(phone);
          if (ph) localStorage.setItem("rubym.phone.v1", ph);
        } catch { /* ignore */ }

        // Marca o resgate pendente da BOX BETA — entregue ao entrar no jogo.
        if (betaOk) {
          try {
            localStorage.setItem("rubym.pendingBetaBox", "1");
          } catch { /* ignore */ }
        }

        if (!data.session) {
          setInfo(
            betaOk
              ? "Conta criada com chave de pré-registro! Faça login para receber sua box."
              : "Conta criada! Verifique seu e-mail (se a confirmação estiver ativa) ou faça login.",
          );
          setMode("login");
        }
      } else if (mode === "reset") {
        if (resetStep === "email") {
          if (!email.trim()) throw new Error("Informe seu e-mail.");
          setInfo("Digite o código único de recuperação e sua nova senha.");
          setResetStep("code");
        } else {
          const code = resetCode.trim();
          if (!code) throw new Error("Digite o código de recuperação.");
          if (newPassword.length < 6) throw new Error("A nova senha precisa ter ao menos 6 caracteres.");
          if (newPassword !== newPasswordConfirm) throw new Error("As senhas não conferem.");

          const { masterResetPassword } = await import("@/lib/auth.functions");
          await masterResetPassword({
            data: { email: email.trim(), code, newPassword },
          });

          const { error: signErr } = await supabase.auth.signInWithPassword({
            email: email.trim(),
            password: newPassword,
          });
          if (signErr) throw signErr;

          setInfo("Senha redefinida com sucesso! Você já está logado.");
        }
      }
    } catch (err) {
      warn("auth submit error", err);
      setError(err instanceof Error ? err.message : "Falha na autenticação.");
    } finally {
      setBusy(false);
    }
  };

  const title = mode === "login" ? "ENTRAR" : mode === "signup" ? "CRIAR CONTA" : "RECUPERAR SENHA";

  const primaryLabel =
    mode === "login"
      ? "ENTRAR"
      : mode === "signup"
      ? "CRIAR CONTA"
      : resetStep === "email"
      ? "ENVIAR CÓDIGO"
      : "CONFIRMAR E ENTRAR";

  return (
    <PanelShell title={title}>
      <form onSubmit={submit} className="space-y-3">

        <Field
          label="E-mail"
          value={email}
          onChange={setEmail}
          type="email"
          autoComplete="email"
          disabled={mode === "reset" && resetStep === "code"}
        />
        {mode !== "reset" && (
          <Field
            label="Senha"
            value={password}
            onChange={setPassword}
            type="password"
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
          />
        )}

        {mode === "reset" && resetStep === "code" && (
          <>
            <Field
              label="Código Único de Recuperação"
              value={resetCode}
              onChange={(v) => setResetCode(v.slice(0, 20))}
              placeholder="Digite o código informado pelo suporte"
              autoComplete="one-time-code"
            />
            <Field
              label="Nova senha"
              value={newPassword}
              onChange={setNewPassword}
              type="password"
              autoComplete="new-password"
            />
            <Field
              label="Confirmar nova senha"
              value={newPasswordConfirm}
              onChange={setNewPasswordConfirm}
              type="password"
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => {
                setResetStep("email");
                setResetCode("");
                setNewPassword("");
                setNewPasswordConfirm("");
                setError(null);
                setInfo(null);
              }}
              className="text-[10px] tracking-[2px] underline"
              style={{ color: "#fde68a" }}
            >
              USAR OUTRO E-MAIL
            </button>
          </>
        )}

        {mode === "signup" && (
          <>
            <Field
              label="Telefone (opcional)"
              value={phone}
              onChange={(v) => setPhone(normalizePhone(v))}
              type="tel"
              placeholder="Apenas números (máx 20)"
              autoComplete="tel"
            />
            <Field
              label="Chave de Pré-Registro (opcional)"
              value={betaKey}
              onChange={setBetaKey}
              placeholder="Cole sua chave de acesso do pré-registro"
            />
          </>
        )}

        {kickedMessage && <ErrorBox message={kickedMessage} />}
        <ErrorBox message={error} />
        <InfoBox message={info} />

        <PrimaryButton disabled={busy}>
          {busy ? "AGUARDE..." : primaryLabel}
        </PrimaryButton>

        <MetaMaskLoginButton />

        <div className="flex justify-between text-[10px] tracking-[2px]" style={{ color: "#9adcff" }}>
          {mode !== "login" ? (
            <button type="button" onClick={() => switchMode("login")} className="underline">
              JÁ TENHO CONTA
            </button>
          ) : (
            <button type="button" onClick={() => switchMode("signup")} className="underline">
              CRIAR CONTA
            </button>
          )}
          {mode !== "reset" ? (
            <button type="button" onClick={() => switchMode("reset")} className="underline">
              ESQUECI A SENHA
            </button>
          ) : (
            <span />
          )}
        </div>

      </form>
    </PanelShell>
  );
}



function ResetPasswordScreen({ onDone }: { onDone: () => void }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 6) return setError("Senha precisa ter ao menos 6 caracteres.");
    if (password !== confirm) return setError("As senhas não conferem.");
    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      if (typeof window !== "undefined") {
        window.history.replaceState(null, "", window.location.pathname);
      }
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao redefinir senha.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <PanelShell title="NOVA SENHA">
      <form onSubmit={submit} className="space-y-3">
        <Field label="Nova senha" value={password} onChange={setPassword} type="password" />
        <Field label="Confirmar senha" value={confirm} onChange={setConfirm} type="password" />
        <ErrorBox message={error} />
        <PrimaryButton disabled={busy}>{busy ? "SALVANDO..." : "SALVAR"}</PrimaryButton>
      </form>
    </PanelShell>
  );
}

/* ───────────────────────────── Criação de personagem ──────────────── */

/* ───────────────────────────── Criação de personagem ────────────────
   Fluxo obrigatório para carteira nova: NOME → SKIN → STARTER → CONFIRMAR.
   NADA é persistido antes de CONFIRMAR (nem profiles, nem save local).
   Só depois de CONFIRMAR o jogo é liberado. */

const CHAR_SKINS = [
  { id: "char01", label: "Char 01", img: perfilChar01Png },
  { id: "char02", label: "Char 02", img: perfilChar02Png },
  { id: "charf1", label: "Char F1", img: perfilCharF1Png },
  { id: "charf2", label: "Char F2", img: perfilCharF2Png },
];

const CHAR_STARTERS = [
  { sp: "charmander" as const, name: "Charmander", img: charmanderGif, color: "#ff6b3d", desc: "Fogo — ataque forte" },
  { sp: "bulbasaur" as const, name: "Bulbasaur", img: bulbasaurGif, color: "#5ec26a", desc: "Planta — equilibrado" },
  { sp: "squirtle" as const, name: "Squirtle", img: squirtleGif, color: "#6bd4ff", desc: "Água — defensivo" },
];

function CreateCharacterScreen({
  userId,
  defaultName,
  onCreated,
}: {
  userId: string;
  defaultName: string;
  onCreated: (name: string) => void;
}) {
  const cleanDefault = (defaultName ?? "").replace(/[^A-Za-z0-9 _-]/g, "").slice(0, 16);
  const [step, setStep] = useState<"name" | "skin" | "starter" | "confirm">("name");
  const [name, setName] = useState(cleanDefault);
  const [skin, setSkin] = useState("char01");
  const [starter, setStarter] = useState<"charmander" | "bulbasaur" | "squirtle" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const confirm = async () => {
    setError(null);
    const trimmed = name.trim();
    if (trimmed.length < 2) { setError("Nome precisa ter ao menos 2 caracteres."); setStep("name"); return; }
    if (!starter) { setError("Escolha 1 Pokémon inicial."); setStep("starter"); return; }
    setBusy(true);
    const msgOf = (e: unknown): string => {
      if (e instanceof Error && e.message) return e.message;
      if (e && typeof e === "object") {
        const o = e as Record<string, unknown>;
        const parts = [o.message, o.details, o.hint, o.code].filter(
          (x): x is string => typeof x === "string" && x.length > 0,
        );
        if (parts.length > 0) return parts.join(" · ");
      }
      return "Falha ao criar personagem.";
    };
    try {
      log("createCharacter confirm", { userId, trimmed, skin, starter });
      // Verifica se o servidor já tem time (onboarding refeito com progresso):
      // nesse caso NÃO semeia time novo para não sobrescrever o progresso.
      const [pokeRes, saveRes] = await Promise.all([
        (supabase as any).from("pokemon_collection").select("id").eq("user_id", userId).limit(1),
        (supabase as any).from("game_saves").select("data").eq("user_id", userId).maybeSingle(),
      ]);
      const snap = saveRes?.data?.data as { team?: Array<{ species?: string; level?: number; xp?: number }> } | null;
      const snapTeam = Array.isArray(snap?.team) ? snap.team : [];
      const hasCollection = Array.isArray(pokeRes?.data) && pokeRes.data.length > 0;
      // Time "real" = tem algo além do charmander lv1 default (semente/fallback).
      // Um save só com charmander lv1/xp0 é resto da era bugada → trata como novo.
      const teamReal = snapTeam.some(
        (p) => (p?.species ?? "charmander") !== "charmander" || (Number(p?.level) || 1) > 1 || (Number(p?.xp) || 0) > 0,
      );
      const serverHasTeam = hasCollection || teamReal;
      // Servidor PRIMEIRO: sem isso, nada está criado.
      // Tenta completo (com skin); se o banco rejeitar a coluna, cai no
      // formato mínimo já comprovado (username).
      // (last_login NÃO existe no profiles de produção — PGRST204.)
      const full = await (supabase as any).from("profiles").upsert(
        {
          id: userId,
          username: trimmed,
          avatar_url: skin,
        },
        { onConflict: "id" },
      );
      let upErr = full?.error ?? null;
      if (upErr) {
        warn("createCharacter upsert com skin falhou, tentando sem avatar", upErr);
        const minimal = await (supabase as any).from("profiles").upsert(
          {
            id: userId,
            username: trimmed,
          },
          { onConflict: "id" },
        );
        upErr = minimal?.error ?? null;
      }
      if (upErr) throw upErr;
      // A partir daqui, o estado em mem�ria/local pertence a este uid.
      claimSnapshotOwner(userId);
      // Carteira realmente nova (servidor vazio): semeia time + publica o
      // save IMEDIATAMENTE (prova server-side p/ F5 logo ap�s confirmar).
      const pet = makePet(starter, 5);
      if (!serverHasTeam) {
        try {
          localStorage.setItem(SAVE_KEY, JSON.stringify({ party: [pet] }));
        } catch { /* ignore */ }
        // Conta realmente nova: o IDLE local tamb�m recome�a do zero.
        // Sem isso, ouro/n�vel/itens da conta anterior vazam p/ o jogo novo.
        try {
          const { freshIdle } = await import("@/routes/idle");
          localStorage.setItem(IDLE_KEY, JSON.stringify(freshIdle()));
        } catch (e) {
          warn("seed de IDLE fresco falhou (n�o bloqueia)", e);
        }
        try {
          const { pushCloudSaveNow } = await import("@/lib/cloudSave");
          await pushCloudSaveNow({
            idle: { bank: { gold: 0, crystals: 0 }, totals: { captured: 0, kills: 0 } },
            team: [pet],
            restingBench: [],
          });
        } catch (e) {
          warn("push inicial do save falhou (não bloqueia)", e);
        }
      }
      try {
        localStorage.setItem("rubym.setup.done", "1");
        localStorage.setItem("rubym.setup.skin", skin);
        localStorage.setItem("rubym.setup.name", trimmed);
        localStorage.setItem("rubym.starter.chosen", "1");
      } catch { /* ignore */ }
      log("createCharacter confirm ok");
      onCreated(trimmed);
    } catch (err) {
      warn("createCharacter falhou", err);
      setError(msgOf(err));
      setBusy(false);
    }
  };

  const skinLabel = CHAR_SKINS.find((s) => s.id === skin)?.label ?? skin;
  const starterInfo = CHAR_STARTERS.find((s) => s.sp === starter) ?? null;
  const steps: Array<"name" | "skin" | "starter" | "confirm"> = ["name", "skin", "starter", "confirm"];
  const stepNames = ["1. NOME", "2. SKIN", "3. POKÉMON", "4. CONFIRMAR"];

  return (
    <PanelShell title="CRIE SEU TREINADOR">
      <div className="flex gap-2 justify-center mb-3">
        {steps.map((s, i) => (
          <span
            key={s}
            className="text-[10px] font-black tracking-widest"
            style={{ color: step === s ? "#f5cf6b" : "#6b5b95" }}
          >
            {stepNames[i]}{i < steps.length - 1 ? " › " : ""}
          </span>
        ))}
      </div>

      {step === "name" && (
        <div className="space-y-3">
          <Field
            label="1. Digite seu nome de Treinador"
            value={name}
            onChange={(v) => setName(v.replace(/[^A-Za-z0-9 _-]/g, "").slice(0, 16))}
            placeholder="Ex: Ash, IdleMaster..."
          />
          <ErrorBox message={error} />
          <PrimaryButton disabled={busy || name.trim().length < 2} onClick={() => setStep("skin")}>
            CONTINUAR ›
          </PrimaryButton>
        </div>
      )}

      {step === "skin" && (
        <div className="space-y-3">
          <p className="text-xs" style={{ color: "#fecaca" }}>2. Escolha sua skin</p>
          <div className="grid grid-cols-4 gap-2">
            {CHAR_SKINS.map((s) => {
              const active = skin === s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSkin(s.id)}
                  className="rounded-lg p-1.5"
                  style={{
                    background: active ? "linear-gradient(160deg, #3a1f5c 0%, #6b3fb0 100%)" : "linear-gradient(160deg, #1a0f26 0%, #251638 100%)",
                    border: active ? "2px solid #f5cf6b" : "2px solid #7f1d1d",
                    boxShadow: active ? "0 0 14px rgba(245,207,107,0.55)" : "none",
                    cursor: "pointer",
                    transform: active ? "translateY(-2px)" : "none",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-4px)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = active ? "translateY(-2px)" : "none"; }}
                >
                  <img src={s.img} alt={s.label} className="w-full" style={{ borderRadius: 6, aspectRatio: "1 / 1", objectFit: "cover", border: active ? "1px solid #f5cf6b" : "1px solid rgba(255,255,255,0.15)" }} />
                  <div className="text-[9px] font-black mt-1" style={{ color: active ? "#f5cf6b" : "#fecaca" }}>{active ? `◆ ${s.label}` : s.label}</div>
                </button>
              );
            })}
          </div>
          <ErrorBox message={error} />
          <div className="flex gap-2">
            <button type="button" onClick={() => setStep("name")} className="flex-1 py-2.5 text-xs font-black rounded-lg" style={{ background: "linear-gradient(180deg, #1a2f1a, #0d1f0d)", color: "#86efac", border: "2px solid #166534", boxShadow: "0 2px 0 #052e16", cursor: "pointer" }}>‹ VOLTAR</button>
            <button type="button" onClick={() => setStep("starter")} className="flex-[2] py-2.5 text-xs font-black rounded-lg" style={{ background: "linear-gradient(180deg, #2f9df0, #14568f)", color: "#fff", border: "2px solid #0b3556", boxShadow: "0 2px 0 #082a44, 0 0 12px rgba(47,157,240,0.45)", cursor: "pointer", textShadow: "1px 1px 0 rgba(0,0,0,0.5)" }}>CONTINUAR ›</button>
          </div>
        </div>
      )}

      {step === "starter" && (
        <div className="space-y-3">
          <p className="text-xs" style={{ color: "#fecaca" }}>3. Escolha 1 Pokémon inicial (nível 5)</p>
          <div className="grid grid-cols-3 gap-2">
            {CHAR_STARTERS.map((c) => (
              <button
                key={c.sp}
                type="button"
                onClick={() => setStarter(c.sp)}
                className="rounded p-2 flex flex-col items-center gap-1"
                style={{
                  background: starter === c.sp ? "#3a1f5c" : "#120406",
                  border: `2px solid ${starter === c.sp ? "#f5cf6b" : c.color}`,
                }}
              >
                <img src={c.img} alt={c.name} width={64} height={64} style={{ imageRendering: "pixelated" }} />
                <div className="text-[10px] font-black" style={{ color: c.color }}>{c.name}</div>
                <div className="text-[9px]" style={{ color: "#fecaca" }}>{c.desc}</div>
              </button>
            ))}
          </div>
          <ErrorBox message={error} />
          <div className="flex gap-2">
            <button type="button" onClick={() => setStep("skin")} className="flex-1 py-2 text-xs font-black rounded" style={{ background: "transparent", color: "#86efac", border: "1px solid #166534" }}>‹ VOLTAR</button>
            <PrimaryButton disabled={!starter} onClick={() => starter && setStep("confirm")}>REVISAR ›</PrimaryButton>
          </div>
        </div>
      )}

      {step === "confirm" && (
        <div className="space-y-3">
          <p className="text-sm font-black text-center" style={{ color: "#f5cf6b" }}>CONFIRMAR ESTE TREINADOR?</p>
          <div className="rounded p-3 text-xs space-y-1" style={{ background: "#120406", border: "2px solid #7f1d1d", color: "#fff5f5" }}>
            <div>Nome: <b>{name.trim() || "—"}</b></div>
            <div>Skin: <b>{skinLabel}</b></div>
            <div>Pokémon: <b style={{ color: starterInfo?.color }}>{starterInfo ? starterInfo.name : "—"}</b></div>
          </div>
          {starterInfo && (
            <div className="flex justify-center">
              <img src={starterInfo.img} alt={starterInfo.name} width={72} height={72} style={{ imageRendering: "pixelated" }} />
            </div>
          )}
          <ErrorBox message={error} />
          <div className="flex gap-2">
            <button type="button" disabled={busy} onClick={() => setStep("starter")} className="flex-1 py-2 text-xs font-black rounded" style={{ background: "transparent", color: "#86efac", border: "1px solid #166534" }}>‹ VOLTAR</button>
            <PrimaryButton disabled={busy} onClick={confirm}>{busy ? "CRIANDO..." : "CONFIRMAR"}</PrimaryButton>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => supabase.auth.signOut()}
        className="w-full text-[10px] tracking-[2px] underline"
        style={{ color: "#86efac", background: "transparent", border: 0, padding: "4px 0" }}
      >
        SAIR
      </button>
    </PanelShell>
  );
}

async function persistSkinToServer(skinId: string) {
  try {
    const { data } = await supabase.auth.getSession();
    const uid = data.session?.user?.id;
    if (!uid) return;
    await (supabase as any).from("profiles").upsert({ id: uid, avatar_url: skinId }, { onConflict: "id" });
  } catch { /* ignore */ }
}

export async function signOutRubyM() {
  try {
    // Logout encerra a sessão no Supabase; o handler SIGNED_OUT do AuthGate
    // limpa os dados locais (wipe de rubym.*) para isolar as carteiras.
    // Só o flag de guest sai aqui para o AuthGate reavaliar a sessão.
    localStorage.removeItem(GUEST_KEY);
  } catch {
    /* ignore */
  }
  await supabase.auth.signOut();
}




