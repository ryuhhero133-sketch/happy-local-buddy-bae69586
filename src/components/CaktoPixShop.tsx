import { useEffect, useRef, useState, type CSSProperties } from "react";
import QRCode from "qrcode";
import { supabase } from "@/integrations/supabase/client";
import crystalRedImg from "@/assets/materials/cristal-red.png";
import { DIAMOND_PACKAGE_ART } from "@/components/cash-shop/cashShopArt";
import "@/components/cash-shop/cash-shop.css";

type CaktoPackage = {
  id: string;
  name: string;
  diamonds: number;
  price_cents: number | null;
  currency: string;
  active: boolean;
};

type PixCheckout = {
  orderId: string;
  packageId: string;
  diamonds: number;
  amountCents: number;
  currency: string;
  pixQrCode: string;
  pixExpiration: string | null;
  checkoutUrl: string | null;
  status: string;
  mode: "pix" | "hosted";
};

type MyOrder = {
  order_id: string;
  package_id: string;
  package_name: string;
  diamonds: number;
  status: string;
  pix_qr_code: string | null;
  pix_expiration: string | null;
  amount_cents: number | null;
  currency: string;
  credited_diamonds: number;
  overflow_diamonds: number;
  red_crystals: number;
  created_at: string;
  paid_at: string | null;
};

type Props = {
  playerName: string;
  redCrystals: number;
  onCredited: (redCrystals: number) => void;
};

// New tables/RPCs are not in the generated Database type yet.
const db = supabase as any;

const money = (cents: number | null | undefined) =>
  typeof cents === "number" && Number.isFinite(cents)
    ? `R$ ${(cents / 100).toFixed(2).replace(".", ",")}`
    : "Em configuração";

function errorMessage(code: unknown): string {
  switch (String(code ?? "")) {
    case "packages_not_configured": return "Os pacotes PIX ainda estão sendo configurados no servidor.";
    case "cakto_not_configured": return "O pagamento PIX ainda não foi habilitado nesta conta.";
    case "payment_processing_or_conflict": return "O PIX anterior ainda está sendo processado. Aguarde alguns segundos.";
    case "cakto_payment_failed": return "Não foi possível gerar o PIX agora. Tente novamente.";
    case "name_required": return "Informe seu nome completo.";
    case "phone_required": return "Informe um celular válido com DDD.";
    case "document_required": return "Informe um CPF ou CNPJ válido.";
    case "email_required": return "Sua conta precisa ter um e-mail para gerar o PIX.";
    case "checkout_create_failed": return "Não foi possível abrir a página de pagamento. Tente novamente.";
    case "order_expired": return "Este pedido expirou. Feche e tente novamente.";
    case "token_conflict": return "Não foi possível iniciar esta compra. Tente novamente.";
    default: return "Não foi possível iniciar o pagamento. Tente novamente.";
  }
}

