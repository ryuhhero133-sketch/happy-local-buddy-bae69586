// VEJA OQ TQA ACONTECENDO E SE O PAINEL DE ADDM, JA ESTA OK, POARA PODER EDITAR OS TREINADOR, NIVEL ETC, NIVEL DE POKEMON. ETC - V22 - SEASON_MAINTENANCE_LOGOUT

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { FlaskConical, Sparkles, ShieldCheck, X, Search, Settings, Map as MapIcon, Info, User, ShoppingBag, CreditCard, LayoutGrid, Heart, Star, Gift, Clock, Backpack, Store, Wallet, BookOpen, ChevronRight, ChevronDown, Plus, HelpCircle, Mail, Sword, Zap, Shield, TrendingUp, ArrowRight } from "lucide-react";
import { obfuscate, deobfuscate } from "@/lib/utils";




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
import iconFragmentCrystal from "@/assets/icon-cristal-prisma.png.asset.json";
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
import buffOrbXpImg from "@/assets/buff-orb-xp.png";
import buffIncenseHoneyImg from "@/assets/buff-incense-honey.png";
import buffTeamOrbImg from "@/assets/buff-team-orb.png";
import orb24hImg from "@/assets/orb-24h.png";
import incense24hImg from "@/assets/incense-24h.png";
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
import houseBankImg from "@/assets/house-bank.png";
import houseGymImg from "@/assets/house-gym.png";
import mapValeFragmentosImg from "@/assets/map-vale-fragmentos.jpg";
import mapValeDouradoImg from "@/assets/map-vale-dourado.jpg";
// 🏰 Ginásio Medieval — 3 andares endgame (arte enviada pelo dono do projeto)
import mapGymCarmesimAsset from "@/assets/gym-carmesim.png.asset.json";
import mapGymGeloSombraAsset from "@/assets/gym-gelo-sombra.png.asset.json";
import mapGymArcanoAsset from "@/assets/gym-arcano.png.asset.json";
import walletHero from "@/assets/wallet-exchange.jpg";
import npcOakSprite from "@/assets/npc-oak.png";
import npcTraderAsset from "@/assets/npc-trader.png.asset.json";

import npcAnciaoGlacialAsset from "@/assets/npc-anciao-glacial.png.asset.json";

import { AuthGate, loadIdentity, signOutRubyM, type LocalIdentity } from "@/components/AuthGate";
import { supabase } from "@/integrations/supabase/client";
import { assetUrl, assetUrlFromJson } from "@/lib/assetUrl";
import { loadLatestValid, saveNow } from "@/lib/localSave";
import { loadBattleScene, saveBattleScene, clearBattleScene } from "@/lib/battleScenePersist";
import { useServerSync, type LocalSnapshotForPush } from "@/hooks/useServerSync";
import { toast } from "sonner";
import { attemptPendingCloudSave, fetchCloudSaveResult, getBestLocalSnapshot, getCloudSaveDiagnostics, getCloudSaveLastError, getPendingCloudSaveInfo, pushCloudSaveNow, scheduleCloudSync, setCloudSaveLock, writeLocalBackup } from "@/lib/cloudSave";
import { FarmingReportFloating } from "@/components/FarmingReportFloating";
import { fetchTopRanked, fetchTopPrismaRanked, recordRankedScore, type RankedRow, submitOddishCaptures, fetchOddishTop, type OddishRankRow } from "@/lib/rankedApi";
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
const SKIN_KEY = "rubym.skin.v1";
import bgmAsset from "@/assets/audio/bgm.mp3.asset.json";
import sfxLevelUpAsset from "@/assets/audio/level-up-new.mp3.asset.json";
import sfxClickAsset from "@/assets/audio/click.mp3.asset.json";
import sfxBonusAsset from "@/assets/audio/bonus.mp3.asset.json";
import sfxChestOpenAsset from "@/assets/audio/chest-open.mp3.asset.json";
import eggTransitusAsset from "@/assets/egg-transitus.mp3.asset.json";

// Sprite constants (mesmo layout do modo Explorar)
const DIR_ROW = { down: 0, left: 1, right: 2, up: 3 } as const;
type Dir = keyof typeof DIR_ROW;

// ============ assets ============
import idleArenaAsset from "@/assets/idle-arena.jpg.asset.json";
import trophyIconAsset from "@/assets/trophy-icon.png.asset.json";
import rankMedalsRubyAsset from "@/assets/rank-medals-ruby.png.asset.json";
import chestGrassImg from "@/assets/chest-grass.png";
import chestFireImg from "@/assets/chest-fire.png";
import chestWaterImg from "@/assets/chest-water.png";
import chestElectricImg from "@/assets/chest-electric.png";
import chestDarkImg from "@/assets/chest-dark.png";
import chestDragonImg from "@/assets/chest-dragon.png";
const STONE_CHEST: Record<string, string> = {
  stone_grass: chestGrassImg, stone_fire: chestFireImg, stone_water: chestWaterImg,
  stone_electric: chestElectricImg, stone_dark: chestDarkImg, stone_dragon: chestDragonImg,
};
const STONE_PACK_SIZE = 20;
const isStoneId = (id: string) => id.startsWith("stone_") && id !== "stone_pack_all";

import mapSnowAsset from "@/assets/map-snow-valley.png.asset.json";
import mapDesertAsset from "@/assets/map-desert.png.asset.json";
import mapCaveAsset from "@/assets/map-cave1.png.asset.json";
import mapStoneAsset from "@/assets/map-stone.jpg.asset.json";
import mapTerraAsset from "@/assets/map-terra-hornet.jpg.asset.json";
import mapDesertoPurpuraAsset from "@/assets/map-deserto-purpura.jpg.asset.json";
import mapTerryAsset from "@/assets/map-terry.png.asset.json";
import mapN2Asset from "@/assets/map-n2.png.asset.json";
import mapN3Asset from "@/assets/map-n3.png.asset.json";
import mapGelius1Asset from "@/assets/map-gelius-1.png.asset.json";
import mapGelius2Asset from "@/assets/map-gelius-2.png.asset.json";
import eventPenguinAsset from "@/assets/event-penguin-badge.png.asset.json";
import { currentGeliusInfo, isGeliusActive, getGeliusEntries, canEnterGelius, consumeGeliusEntry, GELIUS_CAPTURABLE, GELIUS_PHASE1_POOL, GELIUS_PHASE2_POOL } from "@/game/geliusEvent";
import hornetCocoonAsset from "@/assets/hornet-cocoon.png.asset.json";
import fireLakeAsset from "@/assets/fire-lake.png.asset.json";
import mapVenofogoOrangeAsset from "@/assets/map-lava-valley.jpg.asset.json";
import mapPantanoFogoAsset from "@/assets/map-pantano-fogo.png.asset.json";
import worldMapGlobeAsset from "@/assets/world-map-globe.jpg.asset.json";
import worldMapContinent2Asset from "@/assets/world-map-continent2.jpg.asset.json";
import mapFantasmaAsset from "@/assets/map-fantasma.jpg.asset.json";
import mapCadeiaAbAsset from "@/assets/map-cadeia-ab.png.asset.json";
import mapCadeiaAb1Asset from "@/assets/map-cadeia-ab1.png.asset.json";
import mapCadeiaF1Asset from "@/assets/map-cadeia-f1.png.asset.json";
import mapMythshinyEventAsset from "@/assets/map-mythshiny-event.png.asset.json";
import mapOddish1Asset from "@/assets/map-oddish-1.png.asset.json";
import mapGrassOddish2Asset from "@/assets/grass-oddish-2.png.asset.json";
import mapGrassOddish3Asset from "@/assets/grass-oddish-3.png.asset.json";
import mapOddish2Asset from "@/assets/map-oddish-2.png.asset.json";
import mapOddish3Url from "@/assets/map-oddish3.png";
import absolStartMapAsset from "@/assets/absol-start-map.png.asset.json";
import governanteHallMapAsset from "@/assets/governante-hall-map.png.asset.json";
import npcGovernanteAsset from "@/assets/npc-governante.png.asset.json";
import safiraVerdeAsset from "@/assets/icon-safira-verde.png.asset.json";
import oddishEventGifAsset from "@/assets/oddish-event.gif.asset.json";
import oddishShinyGifAsset from "@/assets/oddish-shiny.gif.asset.json";
import lickitungGifAsset from "@/assets/lickitung.gif.asset.json";
import lickitungShinyGifAsset from "@/assets/lickitung-shiny.gif.asset.json";
import mewtwoEventGifAsset from "@/assets/mewtwo-event.gif.asset.json";
import iceBallIconAsset from "@/assets/ice-pokeball-icon.png.asset.json";
import scrollTeleportAsset from "@/assets/scroll-teleport.png.asset.json";
import { ODDISH_EVENT, oddishEventStatus, oddishMapForCycle, ODDISH_EVENT_POOL, SAFIRA_VERDE_BY_RARITY, MEWTWO_EVENT_CHANCE, MEWTWO_MIN_BALLS, fmtMs as fmtOddishMs } from "@/game/oddishEvent";
// Novos mapas endgame Lv 200→500 (10 mapas, reutilizando bgs no mesmo padrão dos existentes)
import mapForestAsset from "@/assets/map-forest.png.asset.json";
import mapFlorestaSecretaAsset from "@/assets/map-floresta-secreta.png.asset.json";
import mapPedreiraCavernaAsset from "@/assets/map-pedreira-caverna.jpg.asset.json";
import mapRoute3Asset from "@/assets/map-route3.png.asset.json";
import mapForestCaveAsset from "@/assets/map-forest-cave.png.asset.json";
import mapPalletRouteAsset from "@/assets/map-pallet-route.png.asset.json";
import mapEliteRouteAsset from "@/assets/map-elite-route.png.asset.json";
import mapVictoryRoadAsset from "@/assets/map-victoryroad.png.asset.json";
import mapViridianAsset from "@/assets/map-viridian.png.asset.json";
import mapVenenoAsset from "@/assets/map-veneno.png.asset.json";
// Orbs de XP (sprites geradas) — item exclusivo (1 ativo), 1h de +XP
import orbXpMinorAsset from "@/assets/orb-xp-minor.png.asset.json";
import orbXpMajorAsset from "@/assets/orb-xp-major.png.asset.json";
import orbXpSupremeAsset from "@/assets/orb-xp-supreme.png.asset.json";
import orbXpTeamAsset from "@/assets/orb-xp-team.png.asset.json";
import orbIncubatorImg from "@/assets/orb-incubator.png";
import redLakeAsset from "@/assets/red-lake.png.asset.json";
import volcanoAsset from "@/assets/volcano.png.asset.json";
import mapBeachUrl from "@/assets/map-beach-idle.png";
import collectIconImg from "@/assets/icons/collect-icon.png";
import rubyGemAsset from "@/assets/ruby-gem.png.asset.json";
import crystalRedAsset from "@/assets/items/icon-crystal-red.png.asset.json";
const crystalRedImg = assetUrlFromJson(crystalRedAsset);
import redShardImg from "@/assets/icon-fragmento-vermelho.png";
import { recordIpLog, fetchIpLogs, type IpLogRow } from "@/lib/ipLog";
const crystalGreenImg = assetUrlFromJson(iconCrystalBlue);
import treeOakAsset from "@/assets/tree-oak.png.asset.json";
import treePineAsset from "@/assets/tree-pine.png.asset.json";
import rockBoulderAsset from "@/assets/rock-boulder.png.asset.json";
import bushBerryAsset from "@/assets/bush-berry.png.asset.json";
import rockLavaAsset from "@/assets/rock-lava.png.asset.json";
import caveFloorAsset from "@/assets/cave-floor.jpg.asset.json";
import stalagmiteAsset from "@/assets/stalagmite.png.asset.json";
import caveCrystalAsset from "@/assets/cave-crystal.png.asset.json";

import crystalClusterAsset from "@/assets/crystal-cluster.png.asset.json";
const caveFloorUrl = assetUrlFromJson(caveFloorAsset);
const stalagmiteUrl = assetUrlFromJson(stalagmiteAsset);
const caveCrystalUrl = assetUrlFromJson(caveCrystalAsset);

const crystalClusterUrl = assetUrlFromJson(crystalClusterAsset);

// Pokemon GIFs (reusa os que já existem no projeto)
import charizardGif from "@/assets/charizard.gif";
import pikachuGif from "@/assets/pikachu.gif";
import dragoniteGif from "@/assets/dragonite.gif";
import bulbasaurGif from "@/assets/bulbasaur.gif";
import charmanderGif from "@/assets/charmander.gif";
import squirtleGif from "@/assets/squirtle.gif";
import rattataFAsset from "@/assets/rattata-f.gif.asset.json";
import pidgeyGif from "@/assets/pidgey.gif";
import beedrillGif from "@/assets/beedrill.gif";
import butterfreeGif from "@/assets/butterfree.gif";
import pinsirGif from "@/assets/pinsir.gif";
import golemGif from "@/assets/golem.gif";
import jolteonIdleAsset from "@/assets/jolteon.gif.asset.json";
import laprasIdleAsset from "@/assets/lapras.gif.asset.json";
import blazikenIdleAsset from "@/assets/blaziken.gif.asset.json";
const jolteonGif = assetUrlFromJson(jolteonIdleAsset);
const laprasGif = assetUrlFromJson(laprasIdleAsset);
const blazikenGif = assetUrlFromJson(blazikenIdleAsset);
import zubatAsset from "@/assets/zubat.gif.asset.json";
import ekansAsset from "@/assets/ekans.gif.asset.json";
import machopAsset from "@/assets/machop.gif.asset.json";
import diglettAsset from "@/assets/diglett.gif.asset.json";
import meowthAsset from "@/assets/meowth.gif.asset.json";
import psyduckAsset from "@/assets/psyduck.gif.asset.json";
import lucarioAuraAsset from "@/assets/lucario-aura.webp.asset.json";
import mewAuraAsset from "@/assets/mew-aura.webp.asset.json";
import rioluAsset from "@/assets/riolu.gif.asset.json";
import raichuAsset from "@/assets/raichu.gif.asset.json";
import rayquazaAsset from "@/assets/rayquaza.gif.asset.json";
import oddishAsset from "@/assets/oddish.gif.asset.json";
import bellsproutAsset from "@/assets/bellsprout.gif.asset.json";
import weedleAsset from "@/assets/weedle.gif.asset.json";
import kakunaAsset from "@/assets/kakuna.gif.asset.json";
import parasAsset from "@/assets/paras.gif.asset.json";
import parasectAsset from "@/assets/parasect.gif.asset.json";
import venonatAsset from "@/assets/venonat.gif.asset.json";
import clefairyAsset from "@/assets/clefairy.gif.asset.json";
import sandshrewAsset from "@/assets/sandshrew.gif.asset.json";
import mankeyAsset from "@/assets/mankey.gif.asset.json";
import poliwagAsset from "@/assets/poliwag.gif.asset.json";
import growlitheAsset from "@/assets/growlithe.gif.asset.json";
import abraAsset from "@/assets/abra.gif.asset.json";
import cuboneAsset from "@/assets/cubone.gif.asset.json";
import magnemiteAsset from "@/assets/magnemite.gif.asset.json";
import nidoranFAsset from "@/assets/nidoran-f.gif.asset.json";
import snorlaxAsset from "@/assets/snorlax.gif.asset.json";
import gloomAsset from "@/assets/gloom.gif.asset.json";
import caterpieGif from "@/assets/caterpie.gif";
import metapodGif from "@/assets/metapod.gif";
import vulpixGif from "@/assets/vulpix.gif";
import pidgeottoAsset from "@/assets/pidgeotto.gif.asset.json";
import raticateFAsset from "@/assets/raticate-f.gif.asset.json";
import fearowAsset from "@/assets/fearow.gif.asset.json";
import blastoiseAsset from "@/assets/blastoise.gif.asset.json";
import blastoiseShinyAsset from "@/assets/blastoise-shiny.gif.asset.json";
import deoxysAsset from "@/assets/deoxys-normal.gif.asset.json";
import groudonAsset from "@/assets/groudon.gif.asset.json";
import laprasShinyAsset from "@/assets/lapras-shiny.gif.asset.json";
import charizardShinyAsset from "@/assets/charizard-shiny.gif.asset.json";
import snorlaxMythicAsset from "@/assets/snorlax-mythic.gif.asset.json";
import darkraiAsset from "@/assets/darkrai.gif.asset.json";
import hoOhAsset from "@/assets/ho-oh.gif.asset.json";
import magmortarAsset from "@/assets/magmortar.gif.asset.json";
const pidgeottoUrl = assetUrlFromJson(pidgeottoAsset);
const raticateFUrl = assetUrlFromJson(raticateFAsset);
const fearowUrl = assetUrlFromJson(fearowAsset);
const blastoiseUrl = assetUrlFromJson(blastoiseAsset);
const blastoiseShinyUrl = assetUrlFromJson(blastoiseShinyAsset);
const deoxysUrl = assetUrlFromJson(deoxysAsset);
const groudonUrl = assetUrlFromJson(groudonAsset);
const laprasShinyUrl = assetUrlFromJson(laprasShinyAsset);
const charizardShinyUrl = assetUrlFromJson(charizardShinyAsset);
const snorlaxMythicUrl = assetUrlFromJson(snorlaxMythicAsset);
const darkraiUrl = assetUrlFromJson(darkraiAsset);
import { AdminDashboard } from "@/components/admin/AdminDashboard";
const hoOhUrl = assetUrlFromJson(hoOhAsset);
const magmortarUrl = assetUrlFromJson(magmortarAsset);
import lugiaAsset from "@/assets/lugia.gif.asset.json";
import hariyamaAsset from "@/assets/hariyama.gif.asset.json";
import ursaringAsset from "@/assets/ursaring.gif.asset.json";
import moltresAsset from "@/assets/moltres.gif.asset.json";
import zapdosAsset from "@/assets/zapdos.gif.asset.json";
import articunoAsset from "@/assets/articuno.gif.asset.json";
import dittoAsset from "@/assets/ditto.gif.asset.json";
import electabuzzAsset from "@/assets/electabuzz.gif.asset.json";
import gengarAsset from "@/assets/gengar.gif.asset.json";
import hitmontopAsset from "@/assets/hitmontop.gif.asset.json";
import magnetonAsset from "@/assets/magneton.gif.asset.json";
import dittoShinyAsset from "@/assets/ditto-shiny.gif.asset.json";
import scizorAsset from "@/assets/scizor.gif.asset.json";
import umbreonAsset from "@/assets/umbreon.gif.asset.json";
import infernapeAsset from "@/assets/infernape.gif.asset.json";
import krookodileAsset from "@/assets/krookodile.gif.asset.json";
import tyranitarAsset from "@/assets/tyranitar.gif.asset.json";
import nidokingShinyAsset from "@/assets/nidoking-shiny.gif.asset.json";
import dialgaAsset from "@/assets/dialga.gif.asset.json";
import rapidashAsset from "@/assets/rapidash.gif.asset.json";
import rapidashShinyAsset from "@/assets/rapidash-shiny.gif.asset.json";
import skarmoryAsset from "@/assets/skarmory.gif.asset.json";
const lugiaUrl = assetUrlFromJson(lugiaAsset);
const hariyamaUrl = assetUrlFromJson(hariyamaAsset);
const ursaringUrl = assetUrlFromJson(ursaringAsset);
const dittoUrl = assetUrlFromJson(dittoAsset);
const electabuzzUrl = assetUrlFromJson(electabuzzAsset);
const gengarUrl = assetUrlFromJson(gengarAsset);
const hitmontopUrl = assetUrlFromJson(hitmontopAsset);
const magnetonUrl = assetUrlFromJson(magnetonAsset);
const dittoShinyUrl = assetUrlFromJson(dittoShinyAsset);
const scizorUrl = assetUrlFromJson(scizorAsset);
const umbreonUrl = assetUrlFromJson(umbreonAsset);
const infernapeUrl = assetUrlFromJson(infernapeAsset);
const krookodileUrl = assetUrlFromJson(krookodileAsset);
const tyranitarUrl = assetUrlFromJson(tyranitarAsset);
const nidokingShinyUrl = assetUrlFromJson(nidokingShinyAsset);
const dialgaUrl = assetUrlFromJson(dialgaAsset);
const rapidashUrl = assetUrlFromJson(rapidashAsset);
const rapidashShinyUrl = assetUrlFromJson(rapidashShinyAsset);
const skarmoryUrl = assetUrlFromJson(skarmoryAsset);
const moltresUrl = assetUrlFromJson(moltresAsset);
const zapdosUrl = assetUrlFromJson(zapdosAsset);
const articunoUrl = assetUrlFromJson(articunoAsset);
// ═══ MTC — Míticos Brilhantes ═══
import abomasnowGif from "@/assets/abomasnow.gif";
import cloysterGif from "@/assets/cloyster.gif";
import cloysterShinyGif from "@/assets/cloyster-shiny.gif";
import exeggutorGif from "@/assets/exeggutor.gif";
import exeggutorShinyGif from "@/assets/exeggutor-shiny.gif";
import feraligatrGif from "@/assets/feraligatr.gif";
import heracrossGif from "@/assets/heracross.gif";
import heracrossShinyGif from "@/assets/heracross-shiny.gif";
import hitmonchanShinyGif from "@/assets/hitmonchan-shiny.gif";
import kangaskhanGif from "@/assets/kangaskhan.gif";
import meganiumGif from "@/assets/meganium.gif";
import meganiumShinyGif from "@/assets/meganium-shiny.gif";
import moltresShinyGif from "@/assets/moltres-shiny.gif";
import onixShinyGif from "@/assets/onix-shiny.gif";




const IDLE_KEY = "rubym.idle.v1";
const CLOUD_PRELOADED_KEY = "rubym.cloud.preloaded.v1";
const MP_SESSION_KEY = "rubym.multiplayer.session.v1";
const OFFLINE_CAP_MS = 8 * 60 * 60 * 1000;
const idleArenaUrl = assetUrlFromJson(idleArenaAsset);

const mapSnowUrl = assetUrlFromJson(mapSnowAsset);
const mapDesertUrl = assetUrlFromJson(mapDesertAsset);
const mapCaveUrl = assetUrlFromJson(mapCaveAsset);
const mapStoneUrl = assetUrlFromJson(mapStoneAsset);
const mapTerraUrl = assetUrlFromJson(mapTerraAsset);
const mapDesertoPurpuraUrl = assetUrlFromJson(mapDesertoPurpuraAsset);
const mapTerryUrl = assetUrlFromJson(mapTerryAsset);
const mapN2Url = assetUrlFromJson(mapN2Asset);
const mapN3Url = assetUrlFromJson(mapN3Asset);
const hornetCocoonUrl = assetUrlFromJson(hornetCocoonAsset);
const fireLakeUrl = assetUrlFromJson(fireLakeAsset);
const mapVenofogoOrangeUrl = assetUrlFromJson(mapVenofogoOrangeAsset);
const mapPantanoFogoUrl = assetUrlFromJson(mapPantanoFogoAsset);
const mapFantasmaUrl = assetUrlFromJson(mapFantasmaAsset);
const mapCadeiaAbUrl = assetUrlFromJson(mapCadeiaAbAsset);
const mapCadeiaAb1Url = assetUrlFromJson(mapCadeiaAb1Asset);
const mapCadeiaF1Url = assetUrlFromJson(mapCadeiaF1Asset);
const mapMythshinyEventUrl = assetUrlFromJson(mapMythshinyEventAsset);
const iceBallIconUrl = assetUrlFromJson(iceBallIconAsset);
const scrollTeleportUrl = assetUrlFromJson(scrollTeleportAsset);
// URLs dos 10 novos mapas endgame
const mapForestUrl = assetUrlFromJson(mapForestAsset);
const mapFlorestaSecretaUrl = assetUrlFromJson(mapFlorestaSecretaAsset);
const mapPedreiraCavernaUrl = assetUrlFromJson(mapPedreiraCavernaAsset);
const mapRoute3Url = assetUrlFromJson(mapRoute3Asset);
const mapForestCaveUrl = assetUrlFromJson(mapForestCaveAsset);
const mapPalletRouteUrl = assetUrlFromJson(mapPalletRouteAsset);
const mapEliteRouteUrl = assetUrlFromJson(mapEliteRouteAsset);
const mapVictoryRoadUrl = assetUrlFromJson(mapVictoryRoadAsset);
const mapViridianUrl = assetUrlFromJson(mapViridianAsset);
const mapVenenoUrl = assetUrlFromJson(mapVenenoAsset);
const bagBgGlowUrl = assetUrlFromJson(bagBgGlowAsset);
const catAllUrl = assetUrlFromJson(catAllAsset);
const catBallsUrl = assetUrlFromJson(catBallsAsset);
const catPotionsUrl = assetUrlFromJson(catPotionsAsset);
const catBooksUrl = assetUrlFromJson(catBooksAsset);
const catEggsUrl = assetUrlFromJson(catEggsAsset);
const catOtherUrl = assetUrlFromJson(catOtherAsset);
// URLs dos orbs (sprites transparentes)
const orbXpMinorUrl = assetUrlFromJson(orbXpMinorAsset);
const orbXpMajorUrl = assetUrlFromJson(orbXpMajorAsset);
const orbXpSupremeUrl = assetUrlFromJson(orbXpSupremeAsset);
const orbXpTeamUrl = assetUrlFromJson(orbXpTeamAsset);
// Ícones "de buff" bonitos (HUD do treinador) — orb XP, incenso e orb de time
const buffOrbXpUrl = buffOrbXpImg;
const buffIncenseHoneyUrl = buffIncenseHoneyImg;
const buffTeamOrbUrl = buffTeamOrbImg;
const npcTraderUrl = assetUrlFromJson(npcTraderAsset);
const redLakeUrl = assetUrlFromJson(redLakeAsset);
const volcanoUrl = assetUrlFromJson(volcanoAsset);
const rubyGemUrl = assetUrlFromJson(rubyGemAsset);
const treeOakUrl = assetUrlFromJson(treeOakAsset);
const treePineUrl = assetUrlFromJson(treePineAsset);
const rockBoulderUrl = assetUrlFromJson(rockBoulderAsset);
const bushBerryUrl = assetUrlFromJson(bushBerryAsset);
const rockLavaUrl = assetUrlFromJson(rockLavaAsset);
const rattataFUrl = assetUrlFromJson(rattataFAsset);
const zubatUrl = assetUrlFromJson(zubatAsset);
const ekansUrl = assetUrlFromJson(ekansAsset);
const machopUrl = assetUrlFromJson(machopAsset);
const diglettUrl = assetUrlFromJson(diglettAsset);
const meowthUrl = assetUrlFromJson(meowthAsset);
const psyduckUrl = assetUrlFromJson(psyduckAsset);
const lucarioAuraUrl = assetUrlFromJson(lucarioAuraAsset);
const mewAuraUrl = assetUrlFromJson(mewAuraAsset);
const rioluUrl = assetUrlFromJson(rioluAsset);
const raichuUrl = assetUrlFromJson(raichuAsset);
const rayquazaUrl = assetUrlFromJson(rayquazaAsset);
const oddishUrl = assetUrlFromJson(oddishAsset);
const bellsproutUrl = assetUrlFromJson(bellsproutAsset);
const weedleUrl = assetUrlFromJson(weedleAsset);
const kakunaUrl = assetUrlFromJson(kakunaAsset);
const parasUrl = assetUrlFromJson(parasAsset);
const parasectUrl = assetUrlFromJson(parasectAsset);
const venonatUrl = assetUrlFromJson(venonatAsset);
const clefairyUrl = assetUrlFromJson(clefairyAsset);
const sandshrewUrl = assetUrlFromJson(sandshrewAsset);
const mankeyUrl = assetUrlFromJson(mankeyAsset);
const poliwagUrl = assetUrlFromJson(poliwagAsset);
const growlitheUrl = assetUrlFromJson(growlitheAsset);
const abraUrl = assetUrlFromJson(abraAsset);
const cuboneUrl = assetUrlFromJson(cuboneAsset);
const magnemiteUrl = assetUrlFromJson(magnemiteAsset);
const nidoranFUrl = assetUrlFromJson(nidoranFAsset);
const snorlaxUrl = assetUrlFromJson(snorlaxAsset);
const gloomUrl = assetUrlFromJson(gloomAsset);
const npcGovernanteUrl = assetUrlFromJson(npcGovernanteAsset);
const worldMapContinent2Url = assetUrlFromJson(worldMapContinent2Asset);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const gameDb = supabase as any;

const npcAnciaoGlacialUrl = assetUrlFromJson(npcAnciaoGlacialAsset);
const potionIconUrl = assetUrlFromJson(potionIconAsset);
const bgmUrl = assetUrlFromJson(bgmAsset);
const sfxLevelUpUrl = assetUrlFromJson(sfxLevelUpAsset);
const sfxClickUrl = assetUrlFromJson(sfxClickAsset);
const sfxBonusUrl = assetUrlFromJson(sfxBonusAsset);
const sfxChestOpenUrl = assetUrlFromJson(sfxChestOpenAsset);

type IdleMapId =
  | "arena" | "terra" | "deserto_purpura" | "terry" | "n2" | "n3" | "pantano_fogo" | "venofogo" | "praia" | "neve" | "deserto" | "caverna" | "fantasma"
  | "gelius1" | "gelius2"
  // Cadeia endgame
  | "vale_rochas" | "vale_planta" | "vale_gelo" | "vale_veneno" | "vale_fogo"
  | "vulcao_ativo" | "nucleo_primordial"
  // Cadeia Abissal
  | "abismo_gelo" | "abismo_veneno" | "abismo_raio" | "abismo_sombra" | "abismo_dragao"
  // Cadeia estendida
  | "cadeia_ab" | "cadeia_ab1" | "cadeia_f1"
  | "evento_myth"
  | "oddish_o1" | "oddish_o2" | "oddish_o3"
  | "grass_oddish"
  | "vale_fragmentos"
  | "gym_carmesim" | "gym_gelo_sombra" | "gym_arcano"
  | "absol_start" | "governante_hall"
  // ❄️ Santuário Glacial e Caminho Glacial (Season 3)
  | "santuario_glacial" | "caminho_glacial" | "vale_dourado";
// overlay: cor de recolorização aplicada por cima do bg (mix-blend: color)
// stars: dificuldade (1-8) exibida na UI
type IdleMapDef = {
  name: string; diff: string; bg: string; rate: number; minLevel: number; maxLevel?: number;
  element: string; stars?: number; overlay?: string;
  cycle?: { cycleMs: number; openMs: number };
  entryCrystals?: number;
  /** Mapa de RAID: níveis exibidos não indicam progressão de treinador, e sim faixa dos chefes/encontros. */
  raid?: boolean;
};
const IDLE_MAPS: Record<IdleMapId, IdleMapDef> = {
  arena:    { name: "Vale Verdejante",         diff: "Fácil",     bg: idleArenaUrl,    rate: 1.0, minLevel: 1,  maxLevel: 30, element: "Grama", stars: 1 },
  terra:    { name: "Ninho de Marimbondo",     diff: "Fácil+",    bg: mapTerraUrl,     rate: 1.2, minLevel: 10, maxLevel: 35, element: "Terra", stars: 1 },
  deserto_purpura: { name: "Areias de Anúbis", diff: "Médio",     bg: mapDesertoPurpuraUrl, rate: 1.8, minLevel: 20, maxLevel: 55, element: "Terra/Veneno", stars: 2, entryCrystals: 5 },
  terry:    { name: "Terras de Terry",         diff: "Elite",     bg: mapTerryUrl,     rate: 3.2, minLevel: 200, maxLevel: 400, element: "Terra", stars: 4, entryCrystals: 8 },
  n2:       { name: "Planície de Terry",        diff: "Elite+",    bg: mapN2Url,        rate: 3.8, minLevel: 350, maxLevel: 550, element: "Terra", stars: 5, entryCrystals: 20 },
  n3:       { name: "Confins de Terry",         diff: "Lendário",  bg: mapN3Url,        rate: 4.5, minLevel: 500, maxLevel: 700, element: "Terra", stars: 5, entryCrystals: 20 },
  pantano_fogo: { name: "Pântano em Chamas",   diff: "PRIMORDIAL",bg: mapPantanoFogoUrl,rate: 12.0, minLevel: 700, maxLevel: 1200, element: "Fogo/Veneno", stars: 8, entryCrystals: 400 },
  // ═══ CADEIA ABISSAL — Lv 1000 a 3000 (5 mapas recolorizados do Pântano) ═══
  abismo_gelo:   { name: "Abismo Gélido",      diff: "ABISSAL",   bg: mapPantanoFogoUrl, rate: 14.0, minLevel: 1000, maxLevel: 1500, element: "Gelo",     stars: 8, entryCrystals: 800,  overlay: "rgba(120,200,255,0.55)" },
  abismo_veneno: { name: "Abismo Tóxico",      diff: "ABISSAL+",  bg: mapPantanoFogoUrl, rate: 16.0, minLevel: 1400, maxLevel: 2000, element: "Veneno",   stars: 9, entryCrystals: 1200, overlay: "rgba(170,80,220,0.55)" },
  abismo_raio:   { name: "Abismo do Trovão",   diff: "APOCALIP.", bg: mapPantanoFogoUrl, rate: 18.0, minLevel: 1800, maxLevel: 2400, element: "Elétrico", stars: 9, entryCrystals: 1600, overlay: "rgba(255,220,80,0.50)" },
  abismo_sombra: { name: "Abismo Sombrio",     diff: "APOCALIP.", bg: mapPantanoFogoUrl, rate: 20.0, minLevel: 2200, maxLevel: 2700, element: "Sombra",   stars: 10, entryCrystals: 2200, overlay: "rgba(40,20,60,0.65)" },
  abismo_dragao: { name: "Abismo do Dragão",   diff: "ABSOLUTO",  bg: mapPantanoFogoUrl, rate: 22.0, minLevel: 2500, maxLevel: 3000, element: "Dragão",   stars: 10, entryCrystals: 3000, overlay: "rgba(255,150,40,0.55)" },
  // ═══ CADEIA ESTENDIDA — continuação após Abismo do Dragão (3000→6000) ═══
  cadeia_ab:  { name: "Fenda Estelar",          diff: "TRANSC.",   bg: mapCadeiaAbUrl,  rate: 26.0, minLevel: 3000, maxLevel: 3500, element: "Estelar", stars: 10, entryCrystals: 4000 },
  cadeia_ab1: { name: "Cripta Etérea",          diff: "TRANSC.+",  bg: mapCadeiaAb1Url, rate: 30.0, minLevel: 3500, maxLevel: 5000, element: "Etéreo",  stars: 10, entryCrystals: 6000 },
  cadeia_f1:  { name: "Chamas do Fim",          diff: "COSMICO",   bg: mapCadeiaF1Url,  rate: 34.0, minLevel: 4000, maxLevel: 6000, element: "Fogo/Cosmico", stars: 10, entryCrystals: 8000 },
  // ═══ EVENTO MÍTICO SHINY — abre 5min a cada 1h ═══
  evento_myth: { name: "Domínio Mítico Shiny",  diff: "EVENTO",    bg: mapMythshinyEventUrl, rate: 40.0, minLevel: 1, maxLevel: 9999, element: "Todos", stars: 10 },
  praia:    { name: "Praia Coral",             diff: "Fácil+",    bg: mapBeachUrl,     rate: 1.3, minLevel: 15, maxLevel: 40, element: "Água", stars: 1 },
  venofogo: { name: "Pântano Ardente",         diff: "Difícil",   bg: mapVenofogoOrangeUrl, rate: 1.8, minLevel: 25, maxLevel: 120, element: "Veneno/Fogo", stars: 2 },

  neve:     { name: "Vale Verdejante de Neve", diff: "Médio",     bg: mapSnowUrl,      rate: 1.6, minLevel: 40, maxLevel: 65, element: "Gelo", stars: 2 },
  deserto:  { name: "Deserto Escaldante",      diff: "Médio+",    bg: mapDesertUrl,    rate: 2.0, minLevel: 50, maxLevel: 75, element: "Fogo", stars: 2 },
  caverna:  { name: "Caverna Rochosa",         diff: "Extremo",   bg: mapCaveUrl,      rate: 3.5, minLevel: 60, maxLevel: 90, element: "Pedra", stars: 3,
              cycle: { cycleMs: 2.5 * 60 * 60 * 1000, openMs: 30 * 60 * 1000 } },
  fantasma: { name: "Cemitério Assombrado",    diff: "RAID",      bg: mapFantasmaUrl,  rate: 4.0, minLevel: 1,  maxLevel: 9999, element: "Fantasma", stars: 4, raid: true },
  // ═══ ENDGAME — cadeia progressiva, portal visível mas exige nível de treinador ═══
  vale_rochas:       { name: "Vale das Rochas",   diff: "Lendário",   bg: mapPedreiraCavernaUrl, rate: 6.0, minLevel: 50,  maxLevel: 150, element: "Pedra",  stars: 4 },
  vale_planta:       { name: "Vale Esmeralda",    diff: "Lendário+",  bg: mapPedreiraCavernaUrl, rate: 6.5, minLevel: 120, maxLevel: 220, element: "Planta", stars: 5, overlay: "rgba(70,210,90,0.42)" },
  vale_gelo:         { name: "Vale Gélido",       diff: "Mítico",     bg: mapPedreiraCavernaUrl, rate: 7.0, minLevel: 190, maxLevel: 290, element: "Gelo",   stars: 6, overlay: "rgba(140,220,255,0.45)" },
  vale_veneno:       { name: "Vale Tóxico",       diff: "Mítico+",    bg: mapPedreiraCavernaUrl, rate: 7.5, minLevel: 260, maxLevel: 360, element: "Veneno", stars: 7, overlay: "rgba(180,90,220,0.48)" },
  vale_fogo:         { name: "Vale Ígneo",        diff: "Mítico+",    bg: mapPedreiraCavernaUrl, rate: 8.0, minLevel: 330, maxLevel: 420, element: "Fogo",   stars: 7, overlay: "rgba(255,95,45,0.45)" },
  vulcao_ativo:      { name: "Vulcão Ativo",      diff: "PRIMORDIAL", bg: mapVictoryRoadUrl,     rate: 9.0, minLevel: 400, maxLevel: 470, element: "Fogo",   stars: 8 },
  nucleo_primordial: { name: "Núcleo Primordial", diff: "PRIMORDIAL", bg: mapVenenoUrl,          rate: 10.0, minLevel: 460, maxLevel: 500, element: "Misto", stars: 8 },
  // ═══ EVENTO GELIUS (a cada 2h, 10min de duração, troca de fase aos 5min) ═══
  gelius1: { name: "Gelius — Onda 1", diff: "EVENTO", bg: assetUrlFromJson(mapGelius1Asset), rate: 5.0, minLevel: 1,   maxLevel: 200,  element: "Gelo/Evento", stars: 5 },
  gelius2: { name: "Gelius — Onda 2", diff: "EVENTO", bg: assetUrlFromJson(mapGelius2Asset), rate: 7.0, minLevel: 400, maxLevel: 1000, element: "Gelo/Evento", stars: 8 },
  // ═══ EVENTO ODDISH ODYSSEY — 48h, abre 30min a cada 2h ═══
  oddish_o1: { name: "Odisséia Oddish — Bosque",   diff: "EVENTO", bg: assetUrlFromJson(mapOddish1Asset), rate: 8.0, minLevel: 1, maxLevel: 9999, element: "Planta/Caos", stars: 6 },
  oddish_o2: { name: "Odisséia Oddish — Clareira", diff: "EVENTO", bg: assetUrlFromJson(mapOddish2Asset), rate: 8.0, minLevel: 1, maxLevel: 9999, element: "Planta/Caos", stars: 6 },
  oddish_o3: { name: "Odisséia Oddish — Caverna Sombria", diff: "EVENTO", bg: mapOddish3Url, rate: 9.0, minLevel: 1, maxLevel: 9999, element: "Fantasma/Caos", stars: 7 },
  grass_oddish: { name: "🌿 Grass Oddish", diff: "EVENTO", bg: assetUrlFromJson(mapOddish1Asset), rate: 8.0, minLevel: 1, maxLevel: 9999, element: "Planta", stars: 6, overlay: "rgba(120,255,140,0.18)" },
  vale_fragmentos: { name: "🔻 Vale dos Fragmentos Vermelhos", diff: "EVENTO", bg: mapValeFragmentosImg, rate: 9.0, minLevel: 1, maxLevel: 9999, element: "Cristal", stars: 7, overlay: "rgba(255,60,60,0.14)" },
  // ═══ 🏰 GINÁSIO MEDIEVAL — 3 andares de endgame ═══
  gym_carmesim:    { name: "🏰 Ginásio — Salão Carmesim",  diff: "GINÁSIO",   bg: assetUrlFromJson(mapGymCarmesimAsset),  rate: 24.0, minLevel: 1, maxLevel: 9999, element: "Cristal/Pedra", stars: 9 },
  gym_gelo_sombra: { name: "🏰 Ginásio — Véu Gélido",      diff: "GINÁSIO+",  bg: assetUrlFromJson(mapGymGeloSombraAsset), rate: 30.0, minLevel: 1, maxLevel: 9999, element: "Gelo/Sombra",   stars: 10 },
  gym_arcano:      { name: "🏰 Ginásio — Santuário Arcano", diff: "BLACK MYTHIC", bg: assetUrlFromJson(mapGymArcanoAsset), rate: 38.0, minLevel: 1, maxLevel: 9999, element: "Arcano",        stars: 10, overlay: "rgba(120,60,200,0.10)" },
  absol_start:      { name: "Continente do Governante — Absol", diff: "LENDÁRIO", bg: assetUrlFromJson(absolStartMapAsset),      rate: 4.0, minLevel: 1, maxLevel: 9999, element: "Sombrio/Lendário", stars: 8 },
  governante_hall:  { name: "Salão do Governante",              diff: "LENDÁRIO", bg: assetUrlFromJson(governanteHallMapAsset),  rate: 3.0, minLevel: 1, maxLevel: 9999, element: "Lendário",         stars: 9 },
  santuario_glacial: { name: "Santuário Glacial", diff: "SEGURO", bg: mapSnowUrl, rate: 1.0, minLevel: 1, maxLevel: 9999, element: "Gelo", stars: 10, overlay: "rgba(200,230,255,0.3)" },
  vale_dourado:      { name: "Vale Dourado", diff: "NOVA JORNADA", bg: mapValeDouradoImg, rate: 1.5, minLevel: 1, maxLevel: 50, element: "Grama", stars: 1, overlay: "rgba(255,215,120,0.12)" },
  caminho_glacial:   { name: "Caminho Glacial",   diff: "NOVA JORNADA", bg: mapSnowUrl, rate: 1.5, minLevel: 1, maxLevel: 50, element: "Gelo", stars: 1, overlay: "rgba(180,210,255,0.2)" },
};

type WorldPortalDef = { key: string; from: IdleMapId; to: IdleMapId; x: number; y: number; arriveX: number; arriveY: number; color: string; label: string; reqLevel?: number };
// Cadeia endgame — portais visíveis em todos os mapas, mas exigem nível de treinador para atravessar
const ENDGAME_CHAIN: Array<{ from: IdleMapId; to: IdleMapId; req: number; color: string }> = [
  { from: "terra",             to: "vale_rochas",       req: 40,  color: "#c9a76a" },
  { from: "vale_rochas",       to: "vale_planta",       req: 110, color: "#4ade80" },
  { from: "vale_planta",       to: "vale_gelo",         req: 180, color: "#c9b8ff" },
  { from: "vale_gelo",         to: "vale_veneno",       req: 250, color: "#c084fc" },
  { from: "vale_veneno",       to: "vale_fogo",         req: 320, color: "#fb923c" },
  { from: "vale_fogo",         to: "vulcao_ativo",      req: 390, color: "#ef4444" },
  { from: "vulcao_ativo",      to: "nucleo_primordial", req: 460, color: "#f0abfc" },
];
const WORLD_PORTALS: WorldPortalDef[] = ENDGAME_CHAIN.flatMap((c) => {
  const toName = IDLE_MAPS[c.to].name;
  const fromName = IDLE_MAPS[c.from].name;
  return [
    { key: `${c.from}->${c.to}`, from: c.from, to: c.to, x: 1720, y: 260, arriveX: 220, arriveY: 1660, color: c.color, label: toName, reqLevel: c.req },
    { key: `${c.to}->${c.from}`, from: c.to, to: c.from, x: 200, y: 1660, arriveX: 1700, arriveY: 260, color: "#94a3b8", label: `↩ ${fromName}` },
  ];
});

// Retorna se a caverna está atualmente aberta e ms para o próximo evento (abrir/fechar)
function caveWindow(now: number = Date.now()): { open: boolean; msUntilChange: number } {
  const c = IDLE_MAPS.caverna.cycle!;
  const t = now % c.cycleMs;
  if (t < c.openMs) return { open: true, msUntilChange: c.openMs - t };
  return { open: false, msUntilChange: c.cycleMs - t };
}

// Evento Mítico Shiny — abre 5 minutos a cada 1 hora.
function mythEventInfo(now: number = Date.now()): { open: boolean; msUntilChange: number } {
  const CYCLE = 60 * 60 * 1000;
  const OPEN = 5 * 60 * 1000;
  const t = now % CYCLE;
  if (t < OPEN) return { open: true, msUntilChange: OPEN - t };
  return { open: false, msUntilChange: CYCLE - t };
}

const GIF: Partial<Record<Species, string>> = {
  charizard: charizardGif, pikachu: pikachuGif,
  dragonite: dragoniteGif,
  bulbasaur: bulbasaurGif, charmander: charmanderGif, squirtle: squirtleGif,
  rattata_f: rattataFUrl, pidgey: pidgeyGif, zubat: zubatUrl,
  ekans: ekansUrl, machop: machopUrl, diglett: diglettUrl,
  meowth: meowthUrl, psyduck: psyduckUrl,
  lucario: lucarioAuraUrl, mew: mewAuraUrl,
  beedrill: beedrillGif, butterfree: butterfreeGif,
  pinsir: pinsirGif, golem: golemGif, jolteon: jolteonGif, lapras: laprasGif,
  blaziken: blazikenGif,
  virizion: assetUrlFromJson(virizionAsset), raikou: assetUrlFromJson(raikouAsset),
  suicune: assetUrlFromJson(suicuneAsset), suicune_shiny: assetUrlFromJson(suicuneShinyAsset),
  luxray_f: assetUrlFromJson(luxrayFAsset),
  oddish: oddishUrl, bellsprout: bellsproutUrl, weedle: weedleUrl, kakuna: kakunaUrl,
  caterpie: caterpieGif, metapod: metapodGif, vulpix: vulpixGif,
  paras: parasUrl, parasect: parasectUrl, venonat: venonatUrl, gloom: gloomUrl,
  clefairy: clefairyUrl, sandshrew: sandshrewUrl, mankey: mankeyUrl,
  poliwag: poliwagUrl, growlithe: growlitheUrl, abra: abraUrl,
  cubone: cuboneUrl, magnemite: magnemiteUrl, nidoran_f: nidoranFUrl, snorlax: snorlaxUrl,
  pidgeotto: pidgeottoUrl, raticate_f: raticateFUrl, fearow: fearowUrl,
  blastoise: blastoiseUrl, blastoise_shiny: blastoiseShinyUrl,
  deoxys: deoxysUrl, groudon: groudonUrl, lapras_shiny: laprasShinyUrl, snorlax_mythic: snorlaxMythicUrl, charizard_shiny: charizardShinyUrl,
  darkrai: darkraiUrl, ho_oh: hoOhUrl, magmortar: magmortarUrl,
  lugia: lugiaUrl, hariyama: hariyamaUrl, ursaring: ursaringUrl,
  ditto: dittoUrl, electabuzz: electabuzzUrl, gengar: gengarUrl, hitmontop: hitmontopUrl, magneton: magnetonUrl,
  ditto_shiny: dittoShinyUrl, scizor: scizorUrl, umbreon: umbreonUrl,
  infernape: infernapeUrl, krookodile: krookodileUrl, tyranitar: tyranitarUrl, nidoking_shiny: nidokingShinyUrl,
  dialga: dialgaUrl, rapidash: rapidashUrl, rapidash_shiny: rapidashShinyUrl, skarmory: skarmoryUrl,
  moltres: moltresUrl, zapdos: zapdosUrl, articuno: articunoUrl,
  abomasnow: abomasnowGif, cloyster: cloysterGif, cloyster_shiny: cloysterShinyGif,
  exeggutor: exeggutorGif, exeggutor_shiny: exeggutorShinyGif,
  feraligatr: feraligatrGif, heracross: heracrossGif, heracross_shiny: heracrossShinyGif,
  hitmonchan_shiny: hitmonchanShinyGif, kangaskhan: kangaskhanGif,
  meganium: meganiumGif, meganium_shiny: meganiumShinyGif,
  moltres_shiny: moltresShinyGif, onix_shiny: onixShinyGif,
  lickitung: assetUrlFromJson(lickitungGifAsset),
  lickitung_shiny: assetUrlFromJson(lickitungShinyGifAsset),
  mewtwo_event: assetUrlFromJson(mewtwoEventGifAsset),
  oddish_shiny: assetUrlFromJson(oddishShinyGifAsset),
  riolu: rioluUrl,
  raichu: raichuUrl,
  rayquaza: rayquazaUrl,
};



// Pokémons cujo sprite é uma spritesheet 4x4 (linhas = down/left/right/up, 4 frames de walk)
const SPRITE_SHEET: Partial<Record<Species, string>> = {
  lucario: lucarioAuraUrl,
  mew: mewAuraUrl,
};


const ENEMY_POOL: Species[] = ["rattata_f", "pidgey", "zubat", "ekans", "machop", "diglett", "meowth", "psyduck"];

// ============ Elemento por espécie (para FX de ataque) ============
type ElementFx = "grass" | "fire" | "water" | "electric" | "poison" | "psychic" | "ice" | "rock" | "fighting" | "flying" | "normal";
const SPECIES_ELEMENT: Partial<Record<Species, ElementFx>> = {
  // Grama/bicho
  bulbasaur: "grass", ivysaur: "grass", venusaur: "grass",
  oddish: "grass", gloom: "grass", vileplume: "grass",
  bellsprout: "grass", weepinbell: "grass", victreebel: "grass",
  paras: "grass", parasect: "grass",
  caterpie: "grass", metapod: "grass", butterfree: "flying",
  virizion: "grass",
  // Fogo
  charmander: "fire", charmeleon: "fire", charizard: "fire",
  growlithe: "fire", arcanine: "fire", ninetales: "fire", vulpix: "fire",
  magmar: "fire", flareon: "fire", moltres: "fire", blaziken: "fire",
  // Água
  squirtle: "water", wartortle: "water", blastoise: "water", blastoise_shiny: "water",
  psyduck: "water", golduck: "water",
  poliwag: "water", poliwhirl: "water", poliwrath: "fighting",
  magikarp: "water", gyarados: "water", vaporeon: "water", lapras: "water",
  suicune: "water", suicune_shiny: "water",
  // Elétrico
  pikachu: "electric", raichu: "electric", magnemite: "electric",
  jolteon: "electric", zapdos: "electric", luxray_f: "electric", raikou: "electric",
  // Veneno / bicho venenoso
  weedle: "poison", kakuna: "poison", beedrill: "poison",
  ekans: "poison", arbok: "poison",
  zubat: "poison", golbat: "poison",
  nidoran_f: "poison", nidorina: "poison", nidoqueen: "poison", nidoking: "poison",
  venonat: "poison", venomoth: "poison",
  // Psíquico
  abra: "psychic", kadabra: "psychic", alakazam: "psychic",
  mew: "psychic", mewtwo: "psychic",
  // Gelo
  articuno: "ice", abomasnow: "ice", cloyster: "ice", cloyster_shiny: "ice",
  // Pedra / terra
  diglett: "rock", dugtrio: "rock",
  sandshrew: "rock", sandslash: "rock",
  cubone: "rock", marowak: "rock",
  golem: "rock", geodude: "rock", graveler: "rock",
  // Fighting
  machop: "fighting", machoke: "fighting", machamp: "fighting",
  mankey: "fighting", primeape: "fighting",
  lucario: "fighting", pinsir: "fighting", riolu: "fighting",
  // Flying
  pidgey: "flying", pidgeotto: "flying", pidgeot: "flying",
  fearow: "flying", spearow: "flying", rayquaza: "flying",
  // Normal
  rattata_f: "normal", raticate_f: "normal",
  meowth: "normal", persian: "normal",
  eevee: "normal", snorlax: "normal", snorlax_mythic: "normal",
  clefairy: "normal", clefable: "normal",
  // Mythic Roamers
  deoxys: "psychic", groudon: "fire", lapras_shiny: "water",
  darkrai: "psychic", ho_oh: "fire", magmortar: "fire",
  lugia: "psychic", hariyama: "fighting", ursaring: "normal",
  // Guardiões Anti-Paralisia
  ditto: "normal", electabuzz: "electric", magneton: "electric",
  gengar: "poison", hitmontop: "fighting",
  ditto_shiny: "normal", scizor: "fighting", umbreon: "psychic",
  // Apex bosses
  infernape: "fire", krookodile: "rock", tyranitar: "rock", nidoking_shiny: "poison",
  dialga: "psychic", rapidash: "fire", rapidash_shiny: "fire", skarmory: "flying",


} as Record<string, ElementFx>;


function elementOf(sp: Species): ElementFx {
  return SPECIES_ELEMENT[sp] ?? "normal";
}
const ELEMENT_FX_IMG: Record<ElementFx, string> = {
  grass: fxGrassImg, fire: fxFireImg, water: fxWaterImg, electric: fxElectricImg,
  poison: fxPoisonImg, psychic: fxPsychicImg, ice: fxIceImg, rock: fxRockImg,
  fighting: fxFightingImg, flying: fxFlyingImg, normal: fxSlashImg,
};
const ELEMENT_FX_GLOW: Record<ElementFx, string> = {
  grass: "#66e07a", fire: "#ff8a3d", water: "#4dc4ff", electric: "#ffe14d",
  poison: "#c56bff", psychic: "#ff8bd6", ice: "#8ee8ff", rock: "#c69466",
  fighting: "#ffd166", flying: "#cfe9ff", normal: "#ffb84d",
};

// ============ Obstáculos com colisão ============
type Obstacle = {
  id: number;
  x: number; y: number;      // posição da BASE (chão) no mundo
  w: number; h: number;      // tamanho renderizado em px
  src: string;
  blocks: boolean;           // só pedras bloqueiam; árvores ficam visuais/transparentes ao passar
  collideR: number;          // raio de colisão em px (a partir da base)
};
// Gera obstáculos espalhados de forma determinística (mesma disposição sempre)
function buildObstacles(worldW: number, worldH: number, mapId: IdleMapId = "arena"): Obstacle[] {
  // PRNG determinístico simples
  let seed = mapId === "terra" ? 98765 : mapId === "fantasma" ? 66613 : 12345;
  const rand = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };

  // Cemitério Assombrado (fantasma): mesma composição do Ninho de Marimbondo,
  // porém re-tematizado — lápides gigantes no lugar dos casulos, árvores mortas ao redor.
  if (mapId === "fantasma") {
    const kinds = [
      { src: treeOakUrl,     w: 110, h: 124, collideR: 0,  blocks: false },
      { src: rockBoulderUrl, w:  86, h:  76, collideR: 10, blocks: true  },
    ];
    const list: Obstacle[] = [];
    let id = 1;
    // 4 lápides/portais espirituais espalhados (mesmos slots dos casulos)
    const graveSpots: { x: number; y: number }[] = [
      { x: worldW * 0.28, y: worldH * 0.30 },
      { x: worldW * 0.72, y: worldH * 0.28 },
      { x: worldW * 0.30, y: worldH * 0.72 },
      { x: worldW * 0.74, y: worldH * 0.70 },
    ];
    for (const c of graveSpots) {
      list.push({ id: id++, x: c.x, y: c.y, w: 120, h: 140, src: rockBoulderUrl, blocks: true, collideR: 42 });
    }
    // Enxame decorativo de zubats/venomoths espectrais
    const swarm: string[] = [zubatUrl, venonatUrl];
    let sTries = 0;
    let placed = 0;
    while (placed < 24 && sTries < 1500) {
      sTries++;
      const src = swarm[Math.floor(rand() * swarm.length)];
      const x = 80 + rand() * (worldW - 160);
      const y = 100 + rand() * (worldH - 200);
      let ok = true;
      for (const o of list) if (Math.hypot(x - o.x, y - o.y) < 120) { ok = false; break; }
      if (!ok) continue;
      list.push({ id: id++, x, y, w: 38, h: 38, src, blocks: false, collideR: 0 });
      placed++;
    }
    // Árvores mortas espalhadas evitando as lápides
    const MIN_GAP = 130;
    let tries = 0;
    while (list.length < graveSpots.length * 3 + 14 && tries < 2500) {
      tries++;
      const k = kinds[Math.floor(rand() * kinds.length)];
      const x = 80 + rand() * (worldW - 160);
      const y = 100 + rand() * (worldH - 200);
      let nearGrave = false;
      for (const c of graveSpots) if (Math.hypot(x - c.x, y - c.y) < 260) { nearGrave = true; break; }
      if (nearGrave) continue;
      let ok = true;
      for (const o of list) if (Math.hypot(x - o.x, y - o.y) < MIN_GAP) { ok = false; break; }
      if (!ok) continue;
      list.push({ id: id++, x, y, w: k.w, h: k.h, src: k.src, blocks: k.blocks, collideR: k.collideR });
    }
    return list;
  }

  // Pântano em Chamas (venofogo): MESMA composição do Vale Verdejante (arena),
  // porém re-tematizada — árvores/matos de fogo, 2 lagos de lava e um vulcão central.
  if (mapId === "venofogo") {
    const kinds = [
      { src: rockLavaUrl, w: 56, h: 50, collideR: 8, blocks: true },
    ];
    const list: Obstacle[] = [];
    let id = 1;

    // 2 lagos de lava pequenos (posições espelhadas, fora do centro)
    const lakeSpots: { x: number; y: number }[] = [
      { x: worldW * 0.22, y: worldH * 0.30 },
      { x: worldW * 0.78, y: worldH * 0.72 },
    ];
    for (const c of lakeSpots) {
      list.push({ id: id++, x: c.x, y: c.y, w: 130, h: 130, src: redLakeUrl, blocks: true, collideR: 52 });
    }

    // Vulcão central (grande, bloqueia — substitui o "centro limpo" do arena)
    const volcano = { x: worldW * 0.5, y: worldH * 0.5 };
    list.push({ id: id++, x: volcano.x, y: volcano.y, w: 240, h: 240, src: volcanoUrl, blocks: true, collideR: 96 });

    // Distribuição espalhada IDÊNTICA ao arena (mesmo seed, mesmos parâmetros),
    // apenas evitando lagos e o vulcão.
    const MIN_GAP = 60;
    let tries = 0;
    while (list.length < 18 && tries < 2000) {
      tries++;
      const k = kinds[Math.floor(rand() * kinds.length)];
      const x = 60 + rand() * (worldW - 120);
      const y = 80 + rand() * (worldH - 160);
      if (Math.hypot(x - volcano.x, y - volcano.y) < 180) continue;
      let nearLake = false;
      for (const c of lakeSpots) if (Math.hypot(x - c.x, y - c.y) < 130) { nearLake = true; break; }
      if (nearLake) continue;
      let ok = true;
      for (const o of list) if (Math.hypot(x - o.x, y - o.y) < MIN_GAP) { ok = false; break; }
      if (!ok) continue;
      list.push({ id: id++, x, y, w: k.w, h: k.h, src: k.src, blocks: k.blocks, collideR: k.collideR });
    }
    return list;
  }




  // Mapa Terra (Ninho de Marimbondo): 4 casulos gigantes espalhados com Beedrill/Butterfree ao redor
  if (mapId === "terra") {
    const kinds = [
      { src: treeOakUrl,     w: 110, h: 124, collideR: 0,  blocks: false },
      { src: rockBoulderUrl, w:  86, h:  76, collideR: 10, blocks: true  },
    ];
    const list: Obstacle[] = [];
    let id = 1;

    // 4 casulos espalhados (cantos + centro deslocado)
    const cocoonSpots: { x: number; y: number }[] = [
      { x: worldW * 0.28, y: worldH * 0.30 },
      { x: worldW * 0.72, y: worldH * 0.28 },
      { x: worldW * 0.30, y: worldH * 0.72 },
      { x: worldW * 0.74, y: worldH * 0.70 },
    ];
    for (const c of cocoonSpots) {
      list.push({ id: id++, x: c.x, y: c.y, w: 150, h: 180, src: hornetCocoonUrl, blocks: true, collideR: 42 });
      // Beedrill e Butterfree flutuando perto do casulo (decorativos, sem colisão)
      list.push({ id: id++, x: c.x - 60, y: c.y - 18, w: 40, h: 40, src: beedrillGif, blocks: false, collideR: 0 });
      list.push({ id: id++, x: c.x + 60, y: c.y - 10, w: 40, h: 40, src: butterfreeGif, blocks: false, collideR: 0 });
    }

    // Enxame extra de Beedrill/Butterfree bem espalhados pelo mapa
    const swarm: string[] = [beedrillGif, butterfreeGif];
    let sTries = 0;
    let placed = 0;
    while (placed < 30 && sTries < 1500) {
      sTries++;
      const src = swarm[Math.floor(rand() * swarm.length)];
      const x = 80 + rand() * (worldW - 160);
      const y = 100 + rand() * (worldH - 200);
      let ok = true;
      for (const o of list) if (Math.hypot(x - o.x, y - o.y) < 120) { ok = false; break; }
      if (!ok) continue;
      list.push({ id: id++, x, y, w: 38, h: 38, src, blocks: false, collideR: 0 });
      placed++;
    }

    // Poucas árvores/pedras espalhadas evitando zonas dos casulos
    const MIN_GAP = 130;
    let tries = 0;
    while (list.length < cocoonSpots.length * 3 + 14 && tries < 2500) {
      tries++;
      const k = kinds[Math.floor(rand() * kinds.length)];
      const x = 80 + rand() * (worldW - 160);
      const y = 100 + rand() * (worldH - 200);
      // afastar de qualquer casulo
      let nearCocoon = false;
      for (const c of cocoonSpots) if (Math.hypot(x - c.x, y - c.y) < 260) { nearCocoon = true; break; }
      if (nearCocoon) continue;
      let ok = true;
      for (const o of list) if (Math.hypot(x - o.x, y - o.y) < MIN_GAP) { ok = false; break; }
      if (!ok) continue;
      list.push({ id: id++, x, y, w: k.w, h: k.h, src: k.src, blocks: k.blocks, collideR: k.collideR });
    }
    return list;
  }


  const kinds = [
    { src: treeOakUrl,     w: 110, h: 124, collideR: 0,  blocks: false },
    { src: treePineUrl,    w:  90, h: 132, collideR: 0,  blocks: false },
    { src: rockBoulderUrl, w:  86, h:  76, collideR: 10, blocks: true  },
    { src: bushBerryUrl,   w:  64, h:  60, collideR: 0,  blocks: false },
  ];
  const list: Obstacle[] = [];
  const MIN_GAP = 60;
  const CENTER_CLEAR = 180; // não spawnar em cima da posição inicial (centro)
  let id = 1;
  let tries = 0;
  while (list.length < 90 && tries < 4000) {
    tries++;
    const k = kinds[Math.floor(rand() * kinds.length)];
    const x = 60 + rand() * (worldW - 120);
    const y = 80 + rand() * (worldH - 160);
    if (Math.hypot(x - worldW / 2, y - worldH / 2) < CENTER_CLEAR) continue;
    let ok = true;
    for (const o of list) {
      if (Math.hypot(x - o.x, y - o.y) < MIN_GAP) { ok = false; break; }
    }
    if (!ok) continue;
    list.push({ id: id++, x, y, w: k.w, h: k.h, src: k.src, blocks: k.blocks, collideR: k.collideR });
  }
  return list;
}

type Task = { id: string; title: string; reward: number; progress: number; target: number; done: boolean };
type IdleState = {
  startedAt: number;
  lastTickAt: number;
  pending: { gold: number; rubies: number; crystals: number; redshards?: number };
  totals: { gold: number; captured: number; kills?: number };
  currentMap: IdleMapId;
  tasks: Task[];
  mapsUnlocked: number;
  caughtSpecies: Species[];
  seenSpecies: Species[]; // Pokédex — inimigos derrotados em duelo
  collection?: CollectionEntry[]; // TODAS as capturas (com repetidos), c/ nível, para fragmentar
  craftPoints?: number; // pontos obtidos ao fragmentar pokémons da coleção
  items: Record<string, number>;
  bank: { gold: number; crystals: number }; // moedas coletadas (spendáveis na loja)
  buffs: { atk: number; def: number; expMult: number; expMultUntil?: number; goldMult?: number; goldMultUntil?: number; honeyUntil?: number; honeyRareUntil?: number; orbMult?: number; orbUntil?: number; orbId?: string; teamOrbUntil?: number }; // livros de xp/vip são temporários (1h); honey = incenso de mel 1h; honeyRare = incenso raro (dobra bônus); orb = boost independente (stack com livro); teamOrb = distribui EXP para todo o time por 1h
  autoHeal: { enabled: boolean; threshold: number }; // auto usa poção quando HP% <= threshold
  autoBattle?: { enabled: boolean; useBall: boolean; preferredBall: "auto" | "pokeball" | "greatball" | "ultraball"; captureHpPct: number };
  trainerLevel?: number; // nível do TREINADOR (separado do nível do pokémon)
  trainerXp?: number;    // xp acumulado do treinador rumo ao próximo nível
  unlockedSkins?: string[]; // skins premium desbloqueadas (default sempre incluída)
  // Colmeias do Ninho de Marimbondo — 3 slots de Beedrill por casulo, produzem incenso a cada 10 min
  hives?: Record<string, { slots: Array<{ uid: string; startedAt: number } | null> }>;
  redeemedCodes?: Record<string, boolean>;
  blackMiticPlusPending?: number; // ovos Plus emitidos pelo Governante que ainda precisam ser marcados no painel
  grassOddishCaptured?: number; // contador do evento Grass Oddish
  grassOddishReturnMap?: IdleMapId; // mapa de origem antes de entrar no evento
  vault?: Record<string, number>; // 🏦 Banco Medieval — itens guardados (taxa em Fragmento Vermelho)
  pokeVault?: CollectionEntry[];   // 🏦 Banco Medieval — pokémons armazenados PARA SEMPRE (preservados na 3ª Season)
  valeReturnMap?: IdleMapId;       // mapa de origem antes de entrar no Vale dos Fragmentos
  hideIp?: boolean;                // 🔒 privacidade: oculta o IP na tela (continua registrado no servidor)
};

// 🔻 Fragmento Vermelho — teto de acumulação na COLETA (igual ao ouro, sem travar em 5)
export const RED_SHARD_PENDING_CAP = 50_000;

// 🏦 Banco Medieval — taxa por operação, paga em Fragmento Vermelho.
export const VAULT_FEE_SHARDS = 25;

// 🏦 Banco Medieval — armazenar POKÉMON permanentemente (Black Mitic Plus é grátis).
// Custo atualizado na 3ª Season: 30.000 🔻. O limite de vagas NÃO mudou.
export const POKE_VAULT_FEE_SHARDS = 30_000;
export const POKE_VAULT_SLOTS = 200;

// 🏰 Ginásio Medieval — portal para o Vale dos Fragmentos Vermelhos.
export const GYM_ENTRY_SHARDS = 20_000;

// ═══════════════════════════════════════════════════════════════
// 🏰 GINÁSIO MEDIEVAL — CONTEÚDO DE ENDGAME (3 andares)
// Cada andar exige nível de treinador + pedágio em Fragmento Vermelho.
// Dificuldade, drops e dureza de captura escalam por andar.
// ═══════════════════════════════════════════════════════════════
export type GymFloorId = "gym_carmesim" | "gym_gelo_sombra" | "gym_arcano";
export type GymFloorDef = {
  id: GymFloorId;
  label: string;
  desc: string;
  color: string;
  reqLevel: number;
  entryShards: number;
  /** multiplicadores de dificuldade */
  hpMult: number;
  dmgMult: number;
  /** multiplicador aplicado à chance de captura (quanto menor, mais difícil) */
  captureMult: number;
  /** faixa de fragmentos por abate */
  shards: [number, number];
  /** exige possuir um Black Mitic Plus para entrar */
  requiresBmp?: boolean;
};
export const GYM_FLOORS: GymFloorDef[] = [
  {
    id: "gym_carmesim",
    label: "Salão Carmesim",
    desc: "Veias de cristal vermelho e guardiões de pedra. Primeiro teste do Ginásio.",
    color: "#ff5c5c",
    reqLevel: 1500,
    entryShards: 20_000,
    hpMult: 6,
    dmgMult: 2.2,
    captureMult: 0.20,
    shards: [30, 90],
  },
  {
    id: "gym_gelo_sombra",
    label: "Véu Gélido",
    desc: "Metade gelo eterno, metade sombra. Inimigos mais rápidos, mais duros e mais agressivos.",
    color: "#9fe8ff",
    reqLevel: 4000,
    entryShards: 45_000,
    hpMult: 12,
    dmgMult: 3.4,
    captureMult: 0.10,
    shards: [60, 180],
  },
  {
    id: "gym_arcano",
    label: "Santuário Arcano · Black Mythic",
    desc: "Área exclusiva Black Mythic. Chefes arcanos, recompensas únicas e captura quase impossível.",
    color: "#c58bff",
    reqLevel: 8000,
    entryShards: 90_000,
    hpMult: 24,
    dmgMult: 4.8,
    captureMult: 0.04,
    shards: [120, 360],
    requiresBmp: true,
  },
];
export const GYM_FLOOR_BY_ID: Record<string, GymFloorDef> = Object.fromEntries(GYM_FLOORS.map((f) => [f.id, f]));
export function isGymMap(m: string): boolean { return m === "gym_carmesim" || m === "gym_gelo_sombra" || m === "gym_arcano"; }

/** Pool de espécies por andar do Ginásio (endgame — espécies fracas removidas). */
export const GYM_POOLS: Record<GymFloorId, string[]> = {
  gym_carmesim: ["golem", "onix", "machamp", "primeape", "pinsir", "aerodactyl", "krookodile", "kabutops", "nidoking_shiny", "golem"],
  gym_gelo_sombra: ["abomasnow", "articuno", "gengar", "umbreon", "lapras_shiny", "snorlax_mythic", "tyranitar", "gyarados", "scizor", "suicune_shiny"],
  gym_arcano: ["darkrai", "dialga", "mewtwo", "lugia", "ho_oh", "groudon", "deoxys", "dragonite_shiny", "charizard_shiny", "rayquaza"],
};

/**
 * Drops raros do Ginásio Medieval. Cada andar tem sua tabela; taxas muito baixas
 * nos itens mais valiosos para não inflacionar a economia.
 */
/** Nomes exibidos dos itens exclusivos do Ginásio Medieval. */
export const GYM_DROP_LABELS: Record<string, string> = {
  orb_suprema: "Orb Suprema ✦✦✦",
  pergaminho_teleporte: "Pergaminho de Teleporte 📜",
  fragmento_antigo: "Fragmento Antigo 🗿",
  pedra_mistica: "Pedra Mística 🔮",
  medalha_medieval: "Medalha Medieval 🏅",
  nucleo_arcano: "Núcleo Arcano 🌀",
  cristal_negro: "Cristal Negro 🖤",
};

export const GYM_RARE_DROPS: Record<GymFloorId, Array<{ id: string; chance: number }>> = {
  gym_carmesim: [
    { id: "ultraball", chance: 0.030 },
    { id: "fragmento_antigo", chance: 0.020 },
    { id: "pergaminho_teleporte", chance: 0.012 },
    { id: "medalha_medieval", chance: 0.006 },
    { id: "pedra_mistica", chance: 0.0030 },
    { id: "orb_suprema", chance: 0.0012 },
    { id: "nucleo_arcano", chance: 0.0006 },
    { id: "cristal_negro", chance: 0.0002 },
  ],
  gym_gelo_sombra: [
    { id: "ultraball", chance: 0.055 },
    { id: "fragmento_antigo", chance: 0.035 },
    { id: "pergaminho_teleporte", chance: 0.022 },
    { id: "medalha_medieval", chance: 0.012 },
    { id: "pedra_mistica", chance: 0.0070 },
    { id: "orb_suprema", chance: 0.0028 },
    { id: "nucleo_arcano", chance: 0.0014 },
    { id: "cristal_negro", chance: 0.0006 },
  ],
  gym_arcano: [
    { id: "ultraball", chance: 0.090 },
    { id: "fragmento_antigo", chance: 0.060 },
    { id: "pergaminho_teleporte", chance: 0.040 },
    { id: "medalha_medieval", chance: 0.024 },
    { id: "pedra_mistica", chance: 0.0150 },
    { id: "orb_suprema", chance: 0.0060 },
    { id: "nucleo_arcano", chance: 0.0030 },
    { id: "cristal_negro", chance: 0.0015 },
  ],
};


// 🔻 Evento Vale dos Fragmentos: abre 1 hora a cada 5 horas (ciclo global, igual pra todos).
export const VALE_CYCLE_MS = 5 * 60 * 60 * 1000;
export const VALE_OPEN_MS = 60 * 60 * 1000;
export function valeEventStatus(now: number = Date.now()): { open: boolean; msUntilChange: number } {
  const t = now % VALE_CYCLE_MS;
  return t < VALE_OPEN_MS
    ? { open: true, msUntilChange: VALE_OPEN_MS - t }
    : { open: false, msUntilChange: VALE_CYCLE_MS - t };
}

// 🔻 Pedágio em Fragmento Vermelho para viajar a mapas de alto nível.
export function redShardTravelCost(minLevel: number): number {
  if (minLevel >= 1000) return 500;
  if (minLevel >= 500) return 200;
  if (minLevel >= 200) return 50;
  return 0;
}

export type CollectionEntry = { uid: string; species: Species; level: number; rarity: Rarity; capturedAt: number; xp?: number; traits?: string[]; event?: string };

export const MAX_COLLECTION = 500;

const GOVERNANTE_PLUS_POOL: readonly Species[] = [
  "mewtwo", "mew", "groudon", "lugia", "ho_oh",
  "moltres", "zapdos", "articuno", "raikou", "suicune",
  "dialga", "darkrai", "snorlax_mythic", "tyranitar",
  "lucario", "scizor", "dragonite_shiny", "charizard_shiny", "blastoise_shiny",
];

const GOVERNANTE_PLUS_TRAITS = ["prismatico", "alpha", "esquivo", "dourado", "prodigio", "eterno"];

// Pool de 50 espécies elegíveis para o Painel de Troca Black Mitic Plus (código RESGTT55).
const BMP_SWAP_POOL: readonly Species[] = [
  "charizard_shiny", "blastoise_shiny", "dragonite_shiny", "mewtwo",
  "mewtwo_event", "lugia", "ho_oh", "moltres", "zapdos",
  "articuno", "moltres_shiny", "raikou", "suicune", "suicune_shiny",
  "dialga", "darkrai", "deoxys", "groudon", "lapras_shiny",
  "snorlax_mythic", "tyranitar", "scizor", "gengar",
  "umbreon", "infernape", "krookodile", "nidoking_shiny", "rapidash_shiny",
  "skarmory", "heracross_shiny", "meganium_shiny", "exeggutor_shiny", "cloyster_shiny",
  "onix_shiny", "hitmonchan_shiny", "lickitung_shiny", "kangaskhan", "feraligatr",
  "blaziken", "pinsir", "golem", "jolteon", "lapras",
  "virizion", "luxray_f", "abomasnow", "riolu", "charizard",
  // +20 novos
  "venusaur", "pikachu", "gyarados", "machamp", "arcanine",
  "dragonite", "blaziken", "raichu", "ninetales", "magmortar",
  "aerodactyl", "kabutops", "primeape", "hariyama", "ursaring",
  "magmar", "snorlax", "magneton", "electabuzz", "vaporeon_shiny",
] as const;

export const CRAFT_BY_RARITY: Record<Rarity, number> = {
  common: 1,
  uncommon: 3,
  rare: 8,
  epic: 20,
  legendary: 60,
  mythic: 200,
  mythic_shiny: 600,
};

const DEFAULT_TASKS = (): Task[] => [
  { id: "t1", title: "Derrote 30 Pokémon selvagens", reward: 3, progress: 0, target: 30, done: false },
  { id: "t2", title: "Colete 5000 de ouro offline",   reward: 2, progress: 0, target: 5000, done: false },
  { id: "t3", title: "Capture 10 Pokémon",            reward: 4, progress: 0, target: 10, done: false },
];

// Itens farmáveis (drop aleatório dos inimigos derrotados)
const ITEM_ICONS: Record<string, LucideIcon> = {
  potion: FlaskConical, pokeball: Sparkles,
};
const ITEM_COLORS: Record<string, string> = {
  potion: "#ff6b8a", pokeball: "#ff5252",
  greatball: "#4a7bff", ultraball: "#f5cf6b",
  chest_amulet: "#f5cf6b",
  revive: "#ff5b8a", berry: "#4a7bff", key: "#f5cf6b",
  book_atk: "#ff5252", book_def: "#4a7bff", book_exp: "#5ec26a",
  book_exp_big: "#8bffb0", book_exp_max: "#ffd94d", book_vip: "#ffb347",
};
const ITEM_IMG: Record<string, string> = {
  potion: potionNewImg,
  pokeball: ballPokeImg, greatball: ballGreatImg, ultraball: ballUltraImg,
  chest_amulet: chestAmuletImg,
  revive: reviveIconImg, berry: berryIconImg, key: keyIconImg,
  book_atk: bookAtkImg, book_def: bookDefImg, book_exp: bookExpImg,
  book_exp_big: bookExpImg, book_exp_max: bookExpImg, book_vip: bookExpImg,
  premium_box: premiumBoxImg,
  bau_esmeralda: chestEmeraldImg,
  orb_xp_minor: orbXpMinorUrl, orb_xp_major: orbXpMajorUrl, orb_xp_supreme: orbXpSupremeUrl, orb_team: orbXpTeamUrl,
  orb_xp_supreme_24h: orb24hImg,
  incenso_mel_raro_24h: incense24hImg,
  safira_verde: assetUrlFromJson(safiraVerdeAsset),
  cristal_fragmentado: assetUrlFromJson(iconFragmentCrystal),
  fragmento_vermelho: redShardImg,
};
const ITEM_POOL: { id: string; name: string; icon: string; chance: number }[] = [
  { id: "potion",    name: "Poção",     icon: "🧪", chance: 0.30 },
  { id: "pokeball",  name: "Pokébola",  icon: "🔴", chance: 0.15 },
  { id: "berry",     name: "Berry",     icon: "🫐", chance: 0.12 },
  { id: "revive",    name: "Revive",    icon: "💖", chance: 0.05 },
  { id: "key",       name: "Chave",     icon: "🗝", chance: 0.03 },
];

// Loja — Pokébolas por gold, livros por cristal
type ShopBall = { id: "pokeball" | "greatball" | "ultraball" | "masterball"; name: string; price: number; img: string; captureMult: number };
const SHOP_BALLS: ShopBall[] = [
  { id: "pokeball",   name: "Pokébola",   price: 500,    img: ballPokeImg,  captureMult: 1 },
  { id: "greatball",  name: "Great Ball", price: 5000,   img: ballGreatImg, captureMult: 2 },
];
// Catálogo COMPLETO usado no cálculo de captura (inclui bolas que não são
// vendidas na loja mas o jogador pode ter dropado / recebido de eventos).
const ALL_BALLS: ShopBall[] = [
  { id: "pokeball",   name: "Pokébola",   price: 500,    img: ballPokeImg,  captureMult: 1 },
  { id: "greatball",  name: "Great Ball", price: 5000,   img: ballGreatImg, captureMult: 2 },
  { id: "ultraball",  name: "Ultra Ball", price: 15000,  img: ballUltraImg, captureMult: 3.5 },
  { id: "masterball", name: "Master Ball", price: 999999, img: ballUltraImg, captureMult: 999 },
];

type ShopBook = { id: "book_atk" | "book_def" | "book_exp" | "book_exp_big" | "book_exp_max" | "book_vip" | "book_vip_30" | "book_vip_60" | "orb_xp_minor" | "orb_xp_major" | "orb_xp_supreme" | "orb_team"; name: string; desc: string; price: number; img: string; currency?: "crystals" | "gold"; priceGold?: number };
const SHOP_BOOKS: ShopBook[] = [
  { id: "book_atk", name: "Livro de Ataque", desc: "+10% de dano permanente por uso", price: 100, img: bookAtkImg },
  { id: "book_def", name: "Livro de Defesa", desc: "-10% de dano recebido por uso",  price: 100, img: bookDefImg },
  { id: "book_exp", name: "Livro de EXP",    desc: "+30% EXP em batalhas por 1 hora",   price: 30, img: bookExpImg },

  { id: "book_vip_30", name: "Livro VIP 30d ✦✦", desc: "+30% ouro e +30% EXP por 30 DIAS", price: 500, img: bookExpImg },
  { id: "book_vip_60", name: "Livro VIP 60d ✦✦✦", desc: "+40% ouro e +40% EXP por 60 DIAS", price: 1000, img: bookExpImg },
  // ═══ ORB DE XP FRACO — único vendido; os fortes vêm da troca com NPC ═══
  { id: "orb_xp_minor",   name: "Orb de XP Menor ✦",   desc: "+10% EXP por 1 hora (apenas 1 orb ativo, stack com livro)", price: 100,  img: orbXpMinorUrl,   currency: "crystals", priceGold: 50000 },
  // ═══ ORB DE TIME — distribui EXP para todos os pokémons do time por 1 hora ═══
  { id: "orb_team",       name: "Orb de Time ✦✦✦",     desc: "Todo o time ganha EXP nas batalhas por 3 horas (sem +% de EXP)", price: 2000, img: orbXpTeamUrl,   currency: "crystals" },
];


const POTION_PRICE = 100;
const POTION_HEAL_PCT = 0.5;

// Espécies desbloqueadas por nível do líder — spawn cresce com o progresso
const LEVEL_UNLOCKS: { minLv: number; species: Species[] }[] = [
  { minLv: 1,  species: ["rattata_f", "pidgey"] },
  { minLv: 3,  species: ["zubat", "ekans"] },
  { minLv: 6,  species: ["meowth", "psyduck"] },
  { minLv: 10, species: ["diglett", "machop"] },
  { minLv: 15, species: ["bulbasaur", "charmander", "squirtle"] },
  { minLv: 18, species: ["jolteon", "lapras"] },
  { minLv: 20, species: ["pikachu"] },
  { minLv: 25, species: ["pinsir", "golem"] },
  { minLv: 30, species: ["charizard"] },
  { minLv: 36, species: ["blaziken"] },
];
function speciesUnlockedFor(lv: number): Species[] {
  const list: Species[] = [];
  for (const u of LEVEL_UNLOCKS) if (lv >= u.minLv) list.push(...u.species);
  return list.length ? list : ["rattata_f"];
}

function loadIdle(): IdleState {
  if (typeof window === "undefined") return freshIdle();
  try {
    const raw = localStorage.getItem(IDLE_KEY);
    if (raw) {
      let parsed;
      try {
        parsed = deobfuscate(raw);
        if (!parsed || typeof parsed !== 'object') {
          try {
            parsed = JSON.parse(raw);
          } catch {
            console.warn("Falha ao recuperar dados (não é obfuscado nem JSON válido)");
            return freshIdle();
          }
        }
      } catch (e) {
        console.error("Erro crítico ao carregar IDLE_KEY:", e);
        return freshIdle();
      }

      // V17 HOTFIX: Se o estado local for de uma versão admin (+20000), 
      // mas o treinador_level visual for 1, algo corrompeu. Resetamos para forçar cloud sync.
      if (parsed.version >= 10000 && (parsed.level === 1 || parsed.trainerLevel === 1)) {
        console.warn("[V17] Local state mismatch (Lv1 vs High Version). Wiping for clean cloud sync.");
        localStorage.removeItem(IDLE_KEY);
        localStorage.removeItem("rubym.save.v2");
        return freshIdle();
      }
      
      const s: IdleState = { ...freshIdle(), ...parsed };
      // Presente de boas-vindas (evento): 1x Caixa Premium
      const flags = (s as unknown as { flags?: Record<string, boolean> }).flags ?? {};
      if (!flags.giftPremiumBoxV1) {
        s.items = { ...(s.items ?? {}), premium_box: (s.items?.premium_box ?? 0) + 1 };
        (s as unknown as { flags: Record<string, boolean> }).flags = { ...flags, giftPremiumBoxV1: true };
      }
      // Auto-Poção sempre ativada ao entrar no jogo
      s.autoHeal = { ...(s.autoHeal ?? { threshold: 0.5, enabled: true }), enabled: true };
      
      const uskins = Array.isArray(s.unlockedSkins) ? s.unlockedSkins.slice() : [];
      if (!uskins.includes("default")) uskins.unshift("default");
      s.unlockedSkins = uskins;
      
      if (!IDLE_MAPS[s.currentMap]) s.currentMap = "arena";
      return s;
    }
  } catch { /* ignore */ }
  return freshIdle();
}
function freshIdle(): IdleState {
  const now = Date.now();
  return {
    startedAt: now, lastTickAt: now,
    pending: { gold: 0, rubies: 0, crystals: 0, redshards: 0 },
    totals: { gold: 0, captured: 0, kills: 0 },
    currentMap: "arena",
    tasks: DEFAULT_TASKS(),
    mapsUnlocked: 3,
    caughtSpecies: [],
    seenSpecies: [],
    collection: [],
    craftPoints: 0,
    items: { premium_box: 1 },
    bank: { gold: 0, crystals: 30 },
    buffs: { atk: 0, def: 0, expMult: 0, expMultUntil: 0, goldMult: 0, goldMultUntil: 0, honeyUntil: 0, honeyRareUntil: 0, orbMult: 0, orbUntil: 0, orbId: "", teamOrbUntil: 0 },
    autoHeal: { enabled: true, threshold: 0.5 },
    autoBattle: { enabled: true, useBall: true, preferredBall: "auto", captureHpPct: 1 },
    trainerLevel: 1,
    trainerXp: 0,
    unlockedSkins: ["default"],
    redeemedCodes: {},
    vault: {},
  };
}
function saveIdle(s: IdleState) {
  try { localStorage.setItem(IDLE_KEY, obfuscate(s)); } catch { /* ignore */ }
}

// XP-para-o-próximo-nível do TREINADOR (curva um pouco mais dura que a do pokémon)
function trainerXpToNext(lv: number): number {
  return 150 + lv * 80;
}
// Aplica ganho de XP ao treinador e resolve level-ups em cadeia
function applyTrainerXp(s: IdleState, gained: number): { state: IdleState; leveledTo: number | null } {
  const startLv = s.trainerLevel ?? 1;
  let lv = startLv;
  let xp = (s.trainerXp ?? 0) + Math.max(0, Math.floor(gained));
  while (lv < 10000 && xp >= trainerXpToNext(lv)) { xp -= trainerXpToNext(lv); lv += 1; }
  return {
    state: { ...s, trainerLevel: lv, trainerXp: xp },
    leveledTo: lv > startLv ? lv : null,
  };
}

const IDLE_HP_MULT = 6;
function calcIdleMaxHp(pet: PetInstance) {
  return calcMaxHp(pet) * IDLE_HP_MULT;
}

function highLevelEnemyHpMult(enemyLevel: number, leaderLevel: number) {
  if (enemyLevel < 200) return 1;
  // 200=1.45x · 250=1.9x · 300=2.6x · 350=3.4x · 400=4.3x · 450=5.2x · 500=6.0x
  let mult = 1.45;
  if (enemyLevel >= 200) mult += Math.min(0.55, (enemyLevel - 200) / 100);   // até 300 → +0.55 (=2.0)
  if (enemyLevel >= 300) mult += Math.min(1.6, (enemyLevel - 300) / 100 * 0.8); // 300→500: +0..1.6 (=3.6)
  if (enemyLevel >= 400) mult += Math.min(1.0, (enemyLevel - 400) / 100);       // 400→500: mais +1
  if (enemyLevel >= 250) {
    const gap = Math.max(0, enemyLevel - leaderLevel);
    mult *= 1.15 + Math.min(1.6, gap * 0.045);
  }
  return mult;
}

function highLevelEnemyDamageMult(enemyLevel: number, leaderLevel: number) {
  if (enemyLevel < 200) return 1;
  // Curva de dano progressiva 200→500 (mais agressiva a partir de 300)
  let mult = 1.55;
  if (enemyLevel >= 200) mult += Math.min(0.65, (enemyLevel - 200) / 100 * 0.65);
  if (enemyLevel >= 300) mult += Math.min(1.4, (enemyLevel - 300) / 100 * 0.7);
  if (enemyLevel >= 400) mult += Math.min(0.9, (enemyLevel - 400) / 100 * 0.9);
  if (enemyLevel >= 250) {
    const gap = Math.max(0, enemyLevel - leaderLevel);
    mult *= 1.2 + Math.min(2.2, gap * 0.055);
  }
  return mult;
}

function playerDamageVsHighLevelMult(_leaderLevel: number, _enemyLevel: number) {
  // Sem restrição por diferença de nível — jogador causa dano cheio em qualquer alvo.
  return 1;
}


// ===== Energia por raridade =====
// Regen passivo (0→100) SÓ conta quando o pokémon está fora do time (na coleção).
// Enquanto está no time ativo, a energia apenas DRENA — raridade define quanto
// tempo ele aguenta em atividade antes de cansar.
const ENERGY_REGEN_MS: Partial<Record<Rarity, number>> = {
  common: 30 * 60 * 1000, uncommon: 50 * 60 * 1000,
  rare: 110 * 60 * 1000, epic: 180 * 60 * 1000, legendary: 180 * 60 * 1000,
  mythic: 0, mythic_shiny: 0,
};

// Duração (segundos) que 100 de energia dura em auto-battle como líder.
const ENERGY_ACTIVE_DURATION_S: Partial<Record<Rarity, number>> = {
  common: 25 * 60,       // 25 min
  uncommon: 35 * 60,     // 35 min
  rare: 1 * 3600,        // 1 h
  epic: 2 * 3600,        // 2 h
  legendary: 5 * 3600,   // 5 h
  mythic: 0, mythic_shiny: 0,
};
function energyDrainPerSec(rarity: Rarity): number {
  const dur = ENERGY_ACTIVE_DURATION_S[rarity] ?? 5 * 60;
  return dur === 0 ? 0 : ENERGY_MAX / dur;
}
function energyDrainPerKill(rarity: Rarity): number {
  const dur = ENERGY_ACTIVE_DURATION_S[rarity] ?? 5 * 60;
  if (dur === 0) return 0;
  // ~30s de atividade equivalente por kill
  return Math.max(1, Math.round((30 / dur) * ENERGY_MAX));
}

const ENERGY_MAX = 100;
const AZUL_REST_MS = 5 * 60 * 1000;
const AZUL_REST_FREE_MS = 60 * 60 * 1000; // 1h grátis quando não há cristais
const AZUL_REST_COST = 5; // diamantes
type PetEnergyExt = PetInstance & { energy?: number; energyRegenAt?: number; azulRestUntil?: number; azulRestFromEnergy?: number; azulRestTotalMs?: number };
function petCurrentEnergy(pet: PetInstance, now: number = Date.now(), opts?: { active?: boolean }): number {
  const p = pet as PetEnergyExt;
  const regen = ENERGY_REGEN_MS[pet.rarity] ?? 20 * 60 * 1000;
  if (regen === 0) return ENERGY_MAX;
  if (p.azulRestUntil && p.azulRestUntil > now) {
    const total = p.azulRestTotalMs ?? AZUL_REST_MS;
    const start = p.azulRestUntil - total;
    const t = Math.max(0, Math.min(1, (now - start) / total));
    const base = p.azulRestFromEnergy ?? p.energy ?? ENERGY_MAX;
    return Math.round(base + (ENERGY_MAX - base) * t);
  }

  const stored = p.energy ?? ENERGY_MAX;
  // No time ativo: sem regen passivo — só drena.
  if (opts?.active) return Math.max(0, Math.min(ENERGY_MAX, Math.round(stored)));

  const regenAt = p.energyRegenAt ?? now;
  const gain = ((now - regenAt) / regen) * ENERGY_MAX;
  return Math.max(0, Math.min(ENERGY_MAX, Math.round(stored + gain)));
}
function petMsToFull(pet: PetInstance, now: number = Date.now()): number {
  const p = pet as PetEnergyExt;
  if ((ENERGY_REGEN_MS[pet.rarity] ?? 0) === 0) return 0;
  if (p.azulRestUntil && p.azulRestUntil > now) return p.azulRestUntil - now;
  const cur = petCurrentEnergy(pet, now);
  if (cur >= ENERGY_MAX) return 0;
  const regen = ENERGY_REGEN_MS[pet.rarity] ?? 20 * 60 * 1000;
  return Math.round(((ENERGY_MAX - cur) / ENERGY_MAX) * regen);
}
function petIsExhausted(pet: PetInstance, now: number = Date.now(), opts?: { active?: boolean }): boolean {
  const infinite = (ENERGY_REGEN_MS[pet.rarity] ?? 0) === 0;
  if (infinite) return false;
  const p = pet as PetEnergyExt;
  if (p.azulRestUntil && p.azulRestUntil > now) return true;
  return petCurrentEnergy(pet, now, opts) <= 0;
}
function fmtMS(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(s / 60), r = s % 60;
  return `${m}:${String(r).padStart(2, "0")}`;
}


// ============ Default team (usa save se existir) — APENAS 1 pokemon ============
type SaveShape = { party?: PetInstance[] };
function loadTeam(): PetInstance[] {
  const save = loadLatestValid<SaveShape>();
  if (save && typeof save === 'object' && Array.isArray(save.party) && save.party.length > 0) {
    const leader = save.party[0];
    // upgrade forçado: se ainda for o antigo default (charizard lv15), troca por charmander lv1
    if (leader.species === "charizard" && leader.level === 15 && (leader.xp ?? 0) === 0) {
      return [makePet("charmander", 1)];
    }
    return save.party.slice(0, 1);
  }
  return [makePet("charmander", 1)];
}


function fmtHMS(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), r = s % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
}
function fmtK(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1000) return (n / 1000).toFixed(1) + "K";
  return String(Math.floor(n));
}

function getMultiplayerSessionId(baseId: string) {
  if (typeof window === "undefined") return baseId;
  try {
    let id = sessionStorage.getItem(MP_SESSION_KEY);
    if (!id) {
      const suffix = crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      id = `${baseId}:${suffix}`;
      sessionStorage.setItem(MP_SESSION_KEY, id);
    }
    return id;
  } catch {
    return `${baseId}:${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }
}

// ============ Route ============
export const Route = createFileRoute("/idle")({
  head: () => ({
    meta: [
      { title: "Modo Idle — Ruby M" },
      { name: "description", content: "Modo idle: seus Pokémon batalham e evoluem sozinhos." },
    ],
  }),
  component: () => (
    <AuthGate>
      <IdlePage />
    </AuthGate>
  ),
});

// ============ Page ============
function IdlePage() {
  const identity = loadIdentity();
  const navigate = useNavigate();
  const [idle, setIdle] = useState<IdleState>(() => loadIdle());
  const [team, setTeam] = useState<PetInstance[]>(() => loadTeam());
  // Pokémon fora do time enquanto descansam na Casa Azul (voltam ao time cheios)
  const [restingBench, setRestingBench] = useState<PetInstance[]>([]);
  // HP atual do meu pokémon (o líder toma dano dos inimigos)
  const [leaderHp, setLeaderHp] = useState<number>(() => {
    const initTeam = loadTeam();
    const l = Array.isArray(initTeam) ? initTeam[0] : null;
    return l ? Math.max(Number(l.hp) || 0, calcIdleMaxHp(l)) : 0;
  });
  const [leveledAt, setLeveledAt] = useState<number>(0);
  const [levelToast, setLevelToast] = useState<{ level: number; gains: string[]; bonus: string; ts: number } | null>(null);
  const prevLevelRef = useRef<number>(0);
  useEffect(() => {
    if (!levelToast) return;
    const t = setTimeout(() => setLevelToast(null), 5000);
    return () => clearTimeout(t);
  }, [levelToast]);
  // ⚡ ZAPDOS EVENT — anúncio no topo, aparece só nos mapas da Odisséia + Caverna Sombria
  const [zapdosAnnounce, setZapdosAnnounce] = useState<{ ts: number } | null>(null);
  useEffect(() => {
    if (!zapdosAnnounce) return;
    const t = setTimeout(() => setZapdosAnnounce(null), 8000);
    return () => clearTimeout(t);
  }, [zapdosAnnounce]);
  // alvo atual (para virar o pokémon) — id do inimigo que estamos atacando
  const [attackTargetId, setAttackTargetId] = useState<number | null>(null);
  const attackTargetIdRef = useRef<number | null>(null);
  const paralyzedUntilRef = useRef<number>(0);
  const [paralyzedUntil, setParalyzedUntil] = useState<number>(0);
  // Rastreia qual inimigo aplicou a paralisia — se ele morrer/fugir,
  // limpamos o efeito para o treinador voltar a atacar imediatamente.
  const paralyzedByEnemyIdRef = useRef<number | null>(null);
  const atkDebuffUntilRef = useRef<number>(0);
  const poisonUntilRef = useRef<number>(0);
  const mapEnterAtRef = useRef<number>(Date.now());

  useEffect(() => { attackTargetIdRef.current = attackTargetId; }, [attackTargetId]);
  const leaderLvKeyRef = useRef<number>(team[0]?.level ?? 0);
  const leaderUidRef = useRef<string | undefined>(team[0]?.uid);

  useEffect(() => {
    const leader = team[0];
    if (!leader) return;
    const lv = leader.level ?? 0;
    const uid = leader.uid;
    const changed = uid !== leaderUidRef.current || Math.abs(lv - leaderLvKeyRef.current) >= 3;
    if (changed) {
      leaderLvKeyRef.current = lv;
      leaderUidRef.current = uid;
      setEnemies((prev) => {
        const kept = prev.filter((e) => {
          const el = e.level ?? lv;
          return el <= lv + 10 && el >= lv - 5;
        });
        if (kept.length < 3) return spawnEnemies();
        return kept;
      });
    }
  }, [team.length, team[0]?.uid, team[0]?.level, spawnEnemies, idle.currentMap]);

  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [anciaoOpen, setAnciaoOpen] = useState(false);
  const [anciaoForced, setAnciaoForced] = useState(false);
  const anciaoForcedRef = useRef(false);
  useEffect(() => { anciaoForcedRef.current = anciaoForced && anciaoOpen; }, [anciaoForced, anciaoOpen]);
  // ❄️ Primeiro login: se o jogador nunca passou pelo Ancião, o diálogo dispara
  // automaticamente e ele não consegue sair da tela antes de falar com o NPC.
  const anciaoAutoDone = useRef(false);
  useEffect(() => {
    if (anciaoAutoDone.current) return;
    if (idle.redeemedCodes?.RESETPERSON) return; // já passou — nunca repete
    anciaoAutoDone.current = true;
    setTab("batalha");
    setIdle((prev) => ({ ...prev, currentMap: "santuario_glacial" }));
    setAnciaoForced(true);
    setAnciaoOpen(true);
  }, [idle.redeemedCodes?.RESETPERSON]);
  const [now, setNow] = useState(() => Date.now());

  // Manutenção Season: Desloga jogadores não-admins
  useEffect(() => {
    const checkMaintenance = async () => {
      const email = identity?.email?.trim().toLowerCase();
      const isAdmin = email === "lordryuhhhuyuyghh@gmail.com" || 
                      identity?.id === "61b4d001-c8c3-424d-862d-0b798782f9d6";
      
      if (isAdmin) return;

      try {
        const { data: config } = await (supabase as any)
          .from("server_config")
          .select("value")
          .eq("key", "maintenance_mode")
          .maybeSingle();
        
        // Ativamos por padrão se falhar ou se for explicitamente 'true'
        if (config?.value === "true" || config?.value === true || !config) {
          signOutRubyM();
          navigate({ to: "/" });
        }
      } catch (e) {
        console.warn("Erro ao checar manutenção", e);
      }
    };
    checkMaintenance();
    const iv = setInterval(checkMaintenance, 60000);
    return () => clearInterval(iv);
  }, [identity, navigate]);

  const handleSeasonResetRitual = async () => {
    // O diálogo do Ancião já é a confirmação — executa o ritual direto.
    await handleSeasonReset(true);
  };

  const handleAnciaoInteraction = () => {
    // Fecha qualquer menu aberto para o jogador ver o Santuário
    setTab("batalha");
    if (idle.currentMap === "santuario_glacial") {
      setAnciaoOpen(true);
      return;
    }
    setIdle((prev) => ({ ...prev, currentMap: "santuario_glacial" }));
    pushChat("❄️ Viajando para o Santuário Glacial...", "info");
    setTimeout(() => setAnciaoOpen(true), 350);
  };

  // ============= Server sync (Supabase anti-cheat) =============
  const idleRef = useRef(idle);
  useEffect(() => { idleRef.current = idle; }, [idle]);
  const teamRef = useRef(team);
  useEffect(() => { teamRef.current = team; }, [team]);
  const benchRef = useRef(restingBench);
  useEffect(() => { benchRef.current = restingBench; }, [restingBench]);
  const collectionForDisplay = useMemo<CollectionEntry[]>(() => {
    const col: CollectionEntry[] = idle.collection ?? [];
    const active = [...team, ...restingBench];
    const data: Record<string, CollectionEntry> = {};
    for (const e of col) data[e.uid] = e;
    for (const pet of active) {
      const current = data[pet.uid];
      data[pet.uid] = {
        uid: pet.uid,
        species: pet.species,
        level: Math.max(current?.level ?? 1, pet.level ?? 1),
        xp: Math.max(current?.xp ?? 0, pet.xp ?? 0),
        rarity: pet.rarity,
        capturedAt: current?.capturedAt ?? Date.now(),
        traits: current?.traits ?? pet.traits ?? [],
        event: current?.event ?? pet.event,
      };
    }
    return Object.values(data);
  }, [idle.collection, restingBench, team]);
  // UIDs intencionalmente consumidos (fragmentar/trocador) — impede reconciliação
  // de re-adicioná-los à coleção quando ainda estão em team/bench mid-cleanup.
  const consumedUidsRef = useRef<Set<string>>(new Set());

  // ===== Regen passiva por sinergia Planta/Fada =====
  useEffect(() => {
    const iv = setInterval(() => {
      const t = teamRef.current;
      if (!t || t.length === 0) return;
      const syn = computeTeamSynergies(t);
      if (syn.regenPct <= 0) return;
      // Cura líder
      setLeaderHp((h) => {
        const leader = t[0];
        if (!leader) return h;
        const max = calcIdleMaxHp(leader);
        if (h >= max || h <= 0) return h;
        return Math.min(max, h + max * syn.regenPct);
      });
      // Cura pets do time (não-líder)
      setTeam((tm) => tm.map((p, i) => {
        if (i === 0) return p;
        const max = calcIdleMaxHp(p);
        const cur = p.hp ?? max;
        if (cur >= max || cur <= 0) return p;
        return { ...p, hp: Math.min(max, cur + max * syn.regenPct) };
      }));
    }, 3000);
    return () => clearInterval(iv);
  }, []);

  // ===== Mythic Roamers podem FUGIR (some do mapa) — muito raros =====
  useEffect(() => {
    const iv = setInterval(() => {
      setEnemies((prev) => {
        let fled: number[] = [];
        const next = prev.filter((e) => {
          if (!e.eventLegendary || e.level < 400) return true;
          const beingAttacked = attackTargetIdRef.current === e.id;
          // Lugia é o mais fujão: pode escapar mesmo em batalha
          if (e.sp === "lugia") {
            const p = beingAttacked ? 0.10 : 0.18;
            if (Math.random() < p) { fled.push(e.id); return false; }
            return true;
          }
          if (beingAttacked) {
            // Outros Lv500+ têm pequena chance de fugir mesmo lutando
            if (Math.random() < 0.04) { fled.push(e.id); return false; }
            return true;
          }
          if (Math.random() < 0.15) { fled.push(e.id); return false; }
          return true;
        });
        if (fled.length > 0) {
          try {
            // Ao fugir, o mítico remove os status que impôs (paralisia)
            // e libera o alvo, senão o treinador ficaria travado sem atacar.
            paralyzedUntilRef.current = 0;
            setParalyzedUntil(0);
            for (const fid of fled) {
              blacklistRef.current.delete(fid);
            }
            if (fled.includes(attackTargetIdRef.current ?? -1)) {
              setAttackTargetId(null);
            }
            stuckRef.current = { id: 0, count: 0 };
            pushChat(`★ Mítico Roamer desapareceu nas sombras... fugiu!`, "info");
          } catch {}
        }
        return next;
      });
    }, 20000);
    return () => clearInterval(iv);
  }, []);

  const serverSync = useServerSync({
    buildLocalSnapshot: (): LocalSnapshotForPush => {
      const s = idleRef.current;
      const t = teamRef.current;
      const balls = {
        pokeball: s.items?.pokeball ?? 0,
        greatball: s.items?.greatball ?? 0,
        ultraball: s.items?.ultraball ?? 0,
        masterball: s.items?.masterball ?? 0,
      };
      const col: LocalSnapshotForPush["collection"] = [];
      const teamIds = new Set(t.map((p) => p.uid));
      // Time atual como slots 0-4: o mesmo Pokémon não é enviado duplicado como coleção.
      t.slice(0, 5).forEach((pet, slot) => {
        col.push({
          id: pet.uid,
          species: pet.species as string,
          level: Math.max(1, Math.min(10000, pet.level ?? 1)),
          xp: Math.max(0, Math.floor(pet.xp ?? 0)),
          rarity: (pet.rarity ?? "common") as string,
          team_slot: slot,
        });
      });
      // Coleção
      for (const c of s.collection ?? []) {
        if (teamIds.has(c.uid)) continue;
        col.push({
          id: c.uid,
          species: c.species as string,
          level: Math.max(1, Math.min(10000, c.level ?? 1)),
          xp: Math.max(0, Math.floor(c.xp ?? 0)),
          rarity: (c.rarity ?? "common") as string,
          team_slot: null,
        });
      }
      return {
        gold: Math.max(0, Math.floor(s.bank?.gold ?? 0)),
        crystal: Math.max(0, Math.floor(s.bank?.crystals ?? 0)),
        ruby: 0,
        trainer_level: Math.max(1, Math.min(10000, s.trainerLevel ?? 1)),
        trainer_xp: Math.max(0, Math.floor(s.trainerXp ?? 0)),
        kill_count: Math.max(0, Math.floor(s.totals?.kills ?? 0)),
        active_map: s.currentMap,
        pokeballs: balls,
        collection: col,
      };
    },
    onHydrate: (full) => {
      try {
        // Se o blob completo já foi pré-carregado do Supabase, ele é a fonte de verdade.
        // O sync normalizado antigo não pode sobrescrever com trainer_state/pokemon_collection defasados.
        if (localStorage.getItem(CLOUD_PRELOADED_KEY)) return;
      } catch { /* ignore */ }
      // Aplica estado do servidor como fonte de verdade.
      setIdle((prev) => {
        const items = { ...(prev.items ?? {}) };
        for (const b of full.pokeballs) items[b.ball_type] = b.qty;
        const collection = full.collection.map((p) => ({
          uid: p.id,
          species: p.species as Species,
          level: p.level,
          xp: p.xp ?? 0,
          rarity: p.rarity as Rarity,
          capturedAt: Date.parse(p.captured_at) || Date.now(),
        }));
        return {
          ...prev,
          bank: {
            gold: full.trainer.gold,
            crystals: full.trainer.crystal,
          },
          trainerLevel: full.trainer.trainer_level,
          trainerXp: full.trainer.trainer_xp,
          totals: { ...prev.totals, kills: full.trainer.kill_count },
          items,
          collection,
        };
      });
      // Se o server já tem líder salvo (team_slot=0), reidrata.
      if (full.team.length > 0) {
        setTeam(() => full.team.slice(0, 6).map((p) => ({
          ...makePet(p.species as Species, p.level, p.rarity as Rarity),
          uid: p.id,
          xp: p.xp ?? 0,
          hp: p.hp_current ?? p.hp_max,
          maxHp: p.hp_max,
          energy: p.energy ?? ENERGY_MAX,
        } as PetInstance)));
      }
    },
  });

  // ============= Cloud FULL BLOB (game_saves) =============
  // Hidrata state COMPLETO (items, missões, skins, buffs, party, bench)
  // e sobrescreve o cache local — evita rollback após F5 / trocar de dispositivo.
  const cloudBlobHydratedRef = useRef(false);
  const [cloudBlobReady, setCloudBlobReady] = useState(false);
  const [cloudSaveBlocked, setCloudSaveBlocked] = useState(false);
  const [cloudRetryTick, setCloudRetryTick] = useState(0);
  const [cloudQueueTick, setCloudQueueTick] = useState(0);
  const pendingCloudSave = useMemo(() => {
    void cloudQueueTick;
    return getPendingCloudSaveInfo();
  }, [cloudQueueTick]);
  useEffect(() => {
    if (cloudBlobHydratedRef.current) return;
    let cancelled = false;
    // Trava a gravação até confirmarmos o que existe na nuvem.
    setCloudSaveLock("aguardando leitura da nuvem");

    // Aplica um snapshot completo (vindo da nuvem OU do backup local).
    const applyBlob = (raw: unknown) => {
      const blob = raw as
        | { idle?: Partial<IdleState>; team?: PetInstance[]; restingBench?: PetInstance[]; party?: PetInstance[] }
        | null;
      if (!blob) return;
      if (blob.idle) {
        setIdle((prev) => {
          const merged: IdleState = { ...prev, ...blob.idle } as IdleState;
          if (!IDLE_MAPS[merged.currentMap]) merged.currentMap = "arena";
          const uskins = Array.isArray(merged.unlockedSkins) ? merged.unlockedSkins.slice() : [];
          if (!uskins.includes("default")) uskins.unshift("default");
          merged.unlockedSkins = uskins;
          merged.autoHeal = { ...(merged.autoHeal ?? { threshold: 0.5, enabled: true }), enabled: merged.autoHeal?.enabled ?? true };
          return merged;
        });
      }
      if (Array.isArray(blob.team) && blob.team.length > 0) {
        setTeam(blob.team.slice(0, 6));
      } else if (Array.isArray(blob.party) && blob.party.length > 0) {
        setTeam(blob.party.slice(0, 5));
      }
      if (Array.isArray(blob.restingBench)) {
        setRestingBench(blob.restingBench);
      } else if (Array.isArray(blob.party) && blob.party.length > 5) {
        setRestingBench(blob.party.slice(5));
      }
    };

    (async () => {
      const local = getBestLocalSnapshot();
      try {
        const { data: sess } = await supabase.auth.getSession();
        const uid = sess.session?.user?.id;
        if (!uid) {
          // Sem login não há nuvem para proteger.
          setCloudSaveLock(null);
          return;
        }
        const result = await fetchCloudSaveResult(uid);
        if (cancelled) return;

        // 🛡️ FALHA DE LEITURA: nunca liberar gravação — senão o autosave
        // apagaria o save bom da nuvem com o estado local/inicial.
        if (result.status === "error") {
          setCloudSaveLock(`leitura falhou: ${result.message}`);
          setCloudSaveBlocked(true);
          // Restaura o backup local para o jogador não voltar ao zero.
          if (local) {
            applyBlob(local.snapshot);
            cloudBlobHydratedRef.current = true;
            toast.info("💾 Progresso restaurado do backup deste aparelho — reenviaremos à nuvem assim que ela responder.", { duration: 10000 });
          } else {
            toast.error("Nuvem instável: seu progresso desta sessão fica protegido neste aparelho e será reenviado automaticamente.", { duration: 12000 });
          }
          return;
        }

        setCloudSaveBlocked(false);
        setCloudSaveLock(null);

        const cloudAt =
          result.status === "ok"
            ? Number((result.data as { savedAt?: unknown } | null)?.savedAt ?? 0) || 0
            : 0;
        const localAt = local?.savedAt ?? 0;

        // O snapshot local só vence quando é comprovadamente MAIS NOVO.
        // V18 SUPREME: A nuvem tem autoridade absoluta se for um update administrativo.
        const cloudIsAdmin = result.status === "ok" && ((result.data as any)?.adminUpdate || (result.data as any)?.idle?.version >= 10000);
        const forceSync = localStorage.getItem("rubym_admin_force_sync") === "true";
        
        if (!cloudIsAdmin && !forceSync && local && localAt > cloudAt) {
          applyBlob(local.snapshot);
          cloudBlobHydratedRef.current = true;
          toast.success("💾 Progresso restaurado do backup local.", { duration: 4000 });
          void attemptPendingCloudSave();
          return;
        }

        if (forceSync) {
           console.log("[V18] Force Sync Active: Ignoring local storage.");
        }

        if (result.status === "empty") {
          cloudBlobHydratedRef.current = true;
          return;
        }

        applyBlob(result.data);
        cloudBlobHydratedRef.current = true;
      } catch (e) {
        console.warn("[cloudBlob] hydrate failed", e);
        setCloudSaveLock("erro inesperado na leitura da nuvem");
        setCloudSaveBlocked(true);
        if (local) {
          applyBlob(local.snapshot);
          cloudBlobHydratedRef.current = true;
        }
      } finally {
        if (!cancelled) setCloudBlobReady(true);
      }
    })();
    return () => { cancelled = true; };
  }, [cloudRetryTick]);

  // Auto-retry: se a leitura da nuvem falhou (rede/permissão), tenta de novo
  // sozinho a cada 15s. Sem isso o jogador fica com o save PAUSADO até
  // apertar o botão manual — e acaba perdendo progresso da sessão.
  useEffect(() => {
    if (!cloudSaveBlocked) return;
    const iv = setInterval(() => {
      if (document.visibilityState !== "visible") return;
      cloudBlobHydratedRef.current = false;
      setCloudRetryTick((t) => t + 1);
    }, 15000);
    return () => clearInterval(iv);
  }, [cloudSaveBlocked]);


  // Autosave do BLOB completo — debounced (1.5s) sempre que idle/team/bench mudam.
  const buildFullBlob = useCallback(() => ({
    idle: idleRef.current,
    team: teamRef.current,
    restingBench,
    savedAt: Date.now(),
  }), [restingBench]);
  useEffect(() => {
    if (!cloudBlobReady || cloudSaveBlocked) return;
    const blob = buildFullBlob();
    scheduleCloudSync(blob);
    setCloudQueueTick((t) => t + 1);
  }, [idle.currentMap, idle.bank.gold, idle.bank.crystals, team.length, team[0]?.level, restingBench.length, cloudBlobReady, cloudSaveBlocked]);


  useEffect(() => {
    const id = setInterval(() => setCloudQueueTick((t) => t + 1), 5000);
    return () => clearInterval(id);
  }, []);

  // ⏱️ CHECKPOINT GARANTIDO — a cada 5 minutos força um save na nuvem,
  // mesmo que nada tenha mudado, para nunca existir uma janela longa sem backup.
  useEffect(() => {
    if (!cloudBlobReady) return;
    const CHECKPOINT_MS = 5 * 60 * 1000;
    const id = setInterval(() => {
      void (async () => {
        const blob = buildFullBlob();
        writeLocalBackup(blob); // rede de segurança no aparelho
        const ok = await pushCloudSaveNow(blob);
        setCloudQueueTick((t) => t + 1);
        if (ok) toast.success("✅ Checkpoint automático: progresso salvo na nuvem", { duration: 3000 });
        else toast.info("🛡️ Checkpoint guardado localmente; a nuvem será reenviada automaticamente.", { duration: 6000 });
      })();
    }, CHECKPOINT_MS);
    return () => clearInterval(id);
  }, [buildFullBlob, cloudBlobReady]);


  // Push imediato ao fechar aba / trocar aba (evita perder últimos segundos).
  useEffect(() => {
    const flush = () => {
      if (!cloudBlobReady) return;
      void pushCloudSaveNow(buildFullBlob());
      setCloudQueueTick((t) => t + 1);
    };
    window.addEventListener("beforeunload", flush);
    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") flush();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      window.removeEventListener("beforeunload", flush);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [buildFullBlob, cloudBlobReady]);


  // Salvamento urgente de level-up: quando qualquer Pokémon sobe de nível,
  // empurra snapshot pro banco quase na hora para evitar rollback ao fechar a aba.
  const lastPokemonLevelSyncKeyRef = useRef("");
  useEffect(() => {
    const all = [...team, ...restingBench, ...(idle.collection ?? [])];
    const key = all
      .map((p) => `${p.uid}:${Math.max(1, p.level ?? 1)}`)
      .sort()
      .join("|");
    if (!key || lastPokemonLevelSyncKeyRef.current === key) return;
    const hadPrevious = lastPokemonLevelSyncKeyRef.current !== "";
    lastPokemonLevelSyncKeyRef.current = key;
    if (!hadPrevious || serverSync.status !== "ready") return;
    const latestSave = (loadLatestValid<SaveShape>() ?? {}) as SaveShape;
    saveNow({ ...latestSave, party: [...team, ...restingBench] });
    void serverSync.pushNow();
  }, [team, restingBench, idle.collection, serverSync.status, serverSync.pushNow]);

  // ===== Incenso de Mel (buff temporário do Ninho de Marimbondo) =====
  const honeyUntilRef = useRef<number>(idle.buffs.honeyUntil ?? 0);
  const honeyRareUntilRef = useRef<number>(idle.buffs.honeyRareUntil ?? 0);
  useEffect(() => { honeyUntilRef.current = idle.buffs.honeyUntil ?? 0; }, [idle.buffs.honeyUntil]);
  useEffect(() => { honeyRareUntilRef.current = idle.buffs.honeyRareUntil ?? 0; }, [idle.buffs.honeyRareUntil]);
  const [honeyShop, setHoneyShop] = useState<null | { cocoonKey: string; x: number; y: number }>(null);
  const HONEY_DURATION_MS = 60 * 60 * 1000; // 1 hora por incenso ativado
  const HONEY_BONUS_NORMAL = 0.10; // +10% drop, xp, def, velocidade
  const HONEY_BONUS_RARE = 0.20;   // +20% (dobrado) para o incenso raro
  const honeyBonusNow = () => {
    const now = Date.now();
    if (now < honeyRareUntilRef.current) return HONEY_BONUS_RARE;
    if (now < honeyUntilRef.current) return HONEY_BONUS_NORMAL;
    return 0;
  };
  // Compat: HONEY_BONUS antigo — mantido para pequenos usos legados; call sites principais agora usam honeyBonusNow()
  const HONEY_BONUS = HONEY_BONUS_NORMAL;
  // ===== Colmeias (produção passiva no Ninho de Marimbondo) =====
  const HIVE_PRODUCTION_MS = 10 * 60 * 1000; // 10 minutos por ciclo
  const HIVE_SLOTS_PER_COCOON = 3;
  const HIVE_YIELD_PER_BEEDRILL = 2; // 2 incensos por Beedrill por ciclo
  const RARITY_TIER: Record<string, number> = { common: 0, uncommon: 1, rare: 2, epic: 3, legendary: 4, mythic: 5, mythic_shiny: 6 };
  const isRareTierPokemon = (r?: string | null) => (RARITY_TIER[r ?? "common"] ?? 0) >= 3; // epic+
  const uidsAssignedToHives = (): Set<string> => {
    const set = new Set<string>();
    const hives = idle.hives ?? {};
    for (const k of Object.keys(hives)) {
      for (const slot of hives[k].slots ?? []) if (slot?.uid) set.add(slot.uid);
    }
    return set;
  };
  // Re-render a cada 1s para atualizar contadores das colmeias e do incenso
  const [, forceHiveTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => forceHiveTick((n) => (n + 1) % 1_000_000), 1000);
    return () => clearInterval(t);
  }, []);
  // ===== Escolha do inicial (declarada cedo p/ gatear loops do jogo) =====
  const [starterChosen, setStarterChosen] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    try {
      if (localStorage.getItem("rubym.starter.chosen")) return true;
      // Fallback: se já existe party salvo (cloud ou local), considera escolhido
      // e persiste a flag para não reabrir o modal no próximo login/F5.
      const raw = localStorage.getItem("rubym.save.v2");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.party) && parsed.party.length > 0) {
          try { localStorage.setItem("rubym.starter.chosen", "1"); } catch { /* ignore */ }
          return true;
        }
      }
      return false;
    } catch { return true; }
  });
  const starterChosenRef = useRef(starterChosen);
  useEffect(() => { starterChosenRef.current = starterChosen; }, [starterChosen]);
  // ===== Descanso nas casas (Lar demora 1h, Casa Azul restaura em 5 min) =====
  const REST_DURATION_LAR_MS = 60 * 60 * 1000;      // 1 hora (Lar — restaura HP + energia grátis)
  const REST_DURATION_BLUE_MS = 5 * 60 * 1000;      // 5 minutos (Casa Azul — energia)
  const [restingUntil, setRestingUntil] = useState<number | null>(null);
  const [restingStart, setRestingStart] = useState<number | null>(null);
  const [restingKind, setRestingKind] = useState<"lar" | "azul" | null>(null);
  const [restFullRecovery, setRestFullRecovery] = useState<boolean>(false);
  const restingRef = useRef<boolean>(false);
  useEffect(() => { restingRef.current = restingUntil !== null; }, [restingUntil]);
  // ===== Interação com prédios do mundo =====
  const [nearBuilding, setNearBuilding] = useState<"lab" | "lar" | "azul" | "gym" | null>(null);
  const [eggOpenResult, setEggOpenResult] = useState<{ sp: string; rarity: string } | null>(null);

  // ===== Detalhes de Pokémon (modal ao clicar no card) + Casa Azul picker =====
  const [petDetailUid, setPetDetailUid] = useState<string | null>(null);
  const [azulPickerOpen, setAzulPickerOpen] = useState(false);
  const [azulPreselectUid, setAzulPreselectUid] = useState<string | null>(null);
  const [colecaoDetailUid, setColecaoDetailUid] = useState<string | null>(null);
  const [statsCardPet, setStatsCardPet] = useState<PetInstance | null>(null);
  const [eventToast, setEventToast] = useState<{ id: number; icon: string; title: string; sub?: string; color: string } | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [showAutoSettings, setShowAutoSettings] = useState(false);
  const [attackAnim, setAttackAnim] = useState<{ id: number; fromX: number; fromY: number; toX: number; toY: number; ts: number; crit: boolean; element: ElementFx } | null>(null);
  const [enemyAttackAnim, setEnemyAttackAnim] = useState<{ id: number; fromX: number; fromY: number; toX: number; toY: number; ts: number; element: ElementFx } | null>(null);
  const [captureAnim, setCaptureAnim] = useState<{ id: number; fromX: number; fromY: number; toX: number; toY: number; ts: number; ballImg: string; success: boolean } | null>(null);
  const [, setAnimTick] = useState(0);
  const attackAnimIdRef = useRef(1);
  useEffect(() => {
    if (!attackAnim && !enemyAttackAnim && !captureAnim) return;
    let raf: number;
    const loop = () => { setAnimTick((n) => n + 1); raf = requestAnimationFrame(loop); };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [attackAnim, enemyAttackAnim, captureAnim]);
  const autoBattleRef = useRef(idle.autoBattle ?? { enabled: true, useBall: true, preferredBall: "auto" as const, captureHpPct: 1 });
  useEffect(() => { if (idle.autoBattle) autoBattleRef.current = idle.autoBattle; }, [idle.autoBattle]);
  const onPickTeamFromColecao = (entry: CollectionEntry) => {
    const newPet = { ...makePet(entry.species, entry.level, entry.rarity), uid: entry.uid, xp: entry.xp ?? 0, traits: entry.traits ?? [], event: entry.event } as PetInstance;
    setTeam((tm) => {
      const idx = tm.findIndex((p) => p.uid === entry.uid);
      if (idx >= 0) {
        const arr = [...tm];
        const [p] = arr.splice(idx, 1);
        setLeaderHp(calcIdleMaxHp(p));
        return [p, ...arr];
      }
      if (tm.length >= 6) {
        const arr = tm.slice(0, 4);
        setLeaderHp(calcIdleMaxHp(newPet));
        return [newPet, ...arr];
      }
      setLeaderHp(calcIdleMaxHp(newPet));
      return [newPet, ...tm];
    });
    setTab("batalha");
  };
  const eventToastIdRef = useRef(1);
  const pushEvent = (icon: string, title: string, sub?: string, color: string = "#f5cf6b") => {
    const id = eventToastIdRef.current++;
    setEventToast({ id, icon, title, sub, color });
    setTimeout(() => setEventToast((t) => (t && t.id === id ? null : t)), 7000);
  };
  const [energyTick, setEnergyTick] = useState(0);
  useEffect(() => {
    const iv = setInterval(() => setEnergyTick((n) => n + 1), 1000);
    return () => clearInterval(iv);
  }, []);
  // Dreno de energia em tempo real do LÍDER enquanto auto-battle está ativo.
  // Escala por raridade: comum ~5min, uncommon ~8min, raro ~15min, épico ~25min,
  // lendário ~35min, mítico não cansa. Tick a cada 1s para display suave.
  useEffect(() => {
    const iv = setInterval(() => {
      if (!(autoBattleRef.current?.enabled)) return;
      setTeam((tm) => {
        if (tm.length === 0) return tm;
        const now = Date.now();
        const leader = tm[0] as PetEnergyExt;
        const drain = energyDrainPerSec(leader.rarity);
        if (drain <= 0) return tm; // míticos não cansam
        if (leader.azulRestUntil && leader.azulRestUntil > now) return tm;
        const cur = petCurrentEnergy(leader, now, { active: true });
        if (cur <= 0) return tm;
        const next = Math.max(0, cur - drain);
        const updated = { ...leader, energy: next, energyRegenAt: now } as PetInstance;
        return [updated, ...tm.slice(1)];
      });
    }, 1000);
    return () => clearInterval(iv);
  }, []);
  // Fecha a caverna: expulsa o treinador quando o ciclo terminar
  useEffect(() => {
    if (idle.currentMap !== "caverna") return;
    const w = caveWindow();
    if (!w.open) {
      setIdle((s) => ({ ...s, currentMap: "arena" }));
      pushChat(`⛰ Caverna Rochosa fechou. Você foi levado ao Vale Verdejante.`, "info");
      pushEvent("⛰", "CAVERNA FECHADA", "Volte quando reabrir", "#a08770");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [energyTick, idle.currentMap]);

  // Governante NPC — abre a cutscene de diálogo ao entrar no Salão do Governante.
  const [governanteOpen, setGovernanteOpen] = useState(false);
  useEffect(() => {
    // Zona sagrada — limpa qualquer inimigo que tenha ficado do mapa anterior.
    if (idle.currentMap === "absol_start" || idle.currentMap === "governante_hall") {
      setEnemies([]);
    }
    if (idle.currentMap !== "governante_hall") return;
    setGovernanteOpen(true);
  }, [idle.currentMap]);

  // Se algum pokémon do time ficar sem energia, ele é enviado automaticamente
  // para a Casa Azul (5💎 = 5min; sem cristais = 1h grátis). Assim ele sai
  // do time e o próximo assume — o treinador não fica preso.
  useEffect(() => {
    const now = Date.now();
    const exhausted = team.find((p) => {
      const pe = p as PetEnergyExt;
      if (pe.azulRestUntil && pe.azulRestUntil > now) return false;
      return petIsExhausted(p, now, { active: true });
    });
    if (!exhausted) return;
    pushChat(`⚡ ${exhausted.species.replace(/_/g, " ").toUpperCase()} sem energia — indo para a Casa Azul.`, "info");
    restPetInAzul(exhausted.uid, { auto: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [energyTick]);

  // (removido) bônus inicial de ouro/cristal — jogador começa com 0 ouro e 30 💎





  type Enemy = { sp: Species; hp: number; maxHp: number; id: number; x: number; y: number; face: "left" | "right"; aggressive?: boolean; aggroR?: number; elite?: boolean; level: number; rarity: Rarity; eventLegendary?: boolean; rider?: boolean; guardian?: boolean; apex?: boolean; disguise?: Species; revealed?: boolean; menace?: boolean; mtcBoss?: boolean; xpTitle?: boolean };
  const [enemies, setEnemies] = useState<Enemy[]>([]);
  type FxKind = "myDmg" | "enemyDmg" | "xp" | "gold" | "capture" | "crit";
  const [fx, setFx] = useState<{ id: number; x: number; y: number; text: string; kind: FxKind }[]>([]);
  type Chest = { id: number; x: number; y: number; opened: boolean; openedAt?: number; purple?: boolean };
  const [chests, setChests] = useState<Chest[]>([]);
  
  const enemyIdRef = useRef(1);
  const chestIdRef = useRef(1);
  const fxIdRef = useRef(1);
  // 🔻 Fragmento Vermelho — sprites que voam do pokémon derrotado até o painel COLETA
  const coletaRef = useRef<HTMLDivElement | null>(null);
  const camViewRef = useRef({ camX: 0, camY: 0, zoom: 1 });
  const shardIdRef = useRef(1);
  const [redShardFx, setRedShardFx] = useState<{ id: number; x: number; y: number; dx: number; dy: number; delay: number }[]>([]);
  const flyRedShards = (worldX: number, worldY: number, qty: number) => {
    const vp = viewportRef.current?.getBoundingClientRect();
    const dest = coletaRef.current?.getBoundingClientRect();
    if (!vp || !dest) return;
    const { camX, camY, zoom } = camViewRef.current;
    const sx = vp.left + (worldX - camX) * zoom;
    const sy = vp.top + (worldY - camY) * zoom;
    if (sx < vp.left - 80 || sx > vp.right + 80 || sy < vp.top - 80 || sy > vp.bottom + 80) return;
    const tx = dest.left + dest.width / 2;
    const ty = dest.top + dest.height / 2;
    const batch = Array.from({ length: Math.min(5, qty) }, (_, i) => {
      const jx = (Math.random() - 0.5) * 46;
      const jy = (Math.random() - 0.5) * 30;
      return {
        id: shardIdRef.current++,
        x: sx + jx, y: sy + jy,
        dx: tx - (sx + jx), dy: ty - (sy + jy),
        delay: i * 90,
      };
    });
    setRedShardFx((p) => [...p.slice(-40), ...batch]);
    const ids = new Set(batch.map((b) => b.id));
    window.setTimeout(() => setRedShardFx((p) => p.filter((s) => !ids.has(s.id))), 1500 + batch.length * 90);
  };
  const [tab, setTab] = useState<"inicio" | "wiki" | "pokemon" | "mochila" | "batalha" | "melhorias" | "colecao" | "pokedex" | "loja" | "wallet" | "market" | "config" | "tarefas">("batalha");
  const [bagOpen, setBagOpen] = useState(false);
  const [skinId, setSkinId] = useState<string>(() => {
    if (typeof window === "undefined") return "default";
    try { return localStorage.getItem(SKIN_KEY) || "default"; } catch { return "default"; }
  });
  useEffect(() => {
    try { localStorage.setItem(SKIN_KEY, skinId); } catch { /* ignore */ }
  }, [skinId]);
  const skinUrl = SKINS.find((s) => s.id === skinId)?.url ?? null;
  // Auto-battle / chat / WASD
  const [auto, setAuto] = useState(true);
  const autoRef = useRef(true);
  useEffect(() => { autoRef.current = auto; }, [auto]);
  const [blackEggHudOpen, setBlackEggHudOpen] = useState(false);
  // Acumula XP/ouro/kills por mapa e anuncia no chat só a cada ~30s (evita spam e sobrecarga).
  const [sessionGold, setSessionGold] = useState(0);
  const [sessionCrystals, setSessionCrystals] = useState(0);
  const [sessionRedShards, setSessionRedShards] = useState(0);
  const [sessionKills, setSessionKills] = useState(0);

  const xpAccumRef = useRef({ xp: 0, gold: 0, kills: 0, map: "" as string });
  useEffect(() => {
    const id = setInterval(() => {
      const a = xpAccumRef.current;
      if (a.kills > 0) {
        pushChat(`📊 Resumo (${a.map || "mapa"}): ${a.kills} kills · +${a.xp.toLocaleString()} EXP · +${a.gold.toLocaleString()} ouro`, "info");
        xpAccumRef.current = { xp: 0, gold: 0, kills: 0, map: "" };
      }
    }, 30000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ==== ÁUDIO ====
  const [audioSettings, setAudioSettings] = useState(() => {
    if (typeof window === "undefined") return { music: true, sfx: true, musicVol: 0.20, sfxVol: 0.45 };
    try {
      const raw = localStorage.getItem("rubym.idle.audio");
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          if (parsed && typeof parsed === 'object') {
            return { music: true, sfx: true, musicVol: 0.2, sfxVol: 0.45, ...parsed };
          }
        } catch (e) { console.error("Erro ao carregar audioSettings", e); }
      }
      return { music: true, sfx: true, musicVol: 0.2, sfxVol: 0.45 };
    } catch { /* ignore */ }
    return { music: true, sfx: true, musicVol: 0.20, sfxVol: 0.45 };
  });
  useEffect(() => {
    try { localStorage.setItem("rubym.idle.audio", JSON.stringify(audioSettings)); } catch { /* ignore */ }
  }, [audioSettings]);
  const bgmRef = useRef<HTMLAudioElement | null>(null);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const a = new Audio(bgmUrl);
    a.loop = true;
    a.volume = audioSettings.musicVol;
    bgmRef.current = a;
    // autoplay policy: só toca após primeira interação
    const start = () => {
      if (!audioSettings.music) return;
      a.play().catch(() => { /* ignora */ });
      window.removeEventListener("pointerdown", start);
      window.removeEventListener("keydown", start);
    };
    window.addEventListener("pointerdown", start);
    window.addEventListener("keydown", start);
    return () => {
      window.removeEventListener("pointerdown", start);
      window.removeEventListener("keydown", start);
      a.pause(); a.src = "";
    };
  }, []); // eslint-disable-line
  useEffect(() => {
    const a = bgmRef.current; if (!a) return;
    a.volume = audioSettings.musicVol;
    if (blackEggHudOpen || !audioSettings.music) { a.pause(); } else { a.play().catch(() => {}); }
  }, [audioSettings.music, audioSettings.musicVol, blackEggHudOpen]);
  const eggMusicRef = useRef<HTMLAudioElement | null>(null);
  const openBlackEggHud = useCallback(() => {
    const bgm = bgmRef.current;
    if (bgm) bgm.pause();
    let eggMusic = eggMusicRef.current;
    if (!eggMusic) {
      eggMusic = new Audio(eggTransitusAsset.url);
      eggMusic.loop = true;
      eggMusic.preload = "auto";
      eggMusicRef.current = eggMusic;
    }
    eggMusic.volume = audioSettings.music ? Math.min(1, audioSettings.musicVol * 1.25) : 0;
    eggMusic.currentTime = 0;
    eggMusic.play().catch(() => { /* clique seguinte tenta de novo */ });
    setBlackEggHudOpen(true);
  }, [audioSettings.music, audioSettings.musicVol]);
  useEffect(() => {
    const eggMusic = eggMusicRef.current;
    if (eggMusic) eggMusic.volume = audioSettings.music ? Math.min(1, audioSettings.musicVol * 1.25) : 0;
  }, [audioSettings.music, audioSettings.musicVol]);
  useEffect(() => {
    if (blackEggHudOpen) return;
    const eggMusic = eggMusicRef.current;
    if (eggMusic) {
      try { eggMusic.pause(); eggMusic.currentTime = 0; } catch { /* ignore */ }
    }
    const bgm = bgmRef.current;
    if (bgm && audioSettings.music) bgm.play().catch(() => {});
  }, [blackEggHudOpen, audioSettings.music]);
  const playSfx = (url: string) => {
    if (!audioSettings.sfx) return;
    try {
      const a = new Audio(url);
      a.volume = audioSettings.sfxVol;
      a.play().catch(() => {});
    } catch { /* ignore */ }
  };
  const playClick = () => playSfx(sfxClickUrl);
  const playLevelUp = () => playSfx(sfxLevelUpUrl);
  const playBonus = () => playSfx(sfxBonusUrl);
  const playChestOpen = () => playSfx(sfxChestOpenUrl);

  // Weather cycle: 20 min de NEVE → 30 min limpo → repete
  const [weather, setWeather] = useState<"rain" | "snow" | "clear">("snow");
  useEffect(() => {
    const SNOW_MS = 20 * 60 * 1000;
    const CLEAR_MS = 30 * 60 * 1000;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    const cycle = (phase: "snow" | "clear") => {
      if (cancelled) return;
      if (phase === "snow") {
        setWeather("snow");
        pushChat("❄ Uma nevasca começou a cair sobre a região...", "info");
        timer = setTimeout(() => cycle("clear"), SNOW_MS);
      } else {
        setWeather("clear");
        pushChat("☀ A nevasca passou. O clima está limpo agora.", "info");
        timer = setTimeout(() => cycle("snow"), CLEAR_MS);
      }
    };
    cycle("snow");
    // Aviso a cada 30 minutos sobre criaturas poderosas
    const warn = setInterval(() => {
      pushChat("⚠ Criaturas MUITO PODEROSAS foram avistadas por perto... fique alerta!", "info");
    }, 30 * 60 * 1000);
    return () => { cancelled = true; clearTimeout(timer); clearInterval(warn); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Partículas pré-geradas
  const rainDrops = useMemo(() => {
    const arr: { left: number; delay: number; dur: number; len: number; op: number; w: number }[] = [];
    for (let i = 0; i < 140; i++) {
      const near = Math.random() < 0.35;
      arr.push({
        left: Math.random() * 110 - 5,
        delay: Math.random() * 1.4,
        dur: near ? 0.35 + Math.random() * 0.2 : 0.55 + Math.random() * 0.35,
        len: near ? 18 + Math.round(Math.random() * 12) : 8 + Math.round(Math.random() * 10),
        op: near ? 0.55 + Math.random() * 0.3 : 0.18 + Math.random() * 0.25,
        w: near ? 1.4 : 1,
      });
    }
    return arr;
  }, []);
  const snowFlakes = useMemo(() => {
    const arr: { left: number; delay: number; dur: number; size: number; drift: number; op: number }[] = [];
    for (let i = 0; i < 70; i++) {
      arr.push({
        left: Math.random() * 100,
        delay: Math.random() * 6,
        dur: 5 + Math.random() * 6,
        size: 2 + Math.round(Math.random() * 3),
        drift: (Math.random() * 40 - 20),
        op: 0.55 + Math.random() * 0.45,
      });
    }
    return arr;
  }, []);


  type ChatMsg = { id: number; text: string; kind: "info" | "dmg" | "hit" | "cap" | "lv" | "chest" | "capture"; tone?: "info" | "cap" | "hit" };
  const [chat, setChat] = useState<ChatMsg[]>([]);
  const [chatOpen, setChatOpen] = useState(true);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  const chatIdRef = useRef(1);
  const pushChat = (text: string, kind: ChatMsg["kind"] = "info") => {
    setChat((prev) => {
      const next = [...prev, { id: chatIdRef.current++, text, kind }];
      return next.slice(-40);
    });
  };

  // ============================================================
  // AVISO GLOBAL — BANIMENTOS & ESTRUTURAÇÃO DO SERVIDOR
  // Roda a cada 5 minutos, alternando mensagens.
  // ============================================================
  const banNoticeIdxRef = useRef(0);
  useEffect(() => {
    const NOTICES: string[] = [
      "🌟 VEM AI A 3° SEASON O SHOW ESTA PRA COMEÇAR! Fiquem atentos às novidades no Wiki e no Banco Medieval. 🎪",
      "🚫 Um agradecimento especial aos gênios que passaram horas tentando furar nossa segurança... e conseguiram exatamente NADA. Contas banidas, tempo perdido. Valeu pelo esforço! 😄",
      "⚙ Estruturação em andamento: balanceamento, anti-cheat e performance sendo reforçados a cada ciclo. Quem tentar trapacear vira mais um nome na lista de banidos.",
      "🏆 Enquanto uns evoluíram de verdade, outros evoluíram só no ban. Obrigado pela dedicação em perder tempo — o servidor continua de pé, e vocês não. 😉",
      "🔒 Sistema anti-fraude ativo 24h. Toda alteração suspeita é registrada e resulta em banimento permanente. Servidor em constante estruturação e balanceamento.",
    ];

    const fire = () => {
      const msg = NOTICES[banNoticeIdxRef.current % NOTICES.length];
      banNoticeIdxRef.current++;
      pushChat(msg, "lv");
    };
    const t = setTimeout(fire, 8000);
    const iv = setInterval(fire, 5 * 60 * 1000);
    return () => {
      clearTimeout(t);
      clearInterval(iv);
    };
  }, []);



  // ============================================================
  // AVISO GLOBAL — ODISSÉIA ODDISH
  // O evento abre no mesmo horário pra todo mundo (startedAt fixo).
  // Aqui despachamos toasts/chat sincronizados: T-5min, T-1min, ABERTO, FECHADO.
  // ============================================================
  const oddishAnnouncedRef = useRef<Set<string>>(new Set());
  // Guarda o mapa de origem antes do jogador entrar na Odisséia Oddish;
  // ao fechar o portal, devolvemos ele pra esse mapa automaticamente.
  const oddishReturnMapRef = useRef<IdleMapId | null>(null);
  useEffect(() => {
    const check = () => {
      const st = oddishEventStatus();
      // Se o evento está desligado/encerrado, apenas retira quem ainda está no mapa.
      if (!ODDISH_EVENT.enabled || st.phase === "finished" || st.phase === "disabled") {
        setIdle((s) => {
          if (s.currentMap !== "oddish_o1" && s.currentMap !== "oddish_o2" && s.currentMap !== "oddish_o3") return s;
          const back = oddishReturnMapRef.current ?? "arena";
          oddishReturnMapRef.current = null;
          try { window.dispatchEvent(new CustomEvent("rubym:toast", { detail: { title: "Evento encerrado", body: "Odisséia Oddish acabou — de volta ao mapa anterior.", tone: "info" } })); } catch {}
          return { ...s, currentMap: back };
        });
        return;
      }
      const cycleMs = ODDISH_EVENT.cycleHours * 60 * 60 * 1000;
      const cycleIndex = Math.floor(st.elapsedMs / cycleMs);
      const key = (k: string) => `${cycleIndex}:${k}`;
      const seen = oddishAnnouncedRef.current;
      if (st.phase === "closed") {
        const ms = st.msUntilChange;
        if (ms <= 5 * 60 * 1000 && ms > 4 * 60 * 1000 && !seen.has(key("t5"))) {
          seen.add(key("t5"));
          try { window.dispatchEvent(new CustomEvent("rubym:toast", { detail: { title: "ODISSÉIA ODDISH", body: "Portal abre em 5 minutos!", tone: "info" } })); } catch {}
        }
        if (ms <= 60 * 1000 && ms > 30 * 1000 && !seen.has(key("t1"))) {
          seen.add(key("t1"));
          try { window.dispatchEvent(new CustomEvent("rubym:toast", { detail: { title: "ODISSÉIA ODDISH", body: "1 minuto para abrir!", tone: "warn" } })); } catch {}
        }
      }
      if (st.phase === "open" && !seen.has(key("open"))) {
        seen.add(key("open"));
        try { window.dispatchEvent(new CustomEvent("rubym:toast", { detail: { title: "🌿 PORTAL ABERTO!", body: "ODISSÉIA ODDISH — janela de 30 min ativa pra geral!", tone: "success" } })); } catch {}
      }
      if (st.phase === "open" && st.msUntilChange <= 60 * 1000 && st.msUntilChange > 30 * 1000 && !seen.has(key("closing"))) {
        seen.add(key("closing"));
      }
      // Auto-retorno: portal fechou e o jogador ainda está no mapa do evento.
      if (st.phase !== "open") {
        setIdle((s) => {
          if (s.currentMap !== "oddish_o1" && s.currentMap !== "oddish_o2" && s.currentMap !== "oddish_o3") return s;
          const back = oddishReturnMapRef.current ?? "arena";
          oddishReturnMapRef.current = null;
          try { window.dispatchEvent(new CustomEvent("rubym:toast", { detail: { title: "Portal fechado", body: "Você foi teletransportado de volta.", tone: "info" } })); } catch {}
          return { ...s, currentMap: back };
        });
      }
    };
    check();
    const iv = setInterval(check, 10_000);
    return () => clearInterval(iv);
  }, []);

  // Chat global (cooldown 10 min por jogador)
  const [chatInput, setChatInput] = useState("");
  const [chatCooldownUntil, setChatCooldownUntil] = useState<number>(0);
  const [chatFilter, setChatFilter] = useState<"all" | "system" | "world" | "captures">("all");
  const [teamCollapsed, setTeamCollapsed] = useState<boolean>(false);
  const [chatTick, setChatTick] = useState(0);
  const [grassOddishSplash, setGrassOddishSplash] = useState<boolean>(false);
  const [oddishNoStone, setOddishNoStone] = useState<{ have: number; need: number } | null>(null);
  const [oddishConfirm, setOddishConfirm] = useState<{ have: number; need: number } | null>(null);
  const [oddishRankOpen, setOddishRankOpen] = useState<boolean>(false);
  const [oddishRankRows, setOddishRankRows] = useState<OddishRankRow[]>([]);
  const [oddishRankLoading, setOddishRankLoading] = useState<boolean>(false);
  const [showRank, setShowRank] = useState(false);
  const enterGrassOddish = () => {
    if (!ODDISH_EVENT.enabled) {
      try { window.dispatchEvent(new CustomEvent("rubym:toast", { detail: { title: "🌿 Grass Oddish", body: "Evento encerrado.", tone: "warn" } })); } catch {}
      setOddishConfirm(null);
      return;
    }
    setIdle((cur) => {
      const need = 20;
      const have = cur.items?.stone_grass ?? 0;
      if (have < need) { setOddishNoStone({ have, need }); return cur; }
      try { window.dispatchEvent(new CustomEvent("rubym:toast", { detail: { title: "🌿 Grass Oddish", body: "Entrou no evento! -20 Stone Verdejante.", tone: "success" } })); } catch {}
      return {
        ...cur,
        items: { ...cur.items, stone_grass: (cur.items.stone_grass ?? 0) - need },
        grassOddishReturnMap: cur.currentMap === "grass_oddish" ? cur.grassOddishReturnMap : cur.currentMap,
        currentMap: "grass_oddish",
      };
    });
    setOddishConfirm(null);
  };
  // Auto-eject: evento encerrado → volta pra arena e bloqueia.
  useEffect(() => {
    if (ODDISH_EVENT.enabled) return;
    const inEvent = idle.currentMap === "grass_oddish" || idle.currentMap === "oddish_o1" || idle.currentMap === "oddish_o2" || idle.currentMap === "oddish_o3";
    if (!inEvent) return;
    setIdle((s) => ({ ...s, currentMap: "arena", grassOddishReturnMap: undefined }));
    try { window.dispatchEvent(new CustomEvent("rubym:toast", { detail: { title: "🌿 Grass Oddish", body: "Evento encerrado. Você voltou para a Arena.", tone: "info" } })); } catch {}
  }, [idle.currentMap]);
  useEffect(() => {
    if (idle.currentMap !== "grass_oddish") return;
    setGrassOddishSplash(true);
    const t = setTimeout(() => setGrassOddishSplash(false), 4200);
    return () => clearTimeout(t);
  }, [idle.currentMap]);
  useEffect(() => {
    if (chatCooldownUntil <= Date.now()) return;
    const iv = setInterval(() => setChatTick((n) => n + 1), 1000);
    return () => clearInterval(iv);
  }, [chatCooldownUntil]);

  // WASD
  const keysRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    const kd = (e: KeyboardEvent) => {
      if (anciaoForcedRef.current) return;
      const k = e.key.toLowerCase();
      if (["w", "a", "s", "d", "arrowup", "arrowleft", "arrowdown", "arrowright"].includes(k)) {
        // ao andar manualmente, marca o alvo atual como "evitado" por um tempo,
        // para que o auto procure outro pokémon quando reativado
        const cur = attackTargetIdRef.current;
        if (cur != null) {
          blacklistRef.current.set(cur, Date.now() + 25000);
        }
        keysRef.current.add(k);
      }
    };
    const ku = (e: KeyboardEvent) => { keysRef.current.delete(e.key.toLowerCase()); };
    window.addEventListener("keydown", kd);
    window.addEventListener("keyup", ku);
    return () => { window.removeEventListener("keydown", kd); window.removeEventListener("keyup", ku); };
  }, []);

  // ---- Mundo em pixels + câmera que segue o treinador ----
  const WORLD_W = idle.currentMap === "deserto_purpura" ? 3840 : 1920;
  const WORLD_H = idle.currentMap === "deserto_purpura" ? 3840 : 1920;
              type GateDef = {
                key: string;
                target: IdleMapId;
                x: number; y: number;
                arriveX: number; arriveY: number;
                color: string;
              };
              // Fluxo: arena → praia → neve → deserto → caverna
              const gatesByMap: Record<IdleMapId, GateDef[]> = {
                arena: [
                  { key: "to-praia", target: "praia",    x: WORLD_W - 60, y: 60,           arriveX: 100,          arriveY: WORLD_H - 100, color: "#5cd3ff" },
                  { key: "to-neve",  target: "neve",     x: WORLD_W / 2,  y: 40,           arriveX: WORLD_W / 2,  arriveY: WORLD_H - 100, color: "#9bd8ff" },
                  { key: "to-terra", target: "terra",    x: WORLD_W / 2,  y: WORLD_H - 40, arriveX: WORLD_W / 2,  arriveY: 100,           color: "#d9873a" },
                  { key: "to-vale_rochas", target: "vale_rochas", x: 60,  y: 60,           arriveX: WORLD_W - 100, arriveY: WORLD_H - 100, color: "#a08770" },
                ],
                terra: [
                  { key: "to-arena",    target: "arena",    x: WORLD_W / 2, y: 40,           arriveX: WORLD_W / 2, arriveY: WORLD_H - 100, color: "#7ef27a" },
                  { key: "to-venofogo", target: "venofogo", x: WORLD_W / 2, y: WORLD_H - 40, arriveX: WORLD_W / 2, arriveY: 100,           color: "#ff5c2e" },
                  { key: "to-fantasma", target: "fantasma", x: 60,          y: WORLD_H / 2,  arriveX: WORLD_W - 100, arriveY: WORLD_H / 2, color: "#a259ff" },
                  { key: "to-deserto_purpura", target: "deserto_purpura", x: WORLD_W - 60, y: WORLD_H / 2, arriveX: 100, arriveY: WORLD_H / 2, color: "#b45adc" },
                ],
                deserto_purpura: [
                  { key: "to-terra", target: "terra", x: 60, y: WORLD_H / 2, arriveX: WORLD_W - 100, arriveY: WORLD_H / 2, color: "#d9873a" },
                  { key: "to-terry", target: "terry", x: WORLD_W - 60, y: WORLD_H / 2, arriveX: 100, arriveY: WORLD_H / 2, color: "#c9a76a" },
                ],
                terry: [
                  { key: "to-deserto_purpura", target: "deserto_purpura", x: 60, y: WORLD_H / 2, arriveX: WORLD_W - 100, arriveY: WORLD_H / 2, color: "#b45adc" },
                  { key: "to-n2", target: "n2", x: WORLD_W - 60, y: WORLD_H / 2, arriveX: 100, arriveY: WORLD_H / 2, color: "#d9a86a" },
                ],
                n2: [
                  { key: "to-terry", target: "terry", x: 60, y: WORLD_H / 2, arriveX: WORLD_W - 100, arriveY: WORLD_H / 2, color: "#c9a76a" },
                  { key: "to-n3", target: "n3", x: WORLD_W - 60, y: WORLD_H / 2, arriveX: 100, arriveY: WORLD_H / 2, color: "#e8b878" },
                ],
                n3: [
                  { key: "to-n2", target: "n2", x: 60, y: WORLD_H / 2, arriveX: WORLD_W - 100, arriveY: WORLD_H / 2, color: "#d9a86a" },
                  { key: "to-pantano_fogo", target: "pantano_fogo", x: WORLD_W - 60, y: WORLD_H / 2, arriveX: 100, arriveY: WORLD_H / 2, color: "#ff4a1a" },
                ],
                pantano_fogo: [
                  { key: "to-n3", target: "n3", x: 60, y: WORLD_H / 2, arriveX: WORLD_W - 100, arriveY: WORLD_H / 2, color: "#e8b878" },
                  { key: "to-abismo_gelo", target: "abismo_gelo", x: WORLD_W - 60, y: WORLD_H / 2, arriveX: 100, arriveY: WORLD_H / 2, color: "#78c8ff" },
                ],
                abismo_gelo: [
                  { key: "ag-back", target: "pantano_fogo", x: 60, y: WORLD_H / 2, arriveX: WORLD_W - 100, arriveY: WORLD_H / 2, color: "#ff4a1a" },
                  { key: "ag-next", target: "abismo_veneno", x: WORLD_W - 60, y: WORLD_H / 2, arriveX: 100, arriveY: WORLD_H / 2, color: "#aa50dc" },
                ],
                abismo_veneno: [
                  { key: "av-back", target: "abismo_gelo", x: 60, y: WORLD_H / 2, arriveX: WORLD_W - 100, arriveY: WORLD_H / 2, color: "#78c8ff" },
                  { key: "av-next", target: "abismo_raio", x: WORLD_W - 60, y: WORLD_H / 2, arriveX: 100, arriveY: WORLD_H / 2, color: "#ffdc50" },
                ],
                abismo_raio: [
                  { key: "ar-back", target: "abismo_veneno", x: 60, y: WORLD_H / 2, arriveX: WORLD_W - 100, arriveY: WORLD_H / 2, color: "#aa50dc" },
                  { key: "ar-next", target: "abismo_sombra", x: WORLD_W - 60, y: WORLD_H / 2, arriveX: 100, arriveY: WORLD_H / 2, color: "#28143c" },
                ],
                abismo_sombra: [
                  { key: "as-back", target: "abismo_raio", x: 60, y: WORLD_H / 2, arriveX: WORLD_W - 100, arriveY: WORLD_H / 2, color: "#ffdc50" },
                  { key: "as-next", target: "abismo_dragao", x: WORLD_W - 60, y: WORLD_H / 2, arriveX: 100, arriveY: WORLD_H / 2, color: "#ff9628" },
                ],
                abismo_dragao: [
                  { key: "ad-back", target: "abismo_sombra", x: 60, y: WORLD_H / 2, arriveX: WORLD_W - 100, arriveY: WORLD_H / 2, color: "#28143c" },
                  { key: "ad-next", target: "cadeia_ab", x: WORLD_W - 60, y: WORLD_H / 2, arriveX: 100, arriveY: WORLD_H / 2, color: "#8ac9ff" },
                ],
                cadeia_ab: [
                  { key: "cab-back", target: "abismo_dragao", x: 60, y: WORLD_H / 2, arriveX: WORLD_W - 100, arriveY: WORLD_H / 2, color: "#ff9628" },
                  { key: "cab-next", target: "cadeia_ab1", x: WORLD_W - 60, y: WORLD_H / 2, arriveX: 100, arriveY: WORLD_H / 2, color: "#c084fc" },
                ],
                cadeia_ab1: [
                  { key: "cab1-back", target: "cadeia_ab", x: 60, y: WORLD_H / 2, arriveX: WORLD_W - 100, arriveY: WORLD_H / 2, color: "#8ac9ff" },
                  { key: "cab1-next", target: "cadeia_f1", x: WORLD_W - 60, y: WORLD_H / 2, arriveX: 100, arriveY: WORLD_H / 2, color: "#ff5c2e" },
                ],
                cadeia_f1: [
                  { key: "cf1-back", target: "cadeia_ab1", x: 60, y: WORLD_H / 2, arriveX: WORLD_W - 100, arriveY: WORLD_H / 2, color: "#c084fc" },
                ],
                evento_myth: [],
                oddish_o1: [
                  { key: "o1-o3", target: "oddish_o3", x: WORLD_W - 80, y: 80, arriveX: WORLD_W / 2, arriveY: WORLD_H - 120, color: "#c084fc" },
                ],
                oddish_o2: [
                  { key: "o2-o3", target: "oddish_o3", x: WORLD_W - 80, y: 80, arriveX: WORLD_W / 2, arriveY: WORLD_H - 120, color: "#c084fc" },
                ],
                oddish_o3: [
                  { key: "o3-o1", target: "oddish_o1", x: 80, y: WORLD_H - 100, arriveX: WORLD_W - 120, arriveY: 120, color: "#7ef27a" },
                  { key: "o3-o2", target: "oddish_o2", x: WORLD_W - 80, y: WORLD_H - 100, arriveX: 120, arriveY: 120, color: "#7ef27a" },
                ],
                grass_oddish: [],
                vale_fragmentos: [],
                gym_carmesim: [
                  { key: "gym1-gym2", target: "gym_gelo_sombra", x: WORLD_W - 80, y: 120, arriveX: 140, arriveY: WORLD_H - 160, color: "#9fe8ff" },
                ],
                gym_gelo_sombra: [
                  { key: "gym2-gym1", target: "gym_carmesim", x: 80, y: WORLD_H - 120, arriveX: WORLD_W - 140, arriveY: 160, color: "#ff8b8b" },
                  { key: "gym2-gym3", target: "gym_arcano", x: WORLD_W - 80, y: 120, arriveX: 140, arriveY: WORLD_H - 160, color: "#c58bff" },
                ],
                gym_arcano: [
                  { key: "gym3-gym2", target: "gym_gelo_sombra", x: 80, y: WORLD_H - 120, arriveX: WORLD_W - 140, arriveY: 160, color: "#9fe8ff" },
                ],
                absol_start: [
                  { key: "absol-to-hall", target: "governante_hall", x: WORLD_W - 80, y: WORLD_H / 2, arriveX: 120, arriveY: WORLD_H / 2, color: "#c58bff" },
                ],
                governante_hall: [
                  { key: "hall-to-absol", target: "absol_start", x: 60, y: WORLD_H / 2, arriveX: WORLD_W - 120, arriveY: WORLD_H / 2, color: "#c58bff" },
                ],
                santuario_glacial: [
                  { key: "sg-to-caminho", target: "caminho_glacial", x: WORLD_W / 2, y: WORLD_H - 60, arriveX: WORLD_W / 2, arriveY: 100, color: "#c9b8ff" },
                ],
                vale_dourado: [
                  { key: "vd-to-arena", target: "arena", x: WORLD_W / 2, y: WORLD_H - 60, arriveX: WORLD_W / 2, arriveY: 100, color: "#f5cf6b" },
                ],
                caminho_glacial: [
                  { key: "cg-to-santuario", target: "santuario_glacial", x: WORLD_W / 2, y: 60, arriveX: WORLD_W / 2, arriveY: WORLD_H - 100, color: "#c0e8ff" },
                ],
                venofogo: [
                  { key: "to-terra", target: "terra", x: WORLD_W / 2, y: 40, arriveX: WORLD_W / 2, arriveY: WORLD_H - 100, color: "#d9873a" },
                ],
                fantasma: [
                  { key: "to-terra", target: "terra", x: WORLD_W - 60, y: WORLD_H / 2, arriveX: 100, arriveY: WORLD_H / 2, color: "#d9873a" },
                ],
                praia: [
                  { key: "to-arena",   target: "arena",   x: WORLD_W - 60, y: 60,          arriveX: 100,           arriveY: WORLD_H - 100, color: "#7ef27a" },
                  { key: "to-deserto", target: "deserto", x: 60,           y: WORLD_H / 2, arriveX: WORLD_W - 100, arriveY: WORLD_H / 2,   color: "#f5b25c" },
                ],
                neve: [
                  { key: "to-arena",   target: "arena",   x: WORLD_W / 2, y: WORLD_H - 40, arriveX: WORLD_W / 2,  arriveY: 100,           color: "#7ef27a" },
                  { key: "to-caverna", target: "caverna", x: 60,          y: 60,           arriveX: WORLD_W - 100, arriveY: WORLD_H - 100, color: "#a08770" },
                ],
                deserto: [
                  { key: "to-praia",    target: "praia",    x: WORLD_W - 60, y: WORLD_H / 2, arriveX: 100,           arriveY: WORLD_H / 2, color: "#5cd3ff" },
                ],
                caverna: [
                  { key: "to-neve", target: "neve", x: WORLD_W - 60, y: WORLD_H - 40, arriveX: 100, arriveY: 100, color: "#9bd8ff" },
                ],
                // ═══ Cadeia endgame — portais visíveis; ao entrar, exige nível ═══
                vale_rochas: [
                  { key: "vr-back", target: "arena",       x: WORLD_W - 60, y: WORLD_H - 40, arriveX: 100,           arriveY: 100,           color: "#7ef27a" },
                  { key: "vr-next", target: "vale_planta", x: 60,           y: WORLD_H / 2,  arriveX: WORLD_W - 100, arriveY: WORLD_H / 2,   color: "#7ef27a" },
                ],
                vale_planta: [
                  { key: "vp-back", target: "vale_rochas", x: WORLD_W - 60, y: WORLD_H / 2, arriveX: 100,           arriveY: WORLD_H / 2, color: "#a08770" },
                  { key: "vp-next", target: "vale_gelo",   x: 60,           y: WORLD_H / 2, arriveX: WORLD_W - 100, arriveY: WORLD_H / 2, color: "#8ce6ff" },
                ],
                vale_gelo: [
                  { key: "vg-back", target: "vale_planta", x: WORLD_W - 60, y: WORLD_H / 2, arriveX: 100,           arriveY: WORLD_H / 2, color: "#7ef27a" },
                  { key: "vg-next", target: "vale_veneno", x: 60,           y: WORLD_H / 2, arriveX: WORLD_W - 100, arriveY: WORLD_H / 2, color: "#b45adc" },
                ],
                vale_veneno: [
                  { key: "vv-back", target: "vale_gelo",  x: WORLD_W - 60, y: WORLD_H / 2, arriveX: 100,           arriveY: WORLD_H / 2, color: "#8ce6ff" },
                  { key: "vv-next", target: "vale_fogo",  x: 60,           y: WORLD_H / 2, arriveX: WORLD_W - 100, arriveY: WORLD_H / 2, color: "#ff5f2d" },
                ],
                vale_fogo: [
                  { key: "vf-back", target: "vale_veneno",   x: WORLD_W - 60, y: WORLD_H / 2, arriveX: 100,           arriveY: WORLD_H / 2, color: "#b45adc" },
                  { key: "vf-next", target: "vulcao_ativo",  x: 60,           y: WORLD_H / 2, arriveX: WORLD_W - 100, arriveY: WORLD_H / 2, color: "#ff9a2d" },
                ],
                vulcao_ativo: [
                  { key: "va-back", target: "vale_fogo",         x: WORLD_W - 60, y: WORLD_H / 2, arriveX: 100,           arriveY: WORLD_H / 2, color: "#ff5f2d" },
                  { key: "va-next", target: "nucleo_primordial", x: 60,           y: WORLD_H / 2, arriveX: WORLD_W - 100, arriveY: WORLD_H / 2, color: "#ffd94d" },
                ],
                nucleo_primordial: [
                  { key: "np-back",  target: "vulcao_ativo", x: WORLD_W - 60, y: WORLD_H / 2, arriveX: 100, arriveY: WORLD_H / 2, color: "#ff9a2d" },
                  { key: "np-arena", target: "arena",        x: WORLD_W / 2,  y: WORLD_H - 40, arriveX: WORLD_W / 2, arriveY: 100,   color: "#7ef27a" },
                ],
                // Evento Gelius: entrada é feita pelo botão do pinguim (auto-switch/leave)
                gelius1: [
                  { key: "g1-next", target: "gelius2", x: WORLD_W - 60, y: WORLD_H / 2, arriveX: 100, arriveY: WORLD_H / 2, color: "#c9b8ff" },
                ],
                gelius2: [
                  { key: "g2-back", target: "arena", x: WORLD_W - 60, y: WORLD_H - 60, arriveX: WORLD_W / 2, arriveY: 100, color: "#7ef27a" },
                ],
              };
  const ATTACK_RANGE = 90; // px
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const [viewSize, setViewSize] = useState({ w: 800, h: 680 });
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      setViewSize({ w: el.clientWidth, h: el.clientHeight });
    });
    ro.observe(el);
    setViewSize({ w: el.clientWidth, h: el.clientHeight });
    return () => ro.disconnect();
  }, []);

  // ---- Obstáculos com colisão (posições determinísticas) ----
  const obstacles = useMemo(() => buildObstacles(WORLD_W, WORLD_H, idle.currentMap), [idle.currentMap]);

  // ---- Prédios do mundo (Laboratório + Lar) ----
  type Building = { key: "lab" | "lar" | "azul" | "gym"; label: string; emoji: string; color: string; x: number; y: number; w: number; h: number; interactR: number };
  const BUILDINGS = useMemo<Building[]>(() => [
    { key: "lab",  label: "Banco Medieval", emoji: "🏦", color: "#f5cf6b", x: 520,  y: 640, w: 148, h: 168, interactR: 100 },
    { key: "gym",  label: "Ginásio Medieval", emoji: "🏰", color: "#ff5c5c", x: 900, y: 700, w: 158, h: 178, interactR: 105 },
    { key: "lar",  label: "Lar",         emoji: "🏠", color: "#5ec26a", x: 1400, y: 640, w: 148, h: 168, interactR: 100 },
    { key: "azul", label: "Casa Azul",   emoji: "🏡", color: "#4a9eff", x: 1600, y: 640, w: 148, h: 168, interactR: 100 },
  ], []);

  const TRAINER_R = 10; // raio do treinador
  const collidesWithAny = (x: number, y: number) => {
    for (const o of obstacles) {
      if (!o.blocks) continue;
      if (Math.hypot(x - o.x, y - o.y) < o.collideR + TRAINER_R) return true;
    }
    return false;
  };
  const nearestBlockingObstacle = (x: number, y: number) => {
    let nearest: Obstacle | null = null;
    let nearestD = Infinity;
    for (const o of obstacles) {
      if (!o.blocks) continue;
      const d = Math.hypot(x - o.x, y - o.y);
      if (d < nearestD) { nearestD = d; nearest = o; }
    }
    return nearest ? { obstacle: nearest, distance: nearestD } : null;
  };
  const getCoveringObstacle = (x: number, y: number) => {
    for (const o of obstacles) {
      const left = o.x - o.w / 2;
      const right = o.x + o.w / 2;
      const top = o.y - o.h + 8;
      const bottom = o.y + 8;
      if (x >= left && x <= right && y >= top && y <= bottom) return o.id;
    }
    return null;
  };

  const [trainerPos, setTrainerPos] = useState({ x: WORLD_W / 2, y: WORLD_H / 2 });
  const [walkStep, setWalkStep] = useState(0);
  const [walkDir, setWalkDir] = useState<Dir>("right");
  const walkDirRef = useRef<Dir>("right");
  const [pokemonFace, setPokemonFace] = useState<"left" | "right">("right");
  const pokemonFaceRef = useRef<"left" | "right">("right");
  const [moving, setMoving] = useState(true);
  // Alvo de deslocamento automático (clicar em "Ir ao Lar", "Ir ao Lab", "Ir Floresta")
  const walkTargetRef = useRef<{ x: number; y: number; label: string; onArrive?: () => void; resumeAuto?: boolean } | null>(null);
  const [walkingTo, setWalkingTo] = useState<string | null>(null);
  const [bigMapOpen, setBigMapOpen] = useState(false);
  const [worldMapOpen, setWorldMapOpen] = useState(false);
  const [worldTab, setWorldTab] = useState<1 | 2 | 3>(1);
  const [pendingGate, setPendingGate] = useState<null | { target: string; gate: any; fromBig: boolean }>(null);
  const [codeOpen, setCodeOpen] = useState(false);
  const [codeInput, setCodeInput] = useState("");
  const [codeMsg, setCodeMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [bmpSwapOpen, setBmpSwapOpen] = useState(false);
  const [bmpSwapSourceUid, setBmpSwapSourceUid] = useState<string | null>(null);
  const [bmpSwapTarget, setBmpSwapTarget] = useState<Species | null>(null);
  const [bmpSwapMsg, setBmpSwapMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [cashShopOpen, setCashShopOpen] = useState(false);

  // ESC global: fecha modais / painéis abertos, ou volta pra tela de batalha.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || target?.isContentEditable) return;
      // Prioridade: modais → painéis → tabs secundárias.
      if (statsCardPet) { setStatsCardPet(null); return; }
      if (cashShopOpen) { setCashShopOpen(false); return; }
      if (blackEggHudOpen) { setBlackEggHudOpen(false); return; }
      if (governanteOpen) { setGovernanteOpen(false); return; }
      if (anciaoOpen) { if (!anciaoForcedRef.current) setAnciaoOpen(false); return; }
      if (bmpSwapOpen) { setBmpSwapOpen(false); return; }
      if (showAutoSettings) { setShowAutoSettings(false); return; }
      if (oddishNoStone) { setOddishNoStone(null); return; }
      if (oddishConfirm) { setOddishConfirm(null); return; }
      if (oddishRankOpen) { setOddishRankOpen(false); return; }
      if (grassOddishSplash) { setGrassOddishSplash(false); return; }
      if (tab !== "batalha") { setTab("batalha"); return; }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [statsCardPet, cashShopOpen, blackEggHudOpen, governanteOpen, anciaoOpen, bmpSwapOpen, showAutoSettings, oddishNoStone, oddishConfirm, oddishRankOpen, grassOddishSplash, tab]);



  // Hotkeys globais: ESPAÇO = liga/desliga auto; 1/2/3 = trocar pokébola (poké/great/ultra).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || target?.isContentEditable) return;
      if (e.code === "Space" || e.key === " ") {
        e.preventDefault();
        setIdle((s) => {
          const ab = s.autoBattle ?? { enabled: true, useBall: true, preferredBall: "auto" as const, captureHpPct: 1 };
          const next = !ab.enabled;
          setAuto(next);
          if (!next) { walkTargetRef.current = null; setWalkingTo(null); }
          return { ...s, autoBattle: { ...ab, enabled: next } };
        });
        return;
      }
      if (e.key === "1" || e.key === "2" || e.key === "3") {
        const map: Record<string, "pokeball" | "greatball" | "ultraball"> = { "1": "pokeball", "2": "greatball", "3": "ultraball" };
        const pick = map[e.key];
        setIdle((s) => {
          const ab = s.autoBattle ?? { enabled: true, useBall: true, preferredBall: "auto" as const, captureHpPct: 1 };
          return { ...s, autoBattle: { ...ab, preferredBall: pick, useBall: true } };
        });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);



  const MYTHIC_EGG_CODE_KEY = "rubym.mythicEggCode.used";
  const MYTHIC_EGG2_CODE_KEY = "rubym.mythicEgg2Code.used";
  const CHARIZARD_EGG_CODE_KEY = "rubym.charizardEggCode.used";
  const ULTRA200_CODE_KEY = "rubym.ultra200CodeUsed";
  const normalizeCode = (value: string) => value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
  const scopedCodeKey = (raw: string) => `rubym.code.${identity?.id ?? "local"}.${raw}.used`;
  const persistCodeReward = (next: IdleState) => {
    idleRef.current = next;
    saveIdle(next);
    if (!identity?.id?.startsWith("guest-")) {
      void pushCloudSaveNow({ idle: next, team: teamRef.current, restingBench, savedAt: Date.now() });
    }
  };
  const handleSeasonReset = async (skipConfirm = false) => {
    try {
      if (!skipConfirm && !window.confirm("ATENÇÃO: Este ritual irá resetar seu nível e de seus Pokémon para 1. Toda sua COLEÇÃO será convertida em Fragmentos Vermelhos. Itens, Cofre e Ouro serão mantidos. Deseja continuar?")) {
        return;
      }

      const cur = idleRef.current;
      if (cur.redeemedCodes?.RESETPERSON) {
        toast.error("O Ritual da Nova Jornada já foi realizado nesta conta.");
        return;
      }

      // 1) Coleção -> Fragmentos Vermelhos (1 por Pokémon guardado)
      const colCount = Array.isArray(cur.collection) ? cur.collection.length : 0;
      const nextItems: Record<string, number> = { ...(cur.items ?? {}) };
      nextItems.fragmento_vermelho = (nextItems.fragmento_vermelho ?? 0) + colCount;

      // 2) Time e reservas voltam ao nível 1 (espécie/raridade/traits preservados)
      const resetPet = (p: PetInstance): PetInstance => {
        const lv1 = { ...p, level: 1, xp: 0 } as PetInstance;
        const max = calcIdleMaxHp(lv1);
        return { ...lv1, hp: max, maxHp: max };
      };
      const nextTeam = (teamRef.current ?? []).map(resetPet);
      const nextBench = (benchRef.current ?? []).map(resetPet);

      // 3) Treinador volta ao nível 1 — itens, ouro, cristais e cofre intactos
      const next: IdleState = {
        ...cur,
        trainerLevel: 1,
        trainerXp: 0,
        collection: [],
        items: nextItems as typeof cur.items,
        currentMap: "vale_dourado",
        redeemedCodes: { ...(cur.redeemedCodes ?? {}), RESETPERSON: true },
      };

      setIdle(next);
      setTeam(nextTeam);
      setRestingBench(nextBench);
      idleRef.current = next;
      teamRef.current = nextTeam;
      benchRef.current = nextBench;
      saveIdle(next);

      // 4) Persistência na nuvem (blob completo) + tabelas normalizadas
      const savedAt = Date.now();
      const snapshot = { idle: next, team: nextTeam, restingBench: nextBench, savedAt };
      writeLocalBackup(snapshot);
      if (!identity?.id?.startsWith("guest-")) {
        try { await pushCloudSaveNow(snapshot); } catch (e) { console.warn("[seasonReset] cloud push falhou", e); }
        try {
          const { data: sess } = await supabase.auth.getSession();
          const uid = sess.session?.user?.id;
          if (uid) {
            await (supabase.from("trainer_state") as any)
              .update({ trainer_level: 1, trainer_xp: 0, active_map: "vale_dourado" })
              .eq("user_id", uid);
            await (supabase.from("pokemon_collection") as any)
              .update({ level: 1, xp: 0 })
              .eq("user_id", uid);
            await (supabase.from("ranked_scores") as any)
              .update({ trainer_level: 1 })
              .eq("user_id", uid);
          }
        } catch (e) {
          console.warn("[seasonReset] sync de tabelas normalizadas falhou", e);
        }
      }

      pushChat(`❄️ Nova Jornada iniciada! ${colCount} Pokémon da coleção viraram Fragmentos Vermelhos.`, "cap");
      toast.success(`Nova Jornada iniciada! +${colCount} Fragmento(s) Vermelho(s).`);
      setTimeout(() => window.location.reload(), 1800);
    } catch (err: any) {
      console.error("Season Reset Error:", err);
      toast.error(err?.message || "Erro ao realizar reset de temporada.");
    }
  };
  const redeemCrystalCode = () => {
    const raw = normalizeCode(codeInput);
    if (!raw) { setCodeMsg({ kind: "err", text: "Digite um código." }); return; }
    const codeKey = scopedCodeKey(raw);
    const alreadyUsed = Boolean(idleRef.current.redeemedCodes?.[raw]);
    try {
      if (!alreadyUsed && localStorage.getItem(codeKey) === "1") {
        setIdle((s) => ({ ...s, redeemedCodes: { ...(s.redeemedCodes ?? {}), [raw]: true } }));
        setCodeMsg({ kind: "err", text: "Código já utilizado nesta conta." });
        return;
      }
    } catch { /* ignore */ }
    if (alreadyUsed) { setCodeMsg({ kind: "err", text: "Código já utilizado nesta conta." }); return; }

    // 🎁 Códigos ativos — todos entregam 30.000 Cristais
    type CodeReward = { items?: Record<string, number>; vipDays?: number; label: string };
    const CODE_TABLE: Record<string, CodeReward> = {
      // 3 Ovos Épicos + 50 Ultra Ball + VIP 60 dias
      EGGVIP60K: { items: { egg_epic: 3, ultraball: 50 }, vipDays: 60, label: "3× Ovo Épico ✦✦, 50× Ultra Ball, VIP 60 dias e 30.000 Cristais" },
      // 1 Black Mitic Egg ✦ (Black Plus)
      BLACKPLUS30K: { items: { black_mitic_egg: 1 }, label: "1× Black Mitic Egg ✦ e 30.000 Cristais" },
      BLACKEGG30K: { items: { black_mitic_egg: 1 }, label: "1× Black Mitic Egg ✦ e 30.000 Cristais" },
      // 1 Ovo do Charizard Mítico ✦
      CHARIZMITIC30K: { items: { egg_charizard_mythic: 1 }, label: "1× Ovo do Charizard Mítico ✦ e 30.000 Cristais" },
      // Carta Lendária (Incubadora) + Carta do Governante
      CARTAGOVLEND1: { items: { carta_incubadora: 1, carta_governante: 1 }, label: "1× Carta da Incubadora Lendária 🔮, 1× Carta do Governante 👑 e 30.000 Cristais" },
      CARTAGOVLEND2: { items: { carta_incubadora: 1, carta_governante: 1 }, label: "1× Carta da Incubadora Lendária 🔮, 1× Carta do Governante 👑 e 30.000 Cristais" },
      // ❄️ RESETPERSON: Ritual de Reset via Código (Fallback de Segurança)
      RESETPERSON: { label: "Reset de Temporada: Nível 1 + Fragmentação da Coleção" },
    };

    if (raw === "RESETPERSON") {
      void handleSeasonReset();
      setCodeMsg({ kind: "ok", text: "Ritual iniciado! Confirme no diálogo acima." });
      setCodeOpen(false);
      return;
    }

    const reward = CODE_TABLE[raw];
    if (reward) {
      const nowT = Date.now();
      const cur = idleRef.current;
      const nextItems: Record<string, number> = { ...cur.items };
      for (const [id, qty] of Object.entries(reward.items ?? {})) {
        nextItems[id] = (nextItems[id] ?? 0) + qty;
      }
      let buffs = cur.buffs;
      if (reward.vipDays) {
        const curUntil = Math.max(cur.buffs.expMultUntil ?? 0, cur.buffs.goldMultUntil ?? 0);
        const curMult = curUntil > nowT ? Math.max(cur.buffs.expMult ?? 0, cur.buffs.goldMult ?? 0) : 0;
        const remaining = curUntil > nowT ? curUntil - nowT : 0;
        const newUntil = nowT + remaining + reward.vipDays * 24 * 3600_000;
        const newMult = Math.max(curMult, 0.40);
        buffs = { ...cur.buffs, expMult: newMult, expMultUntil: newUntil, goldMult: newMult, goldMultUntil: newUntil };
      }
      const next: IdleState = {
        ...cur,
        items: nextItems as typeof cur.items,
        bank: { ...cur.bank, crystals: (cur.bank?.crystals ?? 0) + 30000 },
        buffs,
        redeemedCodes: { ...(cur.redeemedCodes ?? {}), [raw]: true },
      };
      setIdle(next);
      persistCodeReward(next);
      try { localStorage.setItem(codeKey, "1"); } catch { /* ignore */ }
      pushChat(`🎁 Código resgatado: ${reward.label}!`, "cap");
      setCodeMsg({ kind: "ok", text: `Resgatado! ${reward.label}.` });
      return;
    }

    // Nenhum outro código de resgate está ativo.
    setCodeMsg({ kind: "err", text: "Código inválido ou desativado." });
  };






  useEffect(() => {
    const iv = setInterval(() => setWalkStep((s) => (moving ? (s + 1) % 4 : 0)), 180);
    return () => clearInterval(iv);
  }, [moving]);

  // ===== Follower (pokémon líder) segue o treinador com trilha suave =====
  const trailRef = useRef<Array<{ x: number; y: number }>>([{ x: WORLD_W / 2, y: WORLD_H / 2 }]);
  const [followerState, setFollowerState] = useState<{ x: number; y: number; dir: Dir; moving: boolean }>({
    x: WORLD_W / 2 - 88, y: WORLD_H / 2 + 44, dir: "right", moving: false,
  });
  const followerStateRef = useRef(followerState);
  useEffect(() => { followerStateRef.current = followerState; }, [followerState]);

  // Adiciona posição do treinador na trilha sempre que ele muda
  useEffect(() => {
    const trail = trailRef.current;
    const last = trail[trail.length - 1];
    if (last && Math.hypot(last.x - trainerPos.x, last.y - trainerPos.y) > 220) {
      const dirOffset = walkDirRef.current === "left" ? { x: 88, y: 28 }
        : walkDirRef.current === "right" ? { x: -88, y: 28 }
        : walkDirRef.current === "up" ? { x: 0, y: 92 }
        : { x: 0, y: -92 };
      const next = { x: trainerPos.x + dirOffset.x, y: trainerPos.y + dirOffset.y, dir: walkDirRef.current, moving: false };
      trailRef.current = [{ x: next.x, y: next.y }, { x: trainerPos.x, y: trainerPos.y }];
      followerStateRef.current = next;
      setFollowerState(next);
      return;
    }
    if (!last || Math.hypot(last.x - trainerPos.x, last.y - trainerPos.y) > 2) {
      trail.push({ x: trainerPos.x, y: trainerPos.y });
      if (trail.length > 240) trail.shift();
    }
  }, [trainerPos]);

  // Loop de animação: follower persegue um ponto distante atrás do treinador na trilha
  useEffect(() => {
    let raf = 0;
    const FOLLOW_DIST = 88;
    const MAX_SPEED = 6.6; // px por frame
    const loop = () => {
      const trail = trailRef.current;
      if (trail.length > 0) {
        // Encontra ponto na trilha ~FOLLOW_DIST atrás do topo
        let acc = 0;
        let tx = trail[0].x, ty = trail[0].y;
        for (let i = trail.length - 1; i > 0; i--) {
          const a = trail[i], b = trail[i - 1];
          const seg = Math.hypot(a.x - b.x, a.y - b.y);
          if (acc + seg >= FOLLOW_DIST) {
            const t = (FOLLOW_DIST - acc) / seg;
            tx = a.x + (b.x - a.x) * t;
            ty = a.y + (b.y - a.y) * t;
            break;
          }
          acc += seg;
          tx = b.x; ty = b.y;
        }
        const prev = followerStateRef.current;
        const dx = tx - prev.x;
        const dy = ty - prev.y;
        const dist = Math.hypot(dx, dy);
        if (dist > 0.4) {
          const step = Math.min(dist, MAX_SPEED);
          const nx = prev.x + (dx / dist) * step;
          const ny = prev.y + (dy / dist) * step;
          let dir: Dir = prev.dir;
          if (Math.abs(dx) > Math.abs(dy)) dir = dx > 0 ? "right" : "left";
          else dir = dy > 0 ? "down" : "up";
          const next = { x: nx, y: ny, dir, moving: true };
          followerStateRef.current = next;
          setFollowerState(next);
        } else if (prev.moving) {
          const next = { ...prev, moving: false };
          followerStateRef.current = next;
          setFollowerState(next);
        }
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  // ===== Multiplayer: presença por mapa via Supabase Realtime =====
  type RemotePlayer = { id: string; userId: string; name: string; x: number; y: number; dir: Dir; step: number; leaderSp?: Species; ts: number; skinUrl?: string; mapId?: IdleMapId };
  const [remotePlayers, setRemotePlayers] = useState<RemotePlayer[]>([]);
  const trainerPosRef = useRef(trainerPos);
  useEffect(() => { trainerPosRef.current = trainerPos; }, [trainerPos]);
  const walkStepRef = useRef(walkStep);
  useEffect(() => { walkStepRef.current = walkStep; }, [walkStep]);
  const leaderSpRef = useRef<Species | undefined>(team[0]?.species);
  useEffect(() => { leaderSpRef.current = team[0]?.species; }, [team]);
  useEffect(() => {
    if (!identity?.id) return;
    const mapId = idle.currentMap;
    const meUserId = identity.id;
    const meId = getMultiplayerSessionId(meUserId);
    const meName = identity.name || "Treinador";
    const payloadNow = (): RemotePlayer => ({
      id: meId, userId: meUserId, name: meName,
      x: trainerPosRef.current.x, y: trainerPosRef.current.y,
      dir: walkDirRef.current, step: walkStepRef.current,
      leaderSp: leaderSpRef.current, ts: Date.now(),
    });
    const savePresence = async (payload: RemotePlayer) => {
      try {
        await gameDb.from("players").upsert({
          id: payload.id,
          name: payload.name,
          map: mapId,
          x: Math.round(payload.x),
          y: Math.round(payload.y),
          dir: payload.dir,
          leader_species: payload.leaderSp ?? null,
          leader_rarity: null,
          level: team[0]?.level ?? 1,
          trainer_level: idle.trainerLevel ?? 1,
          craft_points: Math.max(0, idle.items?.cristal_fragmentado ?? 0),
          updated_at: new Date().toISOString(),
        });
      } catch { /* multiplayer via DB polling */ }
    };
    const loadPresence = async () => {
      try {
        const since = new Date(Date.now() - 20_000).toISOString();
        const { data } = await gameDb
          .from("players")
          .select("id,name,map,x,y,dir,leader_species,updated_at")
          .eq("map", mapId)
          .gte("updated_at", since);
        if (!data) return;
        setRemotePlayers((prev) => {
          const byId: Record<string, RemotePlayer> = {};
          prev.forEach(p => byId[p.id] = p);
          for (const row of data as any[]) {
            if (!row?.id || row.id === meId) continue;
            byId[row.id] = {
              id: String(row.id),
              userId: String(row.id).split(":")[0] || String(row.id),
              name: String(row.name || "Treinador"),
              x: Number(row.x) || WORLD_W / 2,
              y: Number(row.y) || WORLD_H / 2,
              dir: (["down", "left", "right", "up"].includes(row.dir) ? row.dir : "down") as Dir,
              step: byId[row.id]?.step ?? 0,
              leaderSp: row.leader_species || undefined,
              ts: new Date(row.updated_at || Date.now()).getTime(),
            };
          }
          return Object.values(byId).filter((p) => p.id !== meId && Date.now() - p.ts < 20_000);
        });
      } catch { /* ignore */ }
    };
    void savePresence(payloadNow());
    void loadPresence();
    // Sem Realtime: apenas DB polling (economia máxima de mensagens).
    // Sem PvP, ver outros jogadores em ~8s é suficiente.
    const dbIv = setInterval(() => {
      const payload = payloadNow();
      void savePresence(payload);
      void loadPresence();
    }, 8_000);
    const prune = setInterval(() => {
      const cutoff = Date.now() - 20_000;
      setRemotePlayers((prev) => prev.filter((p) => p.ts >= cutoff));
    }, 4_000);
    return () => {
      clearInterval(dbIv);
      clearInterval(prune);
      void gameDb.from("players").delete().eq("id", meId);
      setRemotePlayers([]);
    };
  }, [identity?.id, identity?.name, idle.currentMap, idle.totals.captured, idle.craftPoints, team]);


  const fakeMapPlayers = useMemo<RemotePlayer[]>(() => {
    const names = [
      "Luna", "Ryu", "Mika", "Theo", "Nina", "Kai", "Yuri", "Lia", "Noah", "Iris",
      "Bento", "Akira", "Tina", "Kiko", "Maya", "Zeca", "Lipe", "Sora", "Neko", "Ruby",
      "Ash", "Brock", "Misty", "Red", "Blue", "Green", "Gold", "Silver", "Leaf", "Dawn",
      "May", "Serena", "Clem", "Rosa", "Hilda", "Nate", "Hugo", "Lola", "Jade", "Bolt",
      "Pyro", "Flora", "Ghost", "Rocky", "Aqua", "Zuzu", "Pip", "Max", "Lulu", "Toby",
    ];
    const leaders: Species[] = [
      "pikachu", "bulbasaur", "charmander", "squirtle", "pidgey", "zubat", "jigglypuff", "oddish", "growlithe", "golem",
      "cubone", "magnemite", "poliwag", "vulpix", "sandshrew", "mankey", "bellsprout", "venonat", "clefairy", "meowth",
    ];
    const mapIds = Object.keys(IDLE_MAPS) as IdleMapId[];
    const skinUrls = SKINS.map((s) => s.url);
    const t = Math.floor(Date.now() / 1000);
    // 30 jogadores espalhados por TODOS os mapas; cada um em um mapa fixo.
    const all: RemotePlayer[] = Array.from({ length: 30 }, (_, i) => {
      const mapId = mapIds[i % mapIds.length];
      const a = (i * 47 + mapId.length * 19) % 360;
      const r1 = 260 + ((i * 83) % 620);
      const r2 = 210 + ((i * 61) % 570);
      const speed = 0.018 + (i % 7) * 0.003;
      const phase = (a * Math.PI) / 180 + t * speed;
      const x = Math.max(90, Math.min(WORLD_W - 90, WORLD_W / 2 + Math.cos(phase) * r1 + Math.sin(phase * 0.7 + i) * 90));
      const y = Math.max(110, Math.min(WORLD_H - 110, WORLD_H / 2 + Math.sin(phase * 1.13) * r2 + Math.cos(phase * 0.55 + i) * 70));
      const dx = -Math.sin(phase) * r1;
      const dy = Math.cos(phase * 1.13) * r2;
      const dir: Dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "right" : "left") : (dy > 0 ? "down" : "up");
      return {
        id: `fake-${mapId}-${i}`,
        userId: `fake-${i}`,
        name: names[i] ?? `Trainer ${i + 1}`,
        x,
        y,
        dir,
        step: Math.floor((t / 0.45 + i) % 4),
        leaderSp: leaders[i % leaders.length],
        ts: Date.now(),
        skinUrl: skinUrls[i % skinUrls.length],
        mapId,
      } as RemotePlayer & { fake: true };
    });
    // Filtra só os do mapa atual para renderizar.
    return all.filter((p) => p.mapId === idle.currentMap);
  }, [idle.currentMap, energyTick]);

  const visibleMapPlayers = useMemo(() => [...remotePlayers, ...fakeMapPlayers], [remotePlayers, fakeMapPlayers]);

  // ===== Canal global de capturas (visível pra todos os jogadores) =====
  const captureChanRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  // Contador de pokébolas arremessadas em cada Mewtwo do evento (por id de spawn).
  const mewtwoBallsRef = useRef(new Map<number, number>());
  // Contador de Ultra Balls arremessadas em bosses raros (Dragonite Shiny / Zapdos / Raichu Mítico).
  const bossBallsRef = useRef(new Map<number, number>());
  const DRAGONITE_SHINY_MIN_BALLS = 700;
  const ZAPDOS_MIN_BALLS = 1000;
  const RAICHU_MYTHIC_MIN_BALLS = 2000;
  const RAYQUAZA_MIN_BALLS = 3000;
  const ONIX_SHINY_MIN_BALLS = 3000;
  const RIOLU_MIN_BALLS = 3000;
  const DRAGONITE_SHINY_GRASS_MIN_BALLS = 3000;
  useEffect(() => {
    if (!identity?.id) return;
    const ch = supabase.channel("rubym-captures-global");
    // Capturas globais de outros jogadores agora vão só como toast leve —
    // sem lotar o chat / feed.
    // Chat global de jogadores está BLOQUEADO — mensagens recebidas são ignoradas.
    ch.on("broadcast", { event: "say" }, () => {
      return;
    });

    ch.subscribe();

    captureChanRef.current = ch;
    return () => {
      captureChanRef.current = null;
      void supabase.removeChannel(ch);
    };
  }, [identity?.id]);



  const [zoom, setZoom] = useState(0.75);
  // ===== Ranking Global =====
  type RankRow = {
    id: string;
    name: string;
    level: number;
    trainer_level: number;
    craft_points: number;
    leader_species: string | null;
    leader_rarity: string | null;
    guild_name: string | null;
  };
  type RankMode = "trainer" | "craft";
  const [rankOpen, setRankOpen] = useState(false);
  const [vaultOpen, setVaultOpen] = useState(false);
  const [vaultTab, setVaultTab] = useState<"itens" | "pokemon">("itens");
  const [gymOpen, setGymOpen] = useState(false);
  const [valeTick, setValeTick] = useState(0);
  useEffect(() => {
    const iv = setInterval(() => setValeTick((v) => v + 1), 1000);
    return () => clearInterval(iv);
  }, []);
  // 🔻 Vale dos Fragmentos: evento acabou → devolve o jogador ao mapa anterior.
  useEffect(() => {
    if (idle.currentMap !== "vale_fragmentos") return;
    if (valeEventStatus().open) return;
    setIdle((s) => {
      if (s.currentMap !== "vale_fragmentos") return s;
      return { ...s, currentMap: s.valeReturnMap ?? "arena", valeReturnMap: undefined };
    });
    try { window.dispatchEvent(new CustomEvent("rubym:toast", { detail: { title: "🔻 Vale dos Fragmentos", body: "Evento encerrado — você foi teletransportado de volta.", tone: "info" } })); } catch { /* ignore */ }
  }, [valeTick, idle.currentMap]);
  const [netLogOpen, setNetLogOpen] = useState(false);
  const [myIp, setMyIp] = useState<string | null>(null);
  const [netLogs, setNetLogs] = useState<IpLogRow[]>([]);
  const [netLogLoading, setNetLogLoading] = useState(false);
  const [rankRows, setRankRows] = useState<RankRow[]>([]);
  const [rankLoading, setRankLoading] = useState(false);
  const [rankMode, setRankMode] = useState<RankMode>("trainer");

  // Hotkeys: M = mapa mundi, R = ranking, B = mochila, C = coleção. ESC fecha mapa/rank.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || target?.isContentEditable) return;
      if (e.key === "Escape") {
        if (netLogOpen) { setNetLogOpen(false); return; }
        if (gymOpen) { setGymOpen(false); return; }
        if (vaultOpen) { setVaultOpen(false); return; }
        if (worldMapOpen) { setWorldMapOpen(false); return; }
        if (rankOpen) { setRankOpen(false); return; }
        return;
      }
      const k = e.key.toLowerCase();
      if (k === "m") { 
        e.preventDefault(); 
        setTab("batalha");
        setWorldMapOpen((v) => !v); 
        return; 
      }


      // Ranked desativado temporariamente
      if (k === "r") { e.preventDefault(); return; }

      if (k === "b") { e.preventDefault(); setTab((t) => (t === "mochila" ? "batalha" : "mochila")); return; }
      if (k === "c") { e.preventDefault(); collect(); return; }
      // Admin shortcut: Shift + A (Only for authorized admin UUIDs)
      if (e.shiftKey && k === "a") {
        const adminUuids = [
          "61b4d001-c8c3-424d-862d-0b798782f9d6", // Principal
          "6f76f76c-3838-4e8c-8c8c-8c8c8c8c8c8c", // lordryuhhhuyuyghh@gmail.com (PlaceHolder - will update if actual ID known)
        ];
        const isAdminUuid = identity?.id && adminUuids.includes(identity.id);
        
        // Also check by email
        const isAdminEmail = identity?.email === "lordryuhhhuyuyghh@gmail.com";

        if (isAdminUuid || isAdminEmail) {
          e.preventDefault();
          setIsAdminOpen((v) => !v);
          // Auto-enable admin flag if not set
          if (typeof window !== "undefined") {
            const flag = "rubym.isAdmin";
            if (localStorage.getItem(flag) !== "true") {
              localStorage.setItem(flag, "true");
            }
          }
          return;
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [worldMapOpen, rankOpen, vaultOpen, netLogOpen, gymOpen, tab]);

  // 🌐 Registra IP/rede do acesso e expõe no HUD.
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const ip = await recordIpLog(identity?.name ?? null);
      if (!cancelled && ip) setMyIp(ip);
    })();
    return () => { cancelled = true; };
  }, [identity?.id, identity?.name]);

  const loadNetLogs = useCallback(async () => {
    setNetLogLoading(true);
    try {
      const rows = await fetchIpLogs(120);
      setNetLogs(rows);
    } finally {
      setNetLogLoading(false);
    }
  }, []);

  const [rankRefreshTick, setRankRefreshTick] = useState(0);
  const RANK_CACHE_TTL_MS = 2 * 60 * 60 * 1000; // 2h — ranking congelado, sem atualizar direto
  const rankCacheKey = (mode: RankMode) => `rank_cache_v8_frozen_2h_${mode}`;

  useEffect(() => {
    if (!rankOpen) return;
    let cancelled = false;
    const key = rankCacheKey(rankMode);
    // Serve cache local por 2 horas — o ranking fica congelado nesse período.
    {
      try {
        const raw = localStorage.getItem(key);
        if (raw) {
          const parsed = JSON.parse(raw) as { at: number; rows: RankRow[] };
          if (parsed && Date.now() - parsed.at < RANK_CACHE_TTL_MS && Array.isArray(parsed.rows)) {
            setRankRows(parsed.rows);
            setRankLoading(false);
            return;
          }
        }
      } catch { /* ignore */ }
    }

    setRankLoading(true);
    (async () => {
      const collection = idle.collection ?? [];
      const maxPokeLevel = Math.max(
        1,
        ...team.map((p) => p?.level ?? 0),
        ...collection.map((p) => p?.level ?? 0),
      );
      const prismaTotal = Math.max(0, idle.items?.cristal_fragmentado ?? 0);
      const meRow = (): RankRow => ({
        id: identity?.id ?? "local-trainer",
        name: identity?.name || "Treinador",
        level: maxPokeLevel,
        trainer_level: idle.trainerLevel ?? 1,
        craft_points: prismaTotal,
        leader_species: team[0]?.species ?? null,
        leader_rarity: team[0]?.rarity ?? null,
        guild_name: null,
      });
      try {
        await recordRankedScore(idle.trainerLevel ?? 1, Math.max(0, idle.items?.cristal_fragmentado ?? 0), null);
        const top = rankMode === "craft" ? await fetchTopPrismaRanked(30) : await fetchTopRanked(30);
        let rows: RankRow[] = (top as RankedRow[]).map((r) => ({
          id: r.user_id,
          name: r.username || "Treinador",
          level: r.trainer_level,
          trainer_level: r.trainer_level,
          craft_points: r.craft_points ?? 0,
          leader_species: null,
          leader_rarity: null,
          guild_name: r.guild_name ?? null,
        }));

        if (rows.length === 0 && rankMode === "trainer") {
          const { data, error } = await gameDb
            .from("players")
            .select("id,name,level,trainer_level,craft_points,leader_species,leader_rarity,guild_name")
            .order("trainer_level", { ascending: false })
            .limit(200);
          if (error) console.warn("[idle ranked] players:", error.message);
          rows = (data as RankRow[] | null) ?? [];
        }

        if (!rows.some((r) => r.id === (identity?.id ?? "local-trainer"))) rows.push(meRow());
        else {
          // Atualiza a linha do usuário local com os valores reais (max nv poke + prisma total).
          rows = rows.map((r) => (r.id === (identity?.id ?? "local-trainer") ? { ...r, ...meRow() } : r));
        }
        rows.sort((a, b) => {
          const av = rankMode === "craft" ? a.craft_points : a.trainer_level;
          const bv = rankMode === "craft" ? b.craft_points : b.trainer_level;
          return bv - av;
        });
        rows = rankMode === "craft" ? rows.filter((r) => r.craft_points > 0).slice(0, 30) : rows.slice(0, 30);
        if (!cancelled) setRankRows(rows);
        try { localStorage.setItem(key, JSON.stringify({ at: Date.now(), rows })); } catch { /* ignore */ }
      } catch (e) {
        console.warn("[idle ranked] load:", e);
        const rows = [meRow()];
        if (!cancelled) setRankRows(rows);
      }
      finally { if (!cancelled) setRankLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [rankOpen, rankMode, rankRefreshTick, identity?.id, identity?.name, idle.trainerLevel, idle.items?.cristal_fragmentado, idle.collection, team]);

  // Ranking congelado: revalida sozinho apenas a cada 2 horas.
  useEffect(() => {
    const iv = setInterval(() => {
      try {
        localStorage.removeItem(rankCacheKey("trainer"));
        localStorage.removeItem(rankCacheKey("craft"));
      } catch { /* ignore */ }
      setRankRefreshTick((v) => v + 1);
    }, RANK_CACHE_TTL_MS);
    return () => clearInterval(iv);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);



  useEffect(() => {
    const t = setTimeout(() => {
      void recordRankedScore(idle.trainerLevel ?? 1, Math.max(0, idle.items?.cristal_fragmentado ?? 0), null);
    }, 4500);
    return () => clearTimeout(t);
  }, [idle.trainerLevel, idle.items?.cristal_fragmentado]);
  // Ranking do evento Grass Oddish: envia o total de capturas com debounce.
  useEffect(() => {
    const total = idle.grassOddishCaptured ?? 0;
    if (total <= 0) return;
    const t = setTimeout(() => { void submitOddishCaptures(total, identity?.name); }, 3500);
    return () => clearTimeout(t);
  }, [idle.grassOddishCaptured, identity?.name]);
  // Recarrega o top do ranking do evento quando o modal abrir.
  useEffect(() => {
    if (!oddishRankOpen) return;
    let cancelled = false;
    setOddishRankLoading(true);
    (async () => {
      try {
        const total = idle.grassOddishCaptured ?? 0;
        if (total > 0) { try { await submitOddishCaptures(total, identity?.name); } catch {} }
        const rows = await fetchOddishTop(5);
        if (!cancelled) setOddishRankRows(rows.slice(0, 5));
      } finally {
        if (!cancelled) setOddishRankLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [oddishRankOpen, idle.grassOddishCaptured, identity?.name]);
  const viewW = viewSize.w / zoom;
  const viewH = viewSize.h / zoom;
  const camX = Math.max(0, Math.min(Math.max(0, WORLD_W - viewW), trainerPos.x - viewW / 2));
  const camY = Math.max(0, Math.min(Math.max(0, WORLD_H - viewH), trainerPos.y - viewH / 2));
  // Snap da câmera no pixel final evita flicker/"quadrados" quando o mapa está com zoom baixo.
  const renderCamX = Math.round(camX * zoom) / zoom;
  const renderCamY = Math.round(camY * zoom) / zoom;
  camViewRef.current = { camX: renderCamX, camY: renderCamY, zoom };
  const renderTrainerX = Math.round(trainerPos.x * zoom) / zoom;
  const renderTrainerY = Math.round(trainerPos.y * zoom) / zoom;
  const renderFollowerX = Math.round(followerState.x * zoom) / zoom;
  const renderFollowerY = Math.round(followerState.y * zoom) / zoom;

  // ---- Offline catch-up (uma vez ao montar) ----
  useEffect(() => {
    setIdle((prev) => {
      const elapsed = Math.min(OFFLINE_CAP_MS, Date.now() - prev.lastTickAt);
      const leader = team[0];
      const lvFactor = 1 + ((leader?.level ?? 5) / 40);
      const rate = IDLE_MAPS[prev.currentMap].rate * lvFactor;
      const goldGain = (elapsed / 1000) * 0.8 * rate;
      const rubyGain = (elapsed / 1000) * 0.02 * rate;
      const crystalGain = (elapsed / 1000) * 0.01 * rate;
      const next: IdleState = {
        ...prev,
        lastTickAt: Date.now(),
        pending: {
          gold: prev.pending.gold + goldGain,
          rubies: prev.pending.rubies + rubyGain,
          crystals: prev.pending.crystals + crystalGain,
          redshards: Math.min(RED_SHARD_PENDING_CAP, prev.pending.redshards ?? 0),
        },
      };
      saveIdle(next);
      return next;
    });
    if (starterChosenRef.current) {
      // Tenta restaurar cena de batalha (inimigos + timers de status) se o
      // jogador acabou de dar F5 no mesmo mapa. Impede abuso de reload
      // para zerar paralisia/veneno/debuff.
      try {
        const snap = loadBattleScene(idle.currentMap);
        if (snap && Array.isArray(snap.enemies) && snap.enemies.length > 0) {
          const restored = snap.enemies as Enemy[];
          setEnemies(restored);
          const maxId = restored.reduce((m, e) => Math.max(m, e.id ?? 0), 0);
          if (maxId >= enemyIdRef.current) enemyIdRef.current = maxId + 1;
          const now = Date.now();
          if (snap.paralyzedUntil > now) {
            // Cap defensivo: no máximo 20s a partir de agora ao rehidratar,
            // pra snapshots antigos (paralisia de 60s+) não travarem o jogador.
            const capped = Math.min(snap.paralyzedUntil, now + 20_000);
            paralyzedUntilRef.current = capped;
            setParalyzedUntil(capped);
          }
          if (snap.atkDebuffUntil > now) atkDebuffUntilRef.current = snap.atkDebuffUntil;
          if (snap.poisonUntil > now) poisonUntilRef.current = snap.poisonUntil;
        } else {
          setEnemies(spawnEnemies());
        }
      } catch {
        setEnemies(spawnEnemies());
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Persiste a cena de batalha continuamente (inimigos + timers de status).
  // Salvamos a cada 1s e também em visibilitychange/beforeunload.
  useEffect(() => {
    const persist = () => {
      try {
        saveBattleScene({
          mapId: idle.currentMap,
          savedAt: Date.now(),
          enemies: enemies as unknown[],
          paralyzedUntil: paralyzedUntilRef.current,
          atkDebuffUntil: atkDebuffUntilRef.current,
          poisonUntil: poisonUntilRef.current,
        });
      } catch { /* quota */ }
    };
    const iv = setInterval(persist, 1000);
    const onHide = () => { if (document.visibilityState === "hidden") persist(); };
    window.addEventListener("beforeunload", persist);
    document.addEventListener("visibilitychange", onHide);
    return () => {
      clearInterval(iv);
      window.removeEventListener("beforeunload", persist);
      document.removeEventListener("visibilitychange", onHide);
      persist();
    };
  }, [enemies, idle.currentMap]);

  // ---- Movimento do treinador: caça o inimigo mais próximo ----
  const stuckRef = useRef<{ id: number; count: number }>({ id: 0, count: 0 });
  const blacklistRef = useRef(new Map<number, number>()); // id -> expiresAt
  const wanderRef = useRef<{ x: number; y: number; until: number } | null>(null);
  const overCapMsgRef = useRef<number>(0);

  const enterWorldPortal = (p: WorldPortalDef) => {
    const lv = idle.trainerLevel ?? 1;
    if (p.reqLevel && lv < p.reqLevel) {
      const now = Date.now();
      if (now - overCapMsgRef.current > 4000) {
        overCapMsgRef.current = now;
        pushChat(`🔒 ${IDLE_MAPS[p.to].name} — requer Treinador Nv ${p.reqLevel} (você tem Nv ${lv}).`, "info");
      }
      return;
    }
    const TELEPORT_COST = 1000;
    if ((idle.bank.gold ?? 0) < TELEPORT_COST) {
      const now = Date.now();
      if (now - overCapMsgRef.current > 4000) {
        overCapMsgRef.current = now;
        pushChat(`💰 Teleporte custa ${TELEPORT_COST} ouro — você não tem o suficiente.`, "info");
      }
      return;
    }
    setIdle((s) => ({ ...s, currentMap: p.to, bank: { ...s.bank, gold: Math.max(0, (s.bank.gold ?? 0) - TELEPORT_COST) } }));
    setTrainerPos({ x: p.arriveX, y: p.arriveY });
    walkTargetRef.current = null;
    setWalkingTo(null);
    setAttackTargetId(null);
    setEnemies([]);
    clearBattleScene();
    pushChat(`Chegou em ${IDLE_MAPS[p.to].name}! (-${TELEPORT_COST} 🪙)`, "cap");
    if (p.to === "terra") {
      setTimeout(() => {
        pushChat(`🧙 SÁBIO DAS COLMEIAS: "Bem-vindo, treinador! Aqui vivem Guardiões Anti-Paralisia..."`, "info");
        pushChat(`🧙 "Ditto, Ditto ✦, Electabuzz, Gengar, Hitmontop, Magneton, Scizor e Umbreon."`, "info");
        pushChat(`🧙 "Basta 2 deles no seu time para ativar a Muralha Elétrica. Quanto mais raros, mais imune à paralisia — reduz até 85% da duração!"`, "info");
      }, 800);
    }
  };


  useEffect(() => {
    const iv = setInterval(() => {
      if (!starterChosenRef.current) return;
      if (restingRef.current) { if (moving) setMoving(false); return; }
      // ---- Modo manual (WASD) — só se NÃO houver destino clicado ----
      if (!autoRef.current && !walkTargetRef.current) {
        const keys = keysRef.current;
        let dx = 0, dy = 0;
        if (keys.has("w") || keys.has("arrowup")) dy -= 1;
        if (keys.has("s") || keys.has("arrowdown")) dy += 1;
        if (keys.has("a") || keys.has("arrowleft")) dx -= 1;
        if (keys.has("d") || keys.has("arrowright")) dx += 1;
        if (dx === 0 && dy === 0) { if (moving) setMoving(false); return; }
        if (!moving) setMoving(true);
        const mag = Math.hypot(dx, dy) || 1;
        const speed = 7 * (1 + honeyBonusNow());
        const stepX = (dx / mag) * speed;
        const stepY = (dy / mag) * speed;
        const nd: Dir = Math.abs(dx) > Math.abs(dy)
          ? (dx > 0 ? "right" : "left")
          : (dy > 0 ? "down" : "up");
        if (nd !== walkDirRef.current) { walkDirRef.current = nd; setWalkDir(nd); }
        const nextFace = dx >= 0 ? "right" : "left";
        if (dx !== 0 && nextFace !== pokemonFaceRef.current) {
          pokemonFaceRef.current = nextFace; setPokemonFace(nextFace);
        }
        setTrainerPos((tp) => {
          const clampX = (v: number) => Math.max(20, Math.min(WORLD_W - 20, v));
          const clampY = (v: number) => Math.max(20, Math.min(WORLD_H - 20, v));
          let nx = clampX(tp.x + stepX), ny = clampY(tp.y + stepY);
          if (collidesWithAny(nx, ny)) {
            nx = clampX(tp.x + stepX);
            if (collidesWithAny(nx, tp.y)) nx = tp.x;
            ny = clampY(tp.y + stepY);
            if (collidesWithAny(nx, ny)) ny = tp.y;
          }
          return { x: nx, y: ny };
        });
        return;
      }


      // ---- Deslocamento em direção a um destino escolhido (Lar / Lab / outro mapa) ----
      const wt = walkTargetRef.current;
      if (wt) {
        setTrainerPos((tp) => {
          const dx = wt.x - tp.x;
          const dy = wt.y - tp.y;
          const dist = Math.hypot(dx, dy);
          if (dist < 40) {
            const resume = wt.resumeAuto;
            walkTargetRef.current = null;
            setWalkingTo(null);
            wt.onArrive?.();
            if (resume) setAuto(true);
            if (moving) setMoving(false);
            return tp;
          }
          if (!moving) setMoving(true);
          const speed = 7 * (1 + honeyBonusNow());
          const stepX = (dx / dist) * speed;
          const stepY = (dy / dist) * speed;
          const nd: Dir = Math.abs(dx) > Math.abs(dy)
            ? (dx > 0 ? "right" : "left")
            : (dy > 0 ? "down" : "up");
          if (nd !== walkDirRef.current) { walkDirRef.current = nd; setWalkDir(nd); }
          const nextFace = dx >= 0 ? "right" : "left";
          if (nextFace !== pokemonFaceRef.current) {
            pokemonFaceRef.current = nextFace; setPokemonFace(nextFace);
          }
          const clampX = (v: number) => Math.max(20, Math.min(WORLD_W - 20, v));
          const clampY = (v: number) => Math.max(20, Math.min(WORLD_H - 20, v));
          return { x: clampX(tp.x + stepX), y: clampY(tp.y + stepY) };
        });
        return;
      }

      if (!autoRef.current) { if (moving) setMoving(false); return; }
      // Time inviável: se todos estão desmaiados (HP=0) → vai ao Lar curar (5s).
      // Se time está vazio mas há pokémon prontos na Coleção → não trava, só
      // pausa o auto e avisa pra escolher outro. Sem energia é resolvido
      // automaticamente enviando o pokémon à Casa Azul.
      {
        const nowE = Date.now();
        const noTeam = team.length === 0;
        const allFainted = !noTeam && team.every((p) => (p.uid === team[0].uid ? leaderHp : (p.hp ?? calcIdleMaxHp(p))) <= 0);
        if (allFainted && !restingRef.current && !walkTargetRef.current) {
          const lar = BUILDINGS.find((b) => b.key === "lar");
          if (lar) {
            pushChat(`🏠 Time desmaiado — indo até o Lar recuperar HP (5s).`, "info");
            walkTargetRef.current = {
              x: lar.x, y: lar.y + 20, label: "Lar",
              resumeAuto: true,
              onArrive: () => { restAtHome("lar"); },
            };
            setWalkingTo("Lar");
          }
          if (moving) setMoving(false);
          return;
        }
        if (noTeam) {
          // Sem pokémon no time — não força ida ao Lar; deixa o jogador escolher outro da Coleção.
          if (autoRef.current) {
            setIdle((s) => ({ ...s, autoBattle: { ...(s.autoBattle ?? { enabled: true, useBall: true, preferredBall: "auto", captureHpPct: 1 }), enabled: false } }));
            pushChat(`🎒 Sem Pokémon no time. Abra a Coleção e escolha outro para batalhar.`, "info");
          }
          if (moving) setMoving(false);
          return;
        }
      }

      // Líder acima do cap: pode atacar normalmente, mas XP/ouro serão nerfados no cálculo abaixo.


      setTrainerPos((tp) => {

        const nowT = Date.now();
        // limpa blacklist expirada
        for (const [k, v] of blacklistRef.current) if (v < nowT) blacklistRef.current.delete(k);

        // Alvos candidatos: baús fechados (prioridade se mais próximos) + inimigos vivos
        const openChests = chests.filter((c) => !c.opened);
        const leaderLvNow = team[0]?.level ?? 1;
        // Portais bloqueados por nível do TREINADOR: ignora alvos próximos deles
        // para não travar tentando atravessar. Se estiver liberado, pode alcançar.
        const trLv = idle.trainerLevel ?? 1;
        const lockedPortals = WORLD_PORTALS.filter((p) => p.from === idle.currentMap && (p.reqLevel ?? 0) > trLv);
        const nearLockedPortal = (x: number, y: number) =>
          lockedPortals.some((p) => Math.hypot(x - p.x, y - p.y) < 200);
        const aliveAll = enemies.filter((e) => e.hp > 0 && !blacklistRef.current.has(e.id) && !nearLockedPortal(e.x, e.y));
        // Líder pode atacar qualquer Pokémon do mapa — ganhos serão nerfados se muito acima.
        const alive = aliveAll;
        const enemyPool = alive.length > 0 ? alive : [];


        type Tgt = { x: number; y: number; kind: "enemy" | "chest"; id: number; range: number };
        const candidates: Tgt[] = [
          ...openChests.map((c) => ({ x: c.x, y: c.y, kind: "chest" as const, id: c.id, range: 30 })),
          ...enemyPool.map((e) => ({ x: e.x, y: e.y, kind: "enemy" as const, id: e.id, range: ATTACK_RANGE * 0.7 })),
        ];
        if (candidates.length === 0) {
          // Sem alvos válidos no mapa. Vagueia com trajetos LONGOS cobrindo
          // regiões diferentes, pra não ficar preso rondando o mesmo ponto.
          const wp = wanderRef.current;
          const reached = wp ? Math.hypot(wp.x - tp.x, wp.y - tp.y) < 60 : true;
          const expired = wp ? nowT > wp.until : true;
          if (!wp || reached || expired) {
            // Escolhe destino longe da posição atual (pelo menos 40% do mapa)
            const minDist = Math.min(WORLD_W, WORLD_H) * 0.4;
            let nx = 0, ny = 0;
            for (let i = 0; i < 8; i++) {
              nx = 120 + Math.random() * (WORLD_W - 240);
              ny = 120 + Math.random() * (WORLD_H - 240);
              if (Math.hypot(nx - tp.x, ny - tp.y) >= minDist) break;
            }
            wanderRef.current = { x: nx, y: ny, until: nowT + 15000 };
          }
          const w = wanderRef.current!;
          const wdx = w.x - tp.x, wdy = w.y - tp.y;
          const wd = Math.hypot(wdx, wdy) || 1;
          if (!moving) setMoving(true);
          const spd = 16 * (1 + honeyBonusNow());
          const wnd: Dir = Math.abs(wdx) > Math.abs(wdy)
            ? (wdx > 0 ? "right" : "left")
            : (wdy > 0 ? "down" : "up");
          if (wnd !== walkDirRef.current) {
            walkDirRef.current = wnd;
            setWalkDir(wnd);
          }
          const wFace = wdx >= 0 ? "right" : "left";
          if (wFace !== pokemonFaceRef.current) {
            pokemonFaceRef.current = wFace;
            setPokemonFace(wFace);
          }
          return { x: tp.x + (wdx / wd) * spd, y: tp.y + (wdy / wd) * spd };
        }
        candidates.sort((a, b) =>
          ((a.x - tp.x) ** 2 + (a.y - tp.y) ** 2) - ((b.x - tp.x) ** 2 + (b.y - tp.y) ** 2)
        );
        const target = candidates[0];
        const dx = target.x - tp.x;
        const dy = target.y - tp.y;
        const dist = Math.hypot(dx, dy);
        // ---- Detecção de "preso": se ficar muito tempo tentando alcançar
        // o mesmo alvo (inimigo) sem entrar no alcance, blacklist e busca outro.
        // NÃO usa distância como critério — inimigo longe é válido, só anda até ele.
        if (target.kind === "enemy") {
          const sr = stuckRef.current;
          if (sr.id === target.id) {
            sr.count += 1;
          } else {
            stuckRef.current = { id: target.id, count: 1 };
          }
          // ~150 ticks * 120ms = ~18s realmente travado sem progredir
          if (stuckRef.current.count > 150) {
            blacklistRef.current.set(target.id, nowT + 15000);
            stuckRef.current = { id: 0, count: 0 };
            if (moving) setMoving(false);
            return tp;
          }
        } else {
          stuckRef.current = { id: 0, count: 0 };
        }
        if (dist < target.range) {
          stuckRef.current = { id: 0, count: 0 };
          if (moving) setMoving(false);
          return tp;
        }
        if (!moving) setMoving(true);
        // Velocidade escala com distância: longe anda mais rápido pra não ficar perdido.
        const distBoost = dist > 300 ? 1.5 : dist > 150 ? 1.25 : 1;
        const speed = 6 * distBoost * (1 + honeyBonusNow());
        const stepX = (dx / dist) * speed;
        const stepY = (dy / dist) * speed;
        const nd: Dir = Math.abs(dx) > Math.abs(dy)
          ? (dx > 0 ? "right" : "left")
          : (dy > 0 ? "down" : "up");
        if (nd !== walkDirRef.current) {
          walkDirRef.current = nd;
          setWalkDir(nd);
        }
        const nextFace = dx >= 0 ? "right" : "left";
        if (nextFace !== pokemonFaceRef.current) {
          pokemonFaceRef.current = nextFace;
          setPokemonFace(nextFace);
        }
        // AUTO: sem colisão — anda em linha reta atravessando obstáculos
        const clampX = (v: number) => Math.max(20, Math.min(WORLD_W - 20, v));
        const clampY = (v: number) => Math.max(20, Math.min(WORLD_H - 20, v));
        return { x: clampX(tp.x + stepX), y: clampY(tp.y + stepY) };
      });


      // ---- Inimigos agressivos perseguem o pokémon do treinador ----
      setEnemies((prev) => {
        if (prev.length === 0) return prev;
        let changed = false;
        const tx = trainerPos.x;
        const ty = trainerPos.y;
        const next = prev.map((e) => {
          if (e.hp <= 0) return e;
          let ne = e;
          // Oddish/Gloom se curam lentamente enquanto vivos (~3%/s)
          if ((e.sp === "oddish" || e.sp === "gloom") && e.hp < e.maxHp) {
            const heal = Math.max(1, Math.round(e.maxHp * 0.004));
            ne = { ...ne, hp: Math.min(e.maxHp, e.hp + heal) };
            changed = true;
          }
          if (!ne.aggressive) return ne;
          const dx = tx - ne.x;
          const dy = ty - ne.y;
          const dist = Math.hypot(dx, dy);
          const aggroR = ne.aggroR ?? 180;
          if (dist < 50 || dist > aggroR) return ne;
          const speed = 3;
          const nx = ne.x + (dx / dist) * speed;
          const ny = ne.y + (dy / dist) * speed;
          if (collidesWithAny(nx, ny)) return ne;
          changed = true;
          return { ...ne, x: nx, y: ny, face: (dx >= 0 ? "right" : "left") as "left" | "right" };
        });
        return changed ? next : prev;
      });
    }, 60);
    return () => clearInterval(iv);
  }, [enemies, moving, obstacles, chests]);

  // ---- Top-up lento de inimigos (spawn escalonado, mantém o jogador atento) ----
  useEffect(() => {
    const iv = setInterval(() => {
      if (!starterChosenRef.current) return;
      if (restingRef.current) return;
      setEnemies((prev) => {
        const alive = prev.filter((e) => e.hp > 0);
        if (alive.length >= ENEMY_TARGET) return prev;
        const placed = alive.map((e) => ({ x: e.x, y: e.y }));
        const ne = spawnOneEnemy(placed);
        if (!ne) return prev;
        // Anúncio quando um raro+ ou RIDER aparece via top-up
        if (ne.rider) {
          pushEvent("✦", "POKÉMON RIDER!", `${ne.sp.replace(/_/g, " ").toUpperCase()} Lv.${ne.level} apareceu — recompensa massiva!`, "#ff5ec7");
          pushChat(`✦ RIDER: ${ne.sp.replace(/_/g, " ").toUpperCase()} Lv.${ne.level} apareceu! XP MASSIVO`, "cap");
        } else if (ne.rarity === "mythic" || ne.rarity === "mythic_shiny") {
          const label = ne.rarity === "mythic_shiny" ? "MÍTICO SHINY" : ne.rarity.toUpperCase();
          const color = ne.rarity === "mythic_shiny" ? "#ffd94d" : ne.rarity === "mythic" ? "#ff5252" : ne.rarity === "legendary" ? "#ff8b3d" : "#c084fc";
          pushEvent("★", `${label} À VISTA!`, `${ne.sp.replace(/_/g, " ").toUpperCase()} apareceu no mapa`, color);
          
        }
        return [...prev, ne];
      });
    }, 2000 + Math.floor(Math.random() * 1500)); // 2-3.5s entre spawns (rápido, evita mapa vazio)
    return () => clearInterval(iv);
  }, [idle.currentMap, team, obstacles]);



  // ---- Tick de batalha (só ataca quando estiver perto do alvo) ----
  useEffect(() => {
    const iv = setInterval(() => {
      if (!starterChosenRef.current) return;
      if (restingRef.current) return;
      setNow(Date.now());

      const leader = team[0];
      if (!leader) return;
      // Se o meu pokémon está desmaiado: não faz nada (precisa reviver)
      if (leaderHp <= 0) { setAttackTargetId((c) => c !== null ? null : c); return; }
      // Líder sem energia (e nenhum reserva usável): não ataca nem farma
      if (petIsExhausted(leader)) { setAttackTargetId((c) => c !== null ? null : c); return; }
      if (!autoBattleRef.current?.enabled) { setAttackTargetId((c) => c !== null ? null : c); return; }

      if (Date.now() < paralyzedUntilRef.current) return;
      setEnemies((prev) => {

        if (prev.length === 0) return spawnEnemies();
        const alive = prev.filter((e) => e.hp > 0);
        if (alive.length === 0) return spawnEnemies();
        // acha o mais próximo do treinador
        let target = alive[0];
        let bestD = Infinity;
        for (const e of alive) {
          const d = (e.x - trainerPos.x) ** 2 + (e.y - trainerPos.y) ** 2;
          if (d < bestD) { bestD = d; target = e; }
        }
        // só entra em combate se estiver perto (raio do ataque)
        if (Math.sqrt(bestD) > ATTACK_RANGE) {
          // Alvo fora de alcance: limpa target para não ficar preso mostrando HUD
          setAttackTargetId((cur) => (cur !== null ? null : cur));
          return prev;
        }
        // marca alvo atual (para virar o pokémon na direção dele)
        setAttackTargetId(target.id);
        const attackFace = target.x >= trainerPos.x ? "right" : "left";
        if (attackFace !== pokemonFaceRef.current) {
          pokemonFaceRef.current = attackFace;
          setPokemonFace(attackFace);
        }

        // Posição atual do pokémon líder (trilha suave)
        const dir = walkDirRef.current;
        void dir;
        const followerAtX = followerStateRef.current.x;
        const followerAtY = followerStateRef.current.y;

        const base = SPECIES_BASE[leader.species];
        // CRIT: base 5% + 0.3%/nível + 0.5% por ponto de crit ascension, cap 60%
        const critAsc = (leader.ascensionStats as Record<string, number> | undefined)?.crit ?? 0;
        const critChance = Math.min(0.6, 0.05 + leader.level * 0.003 + critAsc * 0.005);
        const isCrit = Math.random() < critChance;
        // Pokémon selvagens têm 50% de resistência ao bônus do Livro de Ataque (balanceamento anti-stack)
        const atkBookEffective = idle.buffs.atk * 0.5;
        let dmg = Math.floor((5 + leader.level * 0.8 + base.atk * 0.12 + Math.random() * 5) * (1 + atkBookEffective));
        if (isCrit) dmg = Math.floor(dmg * 1.8);
        // n2 debuff: enquanto ativo, reduz -40% do ataque do jogador
        if (Date.now() < atkDebuffUntilRef.current) dmg = Math.floor(dmg * 0.6);
        dmg = Math.max(1, Math.floor(dmg * playerDamageVsHighLevelMult(leader.level, target.level)));

        // Lunge: pokémon avança em direção ao inimigo
        const animId = attackAnimIdRef.current++;
        setAttackAnim({ id: animId, fromX: followerAtX, fromY: followerAtY, toX: target.x, toY: target.y, ts: Date.now(), crit: isCrit, element: elementOf(leader.species) });
        setTimeout(() => setAttackAnim((a) => (a && a.id === animId ? null : a)), 420);

        // Dano do meu pokémon → aparece EM CIMA DO INIMIGO (com pequeno delay = impacto do lunge)
        setTimeout(() => {
          pushFxAt(target.x, target.y - 34, isCrit ? `CRIT ${dmg}!` : `${dmg}`, isCrit ? "crit" : "myDmg");
        }, 180);
        // (dano rotineiro não vai para o chat — apenas floating text)

        // Contra-ataque do inimigo: dano no meu pokémon (reduzido pelo buff de def)
        const eBase = SPECIES_BASE[target.sp];
        const eliteMult = target.elite ? 2.5 : 1;
        const honeyDef = honeyBonusNow();
        let eDmg = Math.max(1, Math.floor((2 + eBase.atk * 0.045 + Math.random() * 3) * eliteMult * highLevelEnemyDamageMult(target.level, leader.level) * Math.max(0.1, 1 - idle.buffs.def - honeyDef)));

        // ==== Efeitos por mapa (Terry / n2 / n3) ====
        const mapNow = idle.currentMap;
        if (mapNow === "terry" && Math.random() < 0.28) {
          // Peçonha: se def do jogador for baixa, aplica DoT por 6s
          const defTotal = (idle.buffs.def ?? 0) + honeyDef;
          if (defTotal < 0.35) {
            poisonUntilRef.current = Date.now() + 6000;
            pushChat(`☠ Seu Pokémon foi ENVENENADO!`, "hit");
          }
        }
        if (mapNow === "n2" && Math.random() < 0.20) {
          atkDebuffUntilRef.current = Date.now() + 8000;
          pushChat(`⬇ Ataque reduzido em 40% por 8s!`, "hit");
        }
        if (mapNow === "n3") {
          eDmg = Math.floor(eDmg * 1.5);
        }


        // ✦ Habilidades especiais de espécies fortes (crit / paralisar / fugir)
        const SPECIAL_ABILITY: Partial<Record<Species, { crit: number; para: number; flee: number }>> = {
          lugia:     { crit: 0.45, para: 0.35, flee: 0.14 },
          darkrai:   { crit: 0.40, para: 0.30, flee: 0.12 },
          ho_oh:     { crit: 0.35, para: 0.22, flee: 0.10 },
          deoxys:    { crit: 0.32, para: 0.25, flee: 0.11 },
          groudon:   { crit: 0.40, para: 0.10, flee: 0.08 },
          snorlax_mythic: { crit: 0.28, para: 0.18, flee: 0.06 },
          lapras_shiny: { crit: 0.25, para: 0.25, flee: 0.08 },
          hariyama:  { crit: 0.20, para: 0.10, flee: 0 },
          ursaring:  { crit: 0.22, para: 0.06, flee: 0 },
          moltres:   { crit: 0.42, para: 0.20, flee: 0.10 },
          zapdos:    { crit: 0.38, para: 0.45, flee: 0.10 },
          articuno:  { crit: 0.35, para: 0.30, flee: 0.12 },
          ditto:     { crit: 0, para: 0.10, flee: 0 },
          ditto_shiny: { crit: 0, para: 0.10, flee: 0 },
          // Apex bosses — crítico brutal, chance leve de para (nidoking shiny é o mais letal)
          infernape:      { crit: 0.35, para: 0.05, flee: 0 },
          krookodile:     { crit: 0.40, para: 0.08, flee: 0 },
          tyranitar:      { crit: 0.48, para: 0.12, flee: 0 },
          nidoking_shiny: { crit: 0.55, para: 0.20, flee: 0.05 },
          rapidash:       { crit: 0.30, para: 0.04, flee: 0.08 },
          rapidash_shiny: { crit: 0.38, para: 0.06, flee: 0.10 },
          skarmory:       { crit: 0.32, para: 0.10, flee: 0 },
          // Dialga — edição especial: crit devastador, paraliza, foge fácil
          dialga:         { crit: 0.65, para: 0.40, flee: 0.25 },
          // Odisséia Oddish — lickitung usa SONÍFERO curto (2-3s); mewtwo é devastador
          lickitung:        { crit: 0.05, para: 0.55, flee: 0 },
          lickitung_shiny:  { crit: 0.08, para: 0.75, flee: 0 },
          mewtwo_event:     { crit: 0.60, para: 0.50, flee: 0.05 },
        };
        const spec = SPECIAL_ABILITY[target.sp];
        if (spec) {
          if (Math.random() < spec.crit) {
            eDmg = Math.floor(eDmg * 2.5);
            pushChat(`💥 ${target.sp.replace(/_/g," ").toUpperCase()} desferiu um GOLPE CRÍTICO!`, "hit");
          }
          if (Math.random() < spec.para) {
            const synNow = computeTeamSynergies(teamRef.current);
            const resist = Math.min(0.99, synNow.paraResist);
            if (resist > 0 && Math.random() < resist) {
              pushChat(`🧲 Sinergia do time RESISTIU à paralisia de ${target.sp.replace(/_/g," ").toUpperCase()}!`, "info");
            } else {
              // Duração enxuta — paralisia de minuto travava o jogador.
              // Dialga (evento) mantém peso maior; Ditto/Lickitung/Mewtwo usam Sonífero curto.
              const isLickSleep = target.sp === "lickitung" || target.sp === "lickitung_shiny";
              const isMewtwoSleep = target.sp === "mewtwo_event";
              const baseDur = target.sp === "dialga" ? 15_000
                : (target.sp === "ditto" || target.sp === "ditto_shiny") ? 8_000
                : isLickSleep ? (2000 + Math.floor(Math.random() * 1000))
                : isMewtwoSleep ? 3000
                : 10_000;
              const isDittoSleep = target.sp === "ditto" || target.sp === "ditto_shiny";
              const isSleep = isDittoSleep || isLickSleep || isMewtwoSleep;
              // paraResist não só resiste — reduz duração proporcionalmente (sonífero curto ignora)
              const durReduction = isLickSleep || isMewtwoSleep ? 0 : Math.min(0.85, synNow.paraResist);
              const dur = Math.floor(baseDur * (1 - durReduction));
              paralyzedUntilRef.current = Date.now() + dur;
              paralyzedByEnemyIdRef.current = target.id;
              setParalyzedUntil(paralyzedUntilRef.current);
              if (isLickSleep) {
                pushChat(`💤 ${target.sp === "lickitung_shiny" ? "LICKITUNG ✦" : "LICKITUNG"} usou SONÍFERO — seu Pokémon dormiu por ${Math.round(dur/1000)}s!`, "hit");
              } else if (isMewtwoSleep) {
                pushChat(`💤✦ MEWTWO ✦✧ arremessou uma onda psíquica — sono profundo por ${Math.round(dur/1000)}s!`, "hit");
              } else if (isDittoSleep) {
                pushChat(`💤 ${target.sp === "ditto_shiny" ? "DITTO ✨" : "DITTO"} usou SONÍFERO — seu Pokémon dormiu por ${Math.round(dur/1000)}s!`, "hit");
              } else if (durReduction > 0.1) {
                pushChat(`⚡ Paralisia! Reduzida em ${Math.round(durReduction*100)}% pelos Guardiões — ${Math.round(dur/1000)}s.`, "hit");
              } else {
                pushChat(`⚡ ${target.sp.replace(/_/g," ").toUpperCase()} paralisou seu Pokémon por ${Math.round(dur/1000)}s!`, "hit");
              }
              void isSleep;
            }
          }
          if (spec.flee > 0 && Math.random() < spec.flee) {
            const fleeId = target.id;
            const fleeSp = target.sp;
            setTimeout(() => {
              setEnemies((cur) => cur.filter((e) => e.id !== fleeId));
              // Ao fugir, remove efeitos de status que o inimigo causou (paralisia)
              // senão o treinador ficaria travado sem alvo por até 2min.
              paralyzedUntilRef.current = 0;
              paralyzedByEnemyIdRef.current = null;
              setParalyzedUntil(0);
              blacklistRef.current.delete(fleeId);
              setAttackTargetId((c) => (c === fleeId ? null : c));
              pushChat(`💨 ${fleeSp.replace(/_/g," ").toUpperCase()} fugiu do combate!`, "info");
            }, 900);
          }
        }

        // 🏰 GINÁSIO MEDIEVAL — inimigos batem muito mais forte por andar.
        {
          const gf = GYM_FLOOR_BY_ID[idle.currentMap];
          if (gf) eDmg = Math.floor(eDmg * gf.dmgMult);
        }

        // 💀 PERIGO ABISSAL — dano brutal, pode matar em 3 hits
        if (target.menace) {
          eDmg = Math.floor(eDmg * 3.2);
          if (Math.random() < 0.7) {
            eDmg = Math.floor(eDmg * 1.9);
            pushChat(`💀 PERIGO ABISSAL desferiu um GOLPE DEVASTADOR!`, "hit");
          }
        }

        setTimeout(() => {
          setEnemyAttackAnim({
            id: attackAnimIdRef.current++,
            fromX: target.x, fromY: target.y,
            toX: followerAtX, toY: followerAtY,
            ts: Date.now(),
            element: elementOf(target.sp),
          });
          pushFxAt(followerAtX, followerAtY - 34, `-${eDmg}`, "enemyDmg");
        }, 480);
        setLeaderHp((h) => {
          let nh = Math.max(0, h - eDmg);
          // (dano rotineiro do inimigo — sem spam no chat)
          // Auto-poção: se HP% <= threshold, consome 1 poção
          const leaderNow = team[0];
          if (leaderNow && idle.autoHeal.enabled && nh > 0) {
            const maxHp = calcIdleMaxHp(leaderNow);
            if (nh / maxHp <= idle.autoHeal.threshold && (idle.items.potion ?? 0) > 0) {
              const heal = Math.floor(maxHp * POTION_HEAL_PCT);
              nh = Math.min(maxHp, nh + heal);
              setIdle((s) => ({ ...s, items: { ...s.items, potion: (s.items.potion ?? 0) - 1 } }));
              pushFxAt(followerAtX, followerAtY - 60, `AUTO +${heal} HP`, "gold");
              pushChat(`🧪 Auto-Poção usada (+${heal} HP).`, "info");
            }
          }
          if (nh <= 0) {
            pushFxAt(followerAtX, followerAtY - 70, "DESMAIOU!", "enemyDmg");
            pushChat(`Seu Pokémon desmaiou!`, "hit");
            // Penalidade por desmaio — perde ouro sempre
            const deathPct = idle.currentMap === "n3" ? 0.10 : 0.05;
            if (idle.currentMap === "n3") {
              setTeam((tm) => tm.map((p, idx) => idx === 0 && p.level > 1 ? { ...p, level: p.level - 1, xp: 0 } : p));
            }
            setIdle((s) => {
              const lose = Math.floor((s.bank.gold ?? 0) * deathPct);
              if (lose > 0) {
                pushChat(`💀 Você desmaiou — perdeu ${lose} 🪙${idle.currentMap === "n3" ? " e -1 nível" : ""}.`, "hit");
              }
              return { ...s, bank: { ...s.bank, gold: Math.max(0, (s.bank.gold ?? 0) - lose) } };
            });
          }
          return nh;
        });


        const next = prev.map((e) => {
          if (e.id !== target.id) return e;
          const wasCamou = !!(e.disguise && !e.revealed);
          if (wasCamou) {
            pushChat(`🎭 A camuflagem falhou! Era um ${e.sp === "ditto_shiny" ? "DITTO ✨ SHINY" : "DITTO"}!`, "info");
          }
          return { ...e, hp: e.hp - dmg, revealed: e.disguise ? true : e.revealed, face: (trainerPos.x < e.x ? "left" : "right") as "left" | "right" };
        });
        const killedNow = next.find((e) => e.id === target.id && e.hp <= 0);
        if (killedNow) {
          // Se o inimigo que paralisou morreu, libera o efeito.
          if (paralyzedByEnemyIdRef.current === killedNow.id) {
            paralyzedUntilRef.current = 0;
            paralyzedByEnemyIdRef.current = null;
            setParalyzedUntil(0);
          }
          const expActive = !!(idle.buffs.expMultUntil && Date.now() < idle.buffs.expMultUntil);
          const orbActive = !!(idle.buffs.orbUntil && Date.now() < idle.buffs.orbUntil);
          const totalExpBoost = (expActive ? idle.buffs.expMult : 0) + (orbActive ? (idle.buffs.orbMult ?? 0) : 0);
          const goldActive = !!(idle.buffs.goldMultUntil && Date.now() < idle.buffs.goldMultUntil);
          const goldMult = 1 + (goldActive ? (idle.buffs.goldMult ?? 0) : 0);
          // Bônus de drop pela raridade do líder
          const leaderRarity = team[0]?.rarity ?? "common";
          const rarityDropBonus: Partial<Record<Rarity, number>> = {
            rare: 0.03, epic: 0.07, legendary: 0.10, mythic: 0.15, mythic_shiny: 0.20,
          };
          const rarityBonus = rarityDropBonus[leaderRarity] ?? 0;
          // Sinergia de time: todos da mesma tier
          const teamSynergyMap: Partial<Record<Rarity, number>> = {
            rare: 0.02, epic: 0.05, legendary: 0.10, mythic: 0.15, mythic_shiny: 0.20,
          };
          const synergyRarity = team.length >= 2 && team.every((p) => p.rarity === leaderRarity) ? leaderRarity : null;
          const synergyBonus = synergyRarity ? (teamSynergyMap[synergyRarity] ?? 0) : 0;
          const totalBonus = rarityBonus + synergyBonus;
          const totalMult = goldMult * (1 + totalBonus);
          const honeyMult = 1 + honeyBonusNow();
          // Multiplicador pela raridade DO INIMIGO derrotado
          const enemyRarityMultMap: Record<Rarity, number> = {
            common: 1, uncommon: 1.6, rare: 2.6, epic: 4.5, legendary: 8, mythic: 14, mythic_shiny: 22,
          };
          const enemyRarityMult = enemyRarityMultMap[target.rarity as Rarity] ?? 1;
          // Nerf por diferença de nível: se líder ≥15 níveis acima do alvo, XP/ouro colapsam.
          const leaderLvKill = team[0]?.level ?? 1;
          const lvGap = leaderLvKill - (target.level ?? leaderLvKill);
          const isRiderKill = !!target.rider;
          const overLvlPenalty = isRiderKill ? 1 : (lvGap >= 15 ? Math.max(0.02, 1 - (lvGap - 14) * 0.15) : 1);
          const riderMult = isRiderKill ? 8 : 1; // rider dá MUITO xp
          const riderGoldMult = isRiderKill ? 4 : 1;
          const elemSyn = computeTeamSynergies(team);
          const mythEventXpMult = idle.currentMap === "evento_myth" ? 6 : 1;
          const grassOddishXpMult = idle.currentMap === "grass_oddish" ? 3 : 1;
          const xpTitleMult = target.xpTitle ? 2 : 1; // 🏷️ título XP dobra a experiência
          const xpBase = Math.floor((60 + Math.random() * 100) * (1 + totalExpBoost) * (1 + totalBonus) * (1 + elemSyn.xpMult) * honeyMult * enemyRarityMult * 0.15 * overLvlPenalty * riderMult * mythEventXpMult * grassOddishXpMult * xpTitleMult);
          const xp = Math.max(1, xpBase);
          // Vale Verdejante de Neve: drop reduzido; outros mapas com ganhos maiores
          const baseGold = idle.currentMap === "neve"
            ? (2 + Math.floor(Math.random() * 4))
            : Math.floor(35 + Math.random() * 55);
          // Se o treinador passou do cap do mapa, ouro colapsa junto com o XP.
          const mapCapGold = IDLE_MAPS[idle.currentMap].maxLevel;
          const overCapGold = mapCapGold != null ? Math.max(0, (idle.trainerLevel ?? 1) - mapCapGold) : 0;
          const goldCapPenalty = isRiderKill ? 1 : (overCapGold > 0 ? Math.max(0.05, 1 - overCapGold * 0.2) : 1);
          const gold = Math.max(1, Math.floor(baseGold * totalMult * (1 + elemSyn.goldMult) * enemyRarityMult * goldCapPenalty * overLvlPenalty * riderGoldMult));
          if (isRiderKill) {
            pushEvent("✦", "RIDER DERROTADO!", `+${xp} EXP · +${gold} ouro`, "#ff5ec7");
            pushChat(`✦ RIDER DERROTADO! +${xp} EXP · +${gold} ouro`, "cap");
          }

          pushFxAt(target.x, target.y - 50, `+${xp} EXP`, "xp");
          const bonusParts: string[] = [];
          if (expActive) bonusParts.push(`EXP+${Math.round(idle.buffs.expMult * 100)}%`);
          if (orbActive) bonusParts.push(`ORB+${Math.round((idle.buffs.orbMult ?? 0) * 100)}%`);
          if (goldActive) bonusParts.push(`Ouro+${Math.round((idle.buffs.goldMult ?? 0) * 100)}%`);
          if (rarityBonus > 0) bonusParts.push(`Líder ${leaderRarity}+${Math.round(rarityBonus * 100)}%`);
          if (synergyBonus > 0) bonusParts.push(`Sinergia ${synergyRarity}+${Math.round(synergyBonus * 100)}%`);
          const suffix = bonusParts.length ? ` (${bonusParts.join(" · ")})` : "";
          // Acumula ganhos e deixa o timer (30s) anunciar o resumo no chat.
          xpAccumRef.current.xp += xp;
          xpAccumRef.current.gold += gold;
          xpAccumRef.current.kills += 1;
          xpAccumRef.current.map = idle.currentMap;
          // drops (sem pokébola de drop — agora vem só da loja)
          const drops: string[] = [];
          const isOddishMap = idle.currentMap === "oddish_o1" || idle.currentMap === "oddish_o2" || idle.currentMap === "oddish_o3";
          if (isOddishMap) {
            // 🌿 EVENTO ODISSÉIA ODDISH — SÓ dropa Stones Elementais.
            // Épico / mítico / mítico shiny / lendário são os únicos que dropam.
            const isValuable = target.rarity === "epic" || target.rarity === "legendary" || target.rarity === "mythic" || target.rarity === "mythic_shiny";
            if (isValuable) {
              const STONES = ["stone_grass","stone_fire","stone_water","stone_electric","stone_dark","stone_dragon"];
              // Drop nerfado: ~25% chance de 1 stone random
              if (Math.random() < 0.25) {
                const first = STONES[Math.floor(Math.random() * STONES.length)];
                drops.push(first);
                // ~8% de chance de vir uma SEGUNDA stone de elemento DIFERENTE
                if (Math.random() < 0.08) {
                  const rest = STONES.filter((s) => s !== first);
                  drops.push(rest[Math.floor(Math.random() * rest.length)]);
                }
              }
              // Míticos/shiny: 40% de chance de bônus de uma stone extra diferente (antes garantido)
              if ((target.rarity === "mythic" || target.rarity === "mythic_shiny") && Math.random() < 0.40) {
                const already = new Set(drops);
                const rest = STONES.filter((s) => !already.has(s));
                if (rest.length) drops.push(rest[Math.floor(Math.random() * rest.length)]);
              }
            }
          } else {
            for (const it of ITEM_POOL) {
              if (it.id === "pokeball") continue;
              if (Math.random() < it.chance * (1 + totalBonus) * honeyMult) drops.push(it.id);
            }
            // Ultra Ball: raro+, 30% padrão. Mapas Terry/n2/n3 têm chance elevada e Great Ball extra.
            const ultraEligible = target.rarity === "rare" || target.rarity === "epic" || target.rarity === "legendary" || target.rarity === "mythic" || target.rarity === "mythic_shiny";
            const cm = idle.currentMap;
            const isTerryMap = cm === "terry" || cm === "n2" || cm === "n3";
            const isGeliusMap = cm === "gelius1" || cm === "gelius2";
            const ultraChance = isGeliusMap ? 0.04 : isTerryMap ? 0.02 : 0.006;
            if ((ultraEligible || isGeliusMap) && Math.random() < ultraChance) drops.push("ultraball");
            if (isTerryMap && Math.random() < 0.45) drops.push("greatball");
          }
          // ⚡✦ RAICHU MÍTICO — drop garantido de Stone Elétrica ao derrotar
          if (target.sp === "raichu") {
            drops.push("stone_electric");
            // 60% chance de vir uma stone extra, 25% chance de vir 2 extras
            if (Math.random() < 0.60) drops.push("stone_electric");
            if (Math.random() < 0.25) drops.push("stone_electric");
            pushChat("⚡✦ Raichu Mítico caiu e deixou Stone Elétrica!", "cap");
          }
          // 🐉✦ RAYQUAZA MÍTICO — drop garantido de Stone Dragão ao derrotar
          if (target.sp === "rayquaza") {
            drops.push("stone_dragon");
            if (Math.random() < 0.60) drops.push("stone_dragon");
            if (Math.random() < 0.25) drops.push("stone_dragon");
            pushChat("🐉✦ Rayquaza Mítico caiu e deixou Stone Dragão!", "cap");
          }
          // Evento Gelius: chance alta de cristal extra
          // (cristal extra do Gelius vai direto para o banco em setIdle abaixo)

          // 🔻 CRISTAL VERMELHO — todo pokémon derrotado dropa fragmentos por raridade (1 a 5).
          const RED_SHARDS_BY_RARITY: Record<string, number> = {
            common: 1, uncommon: 2, rare: 3, epic: 4,
            legendary: 5, mythic: 5, mythic_shiny: 5,
          };
          // 🔻 No Vale dos Fragmentos Vermelhos qualquer pokémon dropa de 5 a 20 fragmentos.
          const gymFloorDrop = GYM_FLOOR_BY_ID[idle.currentMap];
          const redShardGain = gymFloorDrop
            ? gymFloorDrop.shards[0] + Math.floor(Math.random() * (gymFloorDrop.shards[1] - gymFloorDrop.shards[0] + 1))
            : idle.currentMap === "vale_fragmentos"
            ? 5 + Math.floor(Math.random() * 16)
            : (RED_SHARDS_BY_RARITY[target.rarity as string] ?? 1);
          // 🏰 Drops raros do Ginásio Medieval — itens especiais com taxas muito baixas.
          if (gymFloorDrop) {
            const bossBonus = (target.apex || target.eventLegendary) ? 3 : 1;
            for (const d of GYM_RARE_DROPS[gymFloorDrop.id]) {
              if (Math.random() < d.chance * (1 + totalBonus) * honeyMult * bossBonus) {
                drops.push(d.id);
                if (d.id === "cristal_negro" || d.id === "nucleo_arcano" || d.id === "orb_suprema") {
                  pushChat(`✦ DROP LENDÁRIO DO GINÁSIO: ${GYM_DROP_LABELS[d.id] ?? d.id}!`, "cap");
                }
              }
            }
          }
          flyRedShards(target.x, target.y - 20, redShardGain);
          pushFxAt(target.x + 26, target.y - 26, `+${redShardGain} 🔻`, "gold");
          setSessionRedShards(s => s + redShardGain);


          // XP para o líder + drena energia. Se ORB DE TIME estiver ativo, TODOS ganham EXP.
          const teamOrbActive = !!(idle.buffs.teamOrbUntil && Date.now() < idle.buffs.teamOrbUntil);
          setTeam((tm) => {
            if (tm.length === 0) return tm;
            const now = Date.now();
            return tm.map((p, idx) => {
              const isLeader = idx === 0;
              const gainsXp = isLeader || teamOrbActive;
              if (!gainsXp) return p;
              const curE = petCurrentEnergy(p, now, { active: isLeader });
              const drainKill = isLeader ? energyDrainPerKill(p.rarity) : 0;
              const newE = drainKill === 0 ? (isLeader ? ENERGY_MAX : curE) : Math.max(0, curE - drainKill);
              const newXp = (p.xp ?? 0) + xp;
              let lv = p.level;
              let remaining = newXp;
              while (lv < 10000 && remaining >= 100 + lv * 20) { remaining -= 100 + lv * 20; lv += 1; }
              if (lv >= 10000) remaining = 0;
              return {
                ...p, level: lv, xp: remaining,
                hp: isLeader ? Math.min(leaderHp, calcIdleMaxHp({ ...p, level: lv })) : Math.min(p.hp, calcIdleMaxHp({ ...p, level: lv })),
                energy: newE, energyRegenAt: isLeader ? now : ((p as PetEnergyExt).energyRegenAt ?? now),
              } as PetInstance;
            });
          });



          // Tentativa de captura — SÓ com pokébola
          setIdle((s) => {
            const nt = s.tasks.map((t) =>
              t.id === "t1" && !t.done
                ? { ...t, progress: Math.min(t.target, t.progress + 1), done: t.progress + 1 >= t.target }
                : t);
            const newItems = { ...s.items };
            for (const id of drops) newItems[id] = (newItems[id] ?? 0) + 1;

            // escolhe bola conforme preferência
            const abCfg = autoBattleRef.current;
            const useBall = abCfg?.useBall !== false;
            const pref = abCfg?.preferredBall ?? "auto";
            const isEventLegSel = !!target.eventLegendary;
            let usedBall: ShopBall | null = null;
            if (useBall) {
              if (pref !== "auto") {
                const b = ALL_BALLS.find((x) => x.id === pref);
                if (b && (newItems[b.id] ?? 0) > 0) usedBall = b;
              }
              if (!usedBall) {
                // Auto: contra eventos prefere master → ultra; senão evita master
                const order = isEventLegSel
                  ? ["masterball", "ultraball", "greatball", "pokeball"]
                  : ["ultraball", "greatball", "pokeball"]; // master reservada para eventos
                for (const id of order) {
                  const b = ALL_BALLS.find((x) => x.id === id);
                  if (b && (newItems[b.id] ?? 0) > 0) { usedBall = b; break; }
                }
              }
            }
            // Evento Gelius: só permite capturar espécies específicas (ditto/gengar/magmar)
            const inGelius = s.currentMap === "gelius1" || s.currentMap === "gelius2";
            if (inGelius && !GELIUS_CAPTURABLE.has(target.sp)) {
              usedBall = null;
            }
            // 🌿 EVENTO ODISSÉIA ODDISH — captura BLOQUEADA. Aqui só cai Stone.
            const inOddishEvent = s.currentMap === "oddish_o1" || s.currentMap === "oddish_o2" || s.currentMap === "oddish_o3";
            if (inOddishEvent) {
              usedBall = null;
            }
            let captured = false;
            let capturedPet: PetInstance | null = null;
            const isEventLeg = !!target.eventLegendary;
            // Se for lendário do evento, pokébola comum não é lançada
            if (isEventLeg && usedBall && usedBall.id === "pokeball") {
              pushFxAt(target.x, target.y - 70, "Pokébola comum não serve!", "enemyDmg");
              usedBall = null;
            }
            if (usedBall) {
              // ► Animação da pokébola voando
              const ballAnimId = Date.now();
              setCaptureAnim({
                id: ballAnimId,
                fromX: trainerPosRef.current.x,
                fromY: trainerPosRef.current.y,
                toX: target.x, toY: target.y,
                ts: performance.now(),
                ballImg: usedBall.img,
                success: false,
              });
              setTimeout(() => setCaptureAnim((c) => (c && c.id === ballAnimId ? null : c)), 1200);
              newItems[usedBall.id] = (newItems[usedBall.id] ?? 0) - 1;
              const baseChance = 0.020; // mais difícil: 2.0% base (com bola comum)
              if (target.menace) {
                // 💀 PERIGO ABISSAL — impossível capturar. Ao ser atacado com pokébola, vira agressivo.
                captured = false;
                pushFxAt(target.x, target.y - 70, "IMPOSSÍVEL CAPTURAR", "enemyDmg");
                pushChat(`💀 A criatura abissal repeliu a pokébola e ficou ENFURECIDA!`, "hit");
                setEnemies((cur) => cur.map((en) => en.id === target.id ? { ...en, aggressive: true, aggroR: 800 } : en));
              } else if (target.sp === "mewtwo_event") {
                // ✦✧ MEWTWO do evento — precisa arremessar 1500+ bolas antes de qualquer chance.
                const prev = mewtwoBallsRef.current.get(target.id) ?? 0;
                const nowCount = prev + 1;
                mewtwoBallsRef.current.set(target.id, nowCount);
                if (nowCount < MEWTWO_MIN_BALLS) {
                  captured = false;
                  if (nowCount % 100 === 0) {
                    pushChat(`✦✧ MEWTWO — ${nowCount}/${MEWTWO_MIN_BALLS} pokébolas arremessadas...`, "info");
                  }
                  pushFxAt(target.x, target.y - 70, `${nowCount}/${MEWTWO_MIN_BALLS}`, "enemyDmg");
                } else {
                  // Depois do umbral, ultra ball 0.4%, master garantido.
                  if (usedBall.id === "masterball") captured = true;
                  else if (usedBall.id === "ultraball") captured = Math.random() < 0.004;
                  else captured = false;
                }
              } else if (target.sp === "dragonite_shiny" || target.sp === "zapdos" || target.sp === "blastoise_shiny" || target.sp === "rayquaza" || target.sp === "onix_shiny" || target.sp === "riolu" || (target.sp === "raichu" && (target.rarity === "mythic" || target.rarity === "mythic_shiny"))) {
                // 🐉⚡⚡ Bosses raros globais: exigem MUITAS Ultra Balls antes de qualquer chance.
                const inGrass = idle.currentMap === "grass_oddish";
                const isRaichuMy = target.sp === "raichu";
                const isBlastoiseMy = target.sp === "blastoise_shiny";
                const isRayquaza = target.sp === "rayquaza";
                const isOnixShiny = target.sp === "onix_shiny";
                const isRiolu = target.sp === "riolu";
                const isDragoShinyGrass = target.sp === "dragonite_shiny" && inGrass;
                const minBalls = isRaichuMy ? RAICHU_MYTHIC_MIN_BALLS
                  : target.sp === "zapdos" ? ZAPDOS_MIN_BALLS
                  : isBlastoiseMy ? 1000
                  : isRayquaza ? RAYQUAZA_MIN_BALLS
                  : isOnixShiny ? ONIX_SHINY_MIN_BALLS
                  : isRiolu ? RIOLU_MIN_BALLS
                  : isDragoShinyGrass ? DRAGONITE_SHINY_GRASS_MIN_BALLS
                  : DRAGONITE_SHINY_MIN_BALLS;
                const label = isRaichuMy ? "RAICHU ✦"
                  : target.sp === "zapdos" ? "ZAPDOS"
                  : isBlastoiseMy ? "BLASTOISE ✦"
                  : isRayquaza ? "RAYQUAZA ✦"
                  : isOnixShiny ? "ONIX ✦"
                  : isRiolu ? "RIOLU ✦"
                  : "DRAGONITE ✦";
                if (usedBall.id !== "ultraball") {
                  captured = false;
                  pushFxAt(target.x, target.y - 70, "Só Ultra Ball!", "enemyDmg");
                } else {
                  const prev = bossBallsRef.current.get(target.id) ?? 0;
                  const nowCount = prev + 1;
                  bossBallsRef.current.set(target.id, nowCount);
                  if (nowCount < minBalls) {
                    captured = false;
                    if (nowCount % 100 === 0) {
                      pushChat(`✦ ${label} — ${nowCount}/${minBalls} Ultra Balls arremessadas...`, "info");
                    }
                    pushFxAt(target.x, target.y - 70, `${nowCount}/${minBalls}`, "enemyDmg");
                  } else {
                    // Bosses do Grass Oddish: quase impossível — 0.3% por lançamento após o umbral.
                    const catchChance = (isRaichuMy || isRayquaza || isOnixShiny || isRiolu || isDragoShinyGrass) ? 0.003 : 0.02;
                    captured = Math.random() < catchChance;
                  }
                }
              } else if (target.mtcBoss) {
                // ✦ MTC — só ultra ball; ~1.7% por lançamento (média ~60 tentativas)
                if (usedBall.id !== "ultraball") {
                  captured = false;
                  pushFxAt(target.x, target.y - 70, "Só Ultra Ball!", "enemyDmg");
                } else {
                  captured = Math.random() < 0.017;
                }
              
              } else if (isEventLeg && usedBall.id === "greatball") {
                captured = false; // Great sempre falha em lendários do evento
              } else if (isEventLeg && usedBall.id === "masterball") {
                captured = true; // Master captura garantido
              } else if (isEventLeg) {
                // Dialga: pokémon com a menor chance do jogo (1% fixo, só ultra)
                if (target.sp === "dialga") {
                  captured = usedBall.id === "ultraball" ? Math.random() < 0.01 : false;
                } else {
                  // Ultra: chance muito baixa (~2%) contra lendários do evento
                  captured = usedBall.id === "ultraball" ? Math.random() < 0.02 : false;
                }
              } else if (target.rarity === "mythic" || target.rarity === "mythic_shiny") {
                // 💠 Míticos (e shiny): 2% fixo por lançamento
                captured = Math.random() < 0.02;
              } else {
                // 🖤 Guardiões anti-paralisia: um pouco mais difíceis (~55% da chance normal)
                const isDittoSp = target.sp === "ditto" || target.sp === "ditto_shiny";
                const guardMult = target.apex ? 0.14 : target.guardian ? (isDittoSp ? 0.22 : 0.40) : 1;
                 const rarityMult = target.rarity === "legendary" ? 0.35 : target.rarity === "epic" ? 0.75 : target.rarity === "rare" ? 2.2 : target.rarity === "uncommon" ? 1.8 : target.rarity === "common" ? 1.6 : 1;
                const gymCapMult = GYM_FLOOR_BY_ID[idle.currentMap]?.captureMult ?? 1;
                captured = Math.random() < baseChance * usedBall.captureMult * guardMult * rarityMult * gymCapMult;
              }
              if (captured) {
                const rolled = rollTraits(target.rarity);
                const np = { ...makePet(target.sp, target.level, target.rarity), traits: rolled };
                capturedPet = np;
                const rarityLabelMap: Record<string, string> = {
                  common: "Comum", uncommon: "Incomum", rare: "Raro",
                  epic: "Épico", legendary: "Lendário", mythic: "Mítico", mythic_shiny: "Mítico ✦",
                };
                const rarityColorMap: Record<string, string> = {
                  common: "#c8b8d0", uncommon: "#5ec26a", rare: "#6bd4ff",
                  epic: "#c084fc", legendary: "#f5cf6b", mythic: "#ff6b3d", mythic_shiny: "#ff97e1",
                };
                const rLabel = rarityLabelMap[np.rarity] ?? String(np.rarity);
                const rColor = rarityColorMap[np.rarity] ?? "#f5cf6b";
                pushFxAt(target.x, target.y - 70, `★ ${usedBall.name.toUpperCase()} ★`, "capture");
                pushFxAt(target.x, target.y - 100, `${rLabel.toUpperCase()}!`, "capture");
                // (captura não anuncia no chat — floating text já mostra ★)
                // fx visual: contorna a chat com a cor da raridade (via console info)
                void rColor;
                // Broadcast global da captura
                try {
                  const chancePct = baseChance * usedBall.captureMult * 100;
                  void captureChanRef.current?.send({
                    type: "broadcast",
                    event: "capture",
                    payload: {
                      id: identity?.id ?? "anon",
                      name: identity?.name ?? "Treinador",
                      sp: target.sp,
                      rarity: rLabel,
                      chancePct,
                    },
                  });
                } catch { /* ignore */ }
                playBonus();
                // Vai direto para a Coleção (não entra no time automaticamente)
                // (sem chat — o floating "★" e a Coleção falam por si)

              } else {
                pushFxAt(target.x, target.y - 70, `${usedBall.name} falhou`, "enemyDmg");
                // (falha de pokébola: só floating text, sem spam no chat)
              }
            } else {
              pushFxAt(target.x, target.y - 70, "sem pokébola", "enemyDmg");
              // (sem pokébola: floating text apenas)
            }

            const capturedInc = captured ? 1 : 0;
            const nt2 = nt.map((t) => (t.id === "t3" && !t.done && capturedInc)
              ? { ...t, progress: Math.min(t.target, t.progress + 1), done: t.progress + 1 >= t.target }
              : t);
            const newCaught = captured && !s.caughtSpecies.includes(target.sp)
              ? [...s.caughtSpecies, target.sp]
              : s.caughtSpecies;
            const newSeen = s.seenSpecies.includes(target.sp)
              ? s.seenSpecies
              : [...s.seenSpecies, target.sp];
            const prevCol = s.collection ?? [];
            const colFull = prevCol.length >= MAX_COLLECTION;
            if (capturedPet && colFull) {
              queueMicrotask(() => pushChat(`⚠ Coleção cheia (${MAX_COLLECTION}). Venda ou fragmente para liberar espaço.`, "info"));
            }
            const newCollection = capturedPet && !colFull
              ? [...prevCol, { uid: capturedPet.uid, species: capturedPet.species, level: capturedPet.level, rarity: capturedPet.rarity, capturedAt: Date.now(), traits: capturedPet.traits, ...(s.currentMap === "grass_oddish" ? { event: "grass_oddish" } : {}) }]
              : prevCol;
            // Traits não são mais anunciados no chat (só a captura em si).
            // === XP DO TREINADOR (separado do XP do pokémon) ===
            // Base: ~40% do xp do pokémon, escalado pelo nível do inimigo e raridade.
            const rarityTrainerMult: Record<Rarity, number> = {
              common: 1, uncommon: 1.2, rare: 1.5, epic: 2, legendary: 3, mythic: 4.5, mythic_shiny: 6,
            };
            const rMult = rarityTrainerMult[target.rarity] ?? 1;
            // Escala por diferença de nível: cada nv acima do inimigo reduz 8% (mín 10%).
            const trLv = s.trainerLevel ?? 1;
            const lvDiff = trLv - target.level;
            const lvScale = lvDiff <= 0 ? 1 : Math.max(0.1, 1 - lvDiff * 0.08);
            // Penalidade extra: se o treinador ultrapassou o teto do mapa, XP colapsa
            // (força migrar de mapa). Vale Verdejante tem teto 30.
            const mapCap = idle.currentMap === "arena" ? 30 : Infinity;
            const overCap = Math.max(0, trLv - mapCap);
            const capPenalty = overCap > 0 ? Math.max(0.05, 1 - overCap * 0.2) : 1;
            const finalScale = lvScale * capPenalty;
            const mythEvKillMult = idle.currentMap === "evento_myth" ? 6 : 1;
            const killTrainerXp = Math.max(1, Math.round((8 + target.level * 2.5) * rMult * finalScale * (1 + (expActive ? idle.buffs.expMult : 0)) * 0.3 * mythEvKillMult * (target.xpTitle ? 2 : 1)));
            const captureTrainerXp = captured ? Math.max(2, Math.round((25 + target.level * 6) * rMult * finalScale * 0.3)) : 0;
            const totalTrainerXp = killTrainerXp + captureTrainerXp;
            const applied = applyTrainerXp(s, totalTrainerXp);
            if (applied.leveledTo != null) {
              // level up de treinador — chat + fx (fora do setState via microtask)
              queueMicrotask(() => {
                pushChat(`🎓 TREINADOR subiu para o nível ${applied.leveledTo}!`, "lv");
                pushFxAt(trainerPos.x, trainerPos.y - 130, `TREINADOR LV ${applied.leveledTo}!`, "capture");
                // Salva imediatamente no banco — nível de treinador não pode dar rollback
                void serverSync.pushNow();
              });
            }
            queueMicrotask(() => {
              pushFxAt(target.x, target.y - 80, `+${totalTrainerXp} XP Tr`, "xp");
            });
            const prevKills = s.totals.kills ?? 0;
            const newKills = prevKills + 1;
            // Bônus surpresa: a cada 100 mobs derrotados, ganhe 10 pokébolas.
            const crossed100 = Math.floor(newKills / 100) > Math.floor(prevKills / 100);
            const surpriseBalls = crossed100 ? 10 : 0;
            if (crossed100) {
              queueMicrotask(() => {
                pushChat(`🎉 SURPRESA! ${newKills} mobs derrotados — +10 Pokébolas!`, "chest");
                pushFxAt(trainerPos.x, trainerPos.y - 130, `+10 POKÉBOLAS!`, "capture");
              });
            }
            const itemsWithBalls = surpriseBalls > 0
              ? { ...newItems, pokeball: (newItems.pokeball ?? 0) + surpriseBalls }
              : newItems;
            const isGrassOddishAuto = captured && s.currentMap === "grass_oddish";
            if (isGrassOddishAuto) {
              const total = (s.grassOddishCaptured ?? 0) + 1;
              queueMicrotask(() => {
                try { window.dispatchEvent(new CustomEvent("rubym:toast", { detail: { title: "🌿 Grass Oddish", body: `+1 Oddish Capturado\nTotal: ${total}`, tone: "success" } })); } catch {}
              });
            }
            return {
              ...applied.state,
              pending: { ...s.pending, gold: s.pending.gold + gold, crystals: s.pending.crystals + ((idle.currentMap === "gelius1" || idle.currentMap === "gelius2") && Math.random() < 0.35 ? 1 : 0), redshards: Math.min(RED_SHARD_PENDING_CAP, (s.pending.redshards ?? 0) + redShardGain) },
              totals: { gold: s.totals.gold + gold, captured: s.totals.captured + capturedInc, kills: newKills },
              grassOddishCaptured: (s.grassOddishCaptured ?? 0) + (isGrassOddishAuto ? 1 : 0),
              tasks: nt2,
              items: itemsWithBalls,
              caughtSpecies: newCaught,
              seenSpecies: newSeen,
              collection: newCollection,
            };
          });
        }
        const survivors = next.filter((e) => e.hp > 0);
        if (survivors.length === 0) return spawnEnemies();
        return next;
      });
      // Accrue passivo por segundo
      setIdle((s) => {
        const lvFactor = 1 + ((leader?.level ?? 5) / 40);
        const rate = IDLE_MAPS[s.currentMap].rate * lvFactor;
        const inc = { g: 0.8 * rate, r: 0.02 * rate, c: 0.01 * rate };
        const ns: IdleState = {
          ...s,
          lastTickAt: Date.now(),
          pending: {
            gold: s.pending.gold + inc.g,
            rubies: s.pending.rubies + inc.r,
            crystals: s.pending.crystals + inc.c,
            redshards: Math.min(RED_SHARD_PENDING_CAP, s.pending.redshards ?? 0),
          },
        };
        const nt = ns.tasks.map((t) => t.id === "t2" && !t.done
          ? { ...t, progress: Math.min(t.target, Math.floor(ns.pending.gold + ns.totals.gold)), done: (ns.pending.gold + ns.totals.gold) >= t.target }
          : t);
        return { ...ns, tasks: nt };
      });
    }, 900);
    return () => clearInterval(iv);
  }, [team, trainerPos, leaderHp]);

  // Portais NÃO entram mais automaticamente ao caminhar por cima —
  // agora só viajam com clique explícito no portal (evita gastar ouro/cristal sem querer).


  useEffect(() => { saveIdle(idle); }, [idle]);

  // Reconcilia: qualquer pokémon no time/bench fica espelhado na coleção com o MAIOR nível já visto.
  useEffect(() => {
    setIdle((s) => {
      const col = s.collection ?? [];
      const active = [...team, ...restingBench];
      const byUid = new Map<string, PetInstance>();
      for (const p of active) byUid.set(p.uid, p);
      let changed = false;
      const nextCol = col.map((e) => {
        const live = byUid.get(e.uid);
        if (!live) return e;
        const level = Math.max(e.level ?? 1, live.level ?? 1);
        const xp = Math.max(e.xp ?? 0, live.xp ?? 0);
        if (level === e.level && xp === (e.xp ?? 0)) return e;
        changed = true;
        return { ...e, level, xp };
      });
      const known = new Set(nextCol.map((e) => e.uid));
      const missing: CollectionEntry[] = [];
      for (const p of active) {
        if (known.has(p.uid)) continue;
        if (consumedUidsRef.current.has(p.uid)) continue;
        missing.push({ uid: p.uid, species: p.species, level: p.level, xp: p.xp ?? 0, rarity: p.rarity, capturedAt: Date.now() });
      }
      if (!changed && missing.length === 0) return s;
      return { ...s, collection: [...nextCol, ...missing] };
    });
    // Fix: Targeted properties to avoid deep-equal re-renders
  }, [team.length, restingBench.length]);

  useEffect(() => {
    const iv = setInterval(() => {
      const save = (loadLatestValid<SaveShape>() ?? {}) as SaveShape;
      saveNow({ ...save, party: [...team, ...restingBench] });
    }, 15_000);
    return () => clearInterval(iv);
  }, [team, restingBench]);

  // Detecta level up e dispara aura + fx
  useEffect(() => {
    const lv = team[0]?.level ?? 0;
    if (prevLevelRef.current === 0) { prevLevelRef.current = lv; return; }
    if (lv > prevLevelRef.current) {
      const gained = lv - prevLevelRef.current;
      prevLevelRef.current = lv;
      setLeveledAt(Date.now());
      // ===== Atributos aleatórios + bônus fixo por nível =====
      const STAT_KEYS = ["hp","atk","def","spa","spd","spe","crit"] as const;
      const statLabel: Record<string, string> = { hp: "HP", atk: "ATK", def: "DEF", spa: "SPA", spd: "SPD", spe: "SPE", crit: "CRIT" };
      let bonusStat: string = "atk";
      let randomSummary: string[] = [];
      setTeam((tm) => {
        const l = tm[0]; if (!l) return tm;
        const asc: Record<string, number> = { ...(l.ascensionStats ?? {}) };
        const rollCount: Record<string, number> = {};
        for (let g = 0; g < gained; g++) {
          // 3 pontos aleatórios distribuídos + 1 stat bônus com +2
          for (let i = 0; i < 3; i++) {
            const k = STAT_KEYS[Math.floor(Math.random() * STAT_KEYS.length)];
            // hp ganha mais pontos brutos por ser stat de base maior
            const pts = k === "hp" ? 2 : 1;
            asc[k] = (asc[k] ?? 0) + pts;
            rollCount[k] = (rollCount[k] ?? 0) + pts;
          }
          bonusStat = STAT_KEYS[Math.floor(Math.random() * STAT_KEYS.length)];
          const bonusPts = bonusStat === "hp" ? 4 : 2;
          asc[bonusStat] = (asc[bonusStat] ?? 0) + bonusPts;
          rollCount[bonusStat] = (rollCount[bonusStat] ?? 0) + bonusPts;
        }
        randomSummary = Object.entries(rollCount)
          .map(([k, v]) => `+${v} ${statLabel[k]}`);
        const updated = { ...l, ascensionStats: asc };
        return [{ ...updated, hp: calcIdleMaxHp(updated) }, ...tm.slice(1)];
      });
      // cura ao subir de nível — chamada após setTeam, mas leaderHp é reset pelo maxHp novo
      setTimeout(() => {
        const cur = team[0];
        if (cur) setLeaderHp(calcIdleMaxHp({ ...cur, level: lv, ascensionStats: { ...(cur.ascensionStats ?? {}) } }));
      }, 0);
      pushFxAt(trainerPos.x, trainerPos.y - 70, `LV ${lv}!`, "xp");
      pushFxAt(trainerPos.x, trainerPos.y - 100, `✨ BÔNUS +${statLabel[bonusStat]}`, "gold");
      pushChat(`⬆ Nível ${lv}! Atributos ganhos: ${randomSummary.join(", ")}`, "lv");
      setLevelToast({ level: lv, gains: randomSummary, bonus: statLabel[bonusStat], ts: Date.now() });
      playLevelUp();
      pushEvent("⬆", `NÍVEL ${lv} ALCANÇADO`, `+${statLabel[bonusStat]} bônus · ${randomSummary.join(", ")}`, "#ffd66b");

    } else {
      prevLevelRef.current = lv;
    }
  }, [team]); // eslint-disable-line react-hooks/exhaustive-deps

  // ==== Guarda de nível: o nível de cada Pokémon nunca pode regredir ====
  const maxLevelRef = useRef<Record<string, number>>({});
  useEffect(() => {
    const all = [...team, ...restingBench];
    for (const c of idle.collection ?? []) {
      const prev = maxLevelRef.current[c.uid] ?? 0;
      if ((c.level ?? 0) > prev) maxLevelRef.current[c.uid] = c.level;
    }
    for (const p of all) {
      const prev = maxLevelRef.current[p.uid] ?? 0;
      if ((p.level ?? 0) > prev) maxLevelRef.current[p.uid] = p.level;
    }
    let teamChanged = false;
    const fixedTeam = team.map((p) => {
      const mx = maxLevelRef.current[p.uid] ?? 0;
      if ((p.level ?? 0) < mx) { teamChanged = true; return { ...p, level: mx }; }
      return p;
    });
    if (teamChanged) setTeam(fixedTeam);
    let benchChanged = false;
    const fixedBench = restingBench.map((p) => {
      const mx = maxLevelRef.current[p.uid] ?? 0;
      if ((p.level ?? 0) < mx) { benchChanged = true; return { ...p, level: mx }; }
      return p;
    });
    if (benchChanged) setRestingBench(fixedBench);
    let collectionChanged = false;
    const fixedCollection = (idle.collection ?? []).map((e) => {
      const mx = maxLevelRef.current[e.uid] ?? 0;
      if ((e.level ?? 0) < mx) { collectionChanged = true; return { ...e, level: mx }; }
      return e;
    });
    if (collectionChanged) setIdle((s) => ({ ...s, collection: fixedCollection }));
  }, [team, restingBench, idle.collection]);

  // ==== Evento Lendário: 5 pokémon raros aparecem a cada 30 min (rotativo) ====
  const LEGEND_INTERVAL_MS = 30 * 60 * 1000;
  const LEGEND_DURATION_MS = 3 * 60 * 1000;
  const LEGEND_ROSTER: { sp: Species; label: string; rarity: Rarity; level: number; icon: string; color: string; weather?: "snow" | "rain"; w: number }[] = [
    { sp: "virizion",      label: "VIRIZION",      rarity: "epic",         level: 80, icon: "🌿", color: "#7ef2a2", w: 10 },
    { sp: "luxray_f",      label: "LUXRAY ♀",      rarity: "epic",         level: 78, icon: "⚡", color: "#5ec2ff", w: 10 },
    { sp: "raikou",        label: "RAIKOU",        rarity: "epic",         level: 82, icon: "⚡", color: "#f5cf6b", w: 2 },
    { sp: "suicune",       label: "SUICUNE",       rarity: "mythic",       level: 88, icon: "❄", color: "#8ec5ff", weather: "rain", w: 2 },
    { sp: "suicune_shiny", label: "SUICUNE ✦",     rarity: "mythic_shiny", level: 92, icon: "💠", color: "#ff97e1", weather: "snow", w: 1 },
  ];
  const legendIdxRef = useRef(0);
  const [legendUntil, setLegendUntil] = useState<{ until: number; weather?: "snow" | "rain" } | null>(null);
  const currentMapRef = useRef(idle.currentMap);
  useEffect(() => { currentMapRef.current = idle.currentMap; }, [idle.currentMap]);
  useEffect(() => {
    const trigger = () => {
      // Lendários NUNCA aparecem no Vale Verdejante (mapa inicial)
      if (currentMapRef.current === "arena") return;
      const totalW = LEGEND_ROSTER.reduce((s, r) => s + r.w, 0);
      let rw = Math.random() * totalW;
      let pick = LEGEND_ROSTER[0];
      for (const r of LEGEND_ROSTER) { rw -= r.w; if (rw <= 0) { pick = r; break; } }
      legendIdxRef.current++;
      const until = Date.now() + LEGEND_DURATION_MS;
      setLegendUntil({ until, weather: pick.weather });
      // clima desabilitado: if (pick.weather) setWeather(pick.weather);
      setEnemies((prev) => {
        if (prev.some((e) => e.sp === pick.sp)) return prev;
        let x = 200, y = 200, tries = 0;
        do {
          x = 200 + Math.random() * (WORLD_W - 400);
          y = 200 + Math.random() * (WORLD_H - 400);
          tries++;
        } while (collidesWithAny(x, y) && tries < 20);
        const petA = makePet(pick.sp, pick.level);
        const hpMult = pick.rarity === "mythic_shiny" ? 4 : pick.rarity === "mythic" ? 3.2 : 2.6;
        const hp = Math.floor(calcIdleMaxHp(petA) * hpMult);
        return [
          ...prev,
          { sp: pick.sp, hp, maxHp: hp, id: enemyIdRef.current++, x, y, face: "left", aggressive: false, aggroR: 0, elite: true, level: pick.level, rarity: pick.rarity, eventLegendary: true } as Enemy,
        ];
      });
      const rarityLabel = pick.rarity === "mythic_shiny" ? "MÍTICO ✦" : pick.rarity === "mythic" ? "MÍTICO" : "ÉPICO";
      pushEvent(pick.icon, `EVENTO ${rarityLabel}`, `${pick.label} apareceu! Só ULTRA/MASTER captura.`, pick.color);
      
    };
    const firstTo = setTimeout(trigger, 45_000);
    const iv = setInterval(trigger, LEGEND_INTERVAL_MS);
    return () => { clearTimeout(firstTo); clearInterval(iv); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // (Clima gerenciado pelo ciclo global de neve — não sobrescrever aqui)

  // Ao entrar no Vale Verdejante, remove qualquer lendário do evento remanescente
  useEffect(() => {
    if (idle.currentMap === "arena") {
      setEnemies((prev) => prev.filter((e) => !e.eventLegendary));
      setLegendUntil(null);
    }
  }, [idle.currentMap]);


  // ==== EVENTO LUGIA: DESATIVADO a pedido do jogador ====
  useEffect(() => {
    setEnemies((prev) => prev.filter((e) => e.sp !== "lugia"));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ==== Timer de permanência em n2/n3 (máx 3h → volta para Terry) ====
  useEffect(() => {
    mapEnterAtRef.current = Date.now();
    atkDebuffUntilRef.current = 0;
    poisonUntilRef.current = 0;
    if (idle.currentMap !== "n2" && idle.currentMap !== "n3") return;
    const cm = idle.currentMap;
    const warn1 = setTimeout(() => pushChat(`⏳ ${IDLE_MAPS[cm].name}: 30min para você ser levado de volta a Terras de Terry.`, "info"), 2.5 * 60 * 60 * 1000);
    const kick = setTimeout(() => {
      setIdle((s) => ({ ...s, currentMap: "terry" }));
      setTrainerPos({ x: 200, y: WORLD_H / 2 });
      setEnemies([]);
      pushChat(`⌛ Você excedeu 3h em ${IDLE_MAPS[cm].name}. Retornado para Terras de Terry.`, "cap");
    }, 3 * 60 * 60 * 1000);
    return () => { clearTimeout(warn1); clearTimeout(kick); };
  }, [idle.currentMap]); // eslint-disable-line react-hooks/exhaustive-deps

  const geliusReturnMapRef = useRef<IdleMapId | null>(null);
  const mythEventReturnMapRef = useRef<IdleMapId | null>(null);
  const mythEventEnteredAtRef = useRef<number>(0);
  // ==== EVENTO MÍTICO SHINY — tick: expulsa aos 5min OU quando janela fecha ====
  useEffect(() => {
    const iv = setInterval(() => {
      if (idle.currentMap !== "evento_myth") return;
      const mi = mythEventInfo();
      const sessionExpired = Date.now() - mythEventEnteredAtRef.current >= 5 * 60 * 1000;
      if (!mi.open || sessionExpired) {
        const ret = (mythEventReturnMapRef.current ?? "arena") as IdleMapId;
        setIdle((s) => ({ ...s, currentMap: ret }));
        setTrainerPos({ x: WORLD_W / 2, y: WORLD_H / 2 });
        setEnemies([]);
        mythEventReturnMapRef.current = null;
        pushChat(`❄ Domínio Mítico Shiny fechou — teleportado de volta para ${IDLE_MAPS[ret].name}.`, "info");
      }
    }, 1000);
    return () => clearInterval(iv);
  }, [idle.currentMap]); // eslint-disable-line react-hooks/exhaustive-deps

  // ==== EVENTO GELIUS — tick 1s: troca fase aos 5min, expulsa aos 10min ====
  useEffect(() => {
    const iv = setInterval(() => {
      const gi = currentGeliusInfo();
      const cm = idle.currentMap;
      if (cm !== "gelius1" && cm !== "gelius2") return;
      if (gi.phase === "closed") {
        const ret = (geliusReturnMapRef.current ?? "arena") as IdleMapId;
        setIdle((s) => ({ ...s, currentMap: ret }));
        setTrainerPos({ x: WORLD_W / 2, y: WORLD_H / 2 });
        setEnemies([]);
        geliusReturnMapRef.current = null;
        pushChat(`🐧 Evento Gelius encerrado — teleportado de volta para ${IDLE_MAPS[ret].name}.`, "info");
        return;
      }
      if (gi.phase === "phase1" && cm === "gelius2") {
        setIdle((s) => ({ ...s, currentMap: "gelius1" }));
        setEnemies([]);
        pushChat(`🐧 Voltando à Onda 1 do Gelius.`, "info");
      } else if (gi.phase === "phase2" && cm === "gelius1") {
        setIdle((s) => ({ ...s, currentMap: "gelius2" }));
        setEnemies([]);
        pushChat(`🐧 GELIUS — Onda 2 iniciou! Pokémons mais fortes agora.`, "cap");
        playBonus();
      }
    }, 1000);
    return () => clearInterval(iv);
  }, [idle.currentMap]); // eslint-disable-line react-hooks/exhaustive-deps



  // ==== Peçonha (Terry) — DoT enquanto poisonUntilRef ativo ====
  useEffect(() => {
    const iv = setInterval(() => {
      if (Date.now() >= poisonUntilRef.current) return;
      const leader = team[0]; if (!leader) return;
      const maxHp = calcIdleMaxHp(leader);
      const tick = Math.max(2, Math.floor(maxHp * 0.03));
      setLeaderHp((h) => Math.max(0, h - tick));
      const fx = followerStateRef.current;
      pushFxAt(fx.x, fx.y - 30, `☠ -${tick}`, "enemyDmg");
    }, 1500);
    return () => clearInterval(iv);
  }, [team]); // eslint-disable-line react-hooks/exhaustive-deps

  // ==== EVENTO PÁSSAROS LENDÁRIOS: Moltres / Zapdos / Articuno a cada 2h ====
  // Extremamente fortes, agressivos ao ver, captura minúscula (só ULTRA/MASTER).
  const BIRD_ROSTER: { sp: Species; label: string; icon: string; color: string; level: number }[] = [
    { sp: "moltres",  label: "MOLTRES",  icon: "🔥", color: "#ff7a2a", level: 400 },
    { sp: "articuno", label: "ARTICUNO", icon: "❄", color: "#8ecbff", level: 380 },
  ];
  const BIRD_INTERVAL_MS = 2 * 60 * 60 * 1000; // 2 horas
  const BIRD_WARN_MS = 5 * 60 * 1000; // aviso 5min antes
  useEffect(() => {
    const spawnBird = () => {
      if (currentMapRef.current === "arena") return;
      const pick = BIRD_ROSTER[Math.floor(Math.random() * BIRD_ROSTER.length)];
      setEnemies((prev) => {
        if (prev.some((e) => e.sp === pick.sp)) return prev;
        let x = 300, y = 300, tries = 0;
        do {
          x = 200 + Math.random() * (WORLD_W - 400);
          y = 200 + Math.random() * (WORLD_H - 400);
          tries++;
        } while (collidesWithAny(x, y) && tries < 20);
        const petA = makePet(pick.sp, pick.level);
        const hp = Math.floor(calcIdleMaxHp(petA) * 5);
        return [
          ...prev,
          { sp: pick.sp, hp, maxHp: hp, id: enemyIdRef.current++, x, y, face: "left",
            aggressive: true, aggroR: 520, elite: true, level: pick.level,
            rarity: "mythic" as Rarity, eventLegendary: true } as Enemy,
        ];
      });
      pushEvent(pick.icon, "PÁSSARO LENDÁRIO", `${pick.label} desceu dos céus! Cuidado — ele ATACA à distância.`, pick.color);
      pushChat(`⚠ ${pick.icon} ${pick.label} apareceu! MUITO FORTE, agressivo e quase impossível de capturar (ULTRA/MASTER).`, "cap");
    };
    const warn = () => {
      pushChat(`⚠ Um PÁSSARO LENDÁRIO se aproxima... prepare-se! (em ~5min)`, "info");
    };
    const firstWarn = setTimeout(warn, Math.max(1000, BIRD_INTERVAL_MS - BIRD_WARN_MS));
    const firstSpawn = setTimeout(spawnBird, BIRD_INTERVAL_MS);
    const ivWarn = setInterval(warn, BIRD_INTERVAL_MS);
    const ivSpawn = setInterval(spawnBird, BIRD_INTERVAL_MS);
    return () => { clearTimeout(firstWarn); clearTimeout(firstSpawn); clearInterval(ivWarn); clearInterval(ivSpawn); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps







  // Revive: consome 50 gold do banco (ou 50 gold pendente)
  const revive = () => {
    const l = team[0]; if (!l) return;
    let did = false;
    setIdle((s) => {
      if (s.bank.gold >= 50) {
        did = true;
        return { ...s, bank: { ...s.bank, gold: s.bank.gold - 50 } };
      }
      if (s.pending.gold >= 50) {
        did = true;
        return { ...s, pending: { ...s.pending, gold: s.pending.gold - 50 } };
      }
      return s;
    });

    // aplica com pequeno delay para garantir que o setIdle rodou
    setTimeout(() => {
      if (did) {
        setLeaderHp(calcIdleMaxHp(l));
        pushFxAt(trainerPos.x, trainerPos.y - 40, "REVIVEU!", "gold");
      } else {
        pushFxAt(trainerPos.x, trainerPos.y - 40, "SEM REVIVE!", "enemyDmg");
      }
    }, 0);
  };

  // Lança bola manualmente em um inimigo (clique)
   const throwBallAt = (enemyId: number) => {
    const target = enemies.find((e) => e.id === enemyId);
    if (!target || target.hp <= 0) return;
    // Evento Gelius: apenas ditto/gengar/magmar capturáveis
    const curMap = idle.currentMap;
    if ((curMap === "gelius1" || curMap === "gelius2") && !GELIUS_CAPTURABLE.has(target.sp)) {
      pushFxAt(target.x, target.y - 60, "Não pode capturar no evento!", "enemyDmg");
      pushChat(`⚠ Neste evento só é possível capturar Ditto, Gengar e Magmar.`, "info");
      return;
    }
    const abCfg = autoBattleRef.current;
    const pref = abCfg?.preferredBall ?? "auto";
    // seleciona bola
    let usedBall: ShopBall | null = null;
    if (pref !== "auto") {
      const b = ALL_BALLS.find((x) => x.id === pref);
      if (b && (idle.items[b.id] ?? 0) > 0) usedBall = b;
    }
    if (!usedBall) {
      for (const b of [...ALL_BALLS].reverse()) {
        if ((idle.items[b.id] ?? 0) > 0) { usedBall = b; break; }
      }
    }
    if (!usedBall) {
      pushFxAt(target.x, target.y - 60, "sem pokébola", "enemyDmg");
      pushChat(`Sem Pokébolas — compre na loja.`, "info");
      return;
    }
    const isEventLeg = !!target.eventLegendary;
    if (isEventLeg && usedBall.id === "pokeball") {
      pushFxAt(target.x, target.y - 60, "Pokébola comum não serve!", "enemyDmg");
      pushChat(`${target.sp.replace(/_/g, " ").toUpperCase()} é um lendário do evento — use ULTRA ou MASTER.`, "info");
      return;
    }
    const hpPct = target.hp / target.maxHp;
    // chance manual: base 8%, escala até 45% conforme hp% baixa; multiplicada pelo bônus da bola
    let chance: number;
    if (target.menace) {
      // 💀 PERIGO ABISSAL — impossível capturar; ficará agressivo após o lançamento
      chance = 0;
      pushChat(`💀 A criatura abissal repeliu a pokébola e ficou ENFURECIDA!`, "hit");
      setEnemies((cur) => cur.map((en) => en.id === target.id ? { ...en, aggressive: true, aggroR: 800 } : en));
    } else
    if (target.mtcBoss) {
      if (usedBall.id !== "ultraball") {
        chance = 0;
        pushFxAt(target.x, target.y - 40, "Só Ultra Ball!", "enemyDmg");
      } else {
        chance = 0.017;
      }
    } else
    if (isEventLeg && usedBall.id === "greatball") {
      chance = 0; // Great sempre falha em lendários do evento
    } else if (isEventLeg && usedBall.id === "masterball") {
      chance = 1; // Master captura garantido
    } else if (isEventLeg) {
      // Lv 500+ míticos e Lugia: ULTRA muito difícil; escala com HP baixo
      const isUltra = usedBall.id === "ultraball";
      if (!isUltra) { chance = 0; }
      else if (target.sp === "dialga") {
        // Dialga: menor chance do jogo — 1% fixo, apenas Ultra Ball
        chance = 0.01;
      } else if (target.sp === "lugia") {
        chance = hpPct > 0.15 ? 0 : 0.008; // só com HP < 15% e mesmo assim 0.8%
      } else if (target.level >= 500) {
        chance = hpPct > 0.25 ? 0.002 : 0.012; // Lv500+ míticos: 0.2%~1.2%
      } else {
        chance = 0.02;
      }
    } else if (target.rarity === "mythic" || target.rarity === "mythic_shiny") {
      // 💠 Míticos (e shiny): 2% fixo por lançamento manual
      chance = 0.02;
    } else {
      const base = 0.030 + (1 - hpPct) * 0.16;
      // 🖤 Guardiões anti-paralisia: um pouco mais difíceis de capturar
      const isDittoSp2 = target.sp === "ditto" || target.sp === "ditto_shiny";
      const guardMult = target.apex ? 0.14 : target.guardian ? (isDittoSp2 ? 0.22 : 0.40) : 1;
      const rarityMult = target.rarity === "legendary" ? 0.35 : target.rarity === "epic" ? 0.75 : target.rarity === "rare" ? 2.2 : target.rarity === "uncommon" ? 1.8 : target.rarity === "common" ? 1.6 : 1;
      const gymCapMult = GYM_FLOOR_BY_ID[curMap]?.captureMult ?? 1;
      chance = Math.min(0.85, base * usedBall.captureMult * guardMult * rarityMult * gymCapMult);
    }
    const success = Math.random() < chance;
    const ballId = usedBall.id;
    // ► Animação da pokébola voando (manual)
    const ballAnimId = Date.now();
    setCaptureAnim({
      id: ballAnimId,
      fromX: trainerPosRef.current.x, fromY: trainerPosRef.current.y,
      toX: target.x, toY: target.y,
      ts: performance.now(),
      ballImg: usedBall.img,
      success,
    });
    setTimeout(() => setCaptureAnim((c) => (c && c.id === ballAnimId ? null : c)), 1200);
    const ballName = usedBall.name;
    setIdle((s) => ({ ...s, items: { ...s.items, [ballId]: Math.max(0, (s.items[ballId] ?? 0) - 1) } }));
    pushFxAt(target.x, target.y - 40, `${ballName}!`, "capture");
    if (success) {
      const rolled = rollTraits(target.rarity);
      const np = { ...makePet(target.sp, target.level, target.rarity), traits: rolled };
      const rarityLabelMap: Record<string, string> = {
        common: "Comum", uncommon: "Incomum", rare: "Raro",
        epic: "Épico", legendary: "Lendário", mythic: "Mítico", mythic_shiny: "Mítico ✦",
      };
      const rLabel = rarityLabelMap[np.rarity] ?? String(np.rarity);
      pushFxAt(target.x, target.y - 70, `★ CAPTUROU! ★`, "capture");
      pushChat(`★ Capturado manualmente (${rLabel}) com ${ballName}: ${target.sp.replace(/_/g, " ").toUpperCase()}!`, "capture");
      pushChat(`${target.sp.replace(/_/g, " ").toUpperCase()} foi para a sua Coleção.`, "info");
      // Traits não são anunciados no chat.
      playBonus();
      setEnemies((prev) => prev.filter((e) => e.id !== enemyId));
      setIdle((s) => {
        const prev = s.collection ?? [];
        if (prev.length >= MAX_COLLECTION) {
          queueMicrotask(() => pushChat(`⚠ Coleção cheia (${MAX_COLLECTION}). Venda ou fragmente para liberar espaço.`, "info"));
          return { ...s, totals: { ...s.totals, captured: s.totals.captured + 1 } };
        }
        const isOddishEvent = s.currentMap === "oddish_o1" || s.currentMap === "oddish_o2" || s.currentMap === "oddish_o3";
        const isGrassOddish = s.currentMap === "grass_oddish";
        const finalLevel = isOddishEvent ? 1 : np.level;
        if (isGrassOddish) {
          const total = (s.grassOddishCaptured ?? 0) + 1;
          queueMicrotask(() => {
            try { window.dispatchEvent(new CustomEvent("rubym:toast", { detail: { title: "🌿 Grass Oddish", body: `+1 Oddish Capturado\nTotal: ${total}`, tone: "success" } })); } catch {}
          });
        }
        // 🔻 Vale dos Fragmentos: capturar também dropa 5 a 20 fragmentos.
        const valeCaptureShards = s.currentMap === "vale_fragmentos" ? 5 + Math.floor(Math.random() * 16) : 0;
        return {
          ...s,
          totals: { ...s.totals, captured: s.totals.captured + 1 },
          pending: { ...s.pending, redshards: Math.min(RED_SHARD_PENDING_CAP, (s.pending.redshards ?? 0) + valeCaptureShards) },
          grassOddishCaptured: (s.grassOddishCaptured ?? 0) + (isGrassOddish ? 1 : 0),
          caughtSpecies: s.caughtSpecies.includes(target.sp) ? s.caughtSpecies : [...s.caughtSpecies, target.sp],
          collection: [...prev, { uid: np.uid, species: np.species, level: finalLevel, rarity: np.rarity, capturedAt: Date.now(), traits: rolled, ...(isOddishEvent ? { event: "oddish_odyssey" } : {}), ...(isGrassOddish ? { event: "grass_oddish" } : {}) }],
        };
      });
    } else {
      pushFxAt(target.x, target.y - 70, `${ballName} falhou`, "enemyDmg");
    }
  };



  // Usar item da mochila
  const useItem = (id: string, qty: number = 1) => {
    const l = team[0]; if (!l) return;
    const have = (idle.items[id] ?? 0);
    if (have <= 0) { pushChat(`Você não tem ${id}.`, "info"); return; }
    const useQty = Math.max(1, Math.min(qty, have));
    const maxHp = calcIdleMaxHp(l);
    if (id === "potion") {
      if (leaderHp <= 0) { pushChat(`Poção não revive. Reviva por 50 ouro.`, "info"); return; }
      const heal = Math.floor(maxHp * 0.5) * useQty;
      setLeaderHp((h) => Math.min(maxHp, h + heal));
      setIdle((s) => ({ ...s, items: { ...s.items, [id]: have - useQty } }));
      pushFxAt(trainerPos.x, trainerPos.y - 40, `+${heal} HP`, "gold");
      pushChat(`Você usou ${useQty}× Poção (+${heal} HP).`, "info");
    } else if (id === "pokeball" || id === "greatball" || id === "ultraball") {
      pushChat(`As Pokébolas são usadas automaticamente ao derrotar inimigos.`, "info");
    } else if (id === "berry") {
      if (leaderHp <= 0) { pushChat(`Berry não revive. Use um Revive.`, "info"); return; }
      setLeaderHp(maxHp);
      setIdle((s) => ({ ...s, items: { ...s.items, [id]: have - 1 } }));
      pushFxAt(trainerPos.x, trainerPos.y - 40, `HP CHEIO!`, "gold");
      pushChat(`Você usou Berry (HP totalmente restaurado).`, "info");
    } else if (id === "revive") {
      if (leaderHp > 0) { pushChat(`Seu líder está de pé.`, "info"); return; }
      setLeaderHp(maxHp);
      setIdle((s) => ({ ...s, items: { ...s.items, [id]: have - 1 } }));
      pushFxAt(trainerPos.x, trainerPos.y - 40, `REVIVEU!`, "gold");
      pushChat(`Você usou Revive (+HP cheio).`, "cap");
    } else if (id === "key") {
      pushChat(`Guarde as Chaves para trocar no Mercado.`, "info");
    } else if (id === "book_atk") {
      const gain = 0.10 * useQty;
      setIdle((s) => ({ ...s, items: { ...s.items, [id]: have - useQty }, buffs: { ...s.buffs, atk: s.buffs.atk + gain } }));
      pushFxAt(trainerPos.x, trainerPos.y - 40, `ATK +${Math.round(gain*100)}%`, "capture");
      pushChat(`Usou ${useQty}× Livro de Ataque (+${Math.round(gain*100)}% dano permanente).`, "cap");
    } else if (id === "book_def") {
      const gain = 0.10 * useQty;
      setIdle((s) => ({ ...s, items: { ...s.items, [id]: have - useQty }, buffs: { ...s.buffs, def: s.buffs.def + gain } }));
      pushFxAt(trainerPos.x, trainerPos.y - 40, `DEF +${Math.round(gain*100)}%`, "capture");
      pushChat(`Usou ${useQty}× Livro de Defesa (-${Math.round(gain*100)}% dano recebido).`, "cap");

    } else if (id === "book_exp" || id === "book_exp_big" || id === "book_exp_max") {
      const add = id === "book_exp" ? 0.30 : id === "book_exp_big" ? 0.50 : 1.00;
      const pct = Math.round(add * 100);
      const nowT = Date.now();
      if ((idle.buffs.expMultUntil ?? 0) > nowT) {
        pushChat(`Já há um Livro/Orb de EXP ativo. Espere o tempo acabar.`, "info");
        return;
      }
      setIdle((s) => ({
        ...s,
        items: { ...s.items, [id]: have - 1 },
        buffs: { ...s.buffs, expMult: add, expMultUntil: Date.now() + 3600_000 },
      }));
      pushFxAt(trainerPos.x, trainerPos.y - 40, `EXP +${pct}% · 1h`, "capture");
      pushChat(`Livro de EXP usado (+${pct}% EXP por 1 hora).`, "cap");
    } else if (id === "orb_xp_minor" || id === "orb_xp_major" || id === "orb_xp_supreme" || id === "orb_xp_supreme_24h") {
      const add = id === "orb_xp_minor" ? 0.10 : id === "orb_xp_major" ? 0.20 : 0.30;
      const pct = Math.round(add * 100);
      const is24 = id === "orb_xp_supreme_24h";
      const label = id === "orb_xp_minor" ? "Orb Menor" : id === "orb_xp_major" ? "Orb Maior" : is24 ? "Orb Supremo 24h" : "Orb Supremo";
      const nowT = Date.now();
      if ((idle.buffs.orbUntil ?? 0) > nowT) {
        pushChat(`Já há um Orb de EXP ativo. Só 1 orb pode ficar ativo por vez.`, "info");
        return;
      }
      const extraH = is24 ? 0 : (((idle.items as any)[`${id}_extra`] ?? 0) as number);
      const baseH = is24 ? 24 : 1;
      const durationMs = (baseH + extraH) * 3600_000;
      const buffOrbId = is24 ? "orb_xp_supreme" : id;
      setIdle((s) => {
        const items = { ...s.items, [id]: have - 1 } as any;
        if (!is24 && extraH > 0) delete items[`${id}_extra`];
        return {
          ...s,
          items,
          buffs: { ...s.buffs, orbMult: add, orbUntil: Date.now() + durationMs, orbId: buffOrbId },
        };
      });
      const totalH = baseH + extraH;
      pushFxAt(trainerPos.x, trainerPos.y - 40, `${label} +${pct}% · ${totalH}h`, "capture");
      pushEvent("✦", `${label.toUpperCase()} ATIVO`, `+${pct}% EXP por ${totalH} hora(s)`, id === "orb_xp_supreme" || is24 ? "#ffd94d" : id === "orb_xp_major" ? "#c084fc" : "#5cd3ff");
      pushChat(`✦ ${label} usado — +${pct}% EXP por ${totalH} hora(s)${!is24 && extraH > 0 ? " 🌟" : ""}.`, "cap");
    } else if (id === "orb_team") {
      const nowT = Date.now();
      if ((idle.buffs.teamOrbUntil ?? 0) > nowT) {
        pushChat(`Orb de Time já está ativo. Espere o tempo acabar.`, "info");
        return;
      }
      setIdle((s) => ({
        ...s,
        items: { ...s.items, [id]: have - 1 },
        buffs: { ...s.buffs, teamOrbUntil: nowT + 3 * 3600_000 },
      }));
      pushFxAt(trainerPos.x, trainerPos.y - 40, `TIME EXP · 3h`, "capture");
      pushEvent("✦", "ORB DE TIME ATIVO", "Todo o time ganha EXP por 3 horas", "#ffd94d");
      pushChat(`✦ Orb de Time ativado — todos os pokémons do time ganham EXP por 3 horas.`, "cap");
    } else if (id === "book_vip" || id === "book_vip_30" || id === "book_vip_60") {
      const cfg = id === "book_vip_60"
        ? { add: 0.40, ms: 60 * 24 * 3600_000, label: "60 dias" }
        : id === "book_vip_30"
          ? { add: 0.30, ms: 30 * 24 * 3600_000, label: "30 dias" }
          : { add: 0.20, ms: 3600_000, label: "1 hora" };
      const nowT = Date.now();
      const curUntil = Math.max(idle.buffs.expMultUntil ?? 0, idle.buffs.goldMultUntil ?? 0);
      const curMult = curUntil > nowT ? Math.max(idle.buffs.expMult ?? 0, idle.buffs.goldMult ?? 0) : 0;
      const remaining = curUntil > nowT ? (curUntil - nowT) : 0;
      const newUntil = nowT + remaining + cfg.ms;
      const newMult = Math.max(curMult, cfg.add);
      const upgraded = curMult > 0 && newMult > curMult;
      setIdle((s) => ({
        ...s,
        items: { ...s.items, [id]: have - 1 },
        buffs: {
          ...s.buffs,
          expMult: newMult, expMultUntil: newUntil,
          goldMult: newMult, goldMultUntil: newUntil,
        },
      }));
      pushFxAt(trainerPos.x, trainerPos.y - 40, `VIP +${Math.round(newMult*100)}% · +${cfg.label}`, "capture");
      if (curMult > 0) {
        pushChat(`Livro VIP somado! +${cfg.label} de duração${upgraded ? ` — bônus aumentado para +${Math.round(newMult*100)}% XP/Ouro` : ` (bônus mantido em +${Math.round(newMult*100)}%)`}.`, "cap");
      } else {
        pushChat(`Livro VIP usado (+${Math.round(newMult*100)}% ouro e EXP por ${cfg.label}).`, "cap");
      }
    } else if (id === "egg_common" || id === "egg_rare" || id === "egg_epic" || id === "egg_mystic" || id === "egg_aura" || id === "egg_charizard" || id === "egg_charizard_mythic" || id === "egg_lugia" || id === "egg_dragonite") {
      openEgg(id as EggId);
    } else if (id === "premium_box") {
      setIdle((s) => ({
        ...s,
        items: {
          ...s.items,
          premium_box: (s.items.premium_box ?? 0) - 1,
          potion: (s.items.potion ?? 0) + 50,
          pokeball: (s.items.pokeball ?? 0) + 50,
          skin_ticket: (s.items.skin_ticket ?? 0) + 1,
        },
      }));
      pushFxAt(trainerPos.x, trainerPos.y - 40, "+50 Poção · +50 Pokébola · +1 Ticket de Skin", "capture");
      pushChat(`🎁 Caixa Premium aberta! Você recebeu 50 Poções, 50 Pokébolas e 1 Ticket de Skin ✦ (use na aba Início para escolher uma skin premium).`, "cap");
    } else if (id === "bau_esmeralda") {
      const STONES = ["stone_grass","stone_fire","stone_water","stone_electric","stone_dark","stone_dragon"] as const;
      const pickStone = () => STONES[Math.floor(Math.random() * STONES.length)];
      const pool: Array<{ label: string; weight: number; apply: (items: Record<string, number>) => { items: Record<string, number>; gold?: number; crystals?: number } }> = [
        { label: "4.000× Great Ball", weight: 14, apply: (it) => ({ items: { ...it, greatball: (it.greatball ?? 0) + 4000 } }) },
        { label: "3.000× Ultra Ball", weight: 12, apply: (it) => ({ items: { ...it, ultraball: (it.ultraball ?? 0) + 3000 } }) },
        { label: "10× Orb Supremo ✦✦✦", weight: 10, apply: (it) => ({ items: { ...it, orb_xp_supreme: (it.orb_xp_supreme ?? 0) + 10 } }) },
        { label: "10× Orb Maior ✦✦", weight: 10, apply: (it) => ({ items: { ...it, orb_xp_major: (it.orb_xp_major ?? 0) + 10 } }) },
        { label: "10× Orb Menor ✦", weight: 10, apply: (it) => ({ items: { ...it, orb_xp_minor: (it.orb_xp_minor ?? 0) + 10 } }) },
        { label: "2× de cada Orb", weight: 9, apply: (it) => ({ items: { ...it, orb_xp_minor: (it.orb_xp_minor ?? 0) + 2, orb_xp_major: (it.orb_xp_major ?? 0) + 2, orb_xp_supreme: (it.orb_xp_supreme ?? 0) + 2 } }) },
        { label: "50× Stone Elemental aleatória", weight: 8, apply: (it) => { const s = pickStone(); return { items: { ...it, [s]: (it[s] ?? 0) + 50 } }; } },
        { label: "10× Stone Elemental aleatória", weight: 10, apply: (it) => { const s = pickStone(); return { items: { ...it, [s]: (it[s] ?? 0) + 10 } }; } },
        { label: "5× de cada Stone Elemental", weight: 6, apply: (it) => { const next = { ...it }; for (const s of STONES) next[s] = (next[s] ?? 0) + 5; return { items: next }; } },
        { label: "2.500 Cristais 💎", weight: 8, apply: (it) => ({ items: it, crystals: 2500 }) },
        { label: "150× Poção", weight: 8, apply: (it) => ({ items: { ...it, potion: (it.potion ?? 0) + 150 } }) },
        { label: "15× Incenso de Mel Raro 🍯", weight: 6, apply: (it) => ({ items: { ...it, incenso_mel_raro: (it.incenso_mel_raro ?? 0) + 15 } }) },
        { label: "1× Ovo Épico ✦✦", weight: 4, apply: (it) => ({ items: { ...it, egg_epic: (it.egg_epic ?? 0) + 1 } }) },
        { label: "100.000 Ouro 🪙", weight: 3, apply: (it) => ({ items: it, gold: 100000 }) },
      ];
      const total = pool.reduce((s, p) => s + p.weight, 0);
      let r = Math.random() * total;
      const roll = pool.find((p) => (r -= p.weight) < 0) ?? pool[0];
      setIdle((s) => {
        const baseItems = { ...s.items, bau_esmeralda: (s.items.bau_esmeralda ?? 0) - 1 };
        const res = roll.apply(baseItems);
        return {
          ...s,
          items: res.items,
          bank: {
            ...s.bank,
            gold: s.bank.gold + (res.gold ?? 0),
            crystals: s.bank.crystals + (res.crystals ?? 0),
          },
        };
      });
      pushFxAt(trainerPos.x, trainerPos.y - 40, `🎁 ${roll.label}`, "capture");
      pushChat(`💠 Baú de Esmeralda aberto! Você ganhou: ${roll.label}`, "cap");
    } else if (id === "skin_ticket") {
      pushChat(`✦ Vá até a aba Início e escolha uma skin premium para desbloquear com o ticket.`, "info");
    } else if (id === "incenso_mel") {
      const nowT = Date.now();
      if ((idle.buffs.honeyUntil ?? 0) > nowT || (idle.buffs.honeyRareUntil ?? 0) > nowT) {
        pushChat(`Já há um Incenso ativo. Espere o tempo acabar.`, "info");
        return;
      }
      setIdle((s) => ({
        ...s,
        items: { ...s.items, incenso_mel: (s.items.incenso_mel ?? 0) - 1 },
        buffs: { ...s.buffs, honeyUntil: nowT + HONEY_DURATION_MS },
      }));
      pushFxAt(trainerPos.x, trainerPos.y - 40, "🍯 MEL +10% · 1h", "capture");
      pushChat(`🍯 Incenso de Mel ativado! +10% drop/xp/def/velocidade por 1 hora.`, "cap");
    } else if (id === "incenso_mel_raro") {
      const nowT = Date.now();
      if ((idle.buffs.honeyUntil ?? 0) > nowT || (idle.buffs.honeyRareUntil ?? 0) > nowT) {
        pushChat(`Já há um Incenso ativo. Espere o tempo acabar.`, "info");
        return;
      }
      setIdle((s) => ({
        ...s,
        items: { ...s.items, incenso_mel_raro: (s.items.incenso_mel_raro ?? 0) - 1 },
        buffs: { ...s.buffs, honeyRareUntil: nowT + HONEY_DURATION_MS },
      }));
      pushFxAt(trainerPos.x, trainerPos.y - 40, "✨ MEL RARO +20% · 1h", "capture");
      pushChat(`✨🍯 Incenso Raro ativado! +20% drop/xp/def/velocidade por 1 hora (dobro do normal).`, "cap");
    } else if (id === "incenso_mel_raro_24h") {
      const nowT = Date.now();
      if ((idle.buffs.honeyUntil ?? 0) > nowT || (idle.buffs.honeyRareUntil ?? 0) > nowT) {
        pushChat(`Já há um Incenso ativo. Espere o tempo acabar.`, "info");
        return;
      }
      const dur24 = 24 * 60 * 60 * 1000;
      setIdle((s) => ({
        ...s,
        items: { ...s.items, incenso_mel_raro_24h: (s.items.incenso_mel_raro_24h ?? 0) - 1 },
        buffs: { ...s.buffs, honeyRareUntil: nowT + dur24 },
      }));
      pushFxAt(trainerPos.x, trainerPos.y - 40, "✨ MEL RARO +20% · 24h", "capture");
      pushEvent("✨", "INCENSO RARO 24H", "+20% drop/xp/def/velocidade por 24 horas", "#ffd94d");
      pushChat(`✨🍯 Incenso Raro 24h ativado! +20% drop/xp/def/velocidade por 24 horas.`, "cap");
    } else if (id === "stone_pack_all") {
      setIdle((s) => ({
        ...s,
        items: {
          ...s.items,
          stone_pack_all: (s.items.stone_pack_all ?? 0) - 1,
          stone_grass: (s.items.stone_grass ?? 0) + 4000,
          stone_fire: (s.items.stone_fire ?? 0) + 4000,
          stone_water: (s.items.stone_water ?? 0) + 4000,
          stone_electric: (s.items.stone_electric ?? 0) + 4000,
          stone_dark: (s.items.stone_dark ?? 0) + 4000,
          stone_dragon: (s.items.stone_dragon ?? 0) + 4000,
        },
      }));
      pushFxAt(trainerPos.x, trainerPos.y - 40, "+4000× de cada Stone", "capture");
      pushChat(`💠 Pacote das Seis Stones aberto! +4 000 de cada Stone Elemental (🌿🔥💧⚡🌑🐉).`, "cap");
    } else if (id === "egg_boost_69") {
      if ((idle.items?.[BLACK_EGG_ITEM_ID] ?? 0) <= 0) {
        pushChat(`Você precisa ter um Black Mitic Egg ativo para usar o Cristal do Despertar.`, "info");
        return;
      }
      openBlackEggHud();
      pushChat(`✦ Cristal do Despertar pronto — abra o painel do ovo e escolha qual Black Mitic Egg adiantar para 69%.`, "cap");
    }
  };


  // ===== OVOS =====
  // (Rarity é importada de @/game/systems)
  const RARITY_LABEL: Record<Rarity, string> = {
    common: "Comum", uncommon: "Incomum", rare: "Raro",
    epic: "Épico", legendary: "Lendário", mythic: "Mítico", mythic_shiny: "Mítico ✦",
  };
  const RARITY_COLOR: Record<Rarity, string> = {
    common: "#c8b8d0", uncommon: "#5ec26a", rare: "#6bd4ff",
    epic: "#c084fc", legendary: "#f5cf6b", mythic: "#ff6b3d", mythic_shiny: "#ff97e1",
  };
  type EggId = "egg_common" | "egg_rare" | "egg_epic" | "egg_mystic" | "egg_aura" | "egg_charizard" | "egg_charizard_mythic" | "egg_lugia" | "egg_dragonite";
  const EGG_TIERS: Record<EggId, { weights: Partial<Record<Rarity, number>> }> = {
    egg_common: { weights: { common: 70, uncommon: 25, rare: 5 } },
    egg_rare:   { weights: { uncommon: 20, rare: 55, epic: 22, legendary: 3 } },
    egg_epic:   { weights: { rare: 20, epic: 50, legendary: 25, mythic: 5 } },
    egg_mystic: { weights: { common: 25, uncommon: 25, rare: 22, epic: 16, legendary: 9, mythic: 2, mythic_shiny: 1 } },
    egg_aura:   { weights: { mythic: 100 } },
    egg_charizard: { weights: { mythic: 100 } },
    egg_charizard_mythic: { weights: { mythic_shiny: 100 } },
    egg_lugia:  { weights: { mythic: 100 } },
    egg_dragonite: { weights: { mythic: 100 } },
  };

  const rollEggRarity = (tier: EggId): Rarity => {
    const w = EGG_TIERS[tier].weights;
    const entries = Object.entries(w) as [Rarity, number][];
    const total = entries.reduce((s, [, v]) => s + v, 0);
    let r = Math.random() * total;
    for (const [k, v] of entries) { r -= v; if (r <= 0) return k; }
    return "common";
  };
  const openEgg = (eggId: EggId) => {
    const have = idle.items[eggId] ?? 0;
    if (have <= 0) { pushChat(`Você não tem esse ovo.`, "info"); return; }
    const leaderLv = team[0]?.level ?? 5;
    let sp: Species;
    if (eggId === "egg_aura") {
      sp = (Math.random() < 0.5 ? "lucario" : "mew") as Species;
    } else if (eggId === "egg_charizard" || eggId === "egg_charizard_mythic") {
      sp = "charizard_shiny" as Species;
    } else if (eggId === "egg_lugia") {
      sp = "lugia" as Species;
    } else if (eggId === "egg_dragonite") {
      sp = "dragonite_shiny" as Species;
    } else {
      const unlocked = speciesUnlockedFor(leaderLv).filter((x) => !!GIF[x]);
      const fallback = (Object.keys(GIF) as Species[]);
      const pickFrom = unlocked.length ? unlocked : fallback;
      sp = pickFrom[Math.floor(Math.random() * pickFrom.length)] as Species;
    }
    const rarity = rollEggRarity(eggId);
    const fixedLv = eggId === "egg_charizard_mythic" ? 500 : eggId === "egg_lugia" ? 200 : eggId === "egg_charizard" ? 50 : eggId === "egg_dragonite" ? 100 : Math.max(1, leaderLv);
    const pet = makePet(sp, fixedLv, rarity as Rarity);

    setIdle((s) => {
      const prev = s.collection ?? [];
      if (prev.length >= MAX_COLLECTION) {
        queueMicrotask(() => pushChat(`⚠ Coleção cheia (${MAX_COLLECTION}). Ovo não pôde ser guardado.`, "info"));
        return { ...s, items: { ...s.items, [eggId]: (s.items[eggId] ?? 0) - 1 } };
      }
      return {
        ...s,
        items: { ...s.items, [eggId]: (s.items[eggId] ?? 0) - 1 },
        caughtSpecies: s.caughtSpecies.includes(sp as Species) ? s.caughtSpecies : [...s.caughtSpecies, sp as Species],
        seenSpecies: s.seenSpecies.includes(sp as Species) ? s.seenSpecies : [...s.seenSpecies, sp as Species],
        collection: [
          ...prev,
          { uid: pet.uid, species: pet.species, level: pet.level, rarity: pet.rarity, capturedAt: Date.now() },
        ],
      };
    });
    // Adiciona ao time se houver vaga (mesma regra da captura)
    setTeam((tm) => {
      if (tm.length >= 6) {
        pushChat(`Time cheio (5/5). ${String(sp).toUpperCase()} foi para a Coleção.`, "info");
        return tm;
      }
      return [...tm, pet];
    });
    // Espelha no save principal para compat com a tela clássica
    try {
      const raw = localStorage.getItem("rubym.save.v2");
      const save = raw ? JSON.parse(raw) : {};
      save.party = [...(save.party ?? []), pet];
      localStorage.setItem("rubym.save.v2", JSON.stringify(save));
    } catch { /* ignore */ }
    setEggOpenResult({ sp: String(sp), rarity });
    pushChat(`🥚 Ovo chocou: ${String(sp).toUpperCase()} — ${RARITY_LABEL[rarity]}! Stats bonificados pela raridade.`, "cap");
    pushFxAt(trainerPos.x, trainerPos.y - 70, `${RARITY_LABEL[rarity].toUpperCase()}!`, "capture");

  };

  // Loja — apenas 1 ovo místico (500 cristais), raridade totalmente aleatória
  // Loja — ovos temporariamente removidos da venda
  const SHOP_EGGS: { id: EggId; name: string; price: number; currency: "gold" | "crystals"; desc: string; color: string }[] = [];

  const buyEgg = (e: typeof SHOP_EGGS[number]) => {
    setIdle((s) => {
      if (e.currency === "gold" && s.bank.gold < e.price) { pushChat(`Ouro insuficiente para ${e.name}.`, "info"); return s; }
      if (e.currency === "crystals" && s.bank.crystals < e.price) { pushChat(`Cristais insuficientes para ${e.name}.`, "info"); return s; }
      pushChat(`Comprou ${e.name}. Vá no Inventário e USE para chocar.`, "cap");
      return {
        ...s,
        bank: e.currency === "gold"
          ? { ...s.bank, gold: s.bank.gold - e.price }
          : { ...s.bank, crystals: s.bank.crystals - e.price },
        items: { ...s.items, [e.id]: (s.items[e.id] ?? 0) + 1 },
      };
    });
  };

  // Fragmentar Pokémon da coleção -> Cristal Prisma por raridade
  const fragmentCollection = (uid: string) => {
    // Bloqueio duro: pokémon no time nunca pode ser fragmentado
    if ((teamRef.current ?? []).some((p) => p.uid === uid)) {
      pushChat("Retire o Pokémon do time antes de fragmentar.", "info");
      return;
    }
    setIdle((s) => {
      const col = s.collection ?? [];
      const entry = col.find((e) => e.uid === uid);
      if (!entry) return s;
      const isEvent = entry.event === "oddish_odyssey";
      const safiraGain = isEvent ? (entry.species === "oddish_shiny" ? 20 : (SAFIRA_VERDE_BY_RARITY[entry.rarity] ?? 1)) : 0;
      // 🌿 Stone Verdejante para Oddish/Oddish Shiny
      const isOddishSp = entry.species === "oddish" || entry.species === "oddish_shiny";
      const stoneByRar: Record<string, number> = { common: 1, rare: 2, epic: 3, legendary: 4, mythic: 5, mythic_shiny: 10 };
      const stoneGain = isOddishSp ? (entry.species === "oddish_shiny" ? 10 : (stoneByRar[entry.rarity] ?? 2)) : 0;
      const bonusParts: string[] = [];
      if (safiraGain > 0) bonusParts.push(`+${safiraGain} 💚 Safira Verde`);
      if (stoneGain > 0) bonusParts.push(`+${stoneGain} 🌿 Stone Verdejante`);
      const bonus = bonusParts.length ? ` ${bonusParts.join(" ")}` : "";
      // 🔷 Cristal Prisma — token independente. Escala por raridade.
      // NÃO conta como pontos de craft nem de captura.
      const PRISMA_BY_RARITY: Record<string, number> = { common: 1, uncommon: 1, rare: 2, epic: 3, legendary: 5, mythic: 10, mythic_shiny: 20 };
      const crystalGain = PRISMA_BY_RARITY[entry.rarity] ?? 1;
      pushChat(`⚒️ ${entry.species.replace(/_/g, " ").toUpperCase()} fragmentado (+${crystalGain} 🔷 Cristal Prisma${bonus}).`, "cap");
      consumedUidsRef.current.add(uid);
      return {
        ...s,
        collection: col.filter((e) => e.uid !== uid),
        items: {
          ...s.items,
          cristal_fragmentado: (s.items?.cristal_fragmentado ?? 0) + crystalGain,
          ...(safiraGain > 0 ? { safira_verde: (s.items?.safira_verde ?? 0) + safiraGain } : {}),
          ...(stoneGain > 0 ? { stone_grass: (s.items?.stone_grass ?? 0) + stoneGain } : {}),
        },
      };
    });

    // Defesa: se por algum motivo estiver no bench, também remove
    setRestingBench((b) => b.filter((p) => p.uid !== uid));
  };






  // Vale Verdejante: tabela com pesos e raridade forçada.
  // Peso alto = aparece muito; peso baixo = raro ★ (mais forte, aura colorida)
  // Só permite spawn de espécies com GIF disponível.
  const hasGif = (sp: Species) => !!GIF[sp];
  const ARENA_SPAWN_TABLE: { sp: Species; w: number; forcedRarity?: Rarity }[] = ([
    // Comuns (frequentes)
    { sp: "caterpie" as Species,   w: 14 },
    { sp: "weedle" as Species,     w: 14 },
    { sp: "pidgey" as Species,     w: 12 },
    { sp: "rattata_f" as Species,  w: 12 },
    { sp: "oddish" as Species,     w: 10 },
    { sp: "bellsprout" as Species, w: 10 },
    { sp: "metapod" as Species,    w: 6 },
    { sp: "kakuna" as Species,     w: 6 },
    // Incomuns
    { sp: "sandshrew" as Species,  w: 7, forcedRarity: "uncommon" },
    { sp: "mankey" as Species,     w: 7, forcedRarity: "uncommon" },
    { sp: "venonat" as Species,    w: 2, forcedRarity: "uncommon" },
    { sp: "paras" as Species,      w: 7, forcedRarity: "uncommon" },
    { sp: "poliwag" as Species,    w: 7, forcedRarity: "uncommon" },
    { sp: "nidoran_f" as Species,  w: 6, forcedRarity: "uncommon" },
    { sp: "pidgeotto" as Species,  w: 4, forcedRarity: "uncommon" },
    { sp: "raticate_f" as Species, w: 4, forcedRarity: "uncommon" },
    // Raros ★ (mais fortes)
    { sp: "bulbasaur" as Species,  w: 3, forcedRarity: "rare" },
    { sp: "growlithe" as Species,  w: 3, forcedRarity: "rare" },
    { sp: "vulpix" as Species,     w: 3, forcedRarity: "rare" },
    { sp: "abra" as Species,       w: 3, forcedRarity: "rare" },
    { sp: "clefairy" as Species,   w: 3, forcedRarity: "rare" },
    { sp: "cubone" as Species,     w: 3, forcedRarity: "rare" },
    { sp: "magnemite" as Species,  w: 3, forcedRarity: "rare" },
    { sp: "gloom" as Species,      w: 2, forcedRarity: "rare" },
    { sp: "parasect" as Species,   w: 2, forcedRarity: "rare" },
    // (Épico só é liberado quando o líder chega ao nível 50 — em outros mapas)
  ] as { sp: Species; w: number; forcedRarity?: Rarity }[]).filter((e) => hasGif(e.sp));

  function pickArenaSpawn(): { sp: Species; forcedRarity?: Rarity } {
    const total = ARENA_SPAWN_TABLE.reduce((s, e) => s + e.w, 0);
    let r = Math.random() * total;
    for (const e of ARENA_SPAWN_TABLE) {
      r -= e.w;
      if (r <= 0) return { sp: e.sp, forcedRarity: e.forcedRarity };
    }
    return { sp: ARENA_SPAWN_TABLE[0].sp, forcedRarity: ARENA_SPAWN_TABLE[0].forcedRarity };
  }

  // Tenta criar UM inimigo respeitando obstáculos e distância mínima.
  // Retorna null se não achou posição válida em 40 tentativas.
  function spawnOneEnemy(placed: { x: number; y: number }[]): Enemy | null {
    // Continente do Governante — zona sagrada, sem spawns.
    if (idle.currentMap === "absol_start" || idle.currentMap === "governante_hall") return null;
    const leaderLv = team[0]?.level ?? 10;
    const maxTeamLv = team.reduce((m, p) => Math.max(m, p.level), 0);
    const MIN_DIST = 220;
    for (let attempts = 0; attempts < 40; attempts++) {
      const x = 120 + Math.random() * (WORLD_W - 240);
      const y = 120 + Math.random() * (WORLD_H - 240);
      const dt = Math.hypot(x - WORLD_W / 2, y - WORLD_H / 2);
      if (dt < 300) continue;
      let ok = true;
      for (const p of placed) {
        if (Math.hypot(x - p.x, y - p.y) < MIN_DIST) { ok = false; break; }
      }
      if (!ok) continue;
      if (collidesWithAny(x, y)) continue;
      // Nunca spawnar pokémon "atrás"/em cima de portais — evita que o treinador
      // fique preso tentando alcançar inimigos do outro lado de um portal bloqueado.
      const nearPortal = WORLD_PORTALS.some((p) => p.from === idle.currentMap && Math.hypot(x - p.x, y - p.y) < 240);
      if (nearPortal) continue;
      placed.push({ x, y });

      const elite = Math.random() < 0.40;
      let pool = speciesUnlockedFor(leaderLv);
      let mapLvRange: [number, number] | null = null;
      let sp: Species;
      let forcedRarity: Rarity | undefined;

      if (idle.currentMap === "arena") {
        const pick = pickArenaSpawn();
        sp = pick.sp;
        forcedRarity = pick.forcedRarity;
        mapLvRange = [1, 30];
      } else {
        if (idle.currentMap === "terra" && maxTeamLv >= 30) {
          // blaziken removido do pool comum (aparece raramente via evento/spawn épico)
          pool = ["beedrill", "butterfree", "pinsir", "golem", "jolteon", "lapras"] as Species[];
        }
        if (idle.currentMap === "venofogo") {
          // blaziken/venonat com presença reduzida (só entram via chance pequena abaixo)
          pool = ["charmander", "charmeleon", "charizard", "magmar", "arcanine", "growlithe",
                  "ekans", "arbok", "zubat", "venomoth", "beedrill", "weedle", "kakuna"] as Species[];
          if (Math.random() < 0.05) pool = ["blaziken"] as Species[];
          else if (Math.random() < 0.05) pool = ["venonat"] as Species[];
          // Pântano em Chamas: pokémons sempre 10-15 níveis acima do líder (zona de risco).
          mapLvRange = [leaderLv + 10, leaderLv + 15];
        }
        if (idle.currentMap === "fantasma") {
          // Cemitério Assombrado: zona endgame nível 200+.
          // Até 249 o mapa empurra acima do líder; a partir de 250 exige parear níveis.
          pool = ["zubat", "venomoth", "gloom", "ekans", "arbok", "abra", "kadabra", "meowth", "persian"] as Species[];
          if (leaderLv < 200) mapLvRange = [200, 225];
          else if (leaderLv < 250) mapLvRange = [leaderLv + 12, leaderLv + 32];
          else mapLvRange = [Math.max(250, leaderLv - 2), leaderLv + 18];
        }
        if (idle.currentMap === "terry") {
          // Terras de Terry — Elite Lv 200-400 com pokémons peçonhentos
          pool = ["arbok", "ekans", "venomoth", "venonat", "beedrill", "nidoking", "nidorina", "gloom", "oddish", "primeape", "machamp", "hariyama", "ursaring"] as Species[];
          mapLvRange = [200, 400];
        }
        if (idle.currentMap === "n2") {
          // Planície de Terry — Elite+ Lv 350-550, criaturas com debuff de ataque
          pool = ["arbok", "venomoth", "nidoking", "machamp", "hariyama", "ursaring", "primeape", "gyarados", "arcanine", "kadabra", "persian"] as Species[];
          mapLvRange = [350, 550];
        }
        if (idle.currentMap === "n3") {
          // Confins de Terry — Lendário Lv 500-700, ataques fortes
          pool = ["gyarados", "arcanine", "machamp", "nidoking", "ursaring", "hariyama", "arbok", "venomoth", "kadabra", "dragonair", "clefable", "magmortar", "raichu"] as Species[];
          mapLvRange = [500, 700];
        }
        if (idle.currentMap === "pantano_fogo") {
          // Pântano em Chamas — PRIMORDIAL Lv 700-1200. Pool multi-elemento p/ sinergias fortes.
          // Fogo + Dragão + Lutador + Voador + Veneno + Pedra — combos brutais.
          pool = [
            "charizard", "charizard_shiny", "blaziken", "magmortar", "arcanine", "moltres",
            "dragonite", "dragonite_shiny", "dragonair", "gyarados",
            "tyranitar", "infernape", "krookodile", "machamp", "nidoking", "nidoking_shiny",
            "rapidash", "rapidash_shiny", "skarmory", "ho_oh", "groudon",
            "ursaring", "hariyama", "primeape",
          ] as Species[];
          mapLvRange = [700, 1200];
        }
        // ═══ CADEIA ABISSAL — Lv 1000-3000 ═══
        if (idle.currentMap === "abismo_gelo") {
          pool = ["lapras", "lapras_shiny", "articuno", "dragonair", "dragonite", "dragonite_shiny", "gyarados", "skarmory", "tyranitar", "machamp", "ursaring"] as Species[];
          mapLvRange = [1000, 1500];
        }
        if (idle.currentMap === "abismo_veneno") {
          pool = ["arbok", "venomoth", "nidoking", "nidoking_shiny", "gengar", "tyranitar", "ursaring", "hariyama", "krookodile", "machamp", "dragonite"] as Species[];
          mapLvRange = [1400, 2000];
        }
        if (idle.currentMap === "abismo_raio") {
          pool = ["raichu", "jolteon", "electabuzz", "magneton", "zapdos", "dragonite", "dragonite_shiny", "skarmory", "tyranitar", "gyarados", "scizor"] as Species[];
          mapLvRange = [1800, 2400];
        }
        if (idle.currentMap === "abismo_sombra") {
          pool = ["gengar", "umbreon", "darkrai", "krookodile", "tyranitar", "dialga", "ho_oh", "dragonite_shiny", "nidoking_shiny", "gyarados", "infernape"] as Species[];
          mapLvRange = [2200, 2700];
        }
        if (idle.currentMap === "abismo_dragao") {
          pool = ["dragonite", "dragonite_shiny", "dragonair", "charizard", "charizard_shiny", "dialga", "ho_oh", "groudon", "tyranitar", "rapidash_shiny", "gyarados", "infernape", "moltres"] as Species[];
          mapLvRange = [2500, 3000];
        }
        if (idle.currentMap === "deserto_purpura") {
          // Areias de Anúbis — deserto tóxico continuação do Ninho de Marimbondo
          pool = ["ekans", "arbok", "sandshrew", "sandslash", "cubone", "nidoran_f", "nidorina", "nidoking", "beedrill", "kakuna", "weedle", "diglett", "meowth", "persian"] as Species[];
          mapLvRange = [Math.max(20, leaderLv - 3), Math.min(55, leaderLv + 8)];
        }
        pool = pool.filter(hasGif);
        if (pool.length === 0) pool = (Object.keys(GIF) as Species[]);
        // Evento Gelius: rosters específicos, sobrescreve pool
        if (idle.currentMap === "gelius1") {
          pool = [...GELIUS_PHASE1_POOL].filter(hasGif) as Species[];
          if (pool.length === 0) pool = ["magmar", "gengar", "ditto"] as Species[];
          mapLvRange = [50, 200];
        } else if (idle.currentMap === "gelius2") {
          pool = [...GELIUS_PHASE2_POOL].filter(hasGif) as Species[];
          if (pool.length === 0) pool = ["gengar", "magmar", "tyranitar"] as Species[];
          mapLvRange = [400, 1000];
        }
        // Cadeia estendida (3000→6000) — reaproveita pool do abismo do dragão / míticos
        if (idle.currentMap === "cadeia_ab") {
          pool = ["dragonite", "dragonite_shiny", "charizard", "charizard_shiny", "tyranitar", "gyarados", "rapidash_shiny", "infernape", "nidoking_shiny", "krookodile", "gengar", "umbreon"] as Species[];
          mapLvRange = [3000, 3500];
        } else if (idle.currentMap === "cadeia_ab1") {
          pool = ["dialga", "ho_oh", "groudon", "darkrai", "dragonite_shiny", "tyranitar", "nidoking_shiny", "rapidash_shiny", "charizard_shiny", "moltres", "krookodile"] as Species[];
          mapLvRange = [3500, 5000];
        } else if (idle.currentMap === "cadeia_f1") {
          pool = ["dialga", "ho_oh", "groudon", "darkrai", "moltres", "zapdos", "articuno", "dragonite_shiny", "charizard_shiny", "rapidash_shiny", "nidoking_shiny", "tyranitar"] as Species[];
          mapLvRange = [4000, 6000];
        } else if (idle.currentMap === "evento_myth") {
          // Domínio Mítico Shiny — variedade grande, todos serão forçados a mythic_shiny
          pool = ["charizard_shiny", "dragonite_shiny", "nidoking_shiny", "rapidash_shiny", "lapras_shiny", "suicune_shiny", "ditto_shiny", "jolteon_shiny", "sandshrew_shiny", "kakuna_shiny", "weedle_shiny", "metapod_shiny", "magikarp_shiny", "flareon_shiny", "vaporeon_shiny", "blastoise_shiny", "butterfree_shiny", "wartortle_shiny", "sandslash_shiny", "dragonite_shiny"] as Species[];
          pool = pool.filter(hasGif);
          if (pool.length === 0) pool = ["charizard_shiny", "dragonite_shiny"] as Species[];
          // Pareia com o líder — grande variação para não ficar previsível
          const leadForRange = Math.max(1, leaderLv);
          mapLvRange = [Math.max(1, leadForRange - 15), leadForRange + 25];
        } else if (idle.currentMap === "vale_fragmentos") {
          // 🔻 VALE DOS FRAGMENTOS VERMELHOS — spawn constante e capturável.
          pool = (["onix", "golem", "cubone", "diglett", "sandshrew", "sandslash", "machop", "machoke", "machamp", "primeape", "tyranitar", "krookodile", "aerodactyl", "pinsir"] as Species[]).filter(hasGif);
          if (pool.length === 0) pool = ["onix"] as Species[];
          const rr = Math.random();
          forcedRarity = rr < 0.55 ? "uncommon" : rr < 0.85 ? "rare" : rr < 0.97 ? "epic" : "legendary";
          mapLvRange = [Math.max(1, leaderLv - 4), leaderLv + 6];
        } else if (isGymMap(idle.currentMap)) {
          // 🏰 GINÁSIO MEDIEVAL — endgame. Espécies fortes, raridades altas, níveis acima do líder.
          const floor = GYM_FLOOR_BY_ID[idle.currentMap]!;
          pool = (GYM_POOLS[floor.id] as Species[]).filter(hasGif);
          if (pool.length === 0) pool = ["tyranitar"] as Species[];
          const rr = Math.random();
          if (floor.id === "gym_carmesim") {
            forcedRarity = rr < 0.45 ? "rare" : rr < 0.85 ? "epic" : "legendary";
          } else if (floor.id === "gym_gelo_sombra") {
            forcedRarity = rr < 0.35 ? "epic" : rr < 0.85 ? "legendary" : "mythic";
          } else {
            forcedRarity = rr < 0.55 ? "legendary" : rr < 0.92 ? "mythic" : "mythic_shiny";
          }
          const bump = floor.id === "gym_carmesim" ? 25 : floor.id === "gym_gelo_sombra" ? 60 : 120;
          mapLvRange = [Math.max(1, leaderLv + Math.floor(bump * 0.4)), leaderLv + bump];
        } else if (idle.currentMap === "grass_oddish") {
          // 🌿 EVENTO GRASS ODDISH — Oddish + Oddish Shiny (12% chance), raridades Raro/Épico/Mítico.
          // Captura usa as MESMAS taxas globais do servidor.
          const shinyRoll = Math.random();
          if (shinyRoll < 0.12) {
            pool = ["oddish_shiny"] as Species[];
            forcedRarity = "mythic_shiny";
          } else {
            pool = ["oddish"] as Species[];
            const rr = Math.random();
            forcedRarity = rr < 0.60 ? "rare" : rr < 0.90 ? "epic" : "mythic";
          }
          mapLvRange = [Math.max(1, leaderLv - 2), leaderLv + 3];
        } else if (idle.currentMap === "oddish_o1" || idle.currentMap === "oddish_o2" || idle.currentMap === "oddish_o3") {
          // Odisséia Oddish — mapa aberto 24h. Não captura aqui.
          // Bastante Oddish Shiny, Scizor e mons legais aleatórios.
          const rollShiny = Math.random();
          if (rollShiny < 0.18) {
            // ✦ ODDISH SHINY — spawn muito comum no evento
            pool = ["oddish_shiny"] as Species[];
            forcedRarity = "mythic_shiny";
            mapLvRange = [Math.max(1, leaderLv - 2), leaderLv + 3];
          } else if (rollShiny < 0.32) {
            // Scizor — épico brilhante
            pool = (["scizor"] as Species[]).filter(hasGif);
            if (pool.length === 0) pool = ["oddish"] as Species[];
            forcedRarity = "epic";
            mapLvRange = [Math.max(1, leaderLv - 2), leaderLv + 3];
          } else {
            // Aleatórios legais no mapa: gengar, magmar, gyarados, ursaring, hariyama, umbreon, jolteon, dragonite, oddish, gloom, vileplume, lickitung
            const wild = (["gengar", "magmar", "gyarados", "ursaring", "hariyama", "umbreon", "jolteon", "dragonite", "oddish", "gloom", "vileplume", "lickitung", "lickitung_shiny", "beedrill", "venomoth", "onix", "onix_shiny"] as Species[]).filter(hasGif);
            pool = wild.length ? wild : (["oddish"] as Species[]);
            // Raridade mista: epic 55%, mythic 25%, mythic_shiny 20% — todos dropam stones
            const rr = Math.random();
            forcedRarity = rr < 0.55 ? "epic" : rr < 0.80 ? "mythic" : "mythic_shiny";
            mapLvRange = [Math.max(1, leaderLv - 2), leaderLv + 3];
          }
        }
        // ⚡ ZAPDOS EVENT — ENCERRADO
        // ⚡✦ RAICHU MÍTICO — spawn RARO exclusivo dos mapas Oddish Odyssey e Grass Oddish
        {
          const oddyMaps: string[] = ["oddish_o1", "oddish_o2", "oddish_o3", "grass_oddish"];
          const isOddy = oddyMaps.includes(idle.currentMap as string);
          if (isOddy) {
            const raichuOnMap = enemies.some((e) => e.sp === "raichu");
            const isGrass = idle.currentMap === "grass_oddish";
            // ~0.4% Odyssey / ~0.8% Grass Oddish, no máximo 1 por mapa
            const chance = isGrass ? 0.008 : 0.004;
            if (!raichuOnMap && Math.random() < chance) {
              pool = ["raichu"] as Species[];
              forcedRarity = isGrass ? "mythic" : "mythic_shiny";
              mapLvRange = isGrass ? [Math.max(1, leaderLv), leaderLv + 5] : [500, 500];
              pushChat(
                isGrass
                  ? "⚡✦ RAICHU MÍTICO apareceu no Grass Oddish! Ele carrega uma Stone Elétrica ⚡"
                  : "⚡✦ RAICHU MÍTICO surgiu na Odisséia Oddish! (2000 Ultra Balls para capturar)",
                "cap"
              );
            }
          }
        }
        // 🐉✦ RAYQUAZA MÍTICO — spawn RARO exclusivo do Grass Oddish (carrega Stone Dragão)
        {
          const isGrass = idle.currentMap === "grass_oddish";
          if (isGrass) {
            const rayOnMap = enemies.some((e) => e.sp === "rayquaza");
            if (!rayOnMap && Math.random() < 0.006) {
              pool = ["rayquaza"] as Species[];
              forcedRarity = "mythic_shiny";
              mapLvRange = [500, 500];
              pushChat("🐉✦ RAYQUAZA MÍTICO apareceu no Grass Oddish! Ele carrega uma Stone Dragão 🐉 (3000 Ultra Balls para capturar)", "cap");
            }
          }
        }
        // ✦XP✦ Bosses raros exclusivos do Grass Oddish — Dragonite Shiny / Onix Shiny / Riolu
        {
          const isGrass = idle.currentMap === "grass_oddish";
          if (isGrass && !forcedRarity) {
            const rare: Array<{ sp: Species; chance: number; lv: number; label: string }> = [
              { sp: "dragonite_shiny" as Species, chance: 0.005, lv: 500, label: "🐲✦ DRAGONITE SHINY" },
              { sp: "onix_shiny" as Species, chance: 0.005, lv: 400, label: "🪨✦ ONIX SHINY" },
              { sp: "riolu" as Species, chance: 0.006, lv: 300, label: "🐺✦ RIOLU" },
            ];
            for (const b of rare) {
              const already = enemies.some((e) => e.sp === b.sp);
              if (!already && Math.random() < b.chance) {
                pool = [b.sp] as Species[];
                forcedRarity = "mythic_shiny";
                mapLvRange = [b.lv, b.lv];
                pushChat(`${b.label} apareceu no Grass Oddish! Ele carrega XP extra ⭐ (3000 Ultra Balls para capturar)`, "cap");
                break;
              }
            }
          }
        }
        // 🚫 Blacklist de spawn — Darkrai e Dragonite (qualquer raridade) removidos dos mapas normais.
        if (!forcedRarity) {
          const BANNED = new Set<Species>(["darkrai", "dragonite", "dragonite_shiny"] as Species[]);
          const filtered = pool.filter((p) => !BANNED.has(p));
          if (filtered.length > 0) pool = filtered;
          else pool = ["oddish"] as Species[];
        }
        sp = pool[Math.floor(Math.random() * pool.length)];
        // 🔒 FILTRO DE VALIOSOS — se a espécie tem raridade base alta (mítico/lendário)
        // e não foi forçada por evento, aplica um gate probabilístico e re-sorteia
        // um mon mais comum da pool caso não passe. Deixa os valiosos MUITO mais raros.
        if (!forcedRarity) {
          const baseRar = SPECIES_BASE[sp]?.rarity;
          const gate =
            baseRar === "mythic_shiny" ? 0.05 :
            baseRar === "mythic"       ? 0.08 :
            baseRar === "legendary"    ? 0.15 :
            baseRar === "epic"         ? 0.35 : 1;
          if (gate < 1 && Math.random() > gate) {
            const cheaper = pool.filter((p) => {
              const rr = SPECIES_BASE[p]?.rarity;
              return rr !== "mythic" && rr !== "mythic_shiny" && rr !== "legendary" && rr !== "epic";
            });
            if (cheaper.length > 0) sp = cheaper[Math.floor(Math.random() * cheaper.length)];
          }
        }
      }


      // 🌟 MYTHIC ROAMER: pokémons míticos Lv 500 (deoxys/groudon/lapras✦/snorlax✦) que
      // aparecem raro em qualquer mapa. Máx 1 por mapa. Muito difícil de capturar (event legendary).
      const MYTHIC_ROAMERS: Species[] = ["deoxys", "groudon", "lapras_shiny", "snorlax_mythic"];
      const currentRoamers = enemies.filter((e) => e.eventLegendary && e.level >= 400).length;
      // ✨ EVENTO ESPECIAL DIALGA — Lv 800, a cada 3 horas (persistente via localStorage)
      // Máx 1 no mapa. Foge fácil, crit brutal, captura só via ultraball (super difícil).
      const DIALGA_INTERVAL_MS = 3 * 60 * 60 * 1000;
      const dialgaOnMap = enemies.some((e) => e.sp === "dialga");
      let isDialgaEvent = false;
      try {
        const last = Number(localStorage.getItem("dialga_last_spawn_ms") || 0);
        if (!dialgaOnMap && !currentRoamers && Date.now() - last >= DIALGA_INTERVAL_MS && Math.random() < 0.02) {
          isDialgaEvent = true;
          localStorage.setItem("dialga_last_spawn_ms", String(Date.now()));
        }
      } catch {}
      const isMythicRoamer = !isDialgaEvent && currentRoamers === 0 && Math.random() < 0.0015;
      if (isDialgaEvent) {
        sp = "dialga";
        forcedRarity = "mythic_shiny";
        mapLvRange = [800, 800];
      } else if (isMythicRoamer) {
        sp = MYTHIC_ROAMERS[Math.floor(Math.random() * MYTHIC_ROAMERS.length)];
        forcedRarity = "mythic_shiny";
        mapLvRange = [500, 500];
      }
      // Domínio Mítico Shiny — força a raridade e nível alto próximo do líder
      const isMythShinyEvent = idle.currentMap === "evento_myth";
      if (isMythShinyEvent) {
        forcedRarity = "mythic_shiny";
      }

      // 🐉 DRAGONITE SHINY GLOBAL — DESATIVADO (removido dos mapas por decisão do admin).



      const rareStrong = Math.random() < 0.05;
      const offset = rareStrong
        ? 5 + Math.floor(Math.random() * 6)
        : -5 + Math.floor(Math.random() * 16);
      let baseLv = Math.max(1, leaderLv + offset);
      let lv = elite ? baseLv + 1 : baseLv;
      if (mapLvRange) {
        const [lo, hi] = mapLvRange;
        lv = Math.max(lo, Math.min(hi, lv));
      }
      const hardCap = IDLE_MAPS[idle.currentMap].maxLevel;
      if (hardCap != null && !isMythicRoamer && !isDialgaEvent) lv = Math.min(lv, hardCap);
      if (isMythicRoamer) lv = 500;
      if (isDialgaEvent) lv = 800;
      // Épico só aparece quando o líder chega ao nível 50.
      const allowEpic = leaderLv >= 50;
      if (forcedRarity === "epic" && !allowEpic) forcedRarity = "rare";
      let pet = makePet(sp, lv, forcedRarity);
      if (!isMythicRoamer && (pet.rarity === "epic" || pet.rarity === "legendary") && !allowEpic) {
        pet = makePet(sp, lv, "rare");
      }
      // ★ POKÉMON RIDER: 1.2% de chance — muito acima do nível do líder, dá MUITO xp
      const isRider = !isMythicRoamer && !isDialgaEvent && Math.random() < 0.005 && !mapLvRange;
      if (isRider) {
        const boost = 25 + Math.floor(Math.random() * 21); // +25..+45
        lv = leaderLv + boost;
        if (hardCap != null) lv = Math.min(lv, hardCap + 50); // riders podem passar do cap
        pet = makePet(sp, lv, allowEpic ? "epic" : "rare");
      }
      // 🖤 GUARDIÕES ANTI-PARALISIA — Ditto Shiny / Scizor / Umbreon
      // Aparecem raro em mapas ou com líder > Lv 100. Estrela preta ✦. Difícil de capturar.
      // Raridade varia de comum a mítico.
      const GUARDIAN_MONS: Species[] = ["ditto", "ditto_shiny", "scizor", "umbreon"];
      const guardianEligible = !isMythicRoamer && !isDialgaEvent && !isRider && (leaderLv >= 100 || (hardCap != null && hardCap > 100));
      const isGuardian = guardianEligible && Math.random() < 0.003;
      if (isGuardian) {
        sp = GUARDIAN_MONS[Math.floor(Math.random() * GUARDIAN_MONS.length)];
        const rarityRoll = Math.random();
        const gRarity: Rarity =
          rarityRoll < 0.35 ? "common" :
          rarityRoll < 0.60 ? "uncommon" :
          rarityRoll < 0.80 ? "rare" :
          rarityRoll < 0.93 ? "epic" :
          rarityRoll < 0.99 ? "legendary" : "mythic";
        const gLv = Math.max(100, leaderLv + Math.floor(Math.random() * 20) - 5);
        pet = makePet(sp, gLv, gRarity);
        lv = gLv;
      }
      // 🔥 APEX BOSSES — Infernape / Krookodile / Tyranitar / Nidoking Shiny
      // Aparição rara em mapas de nv 300+. Fortes, crit alto, muito difíceis de capturar.
      const APEX_MONS: Array<{ sp: Species; minLv: number; rarityFloor: Rarity }> = [
        { sp: "infernape",      minLv: 300, rarityFloor: "epic" },
        { sp: "krookodile",     minLv: 350, rarityFloor: "epic" },
        { sp: "tyranitar",      minLv: 500, rarityFloor: "legendary" },
        { sp: "nidoking_shiny", minLv: 600, rarityFloor: "mythic" },
        { sp: "rapidash",       minLv: 300, rarityFloor: "epic" },
        { sp: "rapidash_shiny", minLv: 400, rarityFloor: "legendary" },
        { sp: "skarmory",       minLv: 350, rarityFloor: "legendary" },
      ];
      const apexPool = APEX_MONS.filter((a) => leaderLv >= a.minLv && a.minLv <= 700);
      const apexEligible = !isMythicRoamer && !isDialgaEvent && !isRider && !isGuardian && apexPool.length > 0;
      // 0.6% chance quando elegível (aparição escassa)
      const isApex = apexEligible && Math.random() < 0.0025;
      if (isApex) {
        const pick = apexPool[Math.floor(Math.random() * apexPool.length)];
        sp = pick.sp;
        const rarityRoll = Math.random();
        const aRarity: Rarity =
          pick.rarityFloor === "mythic"    ? (rarityRoll < 0.75 ? "mythic" : "mythic_shiny") :
          pick.rarityFloor === "legendary" ? (rarityRoll < 0.60 ? "legendary" : rarityRoll < 0.92 ? "mythic" : "mythic_shiny") :
          /* epic */                         (rarityRoll < 0.50 ? "epic" : rarityRoll < 0.85 ? "legendary" : rarityRoll < 0.98 ? "mythic" : "mythic_shiny");
        const aLv = Math.max(pick.minLv, Math.min(700, leaderLv + Math.floor(Math.random() * 40) - 10));
        pet = makePet(sp, aLv, aRarity);
        lv = aLv;
      }
      // ✦ MTC — Míticos Brilhantes (Lv 500-1000)
      // Aparecem em qualquer mapa quando o líder tem Lv >= 500.
      // Todos rarity "mythic_shiny". Só capturáveis com ULTRA BALL.
      // Chance de captura ~1.7% por ultra (média ~60 tentativas, cauda pode passar de 200).
      const MTC_MONS: Species[] = [
        "abomasnow","cloyster","cloyster_shiny","exeggutor","exeggutor_shiny",
        "feraligatr","heracross","heracross_shiny","hitmonchan_shiny",
        "kangaskhan","meganium","meganium_shiny","moltres_shiny","onix_shiny",
      ];
      let isMtcBoss = false;
      if (!isApex && !isMythicRoamer && !isDialgaEvent && !isRider && !isGuardian && leaderLv >= 500) {
        // ~1% dos spawns em Lv 500+; sobe levemente com o nível do líder
        const chance = Math.min(0.008, 0.003 + (leaderLv - 500) * 0.000008);
        if (Math.random() < chance) {
          isMtcBoss = true;
          sp = MTC_MONS[Math.floor(Math.random() * MTC_MONS.length)];
          lv = 500 + Math.floor(Math.random() * 501); // 500..1000
          pet = makePet(sp, lv, "mythic_shiny");
          setTimeout(() => pushChat(`✦ Um MÍTICO BRILHANTE surgiu! (${sp.replace(/_/g," ").toUpperCase()} Lv ${lv}) — só Ultra Ball funciona.`, "cap"), 60);
        }
      }
      // 💀 PERIGO ABISSAL — criatura mítica não identificada. Aparece 1x por mapa
      // a cada ~1h. Nível 500-900, HP monstruoso, dá crítico devastador (3-hit-kill).
      // Não tem aggro, não foge. Ao ser atacada com pokébola vira agressiva.
      // Impossível de capturar.
      const MENACE_INTERVAL_MS = 55 * 60 * 1000;
      const menaceOnMap = enemies.some((en) => en.menace);
      let isMenace = false;
      try {
        const last = Number(localStorage.getItem("menace_last_spawn_ms") || 0);
        if (!menaceOnMap && !isMythicRoamer && !isDialgaEvent && !isRider && !isGuardian && !isApex
            && leaderLv >= 400
            && Date.now() - last >= MENACE_INTERVAL_MS
            && Math.random() < 0.015) {
          isMenace = true;
          localStorage.setItem("menace_last_spawn_ms", String(Date.now()));
          setTimeout(() => pushChat(`💀 UMA PRESENÇA ABISSAL NÃO IDENTIFICADA SURGIU NO MAPA... TENHA CUIDADO!`, "cap"), 100);
        }
      } catch {}
      if (isMenace) {
        const MENACE_POOL: Species[] = ["tyranitar","gengar","machamp","gyarados","nidoking_shiny","groudon","krookodile","infernape"];
        const filtered = MENACE_POOL.filter(hasGif);
        sp = (filtered.length ? filtered : MENACE_POOL)[Math.floor(Math.random() * (filtered.length || MENACE_POOL.length))];
        lv = 500 + Math.floor(Math.random() * 401); // 500..900
        pet = makePet(sp, lv, "mythic_shiny");
      }
      const baseHp = calcIdleMaxHp(pet);
      const highHp = highLevelEnemyHpMult(lv, leaderLv);
      const roamerHpMult = isMythicRoamer ? 6 : isDialgaEvent ? 12 : 1;
      const guardianHpMult = isGuardian ? 2.2 : 1;
      const apexHpMult = isApex ? 4.5 : 1;
      const menaceHpMult = isMenace ? 18 : 1;
      const mythEventHpMult = isMythShinyEvent ? 3.5 : 1;
      // 🏰 Ginásio Medieval — HP muito maior por andar (endgame).
      const gymFloorHere = GYM_FLOOR_BY_ID[idle.currentMap];
      const gymHpMult = gymFloorHere ? gymFloorHere.hpMult : 1;
      const hp = Math.floor(baseHp * (elite ? 1.6 : 1) * (isRider ? 2.6 : 1) * roamerHpMult * highHp * guardianHpMult * apexHpMult * menaceHpMult * mythEventHpMult * gymHpMult);
      const isAggro = isMenace ? false : true; // menace começa passivo
      // IA mais inteligente no Ginásio: percebe o treinador de muito mais longe.
      const aggroR = gymFloorHere ? (gymFloorHere.id === "gym_arcano" ? 900 : gymFloorHere.id === "gym_gelo_sombra" ? 720 : 560)
        : elite ? 300 : isApex ? 360 : isMythShinyEvent ? 480 : 220 + Math.floor(Math.random() * 60);

      // 🎭 Camuflagem do Ditto — se transforma em outra espécie até levar o primeiro hit
      let disguise: Species | undefined = undefined;
      if (isGuardian && (sp === "ditto" || sp === "ditto_shiny")) {
        const DISGUISE_POOL: Species[] = [
          "rattata_f","pidgeotto","oddish","bellsprout","zubat","weedle",
          "paras","meowth","psyduck","poliwag","abra",
          "diglett","cubone","nidoran_f","sandshrew","clefairy","growlithe",
        ];
        disguise = DISGUISE_POOL[Math.floor(Math.random() * DISGUISE_POOL.length)];
      }

      // 🏷️ TÍTULO DE XP — a partir do Lv 5.000 de treinador, alguns selvagens
      // nascem com o título "XP" acima da cabeça e valem 2x de experiência.
      const xpTitle = (idle.trainerLevel ?? 1) >= 5000 && Math.random() < 0.12;
      return { sp, hp, maxHp: hp, id: enemyIdRef.current++, x, y, face: "left", aggressive: isAggro, aggroR, elite, level: lv, rarity: pet.rarity, xpTitle, rider: isRider, guardian: isGuardian || isApex || isDialgaEvent, apex: isApex || isDialgaEvent, eventLegendary: isMythicRoamer || isDialgaEvent || isMenace || isMythShinyEvent || isMtcBoss, disguise, revealed: false, menace: isMenace, mtcBoss: isMtcBoss };


    }
    return null;
  }

  // Alvo total de inimigos no mapa (top-up lento cuida do resto)
  const ENEMY_TARGET = idle.currentMap === "grass_oddish" ? 32 : 16;

  function spawnEnemies(): Enemy[] {
    // Só spawna alguns de imediato — o resto entra aos poucos (setInterval abaixo)
    const isGrassOddish = idle.currentMap === "grass_oddish";
    const initial = isGrassOddish ? 18 + Math.floor(Math.random() * 5) : 6 + Math.floor(Math.random() * 3); // Grass Oddish: 18-22, outros: 6-8
    const placed: { x: number; y: number }[] = [];
    const arr: Enemy[] = [];
    while (arr.length < initial) {
      const e = spawnOneEnemy(placed);
      if (!e) break;
      arr.push(e);
    }
    const rareOnes = arr.filter((e) => e.rarity === "legendary" || e.rarity === "mythic" || e.rarity === "mythic_shiny");
    for (const r of rareOnes) {
      const label = r.rarity === "mythic_shiny" ? "MÍTICO SHINY" : r.rarity.toUpperCase();
      const color = r.rarity === "mythic_shiny" ? "#ffd94d" : r.rarity === "mythic" ? "#ff5252" : "#ff8b3d";
      pushEvent("★", `${label} À VISTA!`, `${r.sp.replace(/_/g, " ").toUpperCase()} apareceu no mapa`, color);
      
    }
    return arr;
  }

  function pushFxAt(x: number, y: number, text: string, kind: FxKind) {
    const id = fxIdRef.current++;
    setFx((prev) => [...prev, { id, x, y, text, kind }]);
    const ttl = kind === "crit" ? 1900 : kind === "myDmg" || kind === "enemyDmg" ? 1500 : 1200;
    setTimeout(() => setFx((prev) => prev.filter((f) => f.id !== id)), ttl);
  }



  const activeTime = now - idle.startedAt;
  const rawMap = IDLE_MAPS[idle.currentMap];
  // Grass Oddish rotaciona 3 backgrounds a cada 4 min pra ampliar a área do evento
  const grassOddishBg2 = assetUrlFromJson(mapGrassOddish2Asset);
  const grassOddishBg3 = assetUrlFromJson(mapGrassOddish3Asset);
  const map = idle.currentMap === "grass_oddish"
    ? { ...rawMap, bg: (() => {
        const idx = Math.floor(now / (4 * 60 * 1000)) % 3;
        return idx === 0 ? rawMap.bg : idx === 1 ? grassOddishBg2 : grassOddishBg3;
      })() }
    : rawMap;
  const visibleBuildings = BUILDINGS;
  const viewportBg = idle.currentMap === "caverna" ? "#1f2028" : "#1a3d1a";

  const collect = () => {
    setIdle((s) => {
      const gold = Math.floor(s.pending.gold);
      const rubies = Math.floor(s.pending.rubies);
      const crystals = Math.floor(s.pending.crystals);
      const redshards = Math.floor(s.pending.redshards ?? 0);
      try {
        const raw = localStorage.getItem("rubym.save.v2");
        if (raw) {
          const save = JSON.parse(raw);
          save.gold = (save.gold ?? 0) + gold;
          save.rubies = (save.rubies ?? 0) + rubies;
          save.crystals = (save.crystals ?? 0) + crystals;
          localStorage.setItem("rubym.save.v2", JSON.stringify(save));
        }
      } catch { /* ignore */ }
      pushFxAt(trainerPos.x, trainerPos.y - 60, `+${gold} ouro · +${crystals} 💎${redshards > 0 ? ` · +${redshards} 🔻` : ""}`, "gold");
      return {
        ...s,
        pending: { gold: 0, rubies: 0, crystals: 0, redshards: 0 },
        bank: { gold: s.bank.gold + gold, crystals: s.bank.crystals + crystals },
        items: redshards > 0
          ? { ...s.items, fragmento_vermelho: (s.items?.fragmento_vermelho ?? 0) + redshards }
          : s.items,
      };
    });
  };

  const claimTask = (tid: string) => {
    setIdle((s) => {
      const t = s.tasks.find((x) => x.id === tid);
      if (!t || !t.done) return s;
      return {
        ...s,
        tasks: s.tasks.filter((x) => x.id !== tid),
        bank: { ...s.bank, crystals: s.bank.crystals + t.reward },
      };
    });
  };

  // ===== Loja =====
  const buyBall = (b: ShopBall, qty: number = 1) => {
    const n = Math.max(1, Math.floor(qty || 1));
    setIdle((s) => {
      const totalCost = b.price * n;
      if (s.bank.gold < totalCost) {
        pushChat(`Ouro insuficiente para ${n}× ${b.name} (precisa ${totalCost}).`, "info");
        return s;
      }
      pushFxAt(trainerPos.x, trainerPos.y - 40, `+${n} ${b.name}`, "capture");
      pushChat(`Comprou ${n}× ${b.name} por ${totalCost} ouro.`, "cap");
      return {
        ...s,
        bank: { ...s.bank, gold: s.bank.gold - totalCost },
        items: { ...s.items, [b.id]: (s.items[b.id] ?? 0) + n },
      };
    });
  };
  // Pergaminho de Teleporte — 100 💎 por unidade. Consumido para teleporte instantâneo no mapa mundi.
  const buyTeleportScroll = (qty: number = 1) => {
    const n = Math.max(1, Math.floor(qty || 1));
    setIdle((s) => {
      const COST = 100 * n;
      if (s.bank.crystals < COST) { pushChat(`Cristais insuficientes (precisa ${COST} 💎).`, "info"); return s; }
      pushFxAt(trainerPos.x, trainerPos.y - 40, `+${n} Pergaminho de Teleporte`, "capture");
      pushChat(`Comprou ${n}× Pergaminho de Teleporte por ${COST} 💎.`, "cap");
      return {
        ...s,
        bank: { ...s.bank, crystals: s.bank.crystals - COST },
        items: { ...s.items, scroll_teleport: (s.items.scroll_teleport ?? 0) + n },
      };
    });
  };
  // Bundle de Ultra Ball pago em cristais: 1000 💎 = 20 unidades
  const buyUltraBundle = (qty: number = 1) => {
    const n = Math.max(1, Math.floor(qty || 1));
    setIdle((s) => {
      const COST = 2000 * n;
      const QTY = 20 * n;
      if (s.bank.crystals < COST) {
        pushChat(`Cristais insuficientes (precisa ${COST} 💎).`, "info");
        return s;
      }
      pushFxAt(trainerPos.x, trainerPos.y - 40, `+${QTY} Ultra Ball`, "capture");
      pushChat(`Comprou ${QTY} Ultra Ball por ${COST} 💎.`, "cap");
      return {
        ...s,
        bank: { ...s.bank, crystals: s.bank.crystals - COST },
        items: { ...s.items, ultraball: (s.items.ultraball ?? 0) + QTY },
      };
    });
  };
  // ===== Carteira: câmbio ouro ↔ cristal =====
  // 1 💎 = 1000 ouro (compra); vende 1 💎 por 800 ouro (spread do câmbio)
  const exchange = (dir: "g2c" | "c2g", amount: number) => {
    if (!Number.isFinite(amount) || amount <= 0) return;
    setIdle((s) => {
      if (dir === "g2c") {
        const cost = 1000 * amount;
        if (s.bank.gold < cost) { pushChat(`Ouro insuficiente para ${amount} 💎.`, "info"); return s; }
        pushChat(`Câmbio: −${cost} ouro → +${amount} 💎`, "cap");
        return { ...s, bank: { ...s.bank, gold: s.bank.gold - cost, crystals: s.bank.crystals + amount } };
      } else {
        if (s.bank.crystals < amount) { pushChat(`Cristais insuficientes.`, "info"); return s; }
        const gain = 800 * amount;
        pushChat(`Câmbio: −${amount} 💎 → +${gain} ouro`, "cap");
        return { ...s, bank: { ...s.bank, crystals: s.bank.crystals - amount, gold: s.bank.gold + gain } };
      }
    });
  };
  // ===== Mercado: vender itens da mochila por ouro =====
  const MARKET_SELL_PRICE: Record<string, number> = {
    pokeball: 200, greatball: 1800, ultraball: 3500,
    chest_amulet: 900, potion: 40,
    berry: 60, revive: 300, key: 500,
    incenso_mel: 2500, incenso_mel_raro: 9000,
    // Stones elementais — valem bastante ouro (também alimentam ovos Black Mítico)
    stone_grass: 12000, stone_fire: 12000, stone_water: 12000,
    stone_electric: 12000, stone_dark: 15000, stone_dragon: 18000,
  };
  // ===== Mercado P2P (Supabase) =====
  const isVip = () => {
    const until = idle.buffs?.goldMultUntil ?? 0;
    return until > Date.now();
  };
  const listMarketItem = async (itemId: string, qty: number, price: number, currency: "gold" | "crystal" | "safira" = "gold"): Promise<boolean> => {
    if (!identity?.id) { pushChat("Faça login para anunciar.", "info"); return false; }
    if (!isVip()) { pushChat("✦ Anunciar no mercado é exclusivo VIP. Use um Livro VIP na Loja.", "info"); return false; }
    const have = idleRef.current.items?.[itemId] ?? 0;
    if (have < qty) { pushChat("Estoque insuficiente para anunciar.", "info"); return false; }
    if (qty < 1 || price < 1 || price > 100_000_000) { pushChat("Quantidade ou preço inválido.", "info"); return false; }
    // Confirma criação com .select().single() — se o insert falhar por RLS/check,
    // detectamos ANTES de descontar o estoque local. Se retornar row, é seguro debitar.
    const { data, error } = await (supabase
      .from("market_listings") as any)
      .insert({
        seller_id: identity.id,
        seller_name: identity.name || "Treinador",
        kind: "item",
        item_id: itemId,
        qty,
        price,
        currency,
      })
      .select("id")
      .single();
    if (error || !data?.id) {
      console.error("[market] insert error", error, { itemId, qty, price, currency });
      pushChat(`Falha ao anunciar: ${error?.message ?? "resposta vazia — nada foi descontado"}`, "info");
      return false;
    }
    // remove item do estoque local (custódia do anúncio) — só APÓS confirmação da linha
    setIdle((s) => ({ ...s, items: { ...s.items, [itemId]: Math.max(0, (s.items[itemId] ?? 0) - qty) } }));
    const curLabel = currency === "gold" ? "ouro" : currency === "crystal" ? "💎 cristais" : "💚 safiras";
    pushChat(`📢 Anúncio criado: ${qty}x ${itemId} por ${price} ${curLabel}. (id ${data.id.slice(0, 8)})`, "cap");
    return true;
  };
  const buyMarketListing = async (listing: { id: string; seller_id: string; item_id: string; qty: number; price: number; currency?: "gold" | "crystal" | "safira" }): Promise<boolean> => {
    if (!identity?.id) { pushChat("Faça login para comprar.", "info"); return false; }
    if (listing.seller_id === identity.id) { pushChat("Você não pode comprar seu próprio anúncio.", "info"); return false; }
    const cur = listing.currency ?? "gold";
    // usa idleRef pra evitar closure stale entre cliques rápidos
    const cur_state = idleRef.current;
    if (cur === "gold" && cur_state.bank.gold < listing.price) { pushChat("Ouro insuficiente.", "info"); return false; }
    if (cur === "crystal" && cur_state.bank.crystals < listing.price) { pushChat("💎 Cristais insuficientes.", "info"); return false; }
    if (cur === "safira" && (cur_state.items?.safira_verde ?? 0) < listing.price) { pushChat("💚 Safiras insuficientes.", "info"); return false; }
    // Usa count em vez de .select().maybeSingle() — a policy de SELECT
    // pode filtrar a linha após sold_at deixar de ser null e retornar data=null
    // mesmo com o UPDATE tendo funcionado.
    const { error, count } = await (supabase
      .from("market_listings") as any)
      .update(
        { buyer_id: identity.id, sold_at: new Date().toISOString() },
        { count: "exact" }
      )
      .eq("id", listing.id)
      .is("sold_at", null);
    if (error) { console.error("[market] buy error", error, listing); pushChat(`Falha ao comprar: ${error.message}`, "info"); return false; }
    if (!count) { pushChat("Anúncio não está mais disponível.", "info"); return false; }
    // Rechecagem atômica dentro do setIdle — evita débito duplicado se a UI dispararbuy 2x em paralelo
    let insufficient = false;
    setIdle((s) => {
      const bank = { ...s.bank };
      const items = { ...s.items };
      if (cur === "gold") {
        if (bank.gold < listing.price) { insufficient = true; return s; }
        bank.gold -= listing.price;
      } else if (cur === "crystal") {
        if (bank.crystals < listing.price) { insufficient = true; return s; }
        bank.crystals -= listing.price;
      } else {
        const sv = s.items?.safira_verde ?? 0;
        if (sv < listing.price) { insufficient = true; return s; }
        items.safira_verde = sv - listing.price;
      }
      items[listing.item_id] = (s.items[listing.item_id] ?? 0) + listing.qty;
      return { ...s, bank, items };
    });
    if (insufficient) { pushChat("Saldo mudou — compra abortada, ninguém foi cobrado indevidamente.", "info"); return false; }
    const curLabel = cur === "gold" ? "ouro" : cur === "crystal" ? "💎 cristais" : "💚 safiras";
    pushChat(`🛒 Comprou ${listing.qty}x ${listing.item_id} por ${listing.price} ${curLabel}.`, "cap");
    // força persistência imediata da compra (item + débito) — evita perder no F5
    void pushCloudSaveNow({ idle: idleRef.current, team: teamRef.current, restingBench, savedAt: Date.now() });
    return true;
  };

  // Vendedor coleta o pagamento após alguém comprar seu anúncio.
  // Marca payout_claimed=true atomicamente e credita a moeda no vendedor.
  const claimMarketPayout = async (listing: { id: string; item_id: string; qty: number; price: number; currency?: "gold" | "crystal" | "safira" }): Promise<boolean> => {
    if (!identity?.id) return false;
    const cur = listing.currency ?? "gold";
    const { error, count } = await (supabase as any)
      .from("market_listings")
      .update({ payout_claimed: true }, { count: "exact" })
      .eq("id", listing.id)
      .eq("seller_id", identity.id)
      .eq("payout_claimed", false)
      .not("sold_at", "is", null);
    if (error) { pushChat(`Falha ao coletar: ${error.message}`, "info"); return false; }
    if (!count) { pushChat("Este pagamento já foi coletado.", "info"); return false; }
    setIdle((s) => {
      if (cur === "gold")    return { ...s, bank: { ...s.bank, gold: s.bank.gold + listing.price } };
      if (cur === "crystal") return { ...s, bank: { ...s.bank, crystals: s.bank.crystals + listing.price } };
      return { ...s, items: { ...s.items, safira_verde: (s.items?.safira_verde ?? 0) + listing.price } };
    });
    const curLabel = cur === "gold" ? "ouro" : cur === "crystal" ? "💎 cristais" : "💚 safiras";
    pushChat(`💰 Recebeu ${listing.price} ${curLabel} pela venda de ${listing.qty}x ${listing.item_id}.`, "cap");
    void pushCloudSaveNow({ idle: idleRef.current, team: teamRef.current, restingBench, savedAt: Date.now() });
    return true;
  };

  const cancelMarketListing = async (listing: { id: string; item_id: string; qty: number; seller_id: string }): Promise<boolean> => {
    if (identity?.id !== listing.seller_id) return false;
    const { error } = await supabase.from("market_listings").delete().eq("id", listing.id).is("sold_at", null);
    if (error) { pushChat(`Falha ao cancelar: ${error.message}`, "info"); return false; }
    setIdle((s) => ({ ...s, items: { ...s.items, [listing.item_id]: (s.items[listing.item_id] ?? 0) + listing.qty } }));
    pushChat(`Anúncio cancelado — ${listing.qty}x ${listing.item_id} devolvido.`, "info");
    return true;
  };


  // Stones — venda alternativa por Cristal e por Safira Verde
  // Regra pedida: 1000 stones = 500 safiras (2:1). Cristal: preço por unidade.
  const STONE_IDS = ["stone_grass","stone_fire","stone_water","stone_electric","stone_dark","stone_dragon"] as const;
  const STONE_CRYSTAL_PRICE: Record<string, number> = {
    stone_grass: 10, stone_fire: 10, stone_water: 10,
    stone_electric: 10, stone_dark: 15, stone_dragon: 20,
  };
  // Sell 250 stones → 2 safiras
  const STONE_SAFIRA_BATCH = 250;
  const STONE_SAFIRA_PER_BATCH = 2;


  const sellItem = (id: string, qty = 1, currency: "gold" | "crystal" | "safira" = "gold") => {
    setIdle((s) => {
      const have = s.items[id] ?? 0;
      if (have < qty) { pushChat(`Você não tem ${qty}x ${id}.`, "info"); return s; }
      if (currency === "crystal") {
        const unit = STONE_CRYSTAL_PRICE[id] ?? 0;
        if (unit <= 0) { pushChat(`Este item não é vendável por cristal.`, "info"); return s; }
        const gain = unit * qty;
        pushChat(`Vendeu ${qty}x ${id} por ${gain} 💎 cristais.`, "cap");
        return {
          ...s,
          bank: { ...s.bank, crystals: s.bank.crystals + gain },
          items: { ...s.items, [id]: have - qty },
        };
      }
      if (currency === "safira") {
        if (!STONE_IDS.includes(id as (typeof STONE_IDS)[number])) {
          pushChat(`Este item não é vendável por safira.`, "info"); return s;
        }
        const batches = Math.floor(qty / STONE_SAFIRA_BATCH);
        if (batches <= 0) { pushChat(`Precisa de ao menos ${STONE_SAFIRA_BATCH}x para vender por safira.`, "info"); return s; }
        const cost = batches * STONE_SAFIRA_BATCH;
        const gain = batches * STONE_SAFIRA_PER_BATCH;
        pushChat(`Vendeu ${cost}x ${id} por ${gain} 💚 Safira Verde.`, "cap");
        return {
          ...s,
          items: { ...s.items, [id]: have - cost, safira_verde: (s.items?.safira_verde ?? 0) + gain },
        };
      }
      const unit = MARKET_SELL_PRICE[id] ?? 0;
      if (unit <= 0) { pushChat(`Este item não é vendável.`, "info"); return s; }
      const gain = unit * qty;
      pushChat(`Vendeu ${qty}x ${id} por ${gain} ouro.`, "cap");
      return {
        ...s,
        bank: { ...s.bank, gold: s.bank.gold + gain },
        items: { ...s.items, [id]: have - qty },
      };
    });
  };

  const buyPotion = (qty = 1) => {
    setIdle((s) => {
      const cost = POTION_PRICE * qty;
      if (s.bank.gold < cost) { pushChat(`Ouro insuficiente para ${qty} Poção.`, "info"); return s; }
      pushChat(`Comprou ${qty} Poção por ${cost} ouro.`, "cap");
      return {
        ...s,
        bank: { ...s.bank, gold: s.bank.gold - cost },
        items: { ...s.items, potion: (s.items.potion ?? 0) + qty },
      };
    });
  };
  const buyBook = (bk: ShopBook, qty: number = 1) => {
    const n = Math.max(1, Math.floor(qty || 1));
    setIdle((s) => {
      const useGold = bk.currency === "gold";
      const totalPrice = bk.price * n;
      const totalGoldExtra = (bk.priceGold ?? 0) * n;
      const have = useGold ? s.bank.gold : s.bank.crystals;
      if (have < totalPrice) {
        pushChat(useGold ? `Ouro insuficiente para ${n}× ${bk.name}.` : `Cristais insuficientes para ${n}× ${bk.name}.`, "info");
        return s;
      }
      if (totalGoldExtra && s.bank.gold < totalGoldExtra) {
        pushChat(`Ouro insuficiente para ${n}× ${bk.name} (custa ${bk.priceGold} 🪙 + ${bk.price} 💎 cada).`, "info");
        return s;
      }
      const curQty = s.items[bk.id] ?? 0;
      pushChat(`Comprou ${n}× ${bk.name}. Use pela Mochila quando quiser.`, "cap");
      const bank0 = useGold
        ? { ...s.bank, gold: s.bank.gold - totalPrice }
        : { ...s.bank, crystals: s.bank.crystals - totalPrice };
      const bank1 = totalGoldExtra ? { ...bank0, gold: bank0.gold - totalGoldExtra } : bank0;
      return { ...s, bank: bank1, items: { ...s.items, [bk.id]: curQty + n } };
    });
  };


  // ===== Trocador NPC — Incubadora de Orbs =====
  // Precisa de 5 Pokémon da raridade escolhida. Combustível (COMUM/INCOMUM/RARO)
  // extra (até MAX_FUEL) aumenta chance de sucesso e sorte.
  // O Orb Supremo exige possuir ao menos 1 Orb Maior no inventário.
  type FuelRarity = "common" | "uncommon" | "rare";
  const FUEL_TIERS: Record<FuelRarity, { boost: number; lucky: number; color: string; label: string }> = {
    common:   { boost: 0.05, lucky: 0.02, color: "#8ae28a", label: "COMUM" },
    uncommon: { boost: 0.09, lucky: 0.04, color: "#5cd3ff", label: "INCOMUM" },
    rare:     { boost: 0.14, lucky: 0.06, color: "#c084fc", label: "RARO" },
  };
  type OrbForgeId = "orb_xp_minor" | "orb_xp_major" | "orb_xp_supreme" | "orb_team";
  const ORB_TRADES: { orbId: OrbForgeId; label: string; rarity: Rarity; count: number; color: string; img: string; desc: string; baseSuccess: number; upgradeTo?: OrbForgeId; requires?: { itemId: string; qty: number; label: string } }[] = [
    { orbId: "orb_xp_minor",   label: "Orb Menor ✦",     rarity: "common",    count: 5, color: "#8ae28a", img: orbXpMinorUrl,   desc: "Entregue 5 Pokémon COMUNS · chance base baixa",           baseSuccess: 0.35, upgradeTo: "orb_xp_major" },
    { orbId: "orb_xp_minor",   label: "Orb Menor+ ✦",    rarity: "uncommon",  count: 5, color: "#5cd3ff", img: orbXpMinorUrl,   desc: "Entregue 5 Pokémon INCOMUNS · maior chance",              baseSuccess: 0.50, upgradeTo: "orb_xp_major" },
    { orbId: "orb_xp_major",   label: "Orb Maior ✦✦",   rarity: "rare",      count: 5, color: "#c084fc", img: orbXpMajorUrl,   desc: "Entregue 5 Pokémon RAROS · combustível aumenta chance",  baseSuccess: 0.65, upgradeTo: "orb_xp_supreme" },
    { orbId: "orb_xp_supreme", label: "Orb Supremo ✦✦✦", rarity: "epic",      count: 5, color: "#ffd94d", img: orbXpSupremeUrl, desc: "Entregue 5 Pokémon ÉPICOS · combustível aumenta chance", baseSuccess: 0.75, upgradeTo: "orb_team", requires: { itemId: "orb_xp_major", qty: 1, label: "Orb Maior" } },
    { orbId: "orb_team",       label: "Orb de Time ✦✦✦", rarity: "legendary", count: 3, color: "#ff9adf", img: orbXpTeamUrl,    desc: "Entregue 3 Pokémon LENDÁRIOS · alta chance de sucesso",   baseSuccess: 0.85 },
    { orbId: "orb_team",       label: "Orb de Time ✦✦✦", rarity: "mythic",    count: 2, color: "#ff6bd6", img: orbXpTeamUrl,    desc: "Entregue 2 Pokémon MÍTICOS · quase garantido",             baseSuccess: 0.95 },
  ];
  // Estado do NPC Trocador no mapa (modal na tela do mundo)
  const [worldTraderOpen, setWorldTraderOpen] = useState(false);
  const [worldTraderPick, setWorldTraderPick] = useState<null | typeof ORB_TRADES[number]>(null);
  const [worldTraderSel, setWorldTraderSel] = useState<Set<string>>(new Set());
  const [worldTraderFuel, setWorldTraderFuel] = useState<Set<string>>(new Set());
  const [worldTraderFuelTab, setWorldTraderFuelTab] = useState<FuelRarity>("common");
  const [orbAnim, setOrbAnim] = useState<null | { phase: "spinning" | "success" | "fail"; orbId?: string; extraHours?: number; lucky?: boolean; color: string; label: string; img?: string }>(null);
  const MAX_FUEL = 5;
  const LUCKY_BASE = 0.05;

  const getFuelBreakdown = (fuelUids: Set<string> | string[]): Record<FuelRarity, number> => {
    const uidArr = fuelUids instanceof Set ? Array.from(fuelUids) : fuelUids;
    const col = idle.collection ?? [];
    const out: Record<FuelRarity, number> = { common: 0, uncommon: 0, rare: 0 };
    for (const uid of uidArr) {
      const c = col.find((x) => x.uid === uid);
      if (!c) continue;
      if (c.rarity === "common" || c.rarity === "uncommon" || c.rarity === "rare") out[c.rarity]++;
    }
    return out;
  };

  const computeOrbChances = (pick: { baseSuccess: number }, breakdown: Record<FuelRarity, number>) => {
    const totalBoost = breakdown.common * FUEL_TIERS.common.boost + breakdown.uncommon * FUEL_TIERS.uncommon.boost + breakdown.rare * FUEL_TIERS.rare.boost;
    const totalLucky = breakdown.common * FUEL_TIERS.common.lucky + breakdown.uncommon * FUEL_TIERS.uncommon.lucky + breakdown.rare * FUEL_TIERS.rare.lucky;
    const success = Math.min(0.95, pick.baseSuccess + totalBoost);
    const lucky = Math.min(0.50, LUCKY_BASE + totalLucky);
    return { success, lucky };
  };

  const tradeForOrb = (orbId: OrbForgeId, uids: string[], fuelUids: string[], rarity?: Rarity) => {
    // Multi-tier orbs share the same item id; always resolve the recipe by the explicit UI rarity.
    const normalizeForgeRarity = (r?: Rarity): Rarity | undefined => (r === "mythic_shiny" ? "mythic" : r);
    let inferred: Rarity | undefined = normalizeForgeRarity(rarity);
    if (!inferred) {
      const col0 = idle.collection ?? [];
      for (const u of uids) {
        const c = col0.find((x) => x.uid === u);
        if (c) { inferred = normalizeForgeRarity(c.rarity); break; }
      }
    }
    const trade = ORB_TRADES.find((t) => t.orbId === orbId && (!inferred || t.rarity === inferred))
      ?? ORB_TRADES.find((t) => t.orbId === orbId);
    if (!trade) return;

    if (trade.requires && (idle.items[trade.requires.itemId] ?? 0) < trade.requires.qty) {
      pushChat(`Você precisa de ${trade.requires.qty}× ${trade.requires.label} no inventário para forjar o ${trade.label}.`, "info");
      return;
    }
    const uniqUids = Array.from(new Set(uids));
    const uniqFuel = Array.from(new Set(fuelUids)).filter((u) => !uniqUids.includes(u));
    const teamUids = new Set((teamRef.current ?? []).map((p) => p.uid));
    const benchUids = new Set((benchRef.current ?? []).map((p) => p.uid));
    const blocked = [...uniqUids, ...uniqFuel].filter((u) => teamUids.has(u) || benchUids.has(u));
    if (blocked.length > 0) {
      pushChat("Retire os Pokémon do time/reserva antes de trocar por Orb.", "info");
      return;
    }

    // Leitura pura do estado atual (sem efeitos colaterais dentro do updater)
    const col = idle.collection ?? [];
    const selected = col.filter((c) => uniqUids.includes(c.uid) && (c.rarity === trade.rarity || (trade.rarity === "mythic" && c.rarity === "mythic_shiny")));
    const fuelSel = col
      .filter((c) => uniqFuel.includes(c.uid) && (c.rarity === "common" || c.rarity === "uncommon" || c.rarity === "rare") && c.rarity !== trade.rarity)
      .slice(0, MAX_FUEL);
    if (selected.length !== trade.count) {
      pushChat(`Precisa exatamente ${trade.count} Pokémon ${trade.rarity.toUpperCase()} fora do time.`, "info");
      return;
    }
    const breakdown: Record<FuelRarity, number> = { common: 0, uncommon: 0, rare: 0 };
    for (const f of fuelSel) { if (f.rarity === "common" || f.rarity === "uncommon" || f.rarity === "rare") breakdown[f.rarity]++; }
    const fuelCount = fuelSel.length;
    const { success, lucky } = computeOrbChances(trade, breakdown);
    const removeSet = new Set([...selected.map((c) => c.uid), ...fuelSel.map((c) => c.uid)]);
    removeSet.forEach((u) => consumedUidsRef.current.add(u));

    const didSucceed = Math.random() < success;
    const didLucky = didSucceed && Math.random() < lucky;

    // 1) Consome os pokémons imediatamente (updater puro)
    setIdle((s) => ({ ...s, collection: (s.collection ?? []).filter((c) => !removeSet.has(c.uid)) }));

    // 2) Dispara animação (fora do updater)
    setOrbAnim({ phase: "spinning", color: trade.color, label: trade.label, img: trade.img });

    // 3) Resolve após animação
    window.setTimeout(() => {
      if (!didSucceed) {
        setOrbAnim({ phase: "fail", color: trade.color, label: trade.label });
        pushChat(`💥 A incubação FALHOU — ${trade.count} ${trade.rarity.toUpperCase()}${fuelCount ? ` + ${fuelCount} de combustível` : ""} perdidos.`, "info");
        return;
      }
      let finalOrbId: string = trade.orbId;
      let extraHours = 0;
      let luckyKind: "upgrade" | "time" | null = null;
      if (didLucky) {
        if (trade.upgradeTo && Math.random() < 0.5) {
          finalOrbId = trade.upgradeTo;
          luckyKind = "upgrade";
        } else {
          extraHours = 1 + Math.floor(Math.random() * 2);
          luckyKind = "time";
        }
      }
      const orbName = finalOrbId === "orb_xp_minor" ? "Orb Menor ✦" : finalOrbId === "orb_xp_major" ? "Orb Maior ✦✦" : finalOrbId === "orb_xp_supreme" ? "Orb Supremo ✦✦✦" : "Orb de Time ✦✦✦";
      const orbImg = finalOrbId === "orb_xp_minor" ? orbXpMinorUrl : finalOrbId === "orb_xp_major" ? orbXpMajorUrl : finalOrbId === "orb_xp_supreme" ? orbXpSupremeUrl : orbXpTeamUrl;
      setOrbAnim({ phase: "success", color: trade.color, label: orbName, img: orbImg, orbId: finalOrbId, extraHours, lucky: !!luckyKind });
      setIdle((s2) => {
        const items2 = { ...s2.items, [finalOrbId]: (s2.items[finalOrbId] ?? 0) + 1 };
        if (extraHours > 0) {
          (items2 as any)[`${finalOrbId}_extra`] = ((s2.items as any)[`${finalOrbId}_extra`] ?? 0) + extraHours;
        }
        return { ...s2, items: items2 };
      });
      if (luckyKind === "upgrade") pushChat(`🌟 SORTE! Orb evoluiu para ${orbName}!`, "cap");
      else if (luckyKind === "time") pushChat(`🌟 SORTE! ${orbName} com +${extraHours}h extras (aplicado ao ativar).`, "cap");
      else pushChat(`✦ NPC forjou 1 ${orbName}.`, "cap");
    }, 2200);
  };





  // ===== UPGRADE de Livros =====
  // Regras: junta livros iguais para forjar o próximo nível. Exige nível de treinador.
  const BOOK_UPGRADES: Record<string, { to: string; cost: number; trainerLv: number; label: string }> = {
    book_exp: { to: "book_exp_big", cost: 3, trainerLv: 10, label: "Livro EXP Raro" },
    book_exp_big: { to: "book_exp_max", cost: 3, trainerLv: 25, label: "Livro EXP Lendário" },
    book_vip: { to: "book_vip_30", cost: 5, trainerLv: 20, label: "Livro VIP 30d" },
    book_vip_30: { to: "book_vip_60", cost: 3, trainerLv: 40, label: "Livro VIP 60d" },
  };
  const upgradeBook = (id: string) => {
    const rule = BOOK_UPGRADES[id];
    if (!rule) { pushChat(`Este livro não pode ser melhorado.`, "info"); return; }
    setIdle((s) => {
      const trLv = s.trainerLevel ?? 1;
      if (trLv < rule.trainerLv) {
        pushChat(`Precisa ser Treinador Lv.${rule.trainerLv} para forjar ${rule.label}.`, "info");
        return s;
      }
      const have = s.items[id] ?? 0;
      if (have < rule.cost) {
        pushChat(`Precisa de ${rule.cost}× para forjar ${rule.label}.`, "info");
        return s;
      }
      pushChat(`⚒️ Forjou ${rule.label}! (-${rule.cost} usados)`, "cap");
      pushEvent("⚒️", "FORJA DE LIVRO", `${rule.label}`, "#8bffb0");
      return {
        ...s,
        items: {
          ...s.items,
          [id]: have - rule.cost,
          [rule.to]: (s.items[rule.to] ?? 0) + 1,
        },
      };
    });
  };


  const CHEST_AMULET_PRICE = 2500;
  const buyChestAmulet = () => {
    setIdle((s) => {
      if (s.bank.gold < CHEST_AMULET_PRICE) {
        pushChat(`Ouro insuficiente para Amuleto do Baú.`, "info");
        return s;
      }
      pushFxAt(trainerPos.x, trainerPos.y - 40, `+1 Amuleto do Baú`, "capture");
      pushChat(`Comprou 1 Amuleto do Baú — +1 baú aparece no mapa.`, "cap");
      return {
        ...s,
        bank: { ...s.bank, gold: s.bank.gold - CHEST_AMULET_PRICE },
        items: { ...s.items, chest_amulet: (s.items.chest_amulet ?? 0) + 1 },
      };
    });
  };


  // ===== Baús espalhados no mapa =====
  function spawnChests(count = 4): Chest[] {
    const arr: Chest[] = [];
    let tries = 0;
    while (arr.length < count && tries < 200) {
      tries++;
      const x = 140 + Math.random() * (WORLD_W - 280);
      const y = 140 + Math.random() * (WORLD_H - 280);
      if (Math.hypot(x - WORLD_W / 2, y - WORLD_H / 2) < 260) continue;
      if (collidesWithAny(x, y)) continue;
      let ok = true;
      for (const c of arr) if (Math.hypot(x - c.x, y - c.y) < 260) { ok = false; break; }
      if (!ok) continue;
      arr.push({ id: chestIdRef.current++, x, y, opened: false, purple: false });
    }
    return arr;
  }

  // alvo de baús no mapa (2 base + 1 por Amuleto do Baú comprado, máx 6)
  const chestTarget = Math.min(6, 5 + (idle.items?.chest_amulet ?? 0));

  // spawna baús no início; respawna a cada 10 min mantendo até `chestTarget` no mapa
  useEffect(() => {
    const initial = spawnChests(Math.min(chestTarget, 2));
    setChests(initial);
    const iv = setInterval(() => {
      setChests((prev) => {
        const remaining = prev.filter((c) => !c.opened || (Date.now() - (c.openedAt ?? 0) < 4000));
        const active = remaining.filter((c) => !c.opened);
        if (active.length >= chestTarget) return remaining;
        const news = spawnChests(1);
        if (news.length > 0) pushEvent("🎁", "NOVO BAÚ NO MAPA", "Aproxime-se para abrir", "#ffa64a");
        return [...remaining, ...news];
      });
    }, 10 * 60 * 1000);
    return () => { clearInterval(iv); };
  }, [chestTarget]); // eslint-disable-line


  // detecta proximidade e abre baú
  useEffect(() => {
    const iv = setInterval(() => {
      const openedRef: { c: Chest | null } = { c: null };
      setChests((prev) => {
        const next = prev.map((c) => {
          if (c.opened) return c;
          if (Math.hypot(c.x - trainerPos.x, c.y - trainerPos.y) < 46) {
            openedRef.c = c;
            return { ...c, opened: true, openedAt: Date.now() };
          }
          return c;
        });
        return next;
      });
      const oc = openedRef.c;
      if (oc) {
        // Abrir baú custa ~10s de energia do líder
        setTeam((tm) => {
          if (tm.length === 0) return tm;
          const l = tm[0];
          const drainSec = energyDrainPerSec(l.rarity);
          if (drainSec <= 0) return tm; // mítico não cansa
          const now = Date.now();
          const curE = petCurrentEnergy(l, now, { active: true });
          const drain = Math.max(1, Math.round(drainSec * 10));
          const newE = Math.max(0, curE - drain);
          return [{ ...l, energy: newE, energyRegenAt: now } as PetInstance, ...tm.slice(1)];
        });

        // Tabela de loot balanceada
        //  20% vazio  |  25% chave  |  20% pokébola  |  25% ouro  |  10% cristal
        const roll = Math.random();
        let gain = 0;
        let bonusCrystal = 0;
        let bonusBall = 0;
        let bonusKey = 0;
        let emptyDrop = false;
        if (roll < 0.20) {
          emptyDrop = true;
        } else if (roll < 0.45) {
          bonusKey = 1;
        } else if (roll < 0.65) {
          bonusBall = 1;
        } else if (roll < 0.90) {
          gain = 150 + Math.floor(Math.random() * 250);
        } else {
          bonusCrystal = 1;
        }
        const parts: string[] = [];
        if (emptyDrop) parts.push("vazio…");
        if (gain > 0) parts.push(`+${gain} ouro`);
        if (bonusCrystal) parts.push("+1 💎");
        if (bonusBall) parts.push("+1 Pokébola");
        if (bonusKey) parts.push("+1 🔑 Chave");
        pushFxAt(oc.x, oc.y - 50, parts.join(" · "), "gold");
        pushChat(`Baú aberto! ${parts.join(" · ")}`, "chest");
        playChestOpen();
        setIdle((s) => ({
          ...s,
          bank: { ...s.bank, gold: s.bank.gold + gain, crystals: s.bank.crystals + bonusCrystal },
          totals: { ...s.totals, gold: s.totals.gold + gain },
          items: {
            ...s.items,
            pokeball: (s.items.pokeball ?? 0) + bonusBall,
            chest_key: (s.items.chest_key ?? 0) + bonusKey,
          },
        }));
      }
    }, 300);
    return () => clearInterval(iv);
  }, [trainerPos.x, trainerPos.y, idle.items]); // eslint-disable-line

  // ---- Detecta proximidade dos prédios (Lab / Lar) ----
  useEffect(() => {
    let near: "lab" | "lar" | "azul" | "gym" | null = null;
    for (const b of BUILDINGS) {
      const dx = trainerPos.x - b.x;
      const dy = trainerPos.y - (b.y - b.h / 2);
      if (Math.hypot(dx, dy) < b.interactR) { near = b.key; break; }
    }
    setNearBuilding((cur) => (cur === near ? cur : near));
  }, [trainerPos.x, trainerPos.y, BUILDINGS]);



  // ===== pickStarter (starterChosen state está declarada no topo) =====

  const pickStarter = (sp: "charmander" | "bulbasaur" | "squirtle") => {
    const pet = makePet(sp, 5);
    setTeam([pet]);
    setLeaderHp(calcIdleMaxHp(pet));
    try {
      localStorage.setItem("rubym.starter.chosen", "1");
      const raw = localStorage.getItem("rubym.save.v2");
      const save = raw ? JSON.parse(raw) : {};
      save.party = [pet];
      localStorage.setItem("rubym.save.v2", JSON.stringify(save));
    } catch { /* ignore */ }
    setStarterChosen(true);
    pushChat(`Você escolheu ${sp.toUpperCase()} como seu Pokémon inicial!`, "cap");
  };

  // ===== Reset da conta (Laboratório) =====
  const resetAccount = () => {
    if (typeof window === "undefined") return;
    const ok = window.confirm(
      "⚠ Resetar conta?\n\nIsso vai APAGAR seu Pokémon, itens, ouro, cristais, coleção e todo progresso. Você vai escolher um novo inicial. Ação irreversível."
    );
    if (!ok) return;
    try {
      localStorage.removeItem("rubym.starter.chosen");
      localStorage.removeItem("rubym.idle.v1");
      localStorage.removeItem("rubym.save.v2");
    } catch { /* ignore */ }
    window.location.reload();
  };

  // ===== Descansar em casa =====
  // Lar: cura HP do time em 5s (grátis).
  // Casa Azul (rest coletivo): mantém 5 min curando HP+energia.
  const restAtHome = (kind: "lar" | "azul" = "lar") => {
    const l = team[0];
    if (!l) return;
    if (restingUntil) return;
    const now = Date.now();
    let dur = 5_000;
    let fullRecovery = false;
    if (kind === "azul") {
      dur = REST_DURATION_BLUE_MS;
      fullRecovery = true;
    }
    setRestingStart(now);
    setRestingUntil(now + dur);
    setRestingKind(kind);
    setRestFullRecovery(fullRecovery);
    setMoving(false);
    setNearBuilding(null);
    const label = kind === "azul"
      ? "🏡 Casa Azul (5 min)"
      : "🏠 Lar (5s — recuperando HP)";
    pushChat(`${label} — descansando... todo o time será curado.`, "info");
  };


  // ===== Casa Azul: coloca 1 Pokémon para restaurar energia =====
  // Modo pago: 5💎 -> 5 min. Modo grátis (auto): 1h.
  // Adianta um descanso em andamento gastando cristais
  const speedUpAzulRest = (uid: string) => {
    const now = Date.now();
    const save = (loadLatestValid<SaveShape>() ?? {}) as SaveShape;
    const party = save.party ?? team;
    const pet = party.find((p) => p.uid === uid) as PetEnergyExt | undefined;
    if (!pet || !pet.azulRestUntil || pet.azulRestUntil <= now) {
      pushChat(`Nada para adiantar.`, "info");
      return;
    }
    if (idle.bank.crystals < AZUL_REST_COST) {
      pushChat(`Cristais insuficientes (precisa ${AZUL_REST_COST}💎).`, "info");
      return;
    }
    const refreshed = { ...pet, energy: ENERGY_MAX, energyRegenAt: now, azulRestUntil: undefined, azulRestFromEnergy: undefined, azulRestTotalMs: undefined } as PetInstance;
    const newParty = (save.party ?? []).map((x) => x.uid === uid ? refreshed : x);
    saveNow({ ...save, party: newParty });
    setIdle((s) => ({ ...s, bank: { ...s.bank, crystals: s.bank.crystals - AZUL_REST_COST } }));
    setRestingBench((b) => b.filter((x) => x.uid !== uid));
    setTeam((tm) => {
      if (tm.some((x) => x.uid === uid)) return tm.map((x) => x.uid === uid ? refreshed : x);
      if (tm.length >= 6) return tm;
      const next = [...tm, refreshed];
      if (next.length === 1) setLeaderHp(calcIdleMaxHp(refreshed));
      return next;
    });
    pushChat(`⚡ ${pet.species.toUpperCase()} descansou instantaneamente (-${AZUL_REST_COST}💎)`, "info");
    pushEvent("⚡", "ADIANTADO", `${pet.species.toUpperCase()} pronto!`, "#4a9eff");
  };

  const restPetInAzul = (uid: string, opts?: { auto?: boolean }) => {
    const now = Date.now();
    const auto = !!opts?.auto;
    const usePaid = idle.bank.crystals >= AZUL_REST_COST;
    if (!auto && !usePaid) {
      pushChat(`Cristais insuficientes (precisa ${AZUL_REST_COST}💎).`, "info");
      return;
    }
    const dur = usePaid ? AZUL_REST_MS : AZUL_REST_FREE_MS;
    const save = (loadLatestValid<SaveShape>() ?? {}) as SaveShape;
    const party = save.party ?? team;
    const pet = party.find((p) => p.uid === uid);
    if (!pet) return;
    const p = pet as PetEnergyExt;
    if (p.azulRestUntil && p.azulRestUntil > now) {
      if (!auto) pushChat(`${pet.species.toUpperCase()} já está descansando.`, "info");
      return;
    }
    const curE = petCurrentEnergy(pet, now);
    if (curE >= ENERGY_MAX) {
      if (!auto) pushChat(`${pet.species.toUpperCase()} já está com energia cheia.`, "info");
      return;
    }
    const restingPet: PetInstance = { ...pet, energy: curE, energyRegenAt: now, azulRestUntil: now + dur, azulRestFromEnergy: curE, azulRestTotalMs: dur } as PetInstance;
    const newParty = party.map((x) => x.uid === uid ? restingPet : x);
    saveNow({ ...save, party: newParty });
    setTeam((tm) => {
      const filtered = tm.filter((x) => x.uid !== uid);
      if (tm[0]?.uid === uid && filtered[0]) {
        setLeaderHp(calcIdleMaxHp(filtered[0]));
      }
      return filtered;
    });
    setRestingBench((b) => [...b.filter((x) => x.uid !== uid), restingPet]);
    if (usePaid) {
      setIdle((s) => ({ ...s, bank: { ...s.bank, crystals: s.bank.crystals - AZUL_REST_COST } }));
    }
    const durLabel = usePaid ? "5 min" : "1 hora (grátis)";
    const costLabel = usePaid ? ` · -${AZUL_REST_COST}💎` : "";
    pushChat(`🏡 ${pet.species.toUpperCase()} entrou na Casa Azul (${durLabel})${costLabel}`, "info");
    pushEvent("🏡", "DESCANSO INICIADO", `${pet.species.toUpperCase()} · ${durLabel}`, "#4a9eff");
    setAzulPickerOpen(false);
    setAzulPreselectUid(null);
    setTimeout(() => {
      const s2 = (loadLatestValid<SaveShape>() ?? {}) as SaveShape;
      const refreshed = { ...restingPet, energy: ENERGY_MAX, energyRegenAt: Date.now(), azulRestUntil: undefined, azulRestFromEnergy: undefined, azulRestTotalMs: undefined } as PetInstance;
      const p2 = (s2.party ?? []).map((x) => x.uid === uid ? refreshed : x);
      saveNow({ ...s2, party: p2 });
      setRestingBench((b) => b.filter((x) => x.uid !== uid));
      setTeam((tm) => {
        if (tm.some((x) => x.uid === uid)) return tm;
        if (tm.length >= 6) return tm;
        const next = [...tm, refreshed];
        if (next.length === 1) setLeaderHp(calcIdleMaxHp(refreshed));
        return next;
      });
      pushChat(`⚡ ${refreshed.species.toUpperCase()} voltou ao time com energia cheia!`, "cap");
      pushEvent("⚡", "ENERGIA CHEIA", "Pokémon pronto para a batalha", "#7fc4ff");
    }, dur + 250);
  };


  // Completa o descanso
  useEffect(() => {
    if (restingUntil === null) return;
    const remaining = restingUntil - Date.now();
    const t = setTimeout(() => {
      const kind = restingKind;
      const fullRecovery = kind !== "lar" || restFullRecovery;
      // Restaura HP em todo o time; energia só se descanso completo
      setTeam((tm) => tm.map((p) => ({
        ...p,
        energy: fullRecovery ? ENERGY_MAX : (p as PetEnergyExt).energy ?? petCurrentEnergy(p),
        energyRegenAt: fullRecovery ? Date.now() : (p as PetEnergyExt).energyRegenAt ?? Date.now(),
        hp: calcIdleMaxHp(p),
      } as PetInstance)));
      const l = team[0];
      if (l) setLeaderHp(calcIdleMaxHp(l));
      setRestingUntil(null);
      setRestingStart(null);
      setRestingKind(null);
      setRestFullRecovery(false);
      const msg = kind === "lar"
        ? (fullRecovery
            ? "🏠 Descanso concluído! HP + energia totalmente recuperados."
            : "🏠 HP restaurado! (energia continua regenerando naturalmente).")
        : "💤 Descanso concluído! HP totalmente restaurado.";
      pushChat(msg, "cap");
      pushFxAt(trainerPos.x, trainerPos.y - 60, fullRecovery ? "+HP / +⚡" : "+HP", "gold");
    }, Math.max(0, remaining));
    return () => clearTimeout(t);
  }, [restingUntil]); // eslint-disable-line react-hooks/exhaustive-deps
  // Tick de UI para atualizar barra de progresso do descanso
  const [restNowTick, setRestNowTick] = useState(0);
  useEffect(() => {
    if (restingUntil === null) return;
    const iv = setInterval(() => {
      setRestNowTick((n) => n + 1);
      // FX flutuantes de cura sobre o treinador
      pushFxAt(trainerPos.x + (Math.random() * 40 - 20), trainerPos.y - 20 - Math.random() * 30, "💚", "gold");
    }, 700);
    return () => clearInterval(iv);
  }, [restingUntil]); // eslint-disable-line react-hooks/exhaustive-deps







  // (map único: Vale Verdejante)


  const followerX = followerState.x;
  const followerY = followerState.y;
  const transparentObstacleIds = new Set(
    [getCoveringObstacle(trainerPos.x, trainerPos.y), getCoveringObstacle(followerX, followerY)]
      .filter((id): id is number => id !== null)
  );

  return (
    <div>
    <div style={{












































































































































      height: "100vh",
      background: "#0b0510",
      color: "#f3e5c5",
      fontFamily: "'Trebuchet MS', system-ui, sans-serif",
      overflow: "hidden",
      position: "relative"
    }}>

      <div
        ref={viewportRef}
        onClick={(e) => {
          const t = e.target as HTMLElement;
          if (t.closest && t.closest("button, a, input, select, textarea")) return;
          const rect = viewportRef.current?.getBoundingClientRect();
          if (!rect) return;
          const sx = e.clientX - rect.left;
          const sy = e.clientY - rect.top;
          const wx = renderCamX + sx / zoom;
          const wy = renderCamY + sy / zoom;
          walkTargetRef.current = { x: wx, y: wy, label: "destino", resumeAuto: autoRef.current };
          setWalkingTo("destino");
          setAuto(false);
        }}
        style={{
          position: 'absolute',
          inset: 0,
          overflow: 'hidden',
          background: viewportBg,
          cursor: 'crosshair',
          zIndex: 0,
        }}
      >
        <div style={{
          position: "absolute",
          left: 0, top: 0,
          width: WORLD_W, height: WORLD_H,
          transform: `translate3d(${-renderCamX * zoom}px, ${-renderCamY * zoom}px, 0) scale(${zoom})`,
          transformOrigin: "0 0",
          transition: "none",
          backgroundColor: viewportBg,
          overflow: "hidden",
          contain: "layout paint style",
          willChange: "transform",
          backfaceVisibility: "hidden",
        }}>
          <img
            src={map.bg}
            alt=""
            aria-hidden="true"
            draggable={false}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "fill",
              pointerEvents: "none",
              userSelect: "none",
              imageRendering: "auto",
              transform: "translateZ(0)",
              backfaceVisibility: "hidden",
              zIndex: 0,
            }}
          />
          {obstacles.map((o) => (
            <img key={`obs-${o.id}`} src={o.src} alt="" style={{
              position: "absolute",
              left: o.x - o.w / 2,
              top: o.y - o.h + 8,
              width: o.w, height: o.h,
              opacity: transparentObstacleIds.has(o.id) ? 0.38 : 1,
              imageRendering: "pixelated",
              pointerEvents: "none",
              transition: "opacity 120ms linear",
              zIndex: Math.round(o.y),
              filter: "drop-shadow(0 2px 2px rgba(0,0,0,0.35))",
            }} />
          ))}


        </div>
      </div>

      {/* Camada de HUD — Camada flutuante transparente acima do jogo */}
      <div className="hud-overlay-container" style={{ position: 'fixed', inset: 0, zIndex: 1000, pointerEvents: 'none', background: 'transparent' }}>
        
        {/* Barra Superior Moderna */}
        <div className="modern-top-bar" style={{ 
          position: 'fixed', top: 0, left: 0, right: 0, height: '55px',
          background: 'rgba(0, 0, 0, 0.4)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 20px', borderBottom: '1px solid rgba(255,255,255,0.1)',
          pointerEvents: 'auto',
          zIndex: 1001
        }}>
          {/* Lado Esquerdo: Localização e Info */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ color: '#fff', fontSize: '14px', fontWeight: 800 }}>{map.name}</span>
              <span style={{ color: '#aaa', fontSize: '10px' }}>Dificuldade: Normal | {Math.floor(trainerPos.x)}, {Math.floor(trainerPos.y)}</span>
            </div>
            <div style={{ width: '1px', height: '24px', background: 'rgba(255,255,255,0.1)' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
               <span style={{ fontSize: '14px' }}>🕒</span>
               <span style={{ color: '#fff', fontSize: '12px' }}>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          </div>

          {/* Centro: Recursos */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div className="resource-item" style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(0,0,0,0.3)', padding: '4px 12px', borderRadius: '15px' }}>
              <span style={{ fontSize: '14px' }}>🪙</span>
              <span style={{ color: '#ffd700', fontSize: '13px', fontWeight: 700 }}>{idle.bank.gold.toLocaleString()}</span>
            </div>
            <div className="resource-item" style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(0,0,0,0.3)', padding: '4px 12px', borderRadius: '15px' }}>
              <span style={{ fontSize: '14px' }}>💎</span>
              <span style={{ color: '#00d2ff', fontSize: '13px', fontWeight: 700 }}>{idle.bank.crystals.toLocaleString()}</span>
            </div>
            <div className="resource-item" style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(0,0,0,0.3)', padding: '4px 12px', borderRadius: '15px' }}>
              <span style={{ fontSize: '14px' }}>🔻</span>
              <span style={{ color: '#ff4b4b', fontSize: '13px', fontWeight: 700 }}>{Math.floor(idle.items?.red_crystal_shard ?? 0)}</span>
            </div>
          </div>

          {/* Lado Direito: Topo limpo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          </div>
        </div>

        {/* HUD Elements rendered via portals or other overlays to handle layering correctly */}
      </div>


      {menuOpen && (
        <TabOverlay 
          tab="bag" 
          onClose={() => setMenuOpen(false)}
          onAnciaoInteraction={() => {}}
          leader={team[0]}
          team={team}
          onReorderTeam={(next) => setTeam(next)}
          leaderHp={team[0]?.hp ?? 0}
          items={idle.items || {}}
          caughtSpecies={[]} 
          seenSpecies={[]}   
          totals={{ gold: idle.bank.gold, captured: idle.collection?.length || 0 }}
          collection={idle.collection || []}
          craftPoints={idle.items?.craft_points || 0}
          onFragmentCollection={async (uid) => {}}
          gifMap={GIF}
          onPickTeam={(entry) => {}}
          onUseItem={useItem}
          bank={idle.bank || { gold: 0, crystals: 0 }}
          buffs={idle.buffs || { atk: 1, def: 1, expMult: 0 }}
          onBuyBall={buyBall}
          onBuyUltraBundle={buyUltraBundle}
          onBuyTeleportScroll={buyTeleportScroll}
          onBuyBook={buyBook}
          onBuyPotion={buyPotion}
          onBuyEgg={buyEgg}
          shopEggs={SHOP_EGGS}
          onBuyChestAmulet={buyChestAmulet}
          chestAmuletOwned={idle.items?.chest_amulet || 0}
          autoHeal={idle.autoHeal || { enabled: false, threshold: 0.5 }}
          setAutoHeal={(next) => setIdle(s => ({ ...s, autoHeal: next }))}
          audioSettings={audioSettings}
          setAudioSettings={setAudioSettings}
          tasks={idle.tasks || []}
          onClaimTask={claimTask}
          onOpenColecaoDetail={(uid) => setPetDetailUid(uid)}
          onExchange={exchange}
          onSellItem={sellItem}
          marketSellPrices={MARKET_SELL_PRICE}
          identity={identity}
          onListMarket={async () => false}
          onBuyMarket={async () => false}
          onCancelMarket={async () => false}
          onClaimMarketPayout={async () => false}
          isVip={isVip()}
          skinId={skinId}
          setSkinId={setSkinId}
          unlockedSkins={idle.unlockedSkins || []}
          skinTickets={idle.items?.skin_ticket || 0}
          onUnlockSkin={(id) => {}}
          trainerLevel={idle.trainerLevel || 1}
          onUpgradeBook={upgradeBook}
          orbTrades={ORB_TRADES}
          onTradeOrb={tradeForOrb}
          pokemonMarketNode={null}
          benchUids={new Set()}
        />
      )}






        <div className="chat-floating-panel" style={{
          position: 'absolute', bottom: '100px', left: '20px',
          width: '280px', maxHeight: chatOpen ? '240px' : '36px',
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(10px)',
          borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
          pointerEvents: 'auto', transition: 'max-height 0.3s'
        }}>
          <div style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#f5cf6b', fontSize: '10px', fontWeight: 900 }}>GLOBAL CHAT</span>
            <button onClick={() => setChatOpen(!chatOpen)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '12px' }}>
              {chatOpen ? '▼' : '▲'}
            </button>
          </div>
          {chatOpen && (
            <div style={{ flex: 1, overflowY: 'auto', padding: '10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {chat.slice(-20).map((c, idx) => (
                <div key={idx} style={{ fontSize: '10px', color: c.kind === 'cap' ? '#f5cf6b' : '#fff', opacity: 0.9 }}>
                  {c.text}
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
          )}
        </div>
      </div>
      <style>{`


        .modern-floating-window {
          background: rgba(11, 5, 20, 0.98) !important;
          backdrop-filter: blur(16px) !important;
          box-shadow: 0 0 60px rgba(0,0,0,0.85), inset 0 0 40px rgba(167, 139, 250, 0.05) !important;
        }
        .side-btn {
          transition: transform 0.2s, background 0.2s;
        }
        .side-btn:hover {
          transform: scale(1.1);
          background: rgba(245, 207, 107, 0.2) !important;
          border-color: #f5cf6b !important;
        }
        .side-btn:active {
          transform: scale(0.95);
        }
        .bottom-dock-container button {
          transition: transform 0.2s, opacity 0.2s;
          pointer-events: auto !important;
        }
        .bottom-dock-container button:hover {
          transform: translateY(-5px);
          opacity: 0.8;
        }
        .bottom-dock-container button:active {
          transform: translateY(0) scale(0.9);
        }
        .bottom-dock-container {
          pointer-events: auto !important;
        }

      `}</style>




      




      {/* 🛡️ AVISO — leitura da nuvem falhou: progresso local protegido e retry automático */}
      {cloudSaveBlocked && (



































        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, zIndex: 99999,
          display: "flex", alignItems: "center", justifyContent: "center", gap: 12,
          padding: "8px 14px", flexWrap: "wrap",
          background: "linear-gradient(90deg,#4a0f10,#7a1a1c,#4a0f10)",
          borderBottom: "2px solid #ffb84d", color: "#ffe9c7",
          fontWeight: 800, fontSize: 13, boxShadow: "0 6px 20px rgba(0,0,0,.6)",
        }}>
          <span>🛡️ Nuvem instável: seu progresso fica protegido neste aparelho e será reenviado automático.</span>
          <button
            onClick={() => { void attemptPendingCloudSave(); setCloudSaveBlocked(false); cloudBlobHydratedRef.current = false; setCloudBlobReady(false); setCloudRetryTick((t) => t + 1); setCloudQueueTick((t) => t + 1); }}
            style={{
              padding: "5px 12px", borderRadius: 8, cursor: "pointer",
              border: "1px solid #ffd27a", background: "#2a0a0b", color: "#ffd27a", fontWeight: 900, fontSize: 12,
            }}
          >🔄 Reenviar agora</button>
        </div>
      )}


      {/* 🌿 MODAL — Confirmar entrada no Evento Grass Oddish */}
      {oddishConfirm && (
        <div
          onClick={() => setOddishConfirm(null)}
          style={{
            position: "fixed", inset: 0, zIndex: 10000,
            display: "grid", placeItems: "center",
            background: "radial-gradient(circle at 50% 45%, rgba(30,90,40,0.82) 0%, rgba(6,20,10,0.94) 70%)",
            backdropFilter: "blur(8px)",
            animation: "fadeIn 0.28s ease-out",
            cursor: "pointer",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: "relative",
              width: "min(480px, 92vw)",
              padding: "28px 26px 22px",
              borderRadius: 20,
              background: "linear-gradient(160deg,#0f2010 0%,#1a3d1c 55%,#2b5f2e 100%)",
              border: "3px solid #8dfa8d",
              boxShadow: "0 0 60px rgba(141,250,141,0.55), 0 0 120px rgba(141,250,141,0.25), inset 0 0 40px rgba(141,250,141,0.14)",
              textAlign: "center",
              overflow: "hidden",
              cursor: "default",
            }}
          >
            <div style={{ position: "absolute", inset: 0, pointerEvents: "none", background: "radial-gradient(circle at 20% 20%, rgba(180,255,180,0.25), transparent 55%), radial-gradient(circle at 85% 85%, rgba(80,220,120,0.28), transparent 60%)" }} />
            <div style={{ position: "absolute", top: -14, left: "50%", transform: "translateX(-50%)", fontSize: 10, letterSpacing: 6, color: "#8affb0", fontWeight: 900, textShadow: "0 0 12px #8affb0", background: "#0a1a0a", padding: "3px 12px", borderRadius: 999, border: "1px solid #8dfa8d" }}>
              ✦ EVENTO GRASS ODDISH ✦
            </div>

            <div style={{ display: "flex", justifyContent: "center", gap: 12, marginTop: 6, marginBottom: 10, position: "relative" }}>
              <img src={oddishUrl} alt="Oddish" className="cash-pack-float" style={{ width: 62, height: 62, objectFit: "contain", imageRendering: "pixelated" as any, filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.6))" }} />
              <img src={oddishUrl} alt="Oddish" className="cash-pack-float" style={{ width: 78, height: 78, objectFit: "contain", imageRendering: "pixelated" as any, filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.6))", animationDelay: "0.4s" }} />
              <img src={oddishUrl} alt="Oddish" className="cash-pack-float" style={{ width: 62, height: 62, objectFit: "contain", imageRendering: "pixelated" as any, filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.6))", animationDelay: "0.8s" }} />
            </div>

            <div style={{ fontSize: 20, fontWeight: 900, color: "#fff", letterSpacing: 1, textShadow: "0 0 12px rgba(141,250,141,0.7)", position: "relative" }}>
              Entrar no Vale dos Oddish?
            </div>
            <div style={{ fontSize: 12, color: "#d6ffd6", marginTop: 8, lineHeight: 1.5, position: "relative" }}>
              Um mapa especial onde só nascem <b style={{ color: "#8affb0" }}>Oddish</b> nas raridades
              {" "}<b>Raro</b>, <b style={{ color: "#c98aff" }}>Épico</b> e <b style={{ color: "#ffd76a" }}>Mítico</b>.
              <br />Taxa de captura padrão do servidor.
            </div>

            <div style={{
              marginTop: 14,
              display: "flex", justifyContent: "center", alignItems: "center", gap: 10,
              padding: "10px 14px",
              borderRadius: 12,
              background: "linear-gradient(135deg,#0a1a0a,#1a3d1c)",
              border: "1px solid #8dfa8d",
              boxShadow: "inset 0 0 20px rgba(141,250,141,0.15)",
              position: "relative",
            }}>
              <div style={{ fontSize: 11, color: "#c8e8c8", fontWeight: 700 }}>Custo</div>
              <div style={{ fontSize: 22, fontWeight: 900, color: "#8affb0", textShadow: "0 0 10px rgba(141,250,141,0.7)" }}>
                {oddishConfirm.need}
              </div>
              <div style={{ fontSize: 18 }}>🌿</div>
              <div style={{ width: 1, height: 22, background: "rgba(141,250,141,0.4)", margin: "0 6px" }} />
              <div style={{ fontSize: 11, color: "#c8e8c8", fontWeight: 700 }}>Você tem</div>
              <div style={{ fontSize: 18, fontWeight: 900, color: "#fff" }}>
                {oddishConfirm.have}
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "center", gap: 10, marginTop: 18, position: "relative" }}>
              <button
                onClick={() => setOddishConfirm(null)}
                style={{
                  padding: "10px 20px",
                  fontSize: 11, fontWeight: 900, letterSpacing: 1,
                  color: "#d6ffd6",
                  background: "linear-gradient(135deg,#1a2a1a,#0f1a0f)",
                  border: "2px solid #4a6a4a",
                  borderRadius: 12,
                  cursor: "pointer",
                }}
              >
                CANCELAR
              </button>
              <button
                onClick={enterGrassOddish}
                style={{
                  padding: "10px 22px",
                  fontSize: 12, fontWeight: 900, letterSpacing: 1,
                  color: "#0a2010",
                  background: "linear-gradient(135deg,#d6ffd6,#8dfa8d 60%,#3ec96f)",
                  border: "2px solid #fff",
                  borderRadius: 12,
                  cursor: "pointer",
                  boxShadow: "0 4px 18px rgba(141,250,141,0.55)",
                }}
              >
                ENTRAR (-20 🌿)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🌿 MODAL — Faltam Stones Verdejantes */}
      {oddishNoStone && (
        <div
          onClick={() => setOddishNoStone(null)}
          style={{
            position: "fixed", inset: 0, zIndex: 10000,
            display: "grid", placeItems: "center",
            background: "radial-gradient(circle at 50% 45%, rgba(30,90,40,0.75) 0%, rgba(6,20,10,0.92) 70%)",
            backdropFilter: "blur(8px)",
            animation: "fadeIn 0.28s ease-out",
            cursor: "pointer",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: "relative",
              width: "min(440px, 92vw)",
              padding: "26px 24px 20px",
              borderRadius: 20,
              background: "linear-gradient(160deg,#170a0a 0%,#3a1616 55%,#5a2a2a 100%)",
              border: "3px solid #ff9a9a",
              boxShadow: "0 0 60px rgba(255,140,140,0.55), 0 0 120px rgba(255,120,120,0.25), inset 0 0 40px rgba(255,180,180,0.12)",
              textAlign: "center",
              overflow: "hidden",
              cursor: "default",
            }}
          >
            <div style={{ position: "absolute", inset: 0, pointerEvents: "none", background: "radial-gradient(circle at 20% 20%, rgba(255,200,200,0.22), transparent 55%), radial-gradient(circle at 85% 85%, rgba(220,80,80,0.24), transparent 60%)" }} />
            <div style={{ position: "absolute", top: -14, left: "50%", transform: "translateX(-50%)", fontSize: 10, letterSpacing: 6, color: "#ffd0d0", fontWeight: 900, textShadow: "0 0 12px #ff9a9a", background: "#2a0d0d", padding: "3px 12px", borderRadius: 999, border: "1px solid #ff9a9a" }}>
              ✦ EVENTO BLOQUEADO ✦
            </div>

            <div style={{ display: "flex", justifyContent: "center", gap: 12, marginTop: 6, marginBottom: 10, position: "relative" }}>
              <div style={{ width: 74, height: 74, borderRadius: "50%", overflow: "hidden", border: "2px solid #d6ffd6", boxShadow: "0 0 18px rgba(141,250,141,0.7)", background: "radial-gradient(circle at 50% 40%, #1a3d1c 0%, #0a1a0a 80%)", display: "grid", placeItems: "center" }}>
                <img src={oddishUrl} alt="Oddish" style={{ width: "94%", height: "94%", objectFit: "contain", imageRendering: "pixelated" as any, filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.6)) grayscale(0.3)" }} />
              </div>
            </div>

            <div style={{ fontSize: 18, fontWeight: 900, color: "#fff", letterSpacing: 1, textShadow: "0 0 12px rgba(255,150,150,0.7)", position: "relative" }}>
              Você precisa de Stone Verdejante 🌿
            </div>
            <div style={{ fontSize: 12, color: "#ffd6d6", marginTop: 8, lineHeight: 1.45, position: "relative" }}>
              Para entrar no evento <b style={{ color: "#8affb0" }}>Grass Oddish</b> são necessárias
              {" "}<b style={{ color: "#fff" }}>{oddishNoStone.need} 🌿</b>.
            </div>

            <div style={{
              marginTop: 14,
              display: "flex", justifyContent: "center", alignItems: "center", gap: 12,
              padding: "10px 14px",
              borderRadius: 12,
              background: "linear-gradient(135deg,#0f2010,#1a3d1c)",
              border: "1px solid #8dfa8d",
              boxShadow: "inset 0 0 20px rgba(141,250,141,0.15)",
              position: "relative",
            }}>
              <div style={{ fontSize: 11, color: "#c8e8c8", fontWeight: 700 }}>Você tem</div>
              <div style={{ fontSize: 22, fontWeight: 900, color: "#ff9a9a", textShadow: "0 0 10px rgba(255,140,140,0.6)" }}>
                {oddishNoStone.have}
              </div>
              <div style={{ fontSize: 14, color: "#8affb0", fontWeight: 900 }}>/</div>
              <div style={{ fontSize: 22, fontWeight: 900, color: "#8affb0", textShadow: "0 0 10px rgba(141,250,141,0.7)" }}>
                {oddishNoStone.need}
              </div>
              <div style={{ fontSize: 16 }}>🌿</div>
            </div>

            <div style={{ fontSize: 10.5, color: "#c8b8b8", marginTop: 12, lineHeight: 1.4, position: "relative" }}>
              Dica: Stones Verdejantes caem de Pokémon do tipo Planta e podem ser encontradas em baús elementais.
            </div>

            <button
              onClick={() => setOddishNoStone(null)}
              style={{
                marginTop: 16,
                padding: "10px 22px",
                fontSize: 12, fontWeight: 900, letterSpacing: 1,
                color: "#170a0a",
                background: "linear-gradient(135deg,#ffd0d0,#ff9a9a)",
                border: "2px solid #fff",
                borderRadius: 12,
                cursor: "pointer",
                boxShadow: "0 4px 18px rgba(255,140,140,0.45)",
                position: "relative",
              }}
            >
              FECHAR ✕
            </button>
          </div>
        </div>
      )}

      {/* 🏆 RANKING GLOBAL — Grass Oddish */}
      {oddishRankOpen && (
        <div
          onClick={() => setOddishRankOpen(false)}
          style={{
            position: "fixed", inset: 0, zIndex: 10000,
            display: "grid", placeItems: "center",
            background: "radial-gradient(circle at 50% 45%, rgba(20,60,30,0.9) 0%, rgba(4,14,8,0.96) 70%)",
            backdropFilter: "blur(6px)",
            animation: "fadeIn 0.25s ease-out",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: "relative",
              width: "min(560px, 94vw)",
              maxHeight: "82vh",
              display: "flex", flexDirection: "column",
              padding: "18px 20px 16px",
              borderRadius: 18,
              background: "linear-gradient(160deg,#0f2010 0%,#1a3d1c 55%,#2b5f2e 100%)",
              border: "3px solid #8dfa8d",
              boxShadow: "0 0 50px rgba(141,250,141,0.5), inset 0 0 30px rgba(141,250,141,0.12)",
            }}
          >
            <div style={{ position: "absolute", inset: 0, pointerEvents: "none", borderRadius: 18, background: "radial-gradient(circle at 20% 15%, rgba(180,255,180,0.18), transparent 55%), radial-gradient(circle at 85% 85%, rgba(80,220,120,0.22), transparent 60%)" }} />

            <div style={{ position: "relative", textAlign: "center", marginBottom: 10 }}>
              <div style={{ fontSize: 10, letterSpacing: 6, color: "#8affb0", fontWeight: 900, textShadow: "0 0 10px #8affb0" }}>✦ RANKING GLOBAL ✦</div>
              <div style={{ fontSize: 20, fontWeight: 900, color: "#eaffea", marginTop: 2, textShadow: "0 2px 0 rgba(0,0,0,0.5)" }}>
                🏆 Grass Oddish
              </div>
              <div style={{ fontSize: 10.5, color: "#c8e8c8", marginTop: 4, lineHeight: 1.35 }}>
                Total de Oddish capturados — atualizado ao vivo. Quando o evento encerrar, o pódio final fica visível pra todos.
              </div>
              <div style={{ fontSize: 10, color: "#a8d0a8", marginTop: 6 }}>
                Seus capturados: <b style={{ color: "#fff" }}>{idle.grassOddishCaptured ?? 0}</b>
              </div>
            </div>

            <div style={{ position: "relative", flex: 1, overflowY: "auto", background: "rgba(0,0,0,0.35)", borderRadius: 12, border: "1px solid rgba(141,250,141,0.35)", padding: 6 }}>
              {oddishRankLoading && oddishRankRows.length === 0 && (
                <div style={{ padding: 20, textAlign: "center", color: "#c8e8c8", fontSize: 12 }}>Carregando ranking…</div>
              )}
              {!oddishRankLoading && oddishRankRows.length === 0 && (
                <div style={{ padding: 20, textAlign: "center", color: "#c8e8c8", fontSize: 12 }}>
                  Ninguém pontuou ainda. Seja o primeiro a capturar Oddish no evento!
                </div>
              )}
              {oddishRankRows.map((r, i) => {
                const pos = i + 1;
                const medal = pos === 1 ? "🥇" : pos === 2 ? "🥈" : pos === 3 ? "🥉" : pos === 4 ? "🏅" : pos === 5 ? "🏅" : `#${pos}`;
                const isMe = r.user_id === identity?.id;
                const topColor = pos === 1 ? "#ffd66b" : pos === 2 ? "#d0d8e0" : pos === 3 ? "#e79a5a" : pos === 4 ? "#b6f0ff" : pos === 5 ? "#c9b6ff" : "#c8e8c8";
                const topBg = pos === 1
                  ? "linear-gradient(90deg, rgba(255,214,107,0.28), rgba(255,214,107,0.06))"
                  : pos === 2
                  ? "linear-gradient(90deg, rgba(208,216,224,0.24), rgba(208,216,224,0.05))"
                  : pos === 3
                  ? "linear-gradient(90deg, rgba(231,154,90,0.24), rgba(231,154,90,0.05))"
                  : pos === 4
                  ? "linear-gradient(90deg, rgba(182,240,255,0.20), rgba(182,240,255,0.04))"
                  : pos === 5
                  ? "linear-gradient(90deg, rgba(201,182,255,0.20), rgba(201,182,255,0.04))"
                  : "transparent";
                return (
                  <div key={r.user_id} style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "6px 10px",
                    borderRadius: 8,
                    marginBottom: 4,
                    background: isMe ? "linear-gradient(90deg, rgba(141,250,141,0.28), rgba(141,250,141,0.05))" : topBg,
                    border: isMe ? "1px solid #8dfa8d" : (pos <= 5 ? `1px solid ${topColor}55` : "1px solid transparent"),
                    boxShadow: pos <= 3 ? `0 0 10px ${topColor}44` : "none",
                  }}>
                    <div style={{ width: 38, fontSize: pos <= 5 ? 16 : 12, fontWeight: 900, color: topColor, textAlign: "center", textShadow: pos <= 3 ? `0 0 8px ${topColor}` : "none" }}>{medal}</div>
                    <div style={{ flex: 1, minWidth: 0, fontSize: 12, fontWeight: 800, color: isMe ? "#fff" : "#eaffea", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {r.username}{isMe ? " (você)" : ""}
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 900, color: "#8affb0", textShadow: "0 0 6px rgba(141,250,141,0.5)" }}>
                      {r.captures.toLocaleString("pt-BR")} 🌿
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              onClick={() => setOddishRankOpen(false)}
              style={{
                marginTop: 12,
                padding: "10px 22px",
                fontSize: 12, fontWeight: 900, letterSpacing: 1,
                color: "#0a1a0a",
                background: "linear-gradient(135deg,#d6ffd6,#8dfa8d)",
                border: "2px solid #fff",
                borderRadius: 12,
                cursor: "pointer",
                boxShadow: "0 4px 18px rgba(141,250,141,0.45)",
                position: "relative",
              }}
            >
              FECHAR ✕
            </button>
          </div>
        </div>
      )}

      {/* 🌿 SPLASH — Entrada no Evento Grass Oddish */}
      {grassOddishSplash && (
        <div
          onClick={() => setGrassOddishSplash(false)}
          style={{
            position: "fixed", inset: 0, zIndex: 9999,
            display: "grid", placeItems: "center",
            background: "radial-gradient(circle at 50% 45%, rgba(30,90,40,0.85) 0%, rgba(6,20,10,0.94) 70%)",
            backdropFilter: "blur(6px)",
            animation: "fadeIn 0.35s ease-out",
            cursor: "pointer",
          }}
        >
          <div style={{
            position: "relative",
            width: "min(560px, 92vw)",
            padding: "26px 28px 22px",
            borderRadius: 20,
            background: "linear-gradient(160deg, #0f2010 0%, #1a3d1c 45%, #2b5f2e 100%)",
            border: "3px solid #8dfa8d",
            boxShadow: "0 0 60px rgba(141,250,141,0.55), 0 0 120px rgba(141,250,141,0.25), inset 0 0 40px rgba(141,250,141,0.14)",
            textAlign: "center",
            overflow: "hidden",
          }}>
            <div style={{ position: "absolute", inset: 0, pointerEvents: "none", background: "radial-gradient(circle at 20% 20%, rgba(180,255,180,0.25), transparent 55%), radial-gradient(circle at 85% 85%, rgba(80,220,120,0.28), transparent 60%)" }} />
            <div style={{ position: "absolute", top: -30, left: "50%", transform: "translateX(-50%)", fontSize: 11, letterSpacing: 6, color: "#8affb0", fontWeight: 900, textShadow: "0 0 12px #8affb0" }}>✦ EVENTO ATIVO ✦</div>
            <div style={{ display: "flex", justifyContent: "center", gap: 10, marginBottom: 10 }}>
              {[0,1,2].map((i) => (
                <img key={i} src={oddishUrl} alt="Oddish" width={72} height={72}
                  style={{ width: 72, height: 72, objectFit: "contain", imageRendering: "pixelated" as any,
                    filter: "drop-shadow(0 4px 10px rgba(0,0,0,0.7)) drop-shadow(0 0 12px rgba(141,250,141,0.9))",
                    animation: `cash-pack-float 1.4s ease-in-out ${i * 0.15}s infinite` }} />
              ))}
            </div>
            <h1 style={{ margin: 0, fontSize: 30, fontWeight: 900, letterSpacing: 3, color: "#eaffea", textShadow: "0 2px 0 rgba(0,0,0,0.7), 0 0 18px rgba(141,250,141,0.75)" }}>
              🌿 GRASS ODDISH 🌿
            </h1>
            <div style={{ marginTop: 4, fontSize: 12, fontWeight: 800, letterSpacing: 4, color: "#c8e8c8" }}>
              PORTAL VERDE ABERTO
            </div>
            <div style={{ marginTop: 14, padding: "10px 14px", background: "rgba(0,0,0,0.35)", border: "1px solid rgba(141,250,141,0.35)", borderRadius: 12, textAlign: "left", fontSize: 12.5, lineHeight: 1.55, color: "#e8ffe8" }}>
              <div style={{ marginBottom: 6 }}>• Somente <b style={{ color: "#8affb0" }}>Oddish</b> aparece neste mapa.</div>
              <div style={{ marginBottom: 6 }}>• Raridades: <b style={{ color: "#7effa0" }}>Raro</b> · <b style={{ color: "#c58bff" }}>Épico</b> · <b style={{ color: "#ffd76a" }}>Mítico</b>.</div>
              <div style={{ marginBottom: 6 }}>• Taxa de captura <b>igual ao servidor</b> — o ganho é o <b>volume</b> de spawns.</div>
              <div>• Contador de capturas ativo no menu lateral.</div>
            </div>
            <div style={{ marginTop: 14, fontSize: 11, color: "#a8d0a8", letterSpacing: 1 }}>
              Clique em qualquer lugar para fechar
            </div>
          </div>
        </div>
      )}
      {/* ❄️ Overlay de Congelamento — ativo quando a Chave Ruby do Ranked CRAFT foi coletada. */}
      {false && idle.redeemedCodes?.RANKED_RUBY_KEY_CRAFT && (
        <>
          <style>{`
            @keyframes rm-ice-drift { 0%{background-position:0 0,0 0} 100%{background-position:600px 400px,-500px 350px} }
            @keyframes rm-ice-pulse { 0%,100%{opacity:.55} 50%{opacity:.85} }
            @keyframes rm-ice-shimmer { 0%{transform:translateX(-100%)} 100%{transform:translateX(100%)} }
          `}</style>
          <div style={{
            position: "fixed", inset: 0, pointerEvents: "none", zIndex: 9998,
            background: `
              radial-gradient(1200px 800px at 50% 50%, rgba(180,230,255,0.0) 0%, rgba(120,200,255,0.18) 55%, rgba(60,140,220,0.32) 100%),
              repeating-linear-gradient(45deg, rgba(200,240,255,0.06) 0 3px, transparent 3px 12px),
              repeating-linear-gradient(-45deg, rgba(160,220,255,0.05) 0 2px, transparent 2px 10px)
            `,
            backgroundSize: "auto, 24px 24px, 20px 20px",
            animation: "rm-ice-drift 40s linear infinite, rm-ice-pulse 4s ease-in-out infinite",
            boxShadow: "inset 0 0 220px 60px rgba(120,200,255,0.35), inset 0 0 60px 20px rgba(200,240,255,0.5)",
            mixBlendMode: "screen",
          }} />
          {/* Bordas de cristal */}
          <div style={{
            position: "fixed", inset: 0, pointerEvents: "none", zIndex: 9999,
            border: "6px solid transparent",
            borderImage: "linear-gradient(135deg, rgba(200,240,255,0.9), rgba(90,170,230,0.5), rgba(200,240,255,0.9)) 1",
            boxShadow: "inset 0 0 40px rgba(180,230,255,0.6)",
          }} />
          {/* Badge congelado */}
          <div style={{
            position: "fixed", top: 8, left: "50%", transform: "translateX(-50%)", zIndex: 10000,
            padding: "5px 14px", borderRadius: 999,
            background: "linear-gradient(90deg, rgba(30,80,140,0.85), rgba(120,200,255,0.85), rgba(30,80,140,0.85))",
            border: "1px solid rgba(200,240,255,0.75)",
            color: "#e8f7ff", fontWeight: 900, fontSize: 11, letterSpacing: 1.2,
            textShadow: "0 0 8px rgba(200,240,255,0.9)",
            boxShadow: "0 0 18px rgba(120,200,255,0.7)",
            pointerEvents: "none",
          }}>BLOK RANKED DO JOGO</div>
        </>
      )}

      {(() => {
        const cornerOrn = (pos: "tl"|"tr"|"bl"|"br"): React.CSSProperties => ({
          position: "absolute", width: 10, height: 10,
          borderColor: "#d4af5a", borderStyle: "solid", borderWidth: 0,
          ...(pos==="tl" ? { top: -1, left: -1, borderTopWidth: 2, borderLeftWidth: 2 } : {}),
          ...(pos==="tr" ? { top: -1, right: -1, borderTopWidth: 2, borderRightWidth: 2 } : {}),
          ...(pos==="bl" ? { bottom: -1, left: -1, borderBottomWidth: 2, borderLeftWidth: 2 } : {}),
          ...(pos==="br" ? { bottom: -1, right: -1, borderBottomWidth: 2, borderRightWidth: 2 } : {}),
        });
        const goldRule = (): React.CSSProperties => ({
          display: "inline-block", width: 34, height: 1,
          background: "linear-gradient(90deg, transparent, #d4af5a, transparent)",
        });
        return levelToast && (

        <div
          key={levelToast.ts}
          style={{
            position: "fixed", top: 72, left: "50%",
            zIndex: 9999, pointerEvents: "none",
            animation: "lvToastIn 420ms cubic-bezier(.2,.9,.25,1) forwards, lvToastOut 500ms ease-in 2.4s forwards",
            transformOrigin: "top center",
          }}
        >
          <div style={{
            position: "relative",
            padding: "10px 22px 11px",
            minWidth: 240,
            textAlign: "center",
            background: "linear-gradient(180deg, #1a1220 0%, #0d0810 100%)",
            border: "1px solid rgba(212,175,90,0.55)",
            borderRadius: 4,
            boxShadow:
              "0 0 0 1px rgba(0,0,0,0.6), 0 10px 28px rgba(0,0,0,0.55), 0 0 24px rgba(212,175,90,0.18)",
            fontFamily: "'Cinzel', 'Trajan Pro', Georgia, serif",
          }}>
            {/* gold corner ornaments */}
            <span style={cornerOrn("tl")} /><span style={cornerOrn("tr")} />
            <span style={cornerOrn("bl")} /><span style={cornerOrn("br")} />
            {/* shine sweep */}
            <span style={{
              position: "absolute", inset: 0, overflow: "hidden", borderRadius: 4, pointerEvents: "none",
            }}>
              <span style={{
                position: "absolute", top: 0, bottom: 0, width: 60,
                background: "linear-gradient(90deg, transparent, rgba(255,235,180,0.22), transparent)",
                transform: "skewX(-20deg)",
                animation: "lvShine 1.4s ease-out 0.15s 1",
              }} />
            </span>

            <div style={{
              fontSize: 10, letterSpacing: 4, color: "#d4af5a",
              textTransform: "uppercase", marginBottom: 2, opacity: 0.9,
            }}>
              Ascensão
            </div>
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
              color: "#f4e4b8", fontSize: 18, fontWeight: 700, letterSpacing: 2,
              textShadow: "0 1px 0 #000, 0 0 12px rgba(212,175,90,0.35)",
            }}>
              <span style={goldRule()} />
              <span>NÍVEL {levelToast.level}</span>
              <span style={goldRule()} />
            </div>
            <div style={{
              marginTop: 6, fontSize: 11, letterSpacing: 0.5,
              color: "#c9c0a8", fontFamily: "'Trebuchet MS', system-ui, sans-serif",
            }}>
              {levelToast.gains.join(" · ")}
            </div>
            <div style={{
              marginTop: 3, fontSize: 10.5, color: "#e8c76a",
              fontFamily: "'Trebuchet MS', system-ui, sans-serif",
            }}>
              ✦ Bônus <strong style={{ color: "#fff2c2" }}>+{levelToast.bonus}</strong>
            </div>
          </div>
        </div>
      );
      })()}

      {/* ⚡ ZAPDOS ANNOUNCEMENT — some após 8s */}
      {zapdosAnnounce && (
        <div
          key={zapdosAnnounce.ts}
          style={{
            position: "fixed", top: 12, left: "50%", transform: "translateX(-50%)",
            zIndex: 9999, pointerEvents: "none",
            animation: "zapIn 380ms cubic-bezier(.2,.9,.25,1) forwards, zapOut 500ms ease-in 7.2s forwards",
          }}
        >
          <style>{`
            @keyframes zapIn { from { opacity:0; transform: translate(-50%, -30px) scale(.9);} to {opacity:1; transform: translate(-50%,0) scale(1);} }
            @keyframes zapOut { to { opacity:0; transform: translate(-50%,-20px) scale(.95);} }
            @keyframes zapPulse { 0%,100% { box-shadow: 0 0 24px rgba(255,210,58,0.55), 0 0 60px rgba(255,180,20,0.35);} 50% { box-shadow: 0 0 40px rgba(255,235,120,0.85), 0 0 90px rgba(255,180,20,0.55);} }
          `}</style>
          <div style={{
            display: "flex", alignItems: "center", gap: 14,
            padding: "10px 22px 10px 12px",
            background: "linear-gradient(90deg,#1a1408 0%,#2a1f0a 50%,#1a1408 100%)",
            border: "2px solid #ffd23a",
            borderRadius: 10,
            fontFamily: "'Cinzel', Georgia, serif",
            animation: "zapPulse 1.2s ease-in-out infinite",
            minWidth: 340,
          }}>
            <div style={{
              width: 56, height: 56, borderRadius: "50%",
              background: "radial-gradient(circle,#3a2a08 0%,#1a1004 80%)",
              border: "2px solid #ffd23a",
              display: "grid", placeItems: "center",
              overflow: "hidden",
              boxShadow: "inset 0 0 12px rgba(0,0,0,0.6)",
            }}>
              <img
                src={assetUrlFromJson(zapdosAsset)}
                alt="Zapdos"
                style={{ width: 48, height: 48, imageRendering: "pixelated" }}
              />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <div style={{
                fontSize: 10, letterSpacing: 3, color: "#ffd23a",
                textTransform: "uppercase", opacity: 0.9,
              }}>
                ✦ Evento Relâmpago ✦
              </div>
              <div style={{
                color: "#fff2c2", fontSize: 18, fontWeight: 800, letterSpacing: 2,
                textShadow: "0 0 12px rgba(255,210,58,0.6), 0 1px 0 #000",
              }}>
                ZAPDOS APARECEU!
              </div>
              <div style={{
                fontSize: 11, color: "#e0c470",
                fontFamily: "'Trebuchet MS', system-ui, sans-serif",
              }}>
                ✦ Mítico Brilhante · Lv 420 · Odisséia / Caverna Sombria · Ultra Ball
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="idle-grid" style={{




        display: "grid",
        gridTemplateColumns: "1fr",
        gridTemplateRows: "1fr",
        position: "relative",
        height: "100dvh",
        width: "100dvw",
        background: "black",
        overflow: "hidden",
      }}>





        {/* ============ TOP BAR (FLOATING) ============ */}
        <div style={{
          position: "fixed", top: 12, left: "50%", transform: "translateX(-50%)",
          width: "calc(100% - 24px)", maxWidth: 1400, height: 64,
          background: "linear-gradient(180deg, rgba(20, 10, 30, 0.95) 0%, rgba(10, 5, 15, 0.98) 100%)",
          border: "1px solid rgba(201, 184, 255, 0.25)",
          borderRadius: 12, display: "flex", alignItems: "center", padding: "0 16px",
          boxShadow: "0 8px 32px rgba(0,0,0,0.8), inset 0 0 12px rgba(201, 184, 255, 0.1)",
          zIndex: 1000, pointerEvents: "auto", gap: 20
        }}>
          {/* Left Part: Map Info */}
          <div style={{ display: "flex", flexDirection: "column", minWidth: 160 }}>
            <div style={{ color: "#c9b8ff", fontWeight: 900, fontSize: 13, letterSpacing: 1.5, textShadow: "0 2px 4px #000" }}>
              {IDLE_MAPS[idle.currentMap]?.name.toUpperCase() || "VALE VERDEJANTE"}
            </div>
            <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 10, letterSpacing: 0.5, marginTop: 2 }}>
              COORD: {Math.floor(trainerPos.x)}, {Math.floor(trainerPos.y)}
            </div>
          </div>

          {/* Center: Currencies */}
          <div style={{ flex: 1, display: "flex", justifyContent: "center", gap: 24, alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <img src={assetUrlFromJson(iconCrystalBlue)} alt="" style={{ width: 18, height: 18 }} />
              <span style={{ color: "#fff", fontWeight: 900, fontSize: 13 }}>{fmtK(idle.bank.gold)}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <img src={assetUrlFromJson(iconFragmentCrystal)} alt="" style={{ width: 18, height: 18 }} />
              <span style={{ color: "#ffd94d", fontWeight: 900, fontSize: 13 }}>{Math.floor(idle.bank.crystals)}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 18, height: 18, background: "#ff4b4b", borderRadius: "50%", border: "1.5px solid #fff" }} />
              <span style={{ color: "#ff8b8b", fontWeight: 900, fontSize: 13 }}>{Math.floor(idle.items?.fragmento_vermelho ?? 0)}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <img src={assetUrlFromJson(iconCashPackage)} alt="" style={{ width: 18, height: 18 }} />
              <span style={{ color: "#8dfa8d", fontWeight: 900, fontSize: 13 }}>{idle.items?.safira_verde ?? 0}</span>
            </div>
          </div>


          {/* Right Part: Clock & Settings */}
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ color: "#c9b8ff", fontWeight: 900, fontSize: 14, fontFamily: "monospace" }}>
              {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </div>
            <button
              onClick={() => setShowAutoSettings(!showAutoSettings)}
              style={{
                background: "rgba(201, 184, 255, 0.1)", border: "1px solid rgba(201, 184, 255, 0.3)",
                color: "#c9b8ff", width: 32, height: 32, borderRadius: 8, cursor: "pointer",
                display: "grid", placeItems: "center", fontSize: 18
              }}
            >⚙</button>
          </div>
        </div>

        {/* ============ PLAYER PROFILE (LEFT FLOATING) ============ */}
        <div style={{
          position: "fixed", top: 88, left: 12, width: 260,
          background: "linear-gradient(135deg, rgba(30, 15, 45, 0.95) 0%, rgba(15, 8, 25, 0.98) 100%)",
          border: "1px solid rgba(201, 184, 255, 0.3)", borderRadius: 16,
          padding: 12, boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
          zIndex: 900, pointerEvents: "auto"
        }}>
          {(() => {
            const trainerLv = idle.trainerLevel ?? 1;
            const nextAt = trainerXpToNext(trainerLv);
            const curXp = idle.trainerXp ?? 0;
            const xpPct = Math.max(0, Math.min(100, (curXp / nextAt) * 100));
            const name = (identity?.name || "Treinador").slice(0, 14);
            const vip = isVip();

            return (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  <div style={{
                    width: 56, height: 56, borderRadius: "50%",
                    background: "conic-gradient(from 45deg, #c9b8ff, #1e40af, #c9b8ff)",
                    padding: 2, boxShadow: "0 0 15px rgba(201, 184, 255, 0.4)"
                  }}>
                    <div style={{
                      width: "100%", height: "100%", borderRadius: "50%",
                      background: "#0b0510", overflow: "hidden", border: "2px solid #0b0510"
                    }}>
                      <img src={assetUrlFromJson(trainerAvatarAsset)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    </div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <span style={{ color: "#fff", fontWeight: 900, fontSize: 14, textShadow: "0 2px 4px #000" }}>{name}</span>
                      {vip && <span style={{ background: "#ffd94d", color: "#000", fontSize: 8, fontWeight: 900, padding: "1px 4px", borderRadius: 4 }}>VIP</span>}
                    </div>
                    <div style={{ color: "#c9b8ff", fontWeight: 800, fontSize: 11 }}>Nv. {trainerLv}</div>
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <div style={{ height: 18, background: "rgba(0,0,0,0.5)", borderRadius: 9, border: "1px solid rgba(255,255,255,0.1)", position: "relative", overflow: "hidden" }}>
                    <div style={{ width: `${Math.min(100, (leaderHp / calcIdleMaxHp(team[0] || team[0])) * 100)}%`, height: "100%", background: "linear-gradient(90deg, #ff4b4b, #ff8b8b)", transition: "width 0.3s" }} />
                    <span style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", color: "#fff", fontSize: 9, fontWeight: 900, textShadow: "0 1px 2px #000" }}>HP LÍDER</span>
                  </div>
                  <div style={{ height: 6, background: "rgba(0,0,0,0.5)", borderRadius: 3, position: "relative", overflow: "hidden" }}>
                    <div style={{ width: `${xpPct}%`, height: "100%", background: "linear-gradient(90deg, #c9b8ff, #a25bff)", boxShadow: "0 0 8px #a25bff" }} />
                  </div>
                </div>
              </div>
            );
          })()}
        </div>

        {/* ============ RIGHT SIDEBAR (FLOATING) ============ */}
        <div style={{
          position: "fixed", top: 80, right: 12, width: 160,
          display: "flex", flexDirection: "column", gap: 12,
          zIndex: 900, pointerEvents: "auto",
          alignItems: "flex-end"
        }}>
          {/* Circular Minimap Container */}
          <div style={{
            width: 160, height: 160, borderRadius: "50%",
            background: "rgba(20, 10, 30, 0.9)", border: "3px solid rgba(201, 184, 255, 0.5)",
            display: "grid", placeItems: "center", overflow: "hidden",
            boxShadow: "0 8px 32px rgba(0,0,0,0.8), inset 0 0 20px rgba(201, 184, 255, 0.2)",
            position: "relative"
          }}>
            {/* Minimap Terrain Graphic with Game Zoom Awareness */}
            <div style={{ 
              width: "100%", height: "100%", 
              background: `url(${IDLE_MAPS[idle.currentMap]?.bg || idleArenaUrl})`,
              backgroundPosition: `${(trainerPos.x / WORLD_W) * 100}% ${(trainerPos.y / WORLD_H) * 100}%`,
              backgroundSize: `${200 / zoom}%`, // Ajusta o zoom do mapa baseado no zoom do jogo
              filter: "brightness(0.6) saturate(1.2) contrast(1.1)",
              opacity: 0.8,
              transition: "background-position 0.2s ease-out, background-size 0.3s ease-in-out"
            }} />
            
            {/* Markers on Minimap */}
            <div style={{ position: "absolute", inset: 0 }}>
              {/* Trainer Position (Red Dot) - Fixed Center for Radar Style */}
              <div style={{
                position: "absolute",
                left: "50%",
                top: "50%",
                width: 10, height: 10, borderRadius: "50%",
                background: "#ff4b4b", border: "2px solid #fff",
                boxShadow: "0 0 8px #ff4b4b", zIndex: 2,
                transform: "translate(-50%, -50%)"
              }} />
              
              {/* Enemies (Small Yellow Dots) - Relative to Trainer */}
              {enemies.filter(e => e.hp > 0).map(e => {
                const relX = ((e.x - trainerPos.x) / (WORLD_W * 0.25)) * 100 * zoom;
                const relY = ((e.y - trainerPos.y) / (WORLD_H * 0.25)) * 100 * zoom;
                return (
                  <div key={e.id} style={{
                    position: "absolute",
                    left: `calc(50% + ${relX}px)`,
                    top: `calc(50% + ${relY}px)`,
                    width: 6, height: 6, borderRadius: "50%",
                    background: "#ffd94d", border: "1px solid #fff",
                    boxShadow: "0 0 4px #ffd94d", zIndex: 1,
                    transform: "translate(-50%, -50%)"
                  }} />
                );
              })}
            </div>

            {/* Radar Sweep Animation */}
            <div style={{
              position: "absolute", inset: 0,
              background: "conic-gradient(from 0deg, transparent 0%, rgba(201, 184, 255, 0.2) 20%, transparent 21%)",
              animation: "minimapSweep 4s linear infinite",
              pointerEvents: "none"
            }} />
          </div>

          <style>{`
            @keyframes minimapSweep { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
          `}</style>


          {/* Zoom Controls Overlayed on Minimap */}
          <div style={{
            position: "absolute", bottom: 10, right: 10,
            display: "flex", flexDirection: "column", gap: 4, zIndex: 10
          }}>
            <button
              onClick={() => setZoom(z => Math.min(1.5, z + 0.15))}
              style={{
                width: 26, height: 26, borderRadius: 6,
                background: "rgba(20, 10, 30, 0.9)", border: "1px solid rgba(201, 184, 255, 0.4)",
                color: "#c9b8ff", fontSize: 16, fontWeight: 900, cursor: "pointer",
                display: "grid", placeItems: "center", padding: 0
              }}
            >+</button>
            <button
              onClick={() => setZoom(z => Math.max(0.4, z - 0.15))}
              style={{
                width: 26, height: 26, borderRadius: 6,
                background: "rgba(20, 10, 30, 0.9)", border: "1px solid rgba(201, 184, 255, 0.4)",
                color: "#c9b8ff", fontSize: 16, fontWeight: 900, cursor: "pointer",
                display: "grid", placeItems: "center", padding: 0
              }}
            >-</button>
          </div>

          {/* Vertical Side Menu */}
          <div style={{
            display: "flex", flexDirection: "column", gap: 8,
            background: "rgba(20, 10, 30, 0.8)", 
            borderRadius: 24, width: 70,
            padding: "8px", border: "1px solid rgba(201, 184, 255, 0.2)",
            boxShadow: "0 8px 24px rgba(0,0,0,0.6)",
            backdropFilter: "blur(4px)"
          }}>
            {([
              { id: "world", label: "Mundo", icon: "🗺️", color: "#60a5fa" },
              { id: "ranking", label: "Ranking", icon: "🏆", color: "#ffd94d" },
              { id: "wiki", label: "Wiki", icon: "📖", color: "#a855f7" },
              { id: "config", label: "Config", icon: "⚙️", color: "#a8a0b8" }
            ] as const).map(item => (
              <button
                key={item.id}
                onClick={() => {
                  if (item.id === "ranking") setRankOpen(true);
                  else if (item.id === "world") setWorldMapOpen(true);
                  else if (item.id === "wiki") setTab("wiki");
                  else if (item.id === "config") setTab("melhorias");
                }}
                style={{
                  width: 54, height: 54, borderRadius: 14,
                  background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
                  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                  cursor: "pointer", gap: 2, transition: "transform 0.2s"
                }}
                onMouseEnter={e => e.currentTarget.style.transform = "scale(1.05)"}
                onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
              >
                <span style={{ fontSize: 20 }}>{item.icon}</span>
                <span style={{ fontSize: 7, fontWeight: 900, color: item.color, letterSpacing: 0.5 }}>{item.label.toUpperCase()}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ============ MAIN GAME AREA (Battle/Explore) ============ */}
        <div style={{ position: "absolute", inset: 0, zIndex: 1, overflow: "hidden" }}>
          <div style={{
            position: "relative",
            width: WORLD_W,
            height: WORLD_H,
            transform: `scale(${zoom})`,
            transformOrigin: `${(trainerPos.x / WORLD_W) * 100}% ${(trainerPos.y / WORLD_H) * 100}%`,
            transition: "transform 0.3s ease-in-out",
            background: `url(${IDLE_MAPS[idle.currentMap]?.bg || idleArenaUrl})`,
            backgroundSize: "cover",
            imageRendering: "pixelated"
          }}>
            {/* Background tiling to prevent gaps when zooming out */}
            <div style={{
              position: "absolute",
              inset: -2000,
              zIndex: -1,
              background: `url(${IDLE_MAPS[idle.currentMap]?.bg || idleArenaUrl})`,
              backgroundSize: "600px", 
              opacity: 0.2,
              filter: "blur(4px)"
            }} />
            
            {renderBattle()}
          </div>
        </div>
      </div>



      {rankOpen && createPortal(
        <div
          onClick={() => setRankOpen(false)}
          style={{
            position: "fixed", inset: 0,
            background: "radial-gradient(ellipse at center, rgba(30,15,50,0.85), rgba(0,0,0,0.92))",
            display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 2147483647, padding: 16,
            backdropFilter: "blur(6px)",
            WebkitBackdropFilter: "blur(6px)",
            fontFamily: "inherit",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "min(680px, 96vw)", maxHeight: "90vh", display: "flex", flexDirection: "column",
              background:
                "radial-gradient(ellipse at top, rgba(255,60,80,0.18), transparent 60%), linear-gradient(180deg, #140a24 0%, #1c1030 45%, #2a1642 100%)",
              border: "2px solid transparent",
              borderRadius: 18,
              backgroundClip: "padding-box",
              boxShadow:
                "0 25px 80px rgba(0,0,0,0.9), 0 0 60px rgba(255,214,80,0.28), 0 0 40px rgba(255,60,80,0.25), inset 0 1px 0 rgba(255,255,255,0.08)",
              color: "#ffe9a8",
              overflow: "hidden",
              position: "relative",
            }}
          >
            <div style={{
              position: "absolute", inset: 0, borderRadius: 18, pointerEvents: "none",
              background: "linear-gradient(135deg, #ffd94d 0%, #ff2a4d 50%, #ffd94d 100%)",
              padding: 2, WebkitMask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
              WebkitMaskComposite: "xor", maskComposite: "exclude",
            }} />

            <div style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "18px 20px",
              background: "linear-gradient(180deg, rgba(255,214,80,0.22) 0%, rgba(255,60,80,0.12) 60%, rgba(0,0,0,0.15) 100%)",
              borderBottom: "1px solid rgba(255,214,80,0.35)",
              position: "relative",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <img
                  src={assetUrlFromJson(rankMedalsRubyAsset)}
                  alt=""
                  width={56}
                  height={56}
                  style={{ filter: "drop-shadow(0 0 10px rgba(255,60,80,0.6)) drop-shadow(0 0 6px rgba(255,214,80,0.5))" }}
                />
                <div>
                  <div style={{
                    fontWeight: 900, fontSize: 20, letterSpacing: 1.2,
                    background: "linear-gradient(90deg,#ffd94d,#ffb347,#ff5577,#ffd94d)",
                    backgroundSize: "200% 100%",
                    WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                    animation: "shimmerRank 4s linear infinite",
                  }}>RANKING GLOBAL</div>
                  <div style={{ fontSize: 10, opacity: 0.75, color: "#ffd8a0", letterSpacing: 0.5 }}>
                    🏆 TOP 30 · {rankMode === "craft" ? "🔷 Cristal Prisma" : "🎓 Nível Treinador"} · dados ao vivo
                  </div>
                </div>
              </div>

              <div
                title="O ranking global é congelado e atualiza a cada 2 horas"
                      style={{
                        background: "rgba(120,220,255,0.08)", border: "1px solid rgba(120,220,255,0.25)",
                        color: "#9fd8ee", fontSize: 12, height: 34, padding: "0 12px",
                        borderRadius: 10, display: "flex", alignItems: "center", gap: 6, fontWeight: 800,
                        marginRight: 8,
                      }}
                    >{rankLoading ? "⏳ carregando…" : "🕒 Atualiza a cada 2h"}</div>
                    <button
                      onClick={() => setRankOpen(false)}
                      style={{
                        background: "rgba(255,214,80,0.12)", border: "1px solid rgba(255,214,80,0.4)",
                        color: "#ffe9a8", cursor: "pointer", fontSize: 18, width: 34, height: 34,
                        borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center",
                      }}
                    >×</button>

                  </div>
                  <style>{`@keyframes shimmerRank { 0%{background-position:0% 50%} 100%{background-position:200% 50%} }`}</style>

                  {/* Tabs: Treinador vs Cristal Prisma */}
                  <div style={{
                    display: "flex", gap: 8, padding: "12px 16px 0",
                    borderBottom: "1px solid rgba(255,214,80,0.15)",
                  }}>
                    {([
                      { id: "trainer" as const, label: "Nível Treinador", icon: "🎓" },
                      { id: "craft" as const, label: "Cristal Prisma", icon: null },
                    ]).map((tab) => {
                      const active = rankMode === tab.id;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => setRankMode(tab.id)}
                          style={{
                            display: "flex", alignItems: "center", gap: 6,
                            padding: "8px 14px",
                            borderTopLeftRadius: 10, borderTopRightRadius: 10,
                            borderBottomLeftRadius: 0, borderBottomRightRadius: 0,
                            border: `1px solid ${active ? "rgba(255,214,80,0.6)" : "rgba(255,255,255,0.08)"}`,
                            borderBottom: "none",
                            background: active
                              ? "linear-gradient(180deg, rgba(255,214,80,0.28), rgba(255,60,80,0.14))"
                              : "rgba(255,255,255,0.03)",
                            color: active ? "#fff2b8" : "#c8b8d0",
                            fontWeight: 900, fontSize: 12, letterSpacing: 0.5,
                            cursor: "pointer",
                            boxShadow: active ? "0 -2px 10px rgba(255,214,80,0.25)" : "none",
                          }}
                        >
                          {tab.id === "craft" ? (
                            <img src={assetUrlFromJson(iconFragmentCrystal)} alt="" width={16} height={16} style={{ imageRendering: "pixelated", filter: active ? "drop-shadow(0 0 6px rgba(180,220,255,0.9))" : "none" }} />
                          ) : (
                            <span style={{ fontSize: 14 }}>{tab.icon}</span>
                          )}
                          {tab.label}
                        </button>
                      );
                    })}
                  </div>

                  {/* List */}
                  <div style={{ overflow: "auto", padding: 14, flex: 1 }}>
                    {rankLoading ? (
                      <div style={{ textAlign: "center", padding: 40, opacity: 0.7 }}>Carregando ranking…</div>
                    ) : rankRows.length === 0 ? (
                      <div style={{ textAlign: "center", padding: 40, opacity: 0.7 }}>Nenhum treinador encontrado.</div>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        {rankRows.slice(0, 30).map((r, i) => {
                          const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`;
                          const topColor = i === 0 ? "#ffd94d" : i === 1 ? "#e8e8e8" : i === 2 ? "#f0a44a" : "#ffe9a8";
                          const mainVal = rankMode === "craft" ? r.craft_points : r.trainer_level;
                          const mainLabel = rankMode === "craft" ? "Cristal Prisma" : "Treinador Lv";
                          const isMe = !!identity?.id && r.id === identity.id;
                          const isTop30 = i < 30;
                          const rubyAmount = i === 0 ? 15 : i === 1 ? 13 : i === 2 ? 11 : i === 3 ? 7 : 3;
                          const rubyFlag = `RANKED_RUBY_KEY_${rankMode.toUpperCase()}`;
                          const rubyModeLabel = rankMode === "craft" ? "Cristal Prisma" : "Treinador";
                          const alreadyClaimed = !!idle.redeemedCodes?.[rubyFlag];
                          // 🔒 Coleta de Chave Ruby bloqueada globalmente (evento encerrado)
                          const rubyClaimLocked = true;
                          const canClaim = false;
                          const claimRubyKey = () => {
                            pushChat("🔒 Coleta de Chave Ruby está temporariamente desativada.", "info");
                          };

                          // Estilos por tier
                          const tierBg =
                            i === 0 ? "linear-gradient(90deg, rgba(255,214,80,0.35) 0%, rgba(255,180,60,0.12) 55%, rgba(0,0,0,0.15) 100%)"
                            : i === 1 ? "linear-gradient(90deg, rgba(220,220,230,0.28) 0%, rgba(180,190,210,0.08) 55%, rgba(0,0,0,0.15) 100%)"
                            : i === 2 ? "linear-gradient(90deg, rgba(240,164,74,0.28) 0%, rgba(200,120,60,0.08) 55%, rgba(0,0,0,0.15) 100%)"
                            : i < 10 ? "linear-gradient(90deg, rgba(255,80,110,0.10), rgba(255,255,255,0.02))"
                            : "rgba(255,255,255,0.03)";
                          const tierBorder =
                            i === 0 ? "rgba(255,214,80,0.7)"
                            : i === 1 ? "rgba(220,220,230,0.55)"
                            : i === 2 ? "rgba(240,164,74,0.55)"
                            : i < 10 ? "rgba(255,80,110,0.25)"
                            : "rgba(255,255,255,0.06)";
                          const tierGlow =
                            i === 0 ? "0 0 18px rgba(255,214,80,0.35), inset 0 1px 0 rgba(255,255,255,0.1)"
                            : i === 1 ? "0 0 14px rgba(220,220,230,0.25)"
                            : i === 2 ? "0 0 14px rgba(240,164,74,0.30)"
                            : "none";

                          return (
                            <div key={r.id} style={{
                              display: "grid",
                              gridTemplateColumns: "54px 1fr auto",
                              alignItems: "center",
                              gap: 12,
                              padding: i < 3 ? "12px 14px" : "10px 12px",
                              background: tierBg,
                              border: `1px solid ${tierBorder}`,
                              borderRadius: 12,
                              boxShadow: tierGlow,
                              outline: isMe ? "2px solid rgba(125,255,155,0.7)" : "none",
                              outlineOffset: isMe ? -2 : 0,
                              transition: "transform 0.15s",
                            }}>
                              <div style={{
                                fontWeight: 900,
                                color: topColor,
                                fontSize: i < 3 ? 26 : 15,
                                textAlign: "center",
                                textShadow: i < 3 ? `0 0 10px ${topColor}` : "none",
                              }}>{medal}</div>

                              <div style={{ overflow: "hidden", minWidth: 0 }}>
                                <div style={{ fontWeight: 700, fontSize: 14, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                  {r.name}
                                  {isMe && <span style={{ marginLeft: 6, fontSize: 10, color: "#7dff9b" }}>(você)</span>}
                                  {r.guild_name && <span style={{ marginLeft: 6, fontSize: 10, opacity: 0.75, color: "#a5d0ff" }}>[{r.guild_name}]</span>}
                                </div>
                                <div style={{ fontSize: 10, opacity: 0.7, display: "flex", gap: 8, flexWrap: "wrap" }}>
                                  <span style={{ textTransform: "capitalize" }}>
                                    ⭐ {(r.leader_species ?? "—").replace(/_/g, " ")}
                                  </span>
                                  <span>🎓 Tr {r.trainer_level}</span>
                                  {rankMode === "craft" && (
                                    <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
                                      <img src={assetUrlFromJson(iconFragmentCrystal)} alt="" width={12} height={12} style={{ imageRendering: "pixelated" }} />
                                      {r.craft_points}
                                    </span>
                                  )}
                                </div>
                                {isTop30 && isMe && (
                                  <div style={{ marginTop: 6 }}>
                                    <button
                                      onClick={claimRubyKey}
                                      disabled={!canClaim}
                                      style={{
                                        padding: "6px 12px",
                                        borderRadius: 8,
                                        border: "1px solid rgba(255,60,80,0.55)",
                                        background: canClaim
                                          ? "linear-gradient(90deg,#8b0018,#ff2a4d)"
                                          : "rgba(90,20,30,0.5)",
                                        color: "#fff",
                                        fontWeight: 800,
                                        fontSize: 11,
                                        letterSpacing: 0.5,
                                        cursor: canClaim ? "pointer" : "not-allowed",
                                        boxShadow: canClaim ? "0 0 12px rgba(255,60,80,0.55)" : "none",
                                        opacity: canClaim ? 1 : 0.7,
                                      }}
                                    >
                                      {rubyClaimLocked ? "🔒 Chave Ruby indisponível" : (alreadyClaimed ? `🔴 Chave Ruby (${rubyModeLabel}) coletada` : `🔴 Coletar ${rubyAmount}× Chave Ruby (Top ${i + 1} · ${rubyModeLabel})`)}
                                    </button>
                                  </div>
                                )}
                              </div>
                              <div style={{ textAlign: "right" }}>
                                <div style={{ fontSize: 9, opacity: 0.6, textTransform: "uppercase", letterSpacing: 0.5 }}>{mainLabel}</div>
                                <div style={{ fontWeight: 900, fontSize: 20, color: topColor, lineHeight: 1, display: "inline-flex", alignItems: "center", gap: 6, justifyContent: "flex-end" }}>
                                  {rankMode === "craft" && (
                                    <img src={assetUrlFromJson(iconFragmentCrystal)} alt="" width={20} height={20} style={{ imageRendering: "pixelated", filter: "drop-shadow(0 0 6px rgba(180,220,255,0.8))" }} />
                                  )}
                                  {mainVal}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>,
              document.body
            )}
        <div className="legacy-world-layer" style={{



































          position: "absolute",
          left: 0, top: 0,
          width: WORLD_W, height: WORLD_H,
          transform: `translate3d(${-renderCamX * zoom}px, ${-renderCamY * zoom}px, 0) scale(${zoom})`,
          transformOrigin: "0 0",
          zIndex: 1,
          pointerEvents: "none",
        }}>



            {/* Painel de Colmeia — posicionar Beedrills p/ produzir Incenso de Mel */}
            {honeyShop && (() => {
              const cocoonKey = honeyShop.cocoonKey;
              const hive = idle.hives?.[cocoonKey] ?? { slots: Array(HIVE_SLOTS_PER_COCOON).fill(null) };
              const slots = hive.slots ?? [];
              const assigned = uidsAssignedToHives();
              const beedrills = (idle.collection ?? []).filter((c) => c.species === "beedrill");
              const availableBeedrills = beedrills.filter((b) => !assigned.has(b.uid));
              const now = Date.now();

              const assignBeedrill = (slotIdx: number, uid: string) => {
                setIdle((s) => {
                  const cur = s.hives?.[cocoonKey] ?? { slots: Array(HIVE_SLOTS_PER_COCOON).fill(null) };
                  const newSlots = [...cur.slots];
                  while (newSlots.length < HIVE_SLOTS_PER_COCOON) newSlots.push(null);
                  newSlots[slotIdx] = { uid, startedAt: Date.now() };
                  return { ...s, hives: { ...(s.hives ?? {}), [cocoonKey]: { slots: newSlots } } };
                });
                pushChat("🐝 Beedrill posicionado na colmeia! Produção iniciada (10 min).", "info");
              };
              const removeBeedrill = (slotIdx: number) => {
                setIdle((s) => {
                  const cur = s.hives?.[cocoonKey];
                  if (!cur) return s;
                  const newSlots = [...cur.slots];
                  newSlots[slotIdx] = null;
                  return { ...s, hives: { ...(s.hives ?? {}), [cocoonKey]: { slots: newSlots } } };
                });
              };
              const collectSlot = (slotIdx: number) => {
                const slot = slots[slotIdx];
                if (!slot) return;
                const elapsed = Date.now() - slot.startedAt;
                if (elapsed < HIVE_PRODUCTION_MS) return;
                const entry = beedrills.find((b) => b.uid === slot.uid);
                const rare = isRareTierPokemon(entry?.rarity);
                const itemId = rare ? "incenso_mel_raro" : "incenso_mel";
                setIdle((s) => {
                  const cur = s.hives?.[cocoonKey];
                  if (!cur) return s;
                  const newSlots = [...cur.slots];
                  newSlots[slotIdx] = { uid: slot.uid, startedAt: Date.now() }; // reinicia ciclo
                  return {
                    ...s,
                    items: { ...s.items, [itemId]: (s.items[itemId] ?? 0) + HIVE_YIELD_PER_BEEDRILL },
                    hives: { ...(s.hives ?? {}), [cocoonKey]: { slots: newSlots } },
                  };
                });
                pushChat(`🍯 Coletou ${HIVE_YIELD_PER_BEEDRILL}x ${rare ? "Incenso Raro ✨" : "Incenso de Mel"}!`, "cap");
              };

              const [picker, setPicker] = [] as unknown as [number | null, (v: number | null) => void]; // placeholder: usa state controlado abaixo
              return (
                <div
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    position: "absolute",
                    left: Math.max(20, Math.min(WORLD_W - 340, honeyShop.x - 160)),
                    top: Math.max(20, honeyShop.y - 60),
                    width: 320,
                    background: "linear-gradient(180deg, #2a1a0a, #3d2410)",
                    border: "2px solid #ffd94d",
                    borderRadius: 12,
                    boxShadow: "0 8px 32px rgba(0,0,0,0.7), 0 0 20px rgba(255,214,80,0.35)",
                    padding: 14,
                    zIndex: 999999,
                    color: "#ffe9a8",
                    fontFamily: "inherit",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <div style={{ fontWeight: 800, fontSize: 15, color: "#ffd94d" }}>🐝 Colmeia de Beedrill</div>
                    <button onClick={() => setHoneyShop(null)} style={{ background: "transparent", border: "none", color: "#ffe9a8", cursor: "pointer", fontSize: 18 }}>×</button>
                  </div>
                  <div style={{ fontSize: 11, lineHeight: 1.4, marginBottom: 10, opacity: 0.85 }}>
                    Coloque até <b>3 Beedrills</b> nesta colmeia. Cada um produz <b>2 Incensos</b> a cada <b>10 min</b>.
                    Beedrills <b>Épicos+</b> geram <b>Incenso Raro</b> (dobra o bônus e vende por mais).
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {Array.from({ length: HIVE_SLOTS_PER_COCOON }).map((_, i) => {
                      const slot = slots[i] ?? null;
                      if (!slot) {
                        return (
                          <div key={`hslot-${i}`} style={{ border: "1px dashed rgba(255,214,80,0.4)", borderRadius: 8, padding: 8, background: "rgba(0,0,0,0.25)" }}>
                            <div style={{ fontSize: 11, opacity: 0.75, marginBottom: 6 }}>Slot {i + 1} — vazio</div>
                            {availableBeedrills.length === 0 ? (
                              <div style={{ fontSize: 11, color: "#c8b8d0" }}>Nenhum Beedrill disponível.</div>
                            ) : (
                              <select
                                onChange={(e) => { if (e.target.value) assignBeedrill(i, e.target.value); }}
                                defaultValue=""
                                style={{
                                  width: "100%", padding: "6px 8px", borderRadius: 6,
                                  background: "#1a0f05", color: "#ffe9a8",
                                  border: "1px solid rgba(255,214,80,0.5)", fontSize: 12,
                                }}
                              >
                                <option value="">+ Selecionar Beedrill…</option>
                                {availableBeedrills.map((b) => (
                                  <option key={b.uid} value={b.uid}>
                                    Beedrill Lv.{b.level} · {b.rarity}
                                  </option>
                                ))}
                              </select>
                            )}
                          </div>
                        );
                      }
                      const entry = beedrills.find((b) => b.uid === slot.uid);
                      const elapsed = now - slot.startedAt;
                      const pct = Math.min(1, elapsed / HIVE_PRODUCTION_MS);
                      const remainMs = Math.max(0, HIVE_PRODUCTION_MS - elapsed);
                      const mm = Math.floor(remainMs / 60000);
                      const ss = String(Math.floor((remainMs % 60000) / 1000)).padStart(2, "0");
                      const ready = pct >= 1;
                      const rare = isRareTierPokemon(entry?.rarity);
                      return (
                        <div key={`hslot-${i}`} style={{ border: `1px solid ${rare ? "#ff97e1" : "rgba(255,214,80,0.6)"}`, borderRadius: 8, padding: 8, background: "rgba(0,0,0,0.35)" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                            <img src={beedrillGif} alt="Beedrill" style={{ width: 34, height: 34, imageRendering: "pixelated" }} />
                            <div style={{ flex: 1, fontSize: 12 }}>
                              <div style={{ fontWeight: 700 }}>Beedrill Lv.{entry?.level ?? "?"}</div>
                              <div style={{ fontSize: 10, opacity: 0.8, color: rare ? "#ff97e1" : "#ffe9a8" }}>
                                {entry?.rarity ?? "?"}{rare ? " · produz raro ✨" : ""}
                              </div>
                            </div>
                            <button
                              onClick={() => removeBeedrill(i)}
                              title="Remover"
                              style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.25)", color: "#ffe9a8", borderRadius: 6, cursor: "pointer", fontSize: 10, padding: "3px 6px" }}
                            >
                              Remover
                            </button>
                          </div>
                          <div style={{ height: 8, background: "rgba(0,0,0,0.5)", borderRadius: 4, overflow: "hidden", marginBottom: 6 }}>
                            <div style={{ width: `${pct * 100}%`, height: "100%", background: ready ? "linear-gradient(90deg,#5ec26a,#8bffb0)" : "linear-gradient(90deg,#ffd94d,#d99b1a)", transition: "width 0.4s linear" }} />
                          </div>
                          {ready ? (
                            <button
                              onClick={() => collectSlot(i)}
                              style={{ width: "100%", padding: "8px 10px", background: "linear-gradient(180deg,#5ec26a,#3fa050)", color: "#0b0510", border: "none", borderRadius: 6, fontWeight: 800, cursor: "pointer", fontSize: 12 }}
                            >
                              🍯 Coletar {HIVE_YIELD_PER_BEEDRILL}x {rare ? "Incenso Raro ✨" : "Incenso"}
                            </button>
                          ) : (
                            <div style={{ fontSize: 11, textAlign: "center", opacity: 0.85 }}>
                              ⏳ {mm}:{ss} restantes
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <div style={{ fontSize: 10, opacity: 0.7, marginTop: 8, textAlign: "center" }}>
                    Estoque: {idle.items.incenso_mel ?? 0}x Mel · {idle.items.incenso_mel_raro ?? 0}x Raro
                  </div>
                </div>
              );
            })()}



            {/* Prédios do mundo — Laboratório e Lar (SVG estilizado) */}
            {visibleBuildings.map((b) => {
              const active = nearBuilding === b.key;
              return (
                <div
                  key={`bld-${b.key}`}
                  style={{
                    position: "absolute",
                    left: b.x - b.w / 2,
                    top: b.y - b.h + 8,
                    width: b.w, height: b.h,
                    zIndex: Math.round(b.y),
                    pointerEvents: "none",
                    filter: active
                      ? `drop-shadow(0 0 14px ${b.color}) drop-shadow(0 4px 4px rgba(0,0,0,0.55))`
                      : "drop-shadow(0 4px 4px rgba(0,0,0,0.55))",
                    transition: "filter 180ms ease",
                  }}
                >
                  <img
                    src={b.key === "lab" ? houseBankImg : b.key === "gym" ? houseGymImg : houseLarImg}
                    alt={b.label}
                    width={b.w}
                    height={b.h}
                    style={{
                      display: "block",
                      width: b.w,
                      height: b.h,
                      imageRendering: "pixelated",
                      userSelect: "none",
                      // Tinge o telhado de azul para a Casa Azul
                      filter: b.key === "azul"
                        ? "hue-rotate(180deg) saturate(1.4) brightness(1.05)"
                        : undefined,
                    }}
                    draggable={false}
                  />
                  {/* Placa flutuante */}
                  <div style={{
                    position: "absolute", top: -22, left: "50%", transform: "translateX(-50%)",
                    background: "rgba(11,5,16,0.9)", color: b.color,
                    border: `1px solid ${b.color}`, borderRadius: 4,
                    padding: "2px 8px", fontSize: 11, fontWeight: 800, letterSpacing: 1,
                    whiteSpace: "nowrap",
                  }}>
                    {b.emoji} {b.label.toUpperCase()}
                  </div>
                </div>
              );
            })}




            {/* Portais no mundo — pontos de viagem visíveis */}
            {(() => {
              const lv = idle.trainerLevel ?? 1;
              return WORLD_PORTALS.filter(p => p.from === idle.currentMap).map((p) => {
                const locked = !!(p.reqLevel && lv < p.reqLevel);
                return (
                  <div
                    key={p.key}
                    onClick={() => {
                      playClick();
                      enterWorldPortal(p);
                    }}
                    style={{
                      position: "absolute",
                      left: p.x - 44, top: p.y - 44,
                      width: 88, height: 88,
                      borderRadius: "50%",
                      background: locked
                        ? `radial-gradient(circle, #6b728088 0%, #33415544 45%, transparent 75%)`
                        : `radial-gradient(circle, ${p.color}cc 0%, ${p.color}55 45%, transparent 75%)`,
                      border: `3px solid ${locked ? "#94a3b8" : p.color}`,
                      boxShadow: locked ? `0 0 12px #0008` : `0 0 24px ${p.color}, inset 0 0 18px ${p.color}88`,
                      cursor: "pointer",
                      zIndex: Math.round(p.y),
                      display: "flex", alignItems: "center", justifyContent: "center",
                      animation: locked ? "none" : "pulse 1.6s ease-in-out infinite",
                      opacity: locked ? 0.75 : 1,
                    }}
                    title={locked ? `Bloqueado — requer Treinador Nv ${p.reqLevel}` : `Ir para ${p.label}`}
                  >
                    <div style={{
                      fontSize: 11, fontWeight: 800, color: "#fff",
                      textShadow: "0 1px 3px rgba(0,0,0,0.9)",
                      textAlign: "center", padding: "0 4px", lineHeight: 1.1,
                    }}>
                      {locked ? "🔒" : "🌀"}<br/>{p.label}
                    </div>
                    {/* Balão-guia branco (estilo speech bubble) */}
                    <div style={{
                      position: "absolute", bottom: "calc(100% + 14px)", left: "50%", transform: "translateX(-50%)",
                      background: "linear-gradient(180deg, #ffffff 0%, #f7f5ef 100%)",
                      color: "#1f2937",
                      border: `2px solid ${locked ? "#ef4444" : "#e5c76b"}`,
                      borderRadius: 10,
                      padding: "6px 10px",
                      fontSize: 11, fontWeight: 800,
                      whiteSpace: "nowrap", letterSpacing: 0.3,
                      boxShadow: "0 4px 14px rgba(0,0,0,0.45), inset 0 1px 0 #fff",
                      textAlign: "center", lineHeight: 1.25,
                      pointerEvents: "none",
                    }}>
                      <div style={{ fontSize: 9, color: "#6b7280", letterSpacing: 0.6, marginBottom: 2 }}>
                        {p.reqLevel ? (locked ? "🔒 PRÓXIMO MAPA" : "✓ MAPA LIBERADO") : "↩ RETORNO"}
                      </div>
                      <div style={{ color: "#111827", fontSize: 12 }}>{p.label}</div>
                      {p.reqLevel && (
                        <div style={{ fontSize: 10, color: locked ? "#b91c1c" : "#15803d", marginTop: 2 }}>
                          {locked ? `Libera em Treinador Nv ${p.reqLevel} • faltam ${p.reqLevel - lv}` : `Treinador Nv ${p.reqLevel} ✓`}
                        </div>
                      )}
                      {/* Rabinho do balão */}
                      <div style={{
                        position: "absolute", top: "100%", left: "50%", transform: "translateX(-50%)",
                        width: 0, height: 0,
                        borderLeft: "7px solid transparent",
                        borderRight: "7px solid transparent",
                        borderTop: `8px solid ${locked ? "#ef4444" : "#e5c76b"}`,
                      }} />
                      <div style={{
                        position: "absolute", top: "100%", left: "50%", transform: "translate(-50%, -2px)",
                        width: 0, height: 0,
                        borderLeft: "6px solid transparent",
                        borderRight: "6px solid transparent",
                        borderTop: "7px solid #ffffff",
                      }} />
                    </div>
                  </div>
                );
              });
            })()}


            {/* 🧙 NPC Trocador — presente em todos os mapas, canto acessível */}
            {(() => {
              const npcX = 260, npcY = 260;
              return (
                <div
                  onClick={() => { playClick(); setWorldTraderOpen(true); }}
                  title="Trocador — Troque Pokémon da coleção por Orbs de XP"
                  style={{
                    position: "absolute",
                    left: npcX - 40, top: npcY - 60,
                    width: 80, height: 100,
                    cursor: "pointer",
                    zIndex: Math.round(npcY),
                    display: "flex", flexDirection: "column", alignItems: "center",
                    filter: "drop-shadow(0 4px 6px rgba(0,0,0,0.6))",
                  }}
                >
                  <div style={{
                    position: "absolute", top: -18, left: "50%", transform: "translateX(-50%)",
                    background: "linear-gradient(180deg,#3a2a5c,#1a1030)",
                    border: "1px solid #ffd94d", color: "#ffd94d",
                    borderRadius: 999, padding: "2px 8px",
                    fontSize: 10, fontWeight: 900, whiteSpace: "nowrap",
                    boxShadow: "0 0 10px rgba(255,217,77,0.5)",
                    animation: "pulse 1.6s ease-in-out infinite",
                  }}>✦ TROCADOR</div>
                  <img
                    src={npcTraderUrl}
                    alt="NPC Trocador"
                    width={80} height={100}
                    style={{ width: 80, height: 100, imageRendering: "pixelated", objectFit: "contain" }}
                  />
                  <div style={{
                    position: "absolute", bottom: -6, left: "50%", transform: "translateX(-50%)",
                    width: 60, height: 8, borderRadius: "50%",
                    background: "radial-gradient(ellipse, rgba(255,217,77,0.55), transparent 70%)",
                  }} />
                </div>
              );
            })()}

            {/* 👑 NPC Governante — visível apenas no Salão do Governante */}
            {idle.currentMap === "governante_hall" && (() => {
              const npcX = WORLD_W / 2, npcY = WORLD_H / 2 - 40;
              return (
                <div
                  onClick={() => { playClick(); setGovernanteOpen(true); }}
                  title="Governante — Entregue Cartas da Incubadora para receber Black Mitic Plus Egg"
                  style={{
                    position: "absolute",
                    left: npcX - 60, top: npcY - 90,
                    width: 120, height: 160,
                    cursor: "pointer",
                    zIndex: Math.round(npcY),
                    display: "flex", flexDirection: "column", alignItems: "center",
                    filter: "drop-shadow(0 6px 10px rgba(0,0,0,0.7))",
                  }}
                >
                  <div style={{
                    position: "absolute", top: -22, left: "50%", transform: "translateX(-50%)",
                    background: "linear-gradient(180deg,#3a2a5c,#1a1030)",
                    border: "1px solid #ffd44a", color: "#ffd44a",
                    borderRadius: 999, padding: "3px 10px",
                    fontSize: 11, fontWeight: 900, whiteSpace: "nowrap",
                    boxShadow: "0 0 12px rgba(255,212,74,0.7)",
                    animation: "pulse 1.6s ease-in-out infinite",
                  }}>👑 GOVERNANTE</div>
                  <img
                    src={npcGovernanteUrl}
                    alt="Governante"
                    width={120} height={160}
                    style={{ width: 120, height: 160, imageRendering: "pixelated", objectFit: "contain" }}
                  />
                  <div style={{
                    position: "absolute", bottom: -8, left: "50%", transform: "translateX(-50%)",
                    width: 90, height: 12, borderRadius: "50%",
                    background: "radial-gradient(ellipse, rgba(255,212,74,0.6), transparent 70%)",
                  }} />
                </div>
              );
            })()}






            {/* ❄️ NPC Ancião Glacial — visível apenas no Santuário Glacial */}
            {idle.currentMap === "santuario_glacial" && (() => {
              const npcX = WORLD_W / 2, npcY = WORLD_H / 2 - 40;
              return (
                <div
                  onClick={() => { playClick(); setAnciaoOpen(true); }}
                  title="Ancião Glacial — Ritual de Reset de Temporada"
                  style={{
                    position: "absolute",
                    left: npcX - 60, top: npcY - 90,
                    width: 120, height: 160,
                    cursor: "pointer",
                    zIndex: Math.round(npcY),
                    display: "flex", flexDirection: "column", alignItems: "center",
                    filter: "drop-shadow(0 6px 12px rgba(125,211,252,0.6))",
                  }}
                >
                  <div style={{
                    position: "absolute", top: -22, left: "50%", transform: "translateX(-50%)",
                    background: "linear-gradient(180deg,#1e3a8a,#0f172a)",
                    border: "1px solid #c9b8ff", color: "#c9b8ff",
                    borderRadius: 999, padding: "3px 12px",
                    fontSize: 11, fontWeight: 900, whiteSpace: "nowrap",
                    boxShadow: "0 0 12px rgba(125,211,252,0.5)",
                    animation: "pulse 1.6s ease-in-out infinite",
                  }}>❄️ ANCIÃO GLACIAL</div>
                  <img
                    src={npcAnciaoGlacialUrl}
                    alt="Ancião Glacial"
                    width={120} height={160}
                    style={{ width: 120, height: 160, imageRendering: "pixelated", objectFit: "contain" }}
                  />
                  <div style={{
                    position: "absolute", bottom: -8, left: "50%", transform: "translateX(-50%)",
                    width: 100, height: 14, borderRadius: "50%",
                    background: "radial-gradient(ellipse, rgba(125,211,252,0.6), transparent 70%)",
                  }} />
                </div>
              );
            })()}

            {/* Inimigos espalhados pelo mapa */}
            {enemies.map((e) => {
              const showSp: Species = (e.disguise && !e.revealed) ? e.disguise : e.sp;
              const src = GIF[showSp];
              if (!src) return null;
              const camouflaged = !!(e.disguise && !e.revealed);
              const dead = e.hp <= 0;
              const face = e.face ?? "left";
              const sx = face === "left" ? 1 : -1;
              const scale = (e.sp === "dragonite" || e.sp === "charizard") ? 1.7 : (e.sp === "golem" ? 1.15 : 1);
              const size = Math.round(46 * scale);
              // Cristal + aura por raridade — cristal vermelho = raro+, verde = comum/incomum
              const rarityAura: Record<Rarity, string> = {
                common: "rgba(200,200,200,0.55)",
                uncommon: "rgba(94,194,106,0.85)",
                rare: "rgba(107,212,255,0.95)",
                epic: "rgba(192,132,252,0.95)",
                legendary: "rgba(245,207,107,1)",
                mythic: "rgba(255,107,61,1)",
                mythic_shiny: "rgba(255,151,225,1)",
              };
              const auraColor = rarityAura[e.rarity];
              const isRareUp = e.rarity !== "common" && e.rarity !== "uncommon";
              const crystal = isRareUp ? "🔴" : "🟢";
              const showAura = e.rarity !== "common" && !camouflaged;
              const auraStrength = e.rarity === "mythic" || e.rarity === "mythic_shiny" ? 22
                : e.rarity === "legendary" ? 18
                : e.rarity === "epic" ? 14
                : e.rarity === "rare" ? 10 : 6;
              // Estrelas por raridade (só aparecem para raro+)
              const rarityStars: Record<Rarity, string> = {
                common: "", uncommon: "",
                rare: "★", epic: "★★",
                legendary: "★★★", mythic: "★★★★", mythic_shiny: "✦★★★★",
              };
              const stars = camouflaged ? "" : rarityStars[e.rarity];
              const starColor = e.rarity === "mythic_shiny" ? "#ff97e1"
                : e.rarity === "mythic" ? "#ff6b3d"
                : e.rarity === "legendary" ? "#f5cf6b"
                : e.rarity === "epic" ? "#c084fc"
                : "#6bd4ff";
              return (
                <div key={e.id}
                  onClick={(ev) => { ev.stopPropagation(); if (!dead) throwBallAt(e.id); }}
                  title="Clique para lançar Pokébola"
                  style={{
                  position: "absolute", left: e.x, top: e.y,
                  width: size, height: size,
                  transform: `translate(-50%, -50%) scaleX(${sx})`,
                  opacity: dead ? 0 : 1,
                  transition: "opacity 400ms, transform 160ms",
                  filter: e.menace
                    ? "drop-shadow(0 0 22px rgba(120,0,180,0.95)) drop-shadow(0 0 44px rgba(0,0,0,0.9)) drop-shadow(0 3px 2px rgba(0,0,0,0.7))"
                    : (showAura
                      ? `drop-shadow(0 0 ${auraStrength}px ${auraColor}) drop-shadow(0 0 ${auraStrength / 2}px ${auraColor}) drop-shadow(0 3px 2px rgba(0,0,0,0.55))`
                      : (e.aggressive ? "drop-shadow(0 0 6px rgba(255,60,60,0.9)) drop-shadow(0 3px 2px rgba(0,0,0,0.55))" : "drop-shadow(0 3px 2px rgba(0,0,0,0.55))")),
                  zIndex: Math.round(e.y),
                  cursor: dead ? "default" : "pointer",
                }}>
                  {e.sp === "lugia" && (
                    <>
                      <div style={{
                        position: "absolute", inset: -60, borderRadius: "50%",
                        background: "radial-gradient(circle, rgba(126,230,255,0.35) 0%, rgba(255,151,225,0.18) 45%, transparent 75%)",
                        filter: "blur(4px)",
                        animation: "pulse 2s ease-in-out infinite",
                        pointerEvents: "none", zIndex: -1,
                      }} />
                      <div style={{
                        position: "absolute", inset: -30, borderRadius: "50%",
                        border: "2px solid rgba(126,230,255,0.7)",
                        boxShadow: "0 0 40px rgba(126,230,255,0.9), inset 0 0 30px rgba(255,151,225,0.7)",
                        animation: "spin 8s linear infinite",
                        pointerEvents: "none", zIndex: -1,
                      }} />
                    </>
                  )}
                  {e.menace && (
                    <>
                      {/* Aura preta com miolo púrpura */}
                      <div style={{
                        position: "absolute", inset: -80, borderRadius: "50%",
                        background: "radial-gradient(circle, rgba(60,0,90,0.55) 0%, rgba(0,0,0,0.75) 45%, transparent 78%)",
                        filter: "blur(6px)",
                        animation: "pulse 1.6s ease-in-out infinite",
                        pointerEvents: "none", zIndex: -1,
                      }} />
                      {/* Anel de estrelas girando */}
                      <div style={{
                        position: "absolute", inset: -46, borderRadius: "50%",
                        border: "2px solid rgba(180,120,255,0.55)",
                        boxShadow: "0 0 30px rgba(0,0,0,0.9), inset 0 0 30px rgba(80,0,120,0.6)",
                        animation: "spin 6s linear infinite",
                        pointerEvents: "none", zIndex: -1,
                      }} />
                      {/* Estrelas orbitando */}
                      {[0,1,2,3,4,5,6,7].map((i) => (
                        <div key={`ms${i}`} style={{
                          position: "absolute", left: "50%", top: "50%",
                          transform: `translate(-50%,-50%) rotate(${i*45}deg) translateY(-46px)`,
                          color: "#e0b3ff", fontSize: 12, fontWeight: 900,
                          textShadow: "0 0 4px #000, 0 0 8px #7a00b8",
                          pointerEvents: "none", zIndex: -1,
                          animation: "pulse 1.2s ease-in-out infinite",
                        }}>✦</div>
                      ))}
                    </>
                  )}
                  <img src={src} alt="" style={{ width: "100%", imageRendering: "pixelated" }} />
                  {e.sp === "raichu" && !camouflaged && (
                    <div style={{
                      position: "absolute", top: -46, left: "50%",
                      transform: `translateX(-50%) scaleX(${sx})`,
                      width: 24, height: 24, borderRadius: "50%",
                      background: "radial-gradient(circle at 50% 40%, #fff4a1 0%, #ffd23f 45%, #b57a00 100%)",
                      border: "2px solid #fff8b8",
                      boxShadow: "0 0 12px rgba(255,220,80,0.95), 0 0 24px rgba(255,220,80,0.6), inset 0 0 6px rgba(255,255,180,0.9)",
                      display: "grid", placeItems: "center",
                      pointerEvents: "none",
                      animation: "pulse 1.1s ease-in-out infinite",
                    }}>
                      <span style={{
                        fontSize: 14, lineHeight: 1, fontWeight: 900,
                        color: "#3a2600",
                        textShadow: "0 0 4px #fff4a1, 0 1px 0 #fff",
                        filter: "drop-shadow(0 0 3px #fff8b8)",
                      }}>⚡</span>
                    </div>
                  )}
                  {e.sp === "rayquaza" && !camouflaged && (
                    <div style={{
                      position: "absolute", top: -46, left: "50%",
                      transform: `translateX(-50%) scaleX(${sx})`,
                      width: 24, height: 24, borderRadius: "50%",
                      background: "radial-gradient(circle at 50% 40%, #b5ffd8 0%, #22c07a 45%, #0a5a3a 100%)",
                      border: "2px solid #d8ffec",
                      boxShadow: "0 0 12px rgba(60,230,150,0.95), 0 0 24px rgba(60,230,150,0.6), inset 0 0 6px rgba(200,255,220,0.9)",
                      display: "grid", placeItems: "center",
                      pointerEvents: "none",
                      animation: "pulse 1.1s ease-in-out infinite",
                    }}>
                      <span style={{
                        fontSize: 14, lineHeight: 1, fontWeight: 900,
                        color: "#062a1a",
                        textShadow: "0 0 4px #b5ffd8, 0 1px 0 #fff",
                        filter: "drop-shadow(0 0 3px #d8ffec)",
                      }}>🐉</span>
                    </div>
                  )}
                  {idle.currentMap === "grass_oddish" && !camouflaged && (e.sp === "dragonite_shiny" || e.sp === "onix_shiny" || e.sp === "riolu") && (
                    <div style={{
                      position: "absolute", top: -46, left: "50%",
                      transform: `translateX(-50%) scaleX(${sx})`,
                      minWidth: 30, height: 22, padding: "0 6px", borderRadius: 11,
                      background: "radial-gradient(circle at 50% 40%, #fff5b8 0%, #ffcf3a 45%, #a86400 100%)",
                      border: "2px solid #fff8c8",
                      boxShadow: "0 0 12px rgba(255,210,80,0.95), 0 0 24px rgba(255,210,80,0.55), inset 0 0 6px rgba(255,255,200,0.9)",
                      display: "grid", placeItems: "center",
                      pointerEvents: "none",
                      animation: "pulse 1.1s ease-in-out infinite",
                    }}>
                      <span style={{
                        fontSize: 11, lineHeight: 1, fontWeight: 900,
                        color: "#3a2600", letterSpacing: 0.5,
                        textShadow: "0 0 4px #fff5b8, 0 1px 0 #fff",
                        filter: "drop-shadow(0 0 3px #fff8c8)",
                      }}>⭐XP</span>
                    </div>
                  )}
                  {e.xpTitle && !camouflaged && (
                    <div style={{
                      position: "absolute", top: -64, left: "50%",
                      transform: `translateX(-50%) scaleX(${sx})`,
                      display: "flex", alignItems: "center", gap: 4,
                      padding: "2px 8px", borderRadius: 999,
                      background: "linear-gradient(180deg, #fff6c0 0%, #ffd23f 45%, #a86a00 100%)",
                      border: "2px solid #fffbe0",
                      boxShadow: "0 0 12px rgba(255,210,80,0.95), 0 0 26px rgba(255,180,40,0.55), inset 0 1px 0 rgba(255,255,255,0.9)",
                      pointerEvents: "none", whiteSpace: "nowrap",
                      animation: "pulse 1.4s ease-in-out infinite",
                    }}>
                      <span style={{
                        fontSize: 10, lineHeight: 1, fontWeight: 900, letterSpacing: 1,
                        color: "#3a2600", textShadow: "0 1px 0 rgba(255,255,255,0.7)",
                      }}>⭐ XP x2</span>
                    </div>
                  )}
                  {e.menace && (
                    <div style={{
                      position: "absolute", top: -52, left: "50%",
                      transform: `translateX(-50%) scaleX(${sx})`,
                      color: "#e0b3ff",
                      fontSize: 12, fontWeight: 900, lineHeight: 1,
                      textShadow: "1px 1px 0 #000, -1px 1px 0 #000, 1px -1px 0 #000, -1px -1px 0 #000, 0 0 10px #7a00b8",
                      whiteSpace: "nowrap", pointerEvents: "none",
                      filter: "drop-shadow(0 0 4px #000)",
                      animation: "pulse 1s ease-in-out infinite",
                    }}>✦✦✦✦✦✦✦✦✦✦<br/><span style={{ fontSize: 9, color: "#ffb3ff" }}>? ? ?</span></div>
                  )}

                  {e.rider && (
                    <div style={{
                      position: "absolute", top: -38, left: "50%",
                      transform: `translateX(-50%) scaleX(${sx})`,
                      color: "#ff5ec7",
                      fontSize: 18, fontWeight: 900, lineHeight: 1,
                      textShadow: "1px 1px 0 #000, -1px 1px 0 #000, 1px -1px 0 #000, -1px -1px 0 #000, 0 0 8px #ff5ec7",
                      whiteSpace: "nowrap", pointerEvents: "none",
                      filter: "drop-shadow(0 0 6px #ff5ec7) drop-shadow(0 0 12px #ff5ec7aa)",
                      animation: "pulse 1.2s ease-in-out infinite",
                    }}>✦</div>
                  )}
                  {e.guardian && !e.rider && !camouflaged && (
                    <div style={{
                      position: "absolute", top: -38, left: "50%",
                      transform: `translateX(-50%) scaleX(${sx})`,
                      color: "#111",
                      fontSize: 20, fontWeight: 900, lineHeight: 1,
                      textShadow: "1px 1px 0 #fff, -1px 1px 0 #fff, 1px -1px 0 #fff, -1px -1px 0 #fff, 0 0 10px #000",
                      whiteSpace: "nowrap", pointerEvents: "none",
                      filter: "drop-shadow(0 0 4px #000)",
                      animation: "pulse 1.6s ease-in-out infinite",
                    }}>✦</div>
                  )}
                  {stars && !e.rider && (
                    <div style={{
                      position: "absolute", top: -26, left: "50%",
                      transform: `translateX(-50%) scaleX(${sx})`,
                      color: starColor,
                      fontSize: 10, fontWeight: 800, lineHeight: 1,
                      textShadow: "1px 1px 0 #000, -1px 1px 0 #000, 1px -1px 0 #000, -1px -1px 0 #000",
                      whiteSpace: "nowrap", pointerEvents: "none",
                      filter: `drop-shadow(0 0 4px ${starColor})`,
                    }}>{stars}</div>
                  )}
                  {/* Nível + cristal de raridade */}
                  <div style={{
                    position: "absolute", top: -14, left: "50%",
                    transform: `translateX(-50%) scaleX(${sx})`,
                    color: e.elite ? "#ff4a4a" : "#eadfe8",
                    fontSize: 10, fontWeight: 700, lineHeight: 1,
                    textShadow: "1px 1px 0 #000, -1px 1px 0 #000, 1px -1px 0 #000, -1px -1px 0 #000",
                    whiteSpace: "nowrap", pointerEvents: "none",
                    display: "flex", alignItems: "center", gap: 3,
                  }}>
                    <span style={{ fontSize: 9 }}>{crystal}</span>
                    Lv.{e.level}
                  </div>
                  <div style={{
                    position: "absolute", bottom: -6, left: 4, right: 4, height: 5,
                    background: "#3a1010", borderRadius: 2, transform: `scaleX(${sx})`,
                    border: "1px solid rgba(0,0,0,0.6)",
                  }}>
                    <div style={{
                      width: `${Math.max(0, (e.hp / e.maxHp) * 100)}%`,
                      height: "100%", background: e.hp > e.maxHp * 0.4 ? "#5ec26a" : "#e34a4a",
                      borderRadius: 2, transition: "width 200ms",
                    }} />
                  </div>
                </div>
              );
            })}

            {/* Baús espalhados */}
            {chests.map((c) => (
              <div key={`chest-${c.id}`} style={{
                position: "absolute", left: c.x, top: c.y,
                width: 56, height: 56,
                transform: "translate(-50%, -50%)",
                zIndex: Math.round(c.y),
                pointerEvents: "none",
              }}>
                {!c.opened && (
                  <div className="chest-idle" style={{
                    position: "absolute", inset: -8, borderRadius: "50%",
                    background: "radial-gradient(circle, rgba(245,207,107,0.35) 0%, rgba(245,207,107,0) 65%)",
                    filter: "blur(2px)",
                  }} />
                )}
                <img
                  src={c.opened ? chestOpenImg : chestClosedImg}
                  alt=""
                  className={c.opened ? "chest-pop" : ""}
                  style={{
                    width: "100%", height: "100%",
                    imageRendering: "pixelated",
                    filter: "drop-shadow(0 3px 3px rgba(0,0,0,0.6))",
                  }}
                />
              </div>
            ))}



            {/* Treinador */}
            <div style={{
              position: "absolute",
              left: renderTrainerX, top: renderTrainerY,
              width: 56, height: 56,
              transform: "translate(-50%, -50%)",
              filter: "drop-shadow(0 3px 3px rgba(0,0,0,0.6))",
              zIndex: Math.round(trainerPos.y),
              willChange: "left, top",
            }}>
              {/* Nickname acima da cabeça */}
              {identity?.name && (
                <div style={{
                  position: "absolute", left: "50%", top: -20,
                  transform: "translateX(-50%)",
                  fontSize: 10, fontWeight: 800,
                  color: "#fff",
                  textShadow: "0 0 3px #000, 1px 1px 0 #000, -1px -1px 0 #000",
                  whiteSpace: "nowrap",
                  fontFamily: "monospace",
                  background: isVip() ? "rgba(140,60,0,0.7)" : "rgba(20,50,110,0.7)",
                  padding: "1px 6px", borderRadius: 5,
                  border: `1px solid ${isVip() ? "#ffb347" : "#6bd4ff"}`,
                  pointerEvents: "none",
                }}>
                  {isVip() ? "✦ " : ""}{identity.name}
                </div>
              )}
              <div style={{
                width: "100%", height: "100%",
                backgroundImage: `url(${skinUrl ?? trainerSheet})`,
                backgroundSize: "400% 400%",
                backgroundPosition: `${walkStep * 33.333}% ${DIR_ROW[walkDir] * 33.333}%`,
                imageRendering: "pixelated",
              }} />
            </div>

            {/* Black Mitic Egg — pet flutuante */}
            <BlackMiticEggSprite
              trainerX={renderTrainerX}
              trainerY={renderTrainerY}
              visible={(idle.items?.[BLACK_EGG_ITEM_ID] ?? 0) > 0}
              onClick={openBlackEggHud}
            />


            {/* Animação da pokébola sendo lançada */}
            {captureAnim && (() => {
              const now = performance.now();
              const dt = Math.min(1, (now - captureAnim.ts) / 700);
              const arcY = Math.sin(dt * Math.PI) * 60;
              const x = captureAnim.fromX + (captureAnim.toX - captureAnim.fromX) * dt;
              const y = captureAnim.fromY + (captureAnim.toY - captureAnim.fromY) * dt - arcY;
              return (
                <div style={{


                  position: "absolute", left: x, top: y,
                  width: 26, height: 26,
                  transform: `translate(-50%, -50%) rotate(${dt * 720}deg)`,
                  zIndex: 9999,
                  pointerEvents: "none",
                  filter: "drop-shadow(0 2px 3px rgba(0,0,0,0.7))",
                }}>
                  <img src={captureAnim.ballImg} alt="" style={{ width: "100%", height: "100%", imageRendering: "pixelated" }} />
                </div>
              );
            })()}


            {/* Outros jogadores no mesmo mapa */}
            {visibleMapPlayers.map((rp) => {
              const rpLeaderSrc = rp.leaderSp ? GIF[rp.leaderSp] : undefined;
              return (
                <div key={rp.id} style={{
                  position: "absolute",
                  left: rp.x, top: rp.y,
                  width: 56, height: 56,
                  transform: "translate(-50%, -50%)",
                  transition: "left 220ms linear, top 220ms linear",
                  filter: "drop-shadow(0 3px 3px rgba(0,0,0,0.6))",
                  zIndex: Math.round(rp.y),
                  pointerEvents: "none",
                }}>
                  {/* Nome */}
                  <div style={{
                    position: "absolute", left: "50%", top: -18,
                    transform: "translateX(-50%)",
                    fontSize: 10, fontWeight: 700,
                    color: "#fff",
                    textShadow: "0 0 3px #000, 1px 1px 0 #000, -1px -1px 0 #000",
                    whiteSpace: "nowrap",
                    fontFamily: "monospace",
                    background: "rgba(20,40,80,0.55)",
                    padding: "1px 5px", borderRadius: 4,
                    border: "1px solid rgba(107,178,255,0.6)",
                  }}>{rp.name}</div>
                  <div style={{
                    width: "100%", height: "100%",
                    backgroundImage: `url(${rp.skinUrl ?? trainerSheet})`,
                    backgroundSize: "400% 400%",
                    backgroundPosition: `${rp.step * 33.333}% ${DIR_ROW[rp.dir] * 33.333}%`,
                    imageRendering: "pixelated",
                    filter: rp.skinUrl ? undefined : "hue-rotate(140deg) saturate(1.1)",
                  }} />
                  {rpLeaderSrc && (
                    rp.leaderSp && SPRITE_SHEET[rp.leaderSp] ? (
                      <div style={{
                        position: "absolute", left: 34, top: 20,
                        width: 36, height: 36,
                        backgroundImage: `url(${SPRITE_SHEET[rp.leaderSp]})`,
                        backgroundSize: "400% 400%",
                        backgroundPosition: `${rp.step * 33.333}% ${DIR_ROW[rp.dir] * 33.333}%`,
                        imageRendering: "pixelated",
                        pointerEvents: "none",
                      }} />
                    ) : (
                      <img src={rpLeaderSrc} alt="" style={{
                        position: "absolute", left: 34, top: 20,
                        width: 36, height: 36,
                        imageRendering: "pixelated",
                        pointerEvents: "none",
                      }} />
                    )
                  )}



                </div>
              );
            })}

            {/* Anel de cura durante o descanso */}
            {restingUntil !== null && (
              <>
                <div style={{
                  position: "absolute",
                  left: trainerPos.x - 60, top: trainerPos.y - 60,
                  width: 120, height: 120, borderRadius: "50%",
                  border: "3px solid #5ec26a",
                  boxShadow: "0 0 40px #5ec26a, inset 0 0 30px #5ec26a88",
                  animation: "chest-pop 1.2s ease-in-out infinite",
                  pointerEvents: "none",
                }} />
                <div style={{
                  position: "absolute",
                  left: trainerPos.x - 30, top: trainerPos.y - 90,
                  fontSize: 24, pointerEvents: "none",
                  animation: "chest-pop 900ms ease-in-out infinite",
                }}>💤💚</div>
              </>
            )}

            {/* Pokémon do jogador segue o treinador */}
            {(() => {
              const leader = team[0];
              const leaderSp = leader?.species ?? "charmander";
              const leaderSrc = GIF[leaderSp];
              if (!leaderSrc || !leader) return null;
              const leaderMax = calcIdleMaxHp(leader);
              const hpPct = Math.max(0, (leaderHp / leaderMax) * 100);
              const xpNeeded = 100 + leader.level * 20;
              const xpPct = Math.min(100, ((leader.xp ?? 0) / xpNeeded) * 100);
              const fainted = leaderHp <= 0;
              const faceScale = pokemonFace === "right" ? -1 : 1;
              const auraOn = Date.now() - leveledAt < 1400;
              const leaderEvent = String((leader as any).event ?? "");
              const isBMP = leaderEvent.includes("black_mitic");
              // Lunge: avança 45% do caminho até o alvo e volta (curva senoidal)
              let lungeX = 0, lungeY = 0;
              if (attackAnim) {
                const dt = Math.min(1, (Date.now() - attackAnim.ts) / 380);
                const wave = Math.sin(dt * Math.PI); // 0 → 1 → 0
                lungeX = (attackAnim.toX - attackAnim.fromX) * 0.45 * wave;
                lungeY = (attackAnim.toY - attackAnim.fromY) * 0.45 * wave;
              }
              const leaderX = renderFollowerX + lungeX;
              const leaderY = renderFollowerY + lungeY;
              return (
                <div style={{
                  position: "absolute",
                  left: leaderX, top: leaderY,
                  width: 54, height: 54,
                  transform: "translate(-50%, -50%)",
                  transition: attackAnim ? "none" : undefined,
                  filter: `drop-shadow(0 3px 3px rgba(0,0,0,0.55)) ${fainted ? "grayscale(1) brightness(0.6)" : ""}`,
                  opacity: fainted ? 0.5 : 1,
                  zIndex: Math.round(leaderY),
                }}>
                  {isBMP && (
                    <>
                      <div className="bmp-aura-glow" style={{ position: "absolute", inset: -22, borderRadius: "50%" }} />
                      <div className="bmp-aura-ring" style={{ position: "absolute", inset: -14, borderRadius: "50%" }} />
                      {[
                        { a: 0,   r: 34, d: 6, cls: "" },
                        { a: 90,  r: 30, d: 7, cls: "s-lg" },
                        { a: 180, r: 36, d: 8, cls: "" },
                        { a: 270, r: 28, d: 5, cls: "s-lg" },
                        { a: 45,  r: 40, d: 9, cls: "" },
                        { a: 225, r: 32, d: 6, cls: "" },
                      ].map((s, i) => (
                        <span key={`bmp-${i}`} className={`bmp-star ${s.cls}`} style={{
                          ["--a" as string]: `${s.a}deg`,
                          ["--r" as string]: `${s.r}px`,
                          animationDuration: `${s.d}s`,
                        } as React.CSSProperties} />
                      ))}
                    </>
                  )}
                  {auraOn && (
                    <>
                      <div className="lvaura-glow" style={{
                        position: "absolute", inset: -28, borderRadius: "50%",
                        pointerEvents: "none",
                      }} />
                      <div className="lvaura-ring" style={{
                        position: "absolute", inset: -18, borderRadius: "50%",
                        pointerEvents: "none",
                      }} />
                      <div className="lvaura-ring2" style={{
                        position: "absolute", inset: -10, borderRadius: "50%",
                        pointerEvents: "none",
                      }} />
                      {[0,1,2,3,4,5,6,7].map((i) => (
                        <span key={i} className="lvaura-spark" style={{
                          ["--i" as string]: i,
                        } as React.CSSProperties} />
                      ))}
                    </>
                  )}
                  {SPRITE_SHEET[leaderSp] ? (
                    <div style={{
                      width: "100%", height: "100%",
                      backgroundImage: `url(${SPRITE_SHEET[leaderSp]})`,
                      backgroundSize: "400% 400%",
                      backgroundPosition: `${(followerState.moving ? walkStep : 0) * 33.333}% ${DIR_ROW[followerState.dir] * 33.333}%`,
                      imageRendering: "pixelated",
                      filter: fainted ? "grayscale(1) brightness(0.6)" : undefined,
                    }} />
                  ) : (
                    <img src={leaderSrc} alt="" className={!moving && !fainted ? "attackbob" : ""}
                      style={{
                        width: "100%", imageRendering: "pixelated",
                        "--face-scale": faceScale,
                        transform: `scaleX(${faceScale})`,
                      } as React.CSSProperties} />
                  )}

                  {/* Barra HP */}
                  <div style={{
                    position: "absolute", bottom: -8, left: 4, right: 4, height: 6,
                    background: "#3a1010", borderRadius: 3, border: "1px solid rgba(0,0,0,0.6)",
                  }}>
                    <div style={{
                      width: `${hpPct}%`, height: "100%",
                      background: hpPct > 40 ? "#5ec26a" : hpPct > 15 ? "#f5cf6b" : "#e34a4a",
                      borderRadius: 3, transition: "width 250ms",
                    }} />
                  </div>
                  {/* Barra XP */}
                  <div style={{
                    position: "absolute", bottom: -16, left: 4, right: 4, height: 4,
                    background: "#0e1a2a", borderRadius: 2, border: "1px solid rgba(0,0,0,0.6)",
                  }}>
                    <div style={{
                      width: `${xpPct}%`, height: "100%",
                      background: "#6bd4ff", borderRadius: 2, transition: "width 250ms",
                    }} />
                  </div>
                  <div style={{
                    position: "absolute", top: -18, left: "50%", transform: "translateX(-50%)",
                    fontSize: 11, color: "#fff", fontWeight: 700,
                    textShadow: "1px 1px 0 #000",
                    whiteSpace: "nowrap",
                  }}>
                    Lv.{leader.level} · {Math.floor(leaderHp)}/{leaderMax}
                  </div>
                </div>
              );
            })()}

            {/* Slash / impacto de ataque — glow radial (sem borda quadrada) */}
            {attackAnim && (() => {
              const dt = Math.min(1, (Date.now() - attackAnim.ts) / 380);
              const opacity = (dt < 0.5 ? dt / 0.5 : 1 - (dt - 0.5) / 0.5) * 0.9;
              const scale = 0.6 + dt * 0.9;
              const size = attackAnim.crit ? 96 : 68;
              const glow = ELEMENT_FX_GLOW[attackAnim.element];
              return (
                <div key={attackAnim.id} style={{
                  position: "absolute",
                  left: attackAnim.toX, top: attackAnim.toY,
                  width: size, height: size,
                  transform: `translate(-50%, -50%) scale(${scale})`,
                  opacity,
                  pointerEvents: "none",
                  borderRadius: "50%",
                  background: `radial-gradient(circle, ${glow} 0%, ${glow}aa 25%, ${glow}55 45%, ${glow}00 70%)`,
                  filter: attackAnim.crit ? `drop-shadow(0 0 12px ${glow})` : `drop-shadow(0 0 6px ${glow})`,
                  mixBlendMode: "screen",
                  zIndex: 7,
                }} />
              );
            })()}

            {/* FX de contra-ataque do inimigo — glow radial */}
            {enemyAttackAnim && (() => {
              const dt = Math.min(1, (Date.now() - enemyAttackAnim.ts) / 380);
              const opacity = (dt < 0.5 ? dt / 0.5 : 1 - (dt - 0.5) / 0.5) * 0.85;
              const scale = 0.55 + dt * 0.75;
              const glow = ELEMENT_FX_GLOW[enemyAttackAnim.element];
              return (
                <div key={enemyAttackAnim.id} style={{
                  position: "absolute",
                  left: enemyAttackAnim.toX, top: enemyAttackAnim.toY,
                  width: 62, height: 62,
                  transform: `translate(-50%, -50%) scale(${scale})`,
                  opacity,
                  pointerEvents: "none",
                  borderRadius: "50%",
                  background: `radial-gradient(circle, ${glow} 0%, ${glow}99 30%, ${glow}44 50%, ${glow}00 72%)`,
                  filter: `drop-shadow(0 0 6px ${glow})`,
                  mixBlendMode: "screen",
                  zIndex: 7,
                }} />
              );
            })()}



            {/* Efeitos flutuantes (coords do mundo) */}
            {fx.map((f) => {
              const color =
                f.kind === "crit" ? "#ffd94d" :
                f.kind === "myDmg" ? "#f5cf6b" :
                f.kind === "enemyDmg" ? "#ff3b3b" :
                f.kind === "xp" ? "#6bd4ff" :
                f.kind === "capture" ? "#ffd94d" :
                "#e0f5a0";
              const isDmg = f.kind === "myDmg" || f.kind === "enemyDmg";
              const isCrit = f.kind === "crit";
              return (
                <div key={f.id} className="fxpop" style={{
                  position: "absolute",
                  left: f.x, top: f.y,
                  color,
                  fontWeight: 900,
                  fontSize: isCrit ? 30 : isDmg ? 22 : f.kind === "capture" ? 20 : 18,
                  letterSpacing: isCrit ? 1 : 0,
                  textShadow: isCrit
                    ? "0 0 8px #ff3b3b, 2px 2px 0 #000, -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000"
                    : "2px 2px 0 rgba(0,0,0,0.8)",
                  pointerEvents: "none",
                  transform: "translate(-50%, -50%)",
                  zIndex: 8,
                }}>
                  {f.kind === "myDmg" ? `-${f.text}` : f.text}
                </div>
              );
            })}
          </div>
          <div className="hud-overlay-layer" style={{ position: "fixed", inset: 0, zIndex: 1100, pointerEvents: "none" }}>
            {/* O bloco de HUD moderno foi movido para o topo do return, após o Viewport. */}
          </div>

















          {/* Overlay de DESCANSO — congela o jogo, cura no final */}
          {restingUntil !== null && restingStart !== null && (() => {
            const totalDur = Math.max(1, restingUntil - restingStart);
            const elapsed = Math.min(totalDur, Math.max(0, Date.now() - restingStart));
            const remaining = Math.max(0, restingUntil - Date.now());
            const pct = Math.min(100, (elapsed / totalDur) * 100);
            const mm = Math.floor(remaining / 60000);
            const ss = Math.floor((remaining % 60000) / 1000).toString().padStart(2, "0");
            const accent = restingKind === "azul" ? "#4a9eff" : "#5ec26a";
            const label = restingKind === "azul" ? "Descansando na Casa Azul" : "Descansando no Lar";
            return (
              <>
                <div style={{
                  position: "absolute", top: 10, right: 10, zIndex: 12,
                  background: "rgba(11,5,16,0.92)", border: `2px solid ${accent}`,
                  borderRadius: 10, padding: "10px 14px", minWidth: 200,
                  boxShadow: `0 0 24px ${accent}66`,
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <span style={{ fontSize: 22, animation: "chest-pop 900ms ease-in-out infinite" }}>💤</span>
                    <div>
                      <div style={{ fontWeight: 800, color: "#fff", fontSize: 13 }}>{label}</div>
                      <div style={{ fontSize: 11, color: "#c8ffd6" }}>Restam <b>{mm}:{ss}</b></div>
                    </div>
                  </div>
                  <div style={{ height: 6, background: "#1a0f26", borderRadius: 3, overflow: "hidden" }}>
                    <div style={{ width: `${pct}%`, height: "100%", background: `linear-gradient(90deg, ${accent}, #a7f3a0)`, transition: "width 200ms" }} />
                  </div>
                </div>
              </>
            );
          })()}
          {/* tick invisível pra forçar rerender enquanto descansa */}
          {restingUntil !== null && <span style={{ display: "none" }}>{restNowTick}</span>}



          {/* Prompt de interação com prédio */}
          {nearBuilding && (() => {
            const bColor = nearBuilding === "lab" ? "#f5cf6b" : nearBuilding === "gym" ? "#ff5c5c" : nearBuilding === "azul" ? "#4a9eff" : "#5ec26a";
            const bEmoji = nearBuilding === "lab" ? "🏦" : nearBuilding === "gym" ? "🏰" : nearBuilding === "azul" ? "🏡" : "🏠";
            const bLabel = nearBuilding === "lab" ? "Banco Medieval" : nearBuilding === "gym" ? "Ginásio Medieval" : nearBuilding === "azul" ? "Casa Azul" : "Lar";
            const bDesc = nearBuilding === "lab"
              ? `Guardar itens e pokémons · ${VAULT_FEE_SHARDS} 🔻 por item · ${POKE_VAULT_FEE_SHARDS.toLocaleString("pt-BR")} 🔻 por pokémon`
              : nearBuilding === "gym"
              ? `Portal do Vale dos Fragmentos · ${GYM_ENTRY_SHARDS.toLocaleString("pt-BR")} 🔻`
              : nearBuilding === "azul"
                ? "Restaura energia em 5 min"
                : "Descansar (leva 1 hora)";
            const bAction = nearBuilding === "lab" ? "ABRIR COFRE" : nearBuilding === "gym" ? "ENTRAR" : "DESCANSAR";
            return (
              <div style={{
                position: "absolute", bottom: 78, left: "50%", transform: "translateX(-50%)",
                background: "rgba(11,5,16,0.95)",
                border: `2px solid ${bColor}`,
                borderRadius: 10, padding: "10px 16px",
                display: "flex", alignItems: "center", gap: 12, zIndex: 20,
                boxShadow: `0 0 20px ${bColor}66`,
                animation: "chest-pop 220ms ease-out",
              }}>
                <span style={{ fontSize: 24 }}>{bEmoji}</span>
                <div>
                  <div style={{ fontWeight: 800, color: "#fff", fontSize: 13 }}>{bLabel}</div>
                  <div style={{ fontSize: 10, color: "#c8b8d0" }}>{bDesc}</div>
                </div>
                <button
                  onClick={() => {
                    if (nearBuilding === "lab") { setVaultOpen(true); setNearBuilding(null); }
                    else if (nearBuilding === "gym") { setGymOpen(true); setNearBuilding(null); }
                    else if (nearBuilding === "azul") { setAzulPickerOpen(true); setNearBuilding(null); }
                    else restAtHome("lar");
                  }}
                  style={{
                    background: bColor,
                    color: "#0b0510", border: "none", borderRadius: 6,
                    padding: "8px 14px", fontWeight: 900, fontSize: 12,
                    letterSpacing: 1, cursor: "pointer",
                  }}
                >{bAction}</button>
              </div>
            );
          })()}

          {/* Faixa BATALHA AUTOMÁTICA / DESMAIADO */}

          {leaderHp <= 0 ? (
            <div style={{
              position: "absolute", bottom: 10, left: "50%", transform: "translateX(-50%)",
              background: "rgba(60,0,0,0.95)", border: "2px solid #f5cf6b",
              borderRadius: 10, padding: "12px 20px", display: "flex", alignItems: "center", gap: 14,
              zIndex: 15,
            }}>
              <span style={{ fontSize: 26 }}>💀</span>
              <div>
                <div style={{ fontWeight: 800, color: "#fff" }}>Pokémon desmaiado</div>
                <div style={{ fontSize: 11, color: "#f5cf6b" }}>
                  Custa 50 ouro para reviver
                </div>
              </div>
              <button onClick={revive} style={{ ...smallBtn, background: "#5ec26a", color: "#0b0510", border: "none", fontWeight: 800, padding: "8px 16px" }}>
                REVIVER
              </button>
            </div>
          ) : (() => {
            const ab = idle.autoBattle ?? { enabled: true, useBall: true, preferredBall: "auto" as const, captureHpPct: 1 };
            const setAB = (patch: Partial<typeof ab>) => setIdle((s) => ({ ...s, autoBattle: { ...(s.autoBattle ?? ab), ...patch } }));
            const on = ab.enabled;
            return (
              <div style={{

                position: "absolute", bottom: 10, left: "50%", transform: "translateX(-50%)",
                display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
              }}>
                {showAutoSettings && (
                  <div style={{
                    background: "rgba(11,5,16,0.98)", border: "1px solid rgba(245,207,107,0.5)",
                    borderRadius: 10, padding: "10px 12px", display: "flex", flexDirection: "column", gap: 8,
                    minWidth: 240, color: "#eadfe8", fontSize: 11, boxShadow: "0 6px 20px rgba(0,0,0,0.55)",
                  }}>
                  <div style={{ fontWeight: 800, color: "#f5cf6b", fontSize: 12, letterSpacing: 1 }}>⚙ CONFIGURAR AUTO</div>

                  <label style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                    <span>Usar Pokébola</span>
                    <input type="checkbox" checked={ab.useBall} onChange={(e) => setAB({ useBall: e.target.checked })} />
                  </label>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <span style={{ color: "#c8b8d0" }}>Pokébola preferida</span>
                    <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                      {(["auto","pokeball","greatball","ultraball"] as const).map((p) => {
                        const label = p === "auto" ? "Auto" : p === "pokeball" ? "Poké" : p === "greatball" ? "Great" : "Ultra";
                        const sel = ab.preferredBall === p;
                        return (
                          <button key={p} onClick={() => setAB({ preferredBall: p })} disabled={!ab.useBall} style={{
                            background: sel ? "#f5cf6b" : "rgba(255,255,255,0.06)",
                            color: sel ? "#0b0510" : "#eadfe8", border: "1px solid rgba(245,207,107,0.4)",
                            borderRadius: 6, padding: "4px 8px", fontSize: 10, fontWeight: 700,
                            cursor: ab.useBall ? "pointer" : "not-allowed", opacity: ab.useBall ? 1 : 0.5,
                          }}>{label}</button>
                        );
                      })}
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <span style={{ color: "#c8b8d0" }}>Auto-Poção HP% ≤ {Math.round((idle.autoHeal?.threshold ?? 0.5) * 100)}%</span>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <input type="range" min={0.1} max={0.9} step={0.05}
                        value={idle.autoHeal?.threshold ?? 0.5}
                        onChange={(e) => setIdle((s) => ({ ...s, autoHeal: { ...(s.autoHeal ?? { enabled: false, threshold: 0.5 }), threshold: parseFloat(e.target.value) } }))}
                        style={{ flex: 1 }}
                      />
                      <input type="checkbox"
                        checked={idle.autoHeal?.enabled ?? false}
                        onChange={(e) => setIdle((s) => ({ ...s, autoHeal: { ...(s.autoHeal ?? { enabled: false, threshold: 0.5 }), enabled: e.target.checked } }))}
                        title="Ativar auto-poção"
                      />
                    </div>
                  </div>
                  <div style={{ fontSize: 10, color: "#8f8296", borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 6 }}>
                    💡 Clique em um Pokémon selvagem para lançar a Pokébola manualmente.
                  </div>
                  <button
                    onClick={() => {
                      if (confirm("Sair e voltar para a tela de login?")) {
                        signOutRubyM().finally(() => { window.location.reload(); });
                      }
                    }}
                    style={{
                      marginTop: 6,
                      background: "linear-gradient(180deg,#7a1d1d,#4a0e0e)",
                      border: "1px solid #ff6b6b", color: "#ffd7d7",
                      borderRadius: 8, padding: "6px 10px", cursor: "pointer",
                      fontSize: 11, fontWeight: 700, letterSpacing: 1,
                    }}
                  >
                    🚪 IR PARA TELA DE LOGIN
                  </button>
                </div>
              </div>
            );
          })()}
            {showProfile && (
              <ProfileCard
                onClose={() => setShowProfile(false)}
                identity={identity}
                items={idle.items ?? {}}
                gold={idle.bank.gold}
                crystals={idle.bank.crystals}
                safiras={idle.items?.safira_verde ?? 0}
                onBuyMarket={buyMarketListing}
                onCancelMarket={cancelMarketListing}
                onClaimMarketPayout={claimMarketPayout}
                isVip={isVip()}
                pokemonMarketNode={
                  <PokemonMarketPanel
                    identity={identity}
                    collection={idle.collection ?? []}
                    gold={idle.bank.gold}
                    crystals={idle.bank.crystals}
                    safiras={idle.items?.safira_verde ?? 0}
                    isVip={isVip()}
                    gifOf={(sp) => GIF[sp]}
                    onListed={(uid) => setIdle((s) => ({ ...s, collection: (s.collection ?? []).filter(c => c.uid !== uid) }))}
                    onReturned={(entry) => setIdle((s) => {
                      const col = s.collection ?? [];
                      if (col.some(c => c.uid === entry.uid)) return s;
                      return { ...s, collection: [...col, entry] };
                    })}
                    onSpend={(cur, amount) => setIdle((s) => ({
                      ...s,
                      bank: cur === "gold"
                        ? { ...s.bank, gold: Math.max(0, s.bank.gold - amount) }
                        : { ...s.bank, crystals: Math.max(0, s.bank.crystals - amount) },
                    }))}
                    onEarn={(cur, amount) => setIdle((s) => ({
                      ...s,
                      bank: cur === "gold"
                        ? { ...s.bank, gold: s.bank.gold + amount }
                        : { ...s.bank, crystals: s.bank.crystals + amount },
                    }))}
                    onSpendSafira={(amount) => {
                      const cur = idle.items?.safira_verde ?? 0;
                      if (cur < amount) return false;
                      setIdle((s) => ({ ...s, items: { ...(s.items ?? {}), safira_verde: (s.items?.safira_verde ?? 0) - amount } }));
                      return true;
                    }}
                    onEarnSafira={(amount) => {
                      setIdle((s) => ({ ...s, items: { ...(s.items ?? {}), safira_verde: (s.items?.safira_verde ?? 0) + amount } }));
                    }}
                    pushChat={pushChat}
                  />
                }
                skinId={skinId}
                setSkinId={setSkinId}
                unlockedSkins={idle.unlockedSkins ?? ["default"]}
                skinTickets={idle.items?.skin_ticket ?? 0}
                onUnlockSkin={(sid) => {
                  setIdle((s) => {
                    const tickets = s.items?.skin_ticket ?? 0;
                    const unlocked = new Set(s.unlockedSkins ?? ["default"]);
                    if (unlocked.has(sid)) return s;
                    if (tickets <= 0) return s;
                    unlocked.add(sid);
                    return {
                      ...s,
                      items: { ...s.items, skin_ticket: tickets - 1 },
                      unlockedSkins: Array.from(unlocked),
                    };
                  });
                  setSkinId(sid);
                  pushChat(`✦ Skin premium desbloqueada! Você consumiu 1 Ticket de Skin.`, "cap");
                }}
                trainerLevel={idle.trainerLevel ?? 1}
                onUpgradeBook={upgradeBook}
              />
            )}
            {false && (
              <div
                  identity={identity}
                  collection={idle.collection ?? []}
                  gold={idle.bank.gold}
                  crystals={idle.bank.crystals}
                  safiras={idle.items?.safira_verde ?? 0}
                  isVip={isVip()}
                  gifOf={(sp) => GIF[sp]}
                  onListed={(uid) => setIdle((s) => ({ ...s, collection: (s.collection ?? []).filter(c => c.uid !== uid) }))}
                  onReturned={(entry) => setIdle((s) => {
                    const col = s.collection ?? [];
                    if (col.some(c => c.uid === entry.uid)) return s;
                    return { ...s, collection: [...col, entry] };
                  })}
                  onSpend={(cur, amount) => setIdle((s) => ({
                    ...s,
                    bank: cur === "gold"
                      ? { ...s.bank, gold: Math.max(0, s.bank.gold - amount) }
                      : { ...s.bank, crystals: Math.max(0, s.bank.crystals - amount) },
                  }))}
                  onEarn={(cur, amount) => setIdle((s) => ({
                    ...s,
                    bank: cur === "gold"
                      ? { ...s.bank, gold: s.bank.gold + amount }
                      : { ...s.bank, crystals: s.bank.crystals + amount },
                  }))}
                  onSpendSafira={(amount) => {
                    const cur = idle.items?.safira_verde ?? 0;
                    if (cur < amount) return false;
                    setIdle((s) => ({ ...s, items: { ...(s.items ?? {}), safira_verde: (s.items?.safira_verde ?? 0) - amount } }));
                    return true;
                  }}
                  onEarnSafira={(amount) => {
                    setIdle((s) => ({ ...s, items: { ...(s.items ?? {}), safira_verde: (s.items?.safira_verde ?? 0) + amount } }));
                  }}
                  pushChat={pushChat}
                  skinId={skinId}
                  setSkinId={setSkinId}
                  unlockedSkins={idle.unlockedSkins ?? ["default"]}
                  skinTickets={idle.items?.skin_ticket ?? 0}
                  onUnlockSkin={(sid) => {
                    setIdle((s) => {
                      const tickets = s.items?.skin_ticket ?? 0;
                      const unlocked = new Set(s.unlockedSkins ?? ["default"]);
                      if (unlocked.has(sid)) return s;
                      if (tickets <= 0) return s;
                      unlocked.add(sid);
                      return {
                        ...s,
                        items: { ...s.items, skin_ticket: tickets - 1 },
                        unlockedSkins: Array.from(unlocked),
                      };
                    });
                    setSkinId(sid);
                    pushChat(`✦ Skin premium desbloqueada! Você consumiu 1 Ticket de Skin.`, "cap");
                  }}
                  trainerLevel={idle.trainerLevel ?? 1}
                  onUpgradeBook={upgradeBook}
              />
            )}

        {/* Explorar Panel - Integrated into Profile Card below */}













          <Panel title="EXPLORAR" accent="#3d2b52">
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>














              <div ref={coletaRef} style={{
                background: "rgba(0,0,0,0.5)",
                border: "1px solid rgba(245,207,107,0.3)",
                borderRadius: 12, padding: 12,
                backdropFilter: "blur(8px)"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <span style={{ color: "#f5cf6b", fontWeight: 900, fontSize: 11, letterSpacing: 1 }}>COLETA</span>
                  <span style={{ color: "#f5cf6b", fontWeight: 700, fontSize: 10 }}>⏱ {fmtHMS(Math.min(OFFLINE_CAP_MS, activeTime))}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-around", marginBottom: 10 }}>
                  <span style={{ color: "#f4c430", fontWeight: 800, fontSize: 12 }}>● {fmtK(idle.bank.gold)}</span>
                  <span style={{ color: "#fff", fontWeight: 800, fontSize: 12 }}>💎 {Math.floor(idle.bank.crystals)}</span>
                </div>

                <button
                  onClick={collect}
                  style={{
                    width: "100%", background: "linear-gradient(135deg, #7ef27a, #5ec26a)",
                    color: "#0b0510", border: "1px solid #f5cf6b", borderRadius: 8,
                    padding: "6px", fontWeight: 900, fontSize: 12, cursor: "pointer"
                  }}
                >
                  COLETAR
                </button>
              </div>

              {/* Eventos compactos aqui */}
              {isGeliusActive() && (
                <div 
                  onClick={() => pushChat("🐧 Gelius ativo!", "info")}
                  style={{ background: "rgba(11,46,74,0.6)", border: "1px solid #7fd8ff", borderRadius: 10, padding: "6px 10px", cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}
                >
                  <span style={{ fontSize: 14 }}>🐧</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 9, fontWeight: 900, color: "#c9b8ff" }}>EVENTO GELIUS</div>
                    <div style={{ fontSize: 8, color: "#fff" }}>ONDA ATIVA</div>
                  </div>
                </div>
              )}
            </div>
          </Panel>

          <div style={{ height: 12 }} />

          <Panel title="EQUIPE" accent="#3d2b52">
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {team.map((p, i) => (
                <div key={p.uid} style={{ 
                  display: "flex", alignItems: "center", gap: 6, 
                  background: i === 0 ? "rgba(245,207,107,0.1)" : "rgba(255,255,255,0.03)",
                  padding: "4px 8px", borderRadius: 8,
                  border: i === 0 ? "1px solid rgba(245,207,107,0.3)" : "1px solid rgba(255,255,255,0.05)"
                }}>
                  <img src={GIF[p.species]} alt="" style={{ width: 24, height: 24, imageRendering: "pixelated" }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 9, fontWeight: 900, color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.species.toUpperCase()}</div>
                    <div style={{ fontSize: 8, color: "rgba(255,255,255,0.5)" }}>LV.{p.level}</div>
                  </div>
                  <div style={{ width: 40, height: 4, background: "rgba(0,0,0,0.5)", borderRadius: 2, overflow: "hidden" }}>
                    <div style={{ width: "100%", height: "100%", background: "#5ec26a" }} />
                  </div>
                </div>
              ))}
            </div>
            {/* Botão do Ancião Glacial no HUD Lateral */}
            <div style={{ marginTop: 8 }}>
              <button
                onClick={handleAnciaoInteraction}
                style={{
                  width: "100%",
                  padding: "8px",
                  background: "linear-gradient(180deg, #15803d, #064e3b)",
                  border: "1px solid #4ade80",
                  borderRadius: 8,
                  color: "#4ade80",
                  fontSize: 10,
                  fontWeight: 900,
                  letterSpacing: 1,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 4,
                  boxShadow: "0 0 10px rgba(74,222,128,0.2)",
                  pointerEvents: "auto"
                }}
              >
                ❄️ ANCIÃO GLACIAL
              </button>
            </div>
          </Panel>
        </div>
        </div>
    })()}








































































      <style>{`
        .modern-floating-window {
          max-width: 95vw !important;
          width: 1200px !important;
          height: 90vh !important;
          margin: 0 auto;
        }


        @media (max-width: 768px) {
          .modern-floating-window {
            width: 98vw !important;
            height: 95vh !important;
            border-radius: 12px !important;
          }
        }


        @media (max-width: 1400px) {
          .idle-grid { grid-template-columns: 210px 1fr 210px !important; gap: 6px !important; padding: 6px !important; }
        }
        @media (max-width: 1200px) {
          .idle-grid { grid-template-columns: 190px 1fr 190px !important; }
        }
        @media (max-width: 1024px) {
          .idle-grid { grid-template-columns: 170px 1fr 170px !important; }
        }

        @keyframes fxpop {
          0% { transform: translateY(0) scale(0.6); opacity: 0; }
          20% { transform: translateY(-6px) scale(1.15); opacity: 1; }
          100% { transform: translateY(-36px) scale(0.9); opacity: 0; }
        }
        .fxpop { animation: fxpop 1.2s ease-out forwards; }
        @keyframes lvToastIn {
          0%   { opacity: 0; transform: translate(-50%, -14px) scale(0.94); }
          60%  { opacity: 1; transform: translate(-50%, 2px) scale(1.02); }
          100% { opacity: 1; transform: translate(-50%, 0) scale(1); }
        }
        @keyframes lvToastOut {
          0%   { opacity: 1; transform: translate(-50%, 0) scale(1); }
          100% { opacity: 0; transform: translate(-50%, -10px) scale(0.98); }
        }
        @keyframes lvShine {
          0%   { left: -80px; }
          100% { left: 110%; }
        }
        @keyframes shakex { 0%,100%{transform: scaleX(-1) translateX(0)} 25%{transform:scaleX(-1) translateX(-3px)} 75%{transform:scaleX(-1) translateX(3px)} }
        @keyframes attackbob { 0%,100% { transform: scaleX(var(--face-scale, 1)) translateX(0) } 50% { transform: scaleX(var(--face-scale, 1)) translateX(12px) } }
        .attackbob { animation: attackbob 0.8s ease-in-out infinite; }
        /* ===== Level-up green aura ===== */
        @keyframes lvglow {
          0%   { transform: scale(0.6); opacity: 0; filter: blur(6px); }
          25%  { transform: scale(1.1); opacity: 1; filter: blur(4px); }
          100% { transform: scale(1.8); opacity: 0; filter: blur(10px); }
        }
        .lvaura-glow {
          background: radial-gradient(circle,
            rgba(180,255,150,0.85) 0%,
            rgba(90,220,110,0.55) 30%,
            rgba(40,180,80,0.25) 55%,
            rgba(20,120,60,0) 80%);
          animation: lvglow 1.4s ease-out forwards;
          mix-blend-mode: screen;
        }
        @keyframes lvring {
          0%   { transform: scale(0.5); opacity: 0; box-shadow: 0 0 0 0 rgba(140,255,160,0.9), inset 0 0 12px rgba(180,255,180,0.7); }
          25%  { opacity: 1; }
          100% { transform: scale(2.2); opacity: 0; box-shadow: 0 0 30px 8px rgba(140,255,160,0), inset 0 0 30px rgba(180,255,180,0); }
        }
        .lvaura-ring {
          border: 2px solid rgba(180,255,180,0.9);
          background: transparent;
          animation: lvring 1.3s ease-out forwards;
        }
        .lvaura-ring2 {
          border: 2px solid rgba(120,240,140,0.7);
          background: transparent;
          animation: lvring 1.5s 0.15s ease-out forwards;
        }
        @keyframes lvspark {
          0%   { transform: rotate(calc(var(--i) * 45deg)) translateY(0) scale(0.4); opacity: 0; }
          20%  { opacity: 1; }
          100% { transform: rotate(calc(var(--i) * 45deg)) translateY(-46px) scale(1.1); opacity: 0; }
        }
        .lvaura-spark {
          position: absolute; left: 50%; top: 50%;
          width: 6px; height: 12px;
          margin: -6px 0 0 -3px;
          border-radius: 50%;
          background: radial-gradient(circle, #eaffd0 0%, #7ef27a 45%, rgba(60,180,80,0) 75%);
          box-shadow: 0 0 8px rgba(150,255,150,0.9), 0 0 16px rgba(90,240,110,0.6);
          animation: lvspark 1.1s ease-out forwards;
          pointer-events: none;
          transform-origin: 50% 50%;
        }
        .shake { animation: shakex 0.25s infinite; }

        /* ===== Weather — Pixel RPG style ===== */
        .wx-rain-tint {
          position: absolute; inset: 0;
          background:
            linear-gradient(180deg,
              rgba(30,45,75,0.42) 0%,
              rgba(30,45,75,0.22) 55%,
              rgba(30,45,75,0.10) 100%);
          pointer-events: none;
        }
        .wx-mist {
          position: absolute; inset: 0;
          background:
            radial-gradient(ellipse at 50% 100%, rgba(180,200,230,0.18), transparent 60%),
            radial-gradient(ellipse at 20% 30%, rgba(200,215,240,0.08), transparent 55%);
          filter: blur(1px);
          pointer-events: none;
          animation: wx-mist-drift 12s ease-in-out infinite alternate;
        }
        @keyframes wx-mist-drift {
          0%   { transform: translateX(0); opacity: 0.85; }
          100% { transform: translateX(20px); opacity: 1; }
        }
        .wx-snow-tint {
          position: absolute; inset: 0;
          background: linear-gradient(180deg,
            rgba(200,220,240,0.28) 0%,
            rgba(200,220,240,0.10) 50%,
            transparent 100%);
          pointer-events: none;
        }
        .wx-drop {
          position: absolute;
          top: -30px;
          display: block;
          background: linear-gradient(180deg,
            rgba(220,235,255,0) 0%,
            rgba(220,235,255,0.35) 40%,
            rgba(240,248,255,0.9) 100%);
          box-shadow: 0 0 3px rgba(200,225,255,0.5);
          transform: rotate(14deg);
          transform-origin: top center;
          border-radius: 2px;
          animation-name: wx-drop-fall;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
          will-change: transform;
        }
        @keyframes wx-drop-fall {
          0%   { transform: translate3d(0, -30px, 0) rotate(14deg); opacity: 0; }
          8%   { opacity: 1; }
          92%  { opacity: 1; }
          100% { transform: translate3d(-30vh, 115vh, 0) rotate(14deg); opacity: 0; }
        }
        .wx-flash {
          position: absolute; inset: 0;
          background: radial-gradient(ellipse at 30% 10%, rgba(230,235,255,0.35), transparent 55%);
          animation: wx-flash 9s ease-in-out infinite;
          pointer-events: none;
          opacity: 0;
        }
        @keyframes wx-flash {
          0%, 88%, 100% { opacity: 0; }
          89%           { opacity: 0.9; }
          90%           { opacity: 0.1; }
          91%           { opacity: 0.8; }
          92%           { opacity: 0; }
        }
        .wx-flake {
          position: absolute;
          top: -10px;
          display: block;
          background: #ffffff;
          box-shadow:
            0 0 2px rgba(255,255,255,0.9),
            0 0 4px rgba(200,220,255,0.6);
          border-radius: 0; /* pixel look */
          image-rendering: pixelated;
          animation-name: wx-flake-fall;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
        }
        @keyframes wx-flake-fall {
          0%   { transform: translate3d(0, -10px, 0); }
          50%  { transform: translate3d(var(--drift, 0px), 55vh, 0); }
          100% { transform: translate3d(calc(var(--drift, 0px) * -0.5), 110vh, 0); }
        }


        /* ===== Baús ===== */
        @keyframes chest-bob {
          0%,100% { transform: translateY(0); }
          50%     { transform: translateY(-4px); }
        }
        .chest-idle { animation: chest-bob 1.8s ease-in-out infinite; }
        @keyframes chest-pop {
          0%   { transform: scale(0.4); opacity: 0; }
          60%  { transform: scale(1.15); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        .chest-pop { animation: chest-pop 380ms ease-out; }
        @keyframes evt-slide {
          0% { opacity: 0; transform: translate(-50%, -14px); }
          100% { opacity: 1; transform: translate(-50%, 0); }
        }

        /* ===== Sidebar goodies ===== */
        @keyframes world-globe-spin {
          0%   { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .world-globe-spin {
          animation: world-globe-spin 6s linear infinite;
          transform-origin: 50% 50%;
        }
        .world-globe-btn:hover .world-globe-spin { animation-duration: 2.5s; }
        .world-globe-btn { transition: transform 120ms, box-shadow 160ms; }
        .world-globe-btn:hover { transform: translateY(-1px); box-shadow: 0 0 22px rgba(245,207,107,0.7), inset 0 1px 0 rgba(255,240,180,0.35); }

        @keyframes cash-pack-float {
          0%,100% { transform: translateY(0) rotate(-2deg); }
          50%     { transform: translateY(-4px) rotate(2deg); }
        }
        .cash-pack-float {
          animation: cash-pack-float 2.6s ease-in-out infinite;
          filter: drop-shadow(0 4px 8px rgba(0,0,0,0.4));
        }

        @keyframes lojinha-pulse {
          0%,100% { box-shadow: 0 0 14px rgba(46,255,140,0.75), 0 0 28px rgba(46,255,140,0.45), inset 0 1px 0 rgba(255,255,255,0.4); }
          50%     { box-shadow: 0 0 22px rgba(46,255,140,1), 0 0 44px rgba(46,255,140,0.75), 0 0 60px rgba(120,255,180,0.5), inset 0 1px 0 rgba(255,255,255,0.55); }
        }
        .lojinha-btn-glow { animation: lojinha-pulse 1.6s ease-in-out infinite; }
        .lojinha-btn-glow:hover { transform: translateY(-1px) scale(1.02); }

        @keyframes lojinha-star-fly {
          0%   { transform: translate(0,0) scale(0.4); opacity: 0; }
          20%  { opacity: 1; }
          80%  { opacity: 1; }
          100% { transform: translate(var(--tx,20px), var(--ty,-16px)) scale(1.2); opacity: 0; }
        }
        .lojinha-star {
          position: absolute;
          color: #f6ffb0;
          font-size: 12px;
          text-shadow: 0 0 6px #b8ffcf, 0 0 12px #6cff9d;
          pointer-events: none;
          z-index: 1;
          animation: lojinha-star-fly 1.8s ease-in-out infinite;
        }
        .lojinha-star-1 { top: 4px;  left: 8%;  --tx: -6px; --ty: -14px; animation-delay: 0s;    }
        .lojinha-star-2 { top: 50%;  left: 92%; --tx: 10px; --ty: -8px;  animation-delay: 0.35s; font-size: 10px; }
        .lojinha-star-3 { top: 60%;  left: 4%;  --tx: -12px;--ty: 10px;  animation-delay: 0.7s;  }
        .lojinha-star-4 { top: 6px;  left: 55%; --tx: 4px;  --ty: -18px; animation-delay: 1.05s; font-size: 9px; }
        .lojinha-star-5 { top: 70%;  left: 45%; --tx: 0px;  --ty: 14px;  animation-delay: 1.4s;  font-size: 11px; }


      `}</style>


      {identity && (
        <div style={{ position: "fixed", bottom: 8, left: 8, fontSize: 10, color: "#8a7a9c", zIndex: 100, display: "flex", flexDirection: "column", gap: 2 }}>
          <span>{identity.name}</span>
          <span style={{ fontFamily: "monospace", color: "#c9b8ff", fontSize: 9 }}>
            🌐 IP: {idle.hideIp ? "•••.•••.•••.•••" : (myIp ?? "detectando...")}
          </span>
          <div style={{ display: "flex", gap: 4 }}>
            <button
              onClick={() => { setNetLogOpen(true); void loadNetLogs(); }}
              title="Log de rede / farm"
              style={{ background: "rgba(0,0,0,0.55)", border: "1px solid #6bd4ff", color: "#bfe9ff", borderRadius: 6, padding: "2px 7px", fontSize: 9, fontWeight: 800, cursor: "pointer", letterSpacing: 0.6 }}
            >📜 LOG</button>
            <button
              onClick={() => { setIdle((s) => ({ ...s, hideIp: !s.hideIp })); playClick(); }}
              title="Oculta o IP na tela (continua registrado no servidor por segurança)"
              style={{ background: "rgba(0,0,0,0.55)", border: `1px solid ${idle.hideIp ? "#7ee88a" : "#6a4a70"}`, color: idle.hideIp ? "#9dfaa8" : "#c8b8d0", borderRadius: 6, padding: "2px 7px", fontSize: 9, fontWeight: 800, cursor: "pointer", letterSpacing: 0.6 }}
            >{idle.hideIp ? "👁 MOSTRAR IP" : "🔒 OCULTAR IP"}</button>
          </div>
        </div>
      )}







      {/* ═══ 🏦 BANCO MEDIEVAL — cofre de itens (taxa em Fragmento Vermelho) ═══ */}
      {vaultOpen && (() => {
        const shards = idle.items?.fragmento_vermelho ?? 0;
        const vault = idle.vault ?? {};
        const bagEntries = Object.entries(idle.items ?? {}).filter(([id, n]) => n > 0 && id !== "fragmento_vermelho");
        const vaultEntries = Object.entries(vault).filter(([, n]) => n > 0);
        const move = (id: string, qty: number, toVault: boolean) => {
          if (shards < VAULT_FEE_SHARDS) { pushChat(`🔻 O banqueiro exige ${VAULT_FEE_SHARDS} Fragmentos Vermelhos por operação.`, "info"); return; }
          setIdle((st) => {
            const items = { ...(st.items ?? {}) };
            const vlt = { ...(st.vault ?? {}) };
            const have = toVault ? (items[id] ?? 0) : (vlt[id] ?? 0);
            const q = Math.max(1, Math.min(qty, have));
            if (q <= 0) return st;
            if (toVault) { items[id] = have - q; vlt[id] = (vlt[id] ?? 0) + q; }
            else { vlt[id] = have - q; items[id] = (items[id] ?? 0) + q; }
            items.fragmento_vermelho = (items.fragmento_vermelho ?? 0) - VAULT_FEE_SHARDS;
            return { ...st, items, vault: vlt };
          });
          playClick();
          pushChat(toVault ? `🏦 Guardou ${qty}x no cofre (−${VAULT_FEE_SHARDS} 🔻).` : `🏦 Retirou ${qty}x do cofre (−${VAULT_FEE_SHARDS} 🔻).`, "cap");
        };
        // 🏦 Pokémon: guardar PARA SEMPRE (preservado na 3ª Season). BMP é grátis.
        const isBmpEntry = (e: CollectionEntry) => !!e.event && e.event.startsWith("black_mitic");
        const pokeVault = idle.pokeVault ?? [];
        const storable = (idle.collection ?? []).filter((e) => !team.some((p) => p.uid === e.uid));
        const storePoke = (e: CollectionEntry) => {
          const fee = isBmpEntry(e) ? 0 : POKE_VAULT_FEE_SHARDS;
          if (pokeVault.length >= POKE_VAULT_SLOTS) { pushChat(`🏦 Cofre de pokémons cheio (${POKE_VAULT_SLOTS} vagas).`, "info"); return; }
          if (shards < fee) { pushChat(`🔻 Precisa de ${fee.toLocaleString("pt-BR")} Fragmentos Vermelhos para guardar este pokémon.`, "info"); return; }
          setIdle((st) => {
            const items = { ...(st.items ?? {}) };
            if (fee > 0) items.fragmento_vermelho = (items.fragmento_vermelho ?? 0) - fee;
            return {
              ...st,
              items,
              collection: (st.collection ?? []).filter((c) => c.uid !== e.uid),
              pokeVault: [...(st.pokeVault ?? []), e],
            };
          });
          playClick();
          pushChat(fee === 0 ? `🏦 ${e.species.replace(/_/g, " ")} guardado GRÁTIS (Black Mitic Plus).` : `🏦 ${e.species.replace(/_/g, " ")} guardado para sempre (−${fee.toLocaleString("pt-BR")} 🔻).`, "cap");
        };
        const withdrawPoke = (e: CollectionEntry) => {
          setIdle((st) => ({
            ...st,
            pokeVault: (st.pokeVault ?? []).filter((c) => c.uid !== e.uid),
            collection: [...(st.collection ?? []), e],
          }));
          playClick();
          pushChat(`🏦 ${e.species.replace(/_/g, " ")} retirado do cofre.`, "cap");
        };
        const PokeRow = ({ e, stored }: { e: CollectionEntry; stored: boolean }) => {
          const bmp = isBmpEntry(e);
          return (
            <div style={{ display: "flex", alignItems: "center", gap: 8, background: bmp ? "linear-gradient(120deg, rgba(160,102,255,0.22), rgba(0,0,0,0.4))" : "rgba(0,0,0,0.35)", border: `1px solid ${bmp ? "rgba(160,102,255,0.55)" : "rgba(245,207,107,0.3)"}`, borderRadius: 8, padding: "6px 8px" }}>
              {GIF[e.species] && <img src={GIF[e.species]} alt="" width={30} height={30} loading="lazy" style={{ imageRendering: "pixelated" }} />}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: bmp ? "#e9d5ff" : "#ffe89a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{e.species.replace(/_/g, " ").toUpperCase()}</div>
                <div style={{ fontSize: 9.5, color: bmp ? "#c9a8ff" : "#c8b8d0" }}>Nv. {e.level} · {bmp ? "BLACK MITIC PLUS · GRÁTIS" : e.rarity.toUpperCase()}</div>
              </div>
              <button
                onClick={() => (stored ? withdrawPoke(e) : storePoke(e))}
                style={{ background: "#2a1a2e", border: `1px solid ${stored ? "#6bd4ff" : "#f5cf6b"}`, color: stored ? "#bfe9ff" : "#ffe89a", borderRadius: 6, padding: "4px 8px", fontSize: 10, fontWeight: 900, cursor: "pointer", whiteSpace: "nowrap" }}
              >{stored ? "◀ RETIRAR" : bmp ? "▶ GRÁTIS" : `▶ ${fmtK(POKE_VAULT_FEE_SHARDS)} 🔻`}</button>
            </div>
          );
        };
        const Cell = ({ id, n, toVault }: { id: string; n: number; toVault: boolean }) => (
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(0,0,0,0.35)", border: "1px solid rgba(245,207,107,0.3)", borderRadius: 8, padding: "6px 8px" }}>
            {ITEM_IMG[id] ? (
              <img src={ITEM_IMG[id]} alt="" width={28} height={28} loading="lazy" style={{ imageRendering: "pixelated" }} />
            ) : (
              <ItemPixelIcon id={id} size={28} color={ITEM_COLORS[id] ?? "#f5cf6b"} />
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: "#ffe89a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{id}</div>
              <div style={{ fontSize: 10, color: "#c8b8d0" }}>x{n}</div>
            </div>
            <button onClick={() => move(id, 1, toVault)} style={{ background: "#2a1a2e", border: "1px solid #f5cf6b", color: "#ffe89a", borderRadius: 6, padding: "4px 7px", fontSize: 10, fontWeight: 900, cursor: "pointer" }}>{toVault ? "▶ 1" : "◀ 1"}</button>
            <button onClick={() => move(id, n, toVault)} style={{ background: "#2a1a2e", border: "1px solid #6bd4ff", color: "#bfe9ff", borderRadius: 6, padding: "4px 7px", fontSize: 10, fontWeight: 900, cursor: "pointer" }}>{toVault ? "▶ TUDO" : "◀ TUDO"}</button>
          </div>
        );
        return createPortal(
          <div onClick={() => setVaultOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 99999, background: "rgba(0,0,0,0.85)", display: "grid", placeItems: "center", padding: 16 }}>
            <div onClick={(e) => e.stopPropagation()} style={{ width: "min(760px, 100%)", maxHeight: "88vh", overflowY: "auto", background: "linear-gradient(160deg, #241a12 0%, #0e0906 100%)", border: "3px solid #f5cf6b", borderRadius: 16, padding: 18, boxShadow: "0 0 70px rgba(245,207,107,0.35)" }}>

              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <img src={houseBankImg} alt="" width={48} height={54} loading="lazy" style={{ imageRendering: "pixelated" }} />
                <div style={{ flex: 1 }}>
                  <div style={{ color: "#f5cf6b", fontWeight: 900, fontSize: 17, letterSpacing: 1.4, fontFamily: "'Cinzel', Georgia, serif" }}>🏦 BANCO MEDIEVAL</div>
                  <div style={{ color: "#c8b8d0", fontSize: 10.5 }}>Guarde seus itens em segurança · taxa de {VAULT_FEE_SHARDS} 🔻 por operação</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 5, background: "rgba(0,0,0,0.45)", border: "1px solid #ff6b6b", borderRadius: 8, padding: "5px 9px" }}>
                  <img src={redShardImg} alt="" width={18} height={18} loading="lazy" style={{ imageRendering: "pixelated" }} />
                  <span style={{ color: "#ff9b9b", fontWeight: 900, fontSize: 12 }}>{shards}</span>
                </div>
                <button onClick={() => setVaultOpen(false)} style={{ background: "#2a1a2e", border: "1px solid #6a4a70", color: "#c8b8d0", borderRadius: 8, padding: "6px 10px", fontWeight: 800, fontSize: 11, cursor: "pointer" }}>FECHAR (ESC)</button>
              </div>
              <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
                {(["itens", "pokemon"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => { setVaultTab(t); playClick(); }}
                    style={{
                      flex: 1, padding: "7px 10px", borderRadius: 8, cursor: "pointer",
                      background: vaultTab === t ? "linear-gradient(180deg,#f5cf6b,#b8862a)" : "rgba(0,0,0,0.4)",
                      border: `1px solid ${vaultTab === t ? "#ffe89a" : "#6a4a70"}`,
                      color: vaultTab === t ? "#2a1a08" : "#c8b8d0",
                      fontWeight: 900, fontSize: 11, letterSpacing: 1,
                    }}
                  >{t === "itens" ? "🗄 ITENS" : "🐾 POKÉMONS"}</button>
                ))}
              </div>
              {vaultTab === "pokemon" && (
                <div style={{ background: "rgba(160,102,255,0.12)", border: "1px solid rgba(160,102,255,0.4)", borderRadius: 8, padding: "7px 10px", marginBottom: 10, fontSize: 10.5, color: "#e0cbff", lineHeight: 1.5 }}>
                  🛡 Pokémons guardados aqui são <b>preservados na 3ª Season</b> (não serão resetados).<br />
                  Taxa: <b>{POKE_VAULT_FEE_SHARDS.toLocaleString("pt-BR")} 🔻</b> por pokémon · <b>Black Mitic Plus é grátis</b> · vagas usadas: <b>{pokeVault.length}/{POKE_VAULT_SLOTS}</b>
                </div>
              )}
              {vaultTab === "itens" ? (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <div style={{ color: "#ffe89a", fontSize: 11, fontWeight: 900, letterSpacing: 1, marginBottom: 6 }}>🎒 MOCHILA</div>
                    <div style={{ display: "grid", gap: 6 }}>
                      {bagEntries.length === 0 ? <div style={{ color: "#8a7a9c", fontSize: 11 }}>Mochila vazia.</div>
                        : bagEntries.map(([id, n]) => <Cell key={id} id={id} n={n} toVault />)}
                    </div>
                  </div>
                  <div>
                    <div style={{ color: "#ffe89a", fontSize: 11, fontWeight: 900, letterSpacing: 1, marginBottom: 6 }}>🗄 COFRE</div>
                    <div style={{ display: "grid", gap: 6 }}>
                      {vaultEntries.length === 0 ? <div style={{ color: "#8a7a9c", fontSize: 11 }}>Cofre vazio.</div>
                        : vaultEntries.map(([id, n]) => <Cell key={id} id={id} n={n} toVault={false} />)}
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <div style={{ color: "#ffe89a", fontSize: 11, fontWeight: 900, letterSpacing: 1, marginBottom: 6 }}>🐾 COLEÇÃO ({storable.length})</div>
                    <div style={{ display: "grid", gap: 6, maxHeight: "46vh", overflowY: "auto" }}>
                      {storable.length === 0 ? <div style={{ color: "#8a7a9c", fontSize: 11 }}>Nenhum pokémon disponível (os do time não podem ser guardados).</div>
                        : storable.map((e) => <PokeRow key={e.uid} e={e} stored={false} />)}
                    </div>
                  </div>
                  <div>
                    <div style={{ color: "#e0cbff", fontSize: 11, fontWeight: 900, letterSpacing: 1, marginBottom: 6 }}>🏦 COFRE ETERNO ({pokeVault.length}/{POKE_VAULT_SLOTS})</div>
                    <div style={{ display: "grid", gap: 6, maxHeight: "46vh", overflowY: "auto" }}>
                      {pokeVault.length === 0 ? <div style={{ color: "#8a7a9c", fontSize: 11 }}>Cofre eterno vazio.</div>
                        : pokeVault.map((e) => <PokeRow key={e.uid} e={e} stored />)}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>,
          document.body
        );
      })()}


      {/* ═══ 🏰 GINÁSIO MEDIEVAL — endgame: 3 andares + portal do Vale ═══ */}
      {gymOpen && (() => {
        const shards = idle.items?.fragmento_vermelho ?? 0;
        const st = valeEventStatus();
        const lv = idle.trainerLevel ?? 1;
        const hasBmp = (idle.collection ?? []).some((e) => typeof e.event === "string" && e.event.startsWith("black_mitic"));
        const canEnterVale = st.open && shards >= GYM_ENTRY_SHARDS && idle.currentMap !== "vale_fragmentos";
        const enterVale = () => {
          if (!canEnterVale) return;
          setIdle((s) => ({
            ...s,
            items: { ...(s.items ?? {}), fragmento_vermelho: (s.items?.fragmento_vermelho ?? 0) - GYM_ENTRY_SHARDS },
            valeReturnMap: s.currentMap,
            currentMap: "vale_fragmentos",
          }));
          playClick();
          pushChat(`🏰 Você entrou no Vale dos Fragmentos Vermelhos (−${GYM_ENTRY_SHARDS.toLocaleString("pt-BR")} 🔻).`, "cap");
          setGymOpen(false);
        };
        const enterFloor = (f: GymFloorDef) => {
          if (lv < f.reqLevel || shards < f.entryShards || (f.requiresBmp && !hasBmp) || idle.currentMap === f.id) return;
          setIdle((s) => ({
            ...s,
            items: { ...(s.items ?? {}), fragmento_vermelho: (s.items?.fragmento_vermelho ?? 0) - f.entryShards },
            valeReturnMap: isGymMap(s.currentMap) ? s.valeReturnMap : s.currentMap,
            currentMap: f.id,
          }));
          playClick();
          pushChat(`🏰 Você adentrou o ${f.label} (−${f.entryShards.toLocaleString("pt-BR")} 🔻). Prepare-se.`, "cap");
          setGymOpen(false);
        };
        return createPortal(
          <div onClick={() => setGymOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 99999, background: "rgba(0,0,0,0.88)", display: "grid", placeItems: "center", padding: 16 }}>

            <div onClick={(e) => e.stopPropagation()} style={{ width: "min(680px, 100%)", maxHeight: "88vh", overflowY: "auto", background: "linear-gradient(160deg, #2a1010 0%, #0d0505 60%, #150a20 100%)", border: "3px solid #ff5c5c", borderRadius: 16, padding: 18, boxShadow: "0 0 70px rgba(255,92,92,0.35)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <img src={houseGymImg} alt="" width={48} height={54} loading="lazy" style={{ imageRendering: "pixelated" }} />
                <div style={{ flex: 1 }}>
                  <div style={{ color: "#ff9b9b", fontWeight: 900, fontSize: 17, letterSpacing: 1.4, fontFamily: "'Cinzel', Georgia, serif" }}>🏰 GINÁSIO MEDIEVAL</div>
                  <div style={{ color: "#c8b8d0", fontSize: 10.5 }}>Conteúdo de endgame · 3 andares encadeados · Santuário Arcano exclusivo Black Mythic</div>
                </div>
                <button onClick={() => setGymOpen(false)} style={{ background: "#2a1a1a", border: "1px solid #6a4a4a", color: "#c8b8d0", borderRadius: 8, padding: "6px 10px", fontWeight: 800, fontSize: 11, cursor: "pointer" }}>FECHAR (ESC)</button>
              </div>

              <div style={{ display: "grid", gap: 10 }}>
                {GYM_FLOORS.map((f) => {
                  const lvOk = lv >= f.reqLevel;
                  const shOk = shards >= f.entryShards;
                  const bmpOk = !f.requiresBmp || hasBmp;
                  const here = idle.currentMap === f.id;
                  const ok = lvOk && shOk && bmpOk && !here;
                  return (
                    <div key={f.id} style={{ background: "rgba(0,0,0,0.45)", border: `1px solid ${f.color}55`, borderRadius: 12, padding: 12 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ color: f.color, fontWeight: 900, fontSize: 13.5, letterSpacing: 1, fontFamily: "'Cinzel', Georgia, serif" }}>{f.label}</div>
                          <div style={{ color: "#c8b8d0", fontSize: 10.5, lineHeight: 1.5, marginTop: 2 }}>{f.desc}</div>
                        </div>
                        {f.requiresBmp && <div style={{ color: "#c58bff", fontSize: 10, fontWeight: 900 }}>✦ BLACK MYTHIC</div>}
                      </div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8, fontSize: 10.5 }}>
                        <span style={{ color: lvOk ? "#7ee88a" : "#ff8b8b", fontWeight: 800 }}>Nv {f.reqLevel.toLocaleString("pt-BR")}+</span>
                        <span style={{ color: shOk ? "#7ee88a" : "#ff8b8b", fontWeight: 800 }}>{f.entryShards.toLocaleString("pt-BR")} 🔻</span>
                        <span style={{ color: "#ffb86b" }}>HP ×{f.hpMult} · DANO ×{f.dmgMult}</span>
                        <span style={{ color: "#9fe8ff" }}>Drop {f.shards[0]}–{f.shards[1]} 🔻</span>
                        <span style={{ color: "#ff8bd0" }}>Captura ×{f.captureMult}</span>
                      </div>
                      <button
                        onClick={() => enterFloor(f)}
                        disabled={!ok}
                        style={{
                          width: "100%", marginTop: 10, padding: "9px 0", borderRadius: 10,
                          background: ok ? `linear-gradient(180deg,${f.color},#1a0a1a)` : "#241a24",
                          border: `1px solid ${ok ? f.color : "#5a3a5a"}`,
                          color: ok ? "#0d0510" : "#7a6a7a", fontWeight: 900, fontSize: 12, letterSpacing: 1.2,
                          cursor: ok ? "pointer" : "not-allowed",
                        }}
                      >{here ? "VOCÊ ESTÁ AQUI" : !bmpOk ? "EXIGE UM BLACK MITIC PLUS" : !lvOk ? `NÍVEL INSUFICIENTE` : !shOk ? "FRAGMENTOS INSUFICIENTES" : "ADENTRAR 🏰"}</button>
                    </div>
                  );
                })}
              </div>

              <div style={{ marginTop: 14, background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,92,92,0.35)", borderRadius: 10, padding: 12, fontSize: 11.5, color: "#f0d8d8", lineHeight: 1.7 }}>
                <div style={{ color: "#ff9b9b", fontWeight: 900, marginBottom: 4 }}>🔻 VALE DOS FRAGMENTOS VERMELHOS</div>
                <div>🔻 Cada pokémon derrotado ou capturado dropa <b>5 a 20 Fragmentos Vermelhos</b>.</div>
                <div>⏱ Aberto <b>1 hora</b>, reabre <b>a cada 5 horas</b>.</div>
                <div>💰 Entrada: <b style={{ color: "#ff9b9b" }}>{GYM_ENTRY_SHARDS.toLocaleString("pt-BR")} 🔻</b> · você tem <b style={{ color: shards >= GYM_ENTRY_SHARDS ? "#7ee88a" : "#ff8b8b" }}>{shards.toLocaleString("pt-BR")} 🔻</b></div>
                <div style={{ marginTop: 6, color: st.open ? "#7ee88a" : "#ffb86b", fontWeight: 900 }}>
                  {st.open ? `🟢 ABERTO — fecha em ${fmtHMS(st.msUntilChange)}` : `🔴 FECHADO — abre em ${fmtHMS(st.msUntilChange)}`}
                </div>
                <button
                  onClick={enterVale}
                  disabled={!canEnterVale}
                  style={{
                    width: "100%", marginTop: 10, padding: "10px 0", borderRadius: 10,
                    background: canEnterVale ? "linear-gradient(180deg,#ff6b6b,#8b1a1a)" : "#2a1a1a",
                    border: `1px solid ${canEnterVale ? "#ffb3b3" : "#5a3a3a"}`,
                    color: canEnterVale ? "#fff" : "#7a6a6a", fontWeight: 900, fontSize: 12.5, letterSpacing: 1.3,
                    cursor: canEnterVale ? "pointer" : "not-allowed",
                  }}
                >{idle.currentMap === "vale_fragmentos" ? "VOCÊ JÁ ESTÁ NO VALE" : st.open ? "ENTRAR NO VALE 🔻" : "EVENTO FECHADO"}</button>
              </div>
            </div>
          </div>,
          document.body
        );
      })()}



      {/* ═══ 📜 LOG DE REDE / FARM ═══ */}
      {netLogOpen && createPortal(
        <div onClick={() => setNetLogOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 99999, background: "rgba(0,0,0,0.85)", display: "grid", placeItems: "center", padding: 16 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: "min(720px, 100%)", maxHeight: "85vh", overflowY: "auto", background: "linear-gradient(160deg, #0d1824 0%, #05080d 100%)", border: "3px solid #6bd4ff", borderRadius: 16, padding: 18, boxShadow: "0 0 70px rgba(107,212,255,0.3)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <div style={{ flex: 1 }}>
                <div style={{ color: "#bfe9ff", fontWeight: 900, fontSize: 16, letterSpacing: 1.4 }}>📜 LOG DE REDE</div>
                <div style={{ color: "#7f95a8", fontSize: 10.5 }}>Seu IP atual: <b style={{ color: "#c9b8ff", fontFamily: "monospace" }}>{myIp ?? "—"}</b> · sessão de farm: {fmtHMS(activeTime)}</div>
              </div>
              <button onClick={() => void loadNetLogs()} style={{ background: "#10222f", border: "1px solid #6bd4ff", color: "#bfe9ff", borderRadius: 8, padding: "6px 10px", fontWeight: 800, fontSize: 11, cursor: "pointer" }}>🔄 ATUALIZAR</button>
              <button onClick={() => setNetLogOpen(false)} style={{ background: "#10222f", border: "1px solid #3b5a6b", color: "#9ab", borderRadius: 8, padding: "6px 10px", fontWeight: 800, fontSize: 11, cursor: "pointer" }}>FECHAR (ESC)</button>
            </div>
            <div style={{ display: "grid", gap: 5 }}>
              {netLogLoading && <div style={{ color: "#7f95a8", fontSize: 11 }}>Carregando registros...</div>}
              {!netLogLoading && netLogs.length === 0 && <div style={{ color: "#7f95a8", fontSize: 11 }}>Nenhum registro de acesso encontrado.</div>}
              {netLogs.map((r) => (
                <div key={r.id} style={{ display: "flex", gap: 10, alignItems: "center", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(107,212,255,0.18)", borderRadius: 8, padding: "6px 9px", fontSize: 10.5 }}>
                  <span style={{ color: "#c9b8ff", fontFamily: "monospace", fontWeight: 900, minWidth: 118 }}>{r.ip}</span>
                  <span style={{ color: "#ffe89a", fontWeight: 800, minWidth: 110, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.username ?? r.user_id.slice(0, 8)}</span>
                  <span style={{ color: "#8fa4b4", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.user_agent ?? "—"}</span>
                  <span style={{ color: "#7f95a8" }}>{new Date(r.created_at).toLocaleString("pt-BR")}</span>
                </div>
              ))}
            </div>
          </div>
        </div>,
        document.body
      )}

      {worldTraderOpen && createPortal((() => {
          const collection = idle.collection ?? [];
          const teamUidsForTrade = new Set((teamRef.current ?? []).map((p) => p.uid));
          const benchUidsForTrade = new Set((benchRef.current ?? []).map((p) => p.uid));
          return (
            <div
              onClick={() => { setWorldTraderOpen(false); setWorldTraderPick(null); setWorldTraderSel(new Set()); }}
              style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.82)", zIndex: 10005, display: "grid", placeItems: "center", padding: 16 }}
            >
              <div
                onClick={(e) => e.stopPropagation()}
                style={{
                  width: "min(640px, 100%)", maxHeight: "90vh", overflowY: "auto",
                  background: "linear-gradient(180deg,#1c0f2e,#0b0510)",
                border: "2px solid #ffd94d", borderRadius: 16, padding: 18,
                boxShadow: "0 12px 36px rgba(0,0,0,0.75), 0 0 32px rgba(255,217,77,0.35)",
              }}
            >
              {/* Cabeçalho do NPC */}
              <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 12 }}>
                <img src={npcTraderUrl} alt="" width={72} height={90}
                  style={{ imageRendering: "pixelated", filter: "drop-shadow(0 3px 6px rgba(0,0,0,0.6))" }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 16, fontWeight: 900, color: "#ffd94d" }}>🧙 Elyra, a Trocadora</div>
                  <div style={{ fontSize: 11, color: "#c8b8d0", lineHeight: 1.5, marginTop: 4, fontStyle: "italic" }}>
                    "Traga-me Pokémon da sua <b style={{ color: "#ffd94d" }}>Coleção</b> e eu os transformarei em <b style={{ color: "#ffd94d" }}>Orbs de XP</b>. Você escolhe quais entregar."
                  </div>
                </div>
                <button
                  onClick={() => { setWorldTraderOpen(false); setWorldTraderPick(null); setWorldTraderSel(new Set()); }}
                  style={{ background: "transparent", border: "none", color: "#eadfe8", cursor: "pointer", fontSize: 20 }}
                >✕</button>
              </div>

              {!worldTraderPick && (
                <>
                  <div style={{ color: "#b8a8c8", fontSize: 12, marginBottom: 10 }}>Escolha a raridade da troca:</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    {ORB_TRADES.map((t) => {
                      const available = collection.filter((c) =>
                        (c.rarity === t.rarity || (t.rarity === "mythic" && c.rarity === "mythic_shiny"))
                        && !teamUidsForTrade.has(c.uid)
                        && !benchUidsForTrade.has(c.uid),
                      ).length;
                      const reqOk = !t.requires || (idle.items[t.requires.itemId] ?? 0) >= t.requires.qty;
                      const reqOwned = t.requires ? (idle.items[t.requires.itemId] ?? 0) : 0;
                      const canTrade = available >= t.count && reqOk;
                      const owned = idle.items[t.orbId] ?? 0;
                      return (
                        <div key={`${t.orbId}-${t.rarity}`} style={{
                          background: "linear-gradient(160deg, #1a0f26 0%, #251638 100%)",
                          border: `2px solid ${t.color}66`, borderRadius: 14, padding: 14,
                          display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
                          boxShadow: `0 4px 14px rgba(0,0,0,0.4), inset 0 1px 0 ${t.color}33`,
                          opacity: reqOk ? 1 : 0.85,
                        }}>
                          <img src={t.img} alt={t.label} width={72} height={72}
                            style={{ imageRendering: "pixelated", filter: `drop-shadow(0 0 12px ${t.color}bb)` }} />
                          <div style={{ fontWeight: 900, color: "#eadfe8", fontSize: 14 }}>{t.label}</div>
                          <div style={{ fontSize: 11, color: "#b8a8c8", textAlign: "center", lineHeight: 1.4 }}>{t.desc}</div>
                          <div style={{ fontSize: 11, color: available >= t.count ? "#8ae28a" : "#e28a8a", fontWeight: 700 }}>
                            {t.rarity.toUpperCase()} na coleção: {available}/{t.count}
                          </div>
                          {t.requires && (
                            <div style={{ fontSize: 10, fontWeight: 800, color: reqOk ? "#8ae28a" : "#ff9a6b", background: reqOk ? "#0f2018" : "#2a1620", border: `1px solid ${reqOk ? "#8ae28a55" : "#ff9a6b55"}`, borderRadius: 6, padding: "3px 8px", textAlign: "center" }}>
                              {reqOk ? "✓" : "🔒"} Requer {t.requires.qty}× {t.requires.label} ({reqOwned}/{t.requires.qty})
                            </div>
                          )}
                          <div style={{ fontSize: 10, color: "#8a7a9c" }}>Você tem: {owned}</div>
                          {/* Barra de chance base — visível já na seleção */}
                          <div style={{ width: "100%", background: "#0f0820", border: "1px solid #3a2a4a", borderRadius: 8, padding: "6px 8px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#c8b8d0", marginBottom: 3 }}>
                              <span>Sucesso base</span>
                              <b style={{ color: t.baseSuccess >= 0.75 ? "#8ae28a" : t.baseSuccess >= 0.5 ? "#ffd94d" : "#ff9a6b" }}>{Math.round(t.baseSuccess * 100)}%</b>
                            </div>
                            <div style={{ height: 6, background: "#1a0f26", borderRadius: 4, overflow: "hidden" }}>
                              <div style={{ width: `${t.baseSuccess * 100}%`, height: "100%", background: `linear-gradient(90deg, #6bd66b, ${t.color})` }} />
                            </div>
                            <div style={{ fontSize: 9, color: "#8a7a9c", marginTop: 3, textAlign: "center" }}>+ combustível até 95%</div>
                          </div>
                          <button
                            disabled={!canTrade}
                            onClick={() => { setWorldTraderPick(t); setWorldTraderSel(new Set()); setWorldTraderFuel(new Set()); setWorldTraderFuelTab("common"); }}
                            style={{
                              width: "100%", padding: "8px 10px", fontWeight: 900, fontSize: 12,
                              background: canTrade ? t.color : "#3a2a4a",
                              color: canTrade ? "#0b0510" : "#6a5a7c",
                              border: "none", borderRadius: 8,
                              cursor: canTrade ? "pointer" : "not-allowed",
                            }}
                          >{!reqOk ? `FORJE 1 ${t.requires!.label.toUpperCase()} PRIMEIRO` : available >= t.count ? "ESCOLHER POKÉMON" : `PRECISA ${t.count} ${t.rarity.toUpperCase()}`}</button>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}

              {worldTraderPick && (() => {
                const pick = worldTraderPick;
                const teamU = new Set(team.map((p) => p.uid));
                const benchU = new Set(restingBench.map((p) => p.uid));
                const eligible = collection.filter((c) => (c.rarity === pick.rarity || (pick.rarity === "mythic" && c.rarity === "mythic_shiny")) && !teamU.has(c.uid) && !benchU.has(c.uid));
                const fuelRarities: FuelRarity[] = (["common", "uncommon", "rare"] as FuelRarity[]).filter((r) => r !== pick.rarity);
                const fuelPool = collection.filter((c) => (c.rarity === "common" || c.rarity === "uncommon" || c.rarity === "rare") && c.rarity !== pick.rarity && !teamU.has(c.uid) && !benchU.has(c.uid));
                const activeTab: FuelRarity = fuelRarities.includes(worldTraderFuelTab) ? worldTraderFuelTab : fuelRarities[0];
                const fuelOfTab = fuelPool.filter((c) => c.rarity === activeTab);
                const selCount = worldTraderSel.size;
                const fuelCount = worldTraderFuel.size;
                const canConfirm = selCount === pick.count;
                const breakdown = getFuelBreakdown(worldTraderFuel);
                const { success, lucky } = computeOrbChances(pick, breakdown);
                // ~50% da sorte vai para "orb evolui" e 50% para "+tempo" (se houver upgrade); senão tudo vai pra tempo
                const upgradeChance = pick.upgradeTo ? lucky * 0.5 : 0;
                const timeChance = pick.upgradeTo ? lucky * 0.5 : lucky;
                return (
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                      <div style={{ fontWeight: 900, color: pick.color, fontSize: 14 }}>
                        Incubadora · {pick.count}× {pick.rarity.toUpperCase()}
                      </div>
                      <button
                        onClick={() => { setWorldTraderPick(null); setWorldTraderSel(new Set()); setWorldTraderFuel(new Set()); }}
                        style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(245,207,107,0.2)", color: "#b8a8c8", cursor: "pointer", fontSize: 11, padding: "4px 10px", borderRadius: 6 }}
                      >← VOLTAR</button>
                    </div>

                    {/* Barra de chances */}
                    <div style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(245, 207, 107, 0.1)", borderRadius: 10, padding: 10, marginBottom: 10 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#c8b8d0", marginBottom: 4 }}>
                        <span>Chance de SUCESSO</span>
                        <b style={{ color: success >= 0.75 ? "#8ae28a" : success >= 0.5 ? "#ffd94d" : "#ff9a6b" }}>{Math.round(success * 100)}%</b>
                      </div>
                      <div style={{ height: 8, background: "#1a0f26", borderRadius: 4, overflow: "hidden" }}>
                        <div style={{ width: `${success * 100}%`, height: "100%", background: `linear-gradient(90deg, #6bd66b, ${pick.color})`, transition: "width .3s" }} />
                      </div>
                      {pick.upgradeTo && (
                        <>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#c8b8d0", margin: "8px 0 4px" }}>
                            <span>✨ Orb EVOLUI (upgrade)</span>
                            <b style={{ color: "#ff9adf" }}>{Math.round(upgradeChance * 100)}%</b>
                          </div>
                          <div style={{ height: 6, background: "#1a0f26", borderRadius: 4, overflow: "hidden" }}>
                            <div style={{ width: `${upgradeChance * 100}%`, height: "100%", background: "linear-gradient(90deg, #ff9adf, #ffd94d)" }} />
                          </div>
                        </>
                      )}
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#c8b8d0", margin: "8px 0 4px" }}>
                        <span>⏱️ +TEMPO extra (+1~2h)</span>
                        <b style={{ color: "#ffd94d" }}>{Math.round(timeChance * 100)}%</b>
                      </div>
                      <div style={{ height: 6, background: "#1a0f26", borderRadius: 4, overflow: "hidden" }}>
                        <div style={{ width: `${timeChance * 100}%`, height: "100%", background: "linear-gradient(90deg, #ffd94d, #8ae28a)" }} />
                      </div>
                    </div>

                    <div style={{ fontSize: 11, color: "#b8a8c8", marginBottom: 6 }}>
                      Selecionados: <b style={{ color: canConfirm ? "#8ae28a" : "#ffd94d" }}>{selCount}/{pick.count}</b>
                    </div>
                    {eligible.length === 0 ? (
                      <div style={{ color: "#e28a8a", fontSize: 12, padding: 24, textAlign: "center" }}>
                        Você não tem Pokémon {pick.rarity.toUpperCase()} na coleção.
                      </div>
                    ) : (
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(84px, 1fr))", gap: 6, maxHeight: "22vh", overflowY: "auto", padding: 4 }}>
                        {eligible.map((c) => {
                          const sel = worldTraderSel.has(c.uid);
                          const disabled = !sel && selCount >= pick.count;
                          return (
                            <button
                              key={c.uid}
                              disabled={disabled}
                              onClick={() => {
                                setWorldTraderSel((prev) => {
                                  const next = new Set(prev);
                                  if (next.has(c.uid)) next.delete(c.uid); else next.add(c.uid);
                                  return next;
                                });
                              }}
                              style={{
                                background: sel ? `rgba(245, 207, 107, 0.1)` : "rgba(0,0,0,0.3)",
                                border: sel ? `2px solid ${pick.color}` : "1px solid rgba(245, 207, 107, 0.1)",

                                borderRadius: 10, padding: 4, cursor: disabled ? "not-allowed" : "pointer",
                                display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
                                opacity: disabled ? 0.4 : 1, position: "relative",
                              }}
                            >
                              {GIF[c.species] ? (
                                <img src={GIF[c.species]} alt="" style={{ width: 48, height: 48, imageRendering: "pixelated" }} />
                              ) : (
                                <div style={{ width: 48, height: 48, background: "#2a1638", borderRadius: 8 }} />
                              )}
                              <div style={{ fontSize: 9, color: "#eadfe8", fontWeight: 700, textTransform: "capitalize" }}>{c.species.replace(/_/g, " ")}</div>
                              <div style={{ fontSize: 9, color: "#ffd94d" }}>Lv.{c.level}</div>
                              {sel && (
                                <div style={{ position: "absolute", top: 2, right: 2, background: pick.color, color: "#0b0510", width: 16, height: 16, borderRadius: 999, fontSize: 10, fontWeight: 900, display: "grid", placeItems: "center" }}>✓</div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* Combustível: filtros de raridade */}
                    <div style={{ marginTop: 10, padding: 8, background: "#0f0820", border: "1px dashed #3a2a4a", borderRadius: 10 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6, flexWrap: "wrap", gap: 6 }}>
                        <div style={{ fontSize: 11, color: "#c8b8d0" }}>
                          ⚡ Combustível — usados: <b style={{ color: "#ffd94d" }}>{fuelCount}/{MAX_FUEL}</b>
                          {fuelCount > 0 && <span style={{ marginLeft: 6, fontSize: 10, color: "#8a7a9c" }}>
                            ({breakdown.common > 0 && `${breakdown.common}C `}{breakdown.uncommon > 0 && `${breakdown.uncommon}I `}{breakdown.rare > 0 && `${breakdown.rare}R`})
                          </span>}
                        </div>
                        <div style={{ display: "flex", gap: 4 }}>
                          {fuelRarities.map((r) => {
                            const tier = FUEL_TIERS[r];
                            const active = activeTab === r;
                            const count = fuelPool.filter((x) => x.rarity === r).length;
                            return (
                              <button key={r} onClick={() => setWorldTraderFuelTab(r)}
                                style={{
                                  fontSize: 10, fontWeight: 900, padding: "3px 8px", borderRadius: 6, cursor: "pointer",
                                  background: active ? tier.color : "transparent",
                                  color: active ? "#0b0510" : tier.color,
                                  border: `1px solid ${tier.color}77`,
                                }}
                              >{tier.label} +{Math.round(tier.boost * 100)}% ({count})</button>
                            );
                          })}
                        </div>
                      </div>
                      {fuelOfTab.length === 0 ? (
                        <div style={{ fontSize: 11, color: "#8a7a9c", padding: 8, textAlign: "center" }}>Nenhum {FUEL_TIERS[activeTab].label} disponível.</div>
                      ) : (
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(64px, 1fr))", gap: 4, maxHeight: "16vh", overflowY: "auto" }}>
                          {fuelOfTab.map((c) => {
                            const sel = worldTraderFuel.has(c.uid);
                            const disabled = !sel && fuelCount >= MAX_FUEL;
                            const tierColor = FUEL_TIERS[c.rarity as FuelRarity].color;
                            return (
                              <button
                                key={c.uid}
                                disabled={disabled}
                                onClick={() => {
                                  setWorldTraderFuel((prev) => {
                                    const next = new Set(prev);
                                    if (next.has(c.uid)) next.delete(c.uid); else next.add(c.uid);
                                    return next;
                                  });
                                }}
                                style={{
                                  background: sel ? "rgba(245, 207, 107, 0.1)" : "rgba(0,0,0,0.3)",
                                  border: sel ? `2px solid ${tierColor}` : "1px solid rgba(245, 207, 107, 0.1)",

                                  borderRadius: 8, padding: 3, cursor: disabled ? "not-allowed" : "pointer",
                                  opacity: disabled ? 0.4 : 1,
                                }}
                              >
                                {GIF[c.species] ? (
                                  <img src={GIF[c.species]} alt="" style={{ width: 38, height: 38, imageRendering: "pixelated" }} />
                                ) : <div style={{ width: 38, height: 38, background: "#2a1638", borderRadius: 6 }} />}
                                <div style={{ fontSize: 8, color: "#c8b8d0" }}>Lv.{c.level}</div>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                      <button
                        onClick={() => { setWorldTraderPick(null); setWorldTraderSel(new Set()); setWorldTraderFuel(new Set()); }}
                        style={{ flex: 1, padding: "10px", background: "rgba(0,0,0,0.3)", color: "#eadfe8", border: "1px solid rgba(245,207,107,0.2)", borderRadius: 8, fontWeight: 800, cursor: "pointer" }}

                      >CANCELAR</button>
                      <button
                        disabled={!canConfirm}
                        onClick={() => {
                          const uids = Array.from(worldTraderSel);
                          const fuel = Array.from(worldTraderFuel);
                          setWorldTraderPick(null);
                          setWorldTraderSel(new Set());
                          setWorldTraderFuel(new Set());
                          // NÃO fechar o modal aqui — se fechar, o overlay do orbAnim
                          // (que está dentro deste IIFE) desmonta e a animação some.
                          tradeForOrb(pick.orbId, uids, fuel, pick.rarity);
                        }}
                        style={{
                          flex: 2, padding: "10px", fontWeight: 900,
                          background: canConfirm ? "linear-gradient(180deg, #f5cf6b, #b8862a)" : "rgba(0,0,0,0.5)",
                          color: canConfirm ? "#000" : "#6a5a7c",
                          border: canConfirm ? "1px solid #fff4d0" : "1px solid rgba(255,255,255,0.05)",
                          borderRadius: 8, cursor: canConfirm ? "pointer" : "not-allowed",

                        }}
                      >⚗️ INCUBAR</button>
                    </div>
                  </div>
                );
              })()}
              </div>
            </div>
          );
        })(), document.body)}











      {/* Incubadora — animação de sucesso/falha */}
      {orbAnim && (
        <div
          onClick={() => { if (orbAnim.phase !== "spinning") setOrbAnim(null); }}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.88)", zIndex: 10010, display: "grid", placeItems: "center", padding: 16 }}
        >
          <style>{`
            @keyframes orb-spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
            @keyframes orb-pulse { 0%,100% { transform: scale(1); filter: drop-shadow(0 0 20px ${orbAnim.color}) } 50% { transform: scale(1.06); filter: drop-shadow(0 0 40px ${orbAnim.color}) } }
            @keyframes orb-shake { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-6px) rotate(-2deg)} 40%{transform:translateX(6px) rotate(2deg)} 60%{transform:translateX(-4px)} 80%{transform:translateX(4px)} }
            @keyframes orb-drop { from { transform: translateY(-30px) scale(.4); opacity: 0 } to { transform: translateY(0) scale(1); opacity: 1 } }
            @keyframes orb-crack { 0%{opacity:0;transform:scale(.6)} 30%{opacity:1;transform:scale(1.2)} 100%{opacity:0.8;transform:scale(1)} }
            @keyframes orb-particle { 0%{opacity:1;transform:translate(0,0) scale(1)} 100%{opacity:0;transform:translate(var(--dx),var(--dy)) scale(.3)} }
          `}</style>
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "min(420px,100%)", background: "linear-gradient(180deg,#1c0f2e,#0b0510)",
              border: `2px solid ${orbAnim.color}`, borderRadius: 16, padding: 22, textAlign: "center",
              boxShadow: `0 0 60px ${orbAnim.color}55`, position: "relative", overflow: "hidden",
            }}
          >
            <div style={{ fontSize: 12, color: "#c8b8d0", letterSpacing: 2, fontWeight: 900, marginBottom: 8 }}>
              {orbAnim.phase === "spinning" ? "⚗️  INCUBANDO..." : orbAnim.phase === "success" ? (orbAnim.lucky ? "🌟  SORTE!" : "✨  SUCESSO!") : "💥  FALHOU!"}
            </div>
            <div style={{ position: "relative", height: 240, display: "grid", placeItems: "center" }}>
              {/* base incubadora */}
              <img
                src={orbIncubatorImg}
                alt=""
                width={200}
                height={200}
                style={{
                  imageRendering: "pixelated",
                  filter: orbAnim.phase === "fail" ? "grayscale(1) hue-rotate(-30deg) drop-shadow(0 0 12px #e94b3c)" : `drop-shadow(0 0 24px ${orbAnim.color})`,
                  animation: orbAnim.phase === "spinning" ? "orb-pulse 1s ease-in-out infinite" : orbAnim.phase === "fail" ? "orb-shake .5s ease-in-out 2" : "orb-pulse 1.4s ease-in-out infinite",
                  transition: "filter .3s",
                }}
              />
              {/* aura girando */}
              {orbAnim.phase === "spinning" && (
                <div style={{
                  position: "absolute", inset: 0, display: "grid", placeItems: "center", pointerEvents: "none",
                  animation: "orb-spin 1.2s linear infinite",
                }}>
                  <div style={{
                    width: 160, height: 160, borderRadius: "50%",
                    border: `3px dashed ${orbAnim.color}88`,
                    boxShadow: `inset 0 0 30px ${orbAnim.color}55`,
                  }} />
                </div>
              )}
              {/* orb resultante */}
              {orbAnim.phase === "success" && orbAnim.img && (
                <img
                  src={orbAnim.img}
                  alt=""
                  width={72}
                  height={72}
                  style={{
                    position: "absolute", bottom: 30, imageRendering: "pixelated",
                    filter: `drop-shadow(0 0 20px ${orbAnim.color})`,
                    animation: "orb-drop .6s ease-out both, orb-pulse 2s ease-in-out infinite .6s",
                  }}
                />
              )}
              {/* rachadura fail */}
              {orbAnim.phase === "fail" && (
                <>
                  <div style={{
                    position: "absolute", fontSize: 96, animation: "orb-crack .8s ease-out both", pointerEvents: "none",
                  }}>💔</div>
                  {[0,1,2,3,4,5].map((i) => {
                    const angle = (i / 6) * Math.PI * 2;
                    const dx = Math.cos(angle) * 80;
                    const dy = Math.sin(angle) * 80;
                    return (
                      <div key={i} style={{
                        position: "absolute", width: 8, height: 8, borderRadius: 999,
                        background: "#e94b3c",
                        ["--dx" as any]: `${dx}px`, ["--dy" as any]: `${dy}px`,
                        animation: `orb-particle 1s ease-out ${i * 0.05}s forwards`,
                      } as React.CSSProperties} />
                    );
                  })}
                </>
              )}
            </div>
            <div style={{ marginTop: 10, minHeight: 40 }}>
              {orbAnim.phase === "spinning" && (
                <div style={{ fontSize: 12, color: "#c8b8d0" }}>A energia se condensa... aguarde.</div>
              )}
              {orbAnim.phase === "success" && (
                <>
                  <div style={{ fontSize: 16, fontWeight: 900, color: orbAnim.color }}>+1× {orbAnim.label}</div>
                  {orbAnim.lucky && orbAnim.extraHours ? (
                    <div style={{ fontSize: 12, color: "#ffd94d", fontWeight: 700 }}>🌟 SORTE! +{orbAnim.extraHours}h extras ao ativar</div>
                  ) : orbAnim.lucky ? (
                    <div style={{ fontSize: 12, color: "#ffd94d", fontWeight: 700 }}>🌟 SORTE! Orb evoluiu de raridade!</div>
                  ) : null}
                </>
              )}
              {orbAnim.phase === "fail" && (
                <div style={{ fontSize: 12, color: "#e28a8a" }}>A instabilidade dispersou a energia. Pokémon perdidos.</div>
              )}
            </div>
            {orbAnim.phase !== "spinning" && (
              <button
                onClick={() => setOrbAnim(null)}
                style={{
                  marginTop: 12, padding: "10px 20px", fontWeight: 900, fontSize: 12,
                  background: orbAnim.color, color: "#0b0510", border: "none", borderRadius: 8, cursor: "pointer",
                }}
              >FECHAR</button>
            )}
          </div>
        </div>
      )}

      {/* ❄️ Diálogo do Ancião Glacial — Ritual da Nova Jornada */}
      <AnciaoGlacialDialog
        open={anciaoOpen}
        forced={anciaoForced}
        onClose={() => { if (!anciaoForced) setAnciaoOpen(false); }}
        onConfirm={handleSeasonResetRitual}
      />


      {/* Botão flutuante: resgatar código */}
      <button
        onClick={() => { setCodeOpen(true); setCodeMsg(null); }}
        title="Resgatar código"
        style={{
          position: "fixed", bottom: 12, right: 12, zIndex: 100,
          background: "linear-gradient(180deg,#3a2a5c,#1a1030)",
          border: "1px solid #f5cf6b", color: "#f5cf6b",
          borderRadius: 8, padding: "6px 10px", fontSize: 12, fontWeight: 800,
          fontFamily: "monospace", cursor: "pointer",
          boxShadow: "0 2px 8px rgba(0,0,0,0.5)",
        }}
      >🔑 Código</button>

      {codeOpen && createPortal(
        <div
          onClick={() => setCodeOpen(false)}
          style={{
            position: "fixed", inset: 0, zIndex: 9998,
            background: "rgba(0,0,0,0.7)", display: "grid", placeItems: "center", padding: 16,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "min(360px, 100%)",
              background: "linear-gradient(180deg,#1c0f2e,#0b0510)",
              border: "1px solid #f5cf6b", borderRadius: 10, padding: 16,
              color: "#f3e5c5", fontFamily: "monospace",
              boxShadow: "0 8px 30px rgba(0,0,0,0.6)",
            }}
          >
            <div style={{ fontSize: 11, color: "#c8b8d0", marginBottom: 8, whiteSpace: "pre-line" }}>
              Digite um código secreto para receber recompensas.
              {"\n"}DICA: use <b>RESETPERSON</b> se o Ancião Glacial falhar.
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div style={{ fontWeight: 800, color: "#f5cf6b" }}>🔑 Resgatar código</div>
              <button onClick={() => setCodeOpen(false)} style={{
                background: "transparent", border: "none", color: "#f3e5c5", cursor: "pointer", fontSize: 16,
              }}>✕</button>
            </div>
            <div style={{ fontSize: 11, color: "#c8b8d0", marginBottom: 8, whiteSpace: "pre-line" }}>
              Digite um código secreto para receber recompensas.
              {"\n"}DICA: use <b>RESETPERSON</b> se o Ancião Glacial falhar.
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <input
                value={codeInput}
                onChange={(e) => setCodeInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") redeemCrystalCode(); }}
                placeholder="código…"
                autoFocus
                spellCheck={false}
                style={{
                  flex: 1, background: "#0b0510", color: "#f3e5c5",
                  border: "1px solid #4a3a6c", borderRadius: 6, padding: "6px 8px",
                  fontFamily: "monospace", fontSize: 13, outline: "none",
                }}
              />
              <button
                onClick={redeemCrystalCode}
                style={{
                  background: "linear-gradient(180deg,#f5cf6b,#c99a2e)",
                  color: "#1a1030", border: "none", borderRadius: 6,
                  padding: "6px 12px", fontWeight: 800, cursor: "pointer",
                  fontFamily: "monospace", fontSize: 12,
                }}
              >Resgatar</button>
            </div>
            {codeMsg && (
              <div style={{
                marginTop: 10, padding: "6px 8px", borderRadius: 6, fontSize: 12,
                background: codeMsg.kind === "ok" ? "rgba(126,242,122,0.12)" : "rgba(227,74,74,0.12)",
                border: `1px solid ${codeMsg.kind === "ok" ? "#7ef27a" : "#e34a4a"}`,
                color: codeMsg.kind === "ok" ? "#7ef27a" : "#ffb0b0",
              }}>{codeMsg.text}</div>
            )}
          </div>
        </div>,
        document.body
      )}

      {/* ===== Painel de Troca Black Mitic Plus (RESGTT55) ===== */}
      {bmpSwapOpen && createPortal((() => {
        const isBMP = (e: { event?: string | null }) =>
          typeof e.event === "string" && e.event.startsWith("black_mitic");
        const bmpEntries = [
          ...(idle.collection ?? []).filter(isBMP),
          ...team.filter(isBMP),
          ...restingBench.filter(isBMP),
        ];
        const source = bmpEntries.find((e) => e.uid === bmpSwapSourceUid) ?? null;
        const canConfirm = !!source && !!bmpSwapTarget;
        const confirmSwap = () => {
          const base = idleRef.current;
          const target = bmpSwapTarget;
          if (!bmpSwapSourceUid || !target) {
            setBmpSwapMsg({ kind: "err", text: "Selecione um BMP e uma espécie destino." });
            return;
          }
          const currentTeam = teamRef.current;
          const currentBench = benchRef.current;
          const found =
            (base.collection ?? []).find((e) => e.uid === bmpSwapSourceUid) ||
            currentTeam.find((p) => p.uid === bmpSwapSourceUid) ||
            currentBench.find((p) => p.uid === bmpSwapSourceUid);
          if (!found) {
            setBmpSwapMsg({ kind: "err", text: "Pokémon de origem não encontrado." });
            return;
          }
          if (found.species === target) {
            setBmpSwapMsg({ kind: "err", text: "O destino precisa ser diferente da espécie atual." });
            return;
          }
          const patch = <T extends { uid: string; species: Species; event?: string | null; traits?: string[]; rarity: Rarity }>(p: T): T =>
            p.uid === bmpSwapSourceUid
              ? {
                  ...p,
                  species: target as Species,
                  traits: [...GOVERNANTE_PLUS_TRAITS],
                  rarity: "mythic_shiny" as Rarity,
                  event: `black_mitic_plus:swap:${target}`,
                }
              : p;
          const nextCollection = (base.collection ?? []).map(patch);
          const nextTeam = currentTeam.map(patch);
          const nextBench = currentBench.map(patch);
          const seenSpecies = base.seenSpecies.includes(target)
            ? base.seenSpecies : [...base.seenSpecies, target];
          const caughtSpecies = base.caughtSpecies.includes(target)
            ? base.caughtSpecies : [...base.caughtSpecies, target];
          const next: IdleState = { ...base, collection: nextCollection, seenSpecies, caughtSpecies };
          idleRef.current = next;
          saveIdle(next);
          setIdle(next);
          teamRef.current = nextTeam;
          benchRef.current = nextBench;
          setTeam(nextTeam);
          setRestingBench(nextBench);
          if (!identity?.id?.startsWith("guest-")) {
            void pushCloudSaveNow({ idle: next, team: nextTeam, restingBench: nextBench, savedAt: Date.now() });
          }
          pushChat(`🔄 Troca BMP concluída: ${found.species.toUpperCase()} → ${target.toUpperCase()} (6 traits VERSÁTIL).`, "cap");
          setBmpSwapMsg({ kind: "ok", text: `Troca concluída! Seu ${found.species.toUpperCase()} agora é ${target.toString().toUpperCase()}.` });
          setBmpSwapSourceUid(null);
          setBmpSwapTarget(null);
        };
        return (
          <div
            onClick={() => setBmpSwapOpen(false)}
            style={{
              position: "fixed", inset: 0, zIndex: 9999,
              background: "rgba(4,2,10,0.88)", display: "grid", placeItems: "center", padding: 12,
              backdropFilter: "blur(6px)",
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                width: "min(880px, 100%)", maxHeight: "88vh", overflow: "auto",
                background: "linear-gradient(160deg,#12071e 0%,#1c0a2e 55%,#0b0510 100%)",
                border: "1px solid #a25bff", borderRadius: 14, padding: 18,
                color: "#f3e5ff", fontFamily: "monospace",
                boxShadow: "0 0 40px rgba(162,91,255,0.35), inset 0 0 30px rgba(162,91,255,0.15)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <div>
                  <div style={{ fontWeight: 900, fontSize: 16, color: "#d9b3ff", letterSpacing: 1 }}>
                    🔄 TROCA BLACK MITIC PLUS
                  </div>
                  <div style={{ fontSize: 11, color: "#b18cd9", marginTop: 2 }}>
                    Troque um Pokémon Black Mitic Plus da sua Coleção por outra espécie. Todos vêm com 6 traits VERSÁTIL.
                  </div>
                </div>
                <button
                  onClick={() => setBmpSwapOpen(false)}
                  style={{ background: "transparent", border: "1px solid #a25bff", color: "#d9b3ff", cursor: "pointer", fontSize: 12, padding: "4px 10px", borderRadius: 6 }}
                >FECHAR ✕</button>
              </div>

              {/* Passo 1: escolher BMP */}
              <div style={{ marginTop: 12, padding: 10, borderRadius: 8, background: "rgba(162,91,255,0.06)", border: "1px solid rgba(162,91,255,0.25)" }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: "#e8d1ff", marginBottom: 6 }}>
                  1) SEU BLACK MITIC PLUS ({bmpEntries.length})
                </div>
                {bmpEntries.length === 0 ? (
                  <div style={{ fontSize: 12, color: "#c8a8e8", padding: 8 }}>
                    Você não possui nenhum Black Mitic Plus na Coleção.
                  </div>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: 8 }}>
                    {bmpEntries.map((e) => {
                      const src = GIF[e.species];
                      const sel = e.uid === bmpSwapSourceUid;
                      return (
                        <button
                          key={e.uid}
                          onClick={() => { setBmpSwapSourceUid(e.uid); setBmpSwapMsg(null); }}
                          style={{
                            display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                            padding: 8, borderRadius: 8, cursor: "pointer",
                            background: sel ? "linear-gradient(180deg,#3a1660,#1a0630)" : "rgba(20,10,35,0.7)",
                            border: sel ? "2px solid #ffd166" : "1px solid #6a3ba0",
                            boxShadow: sel ? "0 0 12px rgba(255,209,102,0.6)" : "none",
                            color: "#f3e5ff", fontFamily: "monospace",
                          }}
                        >
                          {src ? (
                            <img src={src} alt="" style={{ width: 48, height: 48, imageRendering: "pixelated" }} />
                          ) : (
                            <div style={{ width: 48, height: 48, display: "grid", placeItems: "center", fontSize: 22 }}>✦</div>
                          )}
                          <div style={{ fontSize: 10, fontWeight: 800, textAlign: "center" }}>
                            {e.species.toUpperCase()}
                          </div>
                          <div style={{ fontSize: 9, color: "#c9a2ff" }}>Lv {e.level}</div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Passo 2: escolher destino */}
              <div style={{ marginTop: 12, padding: 10, borderRadius: 8, background: "rgba(162,91,255,0.06)", border: "1px solid rgba(162,91,255,0.25)" }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: "#e8d1ff", marginBottom: 6 }}>
                  2) ESCOLHA A ESPÉCIE DESEJADA ({BMP_SWAP_POOL.length})
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(96px, 1fr))", gap: 6 }}>
                  {BMP_SWAP_POOL.map((sp) => {
                    const src = GIF[sp];
                    const sel = sp === bmpSwapTarget;
                    return (
                      <button
                        key={sp}
                        onClick={() => { setBmpSwapTarget(sp); setBmpSwapMsg(null); }}
                        style={{
                          display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
                          padding: 6, borderRadius: 6, cursor: "pointer",
                          background: sel ? "linear-gradient(180deg,#3a1660,#1a0630)" : "rgba(15,7,28,0.75)",
                          border: sel ? "2px solid #ffd166" : "1px solid #5a2f8a",
                          boxShadow: sel ? "0 0 10px rgba(255,209,102,0.55)" : "none",
                          color: "#f3e5ff", fontFamily: "monospace",
                        }}
                        title={sp}
                      >
                        {src ? (
                          <img src={src} alt="" style={{ width: 40, height: 40, imageRendering: "pixelated" }} />
                        ) : (
                          <div style={{ width: 40, height: 40, display: "grid", placeItems: "center", fontSize: 18 }}>✦</div>
                        )}
                        <div style={{ fontSize: 9, fontWeight: 700, textAlign: "center", lineHeight: 1.1 }}>
                          {sp.toUpperCase()}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Confirmação */}
              <div style={{ marginTop: 12, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                <div style={{ fontSize: 11, color: "#c8a8e8" }}>
                  {source ? <>Fonte: <b style={{ color: "#ffd166" }}>{source.species.toUpperCase()}</b></> : "Selecione um BMP acima."}
                  {" · "}
                  {bmpSwapTarget ? <>Destino: <b style={{ color: "#ffd166" }}>{bmpSwapTarget.toString().toUpperCase()}</b></> : "Escolha a espécie destino."}
                </div>
                <button
                  disabled={!canConfirm}
                  onClick={confirmSwap}
                  style={{
                    background: canConfirm ? "linear-gradient(180deg,#ffd166,#c99a2e)" : "#2a1a3a",
                    color: canConfirm ? "#1a1030" : "#7d6fa0",
                    border: "none", borderRadius: 8, padding: "8px 16px",
                    fontWeight: 900, fontSize: 12, cursor: canConfirm ? "pointer" : "not-allowed",
                    fontFamily: "monospace",
                    boxShadow: canConfirm ? "0 0 12px rgba(255,209,102,0.55)" : "none",
                  }}
                >CONFIRMAR TROCA ✦</button>
              </div>
              {bmpSwapMsg && (
                <div style={{
                  marginTop: 10, padding: "8px 10px", borderRadius: 6, fontSize: 12,
                  background: bmpSwapMsg.kind === "ok" ? "rgba(126,242,122,0.12)" : "rgba(227,74,74,0.12)",
                  border: `1px solid ${bmpSwapMsg.kind === "ok" ? "#7ef27a" : "#e34a4a"}`,
                  color: bmpSwapMsg.kind === "ok" ? "#7ef27a" : "#ffb0b0",
                }}>{bmpSwapMsg.text}</div>
              )}
            </div>
          </div>
        );
      })(), document.body)}







      {/* ===== Popup do ovo chocando ===== */}
      {eggOpenResult && createPortal((() => {
        const rarityColorMap: Record<string, string> = {
          common: "#c8b8d0", uncommon: "#5ec26a", rare: "#6bd4ff",
          epic: "#c084fc", legendary: "#f5cf6b", mythic: "#ff6b3d", mythic_shiny: "#ff97e1",
        };
        const rarityLabelMap: Record<string, string> = {
          common: "Comum", uncommon: "Incomum", rare: "Raro",
          epic: "Épico", legendary: "Lendário", mythic: "Mítico", mythic_shiny: "Mítico ✦",
        };
        const c = rarityColorMap[eggOpenResult.rarity] ?? "#f5cf6b";
        const label = rarityLabelMap[eggOpenResult.rarity] ?? eggOpenResult.rarity;
        return (
          <div
            onClick={() => setEggOpenResult(null)}
            style={{
              position: "fixed", inset: 0, zIndex: 950,
              background: "rgba(6,3,12,0.88)",
              display: "flex", alignItems: "center", justifyContent: "center",
              padding: 20, cursor: "pointer",
              backdropFilter: "blur(4px)",
            }}
          >
            <div style={{
              background: "linear-gradient(160deg, #1a0f26 0%, #2a1638 100%)",
              border: `3px solid ${c}`, borderRadius: 16,
              padding: 32, maxWidth: 380, width: "100%",
              boxShadow: `0 0 40px ${c}aa`,
              textAlign: "center",
              animation: "chest-pop 380ms ease-out",
            }}>
              <div style={{ fontSize: 12, color: "#8a7a9c", letterSpacing: 3, marginBottom: 4 }}>OVO CHOCOU!</div>
              <div style={{
                margin: "10px auto 16px", width: 90, height: 104,
                borderRadius: "45% / 55%",
                background: `radial-gradient(circle at 30% 25%, #fff, ${c} 55%, ${c}88 100%)`,
                border: `3px solid ${c}`,
                boxShadow: `0 0 24px ${c}, inset 0 -10px 20px rgba(0,0,0,0.3)`,
              }} />
              <div style={{
                fontSize: 24, fontWeight: 900, color: "#fff",
                letterSpacing: 2, textTransform: "uppercase",
              }}>
                {eggOpenResult.sp.replace(/_/g, " ")}
              </div>
              <div style={{
                marginTop: 8, display: "inline-block",
                padding: "4px 14px", borderRadius: 20,
                background: c, color: "#0b0510",
                fontSize: 12, fontWeight: 900, letterSpacing: 2,
              }}>
                {label.toUpperCase()}
              </div>
              <div style={{ marginTop: 16, fontSize: 11, color: "#b8a8c8" }}>
                Foi adicionado ao seu time/coleção com stats bonificados pela raridade.
              </div>
              <div style={{ marginTop: 12, fontSize: 10, color: "#8a7a9c" }}>Clique para fechar</div>
            </div>
          </div>
        );
      })(), document.body)}

      {/* ===== Modal de escolha do inicial ===== */}


      {!starterChosen && createPortal(
        <div style={{
          position: "fixed", inset: 0, zIndex: 1000,
          background: "rgba(11,5,16,0.92)",
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: 20,
        }}>
          <div style={{
            background: "linear-gradient(160deg, #1a0f26 0%, #2a1638 100%)",
            border: "2px solid #f5cf6b", borderRadius: 14,
            padding: 28, maxWidth: 720, width: "100%",
            boxShadow: "0 12px 40px rgba(0,0,0,0.7)",
          }}>
            <h2 style={{ color: "#f5cf6b", fontSize: 22, marginBottom: 6, textAlign: "center", fontWeight: 900 }}>
              Escolha seu Pokémon inicial!
            </h2>
            <div style={{ color: "#b8a8c8", fontSize: 13, textAlign: "center", marginBottom: 22 }}>
              Você vai começar a jornada com este Pokémon (nível 5).
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
              {([
                { sp: "charmander" as const, name: "Charmander", img: charmanderGif, color: "#ff6b3d", desc: "Fogo — ataque forte" },
                { sp: "bulbasaur"  as const, name: "Bulbasaur",  img: bulbasaurGif,  color: "#5ec26a", desc: "Planta — equilibrado" },
                { sp: "squirtle"   as const, name: "Squirtle",   img: squirtleGif,   color: "#6bd4ff", desc: "Água — defensivo" },
              ]).map((c) => (
                <button key={c.sp} onClick={() => pickStarter(c.sp)}
                  style={{
                    background: "linear-gradient(160deg, #1a0f26 0%, #251638 100%)",
                    border: `2px solid ${c.color}`, borderRadius: 12, padding: 16,
                    cursor: "pointer", display: "flex", flexDirection: "column",
                    alignItems: "center", gap: 8, transition: "transform 0.1s",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-4px)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; }}
                >
                  <img src={c.img} alt={c.name} width={96} height={96}
                    style={{ imageRendering: "pixelated", filter: `drop-shadow(0 0 10px ${c.color}88)` }} />
                  <div style={{ color: c.color, fontWeight: 900, fontSize: 16 }}>{c.name}</div>
                  <div style={{ color: "#b8a8c8", fontSize: 11, textAlign: "center" }}>{c.desc}</div>
                  <div style={{
                    marginTop: 4, padding: "6px 14px", background: c.color, color: "#0b0510",
                    borderRadius: 6, fontWeight: 800, fontSize: 12,
                  }}>ESCOLHER</div>
                </button>
              ))}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ===== Modal: detalhes do Pokémon (energia + tempo) ===== */}
      {petDetailUid && (() => {
        void energyTick;
        const save = (loadLatestValid<SaveShape>() ?? {}) as SaveShape;
        const party = save.party ?? team;
        const pet = party.find((p) => p.uid === petDetailUid) ?? team.find((p) => p.uid === petDetailUid);
        if (!pet) return null;
        const now = Date.now();
        const maxHp = calcIdleMaxHp(pet);
        const hp = pet.uid === team[0]?.uid ? leaderHp : (pet.hp ?? maxHp);
        const inTeam = team.some((p) => p.uid === pet.uid);
        const energy = petCurrentEnergy(pet, now, { active: inTeam });
        const msFull = inTeam ? 0 : petMsToFull(pet, now);
        const infinite = (ENERGY_REGEN_MS[pet.rarity] ?? 0) === 0;
        const resting = !!(pet as PetEnergyExt).azulRestUntil && ((pet as PetEnergyExt).azulRestUntil! > now);
        const src = GIF[pet.species];
        return (
          <div onClick={() => setPetDetailUid(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 9999, display: "grid", placeItems: "center", padding: 16 }}>
            <div onClick={(e) => e.stopPropagation()} style={{ background: "linear-gradient(180deg,#1a1030,#0e0818)", border: "2px solid #f5cf6b", borderRadius: 12, padding: 18, minWidth: 300, maxWidth: 380, color: "#eadfe8" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 72, height: 72, background: "#0b0510", borderRadius: 8, display: "grid", placeItems: "center", overflow: "hidden", border: "1px solid #f5cf6b55" }}>
                  {src && <img src={src} alt="" style={{ width: "90%", imageRendering: "pixelated" }} />}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 900, fontSize: 16 }}>{pet.species.replace(/_/g, " ").toUpperCase()}</div>
                  <div style={{ fontSize: 11, color: "#b8a8c8" }}>Lv.{pet.level} · {pet.rarity}</div>
                </div>
                <button onClick={() => setPetDetailUid(null)} style={{ background: "#3a1010", border: "1px solid #f5cf6b", color: "#f5cf6b", borderRadius: 6, padding: "4px 10px", fontWeight: 800, cursor: "pointer" }}>✕</button>
              </div>
              <div style={{ marginTop: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11 }}><span>❤️ HP</span><span>{hp}/{maxHp}</span></div>
                <div style={{ height: 8, background: "#3a1010", borderRadius: 4, marginTop: 3 }}>
                  <div style={{ width: `${Math.max(0, Math.min(100, (hp / maxHp) * 100))}%`, height: "100%", background: "#5ec26a", borderRadius: 4 }} />
                </div>
              </div>
              <div style={{ marginTop: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11 }}>
                  <span>⚡ Energia {resting ? "(descansando)" : ""}</span>
                  <span>{infinite ? "∞ MÍTICO" : `${energy}/100`}</span>
                </div>
                <div style={{ height: 8, background: "#0e2438", borderRadius: 4, marginTop: 3 }}>
                  <div style={{ width: `${infinite ? 100 : energy}%`, height: "100%", background: resting ? "#7fc4ff" : (energy > 30 ? "#4a9eff" : "#ff7a3d"), borderRadius: 4 }} />
                </div>
                <div style={{ fontSize: 10, color: "#c8b8d0", marginTop: 4, textAlign: "right" }}>
                  {infinite ? "Não cansa" : (msFull > 0 ? `Cheia em ${fmtMS(msFull)}` : "Energia cheia")}
                </div>
              </div>
              <div style={{ marginTop: 12, fontSize: 10, color: "#8a7a9c" }}>
                XP {pet.xp ?? 0}/{100 + pet.level * 20}
              </div>
              {!infinite && !resting && energy < ENERGY_MAX && (
                <button
                  onClick={() => {
                    const uid = pet.uid;
                    const azul = BUILDINGS.find((b) => b.key === "azul");
                    if (!azul) return;
                    setPetDetailUid(null);
                    setAzulPreselectUid(uid);
                    walkTargetRef.current = {
                      x: azul.x, y: azul.y - 40, label: "Casa Azul",
                      onArrive: () => { setAzulPickerOpen(true); },
                      resumeAuto: autoRef.current,
                    };
                    setWalkingTo("Casa Azul");
                    setAuto(false);
                    pushChat(`🏡 Indo à Casa Azul para deixar ${pet.species.toUpperCase()} descansar...`, "info");
                  }}
                  style={{ marginTop: 14, width: "100%", background: "#4a9eff", color: "#0b0510", border: "none", borderRadius: 8, padding: "10px", fontWeight: 900, cursor: "pointer" }}
                >🏡 Levar à Casa Azul (5💎 · 5 min)</button>
              )}
            </div>
          </div>
        );
      })()}


      {/* ===== Modal: Casa Azul — escolher Pokémon para descansar ===== */}
      {azulPickerOpen && createPortal((() => {
        void energyTick;
        const save = (loadLatestValid<SaveShape>() ?? {}) as SaveShape;
        const party = save.party ?? team;
        const now = Date.now();
        return (
          <div onClick={() => { setAzulPickerOpen(false); setAzulPreselectUid(null); }} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 9999, display: "grid", placeItems: "center", padding: 16 }}>
            <div onClick={(e) => e.stopPropagation()} style={{ background: "linear-gradient(180deg,#0a1830,#0e0818)", border: "2px solid #4a9eff", borderRadius: 12, padding: 18, width: 380, maxHeight: "80vh", overflow: "auto", color: "#eadfe8" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontWeight: 900, fontSize: 16, color: "#7fc4ff" }}>🏡 CASA AZUL</div>
                  <div style={{ fontSize: 11, color: "#c8b8d0" }}>Restaura 100 de energia em 5 min · custa {AZUL_REST_COST}💎</div>
                </div>
                <button onClick={() => setAzulPickerOpen(false)} style={{ background: "#0a1830", border: "1px solid #4a9eff", color: "#7fc4ff", borderRadius: 6, padding: "4px 10px", fontWeight: 800, cursor: "pointer" }}>✕</button>
              </div>
              <div style={{ marginTop: 8, fontSize: 11, color: "#8fd0ff" }}>Seu saldo: 💎 {idle.bank.crystals}</div>
              <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 8 }}>
                {party.map((p) => {
                  const infinite = (ENERGY_REGEN_MS[p.rarity] ?? 0) === 0;
                  const resting = !!(p as PetEnergyExt).azulRestUntil && ((p as PetEnergyExt).azulRestUntil! > now);
                  const energy = petCurrentEnergy(p, now);
                  const src = GIF[p.species];
                  const canPick = !infinite && !resting && energy < ENERGY_MAX && idle.bank.crystals >= AZUL_REST_COST;
                  const label = infinite ? "MÍTICO (não cansa)" : resting ? `Descansando (${fmtMS(((p as PetEnergyExt).azulRestUntil!) - now)})` : `${energy}/100`;
                  return (
                    <div key={p.uid} style={{ display: "flex", gap: 8, alignItems: "center", background: p.uid === azulPreselectUid ? "#12305a" : "#0a1830", border: `1px solid ${p.uid === azulPreselectUid ? "#7fc4ff" : "#4a9eff33"}`, padding: 8, borderRadius: 8, boxShadow: p.uid === azulPreselectUid ? "0 0 12px #4a9eff55" : undefined }}>
                      <div style={{ width: 44, height: 44, background: "#0b0510", borderRadius: 6, display: "grid", placeItems: "center", overflow: "hidden" }}>
                        {src ? <img src={src} alt="" style={{ width: "90%", imageRendering: "pixelated" }} /> : <span>❓</span>}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12, fontWeight: 700 }}>{p.species.replace(/_/g, " ").toUpperCase()}</div>
                        <div style={{ fontSize: 10, color: "#c8b8d0" }}>Lv.{p.level} · {p.rarity}</div>
                        <div style={{ fontSize: 10, color: resting ? "#7fc4ff" : (energy < 30 ? "#ff7a3d" : "#8fd0ff") }}>⚡ {label}</div>
                      </div>
                      {(() => {
                        const canSpeed = resting && idle.bank.crystals >= AZUL_REST_COST;
                        const canPickNow = canPick;
                        const enabled = resting ? canSpeed : canPickNow;
                        const label = resting ? `Adiantar (${AZUL_REST_COST}💎)` : `Deixar (${AZUL_REST_COST}💎)`;
                        return (
                          <button
                            disabled={!enabled}
                            onClick={() => resting ? speedUpAzulRest(p.uid) : restPetInAzul(p.uid)}
                            style={{
                              background: enabled ? "#4a9eff" : "#2a3a4a",
                              color: enabled ? "#0b0510" : "#5a6a7a",
                              border: "none", borderRadius: 6, padding: "6px 10px",
                              fontWeight: 900, fontSize: 11, cursor: enabled ? "pointer" : "not-allowed",
                            }}
                          >{infinite ? "—" : label}</button>
                        );
                      })()}
                    </div>
                  );
                })}
                {party.length === 0 && <div style={{ fontSize: 11, color: "#8a7a9c" }}>Nenhum Pokémon na sua equipe.</div>}
              </div>
            </div>
          </div>
        );
      })(), document.body)}

      {/* ===== Modal: Detalhes da Coleção ===== */}
      {colecaoDetailUid && createPortal((() => {
        const entry = collectionForDisplay.find((p) => p.uid === colecaoDetailUid);
        if (!entry) return null;
        const livePet = team.find((p) => p.uid === entry.uid) ?? restingBench.find((p) => p.uid === entry.uid);
        const displayLevel = Math.max(entry.level ?? 1, livePet?.level ?? 1);
        const sp = entry.species;
        const base = SPECIES_BASE[sp];
        const rarityColor: Partial<Record<Rarity, string>> = {
          common: "#8b6a30", uncommon: "#5ec26a", rare: "#4a9eff",
          epic: "#c084fc", legendary: "#ff8b3d", mythic: "#ff5252", mythic_shiny: "#ffd94d",
        };
        const rColor = rarityColor[entry.rarity] ?? rarityColor[base.rarity] ?? "#8b6a30";
        const src = GIF[sp];
        const lore = SPECIES_LORE[sp] ?? RARITY_LORE[base.rarity] ?? "Um Pokémon único, com história ainda por contar.";
        const isCurrent = team[0]?.uid === entry.uid;
        return (
          <div onClick={() => setColecaoDetailUid(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 9999, display: "grid", placeItems: "center", padding: 16 }}>
            <div onClick={(e) => e.stopPropagation()} style={{
              background: "linear-gradient(180deg, #fff8e5 0%, #f5e6c8 100%)",
              border: `3px solid ${rColor}`,
              borderRadius: 14, padding: 20, width: 420, maxHeight: "85vh", overflow: "auto",
              color: "#4a3010", boxShadow: `0 0 30px ${rColor}77, 0 8px 24px rgba(0,0,0,0.5)`,
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ fontSize: 10, color: "#8b6a30", fontWeight: 900, letterSpacing: 2 }}>REGISTRO ✦</div>
                  <div style={{ fontSize: 22, fontWeight: 900, color: "#4a3010", fontFamily: "Georgia, serif" }}>
                    {sp.replace(/_/g, " ").toUpperCase()}
                  </div>
                  <div style={{ marginTop: 4, fontSize: 11, padding: "3px 10px", borderRadius: 12, background: rColor, color: "#fff", display: "inline-block", fontWeight: 900, letterSpacing: 1 }}>
                    {entry.rarity.toUpperCase()} · Nv. {displayLevel}
                  </div>
                </div>
                <button onClick={() => setColecaoDetailUid(null)} style={{ background: "#b8862a", border: "none", color: "#fff9e8", borderRadius: 6, padding: "4px 10px", fontWeight: 900, cursor: "pointer" }}>✕</button>
              </div>
              <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "120px 1fr", gap: 14, alignItems: "center" }}>
                <div style={{
                  width: 120, height: 120, background: "linear-gradient(180deg,#fff,#e8d4a8)",
                  border: `2px solid ${rColor}`, borderRadius: 10, display: "grid", placeItems: "center",
                  boxShadow: `inset 0 0 20px ${rColor}55`,
                }}>
                  {src && <img src={src} alt="" style={{ width: 96, height: 96, imageRendering: "pixelated" }} />}
                </div>
                <div style={{ fontSize: 13, fontStyle: "italic", color: "#5a4020", lineHeight: 1.5 }}>&ldquo;{lore}&rdquo;</div>
              </div>
              <div style={{ marginTop: 14, background: "rgba(255,255,255,0.5)", border: "1px solid #b8862a55", borderRadius: 8, padding: 10 }}>
                <div style={{ fontWeight: 900, fontSize: 11, color: "#6b4a10", letterSpacing: 2, marginBottom: 6 }}>ATRIBUTOS BASE</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6, fontSize: 12 }}>
                  {(["hp","atk","def","spa","spd","spe"] as const).map((k) => (
                    <div key={k} style={{ background: "rgba(255,255,255,0.6)", borderRadius: 4, padding: "4px 8px" }}>
                      <div style={{ fontSize: 9, color: "#8b6a30", fontWeight: 700 }}>{k.toUpperCase()}</div>
                      <div style={{ fontWeight: 800, color: "#4a3010" }}>{base[k]}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ marginTop: 10, fontSize: 11, color: "#6b4a10" }}>
                Ouro por derrota: <b>{base.goldRange[0]}-{base.goldRange[1]}</b> · Nível mínimo: <b>{base.minLv}</b>
              </div>
              <button
                onClick={() => {
                  const basePet = livePet ?? makePet(sp, displayLevel, entry.rarity);
                  const pet = { ...basePet, traits: entry.traits ?? basePet.traits ?? [], event: entry.event ?? (basePet as any).event } as PetInstance;
                  setStatsCardPet(pet);
                  setColecaoDetailUid(null);
                }}
                className="card-status-btn"
                style={{
                  marginTop: 16, width: "100%",
                  position: "relative",
                  background: "linear-gradient(180deg, #f0e2c2 0%, #e2d0a4 100%)",
                  color: "#3a2a10",
                  border: "1px solid #b8862a",
                  borderRadius: 10,
                  padding: "14px 16px",
                  fontWeight: 700,
                  fontSize: 12,
                  letterSpacing: 4,
                  cursor: "pointer",
                  boxShadow: "0 2px 0 rgba(120,80,20,0.25), inset 0 1px 0 rgba(255,255,255,0.55)",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 12,
                  transition: "border-color 160ms, transform 120ms",
                  fontFamily: "ui-serif, Georgia, serif",
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
                  <path d="M5 4h11l3 3v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Z" stroke="#7a5410" strokeWidth="1.4" strokeLinejoin="round"/>
                  <path d="M16 4v3h3" stroke="#7a5410" strokeWidth="1.4" strokeLinejoin="round"/>
                  <path d="M8 11h8M8 14h8M8 17h5" stroke="#7a5410" strokeWidth="1.2" strokeLinecap="round"/>
                </svg>
                <span>Ver Ficha Completa</span>
              </button>

              {!isCurrent && (
                <button
                  onClick={() => { onPickTeamFromColecao(entry); setColecaoDetailUid(null); }}
                  style={{ marginTop: 8, width: "100%", background: "linear-gradient(180deg,#5ec26a,#3d7a4a)", color: "#fff", border: "none", borderRadius: 8, padding: "10px", fontWeight: 900, cursor: "pointer", letterSpacing: 1 }}
                >COLOCAR NO TIME</button>
              )}
              {isCurrent && (
                <div style={{ marginTop: 14, textAlign: "center", color: "#3d7a4a", fontWeight: 900 }}>★ Este está no seu time</div>
              )}
            </div>
          </div>
        );
      })(), document.body)}

      {statsCardPet && createPortal(
        <PokemonStatsCard
          pet={statsCardPet}
          team={team}
          gifSrc={GIF[statsCardPet.species]}
          onClose={() => setStatsCardPet(null)}
        />,
        document.body
      )}




      {/* ===== HUD do Alvo (target — centro-topo) ===== */}
      {(() => {
        const tgt = attackTargetId != null ? enemies.find((e) => e.id === attackTargetId && e.hp > 0) : null;
        if (!tgt) return null;
        const hpPct = Math.max(0, Math.min(1, tgt.hp / Math.max(1, tgt.maxHp)));
        const hpColor = hpPct > 0.5 ? "#e56b6b" : hpPct > 0.25 ? "#f5cf6b" : "#a83232";
        const rarityColorMap: Record<string, string> = {
          common: "#c8c8c8", uncommon: "#7ef2a2", rare: "#6bd4ff",
          epic: "#c78bff", legendary: "#f5cf6b", mythic: "#ff97e1", mythic_shiny: "#ffd6ff",
        };
        const rColor = rarityColorMap[tgt.rarity] ?? "#c8c8c8";
        const gif = GIF[tgt.sp];
        return (
          <div key={tgt.id} style={{
            position: "fixed", top: 72, left: "50%", transform: "translateX(-50%)",
            zIndex: 9997, pointerEvents: "none",
            display: "flex", alignItems: "center", gap: 10,
            background: "linear-gradient(180deg, rgba(38,14,14,0.94) 0%, rgba(20,6,6,0.94) 100%)",
            border: `2px solid ${rColor}`,
            borderRadius: 14,
            padding: "8px 14px 8px 8px",
            boxShadow: `0 8px 22px rgba(0,0,0,0.6), 0 0 0 1px ${rColor}44 inset, 0 0 16px ${rColor}66`,
            minWidth: 260,
            animation: "evt-slide 220ms cubic-bezier(.2,.9,.3,1.2)",
          }}>

            <div style={{
              width: 54, height: 54, flexShrink: 0, borderRadius: "50%",
              background: `radial-gradient(circle at 40% 35%, ${rColor}66 0%, #2a0a0a 75%)`,
              border: `2px solid ${rColor}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              overflow: "hidden",
              boxShadow: `inset 0 0 6px rgba(0,0,0,0.6), 0 0 10px ${rColor}88`,
            }}>
              {gif ? (
                <img src={gif} alt={tgt.sp} style={{
                  width: "120%", height: "120%", objectFit: "contain",
                  imageRendering: "pixelated",
                  transform: tgt.face === "right" ? "scaleX(-1)" : "none",
                }} />
              ) : <span style={{ fontSize: 26 }}>❓</span>}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                <span style={{
                  fontSize: 9, fontWeight: 900, color: "#1a0f26",
                  background: `linear-gradient(180deg,${rColor},${rColor}aa)`,
                  padding: "2px 6px", borderRadius: 4, letterSpacing: 1,
                }}>Lv {tgt.level}</span>
                {tgt.elite && (
                  <span style={{
                    fontSize: 8, fontWeight: 900, color: "#fff",
                    background: "linear-gradient(180deg,#c72525,#7a1010)",
                    padding: "2px 5px", borderRadius: 4, letterSpacing: 1,
                    border: "1px solid #f5cf6b",
                  }}>★ ELITE</span>
                )}
                <span style={{
                  fontSize: 13, fontWeight: 900, color: "#ffe5c5",
                  textShadow: "1px 1px 0 #000", letterSpacing: 0.5,
                  textTransform: "uppercase",
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                }}>{tgt.sp.replace(/_/g, " ")}</span>
              </div>
              <div style={{
                position: "relative", height: 12, background: "#0a0410",
                border: "1px solid #4a1a1a", borderRadius: 6, overflow: "hidden",
                boxShadow: "inset 0 1px 3px rgba(0,0,0,0.6)",
              }}>
                <div style={{
                  position: "absolute", inset: 0, width: `${hpPct * 100}%`,
                  background: `linear-gradient(180deg, ${hpColor}, ${hpColor}aa)`,
                  transition: "width 260ms ease, background 260ms ease",
                  boxShadow: `0 0 8px ${hpColor}99`,
                }} />
                <div style={{
                  position: "absolute", inset: 0, display: "flex",
                  alignItems: "center", justifyContent: "center",
                  fontSize: 9, fontWeight: 900, color: "#fff",
                  textShadow: "1px 1px 0 #000, -1px -1px 0 #000",
                  letterSpacing: 0.5,
                }}>{Math.max(0, Math.round(tgt.hp))} / {tgt.maxHp}</div>
              </div>
              <div style={{
                fontSize: 8, color: rColor, marginTop: 2, letterSpacing: 1.5,
                textTransform: "uppercase", fontWeight: 800,
                textShadow: "1px 1px 0 #000",
              }}>◆ {tgt.rarity} ◆ ALVO</div>
            </div>
          </div>
        );
      })()}

      {/* ===== Guia Inteligente — HUD estilo Prof. Carvalho ===== */}

      {/* Admin Button for lordryuhhhuyuyghh@gmail.com */}
      {(identity?.email === "lordryuhhhuyuyghh@gmail.com" || identity?.id === "61b4d001-c8c3-424d-862d-0b798782f9d6") && (
        <button
          onClick={() => setIsAdminOpen(true)}
          style={{
            position: "fixed",
            bottom: 20,
            right: 20,
            width: 50,
            height: 50,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #f5cf6b, #b8862a)",
            border: "2px solid #fff",
            boxShadow: "0 0 15px rgba(245, 207, 107, 0.6)",
            cursor: "pointer",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 24,
            animation: "pulse 2s infinite"
          }}
          title="Abrir Painel Admin"
        >
          ⚙️
        </button>
      )}



      {cashShopOpen && createPortal(
        <CashShopModal
          open={cashShopOpen}
          onClose={() => setCashShopOpen(false)}
          identity={identity ? { id: identity.id, name: identity.name || "Treinador" } : null}
          wallet={{
            coins: idle.bank.gold,
            crystals: idle.bank.crystals,
            level: idle.trainerLevel ?? 1,
            xp: idle.trainerXp ?? 0,
            xpNext: trainerXpToNext(idle.trainerLevel ?? 1),
            safiras: idle.items?.safira_verde ?? 0,
          }}
          onSpendSafiras={(n) => {
            const cur = idle.items?.safira_verde ?? 0;
            if (cur < n) return false;
            setIdle((s) => ({
              ...s,
              items: { ...(s.items ?? {}), safira_verde: (s.items?.safira_verde ?? 0) - n },
            }));
            return true;
          }}
          onGrantCoins={(n) => setIdle((s) => ({ ...s, bank: { ...s.bank, gold: s.bank.gold + n } }))}
          onGrantCrystals={(n) => setIdle((s) => ({ ...s, bank: { ...s.bank, crystals: s.bank.crystals + n } }))}
          onGrantItem={(id, qty) => {
            setIdle((s) => ({
              ...s,
              items: { ...(s.items ?? {}), [id]: (s.items?.[id] ?? 0) + qty },
            }));
          }}
          codeInput={codeInput}
          setCodeInput={setCodeInput}
          codeMsg={codeMsg}
          onRedeemCode={() => redeemCrystalCode()}
        />,
        document.body
      )}
      {blackEggHudOpen && createPortal(
        <BlackMiticEggHud
          open={blackEggHudOpen}
          onClose={() => setBlackEggHudOpen(false)}
          uid={identity?.id ?? "guest"}
          itemCount={idle.items?.[BLACK_EGG_ITEM_ID] ?? 0}
          stones={{
            stone_grass: idle.items?.stone_grass ?? 0,
            stone_fire: idle.items?.stone_fire ?? 0,
            stone_water: idle.items?.stone_water ?? 0,
            stone_electric: idle.items?.stone_electric ?? 0,
            stone_dark: idle.items?.stone_dark ?? 0,
            stone_dragon: idle.items?.stone_dragon ?? 0,
          }}
          onConsumeStone={(stoneId, qty) => {
            const have = idleRef.current.items?.[stoneId] ?? 0;
            if (have < qty) return false;
            setIdle((s) => ({
              ...s,
              items: { ...(s.items ?? {}), [stoneId]: (s.items?.[stoneId] ?? 0) - qty },
            }));
            return true;
          }}
          onHatched={(species, element, traits, plus) => {
            const hatchSpecies = (species in SPECIES_BASE ? species : "charizard_shiny") as Species;
            const uid = (typeof crypto !== "undefined" && "randomUUID" in crypto)
              ? crypto.randomUUID()
              : `bmp_${Date.now()}_${Math.floor(Math.random() * 1e6)}`;
            const base = idleRef.current;
            const curCount = base.items?.[BLACK_EGG_ITEM_ID] ?? 0;
            const nextItems = { ...(base.items ?? {}) };
            if (curCount <= 1) delete nextItems[BLACK_EGG_ITEM_ID];
            else nextItems[BLACK_EGG_ITEM_ID] = curCount - 1;
            // Ovo Plus: uso único — não devolve a carta ao chocar.
            const entry: CollectionEntry = {
              uid,
              species: hatchSpecies,
              level: 100,
              xp: 0,
              rarity: "mythic_shiny",
              capturedAt: Date.now(),
              traits,
              event: `black_mitic_plus:${element}${plus ? ":plus" : ""}`,
            };
            const nextIdle: IdleState = {
              ...base,
              items: nextItems,
              seenSpecies: base.seenSpecies.includes(hatchSpecies) ? base.seenSpecies : [...base.seenSpecies, hatchSpecies],
              caughtSpecies: base.caughtSpecies.includes(hatchSpecies) ? base.caughtSpecies : [...base.caughtSpecies, hatchSpecies],
              collection: [...(base.collection ?? []), entry],
              totals: { ...base.totals, captured: (base.totals?.captured ?? 0) + 1 },
            };
            idleRef.current = nextIdle;
            saveIdle(nextIdle);
            setIdle(nextIdle);
            void pushCloudSaveNow({ idle: nextIdle, team: teamRef.current, restingBench, savedAt: Date.now() });
            const tag = plus ? "Black Mitic PLUS ✦ (Versátil, 6 traits)" : `Black Mitic Plus (${element})`;
            pushChat(`✦ ${tag} nasceu: ${hatchSpecies.toUpperCase()} com ${traits.length} traits! Já está na Coleção.`, "cap");
          }}
          onNotify={(msg) => pushChat(`✦ Black Mitic Plus Egg: ${msg}`, "cap")}
          hasIncubatorCard={true}
          onActivateEgg={() => { /* incubadora sempre desbloqueada — nada a consumir */ }}
          boostCount={idle.items?.egg_boost_69 ?? 0}
          musicControlledExternally
          plusPending={idle.blackMiticPlusPending ?? 0}
          onConsumePlus={(count) => {
            setIdle((s) => ({
              ...s,
              blackMiticPlusPending: Math.max(0, (s.blackMiticPlusPending ?? 0) - count),
            }));
          }}
          onConsumeBoost={() => {
            const have = idleRef.current.items?.egg_boost_69 ?? 0;
            if (have <= 0) return false;
            setIdle((s) => ({
              ...s,
              items: { ...(s.items ?? {}), egg_boost_69: (s.items?.egg_boost_69 ?? 0) - 1 },
            }));
            return true;
          }}
        />,
        document.body
      )}


      <GovernanteDialog
        open={governanteOpen}
        cards={idle.items?.carta_incubadora ?? 0}
        plusCards={idle.items?.carta_plus ?? 0}
        rioluCards={idle.items?.carta_riolu ?? 0}
        currentEggs={idle.items?.black_mitic_egg ?? 0}
        onClose={() => setGovernanteOpen(false)}
        onExchange={(qty) => {
          const base = idleRef.current;
          const cards = base.items?.carta_incubadora ?? 0;
          const eggs = base.items?.black_mitic_egg ?? 0;
          const maxByEggCap = Math.max(0, 6 - eggs);
          const use = Math.min(qty, cards, maxByEggCap);
          if (use <= 0) return;
          setIdle((s) => ({
            ...s,
            items: {
              ...(s.items ?? {}),
              carta_incubadora: (s.items?.carta_incubadora ?? 0) - use,
              black_mitic_egg: (s.items?.black_mitic_egg ?? 0) + use,
            },
          }));
          pushChat(`👑 Governante consumiu ${use}× Carta da Incubadora e entregou ${use}× Black Mitic Plus Egg.`, "cap");
        }}
        onExchangePlus={(qty) => {
          const base = idleRef.current;
          const cards = base.items?.carta_plus ?? 0;
          const collectionSlots = Math.max(0, MAX_COLLECTION - (base.collection?.length ?? 0));
          const use = Math.min(qty, cards, collectionSlots);
          if (use <= 0) {
            pushChat("✦ Governante: sua Coleção está cheia. Libere espaço antes de entregar a Carta Suprema Plus.", "cap");
            return;
          }

          const nextItems = { ...(base.items ?? {}) };
          const remainingCards = Math.max(0, cards - use);
          if (remainingCards <= 0) delete nextItems.carta_plus;
          else nextItems.carta_plus = remainingCards;

          const nowTs = Date.now();
          const entries: CollectionEntry[] = Array.from({ length: use }, (_, index) => {
            const picked = GOVERNANTE_PLUS_POOL[Math.floor(Math.random() * GOVERNANTE_PLUS_POOL.length)] ?? "charizard_shiny";
            const uid = (typeof crypto !== "undefined" && "randomUUID" in crypto)
              ? crypto.randomUUID()
              : `bmp_plus_${nowTs}_${index}_${Math.floor(Math.random() * 1e6)}`;
            return {
              uid,
              species: picked,
              level: 100,
              xp: 0,
              rarity: "mythic_shiny",
              capturedAt: nowTs + index,
              traits: GOVERNANTE_PLUS_TRAITS,
              event: "black_mitic_plus:governante:plus:direct",
            };
          });

          const seenSpecies = [...base.seenSpecies];
          const caughtSpecies = [...base.caughtSpecies];
          for (const entry of entries) {
            if (!seenSpecies.includes(entry.species)) seenSpecies.push(entry.species);
            if (!caughtSpecies.includes(entry.species)) caughtSpecies.push(entry.species);
          }

          const next: IdleState = {
            ...base,
            items: nextItems,
            seenSpecies,
            caughtSpecies,
            collection: [...(base.collection ?? []), ...entries],
            totals: { ...base.totals, captured: (base.totals?.captured ?? 0) + entries.length },
          };
          idleRef.current = next;
          saveIdle(next);
          setIdle(next);
          void pushCloudSaveNow({ idle: next, team: teamRef.current, restingBench, savedAt: Date.now() });

          const names = entries.map((entry) => entry.species.toUpperCase()).join(", ");
          pushChat(`✦ Governante consumiu ${use}× Carta Suprema Plus e colocou na Coleção: ${names} — Black Mitic Plus VERSÁTIL com 6 traits.`, "cap");
        }}
        onExchangeRiolu={(qty) => {
          const base = idleRef.current;
          const cards = base.items?.carta_riolu ?? 0;
          const collectionSlots = Math.max(0, MAX_COLLECTION - (base.collection?.length ?? 0));
          const use = Math.min(qty, cards, collectionSlots);
          if (use <= 0) {
            pushChat("✦ Governante: sua Coleção está cheia. Libere espaço antes de entregar a Carta Riolu.", "cap");
            return;
          }
          const nextItems = { ...(base.items ?? {}) };
          const remainingCards = Math.max(0, cards - use);
          if (remainingCards <= 0) delete nextItems.carta_riolu;
          else nextItems.carta_riolu = remainingCards;

          const nowTs = Date.now();
          const entries: CollectionEntry[] = Array.from({ length: use }, (_, index) => {
            const uid = (typeof crypto !== "undefined" && "randomUUID" in crypto)
              ? crypto.randomUUID()
              : `bmp_riolu_${nowTs}_${index}_${Math.floor(Math.random() * 1e6)}`;
            return {
              uid,
              species: "riolu" as Species,
              level: 1000,
              xp: 0,
              rarity: "mythic_shiny",
              capturedAt: nowTs + index,
              traits: GOVERNANTE_PLUS_TRAITS,
              event: "black_mitic_plus:brilhant:riolu",
            };
          });

          const seenSpecies = base.seenSpecies.includes("riolu" as Species) ? base.seenSpecies : [...base.seenSpecies, "riolu" as Species];
          const caughtSpecies = base.caughtSpecies.includes("riolu" as Species) ? base.caughtSpecies : [...base.caughtSpecies, "riolu" as Species];

          const next: IdleState = {
            ...base,
            items: nextItems,
            seenSpecies,
            caughtSpecies,
            collection: [...(base.collection ?? []), ...entries],
            totals: { ...base.totals, captured: (base.totals?.captured ?? 0) + entries.length },
          };
          idleRef.current = next;
          saveIdle(next);
          setIdle(next);
          void pushCloudSaveNow({ idle: next, team: teamRef.current, restingBench, savedAt: Date.now() });

          pushChat(`🐺✦ Governante consumiu ${use}× Carta Riolu Suprema e materializou ${use}× RIOLU BLACK MITIC BRILHANT PLUS Lv 1000 na Coleção.`, "cap");
        }}
      />




      {/* MODAIS GLOBAIS FORA DE CONDICIONAIS INTERNAS */}
      {pendingGate && createPortal(

        <div onClick={() => setPendingGate(null)} style={{ position: "fixed", inset: 0, zIndex: 999999, background: "rgba(0,0,0,0.85)", display: "grid", placeItems: "center", padding: 20, cursor: "pointer" }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: "#1a0f26", border: "3px solid #f5cf6b", borderRadius: 16, padding: 24, maxWidth: 420, width: "100%", cursor: "default", boxShadow: "0 0 50px rgba(0,0,0,0.8)" }}>
            <h3 style={{ color: "#f5cf6b", margin: "0 0 16px 0", fontSize: 20, fontWeight: 900, textAlign: "center" }}>Viajar para {IDLE_MAPS[pendingGate.target as IdleMapId].name}?</h3>
            <div style={{ background: "rgba(0,0,0,0.3)", padding: 16, borderRadius: 12, marginBottom: 20, border: "1px solid rgba(245,207,107,0.1)" }}>
              <div style={{ color: "#d0b8f0", fontSize: 14, marginBottom: 8 }}>Requisitos:</div>
              <div style={{ display: "flex", gap: 8, alignItems: "center", color: (idle.trainerLevel ?? 1) >= (pendingGate.gate.reqLevel ?? 0) ? "#5ec26a" : "#ff5c5c" }}>
                <span>{ (idle.trainerLevel ?? 1) >= (pendingGate.gate.reqLevel ?? 0) ? "✅" : "❌" }</span>
                <span>Nível Treinador: {pendingGate.gate.reqLevel ?? 0}</span>
              </div>
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <button onClick={() => setPendingGate(null)} style={{ flex: 1, padding: "12px", background: "#3a1a3a", border: "none", color: "#d0b8f0", borderRadius: 8, fontWeight: 900, cursor: "pointer" }}>CANCELAR</button>
              <button
                onClick={() => {
                  const target = pendingGate.target as IdleMapId;
                  if ((idle.trainerLevel ?? 1) < (pendingGate.gate.reqLevel ?? 0)) { pushChat(`Nível insuficiente!`, "info"); return; }
                  setIdle(s => ({ ...s, currentMap: target }));
                  setPendingGate(null);
                  if (pendingGate.fromBig) setBigMapOpen(false);
                  pushChat(`Viajou para ${IDLE_MAPS[target].name}!`, "info");
                }}
                style={{ flex: 1, padding: "12px", background: "linear-gradient(180deg, #f5cf6b, #d9a441)", border: "none", color: "#1a0f26", borderRadius: 8, fontWeight: 900, cursor: "pointer" }}
              >VIAJAR</button>
            </div>
          </div>
        </div>,
        document.body
      )}


      {bigMapOpen && createPortal(
        <div onClick={() => setBigMapOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 99999, background: "rgba(0,0,0,0.9)", display: "grid", placeItems: "center", padding: 20, cursor: "pointer" }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: "#0b0510", border: "4px solid #f5cf6b", borderRadius: 20, padding: 24, maxWidth: 800, width: "100%", cursor: "default", boxShadow: "0 0 80px rgba(245,207,107,0.3)", position: "relative" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h2 style={{ color: "#f5cf6b", margin: 0, fontSize: 24, fontWeight: 900 }}>🗺️ MAPA LOCAL: {IDLE_MAPS[idle.currentMap].name.toUpperCase()}</h2>
              <button onClick={() => setBigMapOpen(false)} style={{ background: "#3a1010", border: "2px solid #f5cf6b", color: "#f5cf6b", borderRadius: 8, padding: "6px 14px", fontWeight: 900, cursor: "pointer" }}>✕ FECHAR</button>
            </div>
            <div style={{ width: "100%", aspectRatio: "16/9", borderRadius: 12, overflow: "hidden", background: `url(${assetUrlFromJson(idleArenaAsset)}) center/cover`, position: "relative", border: "2px solid rgba(245,207,107,0.2)" }}>
               {(gatesByMap[idle.currentMap] ?? []).map((g: any, i: number) => (
                 <div
                   key={i}
                   onClick={() => setPendingGate({ target: g.target, gate: g, fromBig: true })}
                   style={{ position: "absolute", left: `${g.x}%`, top: `${g.y}%`, width: 32, height: 32, background: "rgba(245,207,107,0.2)", border: "2px solid #f5cf6b", borderRadius: "50%", cursor: "pointer", transform: "translate(-50%, -50%)", display: "grid", placeItems: "center", boxShadow: "0 0 15px #f5cf6b" }}
                 >
                   <span style={{ fontSize: 16 }}>🌀</span>
                   <div style={{ position: "absolute", top: 35, background: "rgba(0,0,0,0.8)", padding: "2px 8px", borderRadius: 4, color: "#f5cf6b", fontSize: 12, whiteSpace: "nowrap", border: "1px solid #f5cf6b" }}>{IDLE_MAPS[g.target as IdleMapId].name}</div>
                 </div>
               ))}
            </div>
          </div>
        </div>,
        document.body
      )}

      {worldMapOpen && createPortal((() => {
        const WORLD_PINS_C1: Array<{ id: IdleMapId; x: number; y: number }> = [
          { id: "arena", x: 15, y: 22 }, { id: "terra", x: 32, y: 16 }, { id: "deserto_purpura", x: 54, y: 20 },
          { id: "pantano_fogo", x: 87, y: 26 }, { id: "praia", x: 12, y: 60 }, { id: "caverna", x: 42, y: 48 },
          { id: "neve", x: 74, y: 46 }, { id: "deserto", x: 92, y: 58 }, { id: "venofogo", x: 48, y: 84 }, { id: "fantasma", x: 14, y: 88 },
        ];
        const WORLD_PINS_C2: Array<{ id: IdleMapId; x: number; y: number }> = [
          { id: "grass_oddish", x: 25, y: 30 }, { id: "vale_rochas", x: 15, y: 20 }, { id: "vale_planta", x: 35, y: 25 },
          { id: "vale_gelo", x: 55, y: 30 }, { id: "vale_veneno", x: 75, y: 35 }, { id: "vale_fogo", x: 90, y: 40 },
          { id: "vulcao_ativo", x: 85, y: 60 }, { id: "nucleo_primordial", x: 95, y: 80 }, { id: "abismo_gelo", x: 10, y: 40 },
          { id: "abismo_veneno", x: 15, y: 50 }, { id: "abismo_raio", x: 20, y: 60 }, { id: "abismo_sombra", x: 25, y: 70 },
          { id: "abismo_dragao", x: 30, y: 80 },
        ];
        const WORLD_PINS_C3: Array<{ id: IdleMapId; x: number; y: number }> = [
          { id: "cadeia_ab", x: 20, y: 30 }, { id: "cadeia_ab1", x: 40, y: 50 }, { id: "cadeia_f1", x: 60, y: 70 },
          { id: "evento_myth", x: 80, y: 40 }, { id: "absol_start", x: 15, y: 80 }, { id: "governante_hall", x: 85, y: 85 },
        ];
        const bg = worldTab === 1 ? worldMapGlobeAsset : (worldTab === 2 ? worldMapContinent2Asset : governanteHallMapAsset);
        const PINS = worldTab === 2 ? WORLD_PINS_C2 : (worldTab === 3 ? WORLD_PINS_C3 : WORLD_PINS_C1);
        const hasGov = (idle.items?.carta_governante ?? 0) > 0;
        return (
          <div 
            onClick={() => setWorldMapOpen(false)} 
            style={{ 
              position: "fixed", inset: 0, zIndex: 99999, 
              background: "rgba(0,0,0,0.9)", display: "grid", 
              placeItems: "center", padding: 20, cursor: "pointer" 
            }}
          >
            <div 
              onClick={(e) => e.stopPropagation()} 
              style={{ 
                background: "#0b0510", border: "4px solid #f5cf6b", borderRadius: 20, 
                padding: 24, maxWidth: 900, width: "100%", cursor: "default", 
                boxShadow: "0 0 80px rgba(245,207,107,0.5)", position: "relative" 
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <h2 style={{ color: "#f5cf6b", margin: 0, fontSize: 24, fontWeight: 900 }}>🌏 MAPA MUNDI — CONT. {worldTab}</h2>
                <div style={{ display: "flex", gap: 8 }}>
                  <button 
                    onClick={() => setWorldTab(t => t === 3 ? 1 : (t + 1) as 1|2|3)} 
                    style={{ 
                      background: "linear-gradient(135deg, #f5cf6b, #d9a441)", border: "none", 
                      color: "#160a20", borderRadius: 8, padding: "6px 12px", 
                      fontWeight: 900, cursor: "pointer" 
                    }}
                  >TROCAR CONTINENTE</button>
                  <button 
                    onClick={() => setWorldMapOpen(false)} 
                    style={{ 
                      background: "#3a1010", border: "2px solid #f5cf6b", 
                      color: "#f5cf6b", borderRadius: 8, padding: "6px 12px", 
                      fontWeight: 900, cursor: "pointer" 
                    }}
                  >✕</button>
                </div>
              </div>
              
              <div style={{ 
                width: "100%", aspectRatio: "16/9", borderRadius: 12, overflow: "hidden", 
                background: `#000 url(${assetUrlFromJson(bg)}) center/cover no-repeat`, 
                position: "relative", border: "2px solid rgba(245,207,107,0.3)" 
              }}>
                {PINS.map(pin => {
                  const m = IDLE_MAPS[pin.id]; if (!m) return null;
                  const isGovMap = pin.id === "absol_start" || pin.id === "governante_hall";
                  const locked = ((m.minLevel ?? 0) > (idle.trainerLevel ?? 1)) || (isGovMap && !hasGov);
                  return (
                    <div 
                      key={pin.id} 
                      onClick={() => { 
                        if (locked) return; 
                        setIdle(s => ({ ...s, currentMap: pin.id })); 
                        setWorldMapOpen(false); 
                      }}
                      style={{ 
                        position: "absolute", left: `${pin.x}%`, top: `${pin.y}%`, 
                        width: 24, height: 24, 
                        background: locked ? "#444" : "#f5cf6b", 
                        border: "2px solid #fff", borderRadius: "50%", 
                        cursor: locked ? "not-allowed" : "pointer", 
                        transform: "translate(-50%,-50%)", 
                        boxShadow: "0 0 10px #f5cf6b",
                        zIndex: 10
                      }}
                    >
                      <div style={{ 
                        position: "absolute", top: 28, left: "50%", 
                        transform: "translateX(-50%)", background: "rgba(0,0,0,0.85)", 
                        padding: "3px 8px", borderRadius: 6, 
                        color: locked ? "#888" : "#f5cf6b", fontSize: 11, 
                        whiteSpace: "nowrap", border: "1px solid rgba(245,207,107,0.3)",
                        pointerEvents: "none", fontWeight: 700
                      }}>
                        {m.name} {locked && `(Lv.${m.minLevel})`}
                      </div>
                    </div>
                  );
                })}
              </div>
              
              <div style={{ marginTop: 12, textAlign: "center", color: "#8a7a9c", fontSize: 11 }}>
                Use as teclas direcionais ou o mouse para escolher seu destino. 
                Bloqueado? Aumente seu Nível de Treinador.
              </div>
            </div>
          </div>
        );
      })(), document.body)}


      {isAdminOpen && createPortal(
        <AdminDashboard onClose={() => setIsAdminOpen(false)} />,
        document.body
      )}
    </div>
  );
}





















































































































































// ============ Componentes visuais ============
function Panel({ title, accent, children }: { title: string; accent: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: "#1a0f26",
      border: "1px solid rgba(245,207,107,0.2)",
      borderRadius: 10, overflow: "hidden",
    }}>
      <div style={{
        background: accent, color: "#c9b8ff",
        padding: "6px 10px", fontWeight: 700, fontSize: 12,
        letterSpacing: 1,
        textShadow: "0 0 8px rgba(201, 184, 255, 0.4)",
      }}>{title}</div>
      <div style={{ padding: 10 }}>{children}</div>
    </div>
  );
}

function TeamRow({ pet, onClick, energyTick }: { pet: PetInstance; onClick?: () => void; energyTick?: number }) {
  void energyTick; // força re-render por segundo p/ atualizar barra de energia
  const src = GIF[pet.species];
  const now = Date.now();
  const energy = petCurrentEnergy(pet, now, { active: true });
  const msFull = petMsToFull(pet, now);
  const infinite = (ENERGY_REGEN_MS[pet.rarity] ?? 0) === 0;
  const resting = !!(pet as PetEnergyExt).azulRestUntil && ((pet as PetEnergyExt).azulRestUntil! > now);
  if (!src) {
    return (
      <div onClick={onClick} style={{ display: "flex", gap: 8, alignItems: "center", background: "#2a1a3a", padding: 6, borderRadius: 6, cursor: onClick ? "pointer" : undefined }}>
        <div style={{ width: 48, height: 48, background: "#0b0510", borderRadius: 6, display: "grid", placeItems: "center", fontSize: 20 }}>❓</div>
        <div style={{ flex: 1, fontSize: 12 }}>
          <div style={{ fontWeight: 600 }}>{pet.species.replace(/_/g, " ").toUpperCase()}</div>
          <div style={{ fontSize: 10, color: "#b8a8c8" }}>Lv.{pet.level}</div>
        </div>
      </div>
    );
  }
  const maxHp = calcIdleMaxHp(pet);
  const hp = pet.hp ?? maxHp;
  const pct = Math.max(0, Math.min(100, (hp / maxHp) * 100));
  const ePct = Math.max(0, Math.min(100, energy));
  const exhausted = !infinite && energy <= 0;
  const rarityColorMap: Record<string, string> = {
    common: "#9aa0a6", uncommon: "#5ec26a", rare: "#6bd4ff",
    epic: "#c084fc", legendary: "#f5cf6b", mythic: "#ff6b3d", mythic_shiny: "#ff97e1",
  };
  const rColor = rarityColorMap[pet.rarity] ?? "#c8b8d0";
  const hexToRgba = (h: string, a: number) => {
    const n = parseInt(h.replace("#", ""), 16);
    return `rgba(${(n>>16)&255},${(n>>8)&255},${n&255},${a})`;
  };
  return (
    <div onClick={onClick} title={exhausted ? "Sem energia — descanse na Casa Azul" : "Clique para ver detalhes"} style={{
      display: "flex", gap: 8, alignItems: "center",
      background: exhausted
        ? "linear-gradient(135deg, #14101a 0%, #1a1420 100%)"
        : `linear-gradient(135deg, ${hexToRgba(rColor, 0.22)} 0%, rgba(11,5,16,0.85) 100%)`,
      padding: "5px 8px 5px 5px",
      borderRadius: 10,
      cursor: onClick ? "pointer" : undefined,
      border: resting ? "1px solid #4a9eff" : (exhausted ? "1px solid #333" : `1px solid ${hexToRgba(rColor, 0.7)}`),
      boxShadow: exhausted
        ? "inset 0 1px 0 rgba(255,255,255,0.03)"
        : `0 2px 6px rgba(0,0,0,0.5), inset 0 1px 0 ${hexToRgba(rColor, 0.28)}, 0 0 10px ${hexToRgba(rColor, 0.18)}`,
      opacity: exhausted ? 0.6 : 1,
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Selo lateral (barra fina de raridade) */}
      <span style={{
        position: "absolute", left: 0, top: 6, bottom: 6, width: 2,
        background: `linear-gradient(180deg, ${rColor}, ${hexToRgba(rColor, 0.3)})`,
        borderRadius: 2,
        boxShadow: `0 0 5px ${rColor}88`,
      }} />
      {/* pulse animado quando saudável */}
      {!exhausted && (
        <span style={{
          position: "absolute", inset: 0, borderRadius: 10, pointerEvents: "none",
          boxShadow: `inset 0 0 12px ${hexToRgba(rColor, 0.15)}`,
          animation: "teamPulse 2.6s ease-in-out infinite",
        }} />
      )}

      {/* Retrato circular clássico com moldura dourada */}
      <div style={{
        width: 46, height: 46, flexShrink: 0,
        borderRadius: "50%",
        background: exhausted
          ? "linear-gradient(160deg, #3a3040, #1a141c)"
          : `conic-gradient(from 45deg, #ffe89a, #b8862a, #6b3d0a, #ffd66b, #ffe89a)`,
        padding: 1.5,
        boxShadow: exhausted
          ? "0 1px 3px rgba(0,0,0,0.5)"
          : `0 2px 5px rgba(0,0,0,0.65), 0 0 8px ${hexToRgba(rColor, 0.5)}, inset 0 0 2px rgba(0,0,0,0.4)`,
        position: "relative",
      }}>
        <div style={{
          width: "100%", height: "100%", borderRadius: "50%",
          background: exhausted
            ? "radial-gradient(circle at 50% 35%, #1a1420 0%, #0b0510 78%)"
            : `radial-gradient(circle at 50% 35%, ${hexToRgba(rColor, 0.35)} 0%, #0b0510 78%)`,
          border: "1.5px solid #0b0510",
          boxShadow: "inset 0 0 5px rgba(0,0,0,0.75)",
          display: "grid", placeItems: "center", overflow: "hidden",
        }}>
          <img src={src} alt="" style={{ width: "82%", imageRendering: "pixelated", filter: exhausted ? "grayscale(1) brightness(0.55)" : "drop-shadow(0 1px 2px rgba(0,0,0,0.8))" }} />
          {resting && <span style={{ position: "absolute", top: -2, right: -2, fontSize: 11, filter: "drop-shadow(0 0 3px #4a9eff)" }}>🏡</span>}
          {exhausted && <span style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", fontSize: 15, textShadow: "0 0 4px #000" }}>🔒</span>}
        </div>
      </div>


      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 4 }}>
          <span style={{
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            fontFamily: "'Cinzel', Georgia, serif",
            fontSize: 11.5, fontWeight: 900, letterSpacing: 0.5,
            color: rColor,
            textShadow: "0 1px 0 #000",
          }}>{pet.species.replace(/_/g, " ").toUpperCase()}</span>
          <span style={{
            fontSize: 9, fontWeight: 900, letterSpacing: 0.5,
            padding: "1px 6px", borderRadius: 999,
            background: "linear-gradient(180deg, #ffd66b, #b8862a)", color: "#2a1a0a",
            border: "1px solid rgba(0,0,0,0.4)",
          }}>LV {pet.level}</span>
        </div>
        {/* HP */}
        <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 3 }}>
          <span style={{ fontSize: 9, color: "#ff9d9d", width: 10 }}>❤</span>
          <div style={{
            flex: 1, height: 6, background: "#1a0808", borderRadius: 3,
            border: "1px solid #3a1010", overflow: "hidden",
            boxShadow: "inset 0 1px 2px rgba(0,0,0,0.6)",
          }}>
            <div style={{
              width: `${pct}%`, height: "100%",
              background: pct > 40 ? "linear-gradient(180deg, #a7f3a0, #3ea854)" : "linear-gradient(180deg, #ff9d9d, #a83030)",
              boxShadow: pct > 40 ? "0 0 5px #5ec26a88" : "0 0 5px #e34a4a88",
            }} />
          </div>
          <span style={{ fontSize: 8.5, color: "#f0d0d0", fontWeight: 700, minWidth: 44, textAlign: "right", fontFamily: "monospace" }}>{hp}/{maxHp}</span>
        </div>
        {/* Energia */}
        <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}>
          <span style={{ fontSize: 9, color: "#8fd0ff", width: 10 }}>⚡</span>
          <div style={{
            flex: 1, height: 4, background: "#08131f", borderRadius: 2,
            border: "1px solid #0e2438", overflow: "hidden",
          }}>
            <div style={{
              width: `${infinite ? 100 : ePct}%`, height: "100%",
              background: resting ? "linear-gradient(180deg, #a7d8ff, #4a9eff)" : (energy > 30 ? "linear-gradient(180deg, #8fd0ff, #2a6ec9)" : "linear-gradient(180deg, #ffb37a, #d95a1e)"),
            }} />
          </div>
          <span style={{ fontSize: 8.5, color: "#a5c8ff", minWidth: 30, textAlign: "right", fontWeight: 700 }}>
            {infinite ? "∞" : `${energy}%`}
          </span>
        </div>
      </div>
    </div>
  );
}


function ProgressRow({ icon, label, value, target }: { icon: string; label: string; value: number; target: number }) {
  const pct = Math.min(100, (value / target) * 100);
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 3 }}>
        <span>{icon} {label}</span>
        <span style={{ color: "#f5cf6b" }}>{value}/{target}</span>
      </div>
      <div style={{ height: 5, background: "#3a1010", borderRadius: 2 }}>
        <div style={{ width: `${pct}%`, height: "100%", background: "#5ec26a", borderRadius: 2 }} />
      </div>
    </div>
  );
}

// HUD topo — chip elegante para moeda/cristal
function HudChip({ color, label, icon }: { color: string; label: string; icon: string }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      background: `linear-gradient(180deg, ${color}22, ${color}08)`,
      border: `1px solid ${color}66`,
      padding: "3px 8px", borderRadius: 6,
      color, fontWeight: 800, textShadow: "1px 1px 0 #000",
    }}>
      <span>{icon}</span><span>{label}</span>
    </span>
  );
}
function HudBall({ img, count, color }: { img: string; count: number; color: string }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 3,
      opacity: count > 0 ? 1 : 0.5,
    }} title={`${count}`}>
      <img src={img} alt="" width={20} height={20}
        style={{ imageRendering: "pixelated", filter: `drop-shadow(0 0 4px ${color}88)` }} />
      <span style={{ color: "#eadfe8", fontWeight: 800, textShadow: "1px 1px 0 #000" }}>x{count}</span>
    </span>
  );
}

// ── Pill de status do perfil de treinador
function pillStyle(color: string): React.CSSProperties {
  return {
    display: "inline-flex", alignItems: "center", gap: 3,
    padding: "2px 7px", borderRadius: 999,
    background: `linear-gradient(180deg, ${color}22, rgba(0,0,0,0.4))`,
    border: `1px solid ${color}66`,
    color, fontSize: 10, fontWeight: 900, letterSpacing: 0.3,
    textShadow: "0 1px 0 #000", whiteSpace: "nowrap",
  };
}



// ── HUD superior: nicho clássico para OURO / CRISTAIS
function ResourceNiche({ tint, icon, value, title }: { tint: string; icon: React.ReactNode; value: string; title: string }) {
  return (
    <div title={title} style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      padding: "5px 10px",
      background: `linear-gradient(180deg, ${tint}22, rgba(0,0,0,0.35))`,
      borderLeft: "1px solid rgba(245,207,107,0.25)",
      borderRight: "1px solid rgba(245,207,107,0.25)",
      boxShadow: `inset 0 0 10px ${tint}18`,
    }}>
      {icon}
      <span style={{
        color: tint, fontWeight: 900, fontSize: 12.5,
        textShadow: "0 1px 0 #000",
        fontFamily: "'Cinzel', Georgia, serif", letterSpacing: 0.4,
      }}>{value}</span>
    </div>
  );
}

// ── HUD superior: slot elegante para cada Pokébola
function BallSlot({ img, count, tint }: { img: string; count: number; tint: string }) {
  const empty = count <= 0;
  return (
    <div style={{
      position: "relative",
      width: 34, height: 34,
      margin: "0 6px",
      display: "grid", placeItems: "center",
      opacity: empty ? 0.5 : 1,
      transition: "transform 120ms ease",
    }}>
      {/* halo colorido externo */}
      {!empty && (
        <span style={{
          position: "absolute", inset: -3, borderRadius: "50%",
          background: `radial-gradient(circle, ${tint}77 0%, transparent 65%)`,
          filter: "blur(2px)", pointerEvents: "none",
        }} />
      )}
      {/* moldura dourada circular */}
      <span style={{
        position: "absolute", inset: 0, borderRadius: "50%",
        background: empty
          ? "conic-gradient(from 45deg, #5a4a3a, #2a1a10, #4a3a2a, #5a4a3a)"
          : "conic-gradient(from 45deg, #ffe89a, #b8862a, #6b3d0a, #ffd66b, #ffe89a)",
        padding: 1.5,
        boxShadow: empty
          ? "0 1px 2px rgba(0,0,0,0.6), inset 0 0 3px rgba(0,0,0,0.6)"
          : `0 2px 4px rgba(0,0,0,0.7), inset 0 0 3px rgba(0,0,0,0.6), 0 0 8px ${tint}aa`,
      }}>
        <span style={{
          display: "block", width: "100%", height: "100%", borderRadius: "50%",
          background: `radial-gradient(circle at 35% 30%, ${empty ? "#1a121a" : tint + "55"} 0%, #0b0510 78%)`,
          boxShadow: "inset 0 1px 2px rgba(0,0,0,0.7)",
        }} />
      </span>
      {/* pokébola */}
      <img
        src={img}
        alt=""
        width={24}
        height={24}
        style={{
          position: "relative", zIndex: 2,
          imageRendering: "pixelated",
          filter: empty
            ? "grayscale(0.85) brightness(0.6)"
            : `drop-shadow(0 0 3px ${tint}) drop-shadow(0 1px 1px rgba(0,0,0,0.9))`,
        }}
      />
      {/* contador — tabuleta pendurada */}
      <span style={{
        position: "absolute", bottom: -7, right: -9, zIndex: 3,
        minWidth: 22, height: 15, padding: "0 5px",
        background: empty
          ? "linear-gradient(180deg, #3a2a3a, #1a121a)"
          : "linear-gradient(180deg, #1a1220 0%, #0b0510 100%)",
        color: empty ? "#8a7a9c" : "#ffe89a",
        fontSize: 10, fontWeight: 900, letterSpacing: 0.3,
        fontFamily: "'Cinzel', Georgia, serif",
        border: `1px solid ${empty ? "#4a3a4a" : "#c48e2a"}`,
        borderRadius: 8,
        display: "grid", placeItems: "center",
        boxShadow: "0 2px 3px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.08)",
        lineHeight: 1,
      }}>{count}</span>
    </div>
  );
}


// ============ estilos ============
const smallBtn: React.CSSProperties = {
  background: "#2a1a3a", color: "#f3e5c5",
  border: "1px solid rgba(245,207,107,0.2)",
  padding: "6px 10px", borderRadius: 6, cursor: "pointer",
  fontSize: 11, fontWeight: 600,
};
const collectBtn: React.CSSProperties = {
  width: "100%", background: "linear-gradient(180deg, #f5cf6b, #d4a439)",
  color: "#3d2b0a", fontWeight: 800, letterSpacing: 1,
  border: "none", padding: "10px", borderRadius: 6, cursor: "pointer", fontSize: 13,
};
const pillBtn: React.CSSProperties = {
  display: "inline-block", background: "#c92a2a", color: "#fff",
  padding: "8px 14px", borderRadius: 999, fontSize: 12, fontWeight: 700,
  textDecoration: "none", boxShadow: "0 2px 8px rgba(201,42,42,0.4)",
};
const zoomBtn: React.CSSProperties = {
  width: 32, height: 28, background: "rgba(20,10,30,0.85)", color: "#f5cf6b",
  border: "1px solid rgba(245,207,107,0.4)", borderRadius: 6, cursor: "pointer",
  fontSize: 16, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center",
  padding: 0, lineHeight: 1,
};

// Widget de compra com quantidade: presets + input custom + botão comprar.
function QtyBuy({ presets, max, unitLabel, buttonColor, canBuyFn, onBuy, disabledLabel = "SEM RECURSO" }:
  { presets: number[]; max: number; unitLabel: string; buttonColor: string; canBuyFn: (n: number) => boolean; onBuy: (n: number) => void; disabledLabel?: string }) {
  const [qty, setQty] = useState<number>(1);
  const clamp = (v: number) => Math.max(1, Math.min(Math.max(1, max), Math.floor(v || 1)));
  const q = clamp(qty);
  const ok = canBuyFn(q);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, width: "100%" }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 4, justifyContent: "center" }}>
        {presets.map((p) => (
          <button key={p} onClick={() => setQty(p)} style={{
            padding: "3px 8px", fontSize: 11, fontWeight: 800, borderRadius: 5,
            border: `1px solid ${qty === p ? buttonColor : "#4a3a52"}`,
            background: qty === p ? `${buttonColor}22` : "#1a0f26",
            color: qty === p ? buttonColor : "#b8a8c8", cursor: "pointer",
          }}>×{p}</button>
        ))}
        <button onClick={() => setQty(clamp(Math.max(...presets)))} style={{
          padding: "3px 8px", fontSize: 11, fontWeight: 800, borderRadius: 5,
          border: `1px solid #4a3a52`, background: "#1a0f26", color: "#b8a8c8", cursor: "pointer",
        }}>MAX</button>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        <button onClick={() => setQty(clamp(q - 1))} style={{ width: 28, height: 30, background: "#2a1a3a", border: "1px solid #4a3a52", color: "#eadfe8", borderRadius: 5, cursor: "pointer", fontWeight: 900 }}>−</button>
        <input type="number" min={1} max={max} value={qty}
          onChange={(e) => setQty(clamp(parseInt(e.target.value, 10)))}
          style={{ flex: 1, height: 30, textAlign: "center", background: "#0f0819", border: "1px solid #4a3a52", color: "#eadfe8", borderRadius: 5, fontWeight: 800, fontSize: 13 }} />
        <button onClick={() => setQty(clamp(q + 1))} style={{ width: 28, height: 30, background: "#2a1a3a", border: "1px solid #4a3a52", color: "#eadfe8", borderRadius: 5, cursor: "pointer", fontWeight: 900 }}>+</button>
      </div>
      <button onClick={() => ok && onBuy(q)} disabled={!ok} style={{
        width: "100%", padding: "8px 10px", fontWeight: 800, fontSize: 12,
        background: ok ? buttonColor : "#3a2a4a", color: ok ? "#0b0510" : "#6a5a7c",
        border: "none", borderRadius: 6, cursor: ok ? "pointer" : "not-allowed",
      }}>{ok ? `COMPRAR ×${q} ${unitLabel}` : disabledLabel}</button>
    </div>
  );
}

// ============ Overlay das abas ============
function TabOverlay({
  tab, onClose, leader, team, onReorderTeam, leaderHp, items, caughtSpecies, seenSpecies, totals, collection, craftPoints, onFragmentCollection, gifMap, onPickTeam, onUseItem,
  bank, buffs, onBuyBall, onBuyUltraBundle, onBuyTeleportScroll, onBuyBook, onBuyPotion, onBuyEgg, shopEggs, onBuyChestAmulet, chestAmuletOwned, autoHeal, setAutoHeal, audioSettings, setAudioSettings,
  tasks, onClaimTask, onOpenColecaoDetail, onExchange, onSellItem, marketSellPrices, identity, onListMarket, onBuyMarket, onCancelMarket, onClaimMarketPayout, isVip, skinId, setSkinId, unlockedSkins, skinTickets, onUnlockSkin, trainerLevel, onUpgradeBook, orbTrades, onTradeOrb, pokemonMarketNode, benchUids,
  onAnciaoInteraction,
}: {
  tab: string;
  onClose: () => void;
  onAnciaoInteraction: () => void;
  leader: PetInstance | undefined;
  team: PetInstance[];
  onReorderTeam: (next: PetInstance[]) => void;
  leaderHp: number;
  items: Record<string, number>;
  caughtSpecies: Species[];
  seenSpecies: Species[];
  totals: { gold: number; captured: number };
  collection: CollectionEntry[];
  craftPoints: number;
  onFragmentCollection: (uid: string) => void;
  gifMap: Partial<Record<Species, string>>;
  onPickTeam: (entry: CollectionEntry) => void;
  onUseItem: (id: string, qty?: number) => void;
  bank: { gold: number; crystals: number };
  buffs: { atk: number; def: number; expMult: number; expMultUntil?: number; goldMult?: number; goldMultUntil?: number; orbMult?: number; orbUntil?: number; orbId?: string; honeyUntil?: number; honeyRareUntil?: number; teamOrbUntil?: number };
  onBuyBall: (b: ShopBall, qty?: number) => void;
  onBuyUltraBundle: (qty?: number) => void;
  onBuyTeleportScroll: (qty?: number) => void;
  onBuyBook: (bk: ShopBook, qty?: number) => void;
  onBuyPotion: (qty?: number) => void;
  onBuyEgg: (e: { id: "egg_common" | "egg_rare" | "egg_epic" | "egg_mystic" | "egg_aura" | "egg_charizard" | "egg_charizard_mythic" | "egg_lugia" | "egg_dragonite"; name: string; price: number; currency: "gold" | "crystals"; desc: string; color: string }) => void;
  shopEggs: { id: "egg_common" | "egg_rare" | "egg_epic" | "egg_mystic" | "egg_aura" | "egg_charizard" | "egg_charizard_mythic" | "egg_lugia" | "egg_dragonite"; name: string; price: number; currency: "gold" | "crystals"; desc: string; color: string }[];

  onBuyChestAmulet: () => void;

  chestAmuletOwned: number;
  autoHeal: { enabled: boolean; threshold: number };
  setAutoHeal: (next: { enabled: boolean; threshold: number }) => void;
  audioSettings: { music: boolean; sfx: boolean; musicVol: number; sfxVol: number };
  setAudioSettings: React.Dispatch<React.SetStateAction<{ music: boolean; sfx: boolean; musicVol: number; sfxVol: number }>>;
  tasks: Task[];
  onClaimTask: (tid: string) => void;
  onOpenColecaoDetail: (uid: string) => void;
  onExchange: (dir: "g2c" | "c2g", amount: number) => void;
  onSellItem: (id: string, qty?: number, currency?: "gold" | "crystal" | "safira") => void;
  marketSellPrices: Record<string, number>;
  identity: LocalIdentity | null;
  onListMarket: (itemId: string, qty: number, price: number, currency?: "gold" | "crystal" | "safira") => Promise<boolean>;
  onBuyMarket: (l: { id: string; seller_id: string; item_id: string; qty: number; price: number; currency?: "gold" | "crystal" | "safira" }) => Promise<boolean>;
  onCancelMarket: (l: { id: string; item_id: string; qty: number; seller_id: string }) => Promise<boolean>;
  onClaimMarketPayout: (l: { id: string; item_id: string; qty: number; price: number; currency?: "gold" | "crystal" | "safira" }) => Promise<boolean>;

  isVip: boolean;
  skinId: string;
  setSkinId: (id: string) => void;
  trainerLevel: number;
  unlockedSkins: string[];
  skinTickets: number;
  onUnlockSkin: (id: string) => void;
  onUpgradeBook: (id: string) => void;
  orbTrades: { orbId: "orb_xp_minor" | "orb_xp_major" | "orb_xp_supreme" | "orb_team"; label: string; rarity: Rarity; count: number; color: string; img: string; desc: string; baseSuccess: number; upgradeTo?: "orb_xp_minor" | "orb_xp_major" | "orb_xp_supreme" | "orb_team"; requires?: { itemId: string; qty: number; label: string } }[];
  onTradeOrb: (orbId: "orb_xp_minor" | "orb_xp_major" | "orb_xp_supreme" | "orb_team", uids: string[], fuelUids: string[], rarity?: Rarity) => void;
  pokemonMarketNode?: React.ReactNode;
  benchUids: Set<string>;


}) {

  const title =
    tab === "pokemon"   ? "MEU POKÉMON" :
    tab === "mochila"   ? "MOCHILA" :
    tab === "colecao"   ? "COLEÇÃO" :
    tab === "pokedex"   ? "POKÉDEX" :
    tab === "loja"      ? "LOJA" :
    tab === "wallet"    ? "CARTEIRA" :
    tab === "market"    ? "MERCADO" :

    tab === "melhorias" ? "MELHORIAS" :
    tab === "config"    ? "CONFIGURAÇÕES" :
    tab === "tarefas"   ? "TAREFAS" :
    tab === "wiki"      ? "WIKI · 3ª SEASON" :
    tab === "inicio"    ? "INÍCIO" : "";
  const [mochilaCat, setMochilaCat] = useState<"all" | "balls" | "potions" | "books" | "eggs" | "other">("all");
  const [itemDetail, setItemDetail] = useState<string | null>(null);
  const [orbPicker, setOrbPicker] = useState<null | { orbId: "orb_xp_minor" | "orb_xp_major" | "orb_xp_supreme" | "orb_team"; rarity: Rarity; count: number; color: string; label: string }>(null);
  const [orbPickerSel, setOrbPickerSel] = useState<Set<string>>(new Set());
  const [statsCardPet, setStatsCardPet] = useState<PetInstance | null>(null);
  // Coleção: filtros + cadeado (persistidos em localStorage)
  const LOCK_KEY = "rubym.colecao.locked.v1";
  const [lockedSet, setLockedSet] = useState<Set<string>>(() => {
    try {
      const raw = typeof window !== "undefined" ? localStorage.getItem(LOCK_KEY) : null;
      if (!raw) return new Set<string>();
      const parsed = JSON.parse(raw);
      return new Set(Array.isArray(parsed) ? parsed : []);
    } catch { return new Set<string>(); }
  });
  const toggleLock = (uid: string) => {
    setLockedSet((prev) => {
      const next = new Set(prev);
      if (next.has(uid)) next.delete(uid); else next.add(uid);
      try { localStorage.setItem(LOCK_KEY, JSON.stringify([...next])); } catch { /* ignore */ }
      return next;
    });
  };
  const [colFilterRarity, setColFilterRarity] = useState<"all" | Rarity>("all");
  const [colFilterName, setColFilterName] = useState("");
  const [colSort, setColSort] = useState<"recent" | "level_desc" | "level_asc" | "rarity" | "name">("recent");
  const [colOnlyLocked, setColOnlyLocked] = useState(false);
  // Fragmentar: modo bulk + modal de confirmação bonito
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkSel, setBulkSel] = useState<Set<string>>(new Set());
  const [fragConfirm, setFragConfirm] = useState<null | {
    entries: Array<{ uid: string; species: Species; level: number; rarity: Rarity; gain: number }>;
    totalGain: number;
  }>(null);
  const teamUidSet = useMemo(() => new Set(team.map((p) => p.uid)), [team]);
  const toggleBulk = (uid: string) => {
    setBulkSel((prev) => {
      const next = new Set(prev);
      if (next.has(uid)) next.delete(uid); else next.add(uid);
      return next;
    });
  };
  const openFragConfirm = (uids: string[]) => {
    const PRISMA_BY_RARITY: Record<string, number> = { common: 1, uncommon: 1, rare: 2, epic: 3, legendary: 5, mythic: 10, mythic_shiny: 20 };
    const entries = uids
      .map((uid) => collection.find((e) => e.uid === uid))
      .filter((e): e is CollectionEntry => !!e)
      .filter((e) => !teamUidSet.has(e.uid) && !lockedSet.has(e.uid))
      .map((e) => ({ uid: e.uid, species: e.species, level: e.level, rarity: e.rarity, gain: PRISMA_BY_RARITY[e.rarity] ?? 1 }));
    if (entries.length === 0) return;
    const totalGain = entries.reduce((s, e) => s + e.gain, 0);
    setFragConfirm({ entries, totalGain });
  };
  const confirmFrag = () => {
    if (!fragConfirm) return;
    fragConfirm.entries.forEach((e) => onFragmentCollection(e.uid));
    setBulkSel(new Set());
    setBulkMode(false);
    setFragConfirm(null);
  };
  return (
    <div className="modern-floating-window" style={{ 
      background: "rgba(11, 5, 20, 0.96)", 
      backdropFilter: "blur(14px)",
      width: "95vw",
      maxWidth: "1200px",
      height: "90vh",
      maxHeight: "90vh",
      display: "flex",
      flexDirection: "column",
      pointerEvents: "auto",
      overflow: "hidden",
      position: "fixed",
      left: "50%",
      top: "50%",
      transform: "translate(-50%, -50%)",
      borderRadius: "24px",
      border: "3px solid rgba(201, 184, 255, 0.3)",
      boxShadow: "0 0 60px rgba(0,0,0,0.8), 0 0 20px rgba(201, 184, 255, 0.2)",
      zIndex: 2000
    }}>



      <div className="modern-window-header" style={{ position: "sticky", top: 0, zIndex: 10, flexShrink: 0 }}>
        <h2 style={{ 
          margin: 0, fontSize: 22, color: "#c9b8ff", 
          fontFamily: "'Cinzel', serif", letterSpacing: 2,
          textShadow: "0 2px 4px rgba(0,0,0,0.5), 0 0 10px rgba(201, 184, 255, 0.4)"
        }}>{title}</h2>
        <button onClick={onClose} className="modern-close-btn">
          FECHAR ✕
        </button>
      </div>

      <div className="modern-window-scroll-content" style={{ 
        flex: 1, 
        overflowY: "auto", 
        padding: 10,
        WebkitOverflowScrolling: "touch"
      }}>


      {tab === "pokemon" && leader && (
        <div style={{
          position: "relative",
          padding: "14px 12px 18px",
          borderRadius: 18,
          border: "2.5px solid rgba(245, 207, 107, 0.4)",
          background: `linear-gradient(180deg, rgba(20,10,35,0.7) 0%, rgba(10,5,20,0.85) 100%)`,
          boxShadow: "0 10px 30px rgba(0,0,0,0.5), inset 0 0 40px rgba(192,132,252,0.05)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          height: "100%",
          minHeight: 0
        }}>

          {/* decorative sparkles overlay */}
          <div style={{
            position: "absolute", inset: 0, pointerEvents: "none",
            background: "radial-gradient(circle at 12% 10%, rgba(255,151,225,0.18), transparent 45%), radial-gradient(circle at 88% 90%, rgba(192,132,252,0.18), transparent 45%)",
          }} />
          <div style={{
            position: "absolute", top: 8, right: 14,
            fontSize: 10, fontWeight: 900, letterSpacing: 3,
            color: "#ff97e1", textShadow: "0 0 8px rgba(255,151,225,0.7)",
            opacity: 0.85,
          }}>✦ MEW ✦</div>
          <div style={{ position: "relative" }}>
          <PokemonDetail pet={leader} currentHp={leaderHp} src={gifMap[leader.species]} />
          <ActiveBonuses leaderRarity={leader.rarity} team={team} buffs={buffs} />
          <SpeciesLore species={leader.species} rarity={leader.rarity} />


          {(() => {
            const RARITY_COLORS: Record<string, { c: string; label: string }> = {
              common:       { c: "#c8b8d0", label: "COMUM" },
              uncommon:     { c: "#7ef2a2", label: "INCOMUM" },
              rare:         { c: "#6bd4ff", label: "RARO" },
              epic:         { c: "#c084fc", label: "ÉPICO" },
              legendary:    { c: "#f5cf6b", label: "LENDÁRIO" },
              mythic:       { c: "#ff6b3d", label: "MÍTICO" },
              mythic_shiny: { c: "#ff97e1", label: "MÍTICO ✦" },
            };
            return (
              <div style={{
                marginTop: 18,
                padding: "14px 16px",
                background: "linear-gradient(135deg, rgba(30, 15, 50, 0.4) 0%, rgba(10, 5, 20, 0.6) 100%)",
                border: "2.5px solid rgba(245, 207, 107, 0.3)",
                borderRadius: 16,
                boxShadow: "0 6px 22px rgba(0,0,0,0.4), inset 0 1px 0 rgba(245,207,107,0.1)",
                position: "relative", overflow: "hidden",
              }}>

                <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 15% 20%, rgba(245,207,107,0.15), transparent 60%)", pointerEvents: "none" }} />
                {/* Header do time */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, position: "relative" }}>
                  <div>
                    <div style={{ color: "#f5cf6b", fontSize: 18, fontWeight: 900, letterSpacing: 2, textShadow: "0 2px 0 #0b0510, 0 0 10px rgba(245,207,107,0.6)" }}>
                      ⚔ SEU TIME ⚔
                    </div>
                    <div style={{ color: "#b8a8c8", fontSize: 10, marginTop: 2, letterSpacing: 1 }}>
                      Ordene por prioridade — o Líder é o #1
                    </div>
                  </div>
                  <div style={{
                    background: "rgba(245,207,107,0.15)", border: "1px solid rgba(245,207,107,0.4)",
                    padding: "4px 12px", borderRadius: 999, color: "#f5cf6b",
                    fontSize: 12, fontWeight: 900, letterSpacing: 1,
                  }}>{team.length}/6</div>
                </div>

                <SynergyPanel team={team} />



                <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 8, position: "relative" }}>
                  {team.map((p, i) => {
                    const src = gifMap[p.species];
                    const isLeader = i === 0;
                    const rarityInfo = RARITY_COLORS[p.rarity] ?? RARITY_COLORS.common;
                    const rc = rarityInfo.c;
                    const petMax = calcIdleMaxHp(p);
                    const petHp = isLeader ? leaderHp : (p.hp ?? petMax);
                    const hpPct = Math.max(0, Math.min(100, (petHp / petMax) * 100));
                    const hpColor = hpPct > 55 ? "#5ec26a" : hpPct > 25 ? "#f5cf6b" : "#ff5252";
                    const move = (from: number, to: number) => {
                      if (to < 0 || to >= team.length) return;
                      const arr = [...team];
                      const [x] = arr.splice(from, 1);
                      arr.splice(to, 0, x);
                      onReorderTeam(arr);
                    };
                    // Stats RPG derivados de nível + raridade (visual)
                    const rarityBaseMap: Record<string, number> = {
                      common: 42, uncommon: 58, rare: 78, epic: 100, legendary: 130, mythic: 160, mythic_shiny: 200,
                    };
                    const base = rarityBaseMap[p.rarity] ?? 42;
                    const lvl = p.level;
                    const stats = {
                      atk: Math.round(base + lvl * 2.1),
                      def: Math.round(base * 0.85 + lvl * 1.6),
                      spa: Math.round(base + lvl * 1.9),
                      spd: Math.round(base * 0.9 + lvl * 1.7),
                      spe: Math.round(base * 0.8 + lvl * 2.2),
                    };
                    const maxStat = Math.max(stats.atk, stats.def, stats.spa, stats.spd, stats.spe, 1);
                    const StatIcon = ({ kind, col }: { kind: string; col: string }) => {
                      const paths: Record<string, any> = {
                        atk: <><path d="M4 20 L14 10 M12 8 L20 4 L18 12 L10 10 Z" stroke={col} strokeWidth="2" fill={col+"55"} strokeLinejoin="round"/><circle cx="5" cy="19" r="1.5" fill={col}/></>,
                        def: <><path d="M12 3 L20 6 V12 C20 17 16 20 12 21 C8 20 4 17 4 12 V6 Z" stroke={col} strokeWidth="2" fill={col+"55"} strokeLinejoin="round"/><path d="M9 12 L11 14 L15 10" stroke={col} strokeWidth="2" fill="none" strokeLinecap="round"/></>,
                        spa: <><path d="M12 3 L14 10 L21 12 L14 14 L12 21 L10 14 L3 12 L10 10 Z" stroke={col} strokeWidth="1.5" fill={col+"77"} strokeLinejoin="round"/></>,
                        spd: <><circle cx="12" cy="12" r="8" stroke={col} strokeWidth="2" fill={col+"33"}/><path d="M12 4 Q16 12 12 20 Q8 12 12 4" stroke={col} strokeWidth="1.5" fill={col+"77"}/></>,
                        spe: <><path d="M13 3 L4 14 H11 L9 21 L20 10 H13 Z" stroke={col} strokeWidth="1.5" fill={col+"77"} strokeLinejoin="round"/></>,
                      };
                      return (
                        <svg viewBox="0 0 24 24" width="18" height="18" style={{ filter: `drop-shadow(0 0 3px ${col}aa)` }}>
                          {paths[kind]}
                        </svg>
                      );
                    };
                    const statRow = (kind: string, label: string, val: number, col: string) => (
                      <div key={label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <div style={{
                          width: 26, height: 26, borderRadius: 7,
                          background: "rgba(0,0,0,0.3)",
                          border: "1px solid rgba(245, 207, 107, 0.2)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          flexShrink: 0,
                          boxShadow: "0 0 6px rgba(0,0,0,0.3)",

                        }}><StatIcon kind={kind} col={col} /></div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 8, fontWeight: 900, letterSpacing: 1, color: "#c8b8d0", marginBottom: 2 }}>
                            <span>{label}</span>
                            <span style={{ color: col, fontFamily: "monospace", fontSize: 9 }}>{val}</span>
                          </div>
                          <div style={{ height: 4, background: "rgba(0,0,0,0.55)", borderRadius: 3, overflow: "hidden", border: "1px solid rgba(0,0,0,0.7)" }}>
                            <div style={{
                              width: `${(val / maxStat) * 100}%`, height: "100%",
                              background: `linear-gradient(90deg, ${col}, ${col}aa)`,
                              boxShadow: `0 0 4px ${col}44`,

                            }} />
                          </div>
                        </div>
                      </div>
                    );
                    return (
                      <div key={p.uid} style={{
                        display: "flex", alignItems: "stretch", gap: 12, padding: 12,
                        background: isLeader
                          ? "rgba(0,0,0,0.4)"
                          : "rgba(0,0,0,0.3)",
                        border: `1.5px solid ${isLeader ? "#f5cf6b" : "rgba(245, 207, 107, 0.2)"}`,
                        borderRadius: 14,
                        boxShadow: isLeader
                          ? "0 6px 18px rgba(0,0,0,0.5), inset 0 0 16px rgba(245,207,107,0.05)"
                          : "0 3px 10px rgba(0,0,0,0.5)",

                        position: "relative", overflow: "hidden",
                      }}>
                        {/* sparkle overlay */}
                        <div style={{ position: "absolute", inset: 0, background: `radial-gradient(circle at 85% 15%, ${rc}22, transparent 55%)`, pointerEvents: "none" }} />

                        {/* Portrait + Level badge */}
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, flexShrink: 0, position: "relative" }}>
                          <div style={{
                            width: 82, height: 82, borderRadius: 14,
                            background: "rgba(0,0,0,0.4)",
                            border: "1.5px solid rgba(245, 207, 107, 0.2)",
                            boxShadow: `inset 0 0 14px ${rc}22, 0 3px 10px rgba(0,0,0,0.5)`,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            position: "relative", overflow: "hidden",
                          }}>

                            {src && <img src={src} alt="" width={70} height={70} style={{ imageRendering: "pixelated", filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.7))" }} />}
                            {/* Slot number top-left */}
                            <div style={{
                              position: "absolute", top: 2, left: 4,
                              fontSize: 10, fontWeight: 900,
                              color: isLeader ? "#f5cf6b" : "#b8a8c8",
                              textShadow: "0 1px 2px #000",
                            }}>{isLeader ? "★" : `#${i + 1}`}</div>

                            {/* Level bottom-right badge */}
                            <div style={{
                              position: "absolute", bottom: -4, right: -4,
                              minWidth: 28, height: 22, padding: "0 6px",
                              background: "linear-gradient(180deg, #f5cf6b, #b8862a)",
                              color: "#000", border: "1.5px solid #fff4d0",
                              borderRadius: 999, display: "flex", alignItems: "center", justifyContent: "center",

                              fontSize: 10, fontWeight: 900, letterSpacing: 0.5,
                              boxShadow: "0 2px 4px rgba(0,0,0,0.6)",
                            }}>Lv{p.level}</div>
                          </div>
                          {isLeader && (
                            <div style={{
                              padding: "2px 8px", borderRadius: 999,
                              background: "linear-gradient(180deg, #f5cf6b, #b8862a)",
                              color: "#000", fontSize: 8, fontWeight: 900, letterSpacing: 1.5,
                              boxShadow: "0 2px 6px rgba(184,134,42,0.4)", border: "1px solid #fff4d0",

                            }}>LÍDER</div>
                          )}
                        </div>

                        {/* Info + Stats */}
                        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 6, position: "relative" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                            <div style={{ color: "#f7ecf7", fontWeight: 900, fontSize: 14, textTransform: "uppercase", letterSpacing: 1, textShadow: "0 1px 0 #000" }}>
                              {p.species.replace(/_/g, " ")}
                            </div>
                            <div style={{
                              background: rc, color: "#fff",
                              fontSize: 8, fontWeight: 900, letterSpacing: 1,
                              padding: "2px 7px", borderRadius: 4,
                              boxShadow: `0 0 8px ${rc}44`, border: "1px solid rgba(255,255,255,0.1)",


                            }}>{rarityInfo.label}</div>
                            <button
                              onClick={() => setStatsCardPet(p)}
                              title="Ver ficha completa"
                              style={{
                                marginLeft: "auto", background: "linear-gradient(180deg,#f5cf6b,#b8862a)",
                                color: "#000", border: "1px solid #fff4d0", borderRadius: 6,
                                padding: "2px 8px", fontSize: 9, fontWeight: 900, letterSpacing: 1, cursor: "pointer",
                                boxShadow: "0 4px 8px rgba(184,134,42,0.4)",
                              }}
                            >⚡ {computePower(p)} • CARD</button>

                          </div>


                          {/* HP */}
                          <div>
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, fontWeight: 900, letterSpacing: 1, marginBottom: 2 }}>
                              <span style={{ color: "#ff9ea1" }}>❤ HP</span>
                              <span style={{ color: hpColor, fontFamily: "monospace" }}>{Math.floor(petHp)}/{petMax}</span>
                            </div>
                            <div style={{
                              height: 9, background: "rgba(0,0,0,0.6)",
                              border: "1px solid rgba(0,0,0,0.75)",
                              borderRadius: 4, overflow: "hidden",
                              boxShadow: "inset 0 1px 2px rgba(0,0,0,0.6)",
                            }}>
                              <div style={{
                                width: `${hpPct}%`, height: "100%",
                                background: `linear-gradient(180deg, ${hpColor}, ${hpColor}aa)`,
                                boxShadow: `0 0 6px ${hpColor}88, inset 0 1px 0 rgba(255,255,255,0.4)`,
                                transition: "width 200ms",
                              }} />
                            </div>
                          </div>

                          {/* Stats grid */}
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginTop: 2 }}>
                            {statRow("atk", "ATK", stats.atk, "#ff7a7a")}
                            {statRow("def", "DEF", stats.def, "#7ec4ff")}
                            {statRow("spa", "S.ATK", stats.spa, "#c084fc")}
                            {statRow("spd", "S.DEF", stats.spd, "#7ef2a2")}
                            {statRow("spe", "VEL", stats.spe, "#f5cf6b")}
                          </div>
                        </div>

                        {/* Actions */}
                        <div style={{ display: "flex", flexDirection: "column", gap: 4, justifyContent: "center", flexShrink: 0, position: "relative" }}>
                          <div style={{ display: "flex", gap: 4 }}>
                            <button onClick={() => move(i, i - 1)} disabled={i === 0}
                              title="Subir"
                              style={{
                                width: 26, height: 22, fontSize: 12, fontWeight: 900,
                                background: i === 0 ? "rgba(0,0,0,0.5)" : "linear-gradient(180deg, #3a2450, #241634)",
                                color: i === 0 ? "#4a3560" : "#eadfe8",
                                border: `1px solid ${i === 0 ? "rgba(255,255,255,0.05)" : "#5a3d78"}`,

                                borderRadius: 5, cursor: i === 0 ? "not-allowed" : "pointer",
                              }}>▲</button>
                            <button onClick={() => move(i, i + 1)} disabled={i === team.length - 1}
                              title="Descer"
                              style={{
                                width: 26, height: 22, fontSize: 12, fontWeight: 900,
                                background: i === team.length - 1 ? "rgba(0,0,0,0.5)" : "linear-gradient(180deg, #3a2450, #241634)",
                                color: i === team.length - 1 ? "#4a3560" : "#eadfe8",
                                border: `1px solid ${i === team.length - 1 ? "rgba(255,255,255,0.05)" : "#5a3d78"}`,

                                borderRadius: 5, cursor: i === team.length - 1 ? "not-allowed" : "pointer",
                              }}>▼</button>
                          </div>
                          {!isLeader && (
                            <button onClick={() => move(i, 0)}
                              title="Tornar Líder"
                              style={{
                                padding: "3px 8px", fontSize: 9, fontWeight: 900, letterSpacing: 0.5,
                                background: "linear-gradient(180deg, #f5cf6b, #b8862a)",
                                color: "#000", border: "1px solid #fff4d0",

                                borderRadius: 5, cursor: "pointer",
                                boxShadow: "0 2px 4px rgba(184,134,42,0.55)",
                              }}>★ LÍDER</button>
                          )}
                          <button
                            onClick={() => {
                              if (!confirm(`Retirar ${p.species.replace(/_/g, " ")} do time? Ele continua na Coleção.`)) return;
                              const next = team.filter((x) => x.uid !== p.uid);
                              onReorderTeam(next);
                            }}
                            title="Retirar do time (fica na Coleção)"
                            style={{
                              padding: "3px 8px", fontSize: 9, fontWeight: 900, letterSpacing: 0.5,
                              background: "linear-gradient(180deg, #ff7a7a, #8a1a1a)",
                              color: "#fff", border: "1px solid #ffb8b8",
                              borderRadius: 5, cursor: "pointer",
                              boxShadow: "0 2px 4px rgba(138,26,26,0.55)",
                            }}>↩ RETIRAR</button>
                        </div>
                      </div>
                    );
                  })}

                  {/* Slots vazios */}
                  {Array.from({ length: Math.max(0, 6 - team.length) }).map((_, k) => (
                    <div key={`empty-${k}`} style={{
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                      padding: 14, minHeight: 60,
                      background: "rgba(0,0,0,0.3)",
                      border: "1px dashed rgba(245, 207, 107, 0.2)", borderRadius: 12,
                      color: "#b8a8c8", fontSize: 11, fontWeight: 800, letterSpacing: 1,

                    }}>
                      <span style={{ fontSize: 16, opacity: 0.5 }}>＋</span>
                      SLOT VAZIO — Adicione pela Coleção
                    </div>
                  ))}
                </div>
                {/* Botão do Ancião Glacial abaixo da Equipe */}
                <div style={{ marginTop: 16, display: "flex", justifyContent: "center" }}>
                  <button
                    onClick={onAnciaoInteraction}
                    style={{
                      width: "100%",
                      padding: "12px",
                      background: "linear-gradient(180deg, #15803d, #064e3b)",
                      border: "2px solid #4ade80",
                      borderRadius: 12,
                      color: "#4ade80",
                      fontSize: 14,
                      fontWeight: 900,
                      letterSpacing: 2,
                      cursor: "pointer",
                      boxShadow: "0 0 15px rgba(74,222,128,0.3)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                      transition: "all 0.2s ease"
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.boxShadow = "0 0 25px rgba(74,222,128,0.6)";
                      e.currentTarget.style.borderColor = "#86efac";
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.boxShadow = "0 0 15px rgba(74,222,128,0.3)";
                      e.currentTarget.style.borderColor = "#4ade80";
                    }}
                  >
                    ❄️ FALAR COM O ANCIÃO GLACIAL
                  </button>
                </div>

              </div>
            );
          })()}

          </div>
        </div>
      )}





      {tab === "tarefas" && (
        <div>
          <div style={{ color: "#c8b8d0", fontSize: 13, marginBottom: 12 }}>
            Complete as tarefas para ganhar <img src={crystalGreenImg} alt="" style={{ width: 12, verticalAlign: "middle" }} /> cristais.
          </div>
          {tasks.length === 0 ? (
            <div style={{ color: "#8a7a9c", fontSize: 13, padding: 20, textAlign: "center" }}>
              Todas as tarefas foram concluídas! Aguarde novas em breve.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {tasks.map((t) => (
                <div key={t.id} style={{
                  background: "rgba(0,0,0,0.3)",
                  border: `1px solid ${t.done ? "#5ec26a55" : "rgba(245,207,107,0.2)"}`,
                  borderRadius: 8, padding: 12,

                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <span style={{ color: "#eadfe8", fontWeight: 700, fontSize: 13 }}>{t.title}</span>
                    <span style={{ display: "flex", alignItems: "center", gap: 4, color: "#f5cf6b", fontWeight: 800 }}>
                      <img src={crystalGreenImg} alt="" style={{ width: 14, imageRendering: "pixelated" }} />
                      {t.reward}
                    </span>
                  </div>
                  <div style={{ height: 6, background: "#3a1010", borderRadius: 3 }}>
                    <div style={{
                      width: `${Math.min(100, (t.progress / t.target) * 100)}%`,
                      height: "100%", background: t.done ? "#5ec26a" : "#c92a2a",
                      borderRadius: 3, transition: "width 200ms",
                    }} />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 6 }}>
                    <span style={{ color: "#b8a8c8", fontSize: 11 }}>{t.progress}/{t.target}</span>
                    {t.done && (
                      <button onClick={() => onClaimTask(t.id)}
                        style={{ background: "#5ec26a", color: "#0b0510", border: "none", borderRadius: 6, padding: "6px 14px", fontWeight: 800, cursor: "pointer" }}>
                        COLETAR
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "mochila" && (() => {
        const NAMES: Record<string, string> = {
          potion: "Poção", pokeball: "Pokébola", greatball: "Great Ball", ultraball: "Ultra Ball",
          book_atk: "Livro Ataque", book_def: "Livro Defesa", book_exp: "Livro EXP",
          book_exp_big: "Livro EXP Raro", book_exp_max: "Livro EXP Lendário", book_vip: "Livro VIP ✦",
          book_vip_30: "Livro VIP 30d ✦✦", book_vip_60: "Livro VIP 60d ✦✦✦",
          chest_amulet: "Amuleto do Baú", berry: "Baga", revive: "Reviver", key: "Chave",
          premium_box: "Caixa Premium ✦ Evento",
          skin_ticket: "Ticket de Skin ✦",
          bau_esmeralda: "Baú de Esmeralda 💠",
          chave_ruby: "Chave Ruby 🔴",
          egg_common: "Ovo Comum", egg_rare: "Ovo Raro", egg_epic: "Ovo Épico", egg_mystic: "Ovo Místico", egg_aura: "Ovo da Aura", egg_charizard: "Ovo do Charizard", egg_charizard_mythic: "Ovo do Charizard Mítico ✦", egg_lugia: "Ovo de Lugia ✦",
          incenso_mel: "Incenso de Mel 🍯", incenso_mel_raro: "Incenso Raro ✨🍯", incenso_mel_raro_24h: "Incenso Raro 24h ✨🍯",
          orb_xp_supreme_24h: "Orb Supremo 24h ✦✦✦",
          safira_verde: "Safira Verde 💚",
          carta_governante: "Carta do Governante 👑",
          carta_incubadora: "Carta da Incubadora Lendária 🔮",
          carta_plus: "Carta Suprema Plus ✦",
          carta_riolu: "Carta Riolu Suprema 🐺✦",
          stone_grass: "Stone Verdejante 🌿", stone_fire: "Stone Ígnea 🔥",
          stone_water: "Stone Aquática 💧", stone_electric: "Stone Elétrica ⚡",
          stone_dark: "Stone Sombria 🌑", stone_dragon: "Stone Dragão 🐉",
          black_mitic_egg: "Black Mitic Egg ✦",
          egg_boost_69: "Cristal do Despertar ✦",
          stone_pack_all: "Pacote das Seis Stones 💠",
          cristal_fragmentado: "Cristal Prisma 🔷",
          fragmento_vermelho: "Fragmento Vermelho 🔻",
          orb_suprema: "Orb Suprema ✦✦✦", pergaminho_teleporte: "Pergaminho de Teleporte 📜",
          fragmento_antigo: "Fragmento Antigo 🗿", pedra_mistica: "Pedra Mística 🔮",
          medalha_medieval: "Medalha Medieval 🏅", nucleo_arcano: "Núcleo Arcano 🌀",
          cristal_negro: "Cristal Negro 🖤",
        };
        const ITEM_DESC: Record<string, string> = {
          potion: "Restaura HP do pokémon líder. Use em quantidade para curar grandes danos.",
          pokeball: "Pokébola padrão. Chance base de captura.",
          greatball: "Great Ball. Melhor chance de captura contra pokémon fortes.",
          ultraball: "Ultra Ball. Alta chance de captura, essencial contra míticos.",
          book_atk: "Aumenta o Ataque do time em batalha (permanente ao usar).",
          book_def: "Aumenta a Defesa do time em batalha (permanente ao usar).",
          book_exp: "Livro de EXP · +10% EXP por 1 hora.",
          book_exp_big: "Livro de EXP Raro · +20% EXP por 1 hora.",
          book_exp_max: "Livro de EXP Lendário · +30% EXP por 1 hora.",
          book_vip: "Livro VIP · +20% Ouro e EXP por 1 hora.",
          book_vip_30: "Livro VIP 30 dias · +30% Ouro e EXP.",
          book_vip_60: "Livro VIP 60 dias · +40% Ouro e EXP.",
          orb_xp_minor: "Orb Menor ✦ · +10% EXP por 1 hora (stack com livro).",
          orb_xp_major: "Orb Maior ✦✦ · +20% EXP por 1 hora (stack com livro).",
          orb_xp_supreme: "Orb Supremo ✦✦✦ · +30% EXP por 1 hora (stack com livro).",
          orb_xp_supreme_24h: "Orb Supremo 24h ✦✦✦ · +30% EXP por 24 horas contínuas. Não empilha com outro orb ativo.",
          orb_team: "Orb de Time ✦✦✦ · distribui EXP a todo o time por 3 horas.",
          incenso_mel: "Incenso de Mel 🍯 · +10% drop/xp/def/velocidade por 1 hora.",
          incenso_mel_raro: "Incenso Raro ✨🍯 · +20% drop/xp/def/velocidade por 1 hora.",
          incenso_mel_raro_24h: "Incenso Raro 24h ✨🍯 · +20% drop/xp/def/velocidade por 24 horas contínuas.",
          premium_box: "Caixa Premium ✦ Evento · abre para receber 50 Poções, 50 Pokébolas e 1 Ticket de Skin.",
          bau_esmeralda: "Baú de Esmeralda 💠 · loot aleatório de alto valor (balls, orbs, stones, cristais).",
          chave_ruby: "Chave Ruby 🔴 · usada para conversão na Escala Ruby (loja exclusiva). Recompensa do Top 50 do Ranked Global — coletada uma única vez por conta. Top 1: 15 · Top 2: 13 · Top 3: 11 · Top 4: 7 · Top 5–50: 3.",
          skin_ticket: "Ticket de Skin ✦ · use na aba Início para desbloquear uma skin premium.",
          egg_common: "Ovo Comum · chocado gera um pokémon aleatório de raridade baixa.",
          egg_rare: "Ovo Raro · chance de raridades altas ao chocar.",
          egg_epic: "Ovo Épico · alta chance de raridade Épica.",
          egg_mystic: "Ovo Místico · pode chocar espécies míticas.",
          egg_aura: "Ovo da Aura · espécies especiais com aura elemental.",
          egg_charizard: "Ovo do Charizard · choca sempre um Charizard.",
          egg_charizard_mythic: "Ovo do Charizard Mítico ✦ · choca um Charizard Mítico ✦ nível 500.",
          egg_lugia: "Ovo de Lugia ✦ · choca um Lugia mítico.",
          safira_verde: "Safira Verde 💚 · moeda do evento Oddish. Converte em Esmeraldas (200:1) na Cash Shop.",
          berry: "Baga · restaura um pouco de HP em batalha.",
          revive: "Reviver · devolve um pokémon caído com HP parcial.",
          key: "Chave · abre baús trancados encontrados no mundo.",
          chest_amulet: "Amuleto do Baú · aumenta a chance de baús aparecerem.",
          carta_governante: "Carta do Governante 👑 · libera viagem ao Continente do Governante (Absol). NÃO é consumida — mantenha na mochila para entrar/sair livremente.",
          carta_incubadora: "Carta da Incubadora Lendária 🔮 · entregue ao Governante no Salão para receber 1 Black Mitic Plus Egg (consumida). Limite de 6 ovos simultâneos.",
          carta_plus: "Carta Suprema Plus ✦ · leve ao Governante para materializar 1 Black Mitic Plus direto na Coleção, VERSÁTIL com 6 traits. Uso único.",
          carta_riolu: "Carta Riolu Suprema 🐺✦ · leve ao Governante para materializar 1 Riolu Black Mitic Brilhant Plus (Lv 1000, 6 traits) direto na Coleção. Uso único.",
          stone_grass: "Stone Verdejante 🌿 · alimenta ovos Black Míticos e vale ouro.",
          stone_fire: "Stone Ígnea 🔥 · alimenta ovos Black Míticos e vale ouro.",
          stone_water: "Stone Aquática 💧 · alimenta ovos Black Míticos e vale ouro.",
          stone_electric: "Stone Elétrica ⚡ · alimenta ovos Black Míticos e vale ouro.",
          stone_dark: "Stone Sombria 🌑 · alimenta ovos Black Míticos, valor alto.",
          stone_dragon: "Stone Dragão 🐉 · alimenta ovos Black Míticos, valor muito alto.",
          black_mitic_egg: "Black Mitic Egg ✦ · ovo lendário que flutua ao seu lado. Clique nele no mapa para abrir a HUD e alimentar com Elemental Stones (50 por vez). Cooldown de 7h por alimentação. A afinidade elemental dominante decidirá o elemento do futuro Pokémon.",
          egg_boost_69: "Cristal do Despertar ✦ · use para abrir o painel do Black Mitic Egg e escolher qual ovo terá o progresso adiantado para 69% (só funciona em ovos ativados e com menos de 69%).",
          stone_pack_all: "Pacote das Seis Stones 💠 · use para receber 4 000 de cada Stone Elemental (🌿 🔥 💧 ⚡ 🌑 🐉).",
          cristal_fragmentado: "Cristal Prisma 🔷 · token obtido ao fragmentar Pokémon da coleção (1 por Pokémon). Vale no Ranking Global de Prisma — atualizado a cada 2 horas.",
          orb_suprema: "Orb Suprema ✦✦✦ · relíquia do Ginásio Medieval. Item de altíssimo valor, drop extremamente raro.",
          pergaminho_teleporte: "Pergaminho de Teleporte 📜 · relíquia do Ginásio Medieval usada em viagens arcanas.",
          fragmento_antigo: "Fragmento Antigo 🗿 · fragmento de eras esquecidas, encontrado nos salões do Ginásio.",
          pedra_mistica: "Pedra Mística 🔮 · pedra saturada de magia antiga. Drop muito raro do Ginásio.",
          medalha_medieval: "Medalha Medieval 🏅 · prova de vitória nos andares do Ginásio Medieval.",
          nucleo_arcano: "Núcleo Arcano 🌀 · núcleo do Santuário Arcano (área Black Mythic). Drop quase impossível.",
          cristal_negro: "Cristal Negro 🖤 · o item mais raro do Ginásio Medieval. Nasce apenas onde o Black Mythic caminha.",
          fragmento_vermelho: "Fragmento Vermelho 🔻 · fragmento de Cristal Vermelho dropado por QUALQUER pokémon derrotado. A quantidade escala pela raridade do alvo: Comum 1 · Incomum 2 · Raro 3 · Épico 4 · Lendário/Mítico 5. Aparece na COLETA e vai para a mochila ao clicar em COLETAR.",
        };
        const EGG_COLORS: Record<string, string> = { egg_common: "#c8b8d0", egg_rare: "#6bd4ff", egg_epic: "#c084fc", egg_mystic: "#ff97e1", egg_aura: "#6bd4ff", egg_charizard: "#ff6b3d", egg_charizard_mythic: "#ff3d6b", egg_lugia: "#a9d8ff" };
        const catOf = (id: string): "balls" | "potions" | "books" | "eggs" | "other" => {
          if (id.endsWith("ball") || id === "pokeball" || id === "greatball" || id === "ultraball") return "balls";
          if (id === "potion" || id === "revive" || id === "berry") return "potions";
          if (id.startsWith("book_")) return "books";
          if (id.startsWith("egg_")) return "eggs";
          return "other";
        };
        const CATS: { id: "all" | "balls" | "potions" | "books" | "eggs" | "other"; label: string; icon: string }[] = [
          { id: "all", label: "Tudo", icon: catAllUrl },
          { id: "balls", label: "Bolas", icon: catBallsUrl },
          { id: "potions", label: "Poções", icon: catPotionsUrl },
          { id: "books", label: "Livros", icon: catBooksUrl },
          { id: "eggs", label: "Ovos", icon: catEggsUrl },
          { id: "other", label: "Outros", icon: catOtherUrl },
        ];
        // filtra chaves internas de contagem (não devem aparecer na mochila)
        const entries = Object.entries(items).filter(([id, n]) => n > 0 && !id.startsWith("_"));
        const totalTypes = entries.length;
        const totalCount = entries.reduce((a, [, n]) => a + n, 0);
        const filtered = mochilaCat === "all" ? entries : entries.filter(([id]) => catOf(id) === mochilaCat);
        // slots: preenche a grade com mínimo de 24 slots
        const SLOTS_MIN = 24;
        const emptyCount = Math.max(0, SLOTS_MIN - filtered.length);

        // Paleta moderna e translúcida
        const P = {
          bg1: "rgba(20, 10, 35, 0.4)", bg2: "rgba(10, 5, 20, 0.6)", bg3: "rgba(5, 2, 10, 0.8)",
          ink: "#f0e2ff", inkSoft: "#b8a8c8",
          gold: "#f5cf6b", goldLight: "#fff8e4", goldDark: "#b8862a",
          rose: "#ff5252", roseSoft: "#ff9ea1",
          panel: "rgba(30, 15, 50, 0.4)",
        };

        return (
          <div style={{
            background: `
              radial-gradient(circle at 50% 30%, rgba(168,85,247,0.15), transparent 55%),
              linear-gradient(160deg, rgba(20, 10, 35, 0.4) 0%, rgba(10, 5, 20, 0.6) 100%)
            `,
            borderRadius: 16, padding: 14,
            fontFamily: '"Pixelify Sans", ui-monospace, monospace',
            position: "relative",
            display: "flex",
            flexDirection: "column",
            height: "100%",
            minHeight: 0

          }}>

            <div aria-hidden style={{ position: "absolute", inset: 0, borderRadius: 16, pointerEvents: "none",
              background: "radial-gradient(ellipse at 50% 0%, rgba(212,162,255,0.18), transparent 60%)" }} />

            {/* CABEÇALHO — pergaminho dourado */}
            <div style={{
              display: "flex", alignItems: "center", gap: 14, marginBottom: 12,
              padding: "12px 16px",
              background: "rgba(0, 0, 0, 0.4)",
              border: "1px solid rgba(245, 207, 107, 0.2)", borderRadius: 12,
              boxShadow: "inset 0 1px 4px rgba(0, 0, 0, 0.4)",

            }}>
              <div style={{
                width: 60, height: 60, borderRadius: 12, flexShrink: 0,
                background: "rgba(0,0,0,0.3)",
                display: "grid", placeItems: "center",
                border: "1.5px solid rgba(245, 207, 107, 0.2)",
                boxShadow: "0 3px 8px rgba(0,0,0,0.35)",

              }}>
                <img src={bagIconImg} alt="" width={40} height={40} style={{ imageRendering: "pixelated", filter: "drop-shadow(0 2px 2px rgba(0,0,0,0.4))" }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  color: "#f5cf6b", fontSize: 22, fontWeight: 900, letterSpacing: 3, lineHeight: 1,
                  textShadow: `0 2px 4px rgba(0,0,0,0.5)`,
                }}>✦ MOCHILA ✦</div>

                <div style={{ color: P.inkSoft, fontSize: 10.5, marginTop: 6, fontStyle: "italic" }}>
                  "Um bom aventureiro carrega o mundo nas costas."
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 5, alignItems: "flex-end" }}>
                <div style={{
                  background: `linear-gradient(180deg, ${P.panel}, ${P.bg2})`, color: P.ink,
                  border: `1.5px solid ${P.goldDark}`, borderRadius: 8, padding: "3px 10px",
                  fontSize: 10.5, fontWeight: 900, letterSpacing: 0.5,
                  boxShadow: `inset 0 0 0 1px ${P.goldLight}80`,
                }}>{totalTypes} tipos · {totalCount} itens</div>
                <div style={{
                  background: `linear-gradient(180deg, ${P.goldLight}, ${P.gold})`, color: P.ink,
                  border: "1px solid rgba(245, 207, 107, 0.3)", borderRadius: 8, padding: "3px 10px",
                  fontSize: 11, fontWeight: 900,
                  boxShadow: "0 2px 0 rgba(0,0,0,0.2)",
                }}>💰 {bank.gold.toLocaleString()}</div>

              </div>
            </div>

            {/* GRID LAYOUT — sidebar categorias + grade */}
            <div className="mochila-body" style={{ display: "grid", gridTemplateColumns: "180px 1fr 280px", gap: 16, flex: 1, minHeight: 0 }}>
              {/* SIDEBAR CATEGORIAS */}
              <div style={{
                background: "rgba(0, 0, 0, 0.4)",
                border: "2px solid rgba(245, 207, 107, 0.3)", borderRadius: 16,
                boxShadow: "inset 0 0 20px rgba(0, 0, 0, 0.5)",
                padding: 10, display: "flex", flexDirection: "column", gap: 8,
                overflowY: "auto"
              }}>

                <div style={{
                  textAlign: "center", fontSize: 12, fontWeight: 900, letterSpacing: 2,
                  color: "#f5cf6b", padding: "8px 0", borderBottom: `2px solid rgba(245, 207, 107, 0.3)`,
                  marginBottom: 8, textShadow: "0 2px 4px rgba(0,0,0,0.5)"
                }}>FILTROS</div>

                {CATS.map((c) => {
                  const active = mochilaCat === c.id;
                  const count = c.id === "all" ? entries.length : entries.filter(([id]) => catOf(id) === c.id).length;
                  return (
                    <button
                      key={c.id}
                      onClick={() => setMochilaCat(c.id)}
                      style={{
                        display: "flex", alignItems: "center", gap: 8,
                        padding: "8px 10px", fontSize: 11.5, fontWeight: 900, letterSpacing: 0.3,
                        background: active
                          ? `linear-gradient(180deg, ${P.goldLight}, ${P.gold})`
                          : `linear-gradient(180deg, ${P.panel}, ${P.bg2})`,
                        color: P.ink,
                        border: `1.5px solid ${active ? P.goldDark : P.gold + "77"}`,
                        borderRadius: 9, cursor: "pointer",
                        boxShadow: active
                          ? `inset 0 0 0 1px #fff8e4, 0 2px 0 rgba(0,0,0,0.25)`
                          : `0 1px 0 rgba(0,0,0,0.1)`,
                        transform: active ? "translateX(3px)" : "translateX(0)",
                        transition: "all 120ms",
                        textAlign: "left", width: "100%",
                      }}
                    >
                      <img
                        src={c.icon}
                        alt=""
                        width={44}
                        height={44}
                        style={{
                          imageRendering: "pixelated", flexShrink: 0,
                          filter: active
                            ? "drop-shadow(0 0 8px rgba(212,162,255,0.95)) drop-shadow(0 2px 3px rgba(0,0,0,0.55))"
                            : "drop-shadow(0 0 4px rgba(168,85,247,0.4)) drop-shadow(0 1px 2px rgba(0,0,0,0.55))",
                          animation: active ? "cat-bounce 1.4s ease-in-out infinite" : "cat-bounce 3.2s ease-in-out infinite",
                        }}
                      />
                      <span style={{ flex: 1 }}>{c.label}</span>
                      <span style={{
                        background: active ? P.goldDark : P.ink + "22",
                        color: active ? "#fff8e4" : P.inkSoft,
                        fontSize: 10, fontWeight: 900, padding: "1px 7px",
                        borderRadius: 999, minWidth: 22, textAlign: "center",
                      }}>{count}</span>
                    </button>
                  );
                })}
                <div style={{ flex: 1 }} />
                
                {/* Vault Access Button in Inventory */}
                <button
                  onClick={onAnciaoInteraction}
                  style={{
                    width: "100%", padding: "12px",
                    background: "linear-gradient(180deg, #3b2450, #241634)",
                    border: "2px solid #c9b8ff", borderRadius: 12,
                    color: "#c9b8ff", fontSize: 11, fontWeight: 900,
                    cursor: "pointer", boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                    marginTop: 8
                  }}
                >
                  🏰 BANCO
                </button>

                <div style={{
                  marginTop: 8, padding: "8px", fontSize: 10, fontWeight: 800,
                  color: P.inkSoft, textAlign: "center", fontStyle: "italic",
                  borderTop: `1px solid rgba(245, 207, 107, 0.2)`,
                }}>
                  {SLOTS_MIN - filtered.length > 0 ? `${SLOTS_MIN - filtered.length} slots livres` : "Mochila cheia"}
                </div>

              </div>

              {/* GRADE DE ITENS */}
              <div style={{
                background: "rgba(0, 0, 0, 0.4)",
                border: "2px solid rgba(245, 207, 107, 0.3)", borderRadius: 16,
                boxShadow: "inset 0 0 30px rgba(0, 0, 0, 0.5)",
                padding: 14, flex: 1, minHeight: 0, overflowY: "auto"
              }}>




                {filtered.length === 0 ? (
                  <div style={{
                    color: P.inkSoft, fontSize: 13, padding: 60, textAlign: "center", fontStyle: "italic",
                  }}>
                    {entries.length === 0
                      ? "Sua mochila está vazia. Derrote Pokémon, abra baús ou visite a Loja!"
                      : "Nenhum item nesta categoria."}
                  </div>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(126px, 1fr))", gap: 10 }}>


                    {filtered.map(([id, n]) => {
                      const isEgg = id.startsWith("egg_");
                      const color = isEgg ? (EGG_COLORS[id] ?? P.goldLight) : (ITEM_COLORS[id] ?? P.goldLight);
                      const img = ITEM_IMG[id];
                      const Icon = ITEM_ICONS[id] ?? Sparkles;
                      const sellPrice = marketSellPrices[id] ?? 0;
                      return (
                        <div key={id} style={{
                          background: `linear-gradient(180deg, ${P.panel} 0%, ${P.bg1} 100%)`,
                          border: `2px solid ${P.goldDark}`, borderRadius: 10, padding: 8,
                          textAlign: "center", position: "relative",
                          boxShadow: `inset 0 0 0 1px ${P.goldLight}88, 0 3px 0 rgba(0,0,0,0.18)`,
                          display: "flex", flexDirection: "column", gap: 6, alignItems: "center",
                          transition: "transform 120ms, box-shadow 120ms",
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = `inset 0 0 0 1px #fff8e4, 0 6px 14px rgba(0,0,0,0.35), 0 0 14px ${color}66`; }}
                        onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = `inset 0 0 0 1px ${P.goldLight}88, 0 3px 0 rgba(0,0,0,0.18)`; }}
                        >
                          <div style={{
                            position: "absolute", top: -6, right: -6,
                            background: `linear-gradient(180deg, ${P.rose}, #7a1e12)`, color: "#fff8e4",
                            fontSize: 10, fontWeight: 900, padding: "2px 7px",
                            borderRadius: 999, minWidth: 24, textAlign: "center",
                            boxShadow: "0 2px 4px rgba(0,0,0,0.5)",
                            border: `1.5px solid ${P.panel}`,
                          }}>x{n}</div>
                          <div
                            onClick={(e) => { e.stopPropagation(); setItemDetail(id); }}
                            title="Ver detalhes"
                            style={{
                            width: 62, height: 62, borderRadius: 10, marginTop: 2,
                            background: `radial-gradient(circle at 30% 30%, ${color}66, ${color}11 55%, ${P.bg2}), ${P.bg1}`,
                            display: "grid", placeItems: "center",
                            border: `2px inset ${P.goldDark}aa`,
                            boxShadow: `inset 0 2px 6px rgba(0,0,0,0.25), 0 0 10px ${color}44`,
                            position: "relative", overflow: "hidden", cursor: "pointer",
                          }}>
                            {img ? (
                              <img
                                src={img}
                                alt=""
                                width={52}
                                height={52}
                                loading="lazy"
                                style={{
                                  imageRendering: "pixelated",
                                  filter: `drop-shadow(0 0 6px ${color}aa) drop-shadow(0 2px 2px rgba(0,0,0,0.45))`,
                                  animation: "item-float 2.4s ease-in-out infinite",
                                }}
                              />
                            ) : (
                              <ItemPixelIcon id={id} size={52} color={color} />
                            )}
                          </div>
                          <div style={{
                            fontSize: 10.5, fontWeight: 900, color: P.ink, letterSpacing: 0.2, lineHeight: 1.15,
                            minHeight: 24, display: "flex", alignItems: "center",
                          }}>{NAMES[id] ?? id}</div>
                          <div style={{ display: "flex", gap: 4, width: "100%", marginTop: "auto" }}>
                            <button
                              onClick={() => {
                                const bulk = id === "book_atk" || id === "book_def" || id === "potion";
                                if (bulk && n > 1) {
                                  const raw = window.prompt(`Usar quantos ${NAMES[id] ?? id}? (1–${n})`, String(n));
                                  if (raw == null) return;
                                  const q = Math.max(1, Math.min(n, parseInt(raw, 10) || 1));
                                  onUseItem(id, q);
                                } else {
                                  onUseItem(id, 1);
                                }
                              }}
                              style={{
                                flex: 1, padding: "8px 0", fontSize: 10, fontWeight: 900,
                                background: "linear-gradient(180deg, #f5cf6b, #b8862a)",
                                color: "#000", border: "1px solid #fff4d0",
                                borderRadius: 6, cursor: "pointer", letterSpacing: 0.5,
                                boxShadow: "0 2px 4px rgba(0,0,0,0.4)"
                              }}
                            >{isEgg ? "CHOCAR" : "USAR"}</button>
                            
                            <button
                              onClick={() => {
                                const raw = window.prompt(`Vender quantos ${NAMES[id] ?? id}? (1–${n})`, "1");
                                if (raw == null) return;
                                const q = Math.max(1, Math.min(n, parseInt(raw, 10) || 1));
                                onSellItem(id, q);
                              }}
                              style={{
                                width: 34, height: 32, display: "grid", placeItems: "center",
                                background: "linear-gradient(180deg, #ff7a7a, #8a1a1a)",
                                border: "1px solid #ffb8b8", borderRadius: 6, cursor: "pointer",
                                boxShadow: "0 2px 4px rgba(0,0,0,0.4)"
                              }}
                              title="Vender ao NPC"
                            >💰</button>
                          </div>

                          {(() => {
                            const UP: Record<string, { to: string; cost: number; trainerLv: number; label: string }> = {
                              book_exp: { to: "book_exp_big", cost: 3, trainerLv: 10, label: "EXP Raro" },
                              book_exp_big: { to: "book_exp_max", cost: 3, trainerLv: 25, label: "EXP Lendário" },
                              book_vip: { to: "book_vip_30", cost: 5, trainerLv: 20, label: "VIP 30d" },
                              book_vip_30: { to: "book_vip_60", cost: 3, trainerLv: 40, label: "VIP 60d" },
                            };
                            const rule = UP[id];
                            if (!rule) return null;
                            const okLv = trainerLevel >= rule.trainerLv;
                            const okQty = n >= rule.cost;
                            const enabled = okLv && okQty;
                            const title = !okLv
                              ? `Requer Treinador Lv.${rule.trainerLv}`
                              : !okQty
                                ? `Precisa de ${rule.cost}× (você tem ${n})`
                                : `Forjar ${rule.label} usando ${rule.cost}×`;
                            return (
                              <button
                                onClick={() => onUpgradeBook(id)}
                                disabled={!enabled}
                                title={title}
                                style={{
                                  marginTop: 2, width: "100%", padding: "5px 4px", fontSize: 9.5, fontWeight: 900,
                                  background: enabled ? "linear-gradient(180deg, #8bffb0, #3a8a5a)" : `${P.bg3}88`,
                                  color: enabled ? "#0b2010" : P.inkSoft,
                                  border: `1.5px solid ${enabled ? "#2a5a3a" : P.gold + "77"}`,
                                  borderRadius: 6, cursor: enabled ? "pointer" : "not-allowed", letterSpacing: 0.3,
                                }}
                              >⚒️ {rule.label}</button>
                            );
                          })()}
                        </div>
                      );
                    })}
                    {Array.from({ length: emptyCount }).map((_, i) => (
                      <div key={`empty-${i}`} style={{
                        background: `${P.bg2}55`,
                        border: `2px dashed ${P.gold}66`, borderRadius: 10,
                        minHeight: 150,
                        boxShadow: `inset 0 0 12px ${P.gold}22`,
                      }} />
                    ))}
                  </div>
                )}
              </div>
            </div>


            <style>{`
              @media (max-width: 720px) {
                .mochila-body { grid-template-columns: 1fr !important; }
              }
            `}</style>

            {itemDetail && (() => {
              const id = itemDetail;
              const isEgg = id.startsWith("egg_");
              const color = isEgg ? (EGG_COLORS[id] ?? P.goldLight) : (ITEM_COLORS[id] ?? P.goldLight);
              const img = ITEM_IMG[id];
              const name = NAMES[id] ?? id;
              const desc = ITEM_DESC[id] ?? "Item do universo IdleMon. Ainda sem descrição detalhada.";
              const count = items[id] ?? 0;
              const sellPrice = marketSellPrices[id] ?? 0;
              return (
                <div onClick={() => setItemDetail(null)} style={{
                  position: "fixed", inset: 0, zIndex: 9999,
                  background: "rgba(4,4,10,0.72)", backdropFilter: "blur(6px)",
                  display: "grid", placeItems: "center", padding: 16,
                }}>
                  <div onClick={(e) => e.stopPropagation()} style={{
                    width: "min(420px, 96vw)", position: "relative",
                    background: "linear-gradient(160deg, rgba(28, 15, 46, 0.95) 0%, rgba(11, 5, 16, 0.98) 100%)",
                    border: "2px solid rgba(245, 207, 107, 0.3)", borderRadius: 18,
                    boxShadow: "0 20px 60px rgba(0,0,0,0.8), inset 0 0 40px rgba(245, 207, 107, 0.05)",
                    padding: 18, color: "#fff",
                  }}>

                    <button onClick={() => setItemDetail(null)} style={{
                      position: "absolute", top: 8, right: 10, background: "transparent",
                      border: "none", color: "#b8a8c8", fontSize: 20, cursor: "pointer", fontWeight: 900,
                    }}>×</button>
                    <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                      <div style={{
                        width: 84, height: 84, borderRadius: 12, flexShrink: 0,
                        background: "rgba(0,0,0,0.3)",
                        display: "grid", placeItems: "center",
                        border: "1.5px solid rgba(245, 207, 107, 0.2)",
                        boxShadow: `inset 0 2px 6px rgba(0,0,0,0.25), 0 0 14px ${color}33`,

                      }}>
                        {img ? (
                          <img src={img} alt="" width={68} height={68} style={{ imageRendering: "pixelated", filter: `drop-shadow(0 0 6px ${color}aa)` }} />
                        ) : (
                          <ItemPixelIcon id={id} size={68} color={color} />
                        )}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 16, fontWeight: 900, lineHeight: 1.2 }}>{name}</div>
                        <div style={{ fontSize: 11, color: "#b8a8c8", marginTop: 4, fontWeight: 700 }}>Quantidade: <span style={{ color: "#f5cf6b" }}>x{count}</span></div>
                        {sellPrice > 0 && (
                          <div style={{ fontSize: 11, color: "#b8a8c8", marginTop: 2, fontWeight: 700 }}>Preço de venda: <span style={{ color: "#ffd66b" }}>{sellPrice} 🪙</span></div>
                        )}

                      </div>
                    </div>
                    <div style={{
                      marginTop: 14, padding: 12, borderRadius: 10,
                      background: "rgba(0,0,0,0.3)", border: "1px dashed rgba(245, 207, 107, 0.2)",
                      fontSize: 12.5, lineHeight: 1.5, color: "#fff",

                    }}>{desc}</div>
                    <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
                      {!isEgg && count > 0 && (
                        <button onClick={() => { onUseItem(id, 1); setItemDetail(null); }} style={{
                          flex: 1, padding: "9px 10px", fontSize: 12, fontWeight: 900,
                          background: "linear-gradient(180deg, #f5cf6b, #b8862a)",
                          color: "#000", border: "1px solid #fff4d0",
                          borderRadius: 8, cursor: "pointer", letterSpacing: 0.5,
                          boxShadow: "0 4px 12px rgba(184,134,42,0.4)",

                        }}>USAR</button>
                      )}
                      {isEgg && count > 0 && (
                        <button onClick={() => { onUseItem(id, 1); setItemDetail(null); }} style={{
                          flex: 1, padding: "9px 10px", fontSize: 12, fontWeight: 900,
                          background: "linear-gradient(180deg, #f5cf6b, #b8862a)",
                          color: "#000", border: "1px solid #fff4d0",
                          borderRadius: 8, cursor: "pointer", letterSpacing: 0.5,
                          boxShadow: "0 4px 12px rgba(184,134,42,0.4)",

                        }}>CHOCAR</button>
                      )}
                      <button onClick={() => setItemDetail(null)} style={{
                        flex: 1, padding: "9px 10px", fontSize: 12, fontWeight: 900,
                        background: "rgba(0,0,0,0.3)", color: "#b8a8c8",
                        border: "1px solid rgba(245, 207, 107, 0.2)", borderRadius: 8, cursor: "pointer",

                      }}>FECHAR</button>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        );
      })()}


      {tab === "colecao" && (
        <div style={{
          background: "rgba(0,0,0,0.3)",
          borderRadius: 14, padding: 18,
          boxShadow: "inset 0 0 24px rgba(0,0,0,0.2), 0 4px 18px rgba(0,0,0,0.5)",
          display: "flex",
          flexDirection: "column",
          height: "100%",
          minHeight: 0
        }}>

          {/* HUD topo da coleção */}
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            marginBottom: 14, paddingBottom: 12,
            borderBottom: "1px solid rgba(245, 207, 107, 0.2)",
          }}>
            <div>
              <div style={{ color: "#f5cf6b", fontSize: 20, fontWeight: 900, letterSpacing: 3, fontFamily: "'Cinzel', serif" }}>
                ✦ COLEÇÃO ✦
              </div>

              <div style={{ color: "#b8a8c8", fontSize: 12, marginTop: 2, fontStyle: "italic" }}>
                Registro particular do treinador
              </div>

            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <div style={{ background: collection.length >= MAX_COLLECTION ? "#c0392b" : "rgba(0,0,0,0.4)", color: "#fff", border: "1px solid rgba(245, 207, 107, 0.2)", fontWeight: 900, padding: "8px 14px", borderRadius: 20, fontSize: 12 }}>
                {collection.length} / {MAX_COLLECTION} NA COLEÇÃO
              </div>
              <div style={{ background: "rgba(0,0,0,0.4)", color: "#fff", border: "1px solid rgba(245, 207, 107, 0.2)", fontWeight: 900, padding: "8px 14px", borderRadius: 20, fontSize: 12 }}>
                {caughtSpecies.length} ESPÉCIES
              </div>
              <div style={{ background: "linear-gradient(180deg,#f5cf6b,#b8862a)", color: "#000", fontWeight: 900, padding: "6px 14px", borderRadius: 20, fontSize: 12, boxShadow: "0 2px 8px rgba(184,134,42,0.4)", display: "flex", alignItems: "center", gap: 6 }}>
                <img src={assetUrlFromJson(iconFragmentCrystal)} alt="" width={20} height={20} style={{ imageRendering: "pixelated", filter: "drop-shadow(0 0 4px rgba(233,213,255,0.9))" }} />
                {items?.cristal_fragmentado ?? 0} CRISTAL PRISMA
              </div>
            </div>
          </div>

          {/* Filtros */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginBottom: 12, padding: "8px 10px", background: "rgba(0,0,0,0.3)", borderRadius: 10, border: "1px solid rgba(245,207,107,0.1)" }}>
            <input
              value={colFilterName}
              onChange={(e) => setColFilterName(e.target.value)}
              placeholder="🔍 Buscar por nome..."
              style={{ flex: "1 1 160px", minWidth: 140, padding: "6px 10px", fontSize: 12, fontWeight: 700, borderRadius: 8, border: "1px solid rgba(245,207,107,0.3)", background: "rgba(0,0,0,0.5)", color: "#fff" }}
            />
            <select value={colFilterRarity} onChange={(e) => setColFilterRarity(e.target.value as "all" | Rarity)}
              style={{ padding: "6px 10px", fontSize: 12, fontWeight: 800, borderRadius: 8, border: "1px solid rgba(245,207,107,0.3)", background: "rgba(0,0,0,0.5)", color: "#fff" }}>
              <option value="all">Todas raridades</option>
              <option value="common">Comum</option>
              <option value="uncommon">Incomum</option>
              <option value="rare">Raro</option>
              <option value="epic">Épico</option>
              <option value="legendary">Lendário</option>
              <option value="mythic">Mítico</option>
              <option value="mythic_shiny">Mítico Brilhante</option>
            </select>

            <select value={colSort} onChange={(e) => setColSort(e.target.value as typeof colSort)}
              style={{ padding: "6px 10px", fontSize: 12, fontWeight: 800, borderRadius: 8, border: "1px solid rgba(245,207,107,0.3)", background: "rgba(0,0,0,0.5)", color: "#fff" }}>
              <option value="recent">Mais recentes</option>
              <option value="level_desc">Nível ↓</option>
              <option value="level_asc">Nível ↑</option>
              <option value="rarity">Raridade</option>
              <option value="name">Nome</option>
            </select>
            <button
              onClick={() => setColOnlyLocked((v) => !v)}
              style={{
                padding: "6px 12px", fontSize: 12, fontWeight: 900, borderRadius: 8,
                border: "1px solid rgba(245,207,107,0.3)", cursor: "pointer",
                background: colOnlyLocked ? "linear-gradient(180deg,#facc15,#b8862a)" : "rgba(0,0,0,0.5)",
                color: colOnlyLocked ? "#4a3010" : "#fff",
              }}
              title="Mostrar somente Pokémon travados"
            >🔒 {colOnlyLocked ? "SÓ TRAVADOS" : "TRAVADOS"}</button>

            <button
              onClick={() => { setBulkMode((v) => !v); setBulkSel(new Set()); }}
              style={{
                padding: "6px 12px", fontSize: 12, fontWeight: 900, borderRadius: 8,
                border: bulkMode ? "1px solid #fff4d0" : "1px solid rgba(245, 207, 107, 0.2)", cursor: "pointer",
                background: bulkMode ? "linear-gradient(180deg,#f5cf6b,#b8862a)" : "rgba(0,0,0,0.3)",
                color: bulkMode ? "#000" : "#b8a8c8",
                boxShadow: bulkMode ? "0 0 10px rgba(184,134,42,0.4)" : "none",

              }}
              title="Selecionar vários para fragmentar de uma vez"
            >☑ {bulkMode ? "SELECIONANDO" : "SELECIONAR"}</button>
            {bulkMode && bulkSel.size > 0 && (
              <button
                onClick={() => openFragConfirm([...bulkSel])}
                style={{
                  padding: "6px 14px", fontSize: 12, fontWeight: 900, borderRadius: 8,
                  border: "1px solid #ff9ea1", cursor: "pointer",
                  background: "linear-gradient(180deg,#ff5252,#c0392b)",
                  color: "#fff",
                  boxShadow: "0 0 10px rgba(255,82,82,0.4)",

                }}
              >⚒️ FRAGMENTAR {bulkSel.size}</button>
            )}
            <div style={{ fontSize: 11, color: "#6b4a10", fontWeight: 800 }}>
              🔒 {lockedSet.size} travados
            </div>
          </div>

          {collection.length === 0 ? (
            <div style={{ color: "#b8a8c8", fontSize: 13, padding: 30, textAlign: "center", fontStyle: "italic" }}>

              Nenhum Pokémon capturado ainda. Continue a jornada — a taxa de captura é baixa (5%).
            </div>
          ) : (() => {
            const rarityOrder: Record<Rarity, number> = {
              common: 0, uncommon: 1, rare: 2, epic: 3, legendary: 4, mythic: 5, mythic_shiny: 6,
            } as Record<Rarity, number>;
            const q = colFilterName.trim().toLowerCase();
            const filtered = collection.filter((e) => {
              if (colFilterRarity !== "all" && e.rarity !== colFilterRarity) return false;
              if (q && !e.species.toLowerCase().includes(q)) return false;
              if (colOnlyLocked && !lockedSet.has(e.uid)) return false;
              return true;
            });
            filtered.sort((a, b) => {
              if (colSort === "recent") return b.capturedAt - a.capturedAt;
              if (colSort === "level_desc") return b.level - a.level;
              if (colSort === "level_asc") return a.level - b.level;
              if (colSort === "rarity") return (rarityOrder[b.rarity] ?? 0) - (rarityOrder[a.rarity] ?? 0);
              return a.species.localeCompare(b.species);
            });
            if (filtered.length === 0) {
              return <div style={{ color: "#b8a8c8", fontSize: 13, padding: 30, textAlign: "center", fontStyle: "italic" }}>Nenhum Pokémon corresponde aos filtros.</div>;
            }
            return (
              <div style={{ flex: 1, minHeight: 0, overflowY: "auto", paddingRight: 4 }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: 12 }}>
              {filtered.map((entry, i) => {
                const sp = entry.species;
                const isCurrent = leader?.species === sp && leader?.uid === entry.uid;
                const teamPet = team.find((p) => p.uid === entry.uid);
                const inTeam = !!teamPet;
                const displayLevel = teamPet?.level ?? entry.level;
                const rarityColor: Partial<Record<Rarity, string>> = {
                  common: "#8b6a30", uncommon: "#5ec26a", rare: "#4a9eff",
                  epic: "#c084fc", legendary: "#ff8b3d", mythic: "#ff5252", mythic_shiny: "#ffd94d",
                };
                const rColor = rarityColor[entry.rarity] ?? "#8b6a30";
                const gain = CRAFT_BY_RARITY[entry.rarity] ?? 1;
                const locked = lockedSet.has(entry.uid);
                 const traits = entry.traits ?? [];
                 const fragDisabled = inTeam || locked;
                 const isSelected = bulkSel.has(entry.uid);
                 const canBulkPick = !inTeam && !locked;
                 const isBMP = !!entry.event && entry.event.startsWith("black_mitic");
                 const isBrilhant = !!entry.event && entry.event.includes("brilhant");
                 const bmpAccent = isBrilhant ? "#ff97e1" : "#a066ff";
                 return (
                   <div
                     key={entry.uid}
                     onClick={() => {
                       if (!bulkMode) return;
                       if (!canBulkPick) return;
                       toggleBulk(entry.uid);
                     }}
                     style={{
                        background: isSelected ? "rgba(245, 207, 107, 0.2)" : "rgba(0,0,0,0.3)",
                        border: `1.5px solid ${isBMP ? bmpAccent : (isSelected ? "#f5cf6b" : locked ? "#eab308" : (inTeam ? "#f5cf6b" : "rgba(245, 207, 107, 0.2)"))}`,

                       borderRadius: 12, padding: 10, textAlign: "center",
                       position: "relative",
                       overflow: "hidden",
                       boxShadow: isBMP
                         ? `0 4px 14px rgba(0,0,0,0.6), 0 0 22px ${bmpAccent}88, inset 0 0 26px ${bmpAccent}33`
                         : `0 2px 8px rgba(0,0,0,0.15), inset 0 0 12px ${rColor}22${locked ? ", 0 0 10px rgba(234,179,8,0.5)" : ""}${isSelected ? ", 0 0 14px rgba(124,58,237,0.7)" : ""}`,
                       display: "grid",
                       gridTemplateRows: "auto auto auto auto 36px",
                       gap: 4,
                       alignItems: "center",
                       justifyItems: "center",
                       minHeight: 220,
                       cursor: bulkMode ? (canBulkPick ? "pointer" : "not-allowed") : "default",
                     }}
                   >
                     {isBMP && (
                       <div style={{
                         position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0,
                         background: `radial-gradient(circle at 50% 20%, ${bmpAccent}55, transparent 60%), radial-gradient(circle at 80% 90%, ${bmpAccent}33, transparent 55%)`,
                       }} />
                     )}
                    <div style={{ position: "absolute", top: 4, left: 6, fontSize: 9, fontWeight: 900, color: "#f5cf6b", letterSpacing: 1, zIndex: 2, opacity: 0.8 }}>
                      #{String(i + 1).padStart(3, "0")}
                    </div>
                    {inTeam && (
                      <div style={{ position: "absolute", top: 4, right: 6, fontSize: 9, fontWeight: 900, color: "#5ec26a", zIndex: 2 }}>★ TIME</div>
                    )}

                    {/* Checkbox de bulk select */}
                    {bulkMode && canBulkPick && (
                      <div style={{
                        position: "absolute", top: 6, left: 26,
                        width: 22, height: 22, borderRadius: 6,
                        border: `2px solid ${isSelected ? "#7c3aed" : "#8b6a30"}`,
                        background: isSelected ? "linear-gradient(180deg,#a78bfa,#5b21b6)" : "#fff8e5",
                        color: "#fff", fontSize: 14, fontWeight: 900,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        boxShadow: isSelected ? "0 0 8px rgba(124,58,237,0.7)" : "none",
                        zIndex: 3,
                      }}>{isSelected ? "✓" : ""}</div>
                    )}
                    {/* Botão cadeado */}
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleLock(entry.uid); }}
                      title={locked ? "Destravar (permite fragmentar)" : "Travar (protege de fragmentar)"}
                      style={{
                        position: "absolute", top: 22, right: 4,
                        width: 24, height: 24, borderRadius: "50%",
                        border: "1px solid rgba(245,207,107,0.3)", cursor: "pointer",
                        background: locked ? "linear-gradient(180deg,#f5cf6b,#b8862a)" : "rgba(0,0,0,0.3)",
                        color: locked ? "#000" : "#b8a8c8",


                        fontSize: 12, fontWeight: 900, padding: 0, zIndex: 2,
                      }}
                    >{locked ? "🔒" : "🔓"}</button>

                    {/* Sprite + nome */}
                     <button
                       onClick={(e) => { e.stopPropagation(); if (bulkMode) { if (canBulkPick) toggleBulk(entry.uid); return; } onOpenColecaoDetail(entry.uid); }}
                       style={{ background: "transparent", border: "none", cursor: "pointer", padding: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", justifySelf: "center", width: "100%", position: "relative", zIndex: 1 }}
                       title={bulkMode ? "Selecionar/deselecionar" : "Ver detalhes"}
                     >
                       {gifMap[sp] && <img src={gifMap[sp]} alt="" style={{ width: 64, height: 64, imageRendering: "pixelated", marginTop: 6, display: "block", filter: isBMP ? `drop-shadow(0 0 8px ${bmpAccent})` : undefined }} />}
                       <div style={{ fontSize: 11, marginTop: 2, color: "#fff", fontWeight: 800, textAlign: "center", textShadow: "0 1px 3px #000" }}>{sp.replace(/_/g, " ").toUpperCase()}</div>
                     </button>

                     {/* Raridade / Badge BMP */}
                     <div style={{
                       fontSize: 9, padding: "2px 8px", borderRadius: 10,
                        background: isBMP ? `linear-gradient(180deg, ${bmpAccent}, #4a1080)` : rColor,
                        color: "#fff", justifySelf: "center", fontWeight: 900, letterSpacing: 1,
                        boxShadow: isBMP ? `0 0 8px ${bmpAccent}44` : "0 2px 4px rgba(0,0,0,0.3)",
                        border: "1px solid rgba(255,255,255,0.1)",

                       position: "relative", zIndex: 1,
                     }}>
                       {isBMP ? (isBrilhant ? "BLACK MITIC BRILHANT PLUS" : "BLACK MITIC PLUS") : entry.rarity.toUpperCase()}
                     </div>

                     {/* Nível */}
                     <div style={{ fontSize: 11, color: "#f5cf6b", fontWeight: 900, position: "relative", zIndex: 1, textShadow: "0 1px 2px #000" }}>
                       Nv. {displayLevel}{inTeam && teamPet && teamPet.level !== entry.level ? ` (cap. Nv.${entry.level})` : ""}
                     </div>

                     {/* Traits — mostra TODOS (até 6) para Black Mitic */}
                     <div
                       style={{
                         display: "flex", gap: 3, justifyContent: "center", alignItems: "center",
                         flexWrap: "wrap", minHeight: 28, position: "relative", zIndex: 1,
                         padding: isBMP ? "4px 6px" : 0,
                         background: isBMP ? "rgba(0,0,0,0.35)" : "transparent",
                         border: isBMP ? `1px solid ${bmpAccent}66` : "none",
                         borderRadius: isBMP ? 8 : 0,
                         width: isBMP ? "100%" : "auto",
                       }}
                       title={traits.length ? traits.map((id) => TRAITS[id]?.name).filter(Boolean).join(" · ") : "Sem traits"}
                     >
                       {traits.length > 0
                         ? traits.slice(0, isBMP ? 6 : 4).map((id) => <TraitIcon key={id} id={id} size={isBMP ? 20 : 22} />)
                         : <span style={{ fontSize: 9, color: "#b8a066", fontWeight: 700, letterSpacing: 0.5, opacity: 0.7 }}>— sem traits —</span>}
                     </div>


                    {/* Botão fragmentar (ícone cristal) */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (inTeam) { alert("Retire do time antes de fragmentar."); return; }
                        if (locked) { alert("Este Pokémon está TRAVADO 🔒. Destrave para fragmentar."); return; }
                        if (bulkMode) { toggleBulk(entry.uid); return; }
                        openFragConfirm([entry.uid]);
                      }}
                      disabled={fragDisabled}
                      style={{
                        display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                        padding: "4px 10px", height: 36,
                        background: fragDisabled
                          ? "rgba(0,0,0,0.4)"
                          : "linear-gradient(180deg,#c4b5fd 0%,#8b5cf6 45%,#5b21b6 100%)",
                        color: "#fff", fontWeight: 900, fontSize: 12, letterSpacing: 0.5,
                        border: fragDisabled ? "1px solid rgba(255,255,255,0.05)" : "1px solid #3b0f7a",

                        borderRadius: 9,
                        boxShadow: fragDisabled
                          ? "inset 0 -2px 0 rgba(0,0,0,0.15)"
                          : "inset 0 1px 0 rgba(255,255,255,0.35), inset 0 -2px 0 rgba(0,0,0,0.35), 0 0 14px rgba(167,139,250,0.75)",
                        cursor: fragDisabled ? "not-allowed" : "pointer",
                        opacity: fragDisabled ? 0.75 : 1,
                        transition: "transform 90ms, filter 120ms",
                        textShadow: "0 1px 2px rgba(0,0,0,0.5)",
                      }}
                      onMouseEnter={(e) => { if (!fragDisabled) (e.currentTarget as HTMLButtonElement).style.filter = "brightness(1.15)"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.filter = "none"; }}
                      title={inTeam ? "No time — não pode fragmentar" : locked ? "Travado — destrave para fragmentar" : `Fragmentar por +${gain} pts de craft`}
                    >
                      {inTeam ? (
                        <span style={{ fontWeight: 900 }}>★ NO TIME</span>
                      ) : locked ? (
                        <span style={{ fontWeight: 900 }}>🔒 TRAVADO</span>
                      ) : (
                        <>
                          <span style={{
                            display: "inline-flex", alignItems: "center", justifyContent: "center",
                            width: 34, height: 34, borderRadius: "50%",
                            background: "radial-gradient(circle at 40% 35%, rgba(255,255,255,0.55), rgba(196,181,253,0.15) 55%, transparent 75%)",
                            boxShadow: "0 0 10px rgba(233,213,255,0.8), inset 0 0 8px rgba(124,58,237,0.35)",
                          }}>
                            <img
                              src={assetUrlFromJson(iconFragmentCrystal)}
                              alt=""
                              width={30}
                              height={30}
                              style={{ imageRendering: "pixelated", filter: "drop-shadow(0 0 4px rgba(233,213,255,0.9)) drop-shadow(0 1px 2px rgba(0,0,0,0.5))" }}
                            />
                          </span>
                          <span style={{ fontSize: 13 }}>+{gain}</span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
              </div>
            </div>
            );
          })()}
        </div>
      )}



      {tab === "pokedex" && (
        <div style={{
          background: "linear-gradient(180deg, #2a0510, #1a0510)",
          border: "2px solid #e11d48",
          borderRadius: 10, padding: 14,
          boxShadow: "inset 0 0 30px rgba(225,29,72,0.25)",
        }}>
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            marginBottom: 12, paddingBottom: 10, borderBottom: "1px solid #e11d4855",
          }}>
            <div>
              <div style={{ color: "#ff6b8a", fontSize: 18, fontWeight: 900, letterSpacing: 2 }}>
                📕 POKÉDEX
              </div>
              <div style={{ color: "#ffb3c1", fontSize: 11, marginTop: 2 }}>
                Registro de Pokémon enfrentados em duelos
              </div>
            </div>
            <div style={{
              background: "#e11d48", color: "#fff", fontWeight: 900,
              padding: "6px 14px", borderRadius: 20, fontSize: 13,
              boxShadow: "0 0 12px #e11d4888",
            }}>
              {seenSpecies.length} REGISTRADO{seenSpecies.length === 1 ? "" : "S"}
            </div>
          </div>
          {seenSpecies.length === 0 ? (
            <div style={{ color: "#ffb3c1", fontSize: 13, padding: 30, textAlign: "center", fontStyle: "italic" }}>
              Nenhum Pokémon registrado ainda. Derrote inimigos em batalha para registrá-los!
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))", gap: 10 }}>
              {seenSpecies.map((sp, i) => {
                const caught = caughtSpecies.includes(sp);
                return (
                  <div key={sp} style={{
                    background: "linear-gradient(180deg, #3a0a1a, #1a0510)",
                    border: `2px solid ${caught ? "#ffd94d" : "#e11d48"}`,
                    borderRadius: 8, padding: 8, textAlign: "center",
                    boxShadow: caught ? "0 0 10px #ffd94d55" : "0 0 8px #e11d4844",
                  }}>
                    <div style={{ fontSize: 9, color: "#ff6b8a", fontWeight: 800, letterSpacing: 1 }}>
                      Nº {String(i + 1).padStart(3, "0")}
                    </div>
                    {gifMap[sp] && <img src={gifMap[sp]} alt="" style={{ width: 56, height: 56, imageRendering: "pixelated" }} />}
                    <div style={{ fontSize: 11, marginTop: 2, color: "#fff", fontWeight: 700 }}>
                      {sp.replace(/_/g, " ").toUpperCase()}
                    </div>
                    <div style={{ fontSize: 9, marginTop: 4, color: caught ? "#ffd94d" : "#ff6b8a", fontWeight: 800 }}>
                      {caught ? "★ CAPTURADO" : "✓ VISTO"}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}



      {tab === "loja" && (
        <div style={{ maxHeight: 650, overflowY: "auto", paddingRight: 6 }}>
          <div style={{
            display: "flex", gap: 12, marginBottom: 16, padding: "10px 14px",
            background: "linear-gradient(180deg, #1a0f26, #251638)",
            border: "1px solid rgba(245,207,107,0.25)", borderRadius: 8,
            alignItems: "center", justifyContent: "space-around", fontWeight: 800,
          }}>
            <span style={{ color: "#f4c430" }}>● Ouro: {fmtK(bank.gold)}</span>
            <span style={{ color: "#c084fc" }}>💎 Cristais: {Math.floor(bank.crystals)}</span>
          </div>

          {(() => {
            const bk = SHOP_BOOKS.find((x) => x.id === "orb_team")!;
            const owned = items[bk.id] ?? 0;
            const canBuy = bank.crystals >= bk.price;
            const activeUntil = buffs.teamOrbUntil ?? 0;
            const isActive = activeUntil > Date.now();
            const color = ITEM_COLORS[bk.id] ?? "#ff97e1";
            return (
              <div style={{ marginBottom: 20 }}>
                <h3 style={{ color: "#ff97e1", fontSize: 15, margin: "6px 0 10px" }}>✦ Destaque da Loja — Orb de Time</h3>
                <div style={{
                  display: "grid", gridTemplateColumns: "minmax(92px, 120px) 1fr minmax(180px, 220px)", gap: 14,
                  alignItems: "center", padding: 16,
                  background: "linear-gradient(135deg, rgba(255,151,225,0.18), rgba(26,15,38,0.96) 42%, rgba(40,20,58,0.96))",
                  border: `2px solid ${color}`,
                  borderRadius: 14,
                  boxShadow: `0 0 22px ${color}44, inset 0 1px 0 rgba(255,255,255,0.14)`,
                }}>
                  <div style={{
                    width: 92, height: 92, borderRadius: 18,
                    background: `radial-gradient(circle at 35% 25%, ${color}66, rgba(11,5,16,0.8) 72%)`,
                    border: `1px solid ${color}99`, display: "flex", alignItems: "center", justifyContent: "center",
                    boxShadow: `0 0 18px ${color}55, inset 0 0 18px rgba(255,255,255,0.08)`,
                  }}>
                    <img src={bk.img} alt="Orb de Time" width={72} height={72} style={{ filter: `drop-shadow(0 0 10px ${color})` }} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ color: "#fff0fb", fontSize: 18, fontWeight: 900, letterSpacing: 1 }}>{bk.name}</div>
                    <div style={{ color: "#eac6df", fontSize: 12, lineHeight: 1.45, marginTop: 4 }}>{bk.desc}</div>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
                      <span style={{ color: "#c084fc", fontSize: 12, fontWeight: 900 }}>💎 {bk.price} cristais</span>
                      <span style={{ color: "#8a7a9c", fontSize: 12 }}>Você tem: {owned}</span>
                      {isActive && <span style={{ color: "#7ef2a2", fontSize: 12, fontWeight: 900 }}>ATIVO</span>}
                    </div>
                  </div>
                  <button
                    onClick={() => onBuyBook(bk)}
                    disabled={!canBuy}
                    style={{
                      width: "100%", padding: "11px 12px", fontWeight: 900, letterSpacing: 1,
                      background: canBuy ? `linear-gradient(180deg, ${color}, #c84aa4)` : "#3a2a4a",
                      color: canBuy ? "#120713" : "#6a5a7c",
                      border: canBuy ? "1px solid #ffd9f5" : "1px solid #4a3a5a",
                      borderRadius: 8,
                      cursor: canBuy ? "pointer" : "not-allowed",
                      boxShadow: canBuy ? `0 0 12px ${color}55` : "none",
                    }}
                  >{canBuy ? "COMPRAR ORB" : "SEM CRISTAIS"}</button>
                </div>
              </div>
            );
          })()}

          <h3 style={{ color: "#6bd4ff", fontSize: 15, margin: "6px 0 10px" }}>Poções — pagas em ouro</h3>
          <div style={{
            background: "rgba(0,0,0,0.3)",
            border: "1px solid rgba(245, 207, 107, 0.2)", borderRadius: 12, padding: 14, marginBottom: 20,
            display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap",
            boxShadow: "0 4px 14px rgba(0,0,0,0.4)",
          }}>

            <div style={{ fontSize: 40 }}>🧪</div>
            <div style={{ flex: 1, minWidth: 160 }}>
              <div style={{ fontWeight: 800, color: "#eadfe8" }}>Poção</div>
              <div style={{ fontSize: 11, color: "#b8a8c8" }}>Recupera {Math.round(POTION_HEAL_PCT * 100)}% do HP. Usada no auto quando ativado.</div>
              <div style={{ fontSize: 12, color: "#f4c430", fontWeight: 700 }}>● {POTION_PRICE} ouro cada</div>
              <div style={{ fontSize: 11, color: "#8a7a9c" }}>Você tem: {items.potion ?? 0}</div>
            </div>
            <div style={{ minWidth: 220 }}>
              <QtyBuy
                presets={[1, 10, 50, 100]}
                max={9999}
                unitLabel="poção"
                buttonColor="#6bd4ff"
                canBuyFn={(n) => bank.gold >= POTION_PRICE * n}
                onBuy={(n) => onBuyPotion(n)}
                disabledLabel="SEM OURO"
              />
            </div>
          </div>


          <h3 style={{ color: "#f5cf6b", fontSize: 15, margin: "6px 0 10px" }}>Pokébolas — pagas em ouro</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12, marginBottom: 20 }}>
            {SHOP_BALLS.map((b) => {
              const owned = items[b.id] ?? 0;
              const canBuy = bank.gold >= b.price;
              const color = ITEM_COLORS[b.id] ?? "#f5cf6b";
              return (
                <div key={b.id} style={{
                  background: "rgba(0,0,0,0.3)",
                  border: "1px solid rgba(245, 207, 107, 0.2)", borderRadius: 12, padding: 14,
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
                  boxShadow: "0 4px 14px rgba(0,0,0,0.4)",

                }}>
                  <img src={b.img} alt="" width={64} height={64}
                    style={{ imageRendering: "pixelated", filter: `drop-shadow(0 0 8px ${color}88)` }} />
                  <div style={{ fontWeight: 800, color: "#eadfe8", fontSize: 14 }}>{b.name}</div>
                  <div style={{ fontSize: 11, color: "#b8a8c8" }}>Chance de captura x{b.captureMult}</div>
                  <div style={{ fontSize: 12, color: "#f4c430", fontWeight: 700 }}>● {b.price} ouro</div>
                  <div style={{ fontSize: 11, color: "#8a7a9c" }}>Você tem: {owned}</div>
                  <QtyBuy
                    presets={[1, 10, 50, 100]}
                    max={9999}
                    unitLabel={b.name}
                    buttonColor={color}
                    canBuyFn={(n) => bank.gold >= b.price * n}
                    onBuy={(n) => onBuyBall(b, n)}
                    disabledLabel="SEM OURO"
                  />
                </div>
              );
            })}
          </div>

          <h3 style={{ color: "#c084fc", fontSize: 15, margin: "6px 0 10px" }}>Pacote de Ultra Ball — pago em cristais 💎</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12, marginBottom: 20 }}>
            {(() => {
              const COST = 2000, QTY = 20;
              const owned = items.ultraball ?? 0;
              const canBuy = bank.crystals >= COST;
              const color = "#c084fc";
              return (
                <div style={{
                  background: "linear-gradient(160deg, #1a0f26 0%, #251638 100%)",
                  border: `1px solid ${color}77`, borderRadius: 12, padding: 14,
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
                  boxShadow: `0 4px 14px rgba(0,0,0,0.4), inset 0 1px 0 ${color}22`,
                }}>
                  <img src={ballUltraImg} alt="" width={64} height={64}
                    style={{ imageRendering: "pixelated", filter: `drop-shadow(0 0 10px ${color}bb)` }} />
                  <div style={{ fontWeight: 800, color: "#eadfe8", fontSize: 14 }}>Pacote Ultra Ball ×{QTY}</div>
                  <div style={{ fontSize: 11, color: "#b8a8c8", textAlign: "center" }}>20 Ultra Ball — captura x3.5</div>
                  <div style={{ fontSize: 12, color, fontWeight: 700 }}>💎 {COST} cristais</div>
                  <div style={{ fontSize: 11, color: "#8a7a9c" }}>Você tem: {owned} Ultra Ball</div>
                  <QtyBuy
                    presets={[1, 5, 10, 25]}
                    max={999}
                    unitLabel="pacote"
                    buttonColor={color}
                    canBuyFn={(n) => bank.crystals >= 2000 * n}
                    onBuy={(n) => onBuyUltraBundle(n)}
                    disabledLabel="SEM CRISTAIS"
                  />
                </div>
              );
            })()}
            {(() => {
              const COST = 100;
              const owned = items.scroll_teleport ?? 0;
              const canBuy = bank.crystals >= COST;
              const color = "#8ec5ff";
              return (
                <div style={{
                  background: "rgba(0,0,0,0.3)",
                  border: "1px solid rgba(245, 207, 107, 0.2)", borderRadius: 12, padding: 14,
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
                  boxShadow: "0 4px 14px rgba(0,0,0,0.4)",

                }}>
                  <img src={scrollTeleportUrl} alt="" width={64} height={64}
                    style={{ filter: `drop-shadow(0 0 10px ${color}bb)` }} />
                  <div style={{ fontWeight: 800, color: "#eadfe8", fontSize: 14 }}>Pergaminho de Teleporte</div>
                  <div style={{ fontSize: 11, color: "#b8c8dc", textAlign: "center" }}>Teleporte instantâneo no Mapa Mundi — sem taxa de ouro, sem custo de cristais</div>
                  <div style={{ fontSize: 12, color, fontWeight: 700 }}>💎 {COST} cristais</div>
                  <div style={{ fontSize: 11, color: "#8aa0b8" }}>Você tem: {owned}</div>
                  <QtyBuy
                    presets={[1, 5, 10, 25]}
                    max={999}
                    unitLabel="pergaminho"
                    buttonColor={color}
                    canBuyFn={(n) => bank.crystals >= 100 * n}
                    onBuy={(n) => onBuyTeleportScroll(n)}
                    disabledLabel="SEM CRISTAIS"
                  />
                </div>
              );
            })()}
          </div>



          <h3 style={{ color: "#ff97e1", fontSize: 15, margin: "6px 0 10px" }}>🥚 Ovos — chocam Pokémon com raridade aleatória</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12, marginBottom: 20 }}>
            {shopEggs.map((e) => {
              const owned = items[e.id] ?? 0;
              const canBuy = e.currency === "gold" ? bank.gold >= e.price : bank.crystals >= e.price;
              return (
                <div key={e.id} style={{
                  background: "linear-gradient(160deg, #1a0f26 0%, #251638 100%)",
                  border: `1px solid ${e.color}77`, borderRadius: 12, padding: 14,
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
                  boxShadow: `0 4px 14px rgba(0,0,0,0.4), inset 0 1px 0 ${e.color}22`,
                }}>
                  <div style={{
                    width: 72, height: 82, borderRadius: "45% / 55%",
                    background: `radial-gradient(circle at 30% 25%, #fff8, ${e.color} 55%, ${e.color}66 100%)`,
                    border: `2px solid ${e.color}`,
                    boxShadow: `0 0 14px ${e.color}88, inset 0 -6px 12px rgba(0,0,0,0.3)`,
                    position: "relative",
                  }}>
                    <div style={{
                      position: "absolute", top: 20, left: 12, right: 12, height: 3,
                      background: `${e.color}dd`, opacity: 0.6, borderRadius: 2, transform: "rotate(-8deg)",
                    }} />
                    <div style={{
                      position: "absolute", top: 40, left: 8, right: 14, height: 3,
                      background: `${e.color}dd`, opacity: 0.5, borderRadius: 2, transform: "rotate(6deg)",
                    }} />
                  </div>
                  <div style={{ fontWeight: 800, color: "#eadfe8", fontSize: 14 }}>{e.name}</div>
                  <div style={{ fontSize: 11, color: "#b8a8c8", textAlign: "center", minHeight: 30 }}>{e.desc}</div>
                  <div style={{ fontSize: 12, color: e.currency === "gold" ? "#f4c430" : "#c084fc", fontWeight: 700 }}>
                    {e.currency === "gold" ? "●" : "💎"} {e.price} {e.currency === "gold" ? "ouro" : "cristais"}
                  </div>
                  <div style={{ fontSize: 11, color: "#8a7a9c" }}>Você tem: {owned}</div>
                  <button
                    onClick={() => onBuyEgg(e)}
                    disabled={!canBuy}
                    style={{
                      width: "100%", padding: "8px 10px", fontWeight: 800,
                      background: canBuy ? e.color : "#3a2a4a",
                      color: canBuy ? "#0b0510" : "#6a5a7c",
                      border: "none", borderRadius: 6,
                      cursor: canBuy ? "pointer" : "not-allowed",
                    }}
                  >{canBuy ? "COMPRAR" : "SEM RECURSOS"}</button>
                </div>
              );
            })}
          </div>

          <h3 style={{ color: "#c084fc", fontSize: 15, margin: "6px 0 10px" }}>Livros de Habilidade — pagos em cristais 💎</h3>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 }}>
            {SHOP_BOOKS.map((bk) => {
              const owned = items[bk.id] ?? 0;
              const useGold = bk.currency === "gold";
              const canBuy = useGold ? bank.gold >= bk.price : bank.crystals >= bk.price;
              const color = ITEM_COLORS[bk.id] ?? "#c084fc";
              return (
                <div key={bk.id} style={{
                  background: "rgba(0,0,0,0.3)",
                  border: "1px solid rgba(245, 207, 107, 0.2)", borderRadius: 12, padding: 14,
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
                  boxShadow: "0 4px 14px rgba(0,0,0,0.4)",

                }}>
                  <img src={bk.img} alt="" width={64} height={64}
                    style={{ imageRendering: "pixelated", filter: `drop-shadow(0 0 8px ${color}88)` }} />
                  <div style={{ fontWeight: 800, color: "#eadfe8", fontSize: 13 }}>{bk.name}</div>
                  <div style={{ fontSize: 11, color: "#b8a8c8", textAlign: "center" }}>{bk.desc}</div>
                  <div style={{ fontSize: 12, color: useGold ? "#ffd94d" : "#c084fc", fontWeight: 700 }}>{useGold ? "🪙" : "💎"} {bk.price}</div>
                  <div style={{ fontSize: 11, color: "#8a7a9c" }}>Você tem: {owned}</div>
                  <QtyBuy
                    presets={[1, 10, 50, 100]}
                    max={9999}
                    unitLabel={bk.name}
                    buttonColor={color}
                    canBuyFn={(n) => (useGold ? bank.gold >= bk.price * n : bank.crystals >= bk.price * n) && (!bk.priceGold || bank.gold >= bk.priceGold * n)}
                    onBuy={(n) => onBuyBook(bk, n)}
                    disabledLabel={useGold ? "SEM OURO" : "SEM CRISTAL"}
                  />

                </div>
              );
            })}
          </div>

          {/* ═══ Trocador NPC — Orbs de XP por Pokémon capturados ═══ */}
          <h3 style={{ color: "#ffd94d", fontSize: 15, margin: "22px 0 6px" }}>
            🧙 Trocador NPC — Orbs de XP
          </h3>
          <div style={{ color: "#b8a8c8", fontSize: 11, marginBottom: 10, lineHeight: 1.5 }}>
            O NPC aceita Pokémon da sua <b>Coleção</b> (não da equipe) em troca de Orbs mais fortes.
            <b style={{ color: "#ffd94d" }}> Você escolhe</b> quais Pokémon entregar.
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12 }}>
            {orbTrades.map((t) => {
              const available = collection.filter((c) =>
                (c.rarity === t.rarity || (t.rarity === "mythic" && c.rarity === "mythic_shiny"))
                && !teamUidSet.has(c.uid)
                && !benchUids.has(c.uid)
                && !lockedSet.has(c.uid),
              ).length;
              const reqOk = !t.requires || (items[t.requires.itemId] ?? 0) >= t.requires.qty;
              const reqOwned = t.requires ? (items[t.requires.itemId] ?? 0) : 0;
              const canTrade = available >= t.count && reqOk;
              const owned = items[t.orbId] ?? 0;
              return (
                <div key={`${t.orbId}-${t.rarity}`} style={{
                  background: "rgba(0,0,0,0.3)",
                  border: "1px solid rgba(245, 207, 107, 0.2)", borderRadius: 12, padding: 14,
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
                  boxShadow: "0 4px 14px rgba(0,0,0,0.4)",

                }}>
                  <img src={t.img} alt="" width={64} height={64}
                    style={{ imageRendering: "pixelated", filter: `drop-shadow(0 0 10px ${t.color}aa)` }} />
                  <div style={{ fontWeight: 800, color: "#eadfe8", fontSize: 13 }}>{t.label}</div>
                  <div style={{ fontSize: 11, color: "#b8a8c8", textAlign: "center" }}>{t.desc}</div>
                  <div style={{ fontSize: 11, color: canTrade ? "#8ae28a" : "#e28a8a" }}>
                    Coleção {t.rarity.toUpperCase()}: {available} (precisa {t.count})
                  </div>
                  {t.requires && (
                    <div style={{ fontSize: 10, fontWeight: 800, color: reqOk ? "#8ae28a" : "#ff9a6b", background: reqOk ? "#0f2018" : "#2a1620", border: `1px solid ${reqOk ? "#8ae28a55" : "#ff9a6b55"}`, borderRadius: 6, padding: "3px 8px", textAlign: "center" }}>
                      {reqOk ? "✓" : "🔒"} Requer {t.requires.qty}× {t.requires.label} ({reqOwned}/{t.requires.qty})
                    </div>
                  )}
                  <div style={{ fontSize: 11, color: "#8a7a9c" }}>Você tem: {owned}</div>
                  <button
                    disabled={!canTrade}
                    onClick={() => {
                      setOrbPicker({ orbId: t.orbId, rarity: t.rarity, count: t.count, color: t.color, label: t.label });
                      setOrbPickerSel(new Set());
                    }}
                    style={{
                      width: "100%", padding: "8px 10px", fontWeight: 800,
                      background: canTrade ? t.color : "#3a2a4a",
                      color: canTrade ? "#0b0510" : "#6a5a7c",
                      border: "none", borderRadius: 6,
                      cursor: canTrade ? "pointer" : "not-allowed",
                    }}
                  >{!reqOk ? `FORJE 1 ${t.requires!.label.toUpperCase()} PRIMEIRO` : canTrade ? "ESCOLHER POKÉMON" : `PRECISA DE ${t.count} ${t.rarity.toUpperCase()}`}</button>
                </div>
              );
            })}
          </div>

          {orbPicker && (() => {
            // Exclui Pokémon do time e travados — evita "não consome / orb infinito"
            // quando o jogador tenta trocar um Pokémon que está em uso.
            const eligible = collection.filter((c) =>
              (c.rarity === orbPicker.rarity || (orbPicker.rarity === "mythic" && c.rarity === "mythic_shiny")) && !teamUidSet.has(c.uid) && !benchUids.has(c.uid) && !lockedSet.has(c.uid),
            );
            const selCount = orbPickerSel.size;
            const canConfirm = selCount === orbPicker.count;
            return (
              <div
                onClick={() => setOrbPicker(null)}
                style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.78)", zIndex: 10000, display: "grid", placeItems: "center", padding: 16 }}
              >
                <div
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    width: "min(560px, 100%)", maxHeight: "88vh", overflowY: "auto",
                    background: "linear-gradient(180deg,#1c0f2e,#0b0510)",
                    border: `2px solid ${orbPicker.color}`, borderRadius: 14, padding: 16,
                    boxShadow: `0 10px 30px rgba(0,0,0,0.7), 0 0 20px ${orbPicker.color}55`,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <div style={{ fontWeight: 900, color: orbPicker.color, fontSize: 15 }}>
                      🧙 Escolha {orbPicker.count} Pokémon {orbPicker.rarity.toUpperCase()}
                    </div>
                    <button onClick={() => setOrbPicker(null)} style={{ background: "transparent", border: "none", color: "#eadfe8", cursor: "pointer", fontSize: 18 }}>✕</button>
                  </div>
                  <div style={{ fontSize: 11, color: "#b8a8c8", marginBottom: 10 }}>
                    Selecionados: <b style={{ color: canConfirm ? "#8ae28a" : "#ffd94d" }}>{selCount}/{orbPicker.count}</b> — Recompensa: <b>{orbPicker.label}</b>
                  </div>
                  {eligible.length === 0 ? (
                    <div style={{ color: "#e28a8a", fontSize: 12, padding: 20, textAlign: "center" }}>
                      Você não tem Pokémon {orbPicker.rarity.toUpperCase()} na coleção.
                    </div>
                  ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(96px, 1fr))", gap: 8 }}>
                      {eligible.map((c) => {
                        const sel = orbPickerSel.has(c.uid);
                        const disabled = !sel && selCount >= orbPicker.count;
                        return (
                          <button
                            key={c.uid}
                            disabled={disabled}
                            onClick={() => {
                              setOrbPickerSel((prev) => {
                                const next = new Set(prev);
                                if (next.has(c.uid)) next.delete(c.uid); else next.add(c.uid);
                                return next;
                              });
                            }}
                            style={{
                              background: sel ? `linear-gradient(160deg, ${orbPicker.color}55, ${orbPicker.color}22)` : "#1a0f26",
                              border: sel ? `2px solid ${orbPicker.color}` : "2px solid #3a2a4a",
                              borderRadius: 10, padding: 6, cursor: disabled ? "not-allowed" : "pointer",
                              display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
                              opacity: disabled ? 0.4 : 1, position: "relative",
                            }}
                          >
                            {gifMap[c.species] ? (
                              <img src={gifMap[c.species]} alt="" style={{ width: 54, height: 54, imageRendering: "pixelated" }} />
                            ) : (
                              <div style={{ width: 54, height: 54, background: "#2a1638", borderRadius: 8 }} />
                            )}
                            <div style={{ fontSize: 10, color: "#eadfe8", fontWeight: 700, textTransform: "capitalize" }}>{c.species.replace(/_/g, " ")}</div>
                            <div style={{ fontSize: 10, color: "#ffd94d" }}>Lv.{c.level}</div>
                            {sel && (
                              <div style={{
                                position: "absolute", top: 2, right: 2, background: orbPicker.color, color: "#0b0510",
                                width: 18, height: 18, borderRadius: 999, fontSize: 11, fontWeight: 900, display: "grid", placeItems: "center",
                              }}>✓</div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                  <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                    <button
                      onClick={() => setOrbPicker(null)}
                      style={{ flex: 1, padding: "10px", background: "#3a2a4a", color: "#eadfe8", border: "none", borderRadius: 8, fontWeight: 800, cursor: "pointer" }}
                    >CANCELAR</button>
                    <button
                      disabled={!canConfirm}
                      onClick={(e) => {
                        const btn = e.currentTarget;
                        if (btn.dataset.busy === "1") return;
                        btn.dataset.busy = "1";
                        btn.disabled = true;
                        const uids = Array.from(orbPickerSel);
                        setOrbPicker(null);
                        setOrbPickerSel(new Set());
                        onTradeOrb(orbPicker.orbId, uids, [], orbPicker.rarity);
                      }}
                      style={{
                        flex: 2, padding: "10px", fontWeight: 900,
                        background: canConfirm ? orbPicker.color : "#3a2a4a",
                        color: canConfirm ? "#0b0510" : "#6a5a7c",
                        border: "none", borderRadius: 8, cursor: canConfirm ? "pointer" : "not-allowed",
                      }}
                    >CONFIRMAR TROCA</button>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Loja Cash removed due to missing constants in scope - applying translucent style to remaining elements */}




      {tab === "melhorias" && (() => {
        const nowMs = Date.now();
        const bookActive = !!(buffs?.expMultUntil && nowMs < buffs.expMultUntil);
        const orbActive = !!(buffs?.orbUntil && nowMs < buffs.orbUntil);
        const honeyActive = !!(buffs?.honeyUntil && nowMs < buffs.honeyUntil);
        const honeyRareActive = !!(buffs?.honeyRareUntil && nowMs < buffs.honeyRareUntil);
        const bookPct = bookActive ? Math.round((buffs?.expMult ?? 0) * 100) : 0;
        const orbPct = orbActive ? Math.round((buffs?.orbMult ?? 0) * 100) : 0;
        const honeyPct = honeyRareActive ? 20 : honeyActive ? 10 : 0;
        const totalExpPct = bookPct + orbPct + honeyPct;
        const fmtTime = (ms: number) => {
          const s = Math.max(0, Math.floor(ms / 1000));
          const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), r = s % 60;
          return h > 0 ? `${h}h ${m}m` : m > 0 ? `${m}m ${r}s` : `${r}s`;
        };
        return (
          <div>
            <h3 style={{ color: "#f5cf6b", fontSize: 15, marginBottom: 12 }}>Bônus ativos</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 16 }}>
              <BuffCell img={bookAtkImg} label="Ataque" value={`+${Math.round((buffs?.atk ?? 0) * 100)}%`} color="#ff5252" />
              <BuffCell img={bookDefImg} label="Defesa" value={`-${Math.round((buffs?.def ?? 0) * 100)}%`} color="#4a7bff" />
              <BuffCell img={bookExpImg} label="EXP TOTAL" value={`+${totalExpPct}%`} color="#5ec26a" />
            </div>
            {(bookActive || orbActive || honeyActive || honeyRareActive) && (
              <div style={{ background: "rgba(20,15,35,0.6)", border: "1px solid #3a2e58", borderRadius: 8, padding: 10, marginBottom: 14 }}>
                <div style={{ color: "#f5cf6b", fontSize: 12, fontWeight: 700, marginBottom: 6 }}>Composição EXP:</div>
                {bookActive && (
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#d0c0e0", padding: "3px 0" }}>
                    <span>📖 Livro EXP <span style={{ color: "#8a80a8" }}>({fmtTime(buffs!.expMultUntil! - nowMs)})</span></span>
                    <span style={{ color: "#5ec26a", fontWeight: 700 }}>+{bookPct}%</span>
                  </div>
                )}
                {orbActive && (
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#d0c0e0", padding: "3px 0" }}>
                    <span>✦ Orb EXP <span style={{ color: "#8a80a8" }}>({fmtTime(buffs!.orbUntil! - nowMs)})</span></span>
                    <span style={{ color: "#c084fc", fontWeight: 700 }}>+{orbPct}%</span>
                  </div>
                )}
                {honeyRareActive ? (
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#fff0c8", padding: "3px 0" }}>
                    <span>✨🍯 Incenso Raro <span style={{ color: "#a89060" }}>({fmtTime(buffs!.honeyRareUntil! - nowMs)})</span></span>
                    <span style={{ color: "#ffb84d", fontWeight: 700 }}>+20% drop/xp/def/vel</span>
                  </div>
                ) : honeyActive && (
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#ffe9a8", padding: "3px 0" }}>
                    <span>🍯 Incenso de Mel <span style={{ color: "#a89060" }}>({fmtTime(buffs!.honeyUntil! - nowMs)})</span></span>
                    <span style={{ color: "#ffb84d", fontWeight: 700 }}>+10% drop/xp/def/vel</span>
                  </div>
                )}
                <div style={{ borderTop: "1px solid #3a2e58", marginTop: 6, paddingTop: 6, display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: 700 }}>
                  <span style={{ color: "#f5cf6b" }}>Total EXP</span>
                  <span style={{ color: "#ffd94d" }}>+{totalExpPct}%</span>
                </div>
              </div>
            )}
            <div style={{ color: "#b8a8c8", fontSize: 12, lineHeight: 1.5 }}>
              Livros, Orbs e Incenso de Mel <strong style={{ color: "#f5cf6b" }}>somam</strong> enquanto ativos. Quando cada tempo acaba, o bônus daquela fonte sai.
            </div>
          </div>
        );
      })()}


      {tab === "wiki" && (() => {
        const Sec = ({ title, color, children }: { title: string; color: string; children: React.ReactNode }) => (
          <div style={{ background: "linear-gradient(160deg, rgba(255,255,255,0.05), rgba(0,0,0,0.35))", border: `1px solid ${color}55`, borderRadius: 12, padding: 12, marginBottom: 10 }}>
            <div style={{ color, fontWeight: 900, fontSize: 12.5, letterSpacing: 1.2, marginBottom: 7, fontFamily: "'Cinzel', Georgia, serif" }}>{title}</div>
            <div style={{ fontSize: 11, color: "#e6dcf0", lineHeight: 1.75 }}>{children}</div>
          </div>
        );
        return (
          <div style={{ padding: 12, overflowY: "auto" }}>
            <div style={{ textAlign: "center", marginBottom: 12 }}>
              <div style={{ fontSize: 16, fontWeight: 900, color: "#f5cf6b", letterSpacing: 2, fontFamily: "'Cinzel', Georgia, serif" }}>📖 WIKI — 3ª SEASON</div>
              <div style={{ fontSize: 10.5, color: "#a898b8" }}>Tudo que você precisa saber antes do reset</div>
            </div>

            <Sec title="♻ O QUE SERÁ RESETADO" color="#ff8b8b">
              • Nível do treinador e XP<br />
              • Nível dos pokémons do time e da coleção<br />
              • Ouro, Cristais e progresso de mapas / quests<br />
              • Rankings globais (Treinador e Cristal Prisma)
            </Sec>

            <Sec title="🛡 O QUE SERÁ PRESERVADO" color="#7ee88a">
              • Todo pokémon guardado no <b>Banco Medieval</b> (Cofre Eterno)<br />
              • Taxa: {POKE_VAULT_FEE_SHARDS.toLocaleString("pt-BR")} 🔻 por pokémon · <b>Black Mitic Plus é grátis</b><br />
              • Vagas do cofre: {POKE_VAULT_SLOTS} pokémons
            </Sec>

            <Sec title="✨ NOVOS SISTEMAS" color="#c084fc">
              • <b>PvP</b> — duelos entre treinadores<br />
              • <b>Party</b> — grupos de até 5 jogadores com XP compartilhado<br />
              • <b>Mercado dolarizado</b> — negociação com moeda global<br />
              • <b>Ginásio Medieval</b> — portal para o Vale dos Fragmentos Vermelhos
            </Sec>

            <Sec title="🔻 VALE DOS FRAGMENTOS VERMELHOS" color="#ff5c5c">
              • Entrada pelo Ginásio Medieval: {GYM_ENTRY_SHARDS.toLocaleString("pt-BR")} 🔻<br />
              • Abre por <b>1 hora</b> e reabre <b>a cada 5 horas</b><br />
              • Cada pokémon derrotado ou capturado dropa <b>5 a 20 🔻</b>
            </Sec>

            <Sec title="⚙ MECÂNICAS EXISTENTES" color="#6bd4ff">
              • <b>Raridades:</b> Comum → Incomum → Raro → Épico → Lendário → Mítico → Mítico Shiny → Black Mitic Plus<br />
              • <b>Eggs:</b> incubação, afinidade e alimentação com Stones elementais<br />
              • <b>AFK / Idle:</b> auto-batalha, auto-potion e coleta acumulada<br />
              • <b>Sinergias:</b> bônus elementais por composição do time
            </Sec>

            <Sec title="📊 TAXAS OFICIAIS" color="#ffd66b">
              • Captura (Poké/Great/Ultra): Comum 55/75/90% · Raro 18/35/55% · Épico 8/18/35% · Lendário 3/8/18%<br />
              • Mítico: 0.2/0.8/2.8% · Mítico Shiny: 0.1/0.3/1.8% · Master Ball: 100%<br />
              • Fragmento Vermelho: 1 a 5 por abate (5 a 20 no Vale)<br />
              • Teto de acumulação na coleta: {RED_SHARD_PENDING_CAP.toLocaleString("pt-BR")} 🔻
            </Sec>

            <Sec title="🔒 PRIVACIDADE" color="#a898b8">
              O botão <b>🔒 Ocultar IP</b> esconde seu endereço da tela (ideal para prints e streams).
              O registro continua salvo internamente apenas para segurança e anti-cheat.
            </Sec>
          </div>
        );
      })()}

      {tab === "inicio" && (
        <div style={{ color: "#c8b8d0", fontSize: 13, lineHeight: 1.6 }}>
          <p style={{ marginTop: 0 }}>Bem-vindo ao <strong style={{ color: "#f5cf6b" }}>Modo Idle</strong>!</p>
          <ul style={{ paddingLeft: 20 }}>
            <li>Seus Pokémon batalham automaticamente.</li>
            <li>Ache <strong>baús</strong> pelo mapa — dão ouro extra.</li>
            <li>Compre <strong>Pokébolas</strong> na Loja para capturar Pokémon.</li>
            <li>Use <strong>Livros</strong> pra ficar mais forte.</li>
            <li>Novos Pokémon aparecem conforme seu nível sobe.</li>
          </ul>

          <h3 style={{ color: "#f5cf6b", fontSize: 14, margin: "18px 0 10px" }}>
            Escolher Skin <span style={{ fontSize: 11, color: "#b9a7ff" }}>· 🎟️ Tickets: {skinTickets}</span>
          </h3>
          <div style={{ fontSize: 11, color: "#b9a7ff", marginBottom: 8 }}>
            Skins premium ficam bloqueadas. Abra a <strong>Caixa Premium ✦</strong> na Mochila para ganhar Tickets e desbloquear a skin que quiser.
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: 10 }}>
            {SKINS.map((s) => {
              const active = s.id === skinId;
              const unlocked = unlockedSkins.includes(s.id);
              const canUnlock = !unlocked && skinTickets > 0;
              return (
                <button
                  key={s.id}
                  onClick={() => {
                    if (unlocked) { setSkinId(s.id); return; }
                    if (canUnlock) {
                      if (window.confirm(`Desbloquear a skin "${s.label}" usando 1 Ticket de Skin ✦?`)) {
                        onUnlockSkin(s.id);
                      }
                    }
                  }}
                  disabled={!unlocked && !canUnlock}
                  style={{
                    position: "relative",
                    background: active ? "linear-gradient(160deg,#3a1f5c,#6b3fb0)" : unlocked ? "#1a0f26" : "#120a1c",
                    border: `2px solid ${active ? "#f5cf6b" : unlocked ? "rgba(107,212,255,0.35)" : "rgba(255,255,255,0.08)"}`,
                    borderRadius: 10, padding: 10,
                    cursor: unlocked ? "pointer" : canUnlock ? "pointer" : "not-allowed",
                    display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
                    color: unlocked ? "#eadfe8" : "#7a6f8a", fontFamily: "inherit",
                    boxShadow: active ? "0 0 18px rgba(245,207,107,0.45)" : "none",
                    opacity: unlocked ? 1 : 0.85,
                  }}
                >
                  <div style={{
                    width: 72, height: 72, display: "grid", placeItems: "center",
                    background: "rgba(0,0,0,0.35)", borderRadius: 8,
                    imageRendering: "pixelated",
                    filter: unlocked ? "none" : "grayscale(1) brightness(0.55)",
                  }}>
                    {s.url ? (
                      <img src={s.url} alt={s.label} style={{ maxWidth: "100%", maxHeight: "100%", imageRendering: "pixelated" }} />
                    ) : (
                      <div style={{ fontSize: 32 }}>🧢</div>
                    )}
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 700, textAlign: "center" }}>{s.label}</div>
                  {active && <div style={{ fontSize: 9, color: "#f5cf6b" }}>✓ EM USO</div>}
                  {!unlocked && (
                    <div style={{ fontSize: 9, color: canUnlock ? "#f5cf6b" : "#8a7fa0", fontWeight: 700 }}>
                      {canUnlock ? "🎟️ USAR TICKET" : "🔒 BLOQUEADA"}
                    </div>
                  )}
                  {!unlocked && (
                    <div style={{ position: "absolute", top: 6, right: 6, fontSize: 14 }}>🔒</div>
                  )}
                </button>
              );
            })}
          </div>

        </div>
      )}

      {tab === "wallet" && (
        <WalletScreen bank={bank} onExchange={onExchange} />
      )}

      {tab === "market" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {pokemonMarketNode}
          <MarketScreen
            items={items}
            bank={bank}
            identity={identity}
            isVip={isVip}
            onList={onListMarket}
            onBuy={onBuyMarket}
            onCancel={onCancelMarket}
            onClaimPayout={onClaimMarketPayout}
            onNpcSell={onSellItem}
            npcPrices={marketSellPrices}
          />
        </div>
      )}



      {tab === "config" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 520 }}>
          <div style={{ color: "#c8b8d0", fontSize: 13, lineHeight: 1.5 }}>
            Ajuste os sons e a música do jogo. A música toca em loop de fundo enquanto você joga.
          </div>

          <div style={{
            background: "linear-gradient(160deg, #1a0f26, #251638)",
            border: "1px solid rgba(107,212,255,0.35)", borderRadius: 12, padding: 16,
            display: "flex", flexDirection: "column", gap: 14,
          }}>
            <label style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
              <input type="checkbox" checked={audioSettings.music}
                onChange={(e) => setAudioSettings((s) => ({ ...s, music: e.target.checked }))}
                style={{ width: 18, height: 18 }} />
              <span style={{ color: "#eadfe8", fontWeight: 700 }}>🎵 Música de fundo</span>
            </label>
            <div>
              <div style={{ fontSize: 11, color: "#b8a8c8", marginBottom: 4 }}>Volume da música: {Math.round(audioSettings.musicVol * 100)}%</div>
              <input type="range" min={0} max={1} step={0.05} value={audioSettings.musicVol}
                onChange={(e) => setAudioSettings((s) => ({ ...s, musicVol: Number(e.target.value) }))}
                style={{ width: "100%" }} />
            </div>
          </div>

          <div style={{
            background: "linear-gradient(160deg, #1a0f26, #251638)",
            border: "1px solid rgba(245,207,107,0.35)", borderRadius: 12, padding: 16,
            display: "flex", flexDirection: "column", gap: 14,
          }}>
            <label style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
              <input type="checkbox" checked={audioSettings.sfx}
                onChange={(e) => setAudioSettings((s) => ({ ...s, sfx: e.target.checked }))}
                style={{ width: 18, height: 18 }} />
              <span style={{ color: "#eadfe8", fontWeight: 700 }}>🔊 Efeitos sonoros (clique, level-up, capturas)</span>
            </label>
            <div>
              <div style={{ fontSize: 11, color: "#b8a8c8", marginBottom: 4 }}>Volume dos efeitos: {Math.round(audioSettings.sfxVol * 100)}%</div>
              <input type="range" min={0} max={1} step={0.05} value={audioSettings.sfxVol}
                onChange={(e) => setAudioSettings((s) => ({ ...s, sfxVol: Number(e.target.value) }))}
                style={{ width: "100%" }} />
            </div>
          </div>

          <div style={{
            background: "linear-gradient(160deg, #0f1f2e, #16324a)",
            border: "1px solid rgba(107,212,255,0.4)", borderRadius: 12, padding: 16,
            display: "flex", flexDirection: "column", gap: 12,
          }}>
            <label style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
              <input type="checkbox" checked={autoHeal.enabled}
                onChange={(e) => setAutoHeal({ ...autoHeal, enabled: e.target.checked })}
                style={{ width: 18, height: 18 }} />
              <span style={{ color: "#eadfe8", fontWeight: 700 }}>🧪 Auto-Poção no modo Auto</span>
            </label>
            <div>
              <div style={{ fontSize: 11, color: "#b8a8c8", marginBottom: 4 }}>
                Usar poção quando HP &lt;= {Math.round(autoHeal.threshold * 100)}% (você tem {items.potion ?? 0} poção)
              </div>
              <input type="range" min={0.1} max={0.9} step={0.05} value={autoHeal.threshold}
                onChange={(e) => setAutoHeal({ ...autoHeal, threshold: Number(e.target.value) })}
                style={{ width: "100%" }} />
            </div>
            <div style={{ fontSize: 11, color: "#8a7a9c" }}>
              Cada poção custa {POTION_PRICE} ouro na Loja e recupera {Math.round(POTION_HEAL_PCT * 100)}% de HP.
            </div>
          </div>

          <div style={{ fontSize: 11, color: "#8a7a9c" }}>
            Se a música não iniciar automaticamente, clique em qualquer lugar da tela — os navegadores exigem uma interação antes de tocar áudio.
          </div>
        </div>
      )}

      {statsCardPet && (
        <PokemonStatsCard pet={statsCardPet} team={team} gifSrc={gifMap[statsCardPet.species]} onClose={() => setStatsCardPet(null)} />
      )}

      {fragConfirm && (() => {
        const rarityColor: Partial<Record<Rarity, string>> = {
          common: "#8b6a30", uncommon: "#5ec26a", rare: "#4a9eff",
          epic: "#c084fc", legendary: "#ff8b3d", mythic: "#ff5252", mythic_shiny: "#ffd94d",
        };
        const list = fragConfirm.entries;
        const isBulk = list.length > 1;
        return (
          <div
            onClick={() => setFragConfirm(null)}
            style={{ position: "fixed", inset: 0, zIndex: 10001, background: "rgba(0,0,0,0.78)", backdropFilter: "blur(6px)", display: "grid", placeItems: "center", padding: 16 }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                width: "min(560px, 100%)", maxHeight: "88vh", overflowY: "auto",
                background: "linear-gradient(160deg, #2a0f4a 0%, #1a0526 55%, #0b0510 100%)",
                border: "3px solid #a78bfa",
                borderRadius: 18,
                boxShadow: "0 20px 60px rgba(0,0,0,0.85), 0 0 40px rgba(167,139,250,0.55), inset 0 1px 0 rgba(255,255,255,0.1)",
                position: "relative", overflow: "hidden",
              }}
            >
              <div style={{
                position: "absolute", inset: 0, pointerEvents: "none",
                background: "radial-gradient(circle at 50% 10%, rgba(196,181,253,0.28), transparent 55%)",
              }} />
              <div style={{
                padding: "16px 18px", display: "flex", alignItems: "center", gap: 14,
                borderBottom: "2px solid rgba(167,139,250,0.35)", position: "relative",
              }}>
                <span style={{
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                  width: 56, height: 56, borderRadius: "50%",
                  background: "radial-gradient(circle at 40% 35%, rgba(255,255,255,0.5), rgba(196,181,253,0.15) 55%, transparent 75%)",
                  boxShadow: "0 0 18px rgba(233,213,255,0.9), inset 0 0 10px rgba(124,58,237,0.4)",
                }}>
                  <img src={assetUrlFromJson(iconFragmentCrystal)} alt="" width={44} height={44}
                    style={{ imageRendering: "pixelated", filter: "drop-shadow(0 0 6px rgba(233,213,255,0.9))" }} />
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 18, fontWeight: 900, color: "#f7ecf7", letterSpacing: 2, textShadow: "0 2px 0 #000" }}>
                    ⚒️ FRAGMENTAR {isBulk ? `${list.length} POKÉMON` : "POKÉMON"}
                  </div>
                  <div style={{ fontSize: 11, color: "#c8b8d0", marginTop: 2, fontStyle: "italic" }}>
                    Ação permanente — 1 🔷 Cristal Prisma por Pokémon.
                  </div>
                </div>
                <button onClick={() => setFragConfirm(null)} style={{
                  width: 32, height: 32, borderRadius: 8, border: "1px solid #6a5a7c",
                  background: "#2a1638", color: "#f7ecf7", fontSize: 16, fontWeight: 900, cursor: "pointer",
                }}>✕</button>
              </div>

              <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 10, position: "relative" }}>
                <div style={{
                  display: "grid",
                  gridTemplateColumns: isBulk ? "repeat(auto-fill, minmax(120px, 1fr))" : "1fr",
                  gap: 10, maxHeight: 320, overflowY: "auto", padding: 4,
                }}>
                  {list.map((e) => {
                    const rc = rarityColor[e.rarity] ?? "#8b6a30";
                    return (
                      <div key={e.uid} style={{
                        background: "linear-gradient(180deg, rgba(30,15,50,0.85), rgba(11,5,16,0.9))",
                        border: `2px solid ${rc}88`,
                        borderRadius: 12, padding: 10, textAlign: "center",
                        boxShadow: `inset 0 0 12px ${rc}33, 0 2px 8px rgba(0,0,0,0.4)`,
                      }}>
                        {gifMap[e.species] && (
                          <img src={gifMap[e.species]} alt="" style={{ width: 56, height: 56, imageRendering: "pixelated" }} />
                        )}
                        <div style={{ fontSize: 10, fontWeight: 900, color: "#f7ecf7", letterSpacing: 1, marginTop: 2 }}>
                          {e.species.replace(/_/g, " ").toUpperCase()}
                        </div>
                        <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 4, flexWrap: "wrap" }}>
                          <span style={{ fontSize: 8, padding: "2px 6px", borderRadius: 8, background: rc, color: "#0b0510", fontWeight: 900, letterSpacing: 1 }}>
                            {e.rarity.toUpperCase()}
                          </span>
                          <span style={{ fontSize: 9, color: "#f5cf6b", fontWeight: 900 }}>Lv {e.level}</span>
                        </div>
                        <div style={{
                          marginTop: 6, fontSize: 11, fontWeight: 900,
                          color: "#e9d5ff", letterSpacing: 0.5,
                          display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
                        }}>
                          <img src={assetUrlFromJson(iconFragmentCrystal)} alt="" width={16} height={16} style={{ imageRendering: "pixelated" }} />
                          +{e.gain}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div style={{
                  marginTop: 4, padding: "12px 14px", borderRadius: 12,
                  background: "linear-gradient(90deg, rgba(139,92,246,0.25), rgba(196,181,253,0.15), rgba(139,92,246,0.25))",
                  border: "1.5px solid #a78bfa88",
                  display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
                }}>
                  <div style={{ fontSize: 11, fontWeight: 900, color: "#c8b8d0", letterSpacing: 2 }}>GANHO TOTAL</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <img src={assetUrlFromJson(iconFragmentCrystal)} alt="" width={26} height={26}
                      style={{ imageRendering: "pixelated", filter: "drop-shadow(0 0 6px rgba(233,213,255,0.9))" }} />
                    <span style={{
                      fontSize: 26, fontWeight: 900, fontFamily: "monospace",
                      background: "linear-gradient(180deg, #f5d0fe, #a78bfa)",
                      WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                    }}>+{fragConfirm.totalGain}</span>
                    <span style={{ fontSize: 10, color: "#c8b8d0", fontWeight: 800, letterSpacing: 1 }}>CRISTAL PRISMA</span>
                  </div>
                </div>

                <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                  <button
                    onClick={() => setFragConfirm(null)}
                    style={{
                      flex: 1, padding: "12px 14px", fontSize: 12, fontWeight: 900, letterSpacing: 1,
                      background: "linear-gradient(180deg, #3a2450, #241634)", color: "#eadfe8",
                      border: "1px solid #5a3d78", borderRadius: 10, cursor: "pointer",
                    }}
                  >CANCELAR</button>
                  <button
                    onClick={confirmFrag}
                    style={{
                      flex: 1.4, padding: "12px 14px", fontSize: 13, fontWeight: 900, letterSpacing: 1,
                      background: "linear-gradient(180deg,#c4b5fd 0%,#8b5cf6 45%,#5b21b6 100%)",
                      color: "#fff",
                      border: "1px solid #3b0f7a", borderRadius: 10, cursor: "pointer",
                      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.35), 0 0 16px rgba(167,139,250,0.75)",
                      textShadow: "0 1px 2px rgba(0,0,0,0.5)",
                    }}
                  >⚒️ CONFIRMAR</button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
      </div>
    </div>
  );
}







function BuffCell({ img, label, value, color }: { img: string; label: string; value: string; color: string }) {
  return (
    <div style={{
      background: "#1a0f26", border: `1px solid ${color}55`, borderRadius: 10,
      padding: 12, textAlign: "center",
    }}>
      <img src={img} alt="" width={40} height={40} style={{ imageRendering: "pixelated" }} />
      <div style={{ fontSize: 12, color: "#c8b8d0", marginTop: 4 }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 800, color }}>{value}</div>
    </div>
  );
}

// ============ CARTEIRA (câmbio) ============
function WalletScreen({ bank, onExchange }: { bank: { gold: number; crystals: number }; onExchange: (dir: "g2c" | "c2g", amount: number) => void }) {
  const [buyAmt, setBuyAmt] = useState(1);
  const [sellAmt, setSellAmt] = useState(1);

  const buyCost = buyAmt * 1000;
  const sellGain = sellAmt * 800;
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, maxWidth: 780 }}>
      <div style={{
        gridColumn: "1 / -1",
        position: "relative",
        borderRadius: 14,
        overflow: "hidden",
        border: "2px solid #f5cf6b66",
        boxShadow: "0 8px 24px rgba(0,0,0,0.55), inset 0 0 40px rgba(0,0,0,0.4)",
        backgroundImage: `url(${walletHero})`,
        backgroundSize: "cover",
        backgroundPosition: "center 30%",
        minHeight: 190,
      }}>
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(180deg, rgba(11,5,16,0.15) 0%, rgba(11,5,16,0.55) 55%, rgba(11,5,16,0.95) 100%)",
        }} />
        <div style={{ position: "relative", padding: "16px 18px", height: "100%", display: "flex", flexDirection: "column", justifyContent: "flex-end", gap: 10 }}>
          <div>
            <div style={{ color: "#ffe58a", fontWeight: 900, fontSize: 20, letterSpacing: 2, textShadow: "2px 2px 0 #000, 0 0 12px #f5cf6b66" }}>✦ CASA DE CÂMBIO</div>
            <div style={{ color: "#dcc8e0", fontSize: 12, marginTop: 3, textShadow: "1px 1px 0 #000" }}>Converta ouro em cristais e vice-versa. Taxa: 1000 💰 ⇄ 1 💎 (compra) · 1 💎 → 800 💰 (venda).</div>
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <div style={{ background: "rgba(14,8,24,0.85)", backdropFilter: "blur(4px)", border: "1px solid #f5cf6b88", borderRadius: 8, padding: "6px 12px", color: "#f5cf6b", fontWeight: 800, boxShadow: "0 2px 8px rgba(0,0,0,0.5)" }}>💰 {bank.gold.toLocaleString()}</div>
            <div style={{ background: "rgba(14,8,24,0.85)", backdropFilter: "blur(4px)", border: "1px solid #8fd0ff88", borderRadius: 8, padding: "6px 12px", color: "#8fd0ff", fontWeight: 800, boxShadow: "0 2px 8px rgba(0,0,0,0.5)" }}>💎 {bank.crystals.toLocaleString()}</div>
          </div>
        </div>
      </div>
      <div style={{ background: "#1a0f26", border: "1px solid #8fd0ff55", borderRadius: 10, padding: 14 }}>
        <div style={{ color: "#8fd0ff", fontWeight: 800, marginBottom: 6 }}>Comprar 💎 com Ouro</div>
        <div style={{ color: "#c8b8d0", fontSize: 12, marginBottom: 10 }}>1 💎 = 1000 ouro</div>
        <input type="number" min={1} value={buyAmt} onChange={(e) => setBuyAmt(Math.max(1, parseInt(e.target.value) || 1))}
          style={{ width: "100%", background: "#0e0818", color: "#f3e5c5", border: "1px solid #8fd0ff55", borderRadius: 6, padding: 8, fontSize: 14 }} />
        <div style={{ fontSize: 12, color: "#c8b8d0", margin: "8px 0" }}>Custo: <b style={{ color: "#f5cf6b" }}>{buyCost.toLocaleString()} ouro</b></div>
        <button disabled={bank.gold < buyCost} onClick={() => onExchange("g2c", buyAmt)}
          style={{ width: "100%", background: bank.gold < buyCost ? "#333" : "linear-gradient(180deg,#4a9eff,#1e3a5f)", color: "#fff", border: "none", borderRadius: 8, padding: "10px 0", fontWeight: 800, cursor: bank.gold < buyCost ? "not-allowed" : "pointer" }}>
          Comprar {buyAmt} 💎
        </button>
      </div>
      <div style={{ background: "#1a0f26", border: "1px solid #f5cf6b55", borderRadius: 10, padding: 14 }}>
        <div style={{ color: "#f5cf6b", fontWeight: 800, marginBottom: 6 }}>Vender 💎 por Ouro</div>
        <div style={{ color: "#c8b8d0", fontSize: 12, marginBottom: 10 }}>1 💎 = 800 ouro (spread)</div>
        <input type="number" min={1} value={sellAmt} onChange={(e) => setSellAmt(Math.max(1, parseInt(e.target.value) || 1))}
          style={{ width: "100%", background: "#0e0818", color: "#f3e5c5", border: "1px solid #f5cf6b55", borderRadius: 6, padding: 8, fontSize: 14 }} />
        <div style={{ fontSize: 12, color: "#c8b8d0", margin: "8px 0" }}>Você recebe: <b style={{ color: "#f5cf6b" }}>{sellGain.toLocaleString()} ouro</b></div>
        <button disabled={bank.crystals < sellAmt} onClick={() => onExchange("c2g", sellAmt)}
          style={{ width: "100%", background: bank.crystals < sellAmt ? "#333" : "linear-gradient(180deg,#f5cf6b,#8b6a30)", color: "#0e0818", border: "none", borderRadius: 8, padding: "10px 0", fontWeight: 800, cursor: bank.crystals < sellAmt ? "not-allowed" : "pointer" }}>
          Vender {sellAmt} 💎
        </button>
      </div>
    </div>
  );
}

// ============ MERCADO P2P (jogador vs jogador) ============
type MarketListing = {
  id: string;
  seller_id: string;
  seller_name: string;
  item_id: string;
  qty: number;
  price: number;
  currency?: "gold" | "crystal" | "safira";
  created_at: string;
};
function MarketScreen({
  items, bank, identity, isVip, onList, onBuy, onCancel, onClaimPayout, onNpcSell, npcPrices,
}: {
  items: Record<string, number>;
  bank: { gold: number; crystals: number };
  identity: LocalIdentity | null;
  isVip: boolean;
  onList: (itemId: string, qty: number, price: number, currency?: "gold" | "crystal" | "safira") => Promise<boolean>;
  onBuy: (l: { id: string; seller_id: string; item_id: string; qty: number; price: number; currency?: "gold" | "crystal" | "safira" }) => Promise<boolean>;
  onCancel: (l: { id: string; item_id: string; qty: number; seller_id: string }) => Promise<boolean>;
  onClaimPayout: (l: { id: string; item_id: string; qty: number; price: number; currency?: "gold" | "crystal" | "safira" }) => Promise<boolean>;
  onNpcSell: (id: string, qty?: number) => void;
  npcPrices: Record<string, number>;
}) {
  const LABELS: Record<string, string> = {
    pokeball: "Pokébola", greatball: "Great Ball", ultraball: "Ultra Ball",
    chest_amulet: "Amuleto do Baú",
    potion: "Poção",
    stone_grass: "Stone Verdejante 🌿", stone_fire: "Stone Ígnea 🔥",
    stone_water: "Stone Aquática 💧", stone_electric: "Stone Elétrica ⚡",
    stone_dark: "Stone Sombria 🌑", stone_dragon: "Stone Dragão 🐉",
  };
  const ICONS: Record<string, string> = {
    pokeball: "⚪", greatball: "🔴", ultraball: "🟡",
    chest_amulet: "🎗", potion: "🧪",
    stone_grass: "🌿", stone_fire: "🔥", stone_water: "💧",
    stone_electric: "⚡", stone_dark: "🌑", stone_dragon: "🐉",
  };
  const CUR_LABEL: Record<string, string> = { gold: "ouro", crystal: "💎 cristais", safira: "💚 safiras" };
  const CUR_COLOR: Record<string, string> = { gold: "#ff9d3d", crystal: "#6bd4ff", safira: "#7dffbe" };
  const [listings, setListings] = useState<MarketListing[]>([]);
  const [soldPayouts, setSoldPayouts] = useState<MarketListing[]>([]);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"browse" | "create" | "npc">("browse");
  const [selItem, setSelItem] = useState<string>("pokeball");
  const [selQty, setSelQty] = useState<number>(1);
  const [selPrice, setSelPrice] = useState<number>(500);
  const [selCurrency, setSelCurrency] = useState<"gold" | "crystal" | "safira">("gold");

  const refresh = async () => {
    setLoading(true);
    const [openRes, soldRes] = await Promise.all([
      supabase
        .from("market_listings")
        .select("id, seller_id, seller_name, item_id, qty, price, currency, created_at, sold_at")
        .is("sold_at", null)
        .order("created_at", { ascending: false })
        .limit(100),
      identity?.id
        ? (supabase as any)
            .from("market_listings")
            .select("id, seller_id, seller_name, item_id, qty, price, currency, created_at, sold_at, payout_claimed")
            .eq("seller_id", identity.id)
            .eq("payout_claimed", false)
            .not("sold_at", "is", null)
            .order("sold_at", { ascending: false })
            .limit(50)
        : Promise.resolve({ data: [], error: null } as any),
    ]);
    setLoading(false);
    if (!openRes.error && openRes.data) setListings(openRes.data as unknown as MarketListing[]);
    if (!soldRes.error && soldRes.data) setSoldPayouts(soldRes.data as unknown as MarketListing[]);
  };
  useEffect(() => { void refresh(); /* eslint-disable-next-line */ }, []);

  const mine = listings.filter((l) => l.seller_id === (identity?.id ?? ""));
  const others = listings.filter((l) => l.seller_id !== (identity?.id ?? ""));


  return (
    <div style={{ maxWidth: 900 }}>
      <div style={{ background: "linear-gradient(180deg,#3d2b0f,#241503)", border: "2px solid #ff9d3d66", borderRadius: 12, padding: 16, marginBottom: 14, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ color: "#ff9d3d", fontWeight: 900, fontSize: 18, letterSpacing: 2 }}>🏷 MERCADO ENTRE TREINADORES</div>
          <div style={{ color: "#c8a878", fontSize: 12, marginTop: 4, fontStyle: "italic" }}>
            Compre e venda itens de outros jogadores. Anunciar é exclusivo <b style={{ color: "#ffd94d" }}>VIP ✦</b>.
          </div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <div style={{ background: "#0e0818", border: "1px solid #f5cf6b55", borderRadius: 8, padding: "6px 12px", color: "#f5cf6b", fontWeight: 800 }}>💰 {bank.gold.toLocaleString()}</div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
        {(["browse", "create", "npc"] as const).map((m) => (
          <button key={m} onClick={() => setMode(m)} style={{
            padding: "6px 12px", borderRadius: 8, fontSize: 12, fontWeight: 800,
            border: mode === m ? "1px solid #ff9d3d" : "1px solid #3a2a4a",
            background: mode === m ? "#3d2b0f" : "transparent",
            color: mode === m ? "#ff9d3d" : "#c8b8d0", cursor: "pointer",
          }}>
            {m === "browse" ? "Anúncios" : m === "create" ? "Anunciar (VIP)" : "Vender NPC"}
          </button>
        ))}
        <button onClick={() => void refresh()} disabled={loading} style={{ marginLeft: "auto", padding: "6px 12px", borderRadius: 8, fontSize: 12, fontWeight: 800, border: "1px solid #3a2a4a", background: "transparent", color: "#c8b8d0", cursor: loading ? "wait" : "pointer" }}>
          {loading ? "…" : "↻ Atualizar"}
        </button>
      </div>

      {mode === "browse" && (
        <>
          {soldPayouts.length > 0 && (
            <>
              <div style={{ color: "#ffd94d", fontSize: 12, fontWeight: 800, margin: "6px 2px" }}>💰 VENDAS CONCLUÍDAS — COLETAR PAGAMENTO</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 10, marginBottom: 16 }}>
                {soldPayouts.map((l) => {
                  const cur = l.currency ?? "gold";
                  return (
                    <div key={l.id} style={{ background: "linear-gradient(180deg,#2a1f08,#150e02)", border: "1px solid #ffd94d88", borderRadius: 10, padding: 12 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        {STONE_CHEST[l.item_id] ? (
                          <img src={STONE_CHEST[l.item_id]} alt="" width={44} height={44} />
                        ) : (
                          <div style={{ fontSize: 22 }}>{ICONS[l.item_id] ?? "📦"}</div>
                        )}
                        <div>
                          <div style={{ color: "#ffd94d", fontWeight: 800, fontSize: 13 }}>Vendido: {l.qty}x {LABELS[l.item_id] ?? l.item_id}</div>
                          <div style={{ color: "#c8a878", fontSize: 11 }}>Receber <b style={{ color: CUR_COLOR[cur] }}>{l.price.toLocaleString()} {CUR_LABEL[cur]}</b></div>
                        </div>
                      </div>
                      <button onClick={() => void onClaimPayout({ id: l.id, item_id: l.item_id, qty: l.qty, price: l.price, currency: l.currency }).then((ok) => { if (ok) { setSoldPayouts((prev) => prev.filter((x) => x.id !== l.id)); } })}
                        style={{ width: "100%", marginTop: 8, background: "linear-gradient(180deg,#ffd94d,#8b6a10)", color: "#0e0818", border: "none", borderRadius: 6, padding: "8px 0", fontWeight: 800, cursor: "pointer", fontSize: 12 }}>
                        Coletar {l.price.toLocaleString()} {CUR_LABEL[cur]}
                      </button>
                    </div>
                  );
                })}
              </div>
            </>
          )}
          {mine.length > 0 && (
            <>

              <div style={{ color: "#8fd0ff", fontSize: 12, fontWeight: 800, margin: "6px 2px" }}>MEUS ANÚNCIOS</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 10, marginBottom: 16 }}>
                {mine.map((l) => (
                  <div key={l.id} style={{ background: "#101a2a", border: "1px solid #4a9eff55", borderRadius: 10, padding: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      {STONE_CHEST[l.item_id] ? (
                        <div style={{ width: 56, height: 56, display: "flex", alignItems: "center", justifyContent: "center", background: "radial-gradient(circle, rgba(255,217,77,0.18), transparent 70%)", borderRadius: 8, filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.6))" }}>
                          <img src={STONE_CHEST[l.item_id]} alt="" width={52} height={52} style={{ imageRendering: "auto" }} />
                        </div>
                      ) : (
                        <div style={{ fontSize: 22 }}>{ICONS[l.item_id] ?? "📦"}</div>
                      )}
                      <div>
                        <div style={{ color: "#f5cf6b", fontWeight: 800, fontSize: 13 }}>{l.qty}x {LABELS[l.item_id] ?? l.item_id}</div>
                        <div style={{ color: "#8a7a9c", fontSize: 11 }}>Seu anúncio</div>
                      </div>
                    </div>
                    <div style={{ fontSize: 12, color: "#c8b8d0", margin: "8px 0" }}>Preço: <b style={{ color: CUR_COLOR[l.currency ?? "gold"] }}>{l.price.toLocaleString()} {CUR_LABEL[l.currency ?? "gold"]}</b></div>

                    <button onClick={() => void onCancel(l).then((ok) => { if (ok) void refresh(); })}
                      style={{ width: "100%", background: "#3a1010", color: "#fff", border: "1px solid #ff6b6b55", borderRadius: 6, padding: "6px 0", fontWeight: 800, cursor: "pointer", fontSize: 12 }}>
                      Cancelar anúncio
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}
          <div style={{ color: "#ff9d3d", fontSize: 12, fontWeight: 800, margin: "6px 2px" }}>À VENDA ({others.length})</div>
          {others.length === 0 ? (
            <div style={{ color: "#8a7a9c", fontStyle: "italic", padding: 20, textAlign: "center" }}>Nenhum anúncio ativo no momento.</div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 10 }}>
              {others.map((l) => {
                const cur = l.currency ?? "gold";
                const bal = cur === "gold" ? bank.gold : cur === "crystal" ? bank.crystals : (items.safira_verde ?? 0);
                const canBuy = bal >= l.price;
                return (
                  <div key={l.id} style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(245, 207, 107, 0.2)", borderRadius: 10, padding: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      {STONE_CHEST[l.item_id] ? (
                        <div style={{ width: 64, height: 64, display: "flex", alignItems: "center", justifyContent: "center", background: "radial-gradient(circle, rgba(255,157,61,0.22), transparent 70%)", borderRadius: 10, filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.7))" }}>
                          <img src={STONE_CHEST[l.item_id]} alt="" width={58} height={58} style={{ imageRendering: "auto" }} />
                        </div>
                      ) : (
                        <div style={{ fontSize: 22 }}>{ICONS[l.item_id] ?? "📦"}</div>
                      )}
                      <div>
                        <div style={{ color: "#f5cf6b", fontWeight: 800, fontSize: 13 }}>{l.qty}x {LABELS[l.item_id] ?? l.item_id}</div>
                        <div style={{ color: "#8a7a9c", fontSize: 11 }}>por <b style={{ color: "#c8b8d0" }}>{l.seller_name}</b></div>
                      </div>
                    </div>
                    <div style={{ fontSize: 12, color: "#c8b8d0", margin: "8px 0" }}>Preço: <b style={{ color: CUR_COLOR[cur] }}>{l.price.toLocaleString()} {CUR_LABEL[cur]}</b></div>
                    <button disabled={!canBuy} onClick={() => void onBuy(l).then((ok) => {
                        if (ok) {
                          setListings((prev) => prev.filter((x) => x.id !== l.id));
                          void refresh();
                        }
                      })}
                      style={{ width: "100%", background: !canBuy ? "#333" : "linear-gradient(180deg,#ff9d3d,#8b4a10)", color: "#0e0818", border: "none", borderRadius: 6, padding: "8px 0", fontWeight: 800, cursor: !canBuy ? "not-allowed" : "pointer", fontSize: 12 }}>
                      {canBuy ? "Comprar" : `${CUR_LABEL[cur]} insuficiente(s)`}
                    </button>

                  </div>
                );
              })}

            </div>
          )}
        </>
      )}

      {mode === "create" && (
        <div style={{ background: "#1a0f26", border: `1px solid ${isVip ? "#ffd94d" : "#3a2a4a"}`, borderRadius: 10, padding: 16, maxWidth: 480 }}>
          {!isVip && (
            <div style={{ background: "#3a1010", border: "1px solid #ff6b6b55", borderRadius: 8, padding: 10, marginBottom: 12, color: "#ff9d9d", fontSize: 12 }}>
              ✦ Anunciar no mercado é exclusivo VIP. Compre um <b>Livro VIP 30d/60d</b> na Loja para liberar.
            </div>
          )}
          <div style={{ color: "#ffd94d", fontWeight: 800, fontSize: 14, marginBottom: 10 }}>Novo anúncio</div>
          <label style={{ fontSize: 12, color: "#c8b8d0", display: "block", marginBottom: 4 }}>Item</label>
          <select value={selItem} onChange={(e) => { const v = e.target.value; setSelItem(v); if (isStoneId(v)) setSelQty(STONE_PACK_SIZE); }}
            style={{ width: "100%", background: "#0e0818", color: "#f3e5c5", border: "1px solid #ffd94d55", borderRadius: 6, padding: 8, marginBottom: 10 }}>
            {Object.keys(npcPrices).map((id) => (
              <option key={id} value={id}>{LABELS[id] ?? id} (tenho {items[id] ?? 0})</option>
            ))}
          </select>
          {isStoneId(selItem) && STONE_CHEST[selItem] && (
            <div style={{ display: "flex", alignItems: "center", gap: 12, background: "linear-gradient(180deg,#2a1a3e,#160b24)", border: "1px solid #ffd94d66", borderRadius: 10, padding: 10, marginBottom: 10 }}>
              <img src={STONE_CHEST[selItem]} alt="" width={64} height={64} style={{ filter: "drop-shadow(0 3px 8px rgba(0,0,0,0.7))" }} />
              <div>
                <div style={{ color: "#ffd94d", fontWeight: 900, fontSize: 13 }}>Baú de {LABELS[selItem]}</div>
                <div style={{ color: "#c8b8d0", fontSize: 11 }}>Pack mínimo <b style={{ color: "#7dffbe" }}>{STONE_PACK_SIZE}</b> stones — pode anunciar mais.</div>
              </div>
            </div>
          )}
          <label style={{ fontSize: 12, color: "#c8b8d0", display: "block", marginBottom: 4 }}>Quantidade {isStoneId(selItem) && <span style={{ color: "#8a7a9c" }}>(mín. {STONE_PACK_SIZE} para stones)</span>}</label>
          <input type="number" min={isStoneId(selItem) ? STONE_PACK_SIZE : 1} max={99999} value={selQty}
            onChange={(e) => {
              const raw = Math.max(1, parseInt(e.target.value) || 1);
              setSelQty(isStoneId(selItem) ? Math.max(STONE_PACK_SIZE, raw) : raw);
            }}
            style={{ width: "100%", background: "#0e0818", color: "#f3e5c5", border: "1px solid #ffd94d55", borderRadius: 6, padding: 8, marginBottom: 10 }} />

          <label style={{ fontSize: 12, color: "#c8b8d0", display: "block", marginBottom: 4 }}>Moeda</label>
          <select value={selCurrency} onChange={(e) => setSelCurrency(e.target.value as any)}
            style={{ width: "100%", background: "#0e0818", color: "#f3e5c5", border: "1px solid #ffd94d55", borderRadius: 6, padding: 8, marginBottom: 10 }}>
            <option value="gold">💰 Ouro</option>
            <option value="crystal">💎 Cristal</option>
            <option value="safira">💚 Safira Verde</option>
          </select>
          <label style={{ fontSize: 12, color: "#c8b8d0", display: "block", marginBottom: 4 }}>Preço total ({CUR_LABEL[selCurrency]})</label>
          <input type="number" min={1} value={selPrice} onChange={(e) => setSelPrice(Math.max(1, parseInt(e.target.value) || 1))}
            style={{ width: "100%", background: "#0e0818", color: "#f3e5c5", border: "1px solid #ffd94d55", borderRadius: 6, padding: 8, marginBottom: 12 }} />
          {(() => {
            const stoneQty = isStoneId(selItem) ? Math.max(STONE_PACK_SIZE, selQty) : selQty;
            const belowMin = isStoneId(selItem) && stoneQty < STONE_PACK_SIZE;
            const noStock = (items[selItem] ?? 0) < stoneQty;
            const disabled = !isVip || belowMin || noStock;
            return (
              <button disabled={disabled}
                onClick={async () => { const ok = await onList(selItem, stoneQty, selPrice, selCurrency); if (ok) { setMode("browse"); void refresh(); } }}
                style={{ width: "100%", background: disabled ? "#333" : "linear-gradient(180deg,#ffd94d,#8b6a10)", color: "#0e0818", border: "none", borderRadius: 8, padding: "10px 0", fontWeight: 800, cursor: disabled ? "not-allowed" : "pointer" }}>
                {!isVip ? "🔒 VIP necessário" : belowMin ? `Mínimo ${STONE_PACK_SIZE} stones` : noStock ? `Precisa de ${stoneQty}× ${LABELS[selItem] ?? selItem}` : `Publicar anúncio (${stoneQty}x)`}
              </button>
            );
          })()}


        </div>
      )}

      {mode === "npc" && (
        <>
          <div style={{ color: "#c8a878", fontSize: 12, marginBottom: 10, fontStyle: "italic" }}>Venda rápida ao NPC — preço fixo, sem esperar comprador.</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 10 }}>
            {Object.keys(npcPrices).map((id) => {
              const have = items[id] ?? 0;
              const price = npcPrices[id];
              const disabled = have <= 0;
              return (
                <div key={id} style={{ background: "#1a0f26", border: `1px solid ${disabled ? "#3a2a4a" : "#ff9d3d66"}`, borderRadius: 10, padding: 12, opacity: disabled ? 0.55 : 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <div style={{ fontSize: 22 }}>{ICONS[id] ?? "📦"}</div>
                    <div>
                      <div style={{ color: "#f5cf6b", fontWeight: 800, fontSize: 13 }}>{LABELS[id] ?? id}</div>
                      <div style={{ color: "#8a7a9c", fontSize: 11 }}>Estoque: <b style={{ color: "#c8b8d0" }}>{have}</b></div>
                    </div>
                  </div>
                  <div style={{ fontSize: 12, color: "#c8b8d0", marginBottom: 8 }}>NPC: <b style={{ color: "#ff9d3d" }}>{price} ouro / un.</b></div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button disabled={disabled} onClick={() => onNpcSell(id, 1)}
                      style={{ flex: 1, background: disabled ? "#333" : "linear-gradient(180deg,#ff9d3d,#8b4a10)", color: "#0e0818", border: "none", borderRadius: 6, padding: "6px 0", fontWeight: 800, cursor: disabled ? "not-allowed" : "pointer", fontSize: 12 }}>
                      Vender 1
                    </button>
                    <button disabled={disabled || have < 10} onClick={() => onNpcSell(id, 10)}
                      style={{ flex: 1, background: (disabled || have < 10) ? "#333" : "#8b4a10", color: "#fff", border: "none", borderRadius: 6, padding: "6px 0", fontWeight: 800, cursor: (disabled || have < 10) ? "not-allowed" : "pointer", fontSize: 12 }}>
                      Vender 10
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}


function PokemonDetail({ pet, currentHp, src }: { pet: PetInstance; currentHp: number; src: string | undefined }) {

  const base = SPECIES_BASE[pet.species];
  const maxHp = calcIdleMaxHp(pet);
  const hpPct = Math.max(0, (currentHp / maxHp) * 100);
  const xpNeeded = 100 + pet.level * 20;
  const xp = pet.xp ?? 0;
  const xpPct = Math.min(100, (xp / xpNeeded) * 100);
  const now = Date.now();
  const infinite = (ENERGY_REGEN_MS[pet.rarity] ?? 0) === 0;
  const energy = petCurrentEnergy(pet, now);
  const msFull = petMsToFull(pet, now);
  const crit = Math.round(Math.min(60, 5 + pet.level * 0.3 + (((pet.ascensionStats as Record<string, number> | undefined)?.crit) ?? 0) * 0.5) * 10) / 10;

  const rarityColor: Record<string, string> = {
    common: "#a0b4c8", uncommon: "#7ef27a", rare: "#6bd4ff",
    epic: "#c084fc", legendary: "#f5cf6b", mythic: "#ff7ac0", mythic_shiny: "#fff28a",
  };
  const rColor = rarityColor[pet.rarity] ?? "#f5cf6b";

  return (
    <div style={{
      position: "relative",
      background: "linear-gradient(160deg, #1a0f2e 0%, #0b0716 100%)",
      border: `1px solid ${rColor}55`,
      borderRadius: 10,
      padding: 10,
      boxShadow: `0 6px 18px rgba(0,0,0,0.5), inset 0 0 30px ${rColor}12`,
      display: "grid",
      gridTemplateColumns: "150px 1fr",
      gap: 10,
      alignItems: "stretch",
    }}>
      {/* LEFT: PORTRAIT + LEVEL */}
      <div style={{
        display: "flex", flexDirection: "column", gap: 6,
      }}>
        <div style={{
          position: "relative",
          background: `radial-gradient(circle at 50% 40%, ${rColor}22 0%, #1a0a2e 60%, #0b0510 100%)`,
          border: `1px solid ${rColor}66`,
          borderRadius: 8,
          padding: 6,
          display: "flex", alignItems: "center", justifyContent: "center",
          minHeight: 120,
          boxShadow: `inset 0 0 18px ${rColor}22`,
        }}>
          {src && <img src={src} alt="" style={{ width: 96, height: 96, imageRendering: "pixelated", filter: `drop-shadow(0 3px 6px ${rColor}66)` }} />}
          <div style={{
            position: "absolute", top: 4, left: 4,
            fontSize: 8, letterSpacing: 1.5, color: "#8a7a9c", fontWeight: 700,
          }}>Nº {String(Object.keys(SPECIES_BASE).indexOf(pet.species) + 1).padStart(3, "0")}</div>
          <div style={{
            position: "absolute", bottom: 4, right: 4,
            background: "linear-gradient(180deg,#f5cf6b,#b8862a)",
            color: "#1a0f26", padding: "2px 7px", borderRadius: 10,
            fontWeight: 900, fontSize: 10, letterSpacing: 1,
            boxShadow: "0 2px 4px rgba(0,0,0,0.5)",
          }}>LV {pet.level}</div>
        </div>
        <div style={{
          padding: "4px 6px", fontSize: 9, fontWeight: 900, letterSpacing: 1.2,
          color: "#0b0510", background: rColor, borderRadius: 4, textAlign: "center",
        }}>{base.rarity.toUpperCase()}</div>
      </div>

      {/* RIGHT: NAME + BARS + STATS */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: 0 }}>
        <div style={{
          fontSize: 18, fontWeight: 900, color: rColor,
          textShadow: `1px 1px 0 #000, 0 0 10px ${rColor}55`,
          letterSpacing: 1.5, lineHeight: 1,
        }}>{pet.species.replace(/_/g, " ").toUpperCase()}</div>

        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <StatBar label="HP" value={Math.floor(currentHp)} max={maxHp} pct={hpPct} color="#5ec26a" />
          <StatBar label="EXP" value={xp} max={xpNeeded} pct={xpPct} color="#6bd4ff" />
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, marginBottom: 2 }}>
              <span style={{ color: "#c8b8d0", fontWeight: 700, letterSpacing: 1 }}>⚡ ENERGIA</span>
              <span style={{ color: "#8fd0ff", fontWeight: 700 }}>{infinite ? "∞ MÍTICO" : `${energy}/100${msFull > 0 ? " · " + fmtMS(msFull) : ""}`}</span>
            </div>
            <div style={{ height: 8, background: "#0e1a2e", borderRadius: 3, border: "1px solid rgba(0,0,0,0.6)" }}>
              <div style={{
                width: `${infinite ? 100 : energy}%`, height: "100%", borderRadius: 3,
                background: energy > 30 ? "linear-gradient(90deg,#3b7fd6,#6cb6ff)" : "linear-gradient(90deg,#c74a1a,#ff9a5a)",
              }} />
            </div>
          </div>
        </div>

        {/* STATS ROW */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
          <StatCell label="ATK" value={base.atk} />
          <StatCell label="DEF" value={base.def} />
          <StatCell label="SPA" value={base.spa} />
          <StatCell label="SPD" value={base.spd} />
          <StatCell label="VEL" value={base.spe} />
          <StatCell label="HP" value={maxHp} />
          <StatCell label="CRIT" value={crit} />
        </div>

        {pet.ascensionStats && Object.keys(pet.ascensionStats).length > 0 && (
          <div style={{
            background: "linear-gradient(180deg, rgba(20,40,25,0.7), rgba(11,20,14,0.7))",
            border: "1px solid rgba(126,242,122,0.35)",
            borderRadius: 6, padding: "5px 7px",
          }}>
            <div style={{ color: "#7ef27a", fontSize: 9, fontWeight: 900, letterSpacing: 1.5, marginBottom: 4 }}>✨ ASCENSÃO</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
              {(["hp","atk","def","spa","spd","spe","crit"] as const).map((k) => {
                const v = (pet.ascensionStats as Record<string, number>)[k];
                if (!v) return null;
                const lbl: Record<string,string> = { hp:"HP", atk:"ATK", def:"DEF", spa:"SPA", spd:"SPD", spe:"VEL", crit:"CRIT" };
                return <StatCell key={k} label={`+${lbl[k]}`} value={v} />;
              })}
            </div>
          </div>
        )}
      </div>
      {/* Portals moved to top-level for maximum reliability */}
    </div>
  );
}
function StatBar({ label, value, max, pct, color }: { label: string; value: number; max: number; pct: number; color: string }) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, marginBottom: 2 }}>
        <span style={{ color: "#c8b8d0", fontWeight: 700, letterSpacing: 1 }}>{label}</span>
        <span style={{ color: "#f5cf6b", fontWeight: 700 }}>{value}/{max}</span>
      </div>
      <div style={{ height: 8, background: "#2a0808", borderRadius: 3, border: "1px solid rgba(0,0,0,0.6)" }}>
        <div style={{
          width: `${pct}%`, height: "100%", borderRadius: 3,
          background: `linear-gradient(90deg, ${color}cc, ${color})`,
          boxShadow: `0 0 6px ${color}66`,
          transition: "width 300ms",
        }} />
      </div>
    </div>
  );
}
function StatCell({ label, value }: { label: string; value: number }) {
  return (
    <div style={{
      background: "linear-gradient(180deg, #1a0f26, #0b0510)",
      border: "1px solid rgba(245,207,107,0.22)",
      borderRadius: 4, padding: "3px 4px", textAlign: "center",
    }}>
      <div style={{ fontSize: 8, color: "#8a7a9c", letterSpacing: 1, fontWeight: 700 }}>{label}</div>
      <div style={{ fontSize: 12, fontWeight: 900, color: "#f3e5c5", textShadow: "1px 1px 0 #000" }}>{value}</div>
    </div>
  );
}


// ===== Descrições curtas por raridade (fallback) e por espécie =====
const SPECIES_LORE: Partial<Record<Species, string>> = {
  charmander: "Um lagarto de fogo curioso. A chama em sua cauda revela seu ânimo — cresce quando saudável e feliz.",
  charmeleon: "Mais feroz e territorial, seu fogo já queima florestas inteiras se não for controlado.",
  charizard: "Poderoso dragão de fogo. Sua chama derrete rochas e voa acima das nuvens com facilidade.",
  bulbasaur: "Carrega uma semente nas costas que absorve luz solar para crescer aos poucos.",
  ivysaur: "A semente floresceu em um botão pesado que anuncia sua próxima evolução.",
  venusaur: "Sua flor libera aromas relaxantes; é conhecido por sua paciência e imensa força.",
  squirtle: "Esconde-se em seu casco quando ameaçado e dispara jatos d'água precisos.",
  wartortle: "Sua cauda peluda é sinal de longevidade — símbolo de sabedoria e sorte.",
  blastoise: "Canhões d'água de alta pressão em seu casco podem furar aço grosso.",
  pikachu: "Mochila elétrica ambulante. Solta faíscas quando surpreso ou emocionado.",
  mewtwo: "Criado em laboratório com propósitos bélicos — sua mente é uma tempestade psíquica.",
  mew: "Considerado ancestral de todos os Pokémon. Aparece somente para corações puros.",
  lucario: "Sente e manipula a aura ao seu redor; capaz de prever movimentos antes que aconteçam.",
};
const RARITY_LORE: Partial<Record<Rarity, string>> = {
  common: "Um companheiro leal — comum, mas cheio de potencial nas mãos certas.",
  uncommon: "Um pouco acima da média. Boa base para longas jornadas.",
  rare: "Raro de se encontrar — atrai olhares por onde passa.",
  epic: "Épico em batalha, temido por treinadores iniciantes.",
  legendary: "Um lendário — poucos treinadores têm o privilégio de encontrá-lo.",
  mythic: "Ser mítico e atemporal. Sua presença altera o curso do combate.",
  mythic_shiny: "Mítico brilhante — uma variante quase impossível de existir.",
};
function SpeciesLore({ species, rarity }: { species: Species; rarity: Rarity }) {
  const lore = SPECIES_LORE[species] ?? RARITY_LORE[rarity] ?? "Um Pokémon único, com história ainda por contar.";
  return (
    <div style={{
      marginTop: 14,
      background: "linear-gradient(135deg, #2a1a3e 0%, #1a0f26 100%)",
      border: "1px solid rgba(245,207,107,0.35)",
      borderRadius: 10, padding: 14,
      boxShadow: "0 4px 14px rgba(0,0,0,0.35)",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
        <span style={{ fontSize: 14 }}>📖</span>
        <span style={{ color: "#f5cf6b", fontWeight: 900, fontSize: 12, letterSpacing: 2 }}>SOBRE {species.replace(/_/g, " ").toUpperCase()}</span>
      </div>
      <div style={{ fontSize: 13, color: "#e8dbe5", lineHeight: 1.55, fontStyle: "italic" }}>&ldquo;{lore}&rdquo;</div>
    </div>
  );
}
function ActiveBonuses({ leaderRarity, team, buffs }: {
  leaderRarity: Rarity;
  team: { rarity: Rarity }[];
  buffs: { atk: number; def: number; expMult: number; expMultUntil?: number; goldMult?: number; goldMultUntil?: number };
}) {
  const now = Date.now();
  const expActive = !!(buffs.expMultUntil && now < buffs.expMultUntil);
  const goldActive = !!(buffs.goldMultUntil && now < buffs.goldMultUntil);
  const rarityDropBonus: Partial<Record<Rarity, number>> = {
    rare: 0.03, epic: 0.07, legendary: 0.10, mythic: 0.15, mythic_shiny: 0.20,
  };
  const rarityBonus = rarityDropBonus[leaderRarity] ?? 0;
  const teamSynergyMap: Partial<Record<Rarity, number>> = {
    rare: 0.02, epic: 0.05, legendary: 0.10, mythic: 0.15, mythic_shiny: 0.20,
  };
  const synergyRarity = team.length >= 2 && team.every((p) => p.rarity === leaderRarity) ? leaderRarity : null;
  const synergyBonus = synergyRarity ? (teamSynergyMap[synergyRarity] ?? 0) : 0;
  const rarityLabel: Record<Rarity, string> = {
    common: "Comum", uncommon: "Incomum", rare: "Raro", epic: "Épico",
    legendary: "Lendário", mythic: "Mítico", mythic_shiny: "Mítico ✦",
  } as Record<Rarity, string>;
  const totalXpPct = Math.round(((expActive ? buffs.expMult : 0) + rarityBonus + synergyBonus) * 100);
  const totalGoldPct = Math.round(((goldActive ? (buffs.goldMult ?? 0) : 0) + rarityBonus + synergyBonus) * 100);
  const fmt = (ms: number) => {
    const s = Math.max(0, Math.floor(ms / 1000));
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60);
    return h > 24 ? `${Math.floor(h / 24)}d` : (h > 0 ? `${h}h ${m}m` : `${m}m`);
  };
  // handleSeasonReset foi movido para o escopo pai para ser acessível pelo sistema de códigos e NPC.

  // handleAnciaoInteraction removido daqui para ser movido para o escopo correto

  const Chip = ({ label, value, color, sub }: { label: string; value: string; color: string; sub?: string }) => (
    <div style={{
      background: `linear-gradient(180deg, ${color}22, ${color}08)`,
      border: `1px solid ${color}66`, borderRadius: 8, padding: "8px 10px",
      minWidth: 110, flex: "1 1 120px",
    }}>
      <div style={{ fontSize: 10, color: "#c8b8d0", letterSpacing: 1 }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 900, color, textShadow: "1px 1px 0 #000" }}>{value}</div>
      {sub && <div style={{ fontSize: 9, color: "#8a7a9c", marginTop: 2 }}>{sub}</div>}
    </div>
  );
  // Preview de sinergia por tier
  const synergyRow = (["rare","epic","legendary","mythic"] as Rarity[]).map((r) => ({
    r, pct: Math.round((teamSynergyMap[r] ?? 0) * 100),
    active: synergyRarity === r,
  }));
  return (
    <div style={{
      marginTop: 14,
      background: "#1a0f26", border: "1px solid rgba(245,207,107,0.15)",
      borderRadius: 10, padding: 12,
    }}>
      <div style={{ color: "#f5cf6b", fontSize: 12, fontWeight: 900, letterSpacing: 2, marginBottom: 8 }}>✨ BÔNUS ATIVOS</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        <Chip label="EXP TOTAL" value={`+${totalXpPct}%`} color="#6bd4ff"
          sub={`${expActive ? `Livro +${Math.round(buffs.expMult * 100)}% (${fmt(buffs.expMultUntil! - now)})` : "Sem livro"} · Líder +${Math.round(rarityBonus * 100)}%${synergyBonus > 0 ? ` · Sinergia +${Math.round(synergyBonus * 100)}%` : ""}`} />
        <Chip label="OURO TOTAL" value={`+${totalGoldPct}%`} color="#ffd94d"
          sub={`${goldActive ? `VIP +${Math.round((buffs.goldMult ?? 0) * 100)}% (${fmt(buffs.goldMultUntil! - now)})` : "Sem VIP"} · Líder +${Math.round(rarityBonus * 100)}%${synergyBonus > 0 ? ` · Sinergia +${Math.round(synergyBonus * 100)}%` : ""}`} />
        <Chip label="DROP ITENS" value={`+${Math.round((rarityBonus + synergyBonus) * 100)}%`} color="#c084fc"
          sub={`Líder ${leaderRarity} +${Math.round(rarityBonus * 100)}%${synergyBonus > 0 ? ` · Sinergia +${Math.round(synergyBonus * 100)}%` : ""}`} />
        <Chip label="ATK / DEF" value={`+${Math.round(buffs.atk * 100)}% / -${Math.round(buffs.def * 100)}%`} color="#ff7a3d"
          sub={`Livros permanentes de ATK / DEF`} />
      </div>
      <div style={{
        marginTop: 10, padding: "8px 10px",
        background: synergyBonus > 0 ? "linear-gradient(180deg,#2a1a3a,#180d24)" : "#150a1e",
        border: `1px solid ${synergyBonus > 0 ? "#c084fc66" : "rgba(255,255,255,0.06)"}`,
        borderRadius: 8,
      }}>
        <div style={{ fontSize: 10, letterSpacing: 1, color: "#c8b8d0", marginBottom: 6 }}>
          🤝 SINERGIA DE TIME {synergyRarity ? `— ativo: ${rarityLabel[synergyRarity]} +${Math.round(synergyBonus * 100)}%` : "— monte um time todo da mesma tier"}
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {synergyRow.map(({ r, pct, active }) => (
            <div key={r} style={{
              padding: "4px 8px", borderRadius: 6,
              background: active ? "#c084fc22" : "#0f0818",
              border: `1px solid ${active ? "#c084fc" : "rgba(255,255,255,0.08)"}`,
              fontSize: 10, color: active ? "#e9d5ff" : "#8a7a9c", fontWeight: 700,
            }}>
              {rarityLabel[r]} · +{pct}%
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function GovernanteDialog(props: {
  open: boolean;
  cards: number;
  plusCards?: number;
  rioluCards?: number;
  currentEggs: number;
  onClose: () => void;
  onExchange: (qty: number) => void;
  onExchangePlus?: (qty: number) => void;
  onExchangeRiolu?: (qty: number) => void;
}) {
  const { open, cards, plusCards = 0, rioluCards = 0, currentEggs, onClose, onExchange, onExchangePlus, onExchangeRiolu } = props;
  const [step, setStep] = useState(0);
  useEffect(() => { if (open) setStep(0); }, [open]);
  if (!open) return null;
  const maxByCap = Math.max(0, 6 - currentEggs);
  const canGive = Math.min(cards, maxByCap);
  const canGivePlus = plusCards;
  const canGiveRiolu = rioluCards;
  const lines = [
    "Ah... um treinador digno enfim cruza meu salão.",
    plusCards > 0
      ? `Percebo o brilho de ${plusCards} Carta${plusCards > 1 ? "s" : ""} Suprema${plusCards > 1 ? "s" : ""} Plus. Cada uma materializa um Black Mitic Plus direto na sua Coleção, com 6 traits garantidos.`
      : cards > 0
        ? `Vejo em suas mãos ${cards} Carta${cards > 1 ? "s" : ""} Lendária${cards > 1 ? "s" : ""}. Cada uma vale um Black Mitic Plus Egg.`
        : "Você não porta nenhuma Carta... volte quando obtiver ao menos uma.",
    (canGive > 0 || canGivePlus > 0)
      ? `Posso materializar ${canGivePlus > 0 ? `${canGivePlus} Pokémon PLUS ✦ na Coleção` : ""}${canGivePlus > 0 && canGive > 0 ? " ou " : ""}${canGive > 0 ? `${canGive} ovo${canGive > 1 ? "s" : ""} comum` : ""}.`
      : (cards > 0 || plusCards > 0)
        ? "Mas você já carrega o máximo de 6 ovos comuns. Choque os primeiros antes de retornar."
        : "Volte quando estiver pronto.",
  ];
  const isLast = step >= lines.length - 1;
  return createPortal(
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 20000,
        background: "radial-gradient(ellipse at center, rgba(30,10,60,0.85), rgba(0,0,0,0.95))",
        display: "flex", alignItems: "flex-end", justifyContent: "center",
        padding: "0 0 40px 0", backdropFilter: "blur(4px)",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(720px, 94vw)",
          background: "linear-gradient(180deg, rgba(40,20,70,0.98), rgba(15,5,30,0.98))",
          border: "3px solid transparent",
          borderImage: "linear-gradient(135deg, #ffd44a, #a066ff, #ffd44a) 1",
          borderRadius: 14,
          boxShadow: "0 0 40px rgba(160,80,255,0.55), inset 0 0 20px rgba(255,212,74,0.15)",
          padding: 16, display: "flex", gap: 16, color: "#f5eaff",
          position: "relative", animation: "govFadeIn 0.35s ease-out",
        }}
      >
        <style>{`
          @keyframes govFadeIn { from { opacity: 0; transform: translateY(20px);} to { opacity: 1; transform: translateY(0);} }
          @keyframes govGlow { 0%,100% { filter: drop-shadow(0 0 8px #ffd44a);} 50% { filter: drop-shadow(0 0 20px #a066ff);} }
        `}</style>
        {/* Retrato */}
        <div style={{
          flex: "0 0 160px", height: 200,
          background: "linear-gradient(180deg, #2a1550, #150828)",
          border: "2px solid #ffd44a", borderRadius: 10,
          display: "flex", alignItems: "center", justifyContent: "center",
          overflow: "hidden", animation: "govGlow 3s ease-in-out infinite",
        }}>
          <img
            src={npcGovernanteUrl}
            alt="Governante"
            style={{ width: "100%", height: "100%", objectFit: "contain", imageRendering: "pixelated" }}
          />
        </div>
        {/* Conteúdo */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{
            fontSize: 20, fontWeight: 900, letterSpacing: 2,
            color: "#ffd44a", textShadow: "0 0 10px rgba(255,212,74,0.6)",
          }}>
            👑 GOVERNANTE
            <span style={{ marginLeft: 8, fontSize: 10, color: "#c58bff", letterSpacing: 3 }}>SENHOR DAS CARTAS</span>
          </div>
          <div style={{
            background: "rgba(0,0,0,0.35)", border: "1px solid rgba(255,212,74,0.35)",
            borderRadius: 8, padding: 14, minHeight: 90, fontSize: 14, lineHeight: 1.5,
            fontStyle: "italic", color: "#f5eaff",
          }}>
            "{lines[step]}"
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <div style={{ fontSize: 11, color: "#c58bff" }}>
              Cartas: <b style={{ color: "#ffd44a" }}>{cards}</b> · Plus: <b style={{ color: "#ffd44a" }}>{plusCards}</b> · Riolu: <b style={{ color: "#7ec4ff" }}>{rioluCards}</b> · Ovos atuais: <b style={{ color: "#ffd44a" }}>{currentEggs}/6</b>
            </div>
            <div style={{ flex: 1 }} />
            {!isLast ? (
              <button
                onClick={() => setStep((s) => s + 1)}
                style={{
                  padding: "8px 16px", background: "linear-gradient(180deg, #a066ff, #6b28c8)",
                  border: "1px solid #c58bff", borderRadius: 8, color: "#fff",
                  fontWeight: 700, cursor: "pointer", fontSize: 12, letterSpacing: 1,
                }}
              >CONTINUAR ▸</button>
            ) : (canGive > 0 || canGivePlus > 0 || canGiveRiolu > 0) ? (
              <>
                <button
                  onClick={onClose}
                  style={{
                    padding: "8px 14px", background: "rgba(40,20,60,0.8)",
                    border: "1px solid #5a3a7a", borderRadius: 8, color: "#c58bff",
                    fontWeight: 600, cursor: "pointer", fontSize: 11,
                  }}
                >Agora não</button>
                {canGivePlus > 0 && onExchangePlus && (
                  <button
                    onClick={() => { onExchangePlus(canGivePlus); onClose(); }}
                    style={{
                      padding: "10px 18px",
                      background: "linear-gradient(180deg, #d066ff, #4a1080)",
                      border: "1px solid #ffe988", borderRadius: 8, color: "#fff",
                      fontWeight: 900, cursor: "pointer", fontSize: 12, letterSpacing: 1,
                      boxShadow: "0 0 18px rgba(208,102,255,0.85)",
                    }}
                  >✦ PLUS {canGivePlus} POKÉMON{canGivePlus > 1 ? "S" : ""} NA COLEÇÃO</button>
                )}
                {canGiveRiolu > 0 && onExchangeRiolu && (
                  <button
                    onClick={() => { onExchangeRiolu(canGiveRiolu); onClose(); }}
                    style={{
                      padding: "10px 18px",
                      background: "linear-gradient(180deg, #1a1a4a, #050515)",
                      border: "1px solid #7ec4ff", borderRadius: 8, color: "#e0f0ff",
                      fontWeight: 900, cursor: "pointer", fontSize: 12, letterSpacing: 1,
                      boxShadow: "0 0 20px rgba(126,196,255,0.9), inset 0 0 12px rgba(160,80,255,0.4)",
                    }}
                  >🐺✦ RIOLU BLACK MITIC BRILHANT PLUS ×{canGiveRiolu}</button>
                )}
                {canGive > 0 && (
                  <button
                    onClick={() => { onExchange(canGive); onClose(); }}
                    style={{
                      padding: "10px 18px",
                      background: "linear-gradient(180deg, #ffd44a, #b88010)",
                      border: "1px solid #ffe988", borderRadius: 8, color: "#2a1500",
                      fontWeight: 900, cursor: "pointer", fontSize: 12, letterSpacing: 1,
                      boxShadow: "0 0 14px rgba(255,212,74,0.7)",
                    }}
                  >✦ RECEBER {canGive} OVO{canGive > 1 ? "S" : ""}</button>
                )}
              </>
            ) : (
              <button
                onClick={onClose}
                style={{
                  padding: "10px 18px", background: "linear-gradient(180deg, #a066ff, #6b28c8)",
                  border: "1px solid #c58bff", borderRadius: 8, color: "#fff",
                  fontWeight: 700, cursor: "pointer", fontSize: 12, letterSpacing: 1,
                }}
              >Despedir-se</button>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}


// ============ Ancião Glacial — NPC de Reset de Temporada ============
function AnciaoGlacialDialog({
  open,
  onClose,
  onConfirm,
  forced = false,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  forced?: boolean;
}) {
  const [step, setStep] = useState(0);
  const [isResetting, setIsResetting] = useState(false);

  useEffect(() => { if (open) setStep(0); }, [open]);
  if (!open) return null;

  const lines = [
    "Saudações, viajante. O gelo eterno guardava sua chegada.",
    "Eu sou o Ancião Glacial. Sou eu quem abre o caminho para quem busca um novo começo.",
    "Atravesse minha bênção e eu o levarei ao Vale Dourado — terra verdejante de piso de ouro.",
  ];

  const handleConfirm = async () => {
    setIsResetting(true);
    try {
      await onConfirm();
    } finally {
      setIsResetting(false);
    }
  };

  const isLast = step >= lines.length - 1;

  return createPortal(
    <div
      onClick={forced ? undefined : onClose}

      style={{
        position: "fixed", inset: 0, zIndex: 20000,
        background: "radial-gradient(ellipse at center, rgba(10,30,60,0.85), rgba(0,0,0,0.95))",
        display: "flex", alignItems: "flex-end", justifyContent: "center",
        padding: "0 0 40px 0", backdropFilter: "blur(6px)",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(720px, 94vw)",
          background: "linear-gradient(180deg, rgba(20,40,70,0.98), rgba(5,15,30,0.98))",
          border: "3px solid transparent",
          borderImage: "linear-gradient(135deg, #c9b8ff, #1e40af, #c9b8ff) 1",
          borderRadius: 14,
          boxShadow: "0 0 50px rgba(125,211,252,0.4), inset 0 0 20px rgba(125,211,252,0.1)",
          padding: 20, display: "flex", gap: 20, color: "#e0f2fe",
        }}
      >
        <div style={{ flexShrink: 0, position: "relative" }}>
           <img 
             src="/npc-anciao-glacial.png" 
             alt="Ancião Glacial" 
             style={{ 
               width: 120, height: 120, imageRendering: "pixelated",
               filter: "drop-shadow(0 0 10px rgba(125,211,252,0.6))"
             }} 
           />
           <div style={{
             position: "absolute", bottom: -10, left: "50%", transform: "translateX(-50%)",
             background: "rgba(30,58,138,0.9)", border: "1px solid #c9b8ff", borderRadius: 4,
             padding: "2px 8px", fontSize: 10, fontWeight: 900, color: "#fff", whiteSpace: "nowrap"
           }}>ANCIÃO GLACIAL</div>
        </div>

        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{
            fontSize: 14, fontWeight: 800, color: "#c9b8ff", letterSpacing: 1.5,
            borderBottom: "1px solid rgba(125,211,252,0.2)", paddingBottom: 6
          }}>RITUAL DA NOVA JORNADA</div>

          <div style={{
            fontSize: 16, lineHeight: 1.6, minHeight: 80, color: "#fff",
            textShadow: "1px 1px 2px rgba(0,0,0,0.5)"
          }}>
            {lines[step]}
          </div>

          <div style={{ display: "flex", alignItems: "center", marginTop: 10 }}>
            <div style={{ flex: 1 }} />
            {!isLast ? (
              <button
                onClick={() => setStep(s => s + 1)}
                style={{
                  padding: "10px 20px", background: "linear-gradient(180deg, #c9b8ff, #1e40af)",
                  border: "1px solid #fff", borderRadius: 8, color: "#fff",
                  fontWeight: 800, cursor: "pointer", fontSize: 13, letterSpacing: 1,
                  boxShadow: "0 0 15px rgba(125,211,252,0.5)"
                }}
              >OUVIR MAIS ▸</button>
            ) : (
              <div style={{ display: "flex", gap: 12 }}>
                {!forced && (
                <button
                  onClick={onClose}
                  style={{
                    padding: "10px 20px", background: "rgba(30,58,138,0.4)",
                    border: "1px solid #c9b8ff66", borderRadius: 8, color: "#c9b8ff",
                    fontWeight: 700, cursor: "pointer", fontSize: 13
                  }}
                  disabled={isResetting}
                >RECUAR</button>
                )}

                <button
                  onClick={handleConfirm}
                  style={{
                    padding: "12px 24px",
                    background: "linear-gradient(180deg, #c9b8ff, #1e40af)",
                    border: "1px solid #fff", borderRadius: 8, color: "#fff",
                    fontWeight: 900, cursor: "pointer", fontSize: 14, letterSpacing: 1,
                    boxShadow: "0 0 20px rgba(125,211,252,0.8)",
                  }}
                  disabled={isResetting}
                >
                  {isResetting ? "ATRAVESSANDO..." : "✦ ATRAVESSAR A BÊNÇÃO"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}







