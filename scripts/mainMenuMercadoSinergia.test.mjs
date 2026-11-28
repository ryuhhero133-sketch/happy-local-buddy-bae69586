import assert from "node:assert/strict";
import { readFileSync, statSync } from "node:fs";
import test from "node:test";

const read = (file) => readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
const menu = read("src/components/hud/MainMenu.tsx");

test("Mercado e Sinergia ficam na grade principal do menu", () => {
  const items = menu.slice(menu.indexOf("const items: MenuItem[] = ["), menu.indexOf("];", menu.indexOf("const items: MenuItem[] = [")));
  assert.match(items, /label: "Mercado", icon: iconMercado/);
  assert.match(items, /label: "Sinergia", icon: iconSinergia/);
  assert.match(items, /label: "Mercado".*x: 50, y: 79\.5/);
  assert.match(items, /label: "Sinergia".*x: 77\.5, y: 79\.5/);
  assert.doesNotMatch(items, /label: "Configurações"/);
  assert.doesNotMatch(items, /label: "Perfil"/);
});

test("Mercado e Sinergia saem da lista de extras para não duplicar", () => {
  const extras = menu.slice(menu.indexOf("const extras:"), menu.indexOf("];", menu.indexOf("const extras:")));
  assert.doesNotMatch(extras, /label: "Mercado"/);
  assert.doesNotMatch(extras, /label: "Sinergia"/);
  assert.match(extras, /label: "Código"/);
  assert.match(extras, /label: "Salvar"/);
  assert.match(extras, /label: "Restaurar HUD"/);
});

test("o menu usa os novos ícones de Mercado e Sinergia", () => {
  assert.match(menu, /import iconMercado from "@\/ambiente\/aba\/men ic\/Mercado\.webp"/);
  assert.match(menu, /import iconSinergia from "@\/ambiente\/aba\/men ic\/Sinergia\.webp"/);
  assert.doesNotMatch(menu, /Opções\.webp|Perfil\.webp|Markt\.webp/);

  for (const file of ["src/ambiente/aba/men ic/Mercado.webp", "src/ambiente/aba/men ic/Sinergia.webp"]) {
    const stat = statSync(new URL(`../${file}`, import.meta.url));
    assert.ok(stat.size > 0 && stat.size < 64 * 1024, `${file} com tamanho inesperado: ${stat.size}`);
  }
});
