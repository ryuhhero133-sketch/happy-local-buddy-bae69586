# Supabase — Setup Completo IDLE MON

Projeto: `lgbcornkaspoxqkyoiuj`

Cole **todo** o bloco SQL abaixo no **SQL Editor** do Supabase e clique em **Run**.
É idempotente — pode rodar quantas vezes quiser.

---

## 1) SQL principal (perfis + saves + presentes admin + guilda)

```sql
-- =========================================================================
-- PROFILES — Perfil do treinador
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id           UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username     TEXT,
  level        INTEGER NOT NULL DEFAULT 1,
  gold         INTEGER NOT NULL DEFAULT 0,
  crystal      INTEGER NOT NULL DEFAULT 0,
  ruby         INTEGER NOT NULL DEFAULT 0,
  avatar_skin  TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_login   TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username    TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS level       INTEGER NOT NULL DEFAULT 1;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS gold        INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS crystal     INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS ruby        INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_skin TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS created_at  TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_login  TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE public.profiles ALTER COLUMN username DROP NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_lower_idx
  ON public.profiles (lower(username)) WHERE username IS NOT NULL;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT SELECT ON public.profiles TO anon;
GRANT ALL ON public.profiles TO service_role;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_own"   ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_all"   ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own"   ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own"   ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete_own"   ON public.profiles;

-- Leitura pública LIMITADA (username + level) para chat / ranking / guilda
CREATE POLICY "profiles_select_all" ON public.profiles
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_delete_own" ON public.profiles
  FOR DELETE TO authenticated USING (auth.uid() = id);

-- Trigger: cria profile com username NULL no signup → força tela "Criar Treinador"
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, username) VALUES (NEW.id, NULL)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =========================================================================
-- GAME SAVES — Blob JSONB completo do jogador
-- (party, coleção, inventário, ouro, cristais, mapa atual, missões, etc.)
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.game_saves (
  user_id     UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  data        JSONB NOT NULL,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.game_saves TO authenticated;
GRANT ALL ON public.game_saves TO service_role;

ALTER TABLE public.game_saves ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "game_saves_select_own" ON public.game_saves;
DROP POLICY IF EXISTS "game_saves_insert_own" ON public.game_saves;
DROP POLICY IF EXISTS "game_saves_update_own" ON public.game_saves;
DROP POLICY IF EXISTS "game_saves_delete_own" ON public.game_saves;

CREATE POLICY "game_saves_select_own" ON public.game_saves
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "game_saves_insert_own" ON public.game_saves
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "game_saves_update_own" ON public.game_saves
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "game_saves_delete_own" ON public.game_saves
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS game_saves_set_updated_at ON public.game_saves;
CREATE TRIGGER game_saves_set_updated_at
  BEFORE UPDATE ON public.game_saves
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========================================================================
-- ADMIN GIFTS — Presentes enviados pelo admin
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.admin_gifts (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_username TEXT NOT NULL,
  recipient_user_id  UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  kind               TEXT NOT NULL CHECK (kind IN ('gold','crystal','ruby','item','ball')),
  item_id            TEXT,
  qty                INTEGER NOT NULL CHECK (qty > 0),
  note               TEXT,
  sender             TEXT NOT NULL DEFAULT 'admin',
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  claimed_at         TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS admin_gifts_recipient_user_idx
  ON public.admin_gifts (recipient_user_id) WHERE claimed_at IS NULL;
CREATE INDEX IF NOT EXISTS admin_gifts_recipient_name_idx
  ON public.admin_gifts (lower(recipient_username)) WHERE claimed_at IS NULL;

GRANT SELECT, INSERT, UPDATE ON public.admin_gifts TO authenticated;
GRANT ALL ON public.admin_gifts TO service_role;

ALTER TABLE public.admin_gifts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "auth_insert_gifts"       ON public.admin_gifts;
DROP POLICY IF EXISTS "recipient_select_gifts"  ON public.admin_gifts;
DROP POLICY IF EXISTS "recipient_update_gifts"  ON public.admin_gifts;

CREATE POLICY "auth_insert_gifts" ON public.admin_gifts
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "recipient_select_gifts" ON public.admin_gifts
  FOR SELECT TO authenticated USING (
    recipient_user_id = auth.uid()
    OR lower(recipient_username) = (SELECT lower(username) FROM public.profiles WHERE id = auth.uid())
  );
CREATE POLICY "recipient_update_gifts" ON public.admin_gifts
  FOR UPDATE TO authenticated USING (
    recipient_user_id = auth.uid()
    OR lower(recipient_username) = (SELECT lower(username) FROM public.profiles WHERE id = auth.uid())
  );

-- =========================================================================
-- GUILDS + MEMBERS + INVITES
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.guilds (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL UNIQUE,
  element         TEXT NOT NULL CHECK (element IN ('fire','water','grass','psychic','poison','fairy','flying')),
  level           INT NOT NULL DEFAULT 1,
  xp              INT NOT NULL DEFAULT 0,
  total_donated   INT NOT NULL DEFAULT 0,
  treasury_gold    INT NOT NULL DEFAULT 0,
  treasury_crystal INT NOT NULL DEFAULT 0,
  treasury_ruby    INT NOT NULL DEFAULT 0,
  founder_id      UUID NOT NULL,
  vice_leader_id  UUID,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.guild_members (
  guild_id       UUID NOT NULL REFERENCES public.guilds(id) ON DELETE CASCADE,
  user_id        UUID NOT NULL,
  username       TEXT NOT NULL,
  role           TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('leader','vice','member')),
  leader_species TEXT,
  level          INT NOT NULL DEFAULT 1,
  joined_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (guild_id, user_id),
  UNIQUE (user_id)
);

CREATE TABLE IF NOT EXISTS public.guild_invites (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guild_id      UUID NOT NULL REFERENCES public.guilds(id) ON DELETE CASCADE,
  guild_name    TEXT NOT NULL,
  from_user_id  UUID NOT NULL,
  from_username TEXT NOT NULL,
  to_user_id    UUID,
  to_username   TEXT NOT NULL,
  status        TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','declined')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS guild_invites_to_user_idx
  ON public.guild_invites (to_user_id) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS guild_invites_to_name_idx
  ON public.guild_invites (lower(to_username)) WHERE status = 'pending';

GRANT SELECT, INSERT, UPDATE, DELETE ON public.guilds        TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.guild_members TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.guild_invites TO authenticated;
GRANT ALL ON public.guilds        TO service_role;
GRANT ALL ON public.guild_members TO service_role;
GRANT ALL ON public.guild_invites TO service_role;

ALTER TABLE public.guilds        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guild_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guild_invites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "guilds_read_all"          ON public.guilds;
DROP POLICY IF EXISTS "guilds_insert_self"       ON public.guilds;
DROP POLICY IF EXISTS "guilds_update_member"     ON public.guilds;
DROP POLICY IF EXISTS "guilds_delete_founder"    ON public.guilds;

CREATE POLICY "guilds_read_all" ON public.guilds
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "guilds_insert_self" ON public.guilds
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = founder_id);
CREATE POLICY "guilds_update_member" ON public.guilds
  FOR UPDATE TO authenticated USING (
    EXISTS (SELECT 1 FROM public.guild_members m WHERE m.guild_id = guilds.id AND m.user_id = auth.uid())
  );
CREATE POLICY "guilds_delete_founder" ON public.guilds
  FOR DELETE TO authenticated USING (founder_id = auth.uid());

DROP POLICY IF EXISTS "gm_read_all"               ON public.guild_members;
DROP POLICY IF EXISTS "gm_insert_self"            ON public.guild_members;
DROP POLICY IF EXISTS "gm_update_self_or_leader"  ON public.guild_members;
DROP POLICY IF EXISTS "gm_delete_self_or_leader"  ON public.guild_members;

CREATE POLICY "gm_read_all" ON public.guild_members
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "gm_insert_self" ON public.guild_members
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "gm_update_self_or_leader" ON public.guild_members
  FOR UPDATE TO authenticated USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.guilds g WHERE g.id = guild_id AND (g.founder_id = auth.uid() OR g.vice_leader_id = auth.uid()))
  );
CREATE POLICY "gm_delete_self_or_leader" ON public.guild_members
  FOR DELETE TO authenticated USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.guilds g WHERE g.id = guild_id AND (g.founder_id = auth.uid() OR g.vice_leader_id = auth.uid()))
  );

DROP POLICY IF EXISTS "gi_read_involved"     ON public.guild_invites;
DROP POLICY IF EXISTS "gi_insert_member"     ON public.guild_invites;
DROP POLICY IF EXISTS "gi_update_recipient"  ON public.guild_invites;
DROP POLICY IF EXISTS "gi_delete_involved"   ON public.guild_invites;

CREATE POLICY "gi_read_involved" ON public.guild_invites
  FOR SELECT TO authenticated USING (from_user_id = auth.uid() OR to_user_id = auth.uid());
CREATE POLICY "gi_insert_member" ON public.guild_invites
  FOR INSERT TO authenticated WITH CHECK (
    from_user_id = auth.uid()
    AND EXISTS (SELECT 1 FROM public.guild_members m WHERE m.guild_id = guild_invites.guild_id AND m.user_id = auth.uid())
  );
CREATE POLICY "gi_update_recipient" ON public.guild_invites
  FOR UPDATE TO authenticated USING (to_user_id = auth.uid() OR from_user_id = auth.uid());
CREATE POLICY "gi_delete_involved" ON public.guild_invites
  FOR DELETE TO authenticated USING (from_user_id = auth.uid() OR to_user_id = auth.uid());

-- =========================================================================
-- RANKED — placar da temporada
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.ranked_scores (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  username     TEXT NOT NULL,
  score        INT  NOT NULL DEFAULT 0,
  season       INT  NOT NULL DEFAULT 1,
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, season)
);

CREATE INDEX IF NOT EXISTS ranked_scores_leaderboard_idx
  ON public.ranked_scores (season, score DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ranked_scores TO authenticated;
GRANT SELECT ON public.ranked_scores TO anon;
GRANT ALL ON public.ranked_scores TO service_role;

ALTER TABLE public.ranked_scores ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ranked_read_all"    ON public.ranked_scores;
DROP POLICY IF EXISTS "ranked_upsert_own"  ON public.ranked_scores;
DROP POLICY IF EXISTS "ranked_update_own"  ON public.ranked_scores;

CREATE POLICY "ranked_read_all" ON public.ranked_scores
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "ranked_upsert_own" ON public.ranked_scores
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "ranked_update_own" ON public.ranked_scores
  FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- =========================================================================
-- CHAT GLOBAL — histórico do mundo (opcional; realtime pode ler daqui)
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  username   TEXT NOT NULL,
  channel    TEXT NOT NULL DEFAULT 'world' CHECK (channel IN ('world','system','capture')),
  body       TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS chat_messages_channel_time_idx
  ON public.chat_messages (channel, created_at DESC);

GRANT SELECT, INSERT ON public.chat_messages TO authenticated;
GRANT ALL ON public.chat_messages TO service_role;

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "chat_read_all"   ON public.chat_messages;
DROP POLICY IF EXISTS "chat_insert_own" ON public.chat_messages;

CREATE POLICY "chat_read_all" ON public.chat_messages
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "chat_insert_own" ON public.chat_messages
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
```

