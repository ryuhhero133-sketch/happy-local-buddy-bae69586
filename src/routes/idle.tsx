// src/routes/idle.tsx
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { FlaskConical, Sparkles, ShieldCheck, X, Search, Settings, Map as MapIcon, Info, User, ShoppingBag, CreditCard, LayoutGrid, Heart, Star, Gift, Clock, Backpack, Store, Wallet, BookOpen, ChevronRight, ChevronDown, Plus, HelpCircle, Mail, Sword, Zap, Shield, TrendingUp, ArrowRight } from "lucide-react";
import { obfuscate, deobfuscate } from "@/lib/utils";
import { ItemPixelIcon } from "@/components/ItemPixelIcon";
import navInicio from "@/assets/icons/nav-inicio.png";
import navPokemon from "@/assets/icons/nav-pokemon.png";
import navMochila from "@/assets/icons/nav-mochila.png";
import navBatalha from "@/assets/icons/nav-batalha.png";
import navMelhorias from "@/assets/icons/nav-melhorias.png";
import navColecao from "@/assets/icons/nav-colecao.png";
import navLoja from "@/assets/icons/nav-loja.png";
import navWallet from "@/assets/icons/nav-wallet.png";
import navMarket from "@/assets/icons/nav-market.png";
import { CashShopModal } from "@/components/CashShopModal";
import { BlackMiticEggSprite, BlackMiticEggHud, BlackMiticEggQuickIcon, BLACK_EGG_ITEM_ID, hasReadyEgg } from "@/components/BlackMiticEggPet";
import { grantEmeraldFor } from "@/lib/emerald";
import { AuthGate, loadIdentity, signOutRubyM } from "@/components/AuthGate";
import { supabase } from "@/integrations/supabase/client";
import { loadLatestValid, saveNow } from "@/lib/localSave";
import { toast } from "sonner";

export const Route = createFileRoute("/idle")({
  component: () => (
    <AuthGate>
      <IdleGame />
    </AuthGate>
  ),
});

function IdleGame() {
  return (
    <div style={{ padding: 20, color: 'white', background: '#1a1a2e', minHeight: '100vh' }}>
      <h1>Maintanance / Recovery Mode</h1>
      <p>The game file was corrupted due to excessive size. We are restoring functionality.</p>
      <button onClick={() => window.location.reload()}>Reload</button>
    </div>
  );
}
