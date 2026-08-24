
// Lógica do servidor para syncClientState.
// Separado para evitar limites de transformação e problemas com SSR.

const CAP_GAIN = {
  gold: 250_000,
  crystal: 500,
  trainer_xp: 80_000,
  trainer_level: 3,
  kill_count: 60,
  ball_per_type: 120,
  new_pokemons: 15,
};

const comboKey = (s: string, r: string) => `${s}:${r}`;

export async function syncClientState_handler({ data, context }: { data: any, context: any }) {
  const supabase = context.supabase as any;
  const userId = context.userId;

  const { data: cur } = await supabase.from("trainer_state")
    .select("gold, crystal, ruby, trainer_level, trainer_xp, kill_count")
    .eq("user_id", userId).maybeSingle();

  if (!cur) {
    return { ok: false, clamped: false };
  }

  let clamped = false;
  const clamp = (prev: number, next: number, maxGain: number, resourceName: string) => {
    if (next <= prev) return next;
    
    // Log suspicious jumps if we were to allow them (but we block them)
    if (next > prev + maxGain) {
      console.warn(`[SECURITY] Suspicious ${resourceName} jump for ${userId}: ${prev} -> ${next} (max ${maxGain})`);
      clamped = true;
    }
    
    // For critical resources, we ONLY allow server-driven updates via specific actions (reportKill).
    // The sync function should NOT increase these values based on client state.
    return prev; 
  };


  const newGold  = clamp(Number(cur.gold),  data.gold,  CAP_GAIN.gold, "gold");
  const newCry   = clamp(Number(cur.crystal), data.crystal, CAP_GAIN.crystal, "crystal");
  const newRuby  = clamp(Number(cur.ruby ?? 0), data.ruby, 1000, "ruby");
  const newLevel = clamp(cur.trainer_level, data.trainer_level, CAP_GAIN.trainer_level, "level");
  const newXp    = clamp(Number(cur.trainer_xp), data.trainer_xp, CAP_GAIN.trainer_xp, "xp");
  const newKills = clamp(Number(cur.kill_count), data.kill_count, CAP_GAIN.kill_count, "kills");

  await supabase.from("trainer_state").update({
    gold: newGold, crystal: newCry, ruby: newRuby,
    trainer_level: newLevel, trainer_xp: newXp, kill_count: newKills,
    active_map: data.active_map ?? undefined,
    updated_at: new Date().toISOString(),
  }).eq("user_id", userId);

  const { data: curBalls } = await supabase.from("pokeballs")
    .select("ball_type, qty").eq("user_id", userId);
  const curMap: Record<string, number> = {};
  for (const b of curBalls ?? []) curMap[b.ball_type] = Number(b.qty);

  for (const [bt, qty] of Object.entries(data.pokeballs)) {
    const prev = curMap[bt] ?? 0;
    const nxt = clamp(prev, qty as number, CAP_GAIN.ball_per_type, `ball:${bt}`);
    if (nxt !== prev) {
      await supabase.from("pokeballs").upsert(
        { user_id: userId, ball_type: bt, qty: nxt },
        { onConflict: "user_id,ball_type" },
      );
    }
  }

  if (data.collection && data.collection.length > 0) {
    const { data: existing } = await supabase.from("pokemon_collection")
      .select("id, species, level, xp, rarity, hp_max, hp_current, team_slot").eq("user_id", userId);
    
    const byId = new Map<string, any>();
    const byCombo = new Map<string, any>();
    for (const row of existing ?? []) {
      byId.set(row.id, row);
      const key = comboKey(row.species, row.rarity);
      const prev = byCombo.get(key);
      if (!prev || Number(row.level) > Number(prev.level)) byCombo.set(key, row);
    }

    const seenIncoming = new Set<string>();
    const news: any[] = [];
    for (const p of data.collection) {
      const incomingKey = p.id ?? comboKey(p.species, p.rarity);
      if (seenIncoming.has(incomingKey)) continue;
      seenIncoming.add(incomingKey);

      const current = p.id ? byId.get(p.id) : byCombo.get(comboKey(p.species, p.rarity));
      if (current) {
        const currentLevel = Number(current.level ?? 1);
        // O servidor NUNCA confia no nível vindo do cliente.
        // O cliente só pode diminuir vida ou mudar slot, não ganhar XP/Level via sync.
        const hp = 20 + currentLevel * 4;
        await supabase.from("pokemon_collection").update({
          team_slot: p.team_slot ?? null,
          hp_current: Math.min(Number(current.hp_max ?? hp), p.hp_current ?? hp),
        }).eq("user_id", userId).eq("id", current.id);
      } else {
        news.push(p);
      }
    }

    const limitedNews = news.slice(0, CAP_GAIN.new_pokemons);
    if (limitedNews.length < news.length) clamped = true;
    if (limitedNews.length > 0) {
      const rows = limitedNews.map((p) => {
        const hp = 20 + p.level * 4;
        return {
          ...(p.id ? { id: p.id } : {}),
          user_id: userId, species: p.species, level: p.level, rarity: p.rarity,
          xp: p.xp ?? 0, hp_current: hp, hp_max: hp, energy: 100, team_slot: p.team_slot ?? null,
        };
      });
      await supabase.from("pokemon_collection").insert(rows);
    }
  }

  const username = (context.claims as any)?.user_metadata?.username ?? "Treinador";
  const { count: pokedexCount } = await supabase.from("pokemon_collection")
    .select("id", { count: "exact", head: true }).eq("user_id", userId);
  
  await supabase.from("ranked_scores").upsert({
    user_id: userId, username,
    trainer_level: newLevel,
    pokedex_count: pokedexCount ?? 0,
    total_kills: newKills,
    updated_at: new Date().toISOString(),
  }, { onConflict: "user_id" });

  return { ok: true, clamped };
}
