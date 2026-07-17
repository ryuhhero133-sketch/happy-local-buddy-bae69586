import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { FlaskConical, Sparkles } from "lucide-react";
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

import chestClosedImg from "@/assets/icons/chest-closed.png";
import chestOpenImg from "@/assets/icons/chest-open.png";
import ballPokeImg from "@/assets/items/icon-pokeball.png";
import ballGreatImg from "@/assets/items/icon-greatball.png";
import ballUltraImg from "@/assets/items/icon-ultraball.png";
import potionNewImg from "@/assets/items/icon-potion.png";
import premiumBoxImg from "@/assets/items/icon-premium-box.png";
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
import { useServerSync, type LocalSnapshotForPush } from "@/hooks/useServerSync";
import { fetchCloudSave, getCloudSaveLastError, pushCloudSaveNow, scheduleCloudSync } from "@/lib/cloudSave";
import { fetchTopRanked, recordRankedScore, type RankedRow } from "@/lib/rankedApi";
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

// Sprite constants (mesmo layout do modo Explorar)
const DIR_ROW = { down: 0, left: 1, right: 2, up: 3 } as const;
type Dir = keyof typeof DIR_ROW;

// ============ assets ============
import idleArenaAsset from "@/assets/idle-arena.jpg.asset.json";
import trophyIconAsset from "@/assets/trophy-icon.png.asset.json";

import mapSnowAsset from "@/assets/map-snow-valley.png.asset.json";
import mapDesertAsset from "@/assets/map-desert.png.asset.json";
import mapCaveAsset from "@/assets/map-cave1.png.asset.json";
import mapStoneAsset from "@/assets/map-stone.jpg.asset.json";
import mapTerraAsset from "@/assets/map-terra-hornet.jpg.asset.json";
import mapDesertoPurpuraAsset from "@/assets/map-deserto-purpura.jpg.asset.json";
import mapTerryAsset from "@/assets/map-terry.png.asset.json";
import mapN2Asset from "@/assets/map-n2.png.asset.json";
import mapN3Asset from "@/assets/map-n3.png.asset.json";
import hornetCocoonAsset from "@/assets/hornet-cocoon.png.asset.json";
import fireLakeAsset from "@/assets/fire-lake.png.asset.json";
import mapVenofogoOrangeAsset from "@/assets/map-lava-valley.jpg.asset.json";
import mapFantasmaAsset from "@/assets/map-fantasma.jpg.asset.json";
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
import redLakeAsset from "@/assets/red-lake.png.asset.json";
import volcanoAsset from "@/assets/volcano.png.asset.json";
import mapBeachUrl from "@/assets/map-beach-idle.png";
import collectIconImg from "@/assets/icons/collect-icon.png";
import rubyGemAsset from "@/assets/ruby-gem.png.asset.json";
import crystalRedAsset from "@/assets/items/icon-crystal-red.png.asset.json";
const crystalRedImg = crystalRedAsset.url;
import crystalGreenAsset from "@/assets/items/icon-crystal-green.png.asset.json";
const crystalGreenImg = crystalGreenAsset.url;
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
const deoxysUrl = assetUrlFromJson(deoxysAsset);
const groudonUrl = assetUrlFromJson(groudonAsset);
const laprasShinyUrl = assetUrlFromJson(laprasShinyAsset);
const charizardShinyUrl = assetUrlFromJson(charizardShinyAsset);
const snorlaxMythicUrl = assetUrlFromJson(snorlaxMythicAsset);
const darkraiUrl = assetUrlFromJson(darkraiAsset);
const hoOhUrl = assetUrlFromJson(hoOhAsset);
const magmortarUrl = assetUrlFromJson(magmortarAsset);
import lugiaAsset from "@/assets/lugia.gif.asset.json";
import hariyamaAsset from "@/assets/hariyama.gif.asset.json";
import ursaringAsset from "@/assets/ursaring.gif.asset.json";
import moltresAsset from "@/assets/moltres.gif.asset.json";
import zapdosAsset from "@/assets/zapdos.gif.asset.json";
import articunoAsset from "@/assets/articuno.gif.asset.json";
const lugiaUrl = assetUrlFromJson(lugiaAsset);
const hariyamaUrl = assetUrlFromJson(hariyamaAsset);
const ursaringUrl = assetUrlFromJson(ursaringAsset);
const moltresUrl = assetUrlFromJson(moltresAsset);
const zapdosUrl = assetUrlFromJson(zapdosAsset);
const articunoUrl = assetUrlFromJson(articunoAsset);




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
const mapFantasmaUrl = assetUrlFromJson(mapFantasmaAsset);
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
// URLs dos orbs (sprites transparentes)
const orbXpMinorUrl = assetUrlFromJson(orbXpMinorAsset);
const orbXpMajorUrl = assetUrlFromJson(orbXpMajorAsset);
const orbXpSupremeUrl = assetUrlFromJson(orbXpSupremeAsset);
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
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const gameDb = supabase as any;

const potionIconUrl = assetUrlFromJson(potionIconAsset);
const bgmUrl = assetUrlFromJson(bgmAsset);
const sfxLevelUpUrl = assetUrlFromJson(sfxLevelUpAsset);
const sfxClickUrl = assetUrlFromJson(sfxClickAsset);
const sfxBonusUrl = assetUrlFromJson(sfxBonusAsset);
const sfxChestOpenUrl = assetUrlFromJson(sfxChestOpenAsset);

type IdleMapId =
  | "arena" | "terra" | "deserto_purpura" | "terry" | "n2" | "n3" | "venofogo" | "praia" | "neve" | "deserto" | "caverna" | "fantasma"
  // Cadeia endgame — 3 bases (Vale das Rochas, Vulcão Ativo, Núcleo) + 4 recolores
  | "vale_rochas" | "vale_planta" | "vale_gelo" | "vale_veneno" | "vale_fogo"
  | "vulcao_ativo" | "nucleo_primordial";
// overlay: cor de recolorização aplicada por cima do bg (mix-blend: color)
// stars: dificuldade (1-8) exibida na UI
type IdleMapDef = {
  name: string; diff: string; bg: string; rate: number; minLevel: number; maxLevel?: number;
  element: string; stars?: number; overlay?: string;
  cycle?: { cycleMs: number; openMs: number };
  entryCrystals?: number;
};
const IDLE_MAPS: Record<IdleMapId, IdleMapDef> = {
  arena:    { name: "Vale Verdejante",         diff: "Fácil",     bg: idleArenaUrl,    rate: 1.0, minLevel: 1,  maxLevel: 30, element: "Grama", stars: 1 },
  terra:    { name: "Ninho de Marimbondo",     diff: "Fácil+",    bg: mapTerraUrl,     rate: 1.2, minLevel: 10, maxLevel: 35, element: "Terra", stars: 1 },
  deserto_purpura: { name: "Areias de Anúbis", diff: "Médio",     bg: mapDesertoPurpuraUrl, rate: 1.8, minLevel: 20, maxLevel: 55, element: "Terra/Veneno", stars: 2, entryCrystals: 5 },
  terry:    { name: "Terras de Terry",         diff: "Médio+",    bg: mapTerryUrl,     rate: 2.0, minLevel: 30, maxLevel: 70, element: "Terra", stars: 3, entryCrystals: 8 },
  n2:       { name: "Planície de Terry",        diff: "Difícil",   bg: mapN2Url,        rate: 2.4, minLevel: 50, maxLevel: 100, element: "Terra", stars: 4, entryCrystals: 12 },
  n3:       { name: "Confins de Terry",         diff: "Difícil+",  bg: mapN3Url,        rate: 2.8, minLevel: 80, maxLevel: 140, element: "Terra", stars: 5, entryCrystals: 18 },
  praia:    { name: "Praia Coral",             diff: "Fácil+",    bg: mapBeachUrl,     rate: 1.3, minLevel: 15, maxLevel: 40, element: "Água", stars: 1 },
  venofogo: { name: "Pântano em Chamas",       diff: "Difícil",   bg: mapVenofogoOrangeUrl, rate: 1.8, minLevel: 25, maxLevel: 120, element: "Veneno/Fogo", stars: 2 },

  neve:     { name: "Vale Verdejante de Neve", diff: "Médio",     bg: mapSnowUrl,      rate: 1.6, minLevel: 40, maxLevel: 65, element: "Gelo", stars: 2 },
  deserto:  { name: "Deserto Escaldante",      diff: "Médio+",    bg: mapDesertUrl,    rate: 2.0, minLevel: 50, maxLevel: 75, element: "Fogo", stars: 2 },
  caverna:  { name: "Caverna Rochosa",         diff: "Extremo",   bg: mapCaveUrl,      rate: 3.5, minLevel: 60, maxLevel: 90, element: "Pedra", stars: 3,
              cycle: { cycleMs: 2.5 * 60 * 60 * 1000, openMs: 30 * 60 * 1000 } },
  fantasma: { name: "Cemitério Assombrado",    diff: "Lendário",  bg: mapFantasmaUrl,  rate: 4.0, minLevel: 1,  maxLevel: 9999, element: "Fantasma", stars: 4 },
  // ═══ ENDGAME — cadeia progressiva, portal visível mas exige nível de treinador ═══
  vale_rochas:       { name: "Vale das Rochas",   diff: "Lendário",   bg: mapPedreiraCavernaUrl, rate: 6.0, minLevel: 50,  maxLevel: 150, element: "Pedra",  stars: 4 },
  vale_planta:       { name: "Vale Esmeralda",    diff: "Lendário+",  bg: mapPedreiraCavernaUrl, rate: 6.5, minLevel: 120, maxLevel: 220, element: "Planta", stars: 5, overlay: "rgba(70,210,90,0.42)" },
  vale_gelo:         { name: "Vale Gélido",       diff: "Mítico",     bg: mapPedreiraCavernaUrl, rate: 7.0, minLevel: 190, maxLevel: 290, element: "Gelo",   stars: 6, overlay: "rgba(140,220,255,0.45)" },
  vale_veneno:       { name: "Vale Tóxico",       diff: "Mítico+",    bg: mapPedreiraCavernaUrl, rate: 7.5, minLevel: 260, maxLevel: 360, element: "Veneno", stars: 7, overlay: "rgba(180,90,220,0.48)" },
  vale_fogo:         { name: "Vale Ígneo",        diff: "Mítico+",    bg: mapPedreiraCavernaUrl, rate: 8.0, minLevel: 330, maxLevel: 420, element: "Fogo",   stars: 7, overlay: "rgba(255,95,45,0.45)" },
  vulcao_ativo:      { name: "Vulcão Ativo",      diff: "PRIMORDIAL", bg: mapVictoryRoadUrl,     rate: 9.0, minLevel: 400, maxLevel: 470, element: "Fogo",   stars: 8 },
  nucleo_primordial: { name: "Núcleo Primordial", diff: "PRIMORDIAL", bg: mapVenenoUrl,          rate: 10.0, minLevel: 460, maxLevel: 500, element: "Misto", stars: 8 },
};

type WorldPortalDef = { key: string; from: IdleMapId; to: IdleMapId; x: number; y: number; arriveX: number; arriveY: number; color: string; label: string; reqLevel?: number };
// Cadeia endgame — portais visíveis em todos os mapas, mas exigem nível de treinador para atravessar
const ENDGAME_CHAIN: Array<{ from: IdleMapId; to: IdleMapId; req: number; color: string }> = [
  { from: "terra",             to: "vale_rochas",       req: 40,  color: "#c9a76a" },
  { from: "vale_rochas",       to: "vale_planta",       req: 110, color: "#4ade80" },
  { from: "vale_planta",       to: "vale_gelo",         req: 180, color: "#7dd3fc" },
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
  deoxys: deoxysUrl, groudon: groudonUrl, lapras_shiny: laprasShinyUrl, snorlax_mythic: snorlaxMythicUrl, charizard_shiny: charizardShinyUrl,
  darkrai: darkraiUrl, ho_oh: hoOhUrl, magmortar: magmortarUrl,
  lugia: lugiaUrl, hariyama: hariyamaUrl, ursaring: ursaringUrl,
  moltres: moltresUrl, zapdos: zapdosUrl, articuno: articunoUrl,
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
  squirtle: "water", wartortle: "water", blastoise: "water",
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
  articuno: "ice",
  // Pedra / terra
  diglett: "rock", dugtrio: "rock",
  sandshrew: "rock", sandslash: "rock",
  cubone: "rock", marowak: "rock",
  golem: "rock", geodude: "rock", graveler: "rock",
  // Fighting
  machop: "fighting", machoke: "fighting", machamp: "fighting",
  mankey: "fighting", primeape: "fighting",
  lucario: "fighting", pinsir: "fighting",
  // Flying
  pidgey: "flying", pidgeotto: "flying", pidgeot: "flying",
  fearow: "flying", spearow: "flying",
  // Normal
  rattata_f: "normal", raticate_f: "normal",
  meowth: "normal", persian: "normal",
  eevee: "normal", snorlax: "normal", snorlax_mythic: "normal",
  clefairy: "normal", clefable: "normal",
  // Mythic Roamers
  deoxys: "psychic", groudon: "fire", lapras_shiny: "water",
  darkrai: "psychic", ho_oh: "fire", magmortar: "fire",
  lugia: "psychic", hariyama: "fighting", ursaring: "normal",

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
  pending: { gold: number; rubies: number; crystals: number };
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
  buffs: { atk: number; def: number; expMult: number; expMultUntil?: number; goldMult?: number; goldMultUntil?: number; honeyUntil?: number; honeyRareUntil?: number; orbMult?: number; orbUntil?: number; orbId?: string }; // livros de xp/vip são temporários (1h); honey = incenso de mel 1h; honeyRare = incenso raro (dobra bônus); orb = boost independente (stack com livro)
  autoHeal: { enabled: boolean; threshold: number }; // auto usa poção quando HP% <= threshold
  autoBattle?: { enabled: boolean; useBall: boolean; preferredBall: "auto" | "pokeball" | "greatball" | "ultraball"; captureHpPct: number };
  trainerLevel?: number; // nível do TREINADOR (separado do nível do pokémon)
  trainerXp?: number;    // xp acumulado do treinador rumo ao próximo nível
  unlockedSkins?: string[]; // skins premium desbloqueadas (default sempre incluída)
  // Colmeias do Ninho de Marimbondo — 3 slots de Beedrill por casulo, produzem incenso a cada 10 min
  hives?: Record<string, { slots: Array<{ uid: string; startedAt: number } | null> }>;
};

export type CollectionEntry = { uid: string; species: Species; level: number; rarity: Rarity; capturedAt: number; xp?: number; traits?: string[] };

export const MAX_COLLECTION = 500;

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
  orb_xp_minor: orbXpMinorUrl, orb_xp_major: orbXpMajorUrl, orb_xp_supreme: orbXpSupremeUrl,
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

