// Discos de Habilidade — 20 cards cortados de src/assets/DISCOS.png (1536x1024, 5x4).
// Registro visual + efeito Sonífero (player-side, 3s). Sem mudar economia/save.
import disc01 from "@/assets/01_skill_disc_raiz_aprisionante.png";
import disc02 from "@/assets/02_skill_disc_combustao.png";
import disc03 from "@/assets/03_skill_disc_mare_cortante.png";
import disc04 from "@/assets/04_skill_disc_pulso_voltaico.png";
import disc05 from "@/assets/05_skill_disc_impacto_rochoso.png";
import disc06 from "@/assets/06_skill_disc_toxina_sombria.png";
import disc07 from "@/assets/07_skill_disc_lamina_de_vendaval.png";
import disc08 from "@/assets/08_skill_disc_geada_paralisante.png";
import disc09 from "@/assets/09_skill_disc_golpe_brutal.png";
import disc10 from "@/assets/10_skill_disc_onda_mental.png";
import disc11 from "@/assets/11_skill_disc_eclipse.png";
import disc12 from "@/assets/12_skill_disc_raio_purificador.png";
import disc13 from "@/assets/13_skill_disc_ruptura_draconica.png";
import disc14 from "@/assets/14_skill_disc_abalo_sismico.png";
import disc15 from "@/assets/15_skill_disc_veu_fantasma.png";
import disc16 from "@/assets/16_skill_disc_lanca_metalica.png";
import disc17 from "@/assets/17_skill_disc_sonifero.png";
import disc18 from "@/assets/18_skill_disc_explosao_solar.png";
import disc19 from "@/assets/19_skill_disc_areia_dominante.png";
import disc20 from "@/assets/20_skill_disc_instinto_ancestral.png";

export type SkillDisc = {
  id: string;
  name: string;
  species: string;
  element: string;
  bonus: string;
  img: string;
};

export const SKILL_DISCS: SkillDisc[] = [
  { id: "01_raiz_aprisionante", name: "RAIZ APRISIONANTE", species: "bulbasaur", element: "planta", bonus: "Prende o alvo", img: disc01 },
  { id: "02_combustao", name: "COMBUSTÃO", species: "charmander", element: "fogo", bonus: "Queima o alvo", img: disc02 },
  { id: "03_mare_cortante", name: "MARÉ CORTANTE", species: "squirtle", element: "agua", bonus: "Corte aquático", img: disc03 },
  { id: "04_pulso_voltaico", name: "PULSO VOLTAICO", species: "pikachu", element: "eletrico", bonus: "Choque rápido", img: disc04 },
  { id: "05_impacto_rochoso", name: "IMPACTO ROCHOSO", species: "geodude", element: "pedra", bonus: "Pedrada brutal", img: disc05 },
  { id: "06_toxina_sombria", name: "TOXINA SOMBRIA", species: "gengar", element: "veneno", bonus: "Veneno sombrio", img: disc06 },
  { id: "07_lamina_de_vendaval", name: "LÂMINA DE VENDAVAL", species: "pidgeot", element: "voador", bonus: "Lâmina de vento", img: disc07 },
  { id: "08_geada_paralisante", name: "GEADA PARALISANTE", species: "vulpix", element: "gelo", bonus: "Congela o alvo", img: disc08 },
  { id: "09_golpe_brutal", name: "GOLPE BRUTAL", species: "machamp", element: "lutador", bonus: "Dano físico", img: disc09 },
  { id: "10_onda_mental", name: "ONDA MENTAL", species: "mew", element: "psiquico", bonus: "Onda psíquica", img: disc10 },
  { id: "11_eclipse", name: "ECLIPSE", species: "umbreon", element: "fantasma", bonus: "Golpe sombrio", img: disc11 },
  { id: "12_raio_purificador", name: "RAIO PURIFICADOR", species: "jirachi", element: "fada", bonus: "Luz purificadora", img: disc12 },
  { id: "13_ruptura_draconica", name: "RUPTURA DRACÔNICA", species: "dragonite", element: "dragao", bonus: "Fúria dracônica", img: disc13 },
  { id: "14_abalo_sismico", name: "ABALO SÍSMICO", species: "groudon", element: "pedra", bonus: "Tremor sísmico", img: disc14 },
  { id: "15_veu_fantasma", name: "VÉU FANTASMA", species: "gengar", element: "fantasma", bonus: "Véu espectral", img: disc15 },
  { id: "16_lanca_metalica", name: "LANÇA METÁLICA", species: "magnemite", element: "normal", bonus: "Lança de aço", img: disc16 },
  { id: "17_sonifero", name: "SONÍFERO", species: "butterfree", element: "inseto", bonus: "Dorme o inimigo por 3s", img: disc17 },
  { id: "18_explosao_solar", name: "EXPLOSÃO SOLAR", species: "arcanine", element: "fogo", bonus: "Explosão ígnea", img: disc18 },
  { id: "19_areia_dominante", name: "AREIA DOMINANTE", species: "sandslash", element: "pedra", bonus: "Tempestade de areia", img: disc19 },
  { id: "20_instinto_ancestral", name: "INSTINTO ANCESTRAL", species: "pikachu", element: "fada", bonus: "Instinto antigo", img: disc20 },
];

