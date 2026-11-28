/**
 * Mapas privados da conta "Nissan Klow".
 *
 * Eles só aparecem no Mapa Mundi para o dono da conta. A lista fica separada
 * das imagens para que `mapAccess` continue sendo um módulo leve, sem carregar
 * os assets no bundle de quem não pode ver os mapas.
 */
export const NISSAN_KLOW_MAP_IDS = [
  "nissan_klow_0",
  "nissan_klow_1",
  "nissan_klow_2",
  "nissan_klow_3",
  "nissan_klow_4",
  "nissan_klow_5",
  "nissan_klow_0055",
  "nissan_klow_55",
  "nissan_klow_a",
  "nissan_klow_b",
  "nissan_klow_c",
  "nissan_klow_d",
  "nissan_klow_e",
  "nissan_klow_f",
  "nissan_klow_g",
  "nissan_klow_h",
  "nissan_klow_i",
  "nissan_klow_j",
  "nissan_klow_k",
  "nissan_klow_l",
  "nissan_klow_m",
  "nissan_klow_n",
  "nissan_klow_o",
  "nissan_klow_p",
  "nissan_klow_q",
  "nissan_klow_florest_r3",
  "nissan_klow_geluh_pass",
  "nissan_klow_pantano_1",
  "nissan_klow_pantano_2",
  "nissan_klow_pantano_3",
] as const;

export type NissanKlowMapId = typeof NISSAN_KLOW_MAP_IDS[number];

export const isNissanKlowMap = (id: string): id is NissanKlowMapId =>
  (NISSAN_KLOW_MAP_IDS as readonly string[]).includes(id);
