// Banco PostgreSQL local/descartável via PGlite. Nunca conecta ao projeto remoto.
// Instale @electric-sql/pglite@0.6.0 em uma pasta temporária e informe PGLITE_MODULE.
import assert from "node:assert/strict";
import { randomUUID, createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import test from "node:test";
const read = file => readFileSync(new URL(`../supabase/migrations/${file}`, import.meta.url), "utf8");
test("Postgres: custódia, inicial, moedas, duplicação, permissões, VIP e limite global", { skip: !process.env.PGLITE_MODULE, timeout: 120000 }, async t => {
  const { PGlite } = await import(pathToFileURL(process.env.PGLITE_MODULE).href);
  const db = new PGlite();
  t.after(() => db.close());
  await db.exec(`
    create role anon; create role authenticated; create role service_role;
    create schema auth; create table auth.users(id uuid primary key);
    create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
    create table public.profiles(id uuid primary key,username text);
    create table public.game_saves(user_id uuid primary key,data jsonb,save_version bigint not null default 1,updated_at timestamptz default now());
    create table public.ranked_leaderboard(id int); create table public.ranked_seasons(id int);
  `);
  await db.exec(read("20261121170000_secure_marketplace_and_global_ranking.sql"));
  const seller = randomUUID(), buyer = randomUUID(), premium = randomUUID();
  const starter = { uid: "starter", species: "charizard", level: 20, rarity: "rare", capturedAt: 1 };
  const sale = { uid: "sale", species: "mewtwo_ancestral", level: 100, rarity: "mythic_shiny", capturedAt: 10, traits: ["atk_gold"], event: "ancestral", legacyStars: 8, statBoost: 1.2 };
  const sale2 = { uid: "sale2", species: "pikachu", level: 10, rarity: "rare", capturedAt: 11 };
  const snapshot = (vip = false) => ({
    idle: { currentMap: "mapinha6", buffs: { goldMult: vip ? 0.4 : 0, goldMultUntil: vip ? Date.now() + 365 * 86400000 : 0, expMult: 0, expMultUntil: 0 }, bank: { gold: 5000, crystals: 100, ruby: 0 }, items: { potion: 10, morango: 3, safira_verde: 10 }, collection: [starter, sale, sale2], caughtSpecies: [], seenSpecies: [], journey: { completed: true } },
    team: [starter], restingBench: [], savedAt: Date.now(),
  });
  for (const [id, vip] of [[seller,false],[buyer,false],[premium,true]]) {
    const s = snapshot(vip);
    if (id !== seller) { s.idle.collection = []; s.team = []; }
    await db.query("insert into auth.users values($1);", [id]);
    await db.query("insert into public.profiles values($1,$2);", [id,id === seller ? "Vendedor" : "Comprador"]);
    await db.query("insert into public.game_saves(user_id,data) values($1,$2);", [id,JSON.stringify(s)]);
  }
  await db.exec(read("20261125111543_public_pokemon_marketplace.sql"));
  const as = async id => db.query("select set_config('request.jwt.claim.sub',$1,false)", [id ?? ""]);
  const saved = async id => (await db.query("select data,save_version::int from public.game_saves where user_id=$1",[id])).rows[0];
  const rpc = async (id, action, args = {}) => {
    await as(id); const version = (await saved(id)).save_version;
    return (await db.query("select public.market_pokemon($1,$2,$3,$4,$5,$6) as r", [action,args.version ?? version,args.listing ?? null,args.uid ?? null,args.price ?? null,args.currency ?? null])).rows[0].r;
  };
  const list = uid => rpc(seller,"list",{ uid,price:300,currency:"gold" });
  assert.equal((await list("starter")).reason,"starter_not_tradeable");
  await db.query("update public.game_saves set data=jsonb_set(data,'{team}',(data->'team')||jsonb_build_array($2::jsonb)) where user_id=$1", [seller,JSON.stringify(sale2)]);
  assert.equal((await list("sale2")).reason,"pokemon_in_team");
  await db.query("update public.game_saves set data=jsonb_set(data,'{team}',jsonb_build_array($2::jsonb)) where user_id=$1",[seller,JSON.stringify(starter)]);
  const posted = await list("sale");
  assert.equal(posted.ok,true,JSON.stringify(posted));
  assert.equal(posted.removed_uid,"sale");
  assert.ok(!(await saved(seller)).data.idle.collection.some(p => p.uid === "sale"));
  assert.equal((await list("sale")).reason,"pokemon_unavailable");
  assert.equal((await rpc(buyer,"cancel",{listing:posted.listing_id})).reason,"not_owner");
  assert.equal((await rpc(seller,"buy",{listing:posted.listing_id})).reason,"own_listing");
  assert.equal((await rpc(buyer,"buy",{listing:posted.listing_id,version:0})).reason,"stale");
  const bought = await rpc(buyer,"buy",{listing:posted.listing_id});
  assert.equal(bought.ok,true,JSON.stringify(bought));
  assert.equal(bought.gold,4700);
  assert.match(bought.pet_data.uid,/^bought-/);
  assert.equal(bought.pet_data.event,"ancestral");
  assert.equal(bought.pet_data.legacyStars,8);
  assert.equal(bought.pet_data.statBoost,1.2);
  assert.equal((await rpc(premium,"buy",{listing:posted.listing_id})).reason,"listing_unavailable");
  // Um save velho não restaura o Pokémon que saiu da posse do vendedor.
  await as(seller);
  await db.query("update public.game_saves set data=jsonb_set(data,'{idle,collection}',(data#>'{idle,collection}')||jsonb_build_array($2::jsonb)) where user_id=$1",[seller,JSON.stringify(sale)]);
  assert.ok(!(await saved(seller)).data.idle.collection.some(p=>p.uid==="sale"));
  const paid = await rpc(seller,"claim",{listing:posted.listing_id});
  assert.equal(paid.ok,true); assert.equal(paid.gold,5300);
  assert.equal((await rpc(seller,"claim",{listing:posted.listing_id})).reason,"payout_unavailable");
  const cancelPost = await list("sale2");
  assert.equal(cancelPost.ok,true);
  const cancelled = await rpc(seller,"cancel",{listing:cancelPost.listing_id});
  assert.equal(cancelled.ok,true);
  assert.equal(cancelled.pet_data.uid,"sale2");
  assert.equal((await saved(seller)).data.idle.collection.filter(p=>p.uid==="sale2").length,1);
  assert.equal((await rpc(seller,"cancel",{listing:cancelPost.listing_id})).reason,"listing_unavailable");
  // Safira e itens liberados para conta sem VIP.
  await as(seller);
  const item = (await db.query("select public.market_list_item('morango',2,3,'safira',$1) as r",[(await saved(seller)).save_version])).rows[0].r;
  assert.equal(item.ok,true,JSON.stringify(item));
  await as(buyer);
  const itemBuy = (await db.query("select public.market_buy_item($1,$2) as r",[item.listing_id,(await saved(buyer)).save_version])).rows[0].r;
  assert.equal(itemBuy.ok,true); assert.equal(itemBuy.safira,7); assert.equal(itemBuy.item_qty,5);
  assert.equal((await rpc(seller,"claim",{listing:item.listing_id})).safira,13);
  await as(seller);
  const feed = (await db.query("select public.get_marketplace() as r")).rows[0].r;
  assert.equal(feed.starter_uid,"starter");
  await db.exec("set role anon");
  await assert.rejects(db.query("select public.get_marketplace()"),/permission denied/);
  await db.exec("reset role");
  // Bônus retroativo e mapas fechados sem tocar no VIP anual existente.
  await as(null);
  const premiumBefore = (await saved(premium)).data.idle.buffs;
  await db.exec(read("20261125111553_server_vip_bonus_and_limited_codes.sql"));
  const gift = await saved(seller);
  assert.equal(gift.data.idle.buffs.goldMult,0.2);
  assert.ok(Math.abs(gift.data.idle.buffs.goldMultUntil - Date.now() - 48*3600000)<20000);
  assert.deepEqual((await saved(premium)).data.idle.buffs,premiumBefore);
  const expiry=gift.data.idle.buffs.goldMultUntil;
  const stale=snapshot(); stale.idle.currentMap="iceblow";
  await db.query("update public.game_saves set data=$2 where user_id=$1",[seller,JSON.stringify(stale)]);
  const guarded=(await saved(seller)).data;
  assert.equal(guarded.idle.buffs.goldMultUntil,expiry);
  assert.equal(guarded.idle.currentMap,"laboratorio");
  assert.equal(guarded.idle.journey.completed,true);
  // Código de teste distinto dos códigos reais: três resgates globais, inclusive
  // repetidos na mesma conta. Falha/stale não consome um uso.
  const code="ANC3"+"A".repeat(20);
  const annual="VIPANUAL3"+"B".repeat(20);
  for (const [value,kind] of [[code,"ancestral_tickets"],[annual,"vip_annual"]]) {
    await db.query("insert into private.limited_server_reward_codes(code_hash,reward_kind,reward_qty) values($1,$2,1)",[createHash("sha256").update(value).digest("hex"),kind]);
  }
  const redeem=async(id,value,version) => {
    await as(id);
    return (await db.query("select public.redeem_limited_server_reward($1,$2) as r",[value,version ?? (await saved(id)).save_version])).rows[0].r;
  };
  assert.equal((await redeem(seller,code,0)).reason,"stale");
  assert.equal((await redeem(seller,code)).uses_remaining,2);
  assert.equal((await redeem(seller,code)).uses_remaining,1);
  assert.equal((await redeem(buyer,code)).uses_remaining,0);
  assert.equal((await redeem(premium,code)).reason,"invalid_or_used");
  assert.equal((await saved(seller)).data.idle.items.ticket_ancestral,2);
  assert.equal((await saved(buyer)).data.idle.items.ticket_ancestral,1);
  const annualGift=await redeem(premium,annual);
  assert.equal(annualGift.item_id,"book_vip_60"); assert.equal(annualGift.item_qty,1);
  assert.deepEqual((await saved(premium)).data.idle.buffs,premiumBefore);
  await as(null);
  assert.equal((await db.query("select public.redeem_limited_server_reward($1,1) as r",[code])).rows[0].r.reason,"unauthenticated");
  assert.equal((await db.query("select count(*)::int as n from private.limited_server_reward_codes where used_count>3")).rows[0].n,0);
  console.log("Postgres local: compra/cancelamento/pagamento, anti-duplicação, bônus e códigos verificados.");
});
