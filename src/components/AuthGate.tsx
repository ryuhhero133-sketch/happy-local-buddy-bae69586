import { useEffect, useRef, useState, type ReactNode, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { fetchCloudSave, SAVE_KEY } from "@/lib/cloudSave";
import type { Session } from "@supabase/supabase-js";
const loginBgAsset = { url: "/login-bg.png" };

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
async function ensureProfile(userId: string): Promise<string | null> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any;
  log("ensureProfile: select", userId);
  const sel = await sb.from("profiles").select("id, username").eq("id", userId).maybeSingle();
  if (sel.error) {
    warn("ensureProfile select error", sel.error);
    throw sel.error;
  }
  if (sel.data) {
    log("ensureProfile: row exists", sel.data);
    return (sel.data.username as string | null) ?? null;
  }
  log("ensureProfile: inserting row (trigger ausente?)");
  const ins = await sb.from("profiles").insert({ id: userId, username: null });
  if (ins.error) {
    // Race: outra aba/trigger criou. Re-leitura.
    warn("ensureProfile insert error (tentando re-ler)", ins.error);
    const sel2 = await sb.from("profiles").select("username").eq("id", userId).maybeSingle();
    if (sel2.error) throw sel2.error;
    return (sel2.data?.username as string | null) ?? null;
  }
  return null;
}

