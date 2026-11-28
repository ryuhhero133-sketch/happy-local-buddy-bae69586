import type { NissanKlowMapId } from "@/game/nissanKlowIds";

export type NissanKlowMap = {
  id: NissanKlowMapId;
  name: string;
  /** Arte completa, usada quando o jogador viaja para o mapa. */
  bg: string;
  /** Miniatura leve para o pino e a grade do Mapa Mundi. */
  thumb: string;
};

const assets = import.meta.glob("../assets/nissan-klow/*.webp", {
  eager: true,
  import: "default",
}) as Record<string, string>;

const asset = (file: string) => assets[`../assets/nissan-klow/${file}`] ?? "";

const DEFS = [
  ["nissan_klow_0", "Nissan Klow 0", "nissan-klow-0"],
  ["nissan_klow_1", "Nissan Klow 1", "nissan-klow-1"],
  ["nissan_klow_2", "Nissan Klow 2", "nissan-klow-2"],
  ["nissan_klow_3", "Nissan Klow 3", "nissan-klow-3"],
  ["nissan_klow_4", "Nissan Klow 4", "nissan-klow-4"],
  ["nissan_klow_5", "Nissan Klow 5", "nissan-klow-5"],
  ["nissan_klow_0055", "Nissan Klow 0055", "nissan-klow-0055"],
  ["nissan_klow_55", "Nissan Klow 55", "nissan-klow-55"],
  ["nissan_klow_a", "Nissan Klow A", "nissan-klow-a"],
  ["nissan_klow_b", "Nissan Klow B", "nissan-klow-b"],
  ["nissan_klow_c", "Nissan Klow C", "nissan-klow-c"],
  ["nissan_klow_d", "Nissan Klow D", "nissan-klow-d"],
  ["nissan_klow_e", "Nissan Klow E", "nissan-klow-e"],
  ["nissan_klow_f", "Nissan Klow F", "nissan-klow-f"],
  ["nissan_klow_g", "Nissan Klow G", "nissan-klow-g"],
  ["nissan_klow_h", "Nissan Klow H", "nissan-klow-h"],
  ["nissan_klow_i", "Nissan Klow I", "nissan-klow-i"],
  ["nissan_klow_j", "Nissan Klow J", "nissan-klow-j"],
  ["nissan_klow_k", "Nissan Klow K", "nissan-klow-k"],
  ["nissan_klow_l", "Nissan Klow L", "nissan-klow-l"],
  ["nissan_klow_m", "Nissan Klow M", "nissan-klow-m"],
  ["nissan_klow_n", "Nissan Klow N", "nissan-klow-n"],
  ["nissan_klow_o", "Nissan Klow O", "nissan-klow-o"],
  ["nissan_klow_p", "Nissan Klow P", "nissan-klow-p"],
  ["nissan_klow_q", "Nissan Klow Q", "nissan-klow-q"],
  ["nissan_klow_florest_r3", "Nissan Klow · Florest R3", "nissan-klow-florest-r3"],
  ["nissan_klow_geluh_pass", "Nissan Klow · Geluh Pass", "nissan-klow-geluh-pass"],
  ["nissan_klow_pantano_1", "Nissan Klow · Pântano 1", "nissan-klow-pantano-1"],
  ["nissan_klow_pantano_2", "Nissan Klow · Pântano 2", "nissan-klow-pantano-2"],
  ["nissan_klow_pantano_3", "Nissan Klow · Pântano 3", "nissan-klow-pantano-3"],
] as const satisfies ReadonlyArray<readonly [NissanKlowMapId, string, string]>;

export const NISSAN_KLOW_MAPS: NissanKlowMap[] = DEFS.map(([id, name, file]) => ({
  id,
  name,
  bg: asset(`${file}.webp`),
  thumb: asset(`${file}-thumb.webp`),
}));

export const NISSAN_KLOW_MAPS_BY_ID = Object.fromEntries(
  NISSAN_KLOW_MAPS.map((map) => [map.id, map]),
) as Record<NissanKlowMapId, NissanKlowMap>;