export function CaktoPixShop({ playerName, redCrystals, onCredited }: Props) {
  const [packages, setPackages] = useState<CaktoPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<CaktoPackage | null>(null);
  const [choosingMethod, setChoosingMethod] = useState<CaktoPackage | null>(null);
  const [form, setForm] = useState({ name: playerName, phone: "", docType: "cpf", docNumber: "" });
  const [formOpen, setFormOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [pix, setPix] = useState<PixCheckout | null>(null);
  const [order, setOrder] = useState<MyOrder | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const requestId = useRef<string | null>(null);
  const creditedRef = useRef(onCredited);
  creditedRef.current = onCredited;

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const { data, error: loadError } = await db
          .from("cakto_packages")
          .select("id,name,diamonds,price_cents,currency,active")
          .order("sort_order");
        if (loadError) throw loadError;
        if (active) setPackages((data ?? []) as CaktoPackage[]);
      } catch {
        if (active) setPackages([]);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    setForm((current) => ({ ...current, name: playerName || current.name }));
  }, [playerName]);

  useEffect(() => {
    if (!pix?.pixQrCode) { setQrDataUrl(""); return; }
    let active = true;
    void QRCode.toDataURL(pix.pixQrCode, {
      margin: 1, width: 240, errorCorrectionLevel: "M",
      color: { dark: "#13213c", light: "#ffffff" },
    }).then((url) => { if (active) setQrDataUrl(url); }).catch(() => { if (active) setQrDataUrl(""); });
    return () => { active = false; };
  }, [pix?.pixQrCode]);

  useEffect(() => {
    if (!pix?.orderId || order?.status === "paid" || order?.status === "expired") return;
    let active = true;
    const check = async () => {
      const { data, error: checkError } = await db.rpc("get_my_cakto_order", { p_order_id: pix.orderId });
      if (!active || checkError) return;
      const row = Array.isArray(data) ? data[0] as MyOrder | undefined : undefined;
      if (!row) return;
      setOrder(row);
      if (row.status === "paid") creditedRef.current(row.red_crystals);
    };
    void check();
    const timer = window.setInterval(() => { if (document.visibilityState === "visible") void check(); }, 3000);
    return () => { active = false; window.clearInterval(timer); };
  }, [pix?.orderId, order?.status]);

  const openForm = (pkg: CaktoPackage) => {
    setChoosingMethod(null);
    requestId.current = crypto.randomUUID();
    setSelected(pkg);
    setForm({ name: playerName, phone: "", docType: "cpf", docNumber: "" });
    setError("");
    setOrder(null);
    setPix(null);
    setFormOpen(true);
  };

  const closeAll = () => {
    setChoosingMethod(null);
    setSelected(null);
    setFormOpen(false);
    setPix(null);
    setOrder(null);
    setError("");
    setCopied(false);
    requestId.current = null;
  };

  const createPix = async () => {
    if (!selected || busy) return;
    setBusy(true); setError("");
    try {
      if (!requestId.current) requestId.current = crypto.randomUUID();
      const digits = form.phone.replace(/\D/g, "");
      const phone = digits.startsWith("55") ? digits : `55${digits}`;
      const docNumber = form.docNumber.replace(/\D/g, "");
      const { data, error: invokeError } = await supabase.functions.invoke("cakto-create-payment", {
        body: {
          packageId: selected.id,
          requestId: requestId.current,
          customer: { name: form.name.trim(), phone, docType: form.docType, docNumber },
        },
      });
      if (invokeError) throw invokeError;
      const result = data as { ok?: boolean; error?: string; status?: string; orderId?: string; diamonds?: number; amountCents?: number; currency?: string; pixQrCode?: string; pixExpiration?: string | null; checkoutUrl?: string | null } | null;
      if (!result?.ok) throw new Error(result?.error ?? "payment_failed");
      if (result.status === "paid") {
        const credited = result.diamonds ?? selected.diamonds;
        const paidAt = new Date().toISOString();
        setOrder({
          order_id: result.orderId ?? "",
          package_id: selected.id,
          package_name: selected.name,
          diamonds: selected.diamonds,
          status: "paid",
          pix_qr_code: null,
          pix_expiration: null,
          amount_cents: result.amountCents ?? selected.price_cents ?? 0,
          currency: result.currency ?? "BRL",
          credited_diamonds: credited,
          overflow_diamonds: 0,
          red_crystals: redCrystals + credited,
          created_at: paidAt,
          paid_at: paidAt,
        });
        setPix({
          orderId: result.orderId ?? "",
          packageId: selected.id,
          diamonds: selected.diamonds,
          amountCents: result.amountCents ?? selected.price_cents ?? 0,
          currency: result.currency ?? "BRL",
          pixQrCode: "",
          pixExpiration: null,
          checkoutUrl: null,
          status: "paid",
          mode: "pix",
        });
        creditedRef.current(redCrystals + credited);
        setFormOpen(false);
        return;
      }
      if (!result.orderId || !result.pixQrCode) throw new Error("pix_missing");
      setPix({
        orderId: result.orderId,
        packageId: selected.id,
        diamonds: result.diamonds ?? selected.diamonds,
        amountCents: result.amountCents ?? selected.price_cents ?? 0,
        currency: result.currency ?? "BRL",
        pixQrCode: result.pixQrCode,
        pixExpiration: result.pixExpiration ?? null,
        checkoutUrl: result.checkoutUrl ?? null,
        status: result.status ?? "pending",
        mode: "pix",
      });
      setFormOpen(false);
    } catch (caught) {
      const candidate = caught as { message?: string; context?: { error?: string } };
      setError(errorMessage(candidate?.context?.error ?? candidate?.message));
    } finally {
      setBusy(false);
    }
  };

  const createHostedCheckout = async (pkg: CaktoPackage) => {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const hostedRequestId = crypto.randomUUID();
      const { data, error: invokeError } = await supabase.functions.invoke("cakto-create-checkout", {
        body: { packageId: pkg.id, requestId: hostedRequestId, name: playerName },
      });
      if (invokeError) throw invokeError;
      const result = data as {
        ok?: boolean; error?: string; status?: string; orderId?: string; diamonds?: number;
        amountCents?: number; currency?: string; checkoutUrl?: string;
      } | null;
      if (!result?.ok || !result.orderId) throw new Error(result?.error ?? "checkout_create_failed");

      setSelected(pkg);
      setChoosingMethod(null);
      setFormOpen(false);

      if (result.status === "paid") {
        const credited = result.diamonds ?? pkg.diamonds;
        const paidAt = new Date().toISOString();
        setOrder({
          order_id: result.orderId,
          package_id: pkg.id,
          package_name: pkg.name,
          diamonds: pkg.diamonds,
          status: "paid",
          pix_qr_code: null,
          pix_expiration: null,
          amount_cents: result.amountCents ?? pkg.price_cents ?? 0,
          currency: result.currency ?? "BRL",
          credited_diamonds: credited,
          overflow_diamonds: 0,
          red_crystals: redCrystals + credited,
          created_at: paidAt,
          paid_at: paidAt,
        });
        setPix({
          orderId: result.orderId,
          packageId: pkg.id,
          diamonds: pkg.diamonds,
          amountCents: result.amountCents ?? pkg.price_cents ?? 0,
          currency: result.currency ?? "BRL",
          pixQrCode: "",
          pixExpiration: null,
          checkoutUrl: null,
          status: "paid",
          mode: "hosted",
        });
        creditedRef.current(redCrystals + credited);
        return;
      }

      if (!result.checkoutUrl || !result.checkoutUrl.startsWith("https://pay.cakto.com.br/")) {
        throw new Error("checkout_create_failed");
      }
      setOrder(null);
      setPix({
        orderId: result.orderId,
        packageId: pkg.id,
        diamonds: result.diamonds ?? pkg.diamonds,
        amountCents: result.amountCents ?? pkg.price_cents ?? 0,
        currency: result.currency ?? "BRL",
        pixQrCode: "",
        pixExpiration: null,
        checkoutUrl: result.checkoutUrl,
        status: result.status ?? "pending",
        mode: "hosted",
      });
    } catch (caught) {
      const candidate = caught as { message?: string; context?: { error?: string } };
      setError(errorMessage(candidate?.context?.error ?? candidate?.message));
    } finally {
      setBusy(false);
    }
  };

  const copyPix = async () => {
    if (!pix?.pixQrCode) return;
    try {
      await navigator.clipboard.writeText(pix.pixQrCode);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      setError("Copie o código PIX manualmente.");
    }
  };

  const hasAvailablePackage = packages.some((pkg) => pkg.active && pkg.price_cents != null);
  if (loading || packages.length === 0) return null;

  return <section style={{ marginBottom: 18 }}>
    <div className="cash-shop-package-heading">
      <img src={crystalRedImg} alt="" width={24} height={24} style={{ width: 24, height: 24, objectFit: "contain", filter: "drop-shadow(0 0 8px #ff4559)" }} />
      <div>
        <strong style={{ color: "#ffe3df", fontSize: 15, letterSpacing: ".04em" }}>DIAMANTES VERMELHOS</strong>
        <span style={{ display: "block", color: "#ffb7b0", fontSize: 10 }}>PIX ou cartão, com entrega automática · saldo {Math.max(0, redCrystals).toLocaleString("pt-BR")}</span>
      </div>
    </div>
    <div className="cash-shop-package-grid">
      {packages.map((pkg) => {
        const available = pkg.active && pkg.price_cents != null;
        const artwork = DIAMOND_PACKAGE_ART[pkg.id];
        const choosePayment = () => {
          setError("");
          setChoosingMethod(pkg);
        };
        return <article key={pkg.id} className="cash-shop-package" style={{ "--package-accent": artwork?.accent ?? "#e5b967" } as CSSProperties}>
          <button type="button" className="cash-shop-package__art" disabled={!available || busy} onClick={choosePayment} aria-label={`Comprar ${pkg.name}`}>
            <img src={artwork?.image ?? crystalRedImg} alt={pkg.name} loading="lazy" decoding="async" />
          </button>
          <div className="cash-shop-package__details">
            <h3>{pkg.name}</h3>
            <span className="cash-shop-package__amount">{pkg.diamonds.toLocaleString("pt-BR")} Diamantes Vermelhos</span>
            <div className="cash-shop-package__footer">
              <b className="cash-shop-package__price">{money(pkg.price_cents)}</b>
              <button type="button" className="cash-shop-package__buy" disabled={!available || busy} onClick={choosePayment}>
                {available ? "COMPRAR" : "EM CONFIGURAÇÃO"}
              </button>
            </div>
            <span className="cash-shop-package__methods">PIX · CARTÃO</span>
          </div>
        </article>;
      })}
    </div>
    {!hasAvailablePackage && <p style={{ margin: "8px 0 0", color: "#ffc2bc", fontSize: 11 }}>Pagamentos em configuração.</p>}
    {error && !choosingMethod && !formOpen && !pix && <p role="alert" style={{ margin: "8px 0 0", padding: 8, borderRadius: 7, background: "#4f1222", color: "#ffd4dc", fontSize: 11 }}>{error}</p>}
    {choosingMethod && <div role="dialog" aria-modal="true" aria-label="Escolher forma de pagamento" style={{ position: "fixed", inset: 0, zIndex: 60002, display: "grid", placeItems: "center", padding: 14, background: "rgba(2,5,12,.86)", backdropFilter: "blur(7px)" }}>
      <div style={{ width: "min(410px, 100%)", maxHeight: "92dvh", overflowY: "auto", padding: 20, borderRadius: 16, border: "2px solid #e6b85e", background: "linear-gradient(160deg,#241323,#0a101d)", color: "#fff" }}>
        <div style={{ color: "#ffe3a0", fontSize: 11, fontWeight: 900, letterSpacing: ".1em" }}>COMPRAR DIAMANTES</div>
        <h3 style={{ margin: "6px 0", fontSize: 18 }}>{choosingMethod.name}</h3>
        <p style={{ margin: 0, color: "#cbd6e8", fontSize: 12 }}>{choosingMethod.diamonds.toLocaleString("pt-BR")} 💎 · {money(choosingMethod.price_cents)}</p>
        <div className="cash-shop-methods">
          <button type="button" disabled={busy} onClick={() => openForm(choosingMethod)}>
            <strong>PIX</strong><span>QR Code e código copia e cola.</span>
          </button>
          <button type="button" disabled={busy} onClick={() => { void createHostedCheckout(choosingMethod); }}>
            <strong>{busy ? "AGUARDE…" : "CARTÃO"}</strong><span>Finalize na página segura de pagamento.</span>
          </button>
        </div>
        {error && <p role="alert" style={{ color: "#ffb5bf", fontSize: 11 }}>{error}</p>}
        <button type="button" disabled={busy} onClick={() => { setChoosingMethod(null); setError(""); }} style={{ width: "100%", padding: 9, borderRadius: 8, border: "1px solid #53657e", background: "#18253a", color: "#dce8f8", fontWeight: 900 }}>Voltar</button>
      </div>
    </div>}
    {formOpen && selected && <div role="dialog" aria-modal="true" aria-label={`Pagamento PIX de ${selected.name}`} style={{ position: "fixed", inset: 0, zIndex: 60002, display: "grid", placeItems: "center", padding: 14, background: "rgba(2,5,12,.82)", backdropFilter: "blur(6px)" }}>
      <div style={{ width: "min(430px, 100%)", padding: 17, borderRadius: 14, border: "2px solid #e6b85e", background: "linear-gradient(160deg,#1b1222,#0a101d)", color: "#fff" }}>
        <div style={{ color: "#ffe3a0", fontSize: 11, fontWeight: 900, letterSpacing: ".1em" }}>PAGAMENTO PIX</div>
        <h3 style={{ margin: "3px 0 4px", fontSize: 18 }}>{selected.name}</h3>
        <p style={{ margin: "0 0 10px", color: "#cbd6e8", fontSize: 11 }}>{selected.diamonds.toLocaleString("pt-BR")} Diamantes Vermelhos · {money(selected.price_cents)}</p>
        <div style={{ display: "grid", gap: 8 }}>
          <label style={{ color: "#ffdfb0", fontSize: 10 }}>Nome completo<input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} placeholder="Seu nome" style={{ display: "block", width: "100%", marginTop: 3, padding: "9px 10px", borderRadius: 8, border: "1px solid #64758e", background: "#0c1523", color: "#fff", fontSize: 13 }} /></label>
          <label style={{ color: "#ffdfb0", fontSize: 10 }}>CPF ou CNPJ<input value={form.docNumber} onChange={(event) => setForm((current) => ({ ...current, docNumber: event.target.value, docType: event.target.value.replace(/\D/g, "").length === 14 ? "cnpj" : "cpf" }))} placeholder="Somente números" inputMode="numeric" style={{ display: "block", width: "100%", marginTop: 3, padding: "9px 10px", borderRadius: 8, border: "1px solid #64758e", background: "#0c1523", color: "#fff", fontSize: 13 }} /></label>
          <label style={{ color: "#ffdfb0", fontSize: 10 }}>Celular com DDD<input value={form.phone} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} placeholder="11999999999" inputMode="tel" style={{ display: "block", width: "100%", marginTop: 3, padding: "9px 10px", borderRadius: 8, border: "1px solid #64758e", background: "#0c1523", color: "#fff", fontSize: 13 }} /></label>
        </div>
        {error && <p role="alert" style={{ margin: "10px 0 0", padding: 8, borderRadius: 7, background: "#4f1222", color: "#ffd4dc", fontSize: 11 }}>{error}</p>}
        <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
          <button type="button" onClick={closeAll} disabled={busy} style={{ flex: 1, padding: 9, borderRadius: 8, border: "1px solid #53657e", background: "#18253a", color: "#dce8f8", fontWeight: 900 }}>Cancelar</button>
          <button type="button" onClick={() => { void createPix(); }} disabled={busy} style={{ flex: 1.5, padding: 9, borderRadius: 8, border: "1px solid #ffe3a0", background: "linear-gradient(180deg,#ffe3a0,#c8902f)", color: "#241604", fontWeight: 950 }}>{busy ? "GERANDO…" : "GERAR PIX"}</button>
        </div>
        <p style={{ margin: "8px 0 0", color: "#8091a8", fontSize: 9 }}>O e-mail da sua conta será usado somente na cobrança.</p>
      </div>
    </div>}

    {pix && !formOpen && <div role="dialog" aria-modal="true" aria-label="Pagamento gerado" style={{ position: "fixed", inset: 0, zIndex: 60002, display: "grid", placeItems: "center", padding: 14, background: "rgba(2,5,12,.86)", backdropFilter: "blur(7px)" }}>
      <div style={{ width: "min(470px, 100%)", maxHeight: "92dvh", overflowY: "auto", padding: 18, borderRadius: 16, border: `2px solid ${order?.status === "paid" ? "#7dffb0" : "#e6b85e"}`, background: "linear-gradient(160deg,#161b26,#0a101d)", color: "#fff", textAlign: "center" }}>
        {order?.status === "paid" ? <>
          <div style={{ fontSize: 36 }}>💎</div>
          <h3 style={{ margin: "4px 0", color: "#b8ffd5", fontSize: 22 }}>PAGAMENTO APROVADO!</h3>
          <p style={{ margin: 0, color: "#e4fff0", fontSize: 14 }}>Seus Diamantes Vermelhos chegaram!</p>
          <p style={{ color: "#9fd8b4", fontSize: 12 }}>+{Number(order.credited_diamonds || order.diamonds).toLocaleString("pt-BR")} 💎 no seu saldo</p>
          {Number(order.overflow_diamonds || 0) > 0 && <p style={{ color: "#ffd48d", fontSize: 11 }}>Parte do saldo ficou reservada para análise: +{Number(order.overflow_diamonds).toLocaleString("pt-BR")} 💎.</p>}
          <p style={{ color: "#ffe3a0", fontSize: 13, fontWeight: 800 }}>✨ Boa aventura, treinador!</p>
          <button type="button" onClick={closeAll} style={{ marginTop: 8, padding: "10px 18px", borderRadius: 9, border: "1px solid #9ce7bd", background: "#1d6646", color: "#fff", fontWeight: 900 }}>Continuar</button>
        </> : <>
          <div style={{ color: "#ffe3a0", fontSize: 11, fontWeight: 900, letterSpacing: ".1em" }}>{pix.mode === "hosted" ? "PAGAMENTO COM CARTÃO" : "PIX GERADO"}</div>
          <h3 style={{ margin: "3px 0", fontSize: 18 }}>{selected?.name ?? "Pacote de Diamantes"}</h3>
          <p style={{ margin: "0 0 10px", color: "#cbd6e8", fontSize: 11 }}>{pix.diamonds.toLocaleString("pt-BR")} 💎 · {money(pix.amountCents)}</p>
          {pix.mode === "hosted" ? <>
            <p style={{ margin: "4px 0 8px", color: "#cfe5ff", fontSize: 12 }}>Finalize sua compra na página segura de pagamento.</p>
            {pix.checkoutUrl && <a href={pix.checkoutUrl} target="_blank" rel="noreferrer" style={{ display: "block", margin: "4px 0 8px", padding: "11px 12px", borderRadius: 9, border: "1px solid #ffe3a0", background: "linear-gradient(180deg,#ffe3a0,#c8902f)", color: "#241604", fontWeight: 950, fontSize: 12, textDecoration: "none" }}>COMPRAR</a>}
            <p style={{ margin: "4px 0", color: "#ffd48d", fontSize: 11 }}>Depois de pagar, esta janela atualiza sozinha.</p>
          </> : <>
            {qrDataUrl && <img src={qrDataUrl} alt="QR Code PIX" width={220} height={220} style={{ width: 220, height: 220, margin: "4px auto", background: "#fff", borderRadius: 10, padding: 5 }} />}
            <textarea readOnly value={pix.pixQrCode} aria-label="Código PIX copia e cola" style={{ width: "100%", height: 64, padding: 7, borderRadius: 7, border: "1px solid #596b84", background: "#07101d", color: "#cfe5ff", fontSize: 9, resize: "none" }} />
            <button type="button" onClick={() => { void copyPix(); }} style={{ marginTop: 6, width: "100%", padding: 9, borderRadius: 8, border: "1px solid #ffe3a0", background: "#3b2a16", color: "#ffe3a0", fontWeight: 900 }}>{copied ? "COPIADO!" : "COPIAR PIX"}</button>
            {pix.checkoutUrl && <a href={pix.checkoutUrl} target="_blank" rel="noreferrer" style={{ display: "block", marginTop: 8, color: "#9fd8ff", fontSize: 11 }}>COMPRAR</a>}
          </>}
          {(order?.status === "expired" || (pix.mode === "pix" && pix.pixExpiration && Date.parse(pix.pixExpiration) <= Date.now()))
            ? <p style={{ margin: "8px 0 4px", color: "#ff9da8", fontSize: 12, fontWeight: 800 }}>{pix.mode === "pix" ? "PIX expirado. Feche e gere outro código." : "Pagamento expirado. Feche e inicie outra compra."}</p>
            : <p style={{ margin: "8px 0 4px", color: "#ffd48d", fontSize: 11 }}>Aguardando confirmação do pagamento…</p>}
          {error && <p style={{ color: "#ffb5bf", fontSize: 11 }}>{error}</p>}
          <button type="button" onClick={closeAll} style={{ marginTop: 10, padding: 8, width: "100%", borderRadius: 8, border: "1px solid #53657e", background: "#18253a", color: "#dce8f8", fontWeight: 800 }}>Fechar</button>
        </>}
      </div>
    </div>}
  </section>;
}