---

## 2) (Futuro — normalização opcional) Coleção/Inventário

Quando quiser sair do JSONB e ter cada Pokémon/item como linha própria (permite trade, listagem, ranking), rode este bloco. **NÃO é necessário agora** — o `game_saves.data` já guarda tudo:

```sql
CREATE TABLE IF NOT EXISTS public.player_pokemon (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  species    TEXT NOT NULL,
  nickname   TEXT,
  level      INT NOT NULL DEFAULT 1,
  xp         INT NOT NULL DEFAULT 0,
  hp         INT NOT NULL DEFAULT 100,
  energy     INT NOT NULL DEFAULT 100,
  rarity     TEXT NOT NULL DEFAULT 'common',
  shiny      BOOLEAN NOT NULL DEFAULT false,
  in_party   INT,                  -- 0..4 se está no time
  captured_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS player_pokemon_owner_idx ON public.player_pokemon (user_id);

CREATE TABLE IF NOT EXISTS public.player_inventory (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_id TEXT NOT NULL,
  qty     INT NOT NULL DEFAULT 0 CHECK (qty >= 0),
  meta    JSONB,
  PRIMARY KEY (user_id, item_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.player_pokemon    TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.player_inventory  TO authenticated;
GRANT ALL ON public.player_pokemon    TO service_role;
GRANT ALL ON public.player_inventory  TO service_role;
ALTER TABLE public.player_pokemon   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_inventory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pp_owner_all" ON public.player_pokemon
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "pi_owner_all" ON public.player_inventory
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
```