type ShopBook = { id: "book_atk" | "book_def" | "book_exp" | "book_exp_big" | "book_exp_max" | "book_vip" | "book_vip_30" | "book_vip_60" | "orb_xp_minor" | "orb_xp_major" | "orb_xp_supreme"; name: string; desc: string; price: number; img: string; currency?: "crystals" | "gold"; priceGold?: number };
const SHOP_BOOKS: ShopBook[] = [
  { id: "book_atk", name: "Livro de Ataque", desc: "+10% de dano permanente por uso", price: 20, img: bookAtkImg },
  { id: "book_def", name: "Livro de Defesa", desc: "-10% de dano recebido por uso",  price: 20, img: bookDefImg },
  { id: "book_exp", name: "Livro de EXP",    desc: "+30% EXP em batalhas por 1 hora",   price: 30, img: bookExpImg },

  { id: "book_vip_30", name: "Livro VIP 30d ✦✦", desc: "+30% ouro e +30% EXP por 30 DIAS", price: 500, img: bookExpImg },
  { id: "book_vip_60", name: "Livro VIP 60d ✦✦✦", desc: "+40% ouro e +40% EXP por 60 DIAS", price: 1000, img: bookExpImg },
  // ═══ ORB DE XP FRACO — único vendido; os fortes vêm da troca com NPC ═══
  { id: "orb_xp_minor",   name: "Orb de XP Menor ✦",   desc: "+10% EXP por 1 hora (apenas 1 orb ativo, stack com livro)", price: 100,  img: orbXpMinorUrl,   currency: "crystals", priceGold: 50000 },
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
  { minLv: 30, species: ["dragonite", "charizard"] },
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
      const s: IdleState = { ...freshIdle(), ...JSON.parse(raw) };
      // Presente de boas-vindas (evento): 1x Caixa Premium
      const flags = (s as unknown as { flags?: Record<string, boolean> }).flags ?? {};
      if (!flags.giftPremiumBoxV1) {
        s.items = { ...(s.items ?? {}), premium_box: (s.items?.premium_box ?? 0) + 1 };
        (s as unknown as { flags: Record<string, boolean> }).flags = { ...flags, giftPremiumBoxV1: true };
      }
      // Auto-Poção sempre ativada ao entrar no jogo (usuário pode desativar depois na sessão)
      s.autoHeal = { ...(s.autoHeal ?? { threshold: 0.5, enabled: true }), enabled: true };
      // Garante lista de skins desbloqueadas (default sempre incluída)
      const uskins = Array.isArray(s.unlockedSkins) ? s.unlockedSkins.slice() : [];
      if (!uskins.includes("default")) uskins.unshift("default");
      s.unlockedSkins = uskins;
      // Sanitiza mapa removido (Pedreira Antiga)
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
    pending: { gold: 0, rubies: 0, crystals: 0 },
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
    buffs: { atk: 0, def: 0, expMult: 0, expMultUntil: 0, goldMult: 0, goldMultUntil: 0, honeyUntil: 0, honeyRareUntil: 0, orbMult: 0, orbUntil: 0, orbId: "" },
    autoHeal: { enabled: true, threshold: 0.5 },
    autoBattle: { enabled: true, useBall: true, preferredBall: "auto", captureHpPct: 1 },
    trainerLevel: 1,
    trainerXp: 0,
    unlockedSkins: ["default"],
  };
}
function saveIdle(s: IdleState) {
  try { localStorage.setItem(IDLE_KEY, JSON.stringify(s)); } catch { /* ignore */ }
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
  while (lv < 999 && xp >= trainerXpToNext(lv)) { xp -= trainerXpToNext(lv); lv += 1; }
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
  if (save?.party && save.party.length > 0) {
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
  const [team, setTeam] = useState<PetInstance[]>(() => loadTeam());
  // Pokémon fora do time enquanto descansam na Casa Azul (voltam ao time cheios)
  const [restingBench, setRestingBench] = useState<PetInstance[]>([]);
  // HP atual do meu pokémon (o líder toma dano dos inimigos)
  const [leaderHp, setLeaderHp] = useState<number>(() => {
    const initTeam = loadTeam();
    const l = initTeam[0];
    return l ? Math.max(l.hp ?? 0, calcIdleMaxHp(l)) : 0;
  });
  const [leveledAt, setLeveledAt] = useState<number>(0);
  const [levelToast, setLevelToast] = useState<{ level: number; gains: string[]; bonus: string; ts: number } | null>(null);
  const prevLevelRef = useRef<number>(0);
  useEffect(() => {
    if (!levelToast) return;
    const t = setTimeout(() => setLevelToast(null), 5000);
    return () => clearTimeout(t);
  }, [levelToast]);
  // alvo atual (para virar o pokémon) — id do inimigo que estamos atacando
  const [attackTargetId, setAttackTargetId] = useState<number | null>(null);
  const attackTargetIdRef = useRef<number | null>(null);
  const paralyzedUntilRef = useRef<number>(0);
  const [paralyzedUntil, setParalyzedUntil] = useState<number>(0);

  useEffect(() => { attackTargetIdRef.current = attackTargetId; }, [attackTargetId]);
  // Ao trocar de líder (ou seu nível mudar muito), inimigos fora da faixa
  // de nível são despawnados e novos são gerados para o novo líder.
  const leaderLvKeyRef = useRef<number>(team[0]?.level ?? 0);
  const leaderUidRef = useRef<string | undefined>(team[0]?.uid);
  useEffect(() => {
    const lv = team[0]?.level ?? 0;
    const uid = team[0]?.uid;
    const changed = uid !== leaderUidRef.current || Math.abs(lv - leaderLvKeyRef.current) >= 3;
    if (changed) {
      leaderLvKeyRef.current = lv;
      leaderUidRef.current = uid;
      // Remove inimigos fora da faixa; se o mapa ficar vazio de válidos, respawna.
      setEnemies((prev) => {
        const kept = prev.filter((e) => {
          const el = e.level ?? lv;
          return el <= lv + 10 && el >= lv - 5;
        });
        setAttackTargetId(null);
        blacklistRef.current.clear();
        return kept.length >= 3 ? kept : spawnEnemies();
      });
    }
  }, [team]);
  const [idle, setIdle] = useState<IdleState>(() => loadIdle());
  const [now, setNow] = useState(() => Date.now());

  // ============= Server sync (Supabase anti-cheat) =============
  const idleRef = useRef(idle);
  useEffect(() => { idleRef.current = idle; }, [idle]);
  const teamRef = useRef(team);
  useEffect(() => { teamRef.current = team; }, [team]);

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
        setTeam(() => full.team.slice(0, 5).map((p) => ({
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
  useEffect(() => {
    if (cloudBlobHydratedRef.current) return;
    let cancelled = false;
    (async () => {
      try {
        const { data: sess } = await supabase.auth.getSession();
        const uid = sess.session?.user?.id;
        if (!uid) return;
        const blob = (await fetchCloudSave(uid)) as
          | { idle?: Partial<IdleState>; team?: PetInstance[]; restingBench?: PetInstance[]; party?: PetInstance[] }
          | null;
        if (cancelled || !blob) return;
        if (blob.idle) {
          setIdle((prev) => {
            const merged: IdleState = { ...prev, ...blob.idle } as IdleState;
            // Sanitiza
            if (!IDLE_MAPS[merged.currentMap]) merged.currentMap = "arena";
            const uskins = Array.isArray(merged.unlockedSkins) ? merged.unlockedSkins.slice() : [];
            if (!uskins.includes("default")) uskins.unshift("default");
            merged.unlockedSkins = uskins;
            merged.autoHeal = { ...(merged.autoHeal ?? { threshold: 0.5, enabled: true }), enabled: merged.autoHeal?.enabled ?? true };
            return merged;
          });
        }
        if (Array.isArray(blob.team) && blob.team.length > 0) {
          setTeam(blob.team.slice(0, 5));
        } else if (Array.isArray(blob.party) && blob.party.length > 0) {
          setTeam(blob.party.slice(0, 5));
        }
        if (Array.isArray(blob.restingBench)) {
          setRestingBench(blob.restingBench);
        } else if (Array.isArray(blob.party) && blob.party.length > 5) {
          setRestingBench(blob.party.slice(5));
        }
        cloudBlobHydratedRef.current = true;
      } catch (e) {
        console.warn("[cloudBlob] hydrate failed", e);
      } finally {
        if (!cancelled) setCloudBlobReady(true);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Autosave do BLOB completo — debounced (1.5s) sempre que idle/team/bench mudam.
  const buildFullBlob = useCallback(() => ({
    idle: idleRef.current,
    team: teamRef.current,
    restingBench,
    savedAt: Date.now(),
  }), [restingBench]);
  useEffect(() => {
    if (!cloudBlobReady) return;
    scheduleCloudSync(buildFullBlob());
  }, [idle, team, restingBench, buildFullBlob, cloudBlobReady]);

  // Push imediato ao fechar aba / trocar aba (evita perder últimos segundos).
  useEffect(() => {
    const flush = () => {
      if (!cloudBlobReady) return;
      void pushCloudSaveNow(buildFullBlob());
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
  const [nearBuilding, setNearBuilding] = useState<"lab" | "lar" | "azul" | null>(null);
  const [eggOpenResult, setEggOpenResult] = useState<{ sp: string; rarity: string } | null>(null);

  // ===== Detalhes de Pokémon (modal ao clicar no card) + Casa Azul picker =====
  const [petDetailUid, setPetDetailUid] = useState<string | null>(null);
  const [azulPickerOpen, setAzulPickerOpen] = useState(false);
  const [azulPreselectUid, setAzulPreselectUid] = useState<string | null>(null);
  const [colecaoDetailUid, setColecaoDetailUid] = useState<string | null>(null);
  const [statsCardPet, setStatsCardPet] = useState<PetInstance | null>(null);
  const [eventToast, setEventToast] = useState<{ id: number; icon: string; title: string; sub?: string; color: string } | null>(null);
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
    const newPet = { ...makePet(entry.species, entry.level, entry.rarity), uid: entry.uid, xp: entry.xp ?? 0, traits: entry.traits ?? [] };
    setTeam((tm) => {
      const idx = tm.findIndex((p) => p.uid === entry.uid);
      if (idx >= 0) {
        const arr = [...tm];
        const [p] = arr.splice(idx, 1);
        setLeaderHp(calcIdleMaxHp(p));
        return [p, ...arr];
      }
      if (tm.length >= 5) {
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





  type Enemy = { sp: Species; hp: number; maxHp: number; id: number; x: number; y: number; face: "left" | "right"; aggressive?: boolean; aggroR?: number; elite?: boolean; level: number; rarity: Rarity; eventLegendary?: boolean; rider?: boolean };
  const [enemies, setEnemies] = useState<Enemy[]>([]);
  type FxKind = "myDmg" | "enemyDmg" | "xp" | "gold" | "capture" | "crit";
  const [fx, setFx] = useState<{ id: number; x: number; y: number; text: string; kind: FxKind }[]>([]);
  type Chest = { id: number; x: number; y: number; opened: boolean; openedAt?: number; purple?: boolean };
  const [chests, setChests] = useState<Chest[]>([]);
  
  const enemyIdRef = useRef(1);
  const chestIdRef = useRef(1);
  const fxIdRef = useRef(1);
  const [tab, setTab] = useState<"inicio" | "pokemon" | "mochila" | "batalha" | "melhorias" | "colecao" | "pokedex" | "loja" | "wallet" | "market" | "config" | "tarefas">("batalha");
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

  // ==== ÁUDIO ====
  const [audioSettings, setAudioSettings] = useState(() => {
    if (typeof window === "undefined") return { music: true, sfx: true, musicVol: 0.20, sfxVol: 0.45 };
    try {
      const raw = localStorage.getItem("rubym.idle.audio");
      if (raw) return { music: true, sfx: true, musicVol: 0.20, sfxVol: 0.45, ...JSON.parse(raw) };
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
    if (audioSettings.music) { a.play().catch(() => {}); } else { a.pause(); }
  }, [audioSettings.music, audioSettings.musicVol]);
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


  type ChatMsg = { id: number; text: string; kind: "info" | "dmg" | "hit" | "cap" | "lv" | "chest" | "capture" };
  const [chat, setChat] = useState<ChatMsg[]>([]);
  const chatIdRef = useRef(1);
  const pushChat = (text: string, kind: ChatMsg["kind"] = "info") => {
    setChat((prev) => {
      const next = [...prev, { id: chatIdRef.current++, text, kind }];
      return next.slice(-40);
    });
  };
  // Chat global (cooldown 10 min por jogador)
  const [chatInput, setChatInput] = useState("");
  const [chatCooldownUntil, setChatCooldownUntil] = useState<number>(0);
  const [chatFilter, setChatFilter] = useState<"all" | "system" | "world" | "captures">("all");
  const [chatTick, setChatTick] = useState(0);
  useEffect(() => {
    if (chatCooldownUntil <= Date.now()) return;
    const iv = setInterval(() => setChatTick((n) => n + 1), 1000);
    return () => clearInterval(iv);
  }, [chatCooldownUntil]);

  // WASD
  const keysRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    const kd = (e: KeyboardEvent) => {
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
  type Building = { key: "lab" | "lar" | "azul"; label: string; emoji: string; color: string; x: number; y: number; w: number; h: number; interactR: number };
  const BUILDINGS = useMemo<Building[]>(() => [
    { key: "lab",  label: "Laboratório", emoji: "🔬", color: "#c084fc", x: 520,  y: 640, w: 148, h: 168, interactR: 100 },
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
  const [codeOpen, setCodeOpen] = useState(false);
  const [codeInput, setCodeInput] = useState("");
  const [codeMsg, setCodeMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const MYTHIC_EGG_CODE_KEY = "rubym.mythicEggCode.used";
  const MYTHIC_EGG2_CODE_KEY = "rubym.mythicEgg2Code.used";
  const CHARIZARD_EGG_CODE_KEY = "rubym.charizardEggCode.used";
  const ULTRA200_CODE_KEY = "rubym.ultra200CodeUsed";
  const normalizeCode = (value: string) => value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
  const redeemCrystalCode = () => {
    const raw = normalizeCode(codeInput);
    if (!raw) { setCodeMsg({ kind: "err", text: "Digite um código." }); return; }
    // Todos os códigos promocionais foram encerrados.
    setCodeMsg({ kind: "err", text: "Código inválido ou expirado." });
  };





  useEffect(() => {
    const iv = setInterval(() => setWalkStep((s) => (moving ? (s + 1) % 4 : 0)), 180);
    return () => clearInterval(iv);
  }, [moving]);

  // ===== Follower (pokémon líder) segue o treinador com trilha suave =====
  const trailRef = useRef<Array<{ x: number; y: number }>>([{ x: WORLD_W / 2, y: WORLD_H / 2 }]);
  const [followerState, setFollowerState] = useState<{ x: number; y: number; dir: Dir; moving: boolean }>({
    x: WORLD_W / 2 - 40, y: WORLD_H / 2 + 30, dir: "right", moving: false,
  });
  const followerStateRef = useRef(followerState);
  useEffect(() => { followerStateRef.current = followerState; }, [followerState]);

  // Adiciona posição do treinador na trilha sempre que ele muda
  useEffect(() => {
    const trail = trailRef.current;
    const last = trail[trail.length - 1];
    if (!last || Math.hypot(last.x - trainerPos.x, last.y - trainerPos.y) > 2) {
      trail.push({ x: trainerPos.x, y: trainerPos.y });
      if (trail.length > 240) trail.shift();
    }
  }, [trainerPos]);

  // Loop de animação: follower persegue ponto ~46px atrás do treinador na trilha
  useEffect(() => {
    let raf = 0;
    const FOLLOW_DIST = 48;
    const MAX_SPEED = 5.2; // px por frame
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
          craft_points: idle.craftPoints ?? 0,
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
          const byId = new Map(prev.map((p) => [p.id, p]));
          for (const row of data as any[]) {
            if (!row?.id || row.id === meId) continue;
            byId.set(row.id, {
              id: String(row.id),
              userId: String(row.id).split(":")[0] || String(row.id),
              name: String(row.name || "Treinador"),
              x: Number(row.x) || WORLD_W / 2,
              y: Number(row.y) || WORLD_H / 2,
              dir: (["down", "left", "right", "up"].includes(row.dir) ? row.dir : "down") as Dir,
              step: byId.get(row.id)?.step ?? 0,
              leaderSp: row.leader_species || undefined,
              ts: new Date(row.updated_at || Date.now()).getTime(),
            });
          }
          return Array.from(byId.values()).filter((p) => p.id !== meId && Date.now() - p.ts < 20_000);
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
  useEffect(() => {
    if (!identity?.id) return;
    const ch = supabase.channel("rubym-captures-global");
    ch.on("broadcast", { event: "capture" }, (payload) => {
      const p = payload.payload as { id: string; name: string; sp: string; rarity: string; chancePct: number };
      if (!p || p.id === identity.id) return;
      const spName = String(p.sp).replace(/_/g, " ").toUpperCase();
      pushChat(`🌍 ${p.name} capturou ${spName} (${p.rarity} · ${p.chancePct.toFixed(1)}%)`, "cap");
    });
    ch.on("broadcast", { event: "say" }, (payload) => {
      const p = payload.payload as { id: string; name: string; text: string };
      if (!p || p.id === identity.id) return;
      const safe = String(p.text).slice(0, 140);
      pushChat(`💬 ${p.name}: ${safe}`, "info");
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
  const [rankRows, setRankRows] = useState<RankRow[]>([]);
  const [rankLoading, setRankLoading] = useState(false);
  const [rankMode, setRankMode] = useState<RankMode>("trainer");
  const RANK_CACHE_TTL_MS = 3 * 60 * 60 * 1000; // 3 horas — snapshot global
  const rankCacheKey = (mode: RankMode) => `rank_cache_v2_real_level_${mode}`;
  useEffect(() => {
    if (!rankOpen) return;
    let cancelled = false;
    const key = rankCacheKey(rankMode);
    // Serve cache local se ainda dentro da janela de 3h
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
    setRankLoading(true);
    (async () => {
      const collection = idle.collection ?? [];
      const maxPokeLevel = Math.max(
        1,
        ...team.map((p) => p?.level ?? 0),
        ...collection.map((p) => p?.level ?? 0),
      );
      const collectionCraft = collection.reduce((acc, p) => acc + (CRAFT_BY_RARITY[p.rarity] ?? 0), 0);
      const totalCraft = (idle.craftPoints ?? 0) + collectionCraft;
      const meRow = (): RankRow => ({
        id: identity?.id ?? "local-trainer",
        name: identity?.name || "Treinador",
        level: maxPokeLevel,
        trainer_level: idle.trainerLevel ?? 1,
        craft_points: totalCraft,
        leader_species: team[0]?.species ?? null,
        leader_rarity: team[0]?.rarity ?? null,
        guild_name: null,
      });
      try {
        await recordRankedScore(idle.trainerLevel ?? 1, totalCraft, null);
        const top = await fetchTopRanked(200);
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

        if (rows.length === 0) {
          const orderCol = rankMode === "craft" ? "craft_points" : "trainer_level";
          const { data, error } = await gameDb
            .from("players")
            .select("id,name,level,trainer_level,craft_points,leader_species,leader_rarity,guild_name")
            .order(orderCol, { ascending: false })
            .limit(200);
          if (error) console.warn("[idle ranked] players:", error.message);
          rows = (data as RankRow[] | null) ?? [];
        }

        if (!rows.some((r) => r.id === (identity?.id ?? "local-trainer"))) rows.push(meRow());
        else {
          // Atualiza a linha do usuário local com os valores reais (max nv poke + craft total).
          rows = rows.map((r) => (r.id === (identity?.id ?? "local-trainer") ? { ...r, ...meRow() } : r));
        }
        rows.sort((a, b) => {
          const av = rankMode === "craft" ? a.craft_points : a.trainer_level;
          const bv = rankMode === "craft" ? b.craft_points : b.trainer_level;
          return bv - av;
        });
        rows = rows.slice(0, 200);
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
  }, [rankOpen, rankMode, identity?.id, identity?.name, idle.trainerLevel, idle.craftPoints, idle.collection, team]);

  useEffect(() => {
    const t = setTimeout(() => {
      const collection = idle.collection ?? [];
      const collectionCraft = collection.reduce((acc, p) => acc + (CRAFT_BY_RARITY[p.rarity] ?? 0), 0);
      const totalCraft = (idle.craftPoints ?? 0) + collectionCraft;
      void recordRankedScore(idle.trainerLevel ?? 1, totalCraft, null);
    }, 4500);
    return () => clearTimeout(t);
  }, [idle.trainerLevel, idle.craftPoints, idle.collection]);
  const viewW = viewSize.w / zoom;
  const viewH = viewSize.h / zoom;
  const camX = Math.max(0, Math.min(Math.max(0, WORLD_W - viewW), trainerPos.x - viewW / 2));
  const camY = Math.max(0, Math.min(Math.max(0, WORLD_H - viewH), trainerPos.y - viewH / 2));

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
        },
      };
      saveIdle(next);
      return next;
    });
    if (starterChosenRef.current) setEnemies(spawnEnemies());
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ---- Movimento do treinador: caça o inimigo mais próximo ----
  const stuckRef = useRef<{ id: number; count: number }>({ id: 0, count: 0 });
  const blacklistRef = useRef<Map<number, number>>(new Map()); // id -> expiresAt
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
    setIdle((s) => ({ ...s, currentMap: p.to }));
    setTrainerPos({ x: p.arriveX, y: p.arriveY });
    walkTargetRef.current = null;
    setWalkingTo(null);
    setAttackTargetId(null);
    setEnemies([]);
    pushChat(`Chegou em ${IDLE_MAPS[p.to].name}!`, "cap");
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
        const speed = 14 * (1 + honeyBonusNow());
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
          const speed = 14 * (1 + honeyBonusNow());
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
        const speed = 12 * distBoost * (1 + honeyBonusNow());
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
          const speed = 6;
          const nx = ne.x + (dx / dist) * speed;
          const ny = ne.y + (dy / dist) * speed;
          if (collidesWithAny(nx, ny)) return ne;
          changed = true;
          return { ...ne, x: nx, y: ny, face: (dx >= 0 ? "right" : "left") as "left" | "right" };
        });
        return changed ? next : prev;
      });
    }, 120);
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
          pushChat(`★ ${label}: ${ne.sp.replace(/_/g, " ").toUpperCase()} apareceu no mapa!`, "cap");
        }
        return [...prev, ne];
      });
    }, 9000 + Math.floor(Math.random() * 4000)); // 9-13s entre spawns
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
        let dmg = Math.floor((5 + leader.level * 0.8 + base.atk * 0.12 + Math.random() * 5) * (1 + idle.buffs.atk));
        if (isCrit) dmg = Math.floor(dmg * 1.8);
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
        };
        const spec = SPECIAL_ABILITY[target.sp];
        if (spec) {
          if (Math.random() < spec.crit) {
            eDmg = Math.floor(eDmg * 2.5);
            pushChat(`💥 ${target.sp.replace(/_/g," ").toUpperCase()} desferiu um GOLPE CRÍTICO!`, "hit");
          }
          if (Math.random() < spec.para) {
            const dur = target.sp === "lugia" ? 120_000 : 60_000;
            paralyzedUntilRef.current = Date.now() + dur;
            setParalyzedUntil(paralyzedUntilRef.current);
            pushChat(`⚡ ${target.sp.replace(/_/g," ").toUpperCase()} paralisou seu Pokémon por ${Math.round(dur/1000)}s!`, "hit");
          }
          if (spec.flee > 0 && Math.random() < spec.flee) {
            const fleeId = target.id;
            const fleeSp = target.sp;
            setTimeout(() => {
              setEnemies((cur) => cur.filter((e) => e.id !== fleeId));
              // Ao fugir, remove efeitos de status que o inimigo causou (paralisia)
              // senão o treinador ficaria travado sem alvo por até 2min.
              paralyzedUntilRef.current = 0;
              setParalyzedUntil(0);
              blacklistRef.current.delete(fleeId);
              setAttackTargetId((c) => (c === fleeId ? null : c));
              pushChat(`💨 ${fleeSp.replace(/_/g," ").toUpperCase()} fugiu do combate!`, "info");
            }, 900);
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
          }
          return nh;
        });


        const next = prev.map((e) => e.id === target.id
          ? { ...e, hp: e.hp - dmg, face: (trainerPos.x < e.x ? "left" : "right") as "left" | "right" }
          : e);
        const killedNow = next.find((e) => e.id === target.id && e.hp <= 0);
        if (killedNow) {
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
          const xpBase = Math.floor((60 + Math.random() * 100) * (1 + totalExpBoost) * (1 + totalBonus) * (1 + elemSyn.xpMult) * honeyMult * enemyRarityMult * 0.15 * overLvlPenalty * riderMult);
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
          pushChat(`+${xp} EXP · +${gold} ouro${suffix}`, "info");
          // drops (sem pokébola de drop — agora vem só da loja)
          const drops: string[] = [];
          for (const it of ITEM_POOL) {
            if (it.id === "pokeball") continue;
            if (Math.random() < it.chance * (1 + totalBonus) * honeyMult) drops.push(it.id);
          }
          // Ultra Ball: apenas raro+ (rare/epic/legendary/mythic/mythic_shiny), 30% chance
          const ultraEligible = target.rarity === "rare" || target.rarity === "epic" || target.rarity === "legendary" || target.rarity === "mythic" || target.rarity === "mythic_shiny";
          if (ultraEligible && Math.random() < 0.30) drops.push("ultraball");

          // XP para o líder + drena energia de TODOS do time
          setTeam((tm) => {
            if (tm.length === 0) return tm;
            const now = Date.now();
            return tm.map((p, idx) => {
              if (idx !== 0) return p; // apenas o líder drena por kill
              const curE = petCurrentEnergy(p, now, { active: true });
              const drainKill = energyDrainPerKill(p.rarity);
              const newE = drainKill === 0 ? ENERGY_MAX : Math.max(0, curE - drainKill);
              const newXp = (p.xp ?? 0) + xp;
              let lv = p.level;
              let remaining = newXp;
              while (lv < 10000 && remaining >= 100 + lv * 20) { remaining -= 100 + lv * 20; lv += 1; }
              if (lv >= 10000) remaining = 0;
              return {
                ...p, level: lv, xp: remaining,
                hp: Math.min(leaderHp, calcIdleMaxHp({ ...p, level: lv })),
                energy: newE, energyRegenAt: now,
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
              const baseChance = 0.05; // difícil: 5% base (com bola comum)
              if (isEventLeg && usedBall.id === "greatball") {
                captured = false; // Great sempre falha em lendários do evento
              } else if (isEventLeg && usedBall.id === "masterball") {
                captured = true; // Master captura garantido
              } else if (isEventLeg) {
                // Ultra: chance muito baixa (~2%) contra lendários do evento
                captured = usedBall.id === "ultraball" ? Math.random() < 0.02 : false;
              } else {
                captured = Math.random() < baseChance * usedBall.captureMult;
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
                pushChat(`★ Capturado (${rLabel}) com ${usedBall.name}: ${target.sp.replace(/_/g, " ").toUpperCase()}!`, "capture");
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
                pushChat(`${target.sp.replace(/_/g, " ").toUpperCase()} foi para a sua Coleção.`, "info");

              } else {
                pushFxAt(target.x, target.y - 70, `${usedBall.name} falhou`, "enemyDmg");
                pushChat(`✗ ${usedBall.name} falhou em capturar ${target.sp.replace(/_/g, " ").toUpperCase()}.`, "hit");
              }
            } else {
              pushFxAt(target.x, target.y - 70, "sem pokébola", "enemyDmg");
              pushChat(`Sem Pokébolas no estoque — compre na loja para capturar.`, "info");
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
              ? [...prevCol, { uid: capturedPet.uid, species: capturedPet.species, level: capturedPet.level, rarity: capturedPet.rarity, capturedAt: Date.now(), traits: capturedPet.traits }]
              : prevCol;
            // Anuncia traits sorteados no chat
            if (capturedPet && capturedPet.traits && capturedPet.traits.length > 0) {
              const tLabels = capturedPet.traits.map((id) => {
                const t = TRAITS[id]; return t ? `${t.icon} ${t.name}` : id;
              }).join(" · ");
              queueMicrotask(() => pushChat(`✨ Traits: ${tLabels}`, "cap"));
            }
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
            const killTrainerXp = Math.max(1, Math.round((8 + target.level * 2.5) * rMult * finalScale * (1 + (expActive ? idle.buffs.expMult : 0)) * 0.3));
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
            return {
              ...applied.state,
              pending: { ...s.pending, gold: s.pending.gold + gold },
              totals: { gold: s.totals.gold + gold, captured: s.totals.captured + capturedInc, kills: newKills },
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

  useEffect(() => {
    const trLv = idle.trainerLevel ?? 1;
    const portal = WORLD_PORTALS.find((p) => p.from === idle.currentMap && Math.hypot(trainerPos.x - p.x, trainerPos.y - p.y) <= 58);
    // Só entra em portal desbloqueado — bloqueados são silenciosamente ignorados
    // para o auto continuar caçando sem travar com "🔒" a cada passo.
    if (portal && (!portal.reqLevel || trLv >= portal.reqLevel)) enterWorldPortal(portal);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trainerPos.x, trainerPos.y, idle.currentMap]);


  useEffect(() => { saveIdle(idle); }, [idle]);

  // Reconcilia: qualquer pokémon no time/bench fica espelhado na coleção com o MAIOR nível já visto.
  useEffect(() => {
    setIdle((s) => {
      const col = s.collection ?? [];
      const active = [...team, ...restingBench];
      const byUid = new Map(active.map((p) => [p.uid, p]));
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
      for (const p of [...team, ...restingBench]) {
        if (!known.has(p.uid)) {
          missing.push({ uid: p.uid, species: p.species, level: p.level, xp: p.xp ?? 0, rarity: p.rarity, capturedAt: Date.now() });
        }
      }
      if (!changed && missing.length === 0) return s;
      return { ...s, collection: [...nextCol, ...missing] };
    });
  }, [team, restingBench]);

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
  const LEGEND_ROSTER: { sp: Species; label: string; rarity: Rarity; level: number; icon: string; color: string; weather?: "snow" | "rain" }[] = [
    { sp: "virizion",      label: "VIRIZION",      rarity: "epic",         level: 80, icon: "🌿", color: "#7ef2a2" },
    { sp: "raikou",        label: "RAIKOU",        rarity: "epic",         level: 82, icon: "⚡", color: "#f5cf6b" },
    { sp: "luxray_f",      label: "LUXRAY ♀",      rarity: "epic",         level: 78, icon: "⚡", color: "#5ec2ff" },
    { sp: "suicune",       label: "SUICUNE",       rarity: "mythic",       level: 88, icon: "❄", color: "#8ec5ff", weather: "rain" },
    { sp: "suicune_shiny", label: "SUICUNE ✦",     rarity: "mythic_shiny", level: 92, icon: "💠", color: "#ff97e1", weather: "snow" },
  ];
  const legendIdxRef = useRef(0);
  const [legendUntil, setLegendUntil] = useState<{ until: number; weather?: "snow" | "rain" } | null>(null);
  const currentMapRef = useRef(idle.currentMap);
  useEffect(() => { currentMapRef.current = idle.currentMap; }, [idle.currentMap]);
  useEffect(() => {
    const trigger = () => {
      // Lendários NUNCA aparecem no Vale Verdejante (mapa inicial)
      if (currentMapRef.current === "arena") return;
      const pick = LEGEND_ROSTER[Math.floor(Math.random() * LEGEND_ROSTER.length)];
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
      pushChat(`★ EVENTO ${rarityLabel}: ${pick.label} ${pick.icon} apareceu! Pokébola comum NÃO funciona, Great sempre falha — use ULTRA ou MASTER!`, "cap");
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
    if (isEventLeg && usedBall.id === "greatball") {
      chance = 0; // Great sempre falha em lendários do evento
    } else if (isEventLeg && usedBall.id === "masterball") {
      chance = 1; // Master captura garantido
    } else if (isEventLeg) {
      // Lv 500+ míticos e Lugia: ULTRA muito difícil; escala com HP baixo
      const isUltra = usedBall.id === "ultraball";
      if (!isUltra) { chance = 0; }
      else if (target.sp === "lugia") {
        chance = hpPct > 0.15 ? 0 : 0.008; // só com HP < 15% e mesmo assim 0.8%
      } else if (target.level >= 500) {
        chance = hpPct > 0.25 ? 0.002 : 0.012; // Lv500+ míticos: 0.2%~1.2%
      } else {
        chance = 0.02;
      }
    } else {
      const base = 0.08 + (1 - hpPct) * 0.37;
      chance = Math.min(0.95, base * usedBall.captureMult);
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
      if (rolled.length > 0) {
        const tLabels = rolled.map((id) => { const t = TRAITS[id]; return t ? `${t.icon} ${t.name}` : id; }).join(" · ");
        pushChat(`✨ Traits: ${tLabels}`, "cap");
      }
      playBonus();
      setEnemies((prev) => prev.filter((e) => e.id !== enemyId));
      setIdle((s) => {
        const prev = s.collection ?? [];
        if (prev.length >= MAX_COLLECTION) {
          queueMicrotask(() => pushChat(`⚠ Coleção cheia (${MAX_COLLECTION}). Venda ou fragmente para liberar espaço.`, "info"));
          return { ...s, totals: { ...s.totals, captured: s.totals.captured + 1 } };
        }
        return {
          ...s,
          totals: { ...s.totals, captured: s.totals.captured + 1 },
          caughtSpecies: s.caughtSpecies.includes(target.sp) ? s.caughtSpecies : [...s.caughtSpecies, target.sp],
          collection: [...prev, { uid: np.uid, species: np.species, level: np.level, rarity: np.rarity, capturedAt: Date.now(), traits: rolled }],
        };
      });
    } else {
      pushFxAt(target.x, target.y - 70, `${ballName} falhou`, "enemyDmg");
      pushChat(`✗ ${ballName} falhou (HP ${Math.round(hpPct * 100)}%).`, "hit");
    }
  };



  // Usar item da mochila
  const useItem = (id: string) => {
    const l = team[0]; if (!l) return;
    const have = (idle.items[id] ?? 0);
    if (have <= 0) { pushChat(`Você não tem ${id}.`, "info"); return; }
    const maxHp = calcIdleMaxHp(l);
    if (id === "potion") {
      if (leaderHp <= 0) { pushChat(`Poção não revive. Reviva por 50 ouro.`, "info"); return; }
      const heal = Math.floor(maxHp * 0.5);
      setLeaderHp((h) => Math.min(maxHp, h + heal));
      setIdle((s) => ({ ...s, items: { ...s.items, [id]: have - 1 } }));
      pushFxAt(trainerPos.x, trainerPos.y - 40, `+${heal} HP`, "gold");
      pushChat(`Você usou Poção (+${heal} HP).`, "info");
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
      setIdle((s) => ({ ...s, items: { ...s.items, [id]: have - 1 }, buffs: { ...s.buffs, atk: s.buffs.atk + 0.10 } }));
      pushFxAt(trainerPos.x, trainerPos.y - 40, "ATK +10%", "capture");
      pushChat(`Livro de Ataque usado (+10% dano permanente).`, "cap");
    } else if (id === "book_def") {
      setIdle((s) => ({ ...s, items: { ...s.items, [id]: have - 1 }, buffs: { ...s.buffs, def: s.buffs.def + 0.10 } }));
      pushFxAt(trainerPos.x, trainerPos.y - 40, "DEF +10%", "capture");
      pushChat(`Livro de Defesa usado (-10% dano recebido).`, "cap");
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
    } else if (id === "orb_xp_minor" || id === "orb_xp_major" || id === "orb_xp_supreme") {
      const add = id === "orb_xp_minor" ? 0.10 : id === "orb_xp_major" ? 0.20 : 0.30;
      const pct = Math.round(add * 100);
      const label = id === "orb_xp_minor" ? "Orb Menor" : id === "orb_xp_major" ? "Orb Maior" : "Orb Supremo";
      const nowT = Date.now();
      if ((idle.buffs.orbUntil ?? 0) > nowT) {
        pushChat(`Já há um Orb de EXP ativo. Só 1 orb pode ficar ativo por vez.`, "info");
        return;
      }
      setIdle((s) => ({
        ...s,
        items: { ...s.items, [id]: have - 1 },
        buffs: { ...s.buffs, orbMult: add, orbUntil: Date.now() + 3600_000, orbId: id },
      }));
      pushFxAt(trainerPos.x, trainerPos.y - 40, `${label} +${pct}% · 1h`, "capture");
      pushEvent("✦", `${label.toUpperCase()} ATIVO`, `+${pct}% EXP por 1 hora`, id === "orb_xp_supreme" ? "#ffd94d" : id === "orb_xp_major" ? "#c084fc" : "#5cd3ff");
      pushChat(`✦ ${label} usado — +${pct}% EXP por 1 hora.`, "cap");
    } else if (id === "book_vip" || id === "book_vip_30" || id === "book_vip_60") {
      const cfg = id === "book_vip_60"
        ? { add: 0.40, ms: 60 * 24 * 3600_000, label: "60 dias" }
        : id === "book_vip_30"
          ? { add: 0.30, ms: 30 * 24 * 3600_000, label: "30 dias" }
          : { add: 0.20, ms: 3600_000, label: "1 hora" };
      const nowT = Date.now();
      if ((idle.buffs.expMultUntil ?? 0) > nowT || (idle.buffs.goldMultUntil ?? 0) > nowT) {
        pushChat(`Já há um bônus VIP/EXP ativo. Espere o tempo acabar.`, "info");
        return;
      }
      setIdle((s) => ({
        ...s,
        items: { ...s.items, [id]: have - 1 },
        buffs: {
          ...s.buffs,
          expMult: cfg.add, expMultUntil: nowT + cfg.ms,
          goldMult: cfg.add, goldMultUntil: nowT + cfg.ms,
        },
      }));
      pushFxAt(trainerPos.x, trainerPos.y - 40, `VIP +${Math.round(cfg.add*100)}% · ${cfg.label}`, "capture");
      pushChat(`Livro VIP usado (+${Math.round(cfg.add*100)}% ouro e EXP por ${cfg.label}).`, "cap");
    } else if (id === "egg_common" || id === "egg_rare" || id === "egg_epic" || id === "egg_mystic" || id === "egg_aura" || id === "egg_charizard") {
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
  type EggId = "egg_common" | "egg_rare" | "egg_epic" | "egg_mystic" | "egg_aura" | "egg_charizard";
  const EGG_TIERS: Record<EggId, { weights: Partial<Record<Rarity, number>> }> = {
    egg_common: { weights: { common: 70, uncommon: 25, rare: 5 } },
    egg_rare:   { weights: { uncommon: 20, rare: 55, epic: 22, legendary: 3 } },
    egg_epic:   { weights: { rare: 20, epic: 50, legendary: 25, mythic: 5 } },
    egg_mystic: { weights: { common: 25, uncommon: 25, rare: 22, epic: 16, legendary: 9, mythic: 2, mythic_shiny: 1 } },
    egg_aura:   { weights: { mythic: 100 } },
    egg_charizard: { weights: { mythic: 100 } },
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
    } else if (eggId === "egg_charizard") {
      sp = "charizard_shiny" as Species;
    } else {
      const unlocked = speciesUnlockedFor(leaderLv).filter((x) => !!GIF[x]);
      const fallback = (Object.keys(GIF) as Species[]);
      const pickFrom = unlocked.length ? unlocked : fallback;
      sp = pickFrom[Math.floor(Math.random() * pickFrom.length)] as Species;
    }
    const rarity = rollEggRarity(eggId);
    const pet = makePet(sp, Math.max(1, leaderLv), rarity as Rarity);

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
      if (tm.length >= 5) {
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

  // Fragmentar Pokémon da coleção -> pontos de craft por raridade
  const fragmentCollection = (uid: string) => {
    setIdle((s) => {
      const col = s.collection ?? [];
      const entry = col.find((e) => e.uid === uid);
      if (!entry) return s;
      const gain = CRAFT_BY_RARITY[entry.rarity] ?? 1;
      pushChat(`⚒️ ${entry.species.replace(/_/g, " ").toUpperCase()} fragmentado (+${gain} pts de craft).`, "cap");
      return {
        ...s,
        collection: col.filter((e) => e.uid !== uid),
        craftPoints: (s.craftPoints ?? 0) + gain,
      };
    });
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
          pool = ["zubat", "venomoth", "venonat", "gloom", "ekans", "arbok", "abra", "kadabra", "meowth", "persian"] as Species[];
          if (leaderLv < 200) mapLvRange = [200, 225];
          else if (leaderLv < 250) mapLvRange = [leaderLv + 12, leaderLv + 32];
          else mapLvRange = [Math.max(250, leaderLv - 2), leaderLv + 18];
        }
        if (idle.currentMap === "deserto_purpura") {
          // Areias de Anúbis — deserto tóxico continuação do Ninho de Marimbondo
          pool = ["ekans", "arbok", "sandshrew", "sandslash", "cubone", "nidoran_f", "nidorina", "nidoking", "beedrill", "kakuna", "weedle", "diglett", "meowth", "persian"] as Species[];
          mapLvRange = [Math.max(20, leaderLv - 3), Math.min(55, leaderLv + 8)];
        }
        pool = pool.filter(hasGif);
        if (pool.length === 0) pool = (Object.keys(GIF) as Species[]);
        sp = pool[Math.floor(Math.random() * pool.length)];
      }

      // 🌟 MYTHIC ROAMER: pokémons míticos Lv 500 (deoxys/groudon/lapras✦/snorlax✦) que
      // aparecem raro em qualquer mapa. Máx 1 por mapa. Muito difícil de capturar (event legendary).
      const MYTHIC_ROAMERS: Species[] = ["deoxys", "groudon", "lapras_shiny", "snorlax_mythic", "darkrai"];
      const currentRoamers = enemies.filter((e) => e.eventLegendary && e.level >= 400).length;
      const isMythicRoamer = currentRoamers === 0 && Math.random() < 0.004;
      if (isMythicRoamer) {
        sp = MYTHIC_ROAMERS[Math.floor(Math.random() * MYTHIC_ROAMERS.length)];
        forcedRarity = "mythic_shiny";
        mapLvRange = [500, 500];
      }

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
      if (hardCap != null && !isMythicRoamer) lv = Math.min(lv, hardCap);
      if (isMythicRoamer) lv = 500;
      // Épico só aparece quando o líder chega ao nível 50.
      const allowEpic = leaderLv >= 50;
      if (forcedRarity === "epic" && !allowEpic) forcedRarity = "rare";
      let pet = makePet(sp, lv, forcedRarity);
      if (!isMythicRoamer && (pet.rarity === "epic" || pet.rarity === "legendary") && !allowEpic) {
        pet = makePet(sp, lv, "rare");
      }
      // ★ POKÉMON RIDER: 1.2% de chance — muito acima do nível do líder, dá MUITO xp
      const isRider = !isMythicRoamer && Math.random() < 0.012 && !mapLvRange;
      if (isRider) {
        const boost = 25 + Math.floor(Math.random() * 21); // +25..+45
        lv = leaderLv + boost;
        if (hardCap != null) lv = Math.min(lv, hardCap + 50); // riders podem passar do cap
        pet = makePet(sp, lv, allowEpic ? "epic" : "rare");
      }
      const baseHp = calcIdleMaxHp(pet);
      const highHp = highLevelEnemyHpMult(lv, leaderLv);
      const roamerHpMult = isMythicRoamer ? 6 : 1;
      const hp = Math.floor(baseHp * (elite ? 1.6 : 1) * (isRider ? 2.6 : 1) * roamerHpMult * highHp);
      const isAggro = true; // todos os pokémon selvagens agora são agressivos
      const aggroR = elite ? 300 : 220 + Math.floor(Math.random() * 60);

      return { sp, hp, maxHp: hp, id: enemyIdRef.current++, x, y, face: "left", aggressive: isAggro, aggroR, elite, level: lv, rarity: pet.rarity, rider: isRider, eventLegendary: isMythicRoamer };

    }
    return null;
  }

  // Alvo total de inimigos no mapa (top-up lento cuida do resto)
  const ENEMY_TARGET = 16;

  function spawnEnemies(): Enemy[] {
    // Só spawna alguns de imediato — o resto entra aos poucos (setInterval abaixo)
    const initial = 6 + Math.floor(Math.random() * 3); // 6-8
    const placed: { x: number; y: number }[] = [];
    const arr: Enemy[] = [];
    while (arr.length < initial) {
      const e = spawnOneEnemy(placed);
      if (!e) break;
      arr.push(e);
    }
    const rareOnes = arr.filter((e) => e.rarity === "epic" || e.rarity === "legendary" || e.rarity === "mythic" || e.rarity === "mythic_shiny");
    for (const r of rareOnes) {
      const label = r.rarity === "mythic_shiny" ? "MÍTICO SHINY" : r.rarity.toUpperCase();
      const color = r.rarity === "mythic_shiny" ? "#ffd94d" : r.rarity === "mythic" ? "#ff5252" : r.rarity === "legendary" ? "#ff8b3d" : "#c084fc";
      pushEvent("★", `${label} À VISTA!`, `${r.sp.replace(/_/g, " ").toUpperCase()} apareceu no mapa`, color);
      pushChat(`★ ${label}: ${r.sp.replace(/_/g, " ").toUpperCase()} apareceu no mapa!`, "cap");
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
  const map = IDLE_MAPS[idle.currentMap];
  const visibleBuildings = BUILDINGS;
  const viewportBg = idle.currentMap === "caverna" ? "#1f2028" : "#1a3d1a";

  const collect = () => {
    setIdle((s) => {
      const gold = Math.floor(s.pending.gold);
      const rubies = Math.floor(s.pending.rubies);
      const crystals = Math.floor(s.pending.crystals);
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
      pushFxAt(trainerPos.x, trainerPos.y - 60, `+${gold} ouro · +${crystals} 💎`, "gold");
      return {
        ...s,
        pending: { gold: 0, rubies: 0, crystals: 0 },
        bank: { gold: s.bank.gold + gold, crystals: s.bank.crystals + crystals },
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
  const buyBall = (b: ShopBall) => {
    setIdle((s) => {
      if (s.bank.gold < b.price) {
        pushChat(`Ouro insuficiente para ${b.name}.`, "info");
        return s;
      }
      pushFxAt(trainerPos.x, trainerPos.y - 40, `+1 ${b.name}`, "capture");
      pushChat(`Comprou 1 ${b.name} por ${b.price} ouro.`, "cap");
      return {
        ...s,
        bank: { ...s.bank, gold: s.bank.gold - b.price },
        items: { ...s.items, [b.id]: (s.items[b.id] ?? 0) + 1 },
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
  };
  // ===== Mercado P2P (Supabase) =====
  const isVip = () => {
    const until = idle.buffs?.goldMultUntil ?? 0;
    return until > Date.now();
  };
  const listMarketItem = async (itemId: string, qty: number, price: number): Promise<boolean> => {
    if (!identity?.id) { pushChat("Faça login para anunciar.", "info"); return false; }
    if (!isVip()) { pushChat("✦ Anunciar no mercado é exclusivo VIP. Use um Livro VIP na Loja.", "info"); return false; }
    const have = idle.items[itemId] ?? 0;
    if (have < qty) { pushChat("Estoque insuficiente para anunciar.", "info"); return false; }
    if (qty < 1 || price < 1 || price > 100_000_000) { pushChat("Quantidade ou preço inválido.", "info"); return false; }
    const { error } = await supabase.from("market_listings").insert({
      seller_id: identity.id,
      seller_name: identity.name || "Treinador",
      kind: "item",
      item_id: itemId,
      qty,
      price,
      currency: "gold",
    });
    if (error) { pushChat(`Falha ao anunciar: ${error.message}`, "info"); return false; }
    // remove item do estoque local (custódia do anúncio)
    setIdle((s) => ({ ...s, items: { ...s.items, [itemId]: (s.items[itemId] ?? 0) - qty } }));
    pushChat(`📢 Anúncio criado: ${qty}x ${itemId} por ${price} ouro.`, "cap");
    return true;
  };
  const buyMarketListing = async (listing: { id: string; seller_id: string; item_id: string; qty: number; price: number }): Promise<boolean> => {
    if (!identity?.id) { pushChat("Faça login para comprar.", "info"); return false; }
    if (listing.seller_id === identity.id) { pushChat("Você não pode comprar seu próprio anúncio.", "info"); return false; }
    if (idle.bank.gold < listing.price) { pushChat("Ouro insuficiente.", "info"); return false; }
    const { data, error } = await supabase
      .from("market_listings")
      .update({ buyer_id: identity.id, sold_at: new Date().toISOString() })
      .eq("id", listing.id)
      .is("sold_at", null)
      .select("id")
      .maybeSingle();
    if (error || !data) { pushChat("Anúncio não está mais disponível.", "info"); return false; }
    setIdle((s) => ({
      ...s,
      bank: { ...s.bank, gold: s.bank.gold - listing.price },
      items: { ...s.items, [listing.item_id]: (s.items[listing.item_id] ?? 0) + listing.qty },
    }));
    pushChat(`🛒 Comprou ${listing.qty}x ${listing.item_id} por ${listing.price} ouro.`, "cap");
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

  const sellItem = (id: string, qty = 1) => {
    setIdle((s) => {
      const have = s.items[id] ?? 0;
      if (have < qty) { pushChat(`Você não tem ${qty}x ${id}.`, "info"); return s; }
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
  const buyBook = (bk: ShopBook) => {
    setIdle((s) => {
      const useGold = bk.currency === "gold";
      const have = useGold ? s.bank.gold : s.bank.crystals;
      if (have < bk.price) {
        pushChat(useGold ? `Ouro insuficiente para ${bk.name}.` : `Cristais insuficientes para ${bk.name}.`, "info");
        return s;
      }
      if (bk.priceGold && s.bank.gold < bk.priceGold) {
        pushChat(`Ouro insuficiente para ${bk.name} (custa ${bk.priceGold} 🪙 + ${bk.price} 💎).`, "info");
        return s;
      }
      const curQty = s.items[bk.id] ?? 0;
      pushChat(`Comprou ${bk.name}. Use pela Mochila quando quiser.`, "cap");
      const bank0 = useGold
        ? { ...s.bank, gold: s.bank.gold - bk.price }
        : { ...s.bank, crystals: s.bank.crystals - bk.price };
      const bank1 = bk.priceGold ? { ...bank0, gold: bank0.gold - bk.priceGold } : bank0;
      return { ...s, bank: bank1, items: { ...s.items, [bk.id]: curQty + 1 } };
    });
  };

  // ===== Trocador NPC — Orbs de XP por Pokémon capturados =====
  // Só oferece os orbs mais fortes (o menor está na Loja). Consome da coleção
  // (não da equipe) os Pokémon da raridade exigida, com o menor nível primeiro.
  const ORB_TRADES: { orbId: "orb_xp_major" | "orb_xp_supreme"; label: string; rarity: Rarity; count: number; color: string; img: string; desc: string }[] = [
    { orbId: "orb_xp_major",   label: "Orb Maior ✦✦",   rarity: "rare",  count: 3, color: "#c084fc", img: orbXpMajorUrl,   desc: "Entregue 3 Pokémon RAROS da coleção" },
    { orbId: "orb_xp_supreme", label: "Orb Supremo ✦✦✦", rarity: "epic",  count: 2, color: "#ffd94d", img: orbXpSupremeUrl, desc: "Entregue 2 Pokémon ÉPICOS da coleção" },
  ];
  // Estado do NPC Trocador no mapa (modal na tela do mundo)
  const [worldTraderOpen, setWorldTraderOpen] = useState(false);
  const [worldTraderPick, setWorldTraderPick] = useState<null | { orbId: "orb_xp_major" | "orb_xp_supreme"; rarity: Rarity; count: number; color: string; label: string; img: string }>(null);
  const [worldTraderSel, setWorldTraderSel] = useState<Set<string>>(new Set());
  const tradeForOrb = (orbId: "orb_xp_major" | "orb_xp_supreme", uids: string[]) => {
    const trade = ORB_TRADES.find((t) => t.orbId === orbId);
    if (!trade) return;
    setIdle((s) => {
      const col = s.collection ?? [];
      const selected = col.filter((c) => uids.includes(c.uid) && c.rarity === trade.rarity);
      if (selected.length !== trade.count) {
        pushChat(`Selecione exatamente ${trade.count} Pokémon ${trade.rarity.toUpperCase()} para essa troca.`, "info");
        return s;
      }
      const removeSet = new Set(selected.map((c) => c.uid));
      const newCol = col.filter((c) => !removeSet.has(c.uid));
      const cur = s.items[orbId] ?? 0;
      const orbName = orbId === "orb_xp_major" ? "Orb Maior ✦✦" : "Orb Supremo ✦✦✦";
      pushChat(`✦ NPC recebeu ${trade.count} ${trade.rarity.toUpperCase()} e entregou 1 ${orbName}.`, "cap");
      return {
        ...s,
        collection: newCol,
        items: { ...s.items, [orbId]: cur + 1 },
      };
    });
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
    let near: "lab" | "lar" | "azul" | null = null;
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
      if (tm.length >= 5) return tm;
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
        if (tm.length >= 5) return tm;
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
    <div style={{
      height: "100vh",
      background: "#0b0510",
      color: "#f3e5c5",
      fontFamily: "'Trebuchet MS', system-ui, sans-serif",
      overflow: "hidden",
    }}>
      {levelToast && (
        <div style={{
          position: "fixed", top: 90, left: "50%", transform: "translateX(-50%)",
          zIndex: 9999, pointerEvents: "none",
          background: "linear-gradient(135deg, rgba(61,43,82,0.98), rgba(106,61,138,0.98))",
          border: "2px solid #f5cf6b",
          borderRadius: 12, padding: "12px 20px",
          boxShadow: "0 8px 40px rgba(245,207,107,0.5), 0 0 60px rgba(126,242,122,0.4)",
          textAlign: "center", minWidth: 260,
          animation: "lvToastIn 300ms ease-out",
        }}>
          <div style={{ color: "#f5cf6b", fontWeight: 900, fontSize: 20, letterSpacing: 1, textShadow: "0 2px 6px #000" }}>
            ⬆ NÍVEL {levelToast.level}!
          </div>
          <div style={{ color: "#7ef27a", fontSize: 13, fontWeight: 700, marginTop: 6 }}>
            {levelToast.gains.join("  ·  ")}
          </div>
          <div style={{ color: "#f5cf6b", fontSize: 12, marginTop: 4 }}>
            ✨ Bônus extra: <strong>+{levelToast.bonus}</strong>
          </div>
        </div>
      )}


      <div className="idle-grid" style={{
        display: "grid",
        gridTemplateColumns: "minmax(220px, 240px) 1fr minmax(220px, 240px)",
        gridTemplateRows: "1fr auto",
        gap: 8, padding: 8,
        height: "100vh",
        overflow: "hidden",
      }}>


        {/* ============ COLUNA ESQUERDA ============ */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6, minHeight: 0, overflow: "hidden" }}>
          {/* --- PERFIL DE TREINADOR --- */}
          {(() => {
            const leaderP = team[0];
            const trainerLv = idle.trainerLevel ?? 1;
            const nextAt = trainerXpToNext(trainerLv);
            const curXp = idle.trainerXp ?? 0;
            const xpPct = Math.max(0, Math.min(100, (curXp / nextAt) * 100));
            const av = leaderP ? GIF[leaderP.species] : null;
            const name = (identity?.name || "Treinador").slice(0, 16);
            return (
              <div style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "6px 8px",
                background: "linear-gradient(180deg,#2a1a3a,#1a0f2a)",
                border: "1px solid #6b4a8a", borderRadius: 8,
                boxShadow: "inset 0 0 12px rgba(255,217,77,0.08)",
              }}>
                <div style={{
                  width: 46, height: 46, borderRadius: "50%",
                  background: "radial-gradient(circle,#5a3a8a,#1a0f2a)",
                  border: "2px solid #ffd94d",
                  display: "grid", placeItems: "center",
                  boxShadow: "0 0 10px rgba(255,217,77,0.5), inset 0 0 8px rgba(0,0,0,0.4)",
                  position: "relative",
                }}>
                  <div style={{ fontSize: 20, lineHeight: 1 }}>🎓</div>
                  <div style={{
                    position: "absolute", bottom: -4, right: -4,
                    background: "linear-gradient(135deg,#ffd94d,#ff9d2e)",
                    color: "#2a1a0a", fontWeight: 900, fontSize: 10,
                    borderRadius: 8, padding: "1px 5px",
                    border: "1px solid #2a1a0a",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.5)",
                  }}>{trainerLv}</div>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontWeight: 800, color: "#ffe89a" }}>
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>🎓 {name}</span>
                    <span style={{ color: "#ffd94d" }}>Lv.{trainerLv}</span>
                  </div>
                  <div style={{ fontSize: 9, color: "#b8a8c8", marginTop: 1, display: "flex", justifyContent: "space-between" }}>
                    <span>XP</span><span>{curXp}/{nextAt}</span>
                  </div>
                  <div style={{ height: 4, background: "#1a0f2a", borderRadius: 2, marginTop: 1, border: "1px solid #3a2a5a" }}>
                    <div style={{ width: `${xpPct}%`, height: "100%", background: "linear-gradient(90deg,#ffd94d,#ffb84d)", borderRadius: 2 }} />
                  </div>
                  <div style={{ fontSize: 9, color: "#8fd0ff", marginTop: 2, display: "flex", gap: 8 }}>
                    <span>💰 {idle.totals.gold}</span>
                    <span>★ {idle.totals.captured}/151</span>
                    <span style={{ marginLeft: "auto", color: "#c8b8d0" }}>Pokémons: {team.length}/5</span>
                  </div>
                </div>
              </div>
            );
          })()}

          <Panel title="SUA EQUIPE" accent="#c92a2a">
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {team.map((p) => (
                <TeamRow key={p.uid} pet={p} onClick={() => setPetDetailUid(p.uid)} energyTick={energyTick} />
              ))}
              <button style={{ ...smallBtn, marginTop: 2 }} onClick={() => setTab("pokemon")}>Ver todos</button>
            </div>
          </Panel>


          {/* Chat ocupa todo o espaço restante — sem rolagem externa */}
          <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
            <Panel title="REGISTRO DE BATALHA" accent="#1e3a5f">
              <div style={{
                height: 200, minHeight: 160, maxHeight: 240,
                overflowY: "auto", display: "flex", flexDirection: "column-reverse",
                gap: 4, fontSize: 11, lineHeight: 1.35,
                background: "#0e0818", borderRadius: 6, padding: 6,
                border: "1px solid rgba(107,212,255,0.15)",
              }}>
                {(() => {
                  const classify = (m: typeof chat[number]): "system" | "world" | "captures" => {
                    if (m.kind === "capture" || m.kind === "cap") return "captures";
                    if (m.text.startsWith("💬") || m.text.startsWith("🌍")) return "world";
                    return "system";
                  };
                  const filtered = chat.filter((m) => chatFilter === "all" ? true : classify(m) === chatFilter);
                  return (
                    <>
                      {[...filtered].reverse().map((m) => {
                        const color =
                          m.kind === "chest" ? "#ffa64a" :
                          m.kind === "capture" ? "#ff97e1" :
                          m.kind === "cap" ? "#ffd94d" :
                          m.kind === "lv" ? "#6bd4ff" :
                          m.kind === "hit" ? "#ff6b6b" :
                          m.kind === "dmg" ? "#f5cf6b" : "#c8b8d0";
                        const prefix =
                          m.kind === "chest" ? "🎁" :
                          m.kind === "capture" ? "✦" :
                          m.kind === "cap" ? "★" :
                          m.kind === "lv" ? "⬆" :
                          m.kind === "hit" ? "✖" :
                          m.kind === "dmg" ? "⚔" : "•";
                        return (
                          <div key={m.id} style={{ color, textShadow: "1px 1px 0 #000", fontWeight: m.kind === "chest" ? 800 : 400 }}>
                            <span style={{ opacity: 0.7, marginRight: 4 }}>{prefix}</span>{m.text}
                          </div>
                        );
                      })}
                      {filtered.length === 0 && (
                        <div style={{ color: "#6a5a7c", fontStyle: "italic" }}>Nenhum evento neste filtro...</div>
                      )}
                    </>
                  );
                })()}
              </div>
              {/* Filtros do chat */}
              <div style={{ display: "flex", gap: 4, marginTop: 6 }}>
                {([
                  { k: "all", l: "Tudo" },
                  { k: "system", l: "Sistema" },
                  { k: "world", l: "Mundo" },
                  { k: "captures", l: "Capturas" },
                ] as const).map((t) => {
                  const active = chatFilter === t.k;
                  return (
                    <button
                      key={t.k}
                      onClick={() => setChatFilter(t.k)}
                      style={{
                        flex: 1,
                        background: active ? "#1e3a5f" : "#0e0818",
                        color: active ? "#fff" : "#8fa5c0",
                        border: `1px solid ${active ? "#6bd4ff" : "rgba(107,212,255,0.2)"}`,
                        borderRadius: 4, padding: "3px 4px", fontSize: 10, fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >{t.l}</button>
                  );
                })}
              </div>
              {/* Composer do chat global — cooldown 10 min por jogador */}
              {(() => {
                void chatTick;
                const now = Date.now();
                const remainMs = Math.max(0, chatCooldownUntil - now);
                const onCd = remainMs > 0;
                const mm = Math.floor(remainMs / 60000);
                const ss = Math.floor((remainMs % 60000) / 1000).toString().padStart(2, "0");
                const send = () => {
                  const text = chatInput.trim().slice(0, 140);
                  if (!text || onCd) return;
                  const name = identity?.name ?? "Treinador";
                  pushChat(`💬 ${name}: ${text}`, "info");
                  void captureChanRef.current?.send({
                    type: "broadcast",
                    event: "say",
                    payload: { id: identity?.id ?? "self", name, text },
                  });
                  setChatInput("");
                  setChatCooldownUntil(Date.now() + 10 * 60 * 1000);
                };
                return (
                  <div style={{ display: "flex", gap: 4, marginTop: 6 }}>
                    <input
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") send(); }}
                      placeholder={onCd ? `Aguarde ${mm}:${ss}` : "Falar no chat geral (1x a cada 10 min)"}
                      maxLength={140}
                      disabled={onCd}
                      style={{
                        flex: 1, background: "#0e0818", color: "#f3e5c5",
                        border: "1px solid rgba(107,212,255,0.25)", borderRadius: 6,
                        padding: "6px 8px", fontSize: 11, outline: "none",
                        opacity: onCd ? 0.6 : 1,
                      }}
                    />
                    <button
                      onClick={send}
                      disabled={onCd || !chatInput.trim()}
                      style={{
                        background: onCd ? "#3a1010" : "#1e3a5f", color: "#fff",
                        border: "1px solid rgba(107,212,255,0.4)", borderRadius: 6,
                        padding: "6px 10px", fontSize: 11, fontWeight: 800,
                        cursor: onCd ? "not-allowed" : "pointer",
                      }}
                    >
                      {onCd ? `${mm}:${ss}` : "Enviar"}
                    </button>
                  </div>
                );
              })()}
            </Panel>
          </div>
        </div>





        {/* ============ CENTRO — ARENA (viewport com câmera) ============ */}
        <div
          ref={viewportRef}
          onClick={(e) => {
            const t = e.target as HTMLElement;
            if (t.closest && t.closest("button, a, input, select, textarea")) return;
            const rect = viewportRef.current?.getBoundingClientRect();
            if (!rect) return;
            const sx = e.clientX - rect.left;
            const sy = e.clientY - rect.top;
            const wx = camX + sx / zoom;
            const wy = camY + sy / zoom;
            walkTargetRef.current = { x: wx, y: wy, label: "destino", resumeAuto: autoRef.current };
            setWalkingTo("destino");
            setAuto(false);
          }}
          style={{
            position: "relative",
            borderRadius: 12,
            overflow: "hidden",
            background: viewportBg,
            minHeight: 520,
            height: "calc(100vh - 110px)",
            boxShadow: "inset 0 0 40px rgba(0,0,0,0.6)",
            cursor: "crosshair",
          }}
        >


          {/* ===== Controles (zoom + config + ranking) ===== */}
          <div style={{
            position: "absolute", top: 8, right: 8, zIndex: 55,
            pointerEvents: "auto", display: "flex", flexDirection: "column", gap: 4,
          }}>
            {(() => {
              const ZOOM_LEVELS = [0.5, 0.6, 0.7, 0.75, 1, 1.25, 1.5, 1.75, 2, 2.5];
              const curIdx = (() => {
                let best = 0, bd = Infinity;
                for (let i = 0; i < ZOOM_LEVELS.length; i++) {
                  const d = Math.abs(ZOOM_LEVELS[i] - zoom);
                  if (d < bd) { bd = d; best = i; }
                }
                return best;
              })();
              return (
                <>
                  <button onClick={() => { playClick(); setZoom(ZOOM_LEVELS[Math.min(ZOOM_LEVELS.length - 1, curIdx + 1)]); }} style={zoomBtn}>+</button>
                  <div style={{ ...zoomBtn, cursor: "default", fontSize: 10 }}>{Math.round(zoom * 100)}%</div>
                  <button onClick={() => { playClick(); setZoom(ZOOM_LEVELS[Math.max(0, curIdx - 1)]); }} style={zoomBtn}>−</button>
                </>
              );
            })()}
            <button onClick={() => { playClick(); setTab("config"); }} style={{ ...zoomBtn, marginTop: 6, fontSize: 14 }} title="Configurações">⚙</button>
            <button
              onClick={() => { playClick(); setRankOpen(true); }}
              style={{
                ...zoomBtn,
                padding: 0,
                background: "transparent",
                border: "none",
                boxShadow: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              title="Ranking — Top 20 níveis"
            >
              <img
                src={assetUrlFromJson(trophyIconAsset)}
                alt="Ranking"
                width={30}
                height={30}
                style={{ imageRendering: "pixelated", filter: "drop-shadow(0 2px 3px rgba(0,0,0,0.6))" }}
                draggable={false}
              />
            </button>
            {(() => {
              const orbUntil = idle.buffs.orbUntil ?? 0;
              const remain = orbUntil - Date.now();
              if (remain <= 0) return null;
              const orbId = idle.buffs.orbId || "orb_xp_minor";
              const orbImg = orbId === "orb_xp_supreme" ? orbXpSupremeUrl : orbId === "orb_xp_major" ? orbXpMajorUrl : orbXpMinorUrl;
              const orbPct = Math.round((idle.buffs.orbMult ?? 0) * 100);
              const mins = Math.floor(remain / 60000);
              const secs = Math.floor((remain % 60000) / 1000);
              const timeStr = mins > 0 ? `${mins}m ${secs.toString().padStart(2, "0")}s` : `${secs}s`;
              return (
                <div
                  title={`Orb ativo: +${orbPct}% EXP · ${timeStr}`}
                  style={{
                    marginTop: 4,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 2,
                    padding: "3px 5px",
                    background: "rgba(15,10,30,0.85)",
                    border: "1px solid #7c5cff",
                    borderRadius: 6,
                    boxShadow: "0 0 8px rgba(124,92,255,0.5)",
                  }}
                >
                  <img
                    src={orbImg}
                    alt="Orb ativo"
                    width={22}
                    height={22}
                    style={{ imageRendering: "pixelated", filter: "drop-shadow(0 0 4px rgba(180,120,255,0.9))" }}
                    draggable={false}
                  />
                  <span style={{ fontSize: 9, color: "#e0d0ff", fontWeight: 700, lineHeight: 1, whiteSpace: "nowrap" }}>
                    {timeStr}
                  </span>
                </div>
              );
            })()}
            {(() => {
              const rareUntil = idle.buffs.honeyRareUntil ?? 0;
              const normalUntil = idle.buffs.honeyUntil ?? 0;
              const isRare = rareUntil > Date.now();
              const until = isRare ? rareUntil : normalUntil;
              const remain = until - Date.now();
              if (remain <= 0) return null;
              const mins = Math.floor(remain / 60000);
              const secs = Math.floor((remain % 60000) / 1000);
              const timeStr = mins > 0 ? `${mins}m ${secs.toString().padStart(2, "0")}s` : `${secs}s`;
              const pct = isRare ? 20 : 10;
              const icon = isRare ? "✨🍯" : "🍯";
              return (
                <div
                  title={`Incenso ${isRare ? "Raro" : "de Mel"} ativo: +${pct}% drop/xp/def/velocidade · ${timeStr}`}
                  style={{
                    marginTop: 4,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 2,
                    padding: "3px 5px",
                    background: isRare ? "rgba(50,30,5,0.9)" : "rgba(40,25,5,0.85)",
                    border: `1px solid ${isRare ? "#ffd94d" : "#ffb84d"}`,
                    borderRadius: 6,
                    boxShadow: `0 0 ${isRare ? 12 : 8}px rgba(255,${isRare ? 217 : 184},${isRare ? 77 : 77},0.65)`,
                  }}
                >
                  <span style={{ fontSize: 16, lineHeight: 1, filter: "drop-shadow(0 0 4px rgba(255,214,80,0.9))" }}>{icon}</span>
                  <span style={{ fontSize: 9, color: "#ffe9a8", fontWeight: 700, lineHeight: 1, whiteSpace: "nowrap" }}>
                    {timeStr}
                  </span>
                </div>
              );
            })()}
          </div>




          {/* Clima estilo pixel-RPG */}
          {weather !== "clear" && (
            <div style={{
              position: "absolute", inset: 0, zIndex: 40,
              pointerEvents: "none", overflow: "hidden",
              imageRendering: "pixelated",
            }}>
              {weather === "rain" && (
                <>
                  <div className="wx-rain-tint" />
                  <div className="wx-mist" />
                  {rainDrops.map((d, i) => (
                    <span key={i} className="wx-drop" style={{
                      left: `${d.left}%`,
                      width: d.w,
                      height: d.len,
                      opacity: d.op,
                      animationDelay: `-${d.delay}s`,
                      animationDuration: `${d.dur}s`,
                    }} />
                  ))}
                  <div className="wx-flash" />
                </>
              )}
              {weather === "snow" && (
                <>
                  <div className="wx-snow-tint" />
                  {snowFlakes.map((s, i) => (
                    <span key={i} className="wx-flake" style={{
                      left: `${s.left}%`,
                      width: s.size,
                      height: s.size,
                      opacity: s.op,
                      animationDelay: `-${s.delay}s`,
                      animationDuration: `${s.dur}s`,
                      ["--drift" as string]: `${s.drift}px`,
                    } as React.CSSProperties} />
                  ))}
                </>
              )}
              <div style={{
                position: "absolute", top: 8, left: "50%", transform: "translateX(-50%)",
                background: "rgba(11,5,16,0.75)",
                border: `1px solid ${weather === "rain" ? "rgba(140,201,255,0.5)" : "rgba(230,243,255,0.55)"}`,
                color: weather === "rain" ? "#bcdcff" : "#f2faff",
                padding: "4px 12px", borderRadius: 4, fontSize: 11, fontWeight: 700,
                letterSpacing: 0.5, imageRendering: "pixelated",
                fontFamily: "'Press Start 2P', 'Trebuchet MS', monospace",
                textShadow: "1px 1px 0 #000",
              }}>
                {weather === "rain" ? "CHUVA" : "NEVE"}
              </div>
            </div>
          )}


            {/* Contador de jogadores online removido a pedido do usuário */}




          {/* MUNDO — camada em px que se move sob a câmera */}
          <div style={{
            position: "absolute",
            left: 0, top: 0,
            width: WORLD_W, height: WORLD_H,
            transform: `scale(${zoom}) translate3d(${-camX}px, ${-camY}px, 0)`,
            transformOrigin: "0 0",
            transition: "transform 120ms linear",
            backgroundColor: viewportBg,
            backgroundImage: `url(${map.bg})`,
            backgroundSize: `${WORLD_W}px ${WORLD_H}px`,
            backgroundRepeat: "no-repeat",
            imageRendering: "pixelated",
          }}>

            {/* Obstáculos (árvores, pedras) — z-index pela BASE (y) para o treinador passar por trás */}
            {obstacles.map((o) => (
              <img key={`obs-${o.id}`} src={o.src} alt="" style={{
                position: "absolute",
                left: o.x - o.w / 2,
                top: o.y - o.h + 8, // âncora na base
                width: o.w, height: o.h,
                opacity: transparentObstacleIds.has(o.id) ? 0.38 : 1,
                imageRendering: "pixelated",
                pointerEvents: "none",
                transition: "opacity 120ms linear",
                zIndex: Math.round(o.y),
                filter: "drop-shadow(0 2px 2px rgba(0,0,0,0.35))",
              }} />
            ))}

            {/* Clique nos casulos (Ninho de Marimbondo) — abre painel de Colmeia p/ posicionar Beedrills */}
            {idle.currentMap === "terra" && obstacles.filter((o) => o.src === hornetCocoonUrl).map((o) => {
              const cocoonKey = `terra:${Math.round(o.x)}:${Math.round(o.y)}`;
              const beedrillCount = (idle.collection ?? []).filter((c) => c.species === "beedrill").length;
              const canUse = beedrillCount > 0;
              return (
                <button
                  key={`cocoon-btn-${o.id}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!canUse) {
                      pushChat("🐝 Você precisa ter pelo menos 1 Beedrill na coleção para usar a colmeia!", "info");
                      return;
                    }
                    setHoneyShop({ cocoonKey, x: o.x, y: o.y - o.h });
                  }}
                  title={canUse ? "Colmeia — posicionar Beedrills p/ produzir Incenso" : "Requer Beedrill na coleção"}
                  style={{
                    position: "absolute",
                    left: o.x - o.w / 2,
                    top: o.y - o.h + 8,
                    width: o.w, height: o.h,
                    background: "transparent",
                    border: canUse ? "2px dashed rgba(255,214,80,0.85)" : "2px dashed rgba(255,255,255,0.25)",
                    borderRadius: 12,
                    cursor: canUse ? "pointer" : "not-allowed",
                    zIndex: Math.round(o.y) + 1,
                    padding: 0,
                    boxShadow: canUse ? "0 0 12px rgba(255,214,80,0.55)" : "none",
                    animation: canUse ? "lvglow 1.6s ease-in-out infinite" : "none",
                  }}
                />
              );
            })}

            {/* Modal do Ranking Global */}
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
                    width: "min(640px, 96vw)", maxHeight: "88vh", display: "flex", flexDirection: "column",
                    background: "linear-gradient(180deg, #1a0f2a 0%, #241536 50%, #2b1a3d 100%)",
                    border: "2px solid #ffd94d",
                    borderRadius: 16,
                    boxShadow: "0 20px 60px rgba(0,0,0,0.9), 0 0 40px rgba(255,214,80,0.35), inset 0 1px 0 rgba(255,255,255,0.1)",
                    color: "#ffe9a8",
                    overflow: "hidden",
                  }}
                >
                  {/* Header */}
                  <div style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "16px 18px",
                    background: "linear-gradient(180deg, rgba(255,214,80,0.18), rgba(255,214,80,0.02))",
                    borderBottom: "1px solid rgba(255,214,80,0.35)",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <img src={assetUrlFromJson(trophyIconAsset)} alt="" style={{ width: 32, height: 32, imageRendering: "pixelated", filter: "drop-shadow(0 0 6px rgba(255,214,80,0.7))" }} />
                      <div>
                        <div style={{ fontWeight: 900, fontSize: 18, color: "#ffd94d", letterSpacing: 0.5 }}>RANKING GLOBAL</div>
                        <div style={{ fontSize: 10, opacity: 0.7 }}>Top 50 treinadores do mundo</div>
                      </div>
                    </div>
                    <button
                      onClick={() => setRankOpen(false)}
                      style={{
                        background: "rgba(255,214,80,0.12)", border: "1px solid rgba(255,214,80,0.4)",
                        color: "#ffe9a8", cursor: "pointer", fontSize: 18, width: 32, height: 32,
                        borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center",
                      }}
                    >×</button>
                  </div>

                  {/* Tabs */}
                  <div style={{ display: "flex", gap: 6, padding: "10px 14px 0", background: "rgba(0,0,0,0.2)" }}>
                    {([
                      { k: "trainer", label: "🎓 Nível Treinador" },
                      { k: "craft", label: "⚒️ Pontos de Craft" },
                    ] as { k: RankMode; label: string }[]).map((t) => {
                      const active = rankMode === t.k;
                      return (
                        <button
                          key={t.k}
                          onClick={() => setRankMode(t.k)}
                          style={{
                            flex: 1, padding: "8px 6px", fontSize: 11, fontWeight: 700,
                            background: active ? "linear-gradient(180deg, #ffd94d, #d99b1a)" : "rgba(255,255,255,0.04)",
                            color: active ? "#2b1a0a" : "#ffe9a8",
                            border: `1px solid ${active ? "#ffd94d" : "rgba(255,214,80,0.2)"}`,
                            borderRadius: "8px 8px 0 0",
                            cursor: "pointer",
                            borderBottom: active ? "none" : "1px solid rgba(255,214,80,0.2)",
                          }}
                        >{t.label}</button>
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
                      <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                        {rankRows.map((r, i) => {
                          const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`;
                          const topColor = i === 0 ? "#ffd94d" : i === 1 ? "#e5e5e5" : i === 2 ? "#d99b1a" : "#ffe9a8";
                          const mainVal = rankMode === "craft" ? r.craft_points : r.trainer_level;
                          const mainLabel = rankMode === "craft" ? "Craft" : "Treinador Lv";
                          return (
                            <div key={r.id} style={{
                              display: "grid",
                              gridTemplateColumns: "48px 1fr auto",
                              alignItems: "center",
                              gap: 12,
                              padding: "10px 12px",
                              background: i < 3
                                ? "linear-gradient(90deg, rgba(255,214,80,0.15), rgba(255,214,80,0.03))"
                                : "rgba(255,255,255,0.03)",
                              border: `1px solid ${i < 3 ? "rgba(255,214,80,0.4)" : "rgba(255,255,255,0.06)"}`,
                              borderRadius: 10,
                              boxShadow: i < 3 ? "0 2px 8px rgba(255,214,80,0.1)" : "none",
                            }}>
                              <div style={{ fontWeight: 800, color: topColor, fontSize: i < 3 ? 22 : 15, textAlign: "center" }}>{medal}</div>
                              <div style={{ overflow: "hidden", minWidth: 0 }}>
                                <div style={{ fontWeight: 700, fontSize: 14, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                  {r.name}
                                  {r.guild_name && <span style={{ marginLeft: 6, fontSize: 10, opacity: 0.75, color: "#a5d0ff" }}>[{r.guild_name}]</span>}
                                </div>
                                <div style={{ fontSize: 10, opacity: 0.7, display: "flex", gap: 8, flexWrap: "wrap" }}>
                                  <span style={{ textTransform: "capitalize" }}>
                                    ⭐ {(r.leader_species ?? "—").replace(/_/g, " ")}
                                  </span>
                                  <span>🎓 Tr {r.trainer_level}</span>
                                  <span>⚒️ {r.craft_points}</span>
                                </div>
                              </div>
                              <div style={{ textAlign: "right" }}>
                                <div style={{ fontSize: 9, opacity: 0.6, textTransform: "uppercase", letterSpacing: 0.5 }}>{mainLabel}</div>
                                <div style={{ fontWeight: 900, fontSize: 20, color: topColor, lineHeight: 1 }}>{mainVal}</div>
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
                    src={b.key === "lab" ? houseLabImg : houseLarImg}
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
                    {/* Placa de requisito */}
                    <div style={{
                      position: "absolute", top: -26, left: "50%", transform: "translateX(-50%)",
                      background: "rgba(11,5,16,0.92)",
                      color: locked ? "#fca5a5" : "#fde68a",
                      border: `1px solid ${locked ? "#ef4444" : p.color}`,
                      borderRadius: 4, padding: "2px 8px", fontSize: 10, fontWeight: 800,
                      whiteSpace: "nowrap", letterSpacing: 0.5,
                    }}>
                      {p.reqLevel ? `TREINADOR Nv ${p.reqLevel}${locked ? ` • FALTA ${p.reqLevel - lv}` : " ✓"}` : "← VOLTAR"}
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





            {/* Inimigos espalhados pelo mapa */}
            {enemies.map((e) => {
              const src = GIF[e.sp];
              if (!src) return null;
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
              const showAura = e.rarity !== "common";
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
              const stars = rarityStars[e.rarity];
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
                  filter: showAura
                    ? `drop-shadow(0 0 ${auraStrength}px ${auraColor}) drop-shadow(0 0 ${auraStrength / 2}px ${auraColor}) drop-shadow(0 3px 2px rgba(0,0,0,0.55))`
                    : (e.aggressive ? "drop-shadow(0 0 6px rgba(255,60,60,0.9)) drop-shadow(0 3px 2px rgba(0,0,0,0.55))" : "drop-shadow(0 3px 2px rgba(0,0,0,0.55))"),
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
                  <img src={src} alt="" style={{ width: "100%", imageRendering: "pixelated" }} />

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
              left: trainerPos.x, top: trainerPos.y,
              width: 56, height: 56,
              transform: "translate(-50%, -50%)",
              transition: "left 120ms linear, top 120ms linear",
              filter: "drop-shadow(0 3px 3px rgba(0,0,0,0.6))",
              zIndex: Math.round(trainerPos.y),
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
              // Lunge: avança 45% do caminho até o alvo e volta (curva senoidal)
              let lungeX = 0, lungeY = 0;
              if (attackAnim) {
                const dt = Math.min(1, (Date.now() - attackAnim.ts) / 380);
                const wave = Math.sin(dt * Math.PI); // 0 → 1 → 0
                lungeX = (attackAnim.toX - attackAnim.fromX) * 0.45 * wave;
                lungeY = (attackAnim.toY - attackAnim.fromY) * 0.45 * wave;
              }
              const leaderX = followerX + lungeX;
              const leaderY = followerY + lungeY;
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

            {/* Slash / impacto de ataque */}
            {attackAnim && (() => {
              const dt = Math.min(1, (Date.now() - attackAnim.ts) / 380);
              const opacity = dt < 0.6 ? 1 : 1 - (dt - 0.6) / 0.4;
              const scale = 0.6 + dt * 0.8;
              const size = attackAnim.crit ? 104 : 78;
              const el = attackAnim.element;
              const src = ELEMENT_FX_IMG[el];
              const glow = ELEMENT_FX_GLOW[el];
              const rot = attackAnim.crit ? dt * 180 : dt * 60;
              return (
                <img key={attackAnim.id} src={src} alt="" style={{
                  position: "absolute",
                  left: attackAnim.toX, top: attackAnim.toY,
                  width: size, height: size,
                  transform: `translate(-50%, -50%) scale(${scale}) rotate(${rot}deg)`,
                  opacity,
                  pointerEvents: "none",
                  filter: attackAnim.crit
                    ? `drop-shadow(0 0 14px ${glow}) drop-shadow(0 0 8px #ffd94d)`
                    : `drop-shadow(0 0 10px ${glow})`,
                  mixBlendMode: "screen",
                  zIndex: 7,
                }} />
              );
            })()}

            {/* FX de contra-ataque do inimigo (elemento do alvo → em cima do meu poke) */}
            {enemyAttackAnim && (() => {
              const dt = Math.min(1, (Date.now() - enemyAttackAnim.ts) / 380);
              const opacity = dt < 0.6 ? 1 : 1 - (dt - 0.6) / 0.4;
              const scale = 0.55 + dt * 0.7;
              const el = enemyAttackAnim.element;
              const src = ELEMENT_FX_IMG[el];
              const glow = ELEMENT_FX_GLOW[el];
              const rot = -dt * 60;
              return (
                <img key={enemyAttackAnim.id} src={src} alt="" style={{
                  position: "absolute",
                  left: enemyAttackAnim.toX, top: enemyAttackAnim.toY,
                  width: 72, height: 72,
                  transform: `translate(-50%, -50%) scale(${scale}) rotate(${rot}deg)`,
                  opacity,
                  pointerEvents: "none",
                  filter: `drop-shadow(0 0 10px ${glow}) drop-shadow(0 0 4px #ff3b3b)`,
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

          {/* ============ UI FIXA (não rola com o mapa) ============ */}
          {/* Header do mapa — barra horizontal compacta */}
          <div style={{
            position: "absolute", top: 8, left: 8,
            display: "inline-flex", alignItems: "center", gap: 10,
            background: "linear-gradient(90deg, rgba(11,5,16,0.9), rgba(20,10,30,0.78))",
            padding: "6px 12px",
            borderRadius: 10,
            border: "1px solid rgba(245,207,107,0.3)",
            boxShadow: "0 2px 10px rgba(0,0,0,0.45)",
            zIndex: 10,
            fontSize: 12,
            maxWidth: "calc(100% - 16px)",
          }}>
            <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
              <div style={{ fontWeight: 800, fontSize: 14, color: "#f5cf6b", lineHeight: 1.1, whiteSpace: "nowrap" }}>
                {map.name}
              </div>
              <div style={{ fontSize: 10, color: "#c8b8d0", lineHeight: 1.1, whiteSpace: "nowrap" }}>
                {map.diff} · Lv {team[0]?.level ?? 1} · <span style={{ color: "#f5cf6b" }}>{fmtHMS(activeTime)}</span>
              </div>
            </div>

            <div style={{ width: 1, height: 26, background: "rgba(245,207,107,0.25)" }} />

            <div style={{ display: "inline-flex", alignItems: "center", gap: 10, fontWeight: 700 }}>
              <span title="Ouro" style={{ color: "#f4c430", display: "inline-flex", alignItems: "center", gap: 3 }}>
                ●{fmtK(idle.bank.gold)}
              </span>
              <span title="Cristais" style={{ color: "#5eead4", display: "inline-flex", alignItems: "center", gap: 3 }}>
                <img src={crystalGreenImg} alt="" width={14} height={14} style={{ imageRendering: "pixelated" }} />
                {Math.floor(idle.bank.crystals)}
              </span>
            </div>

            <div style={{ width: 1, height: 26, background: "rgba(245,207,107,0.25)" }} />

            <div style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
              <span title="Pokébola" style={{ display: "inline-flex", alignItems: "center", gap: 2, fontSize: 11, fontWeight: 700 }}>
                <img src={ballPokeImg} alt="" width={16} height={16} style={{ imageRendering: "pixelated" }} />
                {idle.items.pokeball ?? 0}
              </span>
              <span title="Great Ball" style={{ display: "inline-flex", alignItems: "center", gap: 2, fontSize: 11, fontWeight: 700 }}>
                <img src={ballGreatImg} alt="" width={16} height={16} style={{ imageRendering: "pixelated" }} />
                {idle.items.greatball ?? 0}
              </span>
              <span title="Ultra Ball" style={{ display: "inline-flex", alignItems: "center", gap: 2, fontSize: 11, fontWeight: 700 }}>
                <img src={ballUltraImg} alt="" width={16} height={16} style={{ imageRendering: "pixelated" }} />
                {idle.items.ultraball ?? 0}
              </span>
            </div>
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
            const bColor = nearBuilding === "lab" ? "#c084fc" : nearBuilding === "azul" ? "#4a9eff" : "#5ec26a";
            const bEmoji = nearBuilding === "lab" ? "🔬" : nearBuilding === "azul" ? "🏡" : "🏠";
            const bLabel = nearBuilding === "lab" ? "Laboratório" : nearBuilding === "azul" ? "Casa Azul" : "Lar";
            const bDesc = nearBuilding === "lab"
              ? "Resetar sua jornada"
              : nearBuilding === "azul"
                ? "Restaura energia em 5 min"
                : "Descansar (leva 1 hora)";
            const bAction = nearBuilding === "lab" ? "RESETAR" : "DESCANSAR";
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
                    if (nearBuilding === "lab") resetAccount();
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
              )}
              <div style={{
                background: "rgba(11,5,16,0.9)", border: "1px solid rgba(245,207,107,0.4)",
                borderRadius: 10, padding: "8px 12px", display: "flex", alignItems: "center", gap: 10,
              }}>
                <button
                  onClick={() => { setAB({ enabled: !on }); setAuto(!on); if (!on) { walkTargetRef.current = null; setWalkingTo(null); } }}
                  title={on ? "Auto-batalha ATIVA (clique para desativar)" : "Auto-batalha desativada (clique para ativar)"}
                  style={{
                    background: "transparent", border: "none", padding: 0, cursor: "pointer",
                    width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center",
                    position: "relative",
                  }}
                >
                  <img
                    src={autoIconImg}
                    alt="Auto"
                    width={40}
                    height={40}
                    style={{
                      width: 40, height: 40, imageRendering: "pixelated",
                      filter: on
                        ? "drop-shadow(0 0 6px #5ec26a) drop-shadow(0 0 10px rgba(94,194,106,0.6))"
                        : "grayscale(1) opacity(0.55)",
                      animation: on ? "autoIconPulse 1.2s ease-in-out infinite, autoIconSpin 6s linear infinite" : "none",
                      transformOrigin: "50% 50%",
                    }}
                  />
                </button>
                <div style={{ fontSize: 10, color: "#c8b8d0", minWidth: 90 }}>
                  Lv.{team[0]?.level ?? 1} · EXP {team[0]?.xp ?? 0}/{100 + (team[0]?.level ?? 1) * 20}
                </div>
                <button
                  onClick={() => setShowAutoSettings((v) => !v)}
                  title="Configurar"
                  style={{
                    background: showAutoSettings ? "#f5cf6b" : "rgba(255,255,255,0.06)",
                    color: showAutoSettings ? "#0b0510" : "#f5cf6b",
                    border: "1px solid rgba(245,207,107,0.5)",
                    borderRadius: 8, width: 30, height: 30, cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 16,
                  }}
                >⚙</button>
              </div>
            </div>
            );
          })()}


          {/* ===== OVERLAY DE ABAS (Pokémon / Mochila / Coleção) ===== */}
          {tab !== "batalha" && (
            <TabOverlay
              tab={tab}
              onClose={() => setTab("batalha")}
              leader={team[0]}
              team={team}
              onReorderTeam={(nt) => { setTeam(nt); if (nt[0]) setLeaderHp(calcIdleMaxHp(nt[0])); }}
              leaderHp={leaderHp}
              items={idle.items}
              caughtSpecies={idle.caughtSpecies}
              seenSpecies={idle.seenSpecies}
              totals={idle.totals}
              collection={idle.collection ?? []}
              craftPoints={idle.craftPoints ?? 0}
              onFragmentCollection={fragmentCollection}
              gifMap={GIF}
              onPickTeam={(entry) => onPickTeamFromColecao(entry)}
              onUseItem={useItem}
              bank={idle.bank}
              buffs={idle.buffs}
              onBuyBall={buyBall}
              onBuyBook={buyBook}
              orbTrades={ORB_TRADES}
              onTradeOrb={tradeForOrb}
              onBuyPotion={buyPotion}
              onBuyEgg={buyEgg}
              shopEggs={SHOP_EGGS}

              onBuyChestAmulet={buyChestAmulet}
              chestAmuletOwned={idle.items?.chest_amulet ?? 0}
              autoHeal={idle.autoHeal}
              setAutoHeal={(next) => setIdle((s) => ({ ...s, autoHeal: next }))}
              audioSettings={audioSettings}
              setAudioSettings={setAudioSettings}
              tasks={idle.tasks}
              onClaimTask={claimTask}
              onOpenColecaoDetail={(uid) => setColecaoDetailUid(uid)}
              onExchange={exchange}
              onSellItem={sellItem}
              marketSellPrices={MARKET_SELL_PRICE}
              identity={identity}
              onListMarket={listMarketItem}
              onBuyMarket={buyMarketListing}
              onCancelMarket={cancelMarketListing}
              isVip={isVip()}
              pokemonMarketNode={
                <PokemonMarketPanel
                  identity={identity}
                  collection={idle.collection ?? []}
                  gold={idle.bank.gold}
                  crystals={idle.bank.crystals}
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
        </div>


        {/* ============ COLUNA DIREITA ============ */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8, minHeight: 0, overflowY: "auto" }}>
          <Panel title="MAPA ATUAL" accent="#3d2b52">
            {(() => {
              const leaderLv = team[0]?.level ?? 1;
              const goTo = (label: string, x: number, y: number, onArrive?: () => void) => {
                walkTargetRef.current = { x, y, label, onArrive, resumeAuto: autoRef.current };
                setWalkingTo(label);
                setAuto(false);
                pushChat(`Indo para ${label}…`, "info");
              };
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
              };
              const currentGates = gatesByMap[idle.currentMap] ?? [];
              const travelToGate = (g: GateDef) => {
                const targetMap = IDLE_MAPS[g.target];
                const unlocked = (idle.trainerLevel ?? 1) >= targetMap.minLevel;
                if (!unlocked) {
                  pushChat(`🔒 ${targetMap.name} exige Treinador Lv ${targetMap.minLevel} para entrar.`, "info");
                  return;
                }
                if (targetMap.cycle) {
                  const w = caveWindow();
                  if (!w.open) {
                    pushChat(`⛰ ${targetMap.name} fechada. Abre em ${fmtMS(w.msUntilChange)}.`, "info");
                    return;
                  }
                }
                if (targetMap.entryCrystals && idle.currentMap !== g.target) {
                  const cost = targetMap.entryCrystals;
                  if (idle.bank.crystals < cost) {
                    pushChat(`💎 ${targetMap.name} exige ${cost} cristais para entrar (você tem ${idle.bank.crystals}).`, "info");
                    return;
                  }
                  setIdle((s) => ({ ...s, bank: { ...s.bank, crystals: s.bank.crystals - cost } }));
                  pushChat(`💎 Pagou ${cost} cristais para entrar em ${targetMap.name}.`, "cap");
                }
                playClick();
                goTo(targetMap.name, g.x, g.y, () => {
                  setIdle((s) => ({ ...s, currentMap: g.target }));
                  setTrainerPos({ x: g.arriveX, y: g.arriveY });
                  // Remove inimigos que excedem o teto do novo mapa
                  const cap = IDLE_MAPS[g.target].maxLevel;
                  if (cap != null) setEnemies((prev) => prev.filter((e) => (e.level ?? 1) <= cap));
                  pushChat(`Chegou em ${targetMap.name}!`, "cap");
                });
              };

              const renderMap = (interactive: boolean, big: boolean) => (
                <div style={{
                  width: big ? "100%" : "min(100%, calc(180px * " + (WORLD_W / WORLD_H) + "))",
                  aspectRatio: `${WORLD_W} / ${WORLD_H}`, borderRadius: 6, overflow: "hidden",
                  background: `url(${map.bg}) center/cover`, position: "relative",
                  border: "1px solid rgba(245,207,107,0.4)",
                  margin: "0 auto",
                }}>
                  {/* Overlay de recolorização (mapas endgame recolorizados) */}
                  {map.overlay && (
                    <div style={{
                      position: "absolute", inset: 0,
                      background: map.overlay,
                      mixBlendMode: "color",
                      pointerEvents: "none",
                    }} />
                  )}
                  {visibleBuildings.map((b) => (
                    <button
                      key={b.key}
                      title={`Ir ao ${b.label}`}
                      onClick={interactive ? () => { goTo(b.label, b.x, b.y - 40); if (big) setBigMapOpen(false); } : undefined}
                      className={interactive ? "map-pulse-dot" : undefined}
                      style={{
                        position: "absolute",
                        left: `${(b.x / WORLD_W) * 100}%`,
                        top: `${(b.y / WORLD_H) * 100}%`,
                        transform: "translate(-50%,-50%)",
                        fontSize: big ? 22 : 12, lineHeight: 1,
                        background: "transparent", border: "none", padding: 0,
                        cursor: interactive ? "pointer" : "default",
                        filter: interactive ? `drop-shadow(0 0 ${big ? 8 : 4}px ${b.color})` : "none",
                      }}
                    >{b.emoji}</button>
                  ))}
                  {/* Portais para outros mapas */}
                  {currentGates.map((g) => {
                    const targetMap = IDLE_MAPS[g.target];
                    const unlocked = (idle.trainerLevel ?? 1) >= targetMap.minLevel;
                    const label = unlocked ? targetMap.name : `${targetMap.name} (Lv ${targetMap.minLevel})`;
                    return (
                      <button
                        key={g.key}
                        onClick={interactive ? () => { travelToGate(g); if (big) setBigMapOpen(false); } : undefined}
                        title={label}
                        className={interactive && unlocked ? "map-pulse-dot" : undefined}
                        style={{
                          position: "absolute",
                          left: `${(g.x / WORLD_W) * 100}%`,
                          top: `${(g.y / WORLD_H) * 100}%`,
                          transform: "translate(-50%,-50%)",
                          width: big ? 26 : 12, height: big ? 26 : 12, borderRadius: "50%",
                          background: unlocked ? g.color : "#5a5a5a",
                          border: `2px solid ${unlocked ? "#eafff0" : "#8a8a8a"}`,
                          cursor: interactive && unlocked ? "pointer" : "not-allowed",
                          padding: 0,
                          boxShadow: unlocked ? `0 0 ${big ? 12 : 6}px ${g.color}` : "none",
                        }}
                      />
                    );
                  })}
                  {/* Inimigos */}
                  {enemies.filter((e) => e.hp > 0).map((e) => (
                    <div key={e.id} style={{
                      position: "absolute",
                      left: `${(e.x / WORLD_W) * 100}%`,
                      top: `${(e.y / WORLD_H) * 100}%`,
                      width: big ? 9 : 5, height: big ? 9 : 5, borderRadius: "50%",
                      background: e.elite ? "#f5cf6b" : "#e34a4a",
                      transform: "translate(-50%,-50%)",
                      boxShadow: "0 0 3px #000",
                    }} />
                  ))}
                  {/* Baús */}
                  {chests.filter((c) => !c.opened).map((c) => (
                    <div key={c.id} style={{
                      position: "absolute",
                      left: `${(c.x / WORLD_W) * 100}%`,
                      top: `${(c.y / WORLD_H) * 100}%`,
                      width: big ? 9 : 5, height: big ? 9 : 5, borderRadius: 1,
                      background: "#f4c430",
                      transform: "translate(-50%,-50%)",
                    }} />
                  ))}
                  {/* Outros jogadores no mesmo mapa */}
                  {visibleMapPlayers.map((rp) => (
                    <div key={`mm-${rp.id}`} title={rp.name} style={{
                      position: "absolute",
                      left: `${(rp.x / WORLD_W) * 100}%`,
                      top: `${(rp.y / WORLD_H) * 100}%`,
                      width: big ? 12 : 7, height: big ? 12 : 7, borderRadius: "50%",
                      background: "#c084fc",
                      border: "2px solid #fff",
                      transform: "translate(-50%,-50%)",
                      boxShadow: "0 0 6px #c084fc",
                    }} />
                  ))}
                  {/* Treinador */}
                  <div style={{
                    position: "absolute",
                    left: `${(trainerPos.x / WORLD_W) * 100}%`,
                    top: `${(trainerPos.y / WORLD_H) * 100}%`,
                    width: big ? 16 : 9, height: big ? 16 : 9, borderRadius: "50%",
                    background: "#6bd4ff",
                    border: "2px solid #fff",
                    transform: "translate(-50%,-50%)",
                    boxShadow: "0 0 8px #6bd4ff",
                  }} />

                </div>
              );

              return (
                <>
                  <div style={{ position: "relative" }}>
                    {renderMap(true, false)}
                    <button
                      onClick={() => { playClick(); setBigMapOpen(true); }}
                      title="Abrir mapa grande"
                      style={{
                        position: "absolute", top: 4, right: 4,
                        background: "rgba(11,5,16,0.8)", border: "1px solid #f5cf6b",
                        color: "#f5cf6b", borderRadius: 4, padding: "2px 6px",
                        fontSize: 11, fontWeight: 800, cursor: "pointer",
                      }}
                    >⛶</button>
                  </div>
                  <div style={{ marginTop: 8, fontSize: 11, color: "#c8b8d0", textAlign: "center" }}>
                    {map.name} · {map.diff} {map.stars ? <span style={{ color: "#ffd94d" }}>{"★".repeat(map.stars)}</span> : null}
                    {walkingTo && <div style={{ color: "#7ef27a", marginTop: 2 }}>→ {walkingTo}…</div>}
                  </div>

                  {bigMapOpen && (
                    <div
                      onClick={() => setBigMapOpen(false)}
                      style={{
                        position: "fixed", inset: 0, zIndex: 9998,
                        background: "rgba(0,0,0,0.85)", display: "grid", placeItems: "center",
                        padding: 24, cursor: "pointer",
                      }}
                    >
                      <div
                        onClick={(e) => e.stopPropagation()}
                        style={{
                          background: "#0b0510", border: "3px solid #f5cf6b",
                          borderRadius: 14, padding: 16, maxWidth: 720, width: "100%",
                          cursor: "default", boxShadow: "0 0 60px rgba(245,207,107,0.4)",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                          <div style={{ color: "#f5cf6b", fontWeight: 900, fontSize: 16, letterSpacing: 1 }}>
                            🗺 {map.name} — clique num ponto pra viajar
                          </div>
                          <button
                            onClick={() => setBigMapOpen(false)}
                            style={{ background: "#3a1010", border: "1px solid #f5cf6b", color: "#f5cf6b", borderRadius: 6, padding: "4px 10px", fontWeight: 800, cursor: "pointer" }}
                          >✕</button>
                        </div>
                        {renderMap(true, true)}
                        <div style={{ marginTop: 10, fontSize: 12, color: "#c8b8d0", textAlign: "center" }}>
                          🏠 Lar · 🔬 Laboratório · {currentGates.map((g) => {
                            const tm = IDLE_MAPS[g.target];
                            const ok = (idle.trainerLevel ?? 1) >= tm.minLevel;
                            return (
                              <span key={g.key} style={{ color: ok ? g.color : "#8a7a9c", marginRight: 8 }}>
                                ● {tm.name}{ok ? "" : ` (Lv ${tm.minLevel})`}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </>
              );
            })()}
          </Panel>


          {/* COLETA — logo abaixo do mapa, destaque */}
          <div style={{
            background: "linear-gradient(135deg, #2a1a3e, #3d2b52)",
            border: "2px solid #f5cf6b",
            borderRadius: 10, padding: 10,
            boxShadow: "0 4px 14px rgba(245,207,107,0.25)",
            flexShrink: 0,
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <span style={{ color: "#f5cf6b", fontWeight: 900, fontSize: 12, letterSpacing: 1 }}>COLETA</span>
              <span style={{ color: "#f5cf6b", fontWeight: 700, fontSize: 11 }}>⏱ {fmtHMS(Math.min(OFFLINE_CAP_MS, activeTime))}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-around", alignItems: "center", marginBottom: 8, fontSize: 13, fontWeight: 700 }}>
              <span title="Ouro" style={{ color: "#f4c430" }}>● {fmtK(idle.pending.gold)}</span>
              <span title="Cristais">💎 {Math.floor(idle.pending.crystals)}</span>
            </div>
            <button
              onClick={collect}
              style={{
                width: "100%",
                background: "linear-gradient(135deg, #7ef27a, #5ec26a)",
                color: "#0b0510",
                border: "2px solid #f5cf6b",
                borderRadius: 8,
                padding: "8px 12px",
                fontWeight: 900,
                fontSize: 14,
                letterSpacing: 1.2,
                cursor: "pointer",
                boxShadow: "0 3px 10px rgba(126,242,122,0.5)",
                textShadow: "0 1px 0 rgba(255,255,255,0.3)",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              }}
            >
              <img src={collectIconImg} alt="" width={26} height={26} style={{ imageRendering: "pixelated", filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.4))" }} />
              COLETAR
            </button>
          </div>




          {/* Botão de Tarefas — abre overlay com a lista completa */}
          <button
            onClick={() => { playClick(); setTab("tarefas"); }}
            style={{
              background: "linear-gradient(135deg, #3d2b52, #6a3d8a)",
              border: "2px solid #f5cf6b",
              borderRadius: 10, padding: "10px 12px", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10,
              color: "#fff", fontWeight: 800, letterSpacing: 0.5,
            }}
          >
            <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <img src={crystalRedImg} alt="" style={{ width: 20, imageRendering: "pixelated" }} />
              TAREFAS
            </span>
            <span style={{ fontSize: 11, color: "#f5cf6b", fontWeight: 700 }}>
              {idle.tasks.filter((t) => t.done).length}/{idle.tasks.length} pronto{idle.tasks.length === 1 ? "" : "s"}
            </span>
          </button>

          <Panel title="PROGRESSO GLOBAL" accent="#3d2b52">
            <ProgressRow icon="🔴" label="Pokémon Capturados" value={idle.totals.captured} target={151} />
            <ProgressRow icon="🗺" label="Mapas Desbloqueados" value={idle.mapsUnlocked} target={25} />
          </Panel>

          <div style={{
            background: "linear-gradient(135deg, #7a1c1c, #c92a2a)",
            border: "2px solid #f5cf6b",
            borderRadius: 10, padding: 10,
            display: "flex", alignItems: "center", gap: 10,
          }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 800, color: "#fff", fontSize: 12 }}>MODO IDLE ATIVO</div>
              <div style={{ fontSize: 10, color: "#f5cf6b" }}>Ganhos continuam offline!</div>
            </div>
            <div style={{
              width: 28, height: 28, borderRadius: "50%",
              background: "radial-gradient(circle, #e94141 0 40%, #fff 40% 55%, #333 55%)",
              flexShrink: 0,
            }} />
          </div>

          {/* ===== Guia Inteligente (Prof. Carvalho) — inline, abaixo do MODO IDLE ===== */}
          {eventToast && (
            <div key={eventToast.id} style={{
              position: "relative",
              background: "linear-gradient(180deg, #f8f4e8 0%, #ecdfc2 100%)",
              border: `3px solid ${eventToast.color}`,
              borderRadius: 12, padding: "8px 10px 8px 8px",
              display: "flex", alignItems: "center", gap: 8,
              boxShadow: `0 4px 14px rgba(0,0,0,0.4), 0 0 12px ${eventToast.color}55, inset 0 1px 0 rgba(255,255,255,0.6)`,
              animation: "evt-slide 320ms cubic-bezier(.2,.9,.3,1.2)",
            }}>
              <div style={{
                width: 44, height: 44, flexShrink: 0,
                borderRadius: 10,
                background: `radial-gradient(circle at 40% 35%, ${eventToast.color}55, #fff4d0 70%)`,
                border: `2px solid ${eventToast.color}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                overflow: "hidden",
                boxShadow: `inset 0 0 6px ${eventToast.color}44`,
              }}>
                <img src={npcOakSprite} alt="Guia" style={{ width: "110%", height: "110%", objectFit: "cover", imageRendering: "pixelated" }} />
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 8, fontWeight: 900, color: "#8b6a30", letterSpacing: 1.5 }}>
                  PROF. CARVALHO · {eventToast.icon}
                </div>
                <div style={{ fontSize: 12, fontWeight: 900, color: "#3a1f0d", letterSpacing: 0.3, lineHeight: 1.1, marginTop: 2 }}>
                  {eventToast.title}
                </div>
                {eventToast.sub && (
                  <div style={{ fontSize: 10, color: "#5a3f1d", marginTop: 2, lineHeight: 1.2 }}>
                    {eventToast.sub}
                  </div>
                )}
              </div>
              <button
                onClick={() => setEventToast(null)}
                title="Fechar"
                style={{
                  position: "absolute", top: -6, right: -6, width: 20, height: 20, borderRadius: "50%",
                  background: eventToast.color, color: "#1a0f26", border: "2px solid #f8f4e8",
                  fontWeight: 900, fontSize: 11, cursor: "pointer", lineHeight: 1, padding: 0,
                  boxShadow: "0 2px 6px rgba(0,0,0,0.4)",
                }}
              >✕</button>
            </div>
          )}
        </div>



        {/* ============ NAV INFERIOR ============ */}
        <div style={{ gridColumn: "1 / -1", display: "flex", justifyContent: "center", gap: 4, background: "linear-gradient(180deg,#0b0510 0%,#160a20 100%)", padding: "8px 0", borderTop: "1px solid rgba(245,207,107,0.15)" }}>
          {([
            { id: "inicio",   label: "Início",   img: navInicio,    color: "#f5cf6b" },
            { id: "pokemon",  label: "Pokémon",  img: navPokemon,   color: "#ff5252" },
            { id: "mochila",  label: "Mochila",  img: bagIconImg,   color: "#ffd66b" },
            
            { id: "melhorias",label: "Melhorias",img: navMelhorias, color: "#7ef27a" },
            { id: "colecao",  label: "Coleção",  img: navColecao,   color: "#ff5c8a" },
            { id: "pokedex",  label: "Pokédex",  img: navColecao,   color: "#e11d48" },
            { id: "loja",     label: "Loja",     img: navLoja,      color: "#6bd4ff" },
            { id: "market",   label: "Marketplace", img: navMarket, color: "#ff9d3d" },
            // Carteira bloqueada temporariamente
            // { id: "wallet",   label: "Carteira", img: navWallet,    color: "#ffd66b" },
          ] as const).map((t) => {

            const active = tab === t.id;
            const showActive = active;
            const color = t.color;
            const isDisabled = (t as { disabled?: boolean }).disabled === true;
            return (
              <button
                key={t.id}
                onClick={() => {
                  if (isDisabled) {
                    playClick();
                    pushChat("🛒 Marketplace em breve — ainda não habilitado.", "info");
                    return;
                  }
                  playClick();
                  setTab(t.id as typeof tab);
                }}
                title={isDisabled ? `${t.label} (em breve)` : t.label}
                style={{
                  flex: 1, maxWidth: 130,
                  background: showActive ? `linear-gradient(180deg, ${color}33 0%, ${color}11 100%)` : "transparent",
                  color: isDisabled ? "#6a5a70" : (showActive ? color : "#c8b8d0"),
                  border: showActive ? `1px solid ${color}88` : "1px solid transparent",
                  padding: "8px 6px", cursor: isDisabled ? "not-allowed" : "pointer",
                  borderRadius: 10, display: "flex", flexDirection: "column",
                  alignItems: "center", gap: 4, fontSize: 11, position: "relative",
                  transition: "background 150ms, color 150ms, border-color 150ms",
                  boxShadow: showActive ? `0 0 14px ${color}66, inset 0 1px 0 ${color}44` : "none",
                  opacity: isDisabled ? 0.55 : 1,
                }}
              >
                <img
                  src={t.img}
                  alt=""
                  width={34}
                  height={34}
                  style={{
                    width: 34, height: 34, imageRendering: "pixelated",
                    filter: isDisabled
                      ? "grayscale(1) brightness(0.7) drop-shadow(0 2px 2px rgba(0,0,0,0.6))"
                      : (showActive
                        ? `drop-shadow(0 0 8px ${color}) drop-shadow(0 2px 2px rgba(0,0,0,0.5))`
                        : "drop-shadow(0 2px 2px rgba(0,0,0,0.6)) saturate(0.85) brightness(0.9)"),
                    transform: active ? "translateY(-2px) scale(1.08)" : "none",
                    transition: "transform 150ms, filter 150ms",
                  }}
                />
                <span style={{ fontWeight: showActive ? 700 : 500, letterSpacing: 0.3 }}>
                  {t.label}
                </span>
                {isDisabled && (
                  <span style={{
                    position: "absolute", top: 2, right: 4,
                    fontSize: 8, fontWeight: 700, letterSpacing: 0.5,
                    color: "#ffd66b", background: "rgba(0,0,0,0.55)",
                    padding: "1px 4px", borderRadius: 4, border: "1px solid #ffd66b55",
                  }}>EM BREVE</span>
                )}
              </button>
            );
          })}
          {/* ===== BOTÃO SALVAR NA NUVEM ===== */}
          <button
            onClick={async () => {
              playClick();
              if (!cloudBlobReady) {
                pushChat("⏳ Aguarde carregar o save da nuvem antes de salvar.", "info");
                return;
              }
              try {
                const ok = await pushCloudSaveNow(buildFullBlob());
                await serverSync.pushNow();
                pushChat(ok ? "☁️ Progresso salvo na nuvem!" : `⚠️ Não salvou na nuvem: ${getCloudSaveLastError() ?? "verifique a tabela game_saves"}.`, "info");
              } catch (e) {
                pushChat("⚠️ Falha ao salvar. Tente de novo.", "info");
              }
            }}
            title="Salvar progresso na nuvem"
            style={{
              flex: 1, maxWidth: 130,
              background: "linear-gradient(180deg, #22d3ee33 0%, #22d3ee11 100%)",
              color: "#22d3ee",
              border: "1px solid #22d3ee88",
              padding: "8px 6px", cursor: "pointer",
              borderRadius: 10, display: "flex", flexDirection: "column",
              alignItems: "center", gap: 4, fontSize: 11, position: "relative",
              boxShadow: "0 0 14px #22d3ee55, inset 0 1px 0 #22d3ee44",
              fontWeight: 700, letterSpacing: 0.3,
            }}
          >
            <span style={{ fontSize: 28, lineHeight: 1, filter: "drop-shadow(0 0 8px #22d3ee)" }}>☁️</span>
            <span>Salvar</span>
          </button>
        </div>
      </div>

      <style>{`
        /* ===== Layout responsivo ===== */
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


      `}</style>

      {identity && (
        <div style={{ position: "fixed", bottom: 8, left: 8, fontSize: 10, color: "#8a7a9c", zIndex: 100 }}>
          {identity.name}
        </div>
      )}





      {/* ═══ Modal do NPC Trocador (aberto ao clicar no NPC no mapa) ═══ */}
      {worldTraderOpen && (() => {
        const collection = idle.collection ?? [];
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
                      const available = collection.filter((c) => c.rarity === t.rarity).length;
                      const canTrade = available >= t.count;
                      const owned = idle.items[t.orbId] ?? 0;
                      return (
                        <div key={t.orbId} style={{
                          background: "linear-gradient(160deg, #1a0f26 0%, #251638 100%)",
                          border: `2px solid ${t.color}66`, borderRadius: 14, padding: 14,
                          display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
                          boxShadow: `0 4px 14px rgba(0,0,0,0.4), inset 0 1px 0 ${t.color}33`,
                        }}>
                          <img src={t.img} alt={t.label} width={72} height={72}
                            style={{ imageRendering: "pixelated", filter: `drop-shadow(0 0 12px ${t.color}bb)` }} />
                          <div style={{ fontWeight: 900, color: "#eadfe8", fontSize: 14 }}>{t.label}</div>
                          <div style={{ fontSize: 11, color: "#b8a8c8", textAlign: "center", lineHeight: 1.4 }}>{t.desc}</div>
                          <div style={{ fontSize: 11, color: canTrade ? "#8ae28a" : "#e28a8a", fontWeight: 700 }}>
                            {t.rarity.toUpperCase()} na coleção: {available}/{t.count}
                          </div>
                          <div style={{ fontSize: 10, color: "#8a7a9c" }}>Você tem: {owned}</div>
                          <button
                            disabled={!canTrade}
                            onClick={() => { setWorldTraderPick(t); setWorldTraderSel(new Set()); }}
                            style={{
                              width: "100%", padding: "8px 10px", fontWeight: 900, fontSize: 12,
                              background: canTrade ? t.color : "#3a2a4a",
                              color: canTrade ? "#0b0510" : "#6a5a7c",
                              border: "none", borderRadius: 8,
                              cursor: canTrade ? "pointer" : "not-allowed",
                            }}
                          >{canTrade ? "ESCOLHER POKÉMON" : `PRECISA ${t.count} ${t.rarity.toUpperCase()}`}</button>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}

              {worldTraderPick && (() => {
                const pick = worldTraderPick;
                const eligible = collection.filter((c) => c.rarity === pick.rarity);
                const selCount = worldTraderSel.size;
                const canConfirm = selCount === pick.count;
                return (
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                      <div style={{ fontWeight: 900, color: pick.color, fontSize: 14 }}>
                        Escolha {pick.count} Pokémon {pick.rarity.toUpperCase()}
                      </div>
                      <button
                        onClick={() => { setWorldTraderPick(null); setWorldTraderSel(new Set()); }}
                        style={{ background: "transparent", border: "1px solid #3a2a4a", color: "#eadfe8", cursor: "pointer", fontSize: 11, padding: "4px 10px", borderRadius: 6 }}
                      >← VOLTAR</button>
                    </div>
                    <div style={{ fontSize: 11, color: "#b8a8c8", marginBottom: 10 }}>
                      Selecionados: <b style={{ color: canConfirm ? "#8ae28a" : "#ffd94d" }}>{selCount}/{pick.count}</b> — Recompensa: <b style={{ color: pick.color }}>{pick.label}</b>
                    </div>
                    {eligible.length === 0 ? (
                      <div style={{ color: "#e28a8a", fontSize: 12, padding: 24, textAlign: "center" }}>
                        Você não tem Pokémon {pick.rarity.toUpperCase()} na coleção.
                      </div>
                    ) : (
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(96px, 1fr))", gap: 8, maxHeight: "48vh", overflowY: "auto", padding: 4 }}>
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
                                background: sel ? `linear-gradient(160deg, ${pick.color}55, ${pick.color}22)` : "#1a0f26",
                                border: sel ? `2px solid ${pick.color}` : "2px solid #3a2a4a",
                                borderRadius: 10, padding: 6, cursor: disabled ? "not-allowed" : "pointer",
                                display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
                                opacity: disabled ? 0.4 : 1, position: "relative",
                              }}
                            >
                              {GIF[c.species] ? (
                                <img src={GIF[c.species]} alt="" style={{ width: 54, height: 54, imageRendering: "pixelated" }} />
                              ) : (
                                <div style={{ width: 54, height: 54, background: "#2a1638", borderRadius: 8 }} />
                              )}
                              <div style={{ fontSize: 10, color: "#eadfe8", fontWeight: 700, textTransform: "capitalize" }}>{c.species.replace(/_/g, " ")}</div>
                              <div style={{ fontSize: 10, color: "#ffd94d" }}>Lv.{c.level}</div>
                              {sel && (
                                <div style={{
                                  position: "absolute", top: 2, right: 2, background: pick.color, color: "#0b0510",
                                  width: 18, height: 18, borderRadius: 999, fontSize: 11, fontWeight: 900, display: "grid", placeItems: "center",
                                }}>✓</div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                    <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
                      <button
                        onClick={() => { setWorldTraderPick(null); setWorldTraderSel(new Set()); }}
                        style={{ flex: 1, padding: "10px", background: "#3a2a4a", color: "#eadfe8", border: "none", borderRadius: 8, fontWeight: 800, cursor: "pointer" }}
                      >CANCELAR</button>
                      <button
                        disabled={!canConfirm}
                        onClick={() => {
                          tradeForOrb(pick.orbId, Array.from(worldTraderSel));
                          setWorldTraderPick(null);
                          setWorldTraderSel(new Set());
                        }}
                        style={{
                          flex: 2, padding: "10px", fontWeight: 900,
                          background: canConfirm ? pick.color : "#3a2a4a",
                          color: canConfirm ? "#0b0510" : "#6a5a7c",
                          border: "none", borderRadius: 8, cursor: canConfirm ? "pointer" : "not-allowed",
                        }}
                      >CONFIRMAR TROCA</button>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        );
      })()}

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

      {codeOpen && (
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
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div style={{ fontWeight: 800, color: "#f5cf6b" }}>🔑 Resgatar código</div>
              <button onClick={() => setCodeOpen(false)} style={{
                background: "transparent", border: "none", color: "#f3e5c5", cursor: "pointer", fontSize: 16,
              }}>✕</button>
            </div>
            <div style={{ fontSize: 11, color: "#c8b8d0", marginBottom: 8 }}>
              Digite um código secreto para receber recompensas.
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
        </div>
      )}





      {/* ===== Popup do ovo chocando ===== */}
      {eggOpenResult && (() => {
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
      })()}

      {/* ===== Modal de escolha do inicial ===== */}


      {!starterChosen && (
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
        </div>
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
      {azulPickerOpen && (() => {
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
      })()}

      {/* ===== Modal: Detalhes da Coleção ===== */}
      {colecaoDetailUid && (() => {
        const entry = idle.collection?.find((p) => p.uid === colecaoDetailUid);
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
                  const pet = { ...basePet, traits: entry.traits ?? basePet.traits ?? [] };
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
      })()}

      {statsCardPet && (
        <PokemonStatsCard
          pet={statsCardPet}
          team={team}
          gifSrc={GIF[statsCardPet.species]}
          onClose={() => setStatsCardPet(null)}
        />
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
            position: "fixed", top: 14, left: "50%", transform: "translateX(-50%)",
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
        background: accent, color: "#fff",
        padding: "6px 10px", fontWeight: 700, fontSize: 12,
        letterSpacing: 1,
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
      display: "flex", gap: 6, alignItems: "center",
      background: exhausted
        ? "linear-gradient(135deg, #1a1a1a 0%, #241d24 100%)"
        : `linear-gradient(135deg, ${hexToRgba(rColor, 0.28)} 0%, ${hexToRgba(rColor, 0.10)} 100%)`,
      padding: 4, borderRadius: 6, cursor: onClick ? "pointer" : undefined,
      border: resting ? "1px solid #4a9eff" : (exhausted ? "1px solid #555" : `1px solid ${hexToRgba(rColor, 0.65)}`),
      boxShadow: exhausted ? "none" : `0 0 0 1px ${hexToRgba(rColor, 0.15)} inset, 0 0 8px ${hexToRgba(rColor, 0.18)}`,
      opacity: exhausted ? 0.65 : 1,
    }}>
      <div style={{
        width: 38, height: 38, background: `radial-gradient(circle at 50% 55%, ${hexToRgba(rColor, 0.55)} 0%, #0b0510 75%)`, borderRadius: 6,
        display: "grid", placeItems: "center", overflow: "hidden", position: "relative", flexShrink: 0,
        border: `1px solid ${hexToRgba(rColor, 0.5)}`,
      }}>
        <img src={src} alt="" style={{ width: "92%", imageRendering: "pixelated", filter: exhausted ? "grayscale(1) brightness(0.7)" : undefined }} />
        {resting && <span style={{ position: "absolute", top: 0, right: 1, fontSize: 9 }}>🏡</span>}
        {exhausted && <span style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", fontSize: 16, textShadow: "0 0 4px #000" }}>🔒</span>}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, fontWeight: 700, lineHeight: 1.15 }}>
          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{pet.species.replace(/_/g, " ").toUpperCase()}</span>
          <span style={{ color: "#ffd94d", marginLeft: 4 }}>Lv{pet.level}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}>
          <div style={{ flex: 1, height: 4, background: "#3a1010", borderRadius: 2 }}>
            <div style={{ width: `${pct}%`, height: "100%", background: pct > 40 ? "#5ec26a" : "#e34a4a", borderRadius: 2 }} />
          </div>
          <span style={{ fontSize: 8, color: "#b8a8c8", minWidth: 42, textAlign: "right" }}>{hp}/{maxHp}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 1 }}>
          <div style={{ flex: 1, height: 3, background: "#0e2438", borderRadius: 2 }}>
            <div style={{ width: `${infinite ? 100 : ePct}%`, height: "100%", background: resting ? "#7fc4ff" : (energy > 30 ? "#4a9eff" : "#ff7a3d"), borderRadius: 2 }} />
          </div>
          <span style={{ fontSize: 8, color: "#8fd0ff", minWidth: 42, textAlign: "right" }}>
            ⚡{infinite ? "∞" : `${energy}`}
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

// ============ Overlay das abas ============
function TabOverlay({
  tab, onClose, leader, team, onReorderTeam, leaderHp, items, caughtSpecies, seenSpecies, totals, collection, craftPoints, onFragmentCollection, gifMap, onPickTeam, onUseItem,
  bank, buffs, onBuyBall, onBuyBook, onBuyPotion, onBuyEgg, shopEggs, onBuyChestAmulet, chestAmuletOwned, autoHeal, setAutoHeal, audioSettings, setAudioSettings,
  tasks, onClaimTask, onOpenColecaoDetail, onExchange, onSellItem, marketSellPrices, identity, onListMarket, onBuyMarket, onCancelMarket, isVip, skinId, setSkinId, unlockedSkins, skinTickets, onUnlockSkin, trainerLevel, onUpgradeBook, orbTrades, onTradeOrb, pokemonMarketNode,

}: {
  tab: string;
  onClose: () => void;
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
  onUseItem: (id: string) => void;
  bank: { gold: number; crystals: number };
  buffs: { atk: number; def: number; expMult: number; expMultUntil?: number; goldMult?: number; goldMultUntil?: number; orbMult?: number; orbUntil?: number; orbId?: string; honeyUntil?: number; honeyRareUntil?: number };
  onBuyBall: (b: ShopBall) => void;
  onBuyBook: (bk: ShopBook) => void;
  onBuyPotion: (qty?: number) => void;
  onBuyEgg: (e: { id: "egg_common" | "egg_rare" | "egg_epic" | "egg_mystic" | "egg_aura" | "egg_charizard"; name: string; price: number; currency: "gold" | "crystals"; desc: string; color: string }) => void;
  shopEggs: { id: "egg_common" | "egg_rare" | "egg_epic" | "egg_mystic" | "egg_aura" | "egg_charizard"; name: string; price: number; currency: "gold" | "crystals"; desc: string; color: string }[];

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
  onSellItem: (id: string, qty?: number) => void;
  marketSellPrices: Record<string, number>;
  identity: LocalIdentity | null;
  onListMarket: (itemId: string, qty: number, price: number) => Promise<boolean>;
  onBuyMarket: (l: { id: string; seller_id: string; item_id: string; qty: number; price: number }) => Promise<boolean>;
  onCancelMarket: (l: { id: string; item_id: string; qty: number; seller_id: string }) => Promise<boolean>;
  isVip: boolean;
  skinId: string;
  setSkinId: (id: string) => void;
  trainerLevel: number;
  unlockedSkins: string[];
  skinTickets: number;
  onUnlockSkin: (id: string) => void;
  onUpgradeBook: (id: string) => void;
  orbTrades: { orbId: "orb_xp_major" | "orb_xp_supreme"; label: string; rarity: Rarity; count: number; color: string; img: string; desc: string }[];
  onTradeOrb: (orbId: "orb_xp_major" | "orb_xp_supreme", uids: string[]) => void;
  pokemonMarketNode?: React.ReactNode;


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
    tab === "inicio"    ? "INÍCIO" : "";
  const [mochilaCat, setMochilaCat] = useState<"all" | "balls" | "potions" | "books" | "eggs" | "other">("all");
  const [orbPicker, setOrbPicker] = useState<null | { orbId: "orb_xp_major" | "orb_xp_supreme"; rarity: Rarity; count: number; color: string; label: string }>(null);
  const [orbPickerSel, setOrbPickerSel] = useState<Set<string>>(new Set());
  const [statsCardPet, setStatsCardPet] = useState<PetInstance | null>(null);
  return (
    <div style={{
      position: "absolute", inset: 12, background: "rgba(11,5,16,0.96)",
      border: "1px solid rgba(245,207,107,0.3)", borderRadius: 12,
      zIndex: 20, padding: 16, overflowY: "auto",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h2 style={{ margin: 0, fontSize: 20, color: "#f5cf6b" }}>{title}</h2>
        <button onClick={onClose} style={{ ...smallBtn, background: "#c92a2a", color: "#fff", border: "none", padding: "6px 14px" }}>
          ← Voltar
        </button>
      </div>

      {tab === "pokemon" && leader && (
        <div style={{
          position: "relative",
          padding: "14px 12px 18px",
          borderRadius: 18,
          border: "3px solid #6b3fa0",
          background: `linear-gradient(180deg, rgba(20,10,35,0.82) 0%, rgba(30,15,50,0.9) 45%, rgba(20,10,35,0.95) 100%), url(${pokemonTabBg}) center/cover no-repeat`,
          boxShadow: "0 10px 30px rgba(0,0,0,0.55), inset 0 0 40px rgba(192,132,252,0.15), 0 0 22px rgba(192,132,252,0.25)",
          overflow: "hidden",
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
                background: "linear-gradient(135deg, #2a1638 0%, #1a0f26 50%, #251638 100%)",
                border: "3px solid #f5cf6b",
                borderRadius: 16,
                boxShadow: "0 6px 22px rgba(0,0,0,0.55), inset 0 1px 0 rgba(245,207,107,0.4), 0 0 24px rgba(245,207,107,0.12)",
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
                  }}>{team.length}/5</div>
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
                          background: `radial-gradient(circle at 30% 25%, ${col}66, ${col}22 70%, rgba(0,0,0,0.4))`,
                          border: `1px solid ${col}aa`,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          flexShrink: 0,
                          boxShadow: `0 0 6px ${col}55, inset 0 1px 0 rgba(255,255,255,0.15)`,
                        }}><StatIcon kind={kind} col={col} /></div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 8, fontWeight: 900, letterSpacing: 1, color: "#c8b8d0", marginBottom: 2 }}>
                            <span>{label}</span>
                            <span style={{ color: col, fontFamily: "monospace", fontSize: 9 }}>{val}</span>
                          </div>
                          <div style={{ height: 4, background: "rgba(0,0,0,0.55)", borderRadius: 3, overflow: "hidden", border: "1px solid rgba(0,0,0,0.7)" }}>
                            <div style={{
                              width: `${(val / maxStat) * 100}%`, height: "100%",
                              background: `linear-gradient(90deg, ${col}, ${col}dd)`,
                              boxShadow: `0 0 4px ${col}88`,
                            }} />
                          </div>
                        </div>
                      </div>
                    );
                    return (
                      <div key={p.uid} style={{
                        display: "flex", alignItems: "stretch", gap: 12, padding: 12,
                        background: isLeader
                          ? `linear-gradient(135deg, ${rc}2a 0%, #1a0f26 45%, #251638 100%)`
                          : "linear-gradient(135deg, rgba(28,16,45,0.92), rgba(38,22,60,0.9))",
                        border: `2.5px solid ${isLeader ? rc : rc + "66"}`,
                        borderRadius: 14,
                        boxShadow: isLeader
                          ? `0 6px 18px rgba(0,0,0,0.55), inset 0 1px 0 ${rc}66, 0 0 22px ${rc}44`
                          : `0 3px 10px rgba(0,0,0,0.5), inset 0 1px 0 ${rc}33`,
                        position: "relative", overflow: "hidden",
                      }}>
                        {/* sparkle overlay */}
                        <div style={{ position: "absolute", inset: 0, background: `radial-gradient(circle at 85% 15%, ${rc}22, transparent 55%)`, pointerEvents: "none" }} />

                        {/* Portrait + Level badge */}
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, flexShrink: 0, position: "relative" }}>
                          <div style={{
                            width: 82, height: 82, borderRadius: 14,
                            background: `radial-gradient(circle at 30% 25%, ${rc}55, ${rc}15 60%, rgba(0,0,0,0.45))`,
                            border: `2px solid ${rc}`,
                            boxShadow: `inset 0 0 14px ${rc}44, 0 3px 10px rgba(0,0,0,0.55), 0 0 12px ${rc}55`,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            position: "relative", overflow: "hidden",
                          }}>
                            {src && <img src={src} alt="" width={70} height={70} style={{ imageRendering: "pixelated", filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.7))" }} />}
                            {/* Slot number top-left */}
                            <div style={{
                              position: "absolute", top: 2, left: 4,
                              fontSize: 10, fontWeight: 900,
                              color: isLeader ? rc : "#8a7a9c",
                              textShadow: "0 1px 2px #000",
                            }}>{isLeader ? "★" : `#${i + 1}`}</div>
                            {/* Level bottom-right badge */}
                            <div style={{
                              position: "absolute", bottom: -4, right: -4,
                              minWidth: 28, height: 22, padding: "0 6px",
                              background: "linear-gradient(180deg, #ffd66b, #b8862a)",
                              color: "#0b0510", border: "2px solid #0b0510",
                              borderRadius: 999, display: "flex", alignItems: "center", justifyContent: "center",
                              fontSize: 10, fontWeight: 900, letterSpacing: 0.5,
                              boxShadow: "0 2px 4px rgba(0,0,0,0.6)",
                            }}>Lv{p.level}</div>
                          </div>
                          {isLeader && (
                            <div style={{
                              padding: "2px 8px", borderRadius: 999,
                              background: `linear-gradient(180deg, ${rc}, ${rc}bb)`,
                              color: "#0b0510", fontSize: 8, fontWeight: 900, letterSpacing: 1.5,
                              boxShadow: `0 2px 6px ${rc}88`, border: "1px solid #fff4d0",
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
                              background: `linear-gradient(180deg, ${rc}, ${rc}aa)`, color: "#0b0510",
                              fontSize: 8, fontWeight: 900, letterSpacing: 1,
                              padding: "2px 7px", borderRadius: 4,
                              boxShadow: `0 0 8px ${rc}88`, border: "1px solid rgba(0,0,0,0.4)",
                            }}>{rarityInfo.label}</div>
                            <button
                              onClick={() => setStatsCardPet(p)}
                              title="Ver ficha completa"
                              style={{
                                marginLeft: "auto", background: "linear-gradient(180deg,#f5cf6b,#b8862a)",
                                color: "#1a0f26", border: "1px solid #0b0510", borderRadius: 6,
                                padding: "2px 8px", fontSize: 9, fontWeight: 900, letterSpacing: 1, cursor: "pointer",
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
                                background: i === 0 ? "#2a1638" : "linear-gradient(180deg, #3a2450, #241634)",
                                color: i === 0 ? "#4a3560" : "#eadfe8",
                                border: `1px solid ${i === 0 ? "#3a2450" : "#5a3d78"}`,
                                borderRadius: 5, cursor: i === 0 ? "not-allowed" : "pointer",
                              }}>▲</button>
                            <button onClick={() => move(i, i + 1)} disabled={i === team.length - 1}
                              title="Descer"
                              style={{
                                width: 26, height: 22, fontSize: 12, fontWeight: 900,
                                background: i === team.length - 1 ? "#2a1638" : "linear-gradient(180deg, #3a2450, #241634)",
                                color: i === team.length - 1 ? "#4a3560" : "#eadfe8",
                                border: `1px solid ${i === team.length - 1 ? "#3a2450" : "#5a3d78"}`,
                                borderRadius: 5, cursor: i === team.length - 1 ? "not-allowed" : "pointer",
                              }}>▼</button>
                          </div>
                          {!isLeader && (
                            <button onClick={() => move(i, 0)}
                              title="Tornar Líder"
                              style={{
                                padding: "3px 8px", fontSize: 9, fontWeight: 900, letterSpacing: 0.5,
                                background: "linear-gradient(180deg, #ffd66b, #b8862a)",
                                color: "#0b0510", border: "1px solid #fff4d0",
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
                  {Array.from({ length: Math.max(0, 5 - team.length) }).map((_, k) => (
                    <div key={`empty-${k}`} style={{
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                      padding: 14, minHeight: 60,
                      background: "rgba(20,10,35,0.4)",
                      border: "2px dashed #4a3560", borderRadius: 12,
                      color: "#6a5a7c", fontSize: 11, fontWeight: 800, letterSpacing: 1,
                    }}>
                      <span style={{ fontSize: 16, opacity: 0.5 }}>＋</span>
                      SLOT VAZIO — Adicione pela Coleção
                    </div>
                  ))}
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
                  background: "linear-gradient(160deg, #1a0f26 0%, #251638 100%)",
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
          egg_common: "Ovo Comum", egg_rare: "Ovo Raro", egg_epic: "Ovo Épico", egg_mystic: "Ovo Místico", egg_aura: "Ovo da Aura", egg_charizard: "Ovo do Charizard",
          incenso_mel: "Incenso de Mel 🍯", incenso_mel_raro: "Incenso Raro ✨🍯",
        };
        const EGG_COLORS: Record<string, string> = { egg_common: "#c8b8d0", egg_rare: "#6bd4ff", egg_epic: "#c084fc", egg_mystic: "#ff97e1", egg_aura: "#6bd4ff", egg_charizard: "#ff6b3d" };
        const catOf = (id: string): "balls" | "potions" | "books" | "eggs" | "other" => {
          if (id.endsWith("ball") || id === "pokeball" || id === "greatball" || id === "ultraball") return "balls";
          if (id === "potion" || id === "revive" || id === "berry") return "potions";
          if (id.startsWith("book_")) return "books";
          if (id.startsWith("egg_")) return "eggs";
          return "other";
        };
        const CATS: { id: "all" | "balls" | "potions" | "books" | "eggs" | "other"; label: string; icon: string }[] = [
          { id: "all", label: "Tudo", icon: "🎒" },
          { id: "balls", label: "Bolas", icon: "⚪" },
          { id: "potions", label: "Poções", icon: "🧪" },
          { id: "books", label: "Livros", icon: "📖" },
          { id: "eggs", label: "Ovos", icon: "🥚" },
          { id: "other", label: "Outros", icon: "✨" },
        ];
        // filtra chaves internas de contagem (não devem aparecer na mochila)
        const entries = Object.entries(items).filter(([id, n]) => n > 0 && !id.startsWith("_"));
        const totalTypes = entries.length;
        const totalCount = entries.reduce((a, [, n]) => a + n, 0);
        const filtered = mochilaCat === "all" ? entries : entries.filter(([id]) => catOf(id) === mochilaCat);
        // slots: preenche a grade com mínimo de 24 slots
        const SLOTS_MIN = 24;
        const emptyCount = Math.max(0, SLOTS_MIN - filtered.length);

        return (
          <div>
            {/* Cabeçalho estilo MMO */}
            <div style={{
              display: "flex", alignItems: "center", gap: 16, marginBottom: 14,
              padding: "14px 18px",
              background: "linear-gradient(135deg, #3a1f5c 0%, #2a1638 50%, #1a0f26 100%)",
              border: "3px solid #ffd66b", borderRadius: 16,
              boxShadow: "0 6px 22px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,214,107,0.4), 0 0 24px rgba(255,214,107,0.15)",
              position: "relative", overflow: "hidden",
            }}>
              <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 20% 30%, rgba(255,214,107,0.15), transparent 60%)", pointerEvents: "none" }} />
              <div style={{
                width: 72, height: 72, borderRadius: 16, flexShrink: 0,
                background: "radial-gradient(circle at 35% 30%, #fff4d0, #ffd66b 65%, #b8862a)",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 4px 12px rgba(0,0,0,0.5), inset 0 2px 4px rgba(255,255,255,0.5)",
                border: "2px solid #b8862a",
              }}>
                <img src={bagIconImg} alt="" width={48} height={48} style={{ imageRendering: "pixelated", filter: "drop-shadow(0 2px 3px rgba(0,0,0,0.4))" }} />
              </div>
              <div style={{ flex: 1, position: "relative" }}>
                <div style={{ color: "#ffd66b", fontSize: 22, fontWeight: 900, letterSpacing: 2, textShadow: "0 2px 0 #0b0510, 0 0 12px rgba(255,214,107,0.6)" }}>✦ MOCHILA ✦</div>
                <div style={{ color: "#eadfe8", fontSize: 11, marginTop: 4, display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <span style={{ background: "rgba(255,214,107,0.15)", padding: "2px 8px", borderRadius: 8, border: "1px solid rgba(255,214,107,0.3)" }}>
                    <strong style={{ color: "#ffd66b" }}>{totalTypes}</strong> tipos
                  </span>
                  <span style={{ background: "rgba(255,214,107,0.15)", padding: "2px 8px", borderRadius: 8, border: "1px solid rgba(255,214,107,0.3)" }}>
                    <strong style={{ color: "#ffd66b" }}>{totalCount}</strong> itens
                  </span>
                  <span style={{ background: "rgba(255,214,107,0.15)", padding: "2px 8px", borderRadius: 8, border: "1px solid rgba(255,214,107,0.3)" }}>
                    💰 <strong style={{ color: "#ffd66b" }}>{bank.gold.toLocaleString()}</strong>
                  </span>
                </div>
              </div>
            </div>

            {/* Abas de categoria */}
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
              {CATS.map((c) => {
                const active = mochilaCat === c.id;
                const count = c.id === "all" ? entries.length : entries.filter(([id]) => catOf(id) === c.id).length;
                return (
                  <button
                    key={c.id}
                    onClick={() => setMochilaCat(c.id)}
                    style={{
                      padding: "8px 14px", fontSize: 11, fontWeight: 800, letterSpacing: 0.5,
                      background: active ? "linear-gradient(180deg, #ffd66b, #b8862a)" : "rgba(30,15,50,0.7)",
                      color: active ? "#0b0510" : "#c8b8d0",
                      border: active ? "2px solid #fff4d0" : "2px solid rgba(255,214,107,0.25)",
                      borderRadius: 10, cursor: "pointer",
                      boxShadow: active ? "0 4px 12px rgba(255,214,107,0.4)" : "none",
                      display: "flex", alignItems: "center", gap: 6,
                    }}
                  >
                    <span>{c.icon}</span> {c.label} <span style={{ opacity: 0.7, fontSize: 10 }}>({count})</span>
                  </button>
                );
              })}
            </div>

            {filtered.length === 0 ? (
              <div style={{
                color: "#8a7a9c", fontSize: 13, padding: 40, textAlign: "center",
                background: "rgba(20,10,35,0.55)", border: "2px dashed #4a3560", borderRadius: 14,
              }}>
                {entries.length === 0
                  ? "Sua mochila está vazia. Derrote Pokémon, abra baús ou visite a Loja!"
                  : "Nenhum item nesta categoria."}
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: 10 }}>
                {filtered.map(([id, n]) => {
                  const isEgg = id.startsWith("egg_");
                  const color = isEgg ? (EGG_COLORS[id] ?? "#f5cf6b") : (ITEM_COLORS[id] ?? "#f5cf6b");
                  const img = ITEM_IMG[id];
                  const Icon = ITEM_ICONS[id] ?? Sparkles;
                  const sellPrice = marketSellPrices[id] ?? 0;
                  return (
                    <div key={id} style={{
                      background: "linear-gradient(160deg, #1a0f26 0%, #2a1638 60%, #1a0f26 100%)",
                      border: `2px solid ${color}66`, borderRadius: 12, padding: 10,
                      textAlign: "center", position: "relative",
                      boxShadow: `0 4px 14px rgba(0,0,0,0.55), inset 0 1px 0 ${color}33, 0 0 12px ${color}22`,
                      display: "flex", flexDirection: "column", gap: 6, alignItems: "center",
                      transition: "transform 120ms",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = `0 8px 20px rgba(0,0,0,0.7), inset 0 1px 0 ${color}55, 0 0 20px ${color}55`; }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = `0 4px 14px rgba(0,0,0,0.55), inset 0 1px 0 ${color}33, 0 0 12px ${color}22`; }}
                    >
                      {/* Badge quantidade */}
                      <div style={{
                        position: "absolute", top: 4, right: 4,
                        background: color, color: "#0b0510",
                        fontSize: 10, fontWeight: 900, padding: "2px 6px",
                        borderRadius: 999, minWidth: 22, textAlign: "center",
                        boxShadow: "0 2px 4px rgba(0,0,0,0.5)",
                        border: "1px solid rgba(255,255,255,0.4)",
                      }}>x{n}</div>
                      {/* Ícone */}
                      <div style={{
                        width: 60, height: 60, borderRadius: 12, marginTop: 4,
                        background: `radial-gradient(circle at 30% 30%, ${color}55, ${color}11 60%, transparent), rgba(0,0,0,0.35)`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        border: `1px solid ${color}66`,
                        boxShadow: `inset 0 0 10px ${color}33`,
                      }}>
                        {isEgg ? (
                          <div style={{
                            width: 38, height: 44, borderRadius: "45% / 55%",
                            background: `radial-gradient(circle at 30% 25%, #fff, ${color} 55%)`,
                            border: `1.5px solid ${color}`, boxShadow: `0 0 10px ${color}aa`,
                          }} />
                        ) : img
                          ? <img src={img} alt="" width={44} height={44} style={{ imageRendering: "pixelated", filter: "drop-shadow(0 2px 3px rgba(0,0,0,0.5))" }} />
                          : <Icon size={32} color={color} strokeWidth={2.2} />}
                      </div>
                      <div style={{ fontSize: 11, fontWeight: 800, color: "#eadfe8", letterSpacing: 0.3, lineHeight: 1.1 }}>{NAMES[id] ?? id}</div>
                      <div style={{ display: "flex", gap: 4, width: "100%" }}>
                        <button
                          onClick={() => onUseItem(id)}
                          style={{
                            flex: 1, padding: "6px 4px", fontSize: 10, fontWeight: 800,
                            background: `linear-gradient(180deg, ${color}, ${color}bb)`, color: "#0b0510",
                            border: "1px solid rgba(255,255,255,0.3)",
                            borderRadius: 6, cursor: "pointer", letterSpacing: 0.5,
                            boxShadow: `0 2px 6px ${color}55`,
                          }}
                        >{isEgg ? "CHOCAR" : "USAR"}</button>
                        {sellPrice > 0 && (
                          <button
                            onClick={() => onSellItem(id, 1)}
                            title={`Vender 1 por ${sellPrice} ouro`}
                            style={{
                              flex: 1, padding: "6px 4px", fontSize: 10, fontWeight: 800,
                              background: "linear-gradient(180deg, #f5cf6b, #b8862a)", color: "#0b0510",
                              border: "1px solid rgba(255,255,255,0.3)",
                              borderRadius: 6, cursor: "pointer", letterSpacing: 0.3,
                              boxShadow: "0 2px 6px rgba(184,134,42,0.5)",
                            }}
                          >💰 {sellPrice}</button>
                        )}
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
                              marginTop: 4, width: "100%", padding: "6px 4px", fontSize: 10, fontWeight: 800,
                              background: enabled ? "linear-gradient(180deg, #8bffb0, #3a8a5a)" : "rgba(60,50,80,0.6)",
                              color: enabled ? "#0b0510" : "#7a6a8c",
                              border: "1px solid rgba(255,255,255,0.2)",
                              borderRadius: 6, cursor: enabled ? "pointer" : "not-allowed", letterSpacing: 0.3,
                            }}
                          >⚒️ Forjar {rule.label} ({rule.cost}× · Lv.{rule.trainerLv})</button>
                        );
                      })()}
                    </div>
                  );
                })}
                {/* Slots vazios decorativos */}
                {Array.from({ length: emptyCount }).map((_, i) => (
                  <div key={`empty-${i}`} style={{
                    background: "rgba(20,10,35,0.4)",
                    border: "2px dashed rgba(74,53,96,0.5)", borderRadius: 12,
                    minHeight: 140,
                  }} />
                ))}
              </div>
            )}
          </div>
        );
      })()}


      {tab === "colecao" && (
        <div style={{
          background: "linear-gradient(180deg, #f5e6c8 0%, #e8d4a8 100%)",
          border: "3px solid #b8862a",
          borderRadius: 14, padding: 18,
          boxShadow: "inset 0 0 24px rgba(184,134,42,0.25), 0 4px 18px rgba(0,0,0,0.4)",
        }}>
          {/* HUD topo da coleção */}
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            marginBottom: 14, paddingBottom: 12,
            borderBottom: "2px solid rgba(184,134,42,0.5)",
          }}>
            <div>
              <div style={{ color: "#6b4a10", fontSize: 20, fontWeight: 900, letterSpacing: 3, fontFamily: "Georgia, serif" }}>
                ✦ COLEÇÃO ✦
              </div>
              <div style={{ color: "#8b6a30", fontSize: 12, marginTop: 2, fontStyle: "italic" }}>
                Registro particular do treinador
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <div style={{ background: collection.length >= MAX_COLLECTION ? "#c0392b" : "#b8862a", color: "#fff9e8", fontWeight: 900, padding: "8px 14px", borderRadius: 20, fontSize: 12, boxShadow: "0 2px 8px rgba(184,134,42,0.5)" }}>
                {collection.length} / {MAX_COLLECTION} NA COLEÇÃO
              </div>
              <div style={{ background: "#8b6a30", color: "#fff9e8", fontWeight: 900, padding: "8px 14px", borderRadius: 20, fontSize: 12 }}>
                {caughtSpecies.length} ESPÉCIES
              </div>
              <div style={{ background: "linear-gradient(180deg,#7c3aed,#4f26a4)", color: "#fff9e8", fontWeight: 900, padding: "8px 14px", borderRadius: 20, fontSize: 12, boxShadow: "0 2px 8px rgba(124,58,237,0.5)" }}>
                ⚒️ {craftPoints} PTS CRAFT
              </div>
            </div>
          </div>
          {collection.length === 0 ? (
            <div style={{ color: "#8b6a30", fontSize: 13, padding: 30, textAlign: "center", fontStyle: "italic" }}>
              Nenhum Pokémon capturado ainda. Continue a jornada — a taxa de captura é baixa (5%).
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: 12 }}>
              {collection.slice().sort((a, b) => b.capturedAt - a.capturedAt).map((entry, i) => {
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
                return (
                  <div
                    key={entry.uid}
                    style={{
                      background: "linear-gradient(180deg, #fff8e5, #f5e6c8)",
                      border: `2px solid ${isCurrent ? "#5ec26a" : "#b8862a"}`,
                      borderRadius: 10, padding: 10, textAlign: "center",
                      position: "relative",
                      boxShadow: `0 2px 8px rgba(0,0,0,0.15), inset 0 0 12px ${rColor}22`,
                      display: "flex", flexDirection: "column", gap: 4,
                    }}
                  >
                    <div style={{ position: "absolute", top: 4, left: 6, fontSize: 9, fontWeight: 900, color: "#8b6a30", letterSpacing: 1 }}>
                      #{String(i + 1).padStart(3, "0")}
                    </div>
                    {inTeam && (
                      <div style={{ position: "absolute", top: 4, right: 6, fontSize: 9, fontWeight: 900, color: "#3d7a4a" }}>★ TIME</div>
                    )}
                    <button
                      onClick={() => onOpenColecaoDetail(entry.uid)}
                      style={{ background: "transparent", border: "none", cursor: "pointer", padding: 0 }}
                      title="Ver detalhes"
                    >
                      {gifMap[sp] && <img src={gifMap[sp]} alt="" style={{ width: 64, height: 64, imageRendering: "pixelated", marginTop: 6 }} />}
                      <div style={{ fontSize: 11, marginTop: 2, color: "#4a3010", fontWeight: 800 }}>{sp.replace(/_/g, " ").toUpperCase()}</div>
                    </button>
                    <div style={{ fontSize: 9, padding: "2px 6px", borderRadius: 10, background: rColor, color: "#fff", alignSelf: "center", fontWeight: 800, letterSpacing: 1 }}>
                      {entry.rarity.toUpperCase()}
                    </div>
                    <div style={{ fontSize: 11, color: "#6b4a10", fontWeight: 900 }}>
                      Nv. {displayLevel}{inTeam && teamPet && teamPet.level !== entry.level ? ` (cap. Nv.${entry.level})` : ""}
                    </div>
                    {entry.traits && entry.traits.length > 0 && (
                      <div style={{ display: "flex", gap: 3, justifyContent: "center", flexWrap: "wrap", marginTop: 3 }} title={entry.traits.map((id) => TRAITS[id]?.name).filter(Boolean).join(" · ")}>
                        {entry.traits.slice(0, 4).map((id) => (
                          <TraitIcon key={id} id={id} size={22} />
                        ))}
                      </div>
                    )}
                    <button
                      onClick={() => {
                        if (inTeam) { alert("Retire do time antes de fragmentar."); return; }
                        if (!confirm(`Fragmentar ${sp.toUpperCase()} (Nv.${entry.level}) por +${gain} pts de craft?`)) return;
                        onFragmentCollection(entry.uid);
                      }}
                      disabled={inTeam}
                      style={{
                        marginTop: 2, padding: "5px 6px", fontSize: 10, fontWeight: 900,
                        background: inTeam ? "#c8b8a0" : "linear-gradient(180deg,#7c3aed,#4f26a4)",
                        color: "#fff", border: "none", borderRadius: 6,
                        cursor: inTeam ? "not-allowed" : "pointer", letterSpacing: 0.5,
                      }}
                      title={inTeam ? "No time — não pode fragmentar" : `+${gain} pts de craft`}
                    >⚒️ FRAGMENTAR +{gain}</button>
                  </div>
                );
              })}
            </div>
          )}
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
        <div>
          <div style={{
            display: "flex", gap: 12, marginBottom: 16, padding: "10px 14px",
            background: "linear-gradient(180deg, #1a0f26, #251638)",
            border: "1px solid rgba(245,207,107,0.25)", borderRadius: 8,
            alignItems: "center", justifyContent: "space-around", fontWeight: 800,
          }}>
            <span style={{ color: "#f4c430" }}>● Ouro: {fmtK(bank.gold)}</span>
            <span style={{ color: "#c084fc" }}>💎 Cristais: {Math.floor(bank.crystals)}</span>
          </div>

          <h3 style={{ color: "#6bd4ff", fontSize: 15, margin: "6px 0 10px" }}>Poções — pagas em ouro</h3>
          <div style={{
            background: "linear-gradient(160deg, #0f1f2e 0%, #16324a 100%)",
            border: "1px solid #6bd4ff55", borderRadius: 12, padding: 14, marginBottom: 20,
            display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap",
          }}>
            <div style={{ fontSize: 40 }}>🧪</div>
            <div style={{ flex: 1, minWidth: 160 }}>
              <div style={{ fontWeight: 800, color: "#eadfe8" }}>Poção</div>
              <div style={{ fontSize: 11, color: "#b8a8c8" }}>Recupera {Math.round(POTION_HEAL_PCT * 100)}% do HP. Usada no auto quando ativado.</div>
              <div style={{ fontSize: 12, color: "#f4c430", fontWeight: 700 }}>● {POTION_PRICE} ouro cada</div>
              <div style={{ fontSize: 11, color: "#8a7a9c" }}>Você tem: {items.potion ?? 0}</div>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              {[1, 5, 20].map((q) => (
                <button key={q} onClick={() => onBuyPotion(q)}
                  disabled={bank.gold < POTION_PRICE * q}
                  style={{
                    padding: "8px 12px", fontWeight: 800, borderRadius: 6, border: "none",
                    background: bank.gold >= POTION_PRICE * q ? "#6bd4ff" : "#3a2a4a",
                    color: bank.gold >= POTION_PRICE * q ? "#06121e" : "#6a5a7c",
                    cursor: bank.gold >= POTION_PRICE * q ? "pointer" : "not-allowed",
                  }}
                >+{q}</button>
              ))}
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
                  background: "linear-gradient(160deg, #1a0f26 0%, #251638 100%)",
                  border: `1px solid ${color}55`, borderRadius: 12, padding: 14,
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
                  boxShadow: `0 4px 14px rgba(0,0,0,0.4), inset 0 1px 0 ${color}22`,
                }}>
                  <img src={b.img} alt="" width={64} height={64}
                    style={{ imageRendering: "pixelated", filter: `drop-shadow(0 0 8px ${color}88)` }} />
                  <div style={{ fontWeight: 800, color: "#eadfe8", fontSize: 14 }}>{b.name}</div>
                  <div style={{ fontSize: 11, color: "#b8a8c8" }}>Chance de captura x{b.captureMult}</div>
                  <div style={{ fontSize: 12, color: "#f4c430", fontWeight: 700 }}>● {b.price} ouro</div>
                  <div style={{ fontSize: 11, color: "#8a7a9c" }}>Você tem: {owned}</div>
                  <button
                    onClick={() => onBuyBall(b)}
                    disabled={!canBuy}
                    style={{
                      width: "100%", padding: "8px 10px", fontWeight: 800,
                      background: canBuy ? color : "#3a2a4a",
                      color: canBuy ? "#0b0510" : "#6a5a7c",
                      border: "none", borderRadius: 6,
                      cursor: canBuy ? "pointer" : "not-allowed",
                    }}
                  >{canBuy ? "COMPRAR" : "SEM OURO"}</button>
                </div>
              );
            })}
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
                  background: "linear-gradient(160deg, #1a0f26 0%, #251638 100%)",
                  border: `1px solid ${color}55`, borderRadius: 12, padding: 14,
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
                  boxShadow: `0 4px 14px rgba(0,0,0,0.4), inset 0 1px 0 ${color}22`,
                }}>
                  <img src={bk.img} alt="" width={64} height={64}
                    style={{ imageRendering: "pixelated", filter: `drop-shadow(0 0 8px ${color}88)` }} />
                  <div style={{ fontWeight: 800, color: "#eadfe8", fontSize: 13 }}>{bk.name}</div>
                  <div style={{ fontSize: 11, color: "#b8a8c8", textAlign: "center" }}>{bk.desc}</div>
                  <div style={{ fontSize: 12, color: useGold ? "#ffd94d" : "#c084fc", fontWeight: 700 }}>{useGold ? "🪙" : "💎"} {bk.price}</div>
                  <div style={{ fontSize: 11, color: "#8a7a9c" }}>Você tem: {owned}</div>
                  <button
                    onClick={() => onBuyBook(bk)}
                    disabled={!canBuy}
                    style={{
                      width: "100%", padding: "8px 10px", fontWeight: 800,
                      background: canBuy ? color : "#3a2a4a",
                      color: canBuy ? "#0b0510" : "#6a5a7c",
                      border: "none", borderRadius: 6,
                      cursor: canBuy ? "pointer" : "not-allowed",
                    }}
                  >{canBuy ? "COMPRAR" : "SEM CRISTAL"}</button>
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
              const available = collection.filter((c) => c.rarity === t.rarity).length;
              const canTrade = available >= t.count;
              const owned = items[t.orbId] ?? 0;
              return (
                <div key={t.orbId} style={{
                  background: "linear-gradient(160deg, #1a0f26 0%, #251638 100%)",
                  border: `1px solid ${t.color}55`, borderRadius: 12, padding: 14,
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
                  boxShadow: `0 4px 14px rgba(0,0,0,0.4), inset 0 1px 0 ${t.color}22`,
                }}>
                  <img src={t.img} alt="" width={64} height={64}
                    style={{ imageRendering: "pixelated", filter: `drop-shadow(0 0 10px ${t.color}aa)` }} />
                  <div style={{ fontWeight: 800, color: "#eadfe8", fontSize: 13 }}>{t.label}</div>
                  <div style={{ fontSize: 11, color: "#b8a8c8", textAlign: "center" }}>{t.desc}</div>
                  <div style={{ fontSize: 11, color: canTrade ? "#8ae28a" : "#e28a8a" }}>
                    Coleção {t.rarity.toUpperCase()}: {available} (precisa {t.count})
                  </div>
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
                  >{canTrade ? "ESCOLHER POKÉMON" : `PRECISA DE ${t.count} ${t.rarity.toUpperCase()}`}</button>
                </div>
              );
            })}
          </div>

          {orbPicker && (() => {
            const eligible = collection.filter((c) => c.rarity === orbPicker.rarity);
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
                      onClick={() => {
                        onTradeOrb(orbPicker.orbId, Array.from(orbPickerSel));
                        setOrbPicker(null);
                        setOrbPickerSel(new Set());
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
  created_at: string;
};
function MarketScreen({
  items, bank, identity, isVip, onList, onBuy, onCancel, onNpcSell, npcPrices,
}: {
  items: Record<string, number>;
  bank: { gold: number; crystals: number };
  identity: LocalIdentity | null;
  isVip: boolean;
  onList: (itemId: string, qty: number, price: number) => Promise<boolean>;
  onBuy: (l: { id: string; seller_id: string; item_id: string; qty: number; price: number }) => Promise<boolean>;
  onCancel: (l: { id: string; item_id: string; qty: number; seller_id: string }) => Promise<boolean>;
  onNpcSell: (id: string, qty?: number) => void;
  npcPrices: Record<string, number>;
}) {
  const LABELS: Record<string, string> = {
    pokeball: "Pokébola", greatball: "Great Ball", ultraball: "Ultra Ball",
    chest_amulet: "Amuleto do Baú",
    potion: "Poção",
  };
  const ICONS: Record<string, string> = {
    pokeball: "⚪", greatball: "🔴", ultraball: "🟡",
    chest_amulet: "🎗", potion: "🧪",
  };
  const [listings, setListings] = useState<MarketListing[]>([]);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"browse" | "create" | "npc">("browse");
  const [selItem, setSelItem] = useState<string>("pokeball");
  const [selQty, setSelQty] = useState<number>(1);
  const [selPrice, setSelPrice] = useState<number>(500);

  const refresh = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("market_listings")
      .select("id, seller_id, seller_name, item_id, qty, price, created_at, sold_at")
      .is("sold_at", null)
      .order("created_at", { ascending: false })
      .limit(100);
    setLoading(false);
    if (!error && data) setListings(data as unknown as MarketListing[]);
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
          {mine.length > 0 && (
            <>
              <div style={{ color: "#8fd0ff", fontSize: 12, fontWeight: 800, margin: "6px 2px" }}>MEUS ANÚNCIOS</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 10, marginBottom: 16 }}>
                {mine.map((l) => (
                  <div key={l.id} style={{ background: "#101a2a", border: "1px solid #4a9eff55", borderRadius: 10, padding: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ fontSize: 22 }}>{ICONS[l.item_id] ?? "📦"}</div>
                      <div>
                        <div style={{ color: "#f5cf6b", fontWeight: 800, fontSize: 13 }}>{l.qty}x {LABELS[l.item_id] ?? l.item_id}</div>
                        <div style={{ color: "#8a7a9c", fontSize: 11 }}>Seu anúncio</div>
                      </div>
                    </div>
                    <div style={{ fontSize: 12, color: "#c8b8d0", margin: "8px 0" }}>Preço: <b style={{ color: "#ff9d3d" }}>{l.price.toLocaleString()} ouro</b></div>
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
                const canBuy = bank.gold >= l.price;
                return (
                  <div key={l.id} style={{ background: "#1a0f26", border: "1px solid #ff9d3d66", borderRadius: 10, padding: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ fontSize: 22 }}>{ICONS[l.item_id] ?? "📦"}</div>
                      <div>
                        <div style={{ color: "#f5cf6b", fontWeight: 800, fontSize: 13 }}>{l.qty}x {LABELS[l.item_id] ?? l.item_id}</div>
                        <div style={{ color: "#8a7a9c", fontSize: 11 }}>por <b style={{ color: "#c8b8d0" }}>{l.seller_name}</b></div>
                      </div>
                    </div>
                    <div style={{ fontSize: 12, color: "#c8b8d0", margin: "8px 0" }}>Preço: <b style={{ color: "#ff9d3d" }}>{l.price.toLocaleString()} ouro</b></div>
                    <button disabled={!canBuy} onClick={() => void onBuy(l).then((ok) => { if (ok) void refresh(); })}
                      style={{ width: "100%", background: !canBuy ? "#333" : "linear-gradient(180deg,#ff9d3d,#8b4a10)", color: "#0e0818", border: "none", borderRadius: 6, padding: "8px 0", fontWeight: 800, cursor: !canBuy ? "not-allowed" : "pointer", fontSize: 12 }}>
                      {canBuy ? "Comprar" : "Ouro insuficiente"}
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
          <select value={selItem} onChange={(e) => setSelItem(e.target.value)}
            style={{ width: "100%", background: "#0e0818", color: "#f3e5c5", border: "1px solid #ffd94d55", borderRadius: 6, padding: 8, marginBottom: 10 }}>
            {Object.keys(npcPrices).map((id) => (
              <option key={id} value={id}>{LABELS[id] ?? id} (tenho {items[id] ?? 0})</option>
            ))}
          </select>
          <label style={{ fontSize: 12, color: "#c8b8d0", display: "block", marginBottom: 4 }}>Quantidade</label>
          <input type="number" min={1} max={999} value={selQty} onChange={(e) => setSelQty(Math.max(1, parseInt(e.target.value) || 1))}
            style={{ width: "100%", background: "#0e0818", color: "#f3e5c5", border: "1px solid #ffd94d55", borderRadius: 6, padding: 8, marginBottom: 10 }} />
          <label style={{ fontSize: 12, color: "#c8b8d0", display: "block", marginBottom: 4 }}>Preço total (ouro)</label>
          <input type="number" min={1} value={selPrice} onChange={(e) => setSelPrice(Math.max(1, parseInt(e.target.value) || 1))}
            style={{ width: "100%", background: "#0e0818", color: "#f3e5c5", border: "1px solid #ffd94d55", borderRadius: 6, padding: 8, marginBottom: 12 }} />
          <button disabled={!isVip || (items[selItem] ?? 0) < selQty}
            onClick={async () => { const ok = await onList(selItem, selQty, selPrice); if (ok) { setMode("browse"); void refresh(); } }}
            style={{ width: "100%", background: (!isVip || (items[selItem] ?? 0) < selQty) ? "#333" : "linear-gradient(180deg,#ffd94d,#8b6a10)", color: "#0e0818", border: "none", borderRadius: 8, padding: "10px 0", fontWeight: 800, cursor: (!isVip || (items[selItem] ?? 0) < selQty) ? "not-allowed" : "pointer" }}>
            {isVip ? "Publicar anúncio" : "🔒 VIP necessário"}
          </button>
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


