import { useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { assetUrlFromJson } from "@/lib/assetUrl";
import crystalRedImg from "@/assets/materials/cristal-red.png";
import pokeballImg from "@/assets/items/icon-pokeball.webp";
import ultraballImg from "@/assets/items/icon-ultraball.webp";
import masterballImg from "@/assets/ball-master.png";
import mountImg from "@/CHAR/montaria.webp";
import oneSkinImg from "@/assets/skins/one-portrait.png";
import reviveImg from "@/assets/items/icon-revive.webp";
import potionImg from "@/assets/items/icon-potion.webp";
import comboFoodImg from "@/assets/comida/cake_strawberry.png";
import slimeBallImg from "@/assets/items/icon-slime.webp";
import bookAtkImg from "@/assets/icons/book-atk.webp";
import bookExpImg from "@/assets/icons/book-exp.webp";
import vipEpicImg from "@/ambiente/Vip Epic.png";
import vipGoldImg from "@/ambiente/Vip Gold.png";
import vegetaImg from "@/CHAR/vegeta-profile.png";
import gokuImg from "@/CHAR/goku-profile.png";
import eggImg from "@/CHAR/kg/Drop card/CARD EGG.webp";
import cashShopDiamondImg from "@/assets/cash-shop/dnm-diamond.webp";
import shopBagImg from "@/ambiente/aba/men ic/Mochila.webp";
import orbMinorAsset from "@/assets/orb-xp-minor.png.asset.json";
import orbMajorAsset from "@/assets/orb-xp-major.png.asset.json";
import orbSupremeAsset from "@/assets/orb-xp-supreme.png.asset.json";
import orbTeamAsset from "@/assets/orb-xp-team.png.asset.json";
import { CaktoPixShop } from "@/components/CaktoPixShop";
import { CashShopBannerCarousel } from "@/components/cash-shop/CashShopBannerCarousel";
import "@/components/cash-shop/cash-shop.css";

const orbMinorImg = assetUrlFromJson(orbMinorAsset);
const orbMajorImg = assetUrlFromJson(orbMajorAsset);
const orbSupremeImg = assetUrlFromJson(orbSupremeAsset);
const orbTeamImg = assetUrlFromJson(orbTeamAsset);

export const RED_CRYSTAL_SHOP_PRODUCTS = [
  {
    id: "pokeball_50",
    name: "Pacote Poké Ball ×50",
    description: "50 Poké Balls utilizáveis em combate.",
    price: 300,
    image: pokeballImg,
    accent: "#ff6b6b",
    tag: "BOLAS",
  },
  {
    id: "pokeball_100",
    name: "Pacote Poké Ball ×100",
    description: "100 Poké Balls utilizáveis em combate.",
    price: 600,
    image: pokeballImg,
    accent: "#ff9f43",
    tag: "BOLAS",
  },
  {
    id: "ultraball_50",
    name: "Pacote Ultra Ball ×50",
    description: "50 Ultra Balls com alta chance de captura.",
    price: 1_500,
    image: ultraballImg,
    accent: "#ffd166",
    tag: "BOLAS",
  },
  {
    id: "ultraball_100",
    name: "Pacote Ultra Ball ×100",
    description: "100 Ultra Balls em promoção.",
    price: 2_300,
    image: ultraballImg,
    accent: "#ffe29a",
    tag: "BOLAS · PROMO",
  },
  {
    id: "masterball",
    name: "Master Ball",
    description: "Captura 100% garantida contra qualquer Pokémon selvagem. 1 unidade.",
    price: 10_000,
    image: masterballImg,
    accent: "#c084fc",
    tag: "BOLA 100%",
  },
  {
    id: "revive_pack_10",
    name: "Pacote Revive ×10",
    description: "10 Revives para levantar seu Pokémon com HP cheio.",
    price: 10,
    image: reviveImg,
    accent: "#ff6f91",
    tag: "CURA",
  },
  {
    id: "potion_20",
    name: "20 Poções",
    description: "20 Poções para curar o time. Oferta especial: 1 Cristal Vermelho.",
    price: 1,
    image: potionImg,
    accent: "#61e6a3",
    tag: "CURA",
  },
  {
    id: "combo_revo",
    name: "Combo Revo",
    description: "Alimenta o Pokémon líder (+60 fome, +15 lealdade) e o treinador (+50 fome, +40 energia).",
    price: 20,
    image: comboFoodImg,
    accent: "#f5b85b",
    tag: "COMIDA",
  },
  {
    id: "slimeball",
    name: "Pokébola Slime",
    description: "A única bola que captura Slimes. Cada uma custa 50 Cristais Vermelhos.",
    price: 50,
    image: slimeBallImg,
    accent: "#38bdf8",
    tag: "ESPECIAL",
  },
  {
    id: "book_atk",
    name: "Livro de Ataque",
    description: "Use na Mochila para ganhar +10% de dano permanente.",
    price: 500,
    image: bookAtkImg,
    accent: "#ff5b5b",
    tag: "LIVRO",
  },
  {
    id: "book_exp",
    name: "Livro de EXP",
    description: "Use na Mochila: +30% de EXP por 1 hora.",
    price: 300,
    image: bookExpImg,
    accent: "#67d9ff",
    tag: "LIVRO",
  },
  {
    id: "orb_xp_minor",
    name: "Orb Menor",
    description: "Use na Mochila: +10% de EXP por 1 hora.",
    price: 500,
    image: orbMinorImg,
    accent: "#7ce38b",
    tag: "ORB",
  },
  {
    id: "orb_xp_major",
    name: "Orb Maior",
    description: "Use na Mochila: +20% de EXP por 1 hora.",
    price: 500,
    image: orbMajorImg,
    accent: "#b78cff",
    tag: "ORB",
  },
  {
    id: "orb_xp_supreme",
    name: "Orb Supremo",
    description: "Use na Mochila: +30% de EXP por 1 hora.",
    price: 500,
    image: orbSupremeImg,
    accent: "#ffd166",
    tag: "ORB",
  },
  {
    id: "orb_team",
    name: "Orb de Time",
    description: "Use na Mochila: todo o time ganha EXP por 3 horas.",
    price: 500,
    image: orbTeamImg,
    accent: "#fb8cff",
    tag: "ORB",
  },
  {
    id: "vip_epic",
    name: "VIP EPIC · 30 dias",
    description: "Livro VIP usável: +30% de Ouro e EXP durante 30 dias.",
    price: 10_000,
    image: vipEpicImg,
    accent: "#f7c948",
    tag: "VIP",
  },
  {
    id: "vip_gold_30",
    name: "VIP GOLD · 30 dias",
    description: "Livro VIP GOLD: +40% de Ouro e EXP por 30 dias. Com AUTO ligado, coleta drops e alimenta o líder automaticamente.",
    price: 2_000,
    image: vipGoldImg,
    accent: "#ffd166",
    tag: "VIP",
  },
  {
    id: "egg_epic",
    name: "Ovo Épico Aleatório",
    description: "Chocar na Mochila para sortear um Pokémon de alto nível de raridade.",
    price: 1_000,
    image: eggImg,
    accent: "#bd8cff",
    tag: "OVO",
  },
  {
    id: "egg_mythic",
    name: "Ovo Mítico Aleatório",
    description: "Chocar na Mochila para sortear um Pokémon de alta raridade, incluindo míticos.",
    price: 8_000,
    image: eggImg,
    accent: "#ff8cdb",
    tag: "OVO",
  },
  {
    id: "mount_30",
    name: "Montaria Épica · 30 dias",
    description: "Carta SAWSBUCK-S3: ativa a montaria épica por 30 dias e dá +5 de agilidade. Use na Mochila.",
    price: 3_000,
    image: mountImg,
    accent: "#ffd166",
    tag: "MONTARIA",
  },
  {
    id: "vegeta_skin",
    name: "Skin Vegeta",
    description: "Desbloqueio permanente e exclusivo para usar na aba Início.",
    price: 3_000,
    image: vegetaImg,
    accent: "#f6bd60",
    tag: "SKIN ÚNICA",
  },
  {
    id: "goku_skin",
    name: "Skin Goku",
    description: "Desbloqueio permanente e exclusivo para usar na aba Início.",
    price: 4_000,
    image: gokuImg,
    accent: "#ff9f43",
    tag: "SKIN ÚNICA",
  },
  {
    id: "one_skin",
    name: "Skin One",
    description: "Desbloqueio permanente da skin One para usar na aba Início.",
    price: 3_000,
    image: oneSkinImg,
    accent: "#7dd3fc",
    tag: "SKIN ÚNICA",
  },
] as const;

export type RedCrystalShopProductId = typeof RED_CRYSTAL_SHOP_PRODUCTS[number]["id"];
export type RedCrystalShopProduct = typeof RED_CRYSTAL_SHOP_PRODUCTS[number];

export type RedCrystalPurchaseResult = {
  ok: boolean;
  message: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  redCrystals: number;
  ready: boolean;
  ownsVegeta: boolean;
  ownsGoku: boolean;
  ownsOne: boolean;
  playerName: string;
  onPurchase: (productId: RedCrystalShopProductId) => Promise<RedCrystalPurchaseResult>;
  onCrystalsCredited: (redCrystals: number) => void;
  onOpenBag?: () => void;
};

export function RedCrystalCashShopModal({
  open,
  onClose,
  redCrystals,
  ready,
  ownsVegeta,
  ownsGoku,
  ownsOne,
  playerName,
  onPurchase,
  onCrystalsCredited,
  onOpenBag,
}: Props) {
  const [pendingId, setPendingId] = useState<RedCrystalShopProductId | null>(null);
  const [notice, setNotice] = useState<RedCrystalPurchaseResult | null>(null);
  const [confirming, setConfirming] = useState<RedCrystalShopProductId | null>(null);
  const [celebration, setCelebration] = useState<{ product: RedCrystalShopProduct; result: RedCrystalPurchaseResult } | null>(null);
  const [shopTab, setShopTab] = useState<"cards" | "items">("items");
  const contentRef = useRef<HTMLDivElement>(null);
  const tabsRef = useRef<HTMLDivElement>(null);
  const tabTopRef = useRef<HTMLDivElement>(null);

  const openShopTab = (next: "cards" | "items") => {
    setShopTab(next);
    const content = contentRef.current;
    const anchor = tabTopRef.current;
    if (content && anchor) {
      const top = content.scrollTop + anchor.getBoundingClientRect().top - content.getBoundingClientRect().top;
      content.scrollTo({ top, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
    }
    tabsRef.current?.querySelector<HTMLButtonElement>(`#cash-shop-tab-${next}`)?.focus({ preventScroll: true });
  };

  if (!open || typeof document === "undefined") return null;
  const confirmProduct = confirming ? RED_CRYSTAL_SHOP_PRODUCTS.find((product) => product.id === confirming) : null;

  const buy = async (productId: RedCrystalShopProductId) => {
    if (pendingId) return;
    setPendingId(productId);
    setNotice(null);
    try {
      const result = await onPurchase(productId);
      setNotice(result);
      if (result.ok) {
        const product = RED_CRYSTAL_SHOP_PRODUCTS.find((entry) => entry.id === productId);
        if (product) setCelebration({ product, result });
      }
    } catch {
      setNotice({ ok: false, message: "Não foi possível concluir a compra. Tente novamente." });
    } finally {
      setPendingId(null);
    }
  };

  return createPortal(
    <div
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 60000,
        display: "grid",
        placeItems: "center",
        padding: 12,
        background: "rgba(3, 5, 12, 0.86)",
        backdropFilter: "blur(10px)",
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="red-crystal-cash-shop-title"
        style={{
          width: "min(1060px, 100%)",
          maxHeight: "min(92vh, 830px)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          border: "1px solid rgba(255, 95, 95, .65)",
          borderRadius: 18,
          color: "#fff8f4",
          background: "radial-gradient(circle at 18% 0%, rgba(171, 31, 55, .43), transparent 32%), radial-gradient(circle at 88% 100%, rgba(109, 36, 41, .34), transparent 37%), linear-gradient(135deg, #180b16, #080b16 58%, #160b12)",
          boxShadow: "0 20px 80px rgba(0, 0, 0, .72), 0 0 42px rgba(255, 69, 69, .23)",
        }}
      >
        <header
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "14px 16px",
            borderBottom: "1px solid rgba(255,255,255,.1)",
            background: "rgba(0,0,0,.28)",
          }}
        >
          <img
            src={crystalRedImg}
            alt=""
            width={44}
            height={44}
            style={{ width: 44, height: 44, objectFit: "contain", filter: "drop-shadow(0 0 9px #ff4559)" }}
          />
          <div style={{ minWidth: 0, flex: 1 }}>
            <h2 id="red-crystal-cash-shop-title" style={{ margin: 0, fontSize: "clamp(18px, 3vw, 25px)", fontWeight: 950, letterSpacing: ".06em", color: "#ffe3df" }}>
              LOJA CASH
            </h2>
            <p style={{ margin: "2px 0 0", color: "#ffc2bc", fontSize: 12, lineHeight: 1.35 }}>
              Cards de diamantes e itens para sua aventura.
            </p>
          </div>
          <div
            aria-label={`${redCrystals.toLocaleString("pt-BR")} Cristais Vermelhos`}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 10px",
              borderRadius: 10,
              border: "1px solid rgba(255, 113, 113, .55)",
              background: "rgba(117, 18, 30, .37)",
              color: "#ffe5e2",
              fontWeight: 900,
              fontSize: 13,
              whiteSpace: "nowrap",
            }}
          >
            <img src={crystalRedImg} alt="" width={20} height={20} style={{ width: 20, height: 20, objectFit: "contain" }} />
            {Math.max(0, Math.floor(redCrystals)).toLocaleString("pt-BR")}
          </div>
          <button
            type="button"
            aria-label="Fechar Loja Cash"
            onClick={onClose}
            style={{
              width: 34,
              height: 34,
              border: "1px solid rgba(255,255,255,.18)",
              borderRadius: 9,
              color: "#fff",
              background: "rgba(255,255,255,.06)",
              cursor: "pointer",
              fontSize: 18,
              lineHeight: 1,
            }}
          >×</button>
        </header>

        <div ref={contentRef} style={{ minHeight: 0, overflowY: "auto", padding: "14px 16px 20px" }}>
          <CashShopBannerCarousel onOpenCards={() => openShopTab("cards")} />
          <div ref={tabTopRef} aria-hidden="true" />
          <div
            ref={tabsRef}
            className="cash-shop-tabs"
            role="tablist"
            aria-label="Categorias da Loja Cash"
            onKeyDown={(event) => {
              if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
              event.preventDefault();
              const next = event.key === "Home" ? "cards" : event.key === "End" ? "items" : shopTab === "cards" ? "items" : "cards";
              openShopTab(next);
            }}
          >
            <button type="button" role="tab" id="cash-shop-tab-cards" aria-controls="cash-shop-panel-cards" aria-selected={shopTab === "cards"} tabIndex={shopTab === "cards" ? 0 : -1} onClick={() => openShopTab("cards")}>
              <span className="cash-shop-tab__icon cash-shop-tab__icon--cards" aria-hidden="true">
                <img src={cashShopDiamondImg} alt="" width={40} height={40} draggable={false} />
              </span>
              <span>CASH SHOP</span>
            </button>
            <button type="button" role="tab" id="cash-shop-tab-items" aria-controls="cash-shop-panel-items" aria-selected={shopTab === "items"} tabIndex={shopTab === "items" ? 0 : -1} onClick={() => openShopTab("items")}>
              <span className="cash-shop-tab__icon cash-shop-tab__icon--items" aria-hidden="true">
                <img src={shopBagImg} alt="" width={40} height={40} draggable={false} />
              </span>
              <span>SHOP ITENS</span>
            </button>
          </div>
          {!ready && (
            <div style={{ marginBottom: 12, padding: "10px 12px", borderRadius: 10, border: "1px solid rgba(255, 207, 103, .5)", color: "#ffe09b", background: "rgba(108, 72, 22, .28)", fontSize: 12, fontWeight: 700 }}>
              ⏳ Entre em uma conta e aguarde o save carregar para comprar com segurança.
            </div>
          )}
          {/* Keep the payment component mounted across tabs so an open order keeps updating. */}
          <div role="tabpanel" id="cash-shop-panel-cards" aria-labelledby="cash-shop-tab-cards" hidden={shopTab !== "cards"}>
            <CaktoPixShop playerName={playerName} redCrystals={redCrystals} onCredited={onCrystalsCredited} />
          </div>

          <div role="tabpanel" id="cash-shop-panel-items" aria-labelledby="cash-shop-tab-items" hidden={shopTab !== "items"}>
          {notice && (
            <div
              role="status"
              style={{
                marginBottom: 12,
                padding: "10px 12px",
                borderRadius: 10,
                border: `1px solid ${notice.ok ? "rgba(104, 229, 160, .62)" : "rgba(255, 128, 128, .65)"}`,
                background: notice.ok ? "rgba(32, 132, 79, .26)" : "rgba(151, 35, 45, .3)",
                color: notice.ok ? "#b8ffd5" : "#ffd1d1",
                fontSize: 12,
                fontWeight: 750,
              }}
            >
              {notice.ok ? "✓ " : "⚠ "}{notice.message}
            </div>
          )}

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
              gap: 10,
            }}
          >
            {RED_CRYSTAL_SHOP_PRODUCTS.map((product) => {
              const alreadyOwned = product.id === "vegeta_skin"
                ? ownsVegeta
                : product.id === "goku_skin"
                  ? ownsGoku
                  : product.id === "one_skin" && ownsOne;
              const unaffordable = redCrystals < product.price;
              const buying = pendingId === product.id;
              const disabled = !ready || alreadyOwned || unaffordable || !!pendingId;
              return (
                <article
                  key={product.id}
                  style={{
                    position: "relative",
                    minHeight: 252,
                    display: "flex",
                    flexDirection: "column",
                    overflow: "hidden",
                    padding: 12,
                    borderRadius: 13,
                    border: `1px solid ${alreadyOwned ? "rgba(117, 255, 178, .48)" : `${product.accent}85`}`,
                    background: "linear-gradient(150deg, rgba(255,255,255,.1), rgba(255,255,255,.025) 38%, rgba(0,0,0,.3))",
                    boxShadow: `inset 0 1px 0 rgba(255,255,255,.09), 0 8px 24px ${product.accent}18`,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 10, minHeight: 80 }}>
                    <div style={{ width: 70, height: 70, flex: "0 0 70px", display: "grid", placeItems: "center", borderRadius: 11, border: `1px solid ${product.accent}70`, background: "rgba(0,0,0,.3)" }}>
                      <img src={product.image} alt="" width={64} height={64} style={{ width: 64, height: 64, objectFit: "contain", imageRendering: "auto", filter: `drop-shadow(0 0 9px ${product.accent}88)` }} />
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <span style={{ display: "inline-block", marginBottom: 4, padding: "2px 6px", borderRadius: 99, color: product.accent, border: `1px solid ${product.accent}80`, background: "rgba(0,0,0,.22)", fontSize: 9, fontWeight: 950, letterSpacing: ".1em" }}>
                        {product.tag}
                      </span>
                      <h3 style={{ margin: 0, color: "#fff", fontSize: 14, lineHeight: 1.16, fontWeight: 900 }}>{product.name}</h3>
                    </div>
                  </div>
                  <p style={{ margin: "10px 0", minHeight: 48, color: "#e9d9db", fontSize: 11.5, lineHeight: 1.38 }}>
                    {product.description}
                  </p>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 9, marginTop: "auto" }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, color: "#ffe3e0", fontWeight: 950, fontSize: 14 }}>
                      <img src={crystalRedImg} alt="" width={19} height={19} style={{ width: 19, height: 19, objectFit: "contain" }} />
                      {product.price.toLocaleString("pt-BR")}
                    </span>
                    <button
                      type="button"
                      onClick={() => setConfirming(product.id)}
                      disabled={disabled}
                      style={{
                        minWidth: 89,
                        padding: "9px 10px",
                        border: "none",
                        borderRadius: 9,
                        background: disabled ? "rgba(255,255,255,.1)" : `linear-gradient(135deg, ${product.accent}, #b91c3a)`,
                        color: disabled ? "rgba(255,255,255,.42)" : "#140a0e",
                        cursor: disabled ? "not-allowed" : "pointer",
                        fontSize: 10,
                        fontWeight: 950,
                        letterSpacing: ".05em",
                      }}
                    >
                      {buying ? "COMPRANDO…" : alreadyOwned ? "ADQUIRIDA" : unaffordable ? "FALTAM CRISTAIS" : "COMPRAR"}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
          </div>
        </div>
      </section>

      {confirmProduct && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Confirmar compra de ${confirmProduct.name}`}
          onMouseDown={(event) => { if (event.target === event.currentTarget) setConfirming(null); }}
          style={{
            position: "fixed", inset: 0, zIndex: 60001, display: "grid", placeItems: "center",
            padding: 16, background: "rgba(2,5,12,.78)", backdropFilter: "blur(5px)",
          }}
        >
          <div
            onMouseDown={(event) => event.stopPropagation()}
            style={{
              width: "min(390px, 100%)", padding: 17, borderRadius: 14,
              border: `2px solid ${confirmProduct.accent}`,
              background: "linear-gradient(160deg, #1a1020, #0b1220)",
              boxShadow: "0 18px 60px #000c", color: "#fff",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
              <div style={{ width: 64, height: 64, display: "grid", placeItems: "center", borderRadius: 10, border: `1px solid ${confirmProduct.accent}80`, background: "rgba(0,0,0,.3)" }}>
                <img src={confirmProduct.image} alt="" width={58} height={58} style={{ objectFit: "contain", imageRendering: "pixelated" }} />
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ color: "#ffe3a0", fontSize: 11, fontWeight: 900, letterSpacing: ".1em" }}>CONFIRMAR COMPRA</div>
                <strong style={{ display: "block", fontSize: 16, lineHeight: 1.2 }}>{confirmProduct.name}</strong>
              </div>
            </div>
            <p style={{ margin: "12px 0 9px", color: "#becce1", fontSize: 11.5, lineHeight: 1.4 }}>
              {confirmProduct.description}
            </p>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, padding: "8px 10px", borderRadius: 8, background: "rgba(120,18,30,.35)", border: "1px solid rgba(255,113,113,.45)" }}>
              <span style={{ color: "#ffd8d4", fontWeight: 800, fontSize: 12 }}>Valor</span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 5, color: "#fff", fontWeight: 950 }}>
                <img src={crystalRedImg} alt="" width={20} height={20} />
                {confirmProduct.price.toLocaleString("pt-BR")} Cristal(is) Vermelho(s)
              </span>
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
              <button
                type="button"
                onClick={() => setConfirming(null)}
                style={{ flex: 1, padding: "9px 8px", borderRadius: 8, border: "1px solid #53657e", background: "#18253a", color: "#dce8f8", fontWeight: 900, cursor: "pointer" }}
              >Cancelar</button>
              <button
                type="button"
                disabled={!!pendingId}
                onClick={() => {
                  const productId = confirmProduct.id;
                  setConfirming(null);
                  void buy(productId);
                }}
                style={{ flex: 1.4, padding: "9px 8px", borderRadius: 8, border: "1px solid #ffe3a0", background: "linear-gradient(180deg, #ffe3a0, #c8902f)", color: "#241604", fontWeight: 950, cursor: "pointer" }}
              >Confirmar compra</button>
            </div>
          </div>
        </div>
      )}

      {celebration && (
        <div
          className="cash-shop-celebration"
          role="dialog"
          aria-modal="true"
          aria-labelledby="cash-shop-celebration-title"
          style={{ "--shop-accent": celebration.product.accent } as CSSProperties}
          onMouseDown={(event) => { if (event.target === event.currentTarget) setCelebration(null); }}
        >
          <div className="cash-shop-celebration__card">
            <span className="cash-shop-celebration__glow" aria-hidden="true" />
            <span className="cash-shop-celebration__rays" aria-hidden="true" />
            {Array.from({ length: 8 }, (_, index) => (
              <span key={index} className={`cash-shop-celebration__spark is-${index + 1}`} aria-hidden="true" />
            ))}
            <span className="cash-shop-celebration__kicker">COMPRA CONFIRMADA</span>
            <h3 id="cash-shop-celebration-title" className="cash-shop-celebration__title">PARABÉNS!</h3>
            <div className="cash-shop-celebration__image">
              <img src={celebration.product.image} alt="" width={88} height={88} draggable={false} />
            </div>
            <strong className="cash-shop-celebration__product">{celebration.product.name}</strong>
            <p className="cash-shop-celebration__message">{celebration.result.message}</p>
            <span className="cash-shop-celebration__bag">
              {celebration.product.id.endsWith("_skin")
                ? "Desbloqueado na sua conta"
                : celebration.product.id === "vip_gold_30"
                  ? "Livro na Mochila · use para ativar os 30 dias"
                  : "Já está na sua Mochila"}
            </span>
            <div className="cash-shop-celebration__actions">
              {onOpenBag && !celebration.product.id.endsWith("_skin") && (
                <button
                  type="button"
                  className="cash-shop-celebration__bag-button"
                  onClick={() => { setCelebration(null); onOpenBag(); }}
                >
                  Ver na Mochila
                </button>
              )}
              <button
                type="button"
                className="cash-shop-celebration__close"
                onClick={() => setCelebration(null)}
                autoFocus
              >
                Continuar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>,
    document.body,
  );
}
