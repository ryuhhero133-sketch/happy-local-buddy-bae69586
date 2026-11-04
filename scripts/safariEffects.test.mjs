import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { transformSync } from "esbuild";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
async function loadTs(source) {
  const js = transformSync(source, { loader: "ts", format: "esm" }).code;
  return import(`data:text/javascript;base64,${Buffer.from(js).toString("base64")}`);
}
const safari = await loadTs(read("../src/game/safari.ts"));
const idle = read("../src/routes/idle.tsx");
const css = read("../src/components/hud/hud.css");
const start = idle.indexOf("const SKILL_DEFS:");
const end = idle.indexOf("// Sonífero dedicado", start);
const { SKILL_DEFS } = await loadTs(`${idle.slice(start, end)}\nexport { SKILL_DEFS };`);

test("Safari: cada espécie usa cinco skills reais, incluindo áreas e esfera", () => {
  for (const sp of safari.SAFARI_SPECIES) {
    const ids = safari.safariSkillIds("sa", sp);
    assert.equal(new Set(ids).size, 5);
    assert.ok(ids.some((id) => id.startsWith("safari_")));
    const defs = ids.map((id) => {
      assert.ok(SKILL_DEFS[id], `skill inexistente: ${id}`);
      return SKILL_DEFS[id];
    });
    assert.ok(defs.filter((s) => s.delivery.startsWith("aoe")).length >= 2);
    assert.ok(new Set(defs.map((s) => s.element)).size >= 3);
    for (const skill of defs) {
      assert.ok(idle.includes(`${skill.sheet}:`), `sprite ausente: ${skill.sheet}`);
      assert.ok(skill.castTime > 0 && skill.cooldown >= 8000);
    }
  }
});
test("novos ataques são exclusivos do Safari, sem liberar skills em outros mapas", () => {
  for (const sp of safari.SAFARI_SPECIES) assert.deepEqual(safari.safariSkillIds("mapinha13", sp), []);
  assert.deepEqual(safari.safariSkillIds("sa", "oddish"), []);
  assert.ok(idle.includes("s.id !== safariLastSkillRef.current.get(e.id)"));
  assert.ok(idle.includes("safariLastSkillRef.current.clear()"));
  assert.ok(idle.includes("if (!e.aggressive) continue;"));
  assert.ok(idle.includes("if (castingNow >= 3) break;"));
});
test("anéis de atividade aparecem somente com is-active, sem bloquear cliques", () => {
  for (const name of ["revo-auto", "revo-potion"]) {
    assert.ok(css.includes(`.${name}.is-active > span::before`));
    assert.ok(css.includes(`.${name}.is-active > span::after`));
    assert.ok(css.includes(`.${name}.is-active > strong::after`));
  }
  assert.match(css, /@keyframes combatRingOrbit/);
  assert.match(css, /content: "ON"/);
  assert.match(css, /prefers-reduced-motion/);
});
test("auras usam partículas, cores distintas e camada atrás do Pokémon", () => {
  assert.ok(css.includes("--safari-core: #190729b8"));
  assert.ok(css.includes("--safari-core: #b82d854d"));
  assert.match(css, /@keyframes safariOrbPulse/);
  assert.ok(css.includes(".safari-aura-wave"));
  assert.match(css, /\.safari-wild-aura \{[^}]*z-index: -1/);
  assert.ok(idle.includes('aria-hidden="true" className={`safari-wild-aura'));
});
