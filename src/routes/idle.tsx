import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { FlaskConical, Sparkles } from "lucide-react";
import { ItemPixelIcon } from "@/components/ItemPixelIcon";
import type { LucideIcon } from "lucide-react";
import navInicio from "@/assets/icons/nav-inicio.png";
import navPokemon from "@/assets/icons/nav-pokemon.png";
import navMochila from "@/assets/icons/nav-mochila.png";
import navBatalha from "@/assets/icons/nav-batalha.png";
import navMelhorias from "@/assets/icons/nav-melhorias.png";
import navColecao from "@/assets/icons/nav-colecao.png";
import navLoja from "@/assets/icons/nav-loja.png";
import navWallet from "@/assets/icons/nav-wallet.png";
import navMarket from "@/assets/icons/nav-market.png";
import pokemonTabBg from "@/assets/pokemon-tab-bg.jpg";
import iconFragmentCrystal from "@/assets/icon-fragment-crystal.png.asset.json";
import iconWorldGlobe from "@/assets/icon-world-globe-v2.png.asset.json";
import iconCrystalBlue from "@/assets/icon-crystal-blue-diamond.png.asset.json";
import iconCashPackage from "@/assets/icon-cash-package.png.asset.json";
import eventBannerImg from "@/assets/event-banner.png.asset.json";
import trainerAvatarAsset from "@/assets/trainer-avatar.png.asset.json";
import bagBgGlowAsset from "@/assets/bag-bg-dark.jpg.asset.json";
import catAllAsset from "@/assets/cat2-all.png.asset.json";
import catBallsAsset from "@/assets/cat2-balls.png.asset.json";
import catPotionsAsset from "@/assets/cat2-potions.png.asset.json";
import catBooksAsset from "@/assets/cat2-books.png.asset.json";
import catEggsAsset from "@/assets/cat2-eggs.png.asset.json";
import catOtherAsset from "@/assets/cat2-other.png.asset.json";
import { CashShopModal } from "@/components/CashShopModal";
import { BlackMiticEggSprite, BlackMiticEggHud, BlackMiticEggQuickIcon, BLACK_EGG_ITEM_ID, hasReadyEgg } from "@/components/BlackMiticEggPet";
import { grantEmeraldFor } from "@/lib/emerald";

import chestClosedImg from "@/assets/icons/chest-closed.png";
import chestOpenImg from "@/assets/icons/chest-open.png";
import ballPokeImg from "@/assets/items/icon-pokeball.png";
import ballGreatImg from "@/assets/items/icon-greatball.png";
import ballUltraImg from "@/assets/items/icon-ultraball.png";
import potionNewImg from "@/assets/items/icon-potion.png";
import premiumBoxImg from "@/assets/items/icon-premium-box.png";
import chestEmeraldImg from "@/assets/chest-emerald.png";
import chestAmuletImg from "@/assets/items/icon-chest-amulet.png";
import bagIconImg from "@/assets/items/icon-bag.png";
import reviveIconImg from "@/assets/items/icon-revive.png";
import berryIconImg from "@/assets/items/icon-berry.png";
import keyIconImg from "@/assets/items/icon-key.png";
import fxSlashImg from "@/assets/items/fx-slash.png";
import fxGrassImg from "@/assets/fx/fx-grass.png";
import fxFireImg from "@/assets/fx/fx-fire.png";
import fxWaterImg from "@/assets/fx/fx-water.png";
import fxElectricImg from "@/assets/fx/fx-electric.png";
import fxPoisonImg from "@/assets/fx/fx-poison.png";
import fxPsychicImg from "@/assets/fx/fx-psychic.png";
import fxIceImg from "@/assets/fx/fx-ice.png";
import fxRockImg from "@/assets/fx/fx-rock.png";
import fxFightingImg from "@/assets/fx/fx-fighting.png";
import fxFlyingImg from "@/assets/fx/fx-flying.png";
import autoIconImg from "@/assets/items/icon-auto.png";
import bookAtkImg from "@/assets/icons/book-atk.png";
import bookDefImg from "@/assets/icons/book-def.png";
import bookExpImg from "@/assets/icons/book-exp.png";
import potionIconAsset from "@/assets/potion-icon.png.asset.json";
import houseLarImg from "@/assets/house-lar.png";
import houseLabImg from "@/assets/house-lab.png";
import walletHero from "@/assets/wallet-exchange.jpg";
import npcOakSprite from "@/assets/npc-oak.png";
import npcTraderAsset from "@/assets/npc-trader.png.asset.json";

import { AuthGate, loadIdentity, signOutRubyM, type LocalIdentity } from "@/components/AuthGate";
import { supabase } from "@/integrations/supabase/client";
import { assetUrl, assetUrlFromJson } from "@/lib/assetUrl";
import { loadLatestValid, saveNow } from "@/lib/localSave";
import { loadBattleScene, saveBattleScene, clearBattleScene } from "@/lib/battleScenePersist";
import { useServerSync, type LocalSnapshotForPush } from "@/hooks/useServerSync";
import { fetchCloudSave, getCloudSaveLastError, pushCloudSaveNow, scheduleCloudSync } from "@/lib/cloudSave";
import { fetchTopRanked, recordRankedScore, type RankedRow, submitOddishCaptures, fetchOddishTop, type OddishRankRow } from "@/lib/rankedApi";
import type { PetInstance, Species, Rarity } from "@/game/systems";
import { SPECIES_BASE, makePet, calcMaxHp } from "@/game/systems";
import { computeTeamSynergies, computePower } from "@/game/synergies";
import { rollTraits, TRAITS, TIER_COLOR } from "@/game/traits";
import { TraitIcon } from "@/components/TraitIcon";
import { SynergyPanel } from "@/components/SynergyPanel";
import { PokemonStatsCard } from "@/components/PokemonStatsCard";
import { PokemonMarketPanel } from "@/components/PokemonMarketPanel";
import trainerSheet from "@/assets/trainer.png";
import skinPedroAsset from "@/assets/skins/pedro.webp.asset.json";
import skinPhoneAsset from "@/assets/skins/phone.webp.asset.json";
import skinGokuAsset from "@/assets/skins/goku.webp.asset.json";
import virizionAsset from "@/assets/legends/virizion.gif.asset.json";
import raikouAsset from "@/assets/legends/raikou.gif.asset.json";
import suicuneAsset from "@/assets/legends/suicune.gif.asset.json";
import suicuneShinyAsset from "@/assets/legends/suicune-shiny.gif.asset.json";
import luxrayFAsset from "@/assets/legends/luxray-f.gif.asset.json";

const SKINS: { id: string; label: string; url: string | null }[] = [
  { id: "default", label: "Treinador Clássico", url: null },
  { id: "pedro", label: "Pedro Dancer", url: assetUrlFromJson(skinPedroAsset) },
  { id: "phone", label: "Phone 036", url: assetUrlFromJson(skinPhoneAsset) },
  { id: "goku", label: "Goku", url: assetUrlFromJson(skinGokuAsset) },
];

// ... rest of the file content ...
