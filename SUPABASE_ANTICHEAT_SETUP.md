# Anti-Cheat Server-Side Setup

Rode este SQL **inteiro** no SQL Editor do projeto `kgrspvqhpgiuxvkcxgcp`. É idempotente — pode rodar quantas vezes precisar.

Objetivo: mover **gold, ruby, cristal, XP, inventário, coleção, kills e baús** pra tabelas com RLS. Cliente nunca mais soma recurso sozinho.

```sql
-- =========================================================================
-- USER ROLES (padrão seguro, sem coluna is_admin em profiles)
-- =========================================================================
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin','moderator','user');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.user_roles (
  id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role    public.app_role NOT NULL,
  UNIQUE (user_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_roles_read_own" ON public.user_roles;
CREATE POLICY "user_roles_read_own" ON public.user_roles
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

-- =========================================================================
-- TRAINER STATE (recursos e progressão do treinador)
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.trainer_state (
  user_id        UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  gold           BIGINT NOT NULL DEFAULT 0 CHECK (gold >= 0),
  ruby           BIGINT NOT NULL DEFAULT 0 CHECK (ruby >= 0),
  crystal        BIGINT NOT NULL DEFAULT 0 CHECK (crystal >= 0),
  trainer_level  INTEGER NOT NULL DEFAULT 1 CHECK (trainer_level BETWEEN 1 AND 100),
  trainer_xp     BIGINT NOT NULL DEFAULT 0 CHECK (trainer_xp >= 0),
  kill_count     BIGINT NOT NULL DEFAULT 0,
  active_map     TEXT NOT NULL DEFAULT 'verdejante',
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.trainer_state TO authenticated;
GRANT ALL ON public.trainer_state TO service_role;
ALTER TABLE public.trainer_state ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "trainer_state_select_own" ON public.trainer_state;
CREATE POLICY "trainer_state_select_own" ON public.trainer_state
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
-- IMPORTANTE: sem INSERT/UPDATE policy — só SECURITY DEFINER functions escrevem.

-- =========================================================================
-- POKEMON COLLECTION
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.pokemon_collection (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  species      TEXT NOT NULL,
  level        INTEGER NOT NULL DEFAULT 1 CHECK (level BETWEEN 1 AND 100),
  xp           BIGINT NOT NULL DEFAULT 0,
  rarity       TEXT NOT NULL,
  hp_current   INTEGER NOT NULL DEFAULT 100,
  hp_max       INTEGER NOT NULL DEFAULT 100,
  energy       INTEGER NOT NULL DEFAULT 100,
  team_slot    INTEGER,  -- NULL = fora do time; 0..4 = slot
  captured_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, team_slot) DEFERRABLE INITIALLY DEFERRED
);

CREATE INDEX IF NOT EXISTS pokemon_collection_user_idx ON public.pokemon_collection(user_id);

GRANT SELECT ON public.pokemon_collection TO authenticated;
GRANT ALL ON public.pokemon_collection TO service_role;
ALTER TABLE public.pokemon_collection ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pokemon_collection_select_own" ON public.pokemon_collection;
CREATE POLICY "pokemon_collection_select_own" ON public.pokemon_collection
  FOR SELECT TO authenticated USING (user_id = auth.uid());

-- =========================================================================
-- INVENTORY (itens, poções, livros de xp)
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.inventory (
  user_id  UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_id  TEXT NOT NULL,
  qty      INTEGER NOT NULL DEFAULT 0 CHECK (qty >= 0),
  PRIMARY KEY (user_id, item_id)
);

GRANT SELECT ON public.inventory TO authenticated;
GRANT ALL ON public.inventory TO service_role;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "inventory_select_own" ON public.inventory;
CREATE POLICY "inventory_select_own" ON public.inventory
  FOR SELECT TO authenticated USING (user_id = auth.uid());

-- =========================================================================
-- POKEBALLS
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.pokeballs (
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ball_type  TEXT NOT NULL CHECK (ball_type IN ('pokeball','greatball','ultraball','masterball')),
  qty        INTEGER NOT NULL DEFAULT 0 CHECK (qty >= 0),
  PRIMARY KEY (user_id, ball_type)
);

GRANT SELECT ON public.pokeballs TO authenticated;
GRANT ALL ON public.pokeballs TO service_role;
ALTER TABLE public.pokeballs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pokeballs_select_own" ON public.pokeballs;
CREATE POLICY "pokeballs_select_own" ON public.pokeballs
  FOR SELECT TO authenticated USING (user_id = auth.uid());

-- =========================================================================
-- KILL LOG (auditoria + anti-flood)
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.kill_log (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  species       TEXT NOT NULL,
  target_level  INTEGER NOT NULL,
  rarity        TEXT NOT NULL,
  map_id        TEXT NOT NULL,
  gold_awarded  INTEGER NOT NULL,
  xp_awarded    INTEGER NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS kill_log_user_time_idx ON public.kill_log(user_id, created_at DESC);

GRANT SELECT ON public.kill_log TO authenticated;
GRANT ALL ON public.kill_log TO service_role;
ALTER TABLE public.kill_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "kill_log_select_own" ON public.kill_log;
CREATE POLICY "kill_log_select_own" ON public.kill_log
  FOR SELECT TO authenticated USING (user_id = auth.uid());

-- =========================================================================
-- CHEST CLAIMS (anti-replay: cada baú só abre 1x)
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.chest_claims (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  chest_id   TEXT NOT NULL,
  map_id     TEXT NOT NULL,
  loot       JSONB NOT NULL,
  opened_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, chest_id)
);

GRANT SELECT ON public.chest_claims TO authenticated;
GRANT ALL ON public.chest_claims TO service_role;
ALTER TABLE public.chest_claims ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "chest_claims_select_own" ON public.chest_claims;
CREATE POLICY "chest_claims_select_own" ON public.chest_claims
  FOR SELECT TO authenticated USING (user_id = auth.uid());

-- =========================================================================
-- RANKED SCORES (leitura pública, escrita só server-side)
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.ranked_scores (
  user_id        UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username       TEXT NOT NULL,
  trainer_level  INTEGER NOT NULL DEFAULT 1,
  pokedex_count  INTEGER NOT NULL DEFAULT 0,
  total_kills    BIGINT NOT NULL DEFAULT 0,
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.ranked_scores TO anon, authenticated;
GRANT ALL ON public.ranked_scores TO service_role;
ALTER TABLE public.ranked_scores ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ranked_read_all" ON public.ranked_scores;
CREATE POLICY "ranked_read_all" ON public.ranked_scores
  FOR SELECT TO anon, authenticated USING (true);
-- Sem INSERT/UPDATE policy: escrita só via SECURITY DEFINER server-side.
```

## Após rodar

- Rode tudo de uma vez, verifique se todas as queries deram sucesso.
- Confirme no Table Editor (schema `public`) que existem: `user_roles`, `trainer_state`, `pokemon_collection`, `inventory`, `pokeballs`, `kill_log`, `chest_claims`, `ranked_scores`.
- Pra virar admin, rode (trocando o UUID):
  ```sql
  INSERT INTO public.user_roles (user_id, role) VALUES ('SEU_USER_UUID', 'admin');
  ```
  Você pega seu UUID em Authentication → Users.

## Como isso protege

- Nenhuma tabela tem policy de **INSERT/UPDATE/DELETE** para `authenticated`. Só server functions (`SECURITY DEFINER`) escrevem.
- Cliente pode ler o próprio estado, mas não escrever.
- `chest_claims` com `UNIQUE (user_id, chest_id)` impede reabrir baú.
- `kill_log` guarda histórico → dá pra detectar farm exagerado depois.
- Ranked é leitura pública, mas ninguém consegue inserir score falso.