---

## 3) Configurações no Dashboard (obrigatório)

1. **Authentication → URL Configuration**
   - Site URL: URL onde o jogo roda (preview + produção)
   - Redirect URLs: adicione a mesma URL + `.../reset-password`
2. **Authentication → Providers → Email**: deixe **Email/Password** habilitado.
3. **Recomendado em dev**: desligue **Confirm email** para signup cair direto na tela "Criar Treinador".
4. **Realtime** (para chat/presença): garanta que `chat_messages` e `guild_members` estão em **Realtime enabled** (Database → Replication → Realtime).

---

## 4) Estrutura do save (JSONB em `game_saves.data`)

Referência do que o cliente escreve — o servidor não precisa validar:

```jsonc
{
  "trainer": {
    "name": "Ash", "level": 12, "xp": 340,
    "gold": 1200, "crystal": 14, "ruby": 3,
    "avatarSkin": "red", "energy": 100
  },
  "party": [ /* até 5 PetInstance */ ],
  "collection": [ /* PetInstance */ ],
  "inventory": {
    "balls": { "pokeball": 12, "greatball": 3, "ultraball": 0 },
    "keys": 2, "potions": 5,
    "items": [ { "id": "xp_book_t1", "qty": 2 } ]
  },
  "world": {
    "currentMap": "arena",
    "unlockedMaps": ["arena"],
    "chestCooldownUntil": 0
  },
  "quests": { "activeIds": [...], "completedIds": [...] },
  "meta": { "killCount": 137, "lastPlayedAt": 0 }
}
```

---

Depois de rodar o SQL: o `AuthGate` (`src/components/AuthGate.tsx`) já cuida de signup, login, reset de senha, criação do treinador e preload do save da nuvem. Nada a mais precisa ser codificado do lado do cliente.