async function preloadCloudSave(userId: string) {
  try {
    log("preloadCloudSave start", userId);
    const cloud = await fetchCloudSave(userId);
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
  const [mounted, setMounted] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [identity, setIdentity] = useState<LocalIdentity | null>(null);
  const [needsChar, setNeedsChar] = useState(false);
  const [checking, setChecking] = useState(true);
  const [bootstrapping, setBootstrapping] = useState(false);
  const [recoveryMode, setRecoveryMode] = useState(false);
  const [isGuest, setIsGuest] = useState(false);

  useEffect(() => {
    setMounted(true);

    if (typeof window !== "undefined") {
      try {
        // Force removal of guest mode if it exists
        localStorage.removeItem(GUEST_KEY);
      } catch { /* ignore */ }
      if (
        window.location.hash.includes("type=recovery") ||
        window.location.search.includes("recovery=1")
      ) {
        setRecoveryMode(true);
      }
    }

    const CURRENT_UID_KEY = "rubym.currentUid";
    const wipeLocalGameData = () => {
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
    };

    const { data: sub } = supabase.auth.onAuthStateChange((event, sess) => {
      log("authStateChange", event, sess?.user?.id);
      setSession(sess);
      if (event === "PASSWORD_RECOVERY") setRecoveryMode(true);
      if (event === "SIGNED_IN" && sess?.user?.id) {
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
        } catch {
          /* ignore */
        }
      }
    });

    // Em F5 não desloga: a sessão ativa é necessária para reidratar/salvar no Supabase
    // antes de qualquer cache local ser usado. Logout manual continua limpando tudo.
    supabase.auth.getSession().then(({ data }) => {
      log("initial session", data.session?.user?.id ?? null);
      setSession(data.session);
      setChecking(false);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  // Single-session enforcement DESATIVADO — estava causando loop de login
  // no preview (2 iframes / F5) e depois de cadastros. Enquanto o Supabase
  // Realtime estiver sob quota, mantemos o login estável sem auto-kick.
  const [kicked] = useState(false);


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
    let cancelled = false;
    (async () => {
      setBootstrapping(true);
      const uid = currentUid;
      try {
        const username = await ensureProfile(uid);
        if (cancelled) return;

        if (username && username.trim().length > 0) {
          await preloadCloudSave(uid);
          if (cancelled) return;
          setIdentity(writeIdentity(uid, username));
          setNeedsChar(false);
          // last_login best-effort
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          void (supabase as any)
            .from("profiles")
            .update({ last_login: new Date().toISOString() })
            .eq("id", uid)
            .then(({ error }: { error: unknown }) => {
              if (error) warn("update last_login falhou", error);
            });
        } else {
          log("usuário sem username — exibindo CreateCharacterScreen");
          setIdentity(null);
          setNeedsChar(true);
        }
      } catch (e) {
        warn("bootstrap falhou", e);
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


  if (recoveryMode) {
    return <ResetPasswordScreen onDone={() => setRecoveryMode(false)} />;
  }

  if (!session) return <AuthScreen kickedMessage={kicked ? "Sua conta foi conectada em outro dispositivo. Você foi desconectado." : null} />;

  if (bootstrapping) return <SplashScreen label="Carregando perfil..." />;

  if (needsChar || !identity) {
    return (
      <CreateCharacterScreen
        userId={session.user.id}
        defaultName={session.user.email?.split("@")[0] ?? ""}
        onCreated={(name) => {
          setIdentity(writeIdentity(session.user.id, name));
          setNeedsChar(false);
        }}
      />
    );
  }

  return <>{children}</>;
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
      style={{ background: "#05010a" }}
    >
      {/* Background art */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          backgroundImage: `url(${loginBgAsset.url})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          filter: "brightness(0.55) saturate(1.05)",
        }}
      />
      {/* Vignette */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(5,1,10,0.35) 0%, rgba(5,1,10,0.75) 65%, rgba(0,0,0,0.95) 100%)",
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
            background: "radial-gradient(ellipse at center, rgba(239,68,68,0.30), transparent 70%)",
            filter: "blur(18px)",
          }}
        />
        <div
          className="relative"
          style={{
            padding: 2,
            background: "linear-gradient(180deg, #fca5a5 0%, #b91c1c 45%, #450a0a 100%)",
            borderRadius: 10,
            boxShadow: "0 20px 60px rgba(0,0,0,0.85), 0 0 22px rgba(239,68,68,0.35)",
          }}
        >
          <div
            className="relative"
            style={{
              padding: "26px 22px 22px",
              background:
                "linear-gradient(180deg, rgba(15,3,8,0.94), rgba(35,6,14,0.94))",
              borderRadius: 8,
              backdropFilter: "blur(6px)",
              WebkitBackdropFilter: "blur(6px)",
            }}
          >
            <div className="text-center mb-1">
              <div
                className="text-lg font-bold"
                style={{
                  color: "#fef2f2",
                  textShadow:
                    "2px 2px 0 #7f1d1d, 3px 3px 0 #000, 0 0 14px rgba(239,68,68,0.7)",
                  fontFamily: '"Press Start 2P", ui-monospace, monospace',
                  letterSpacing: "4px",
                }}
              >
                IDLE MON
              </div>
            </div>
            <div
              className="text-center mb-4"
              style={{
                color: "#fca5a5",
                fontSize: 9,
                letterSpacing: "3px",
                textShadow: "1px 1px 0 #000",
              }}
            >
              AVENTURA · IDLE · MONSTRINHOS
            </div>

            {title && (
              <div
                className="text-center text-[10px] tracking-[4px] mb-3 pb-2"
                style={{
                  color: "#fca5a5",
                  textShadow: "1px 1px 0 #000",
                  borderBottom: "1px dashed rgba(239,68,68,0.35)",
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
}: {
  children: ReactNode;
  disabled?: boolean;
  type?: "submit" | "button";
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      className="w-full py-2 rounded font-bold tracking-wider transition active:scale-95 disabled:opacity-50"
      style={{
        background: "linear-gradient(180deg, #dc2626, #7f1d1d)",
        color: "#fff5f5",
        border: "2px solid #450a0a",
        textShadow: "1px 1px 0 rgba(0,0,0,0.5)",
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

        <div className="flex justify-between text-[10px] tracking-[2px]" style={{ color: "#fecaca" }}>
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

        {mode === "login" && (
          <button
            type="button"
            onClick={() => {
              try {
                const name = (prompt("Nome do treinador (aparece no chat):", "Convidado") || "").trim().slice(0, 16);
                if (name.length < 2) return;
                const guest: LocalIdentity = {
                  id: `guest-${crypto.randomUUID?.() ?? Date.now()}`,
                  name,
                  secretKey: "",
                  createdAt: Date.now(),
                };
                localStorage.setItem(IDENTITY_KEY, JSON.stringify(guest));
                localStorage.setItem(GUEST_KEY, "1");
                window.location.reload();
              } catch { /* ignore */ }
            }}
            className="w-full mt-2 py-2 text-[11px] tracking-[2px] underline"
            style={{ color: "#fde68a" }}
          >
            MODO CONVIDADO
          </button>
        )}
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

function CreateCharacterScreen({
  userId,
  defaultName,
  onCreated,
}: {
  userId: string;
  defaultName: string;
  onCreated: (name: string) => void;
}) {
  const [name, setName] = useState(defaultName.replace(/[^A-Za-z0-9 _-]/g, "").slice(0, 16));
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const trimmed = name.trim();
    if (trimmed.length < 2) return setError("Nome precisa ter ao menos 2 caracteres.");
    setBusy(true);
    try {
      log("createCharacter upsert", { userId, trimmed });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any).from("profiles").upsert(
        {
          id: userId,
          username: trimmed,
          last_login: new Date().toISOString(),
        },
        { onConflict: "id" },
      );
      if (error) throw error;
      log("createCharacter upsert ok");
      onCreated(trimmed);
    } catch (err) {
      warn("createCharacter falhou", err);
      setError(err instanceof Error ? err.message : "Falha ao criar personagem.");
      setBusy(false);
    }
  };

  return (
    <PanelShell title="CRIE SEU TREINADOR">
      <form onSubmit={submit} className="space-y-3">
        <Field
          label="Nome do Treinador"
          value={name}
          onChange={(v) => setName(v.replace(/[^A-Za-z0-9 _-]/g, "").slice(0, 16))}
          placeholder="Ex: Ash, IdleMaster..."
        />
        <ErrorBox message={error} />
        <PrimaryButton disabled={busy}>{busy ? "CRIANDO..." : "ENTRAR NO MUNDO"}</PrimaryButton>
        <button
          type="button"
          onClick={() => supabase.auth.signOut()}
          className="w-full text-[10px] tracking-[2px] underline"
          style={{ color: "#86efac", background: "transparent", border: 0, padding: "4px 0" }}
        >
          SAIR
        </button>
      </form>
    </PanelShell>
  );
}

export async function signOutRubyM() {
  try {
    localStorage.removeItem(IDENTITY_KEY);
    localStorage.removeItem(GUEST_KEY);
    localStorage.removeItem(SAVE_KEY);
  } catch {
    /* ignore */
  }
  await supabase.auth.signOut();
}