// Espécies cujo moveset tem Sleep Powder — podem procar SONÍFERO do jogador.
export const SONIFERO_SPECIES = new Set([
  "butterfree",
  "butterfree_shiny",
  "butterfree_shiny_plus",
  "venonat",
  "venomoth",
]);

export const SONIFERO_SLEEP_MS = 3000;
export const SONIFERO_PROC_CHANCE = 0.18;

export function leaderCanSonifero(species?: string | null): boolean {
  if (!species) return false;
  return SONIFERO_SPECIES.has(species);
}

// ═══ Discos iniciais: dropam no mapa, viram item acumulável, equipam no slot do Pokémon ═══
export type StarterDisc = {
  itemId: string;
  name: string;
  element: string;
  bonus: string;
  img: string;
  dmgMult?: number; // multiplica o dano do portador
  foeDmgMult?: number; // multiplica o dano recebido do inimigo
  rootFoe?: boolean; // inimigo não foge
};

export const STARTER_DISCS: StarterDisc[] = [
  { itemId: "disc_raiz", name: "RAIZ APRISIONANTE", element: "planta", bonus: "+10% dano e o inimigo não foge", img: disc01, dmgMult: 1.1, rootFoe: true },
  { itemId: "disc_combustao", name: "COMBUSTÃO", element: "fogo", bonus: "+20% dano do portador", img: disc02, dmgMult: 1.2 },
  { itemId: "disc_mare", name: "MARÉ CORTANTE", element: "agua", bonus: "Inimigo causa -20% dano", img: disc03, foeDmgMult: 0.8 },
];

export const DISC_ITEM_IDS = STARTER_DISCS.map((d) => d.itemId);

export function isDiscItem(id?: string | null): boolean {
  return !!id && (DISC_ITEM_IDS as string[]).includes(id);
}

export function discDefByItem(itemId?: string | null): StarterDisc | null {
  if (!itemId) return null;
  return STARTER_DISCS.find((d) => d.itemId === itemId) ?? null;
}

export function equippedDiscDef(pet?: { skillDisc?: string | null } | null): StarterDisc | null {
  if (!pet?.skillDisc) return null;
  return discDefByItem(pet.skillDisc);
}

// Mapas iniciais onde os 3 discos dropam no chão
export const DISC_DROP_MAPS = ["mapinha6", "arena", "mapinha13"];
export const DISC_DROP_CHANCE = 0.9; // TESTE: 90% — reverter para 0.025 depois
export const DISC_DROP_MAX = 6;
export const DISC_DROP_TTL_MS = 5 * 60 * 1000;
export const DISC_PICKUP_RADIUS = 46;
