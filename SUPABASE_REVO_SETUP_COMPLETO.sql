-- =====================================================================
-- IDLE MON REVO — SETUP COMPLETO DO SUPABASE (copiar e colar no SQL Editor)
-- 26 arquivos em ordem: base -> ajustes -> blindagem (RLS + RPC).
-- Idempotente: pode rodar de novo sem quebrar (IF NOT EXISTS / OR REPLACE).
-- Depois de rodar: crie sua conta no jogo e rode SÓ o insert de admin
-- do CASHSHOP_ADMIN_FIX (e-mail lordryuhhhuyuyghh@gmail.com).
-- =====================================================================


-- ===================== [1/26] SUPABASE_SAVE_FIX.sql =====================
-- =========================================================
-- CORREÇÃO DEFINITIVA DO SAVE COMPLETO (game_saves)
-- Rode este SQL UMA VEZ no Supabase > SQL Editor.
-- Ele cria/ajusta a tabela que salva TODO o progresso do jogador.
-- =========================================================

CREATE TABLE IF NOT EXISTS public.game_saves (
  user_id text PRIMARY KEY,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Data API: somente jogador autenticado pode usar essa tabela.
REVOKE ALL ON public.game_saves FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.game_saves TO authenticated;
GRANT ALL ON public.game_saves TO service_role;

ALTER TABLE public.game_saves ENABLE ROW LEVEL SECURITY;

-- Remove políticas antigas inseguras/erradas.
DROP POLICY IF EXISTS game_saves_public_game_access ON public.game_saves;
DROP POLICY IF EXISTS "own save select" ON public.game_saves;
DROP POLICY IF EXISTS "own save insert" ON public.game_saves;
DROP POLICY IF EXISTS "own save update" ON public.game_saves;
DROP POLICY IF EXISTS game_saves_own_select ON public.game_saves;
DROP POLICY IF EXISTS game_saves_own_insert ON public.game_saves;
DROP POLICY IF EXISTS game_saves_own_update ON public.game_saves;

-- Cada conta só consegue ver/gravar o próprio save.
DROP POLICY IF EXISTS game_saves_own_select ON public.game_saves;

CREATE POLICY game_saves_own_select ON public.game_saves
  FOR SELECT TO authenticated
  USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS game_saves_own_insert ON public.game_saves;


CREATE POLICY game_saves_own_insert ON public.game_saves
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid()::text = user_id);

DROP POLICY IF EXISTS game_saves_own_update ON public.game_saves;


CREATE POLICY game_saves_own_update ON public.game_saves
  FOR UPDATE TO authenticated
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

-- Conferência rápida depois de jogar e apertar Salvar:
-- SELECT user_id, updated_at, jsonb_pretty(data) FROM public.game_saves ORDER BY updated_at DESC;

-- ===================== [2/26] supabase/migrations/20260708010700_ef698216-344d-4664-b07c-688d50dba791.sql =====================
-- =========================================================
-- CORE PROFILE / SAVE TABLES
-- =========================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY,
  username text,
  level integer NOT NULL DEFAULT 1,
  gold integer NOT NULL DEFAULT 0,
  ruby integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_login timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO anon, authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS profiles_public_game_access ON public.profiles;
DROP POLICY IF EXISTS profiles_public_game_access ON public.profiles;

CREATE POLICY profiles_public_game_access ON public.profiles FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.game_saves (
  user_id text PRIMARY KEY,
  data jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.game_saves TO anon, authenticated;
GRANT ALL ON public.game_saves TO service_role;
ALTER TABLE public.game_saves ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS game_saves_public_game_access ON public.game_saves;
DROP POLICY IF EXISTS game_saves_public_game_access ON public.game_saves;

CREATE POLICY game_saves_public_game_access ON public.game_saves FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- =========================================================
-- PLAYERS (online presence / multiplayer)
-- =========================================================
CREATE TABLE IF NOT EXISTS public.players (
  id text PRIMARY KEY,
  name text NOT NULL,
  map text NOT NULL,
  x integer NOT NULL DEFAULT 0,
  y integer NOT NULL DEFAULT 0,
  dir text NOT NULL DEFAULT 'down',
  leader_species text,
  leader_rarity text,
  level integer NOT NULL DEFAULT 1,
  trainer_level integer NOT NULL DEFAULT 1,
  craft_points integer NOT NULL DEFAULT 0,
  guild_name text,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS players_updated_at_idx ON public.players(updated_at);
CREATE INDEX IF NOT EXISTS players_map_updated_idx ON public.players(map, updated_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.players TO anon, authenticated;
GRANT ALL ON public.players TO service_role;
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS players_public_game_access ON public.players;
DROP POLICY IF EXISTS players_public_game_access ON public.players;

CREATE POLICY players_public_game_access ON public.players FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- =========================================================
-- PARTIES
-- =========================================================
CREATE TABLE IF NOT EXISTS public.parties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  leader_id text NOT NULL,
  leader_name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.parties TO anon, authenticated;
GRANT ALL ON public.parties TO service_role;
ALTER TABLE public.parties ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS parties_public_game_access ON public.parties;
DROP POLICY IF EXISTS parties_public_game_access ON public.parties;

CREATE POLICY parties_public_game_access ON public.parties FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.party_members (
  party_id uuid NOT NULL REFERENCES public.parties(id) ON DELETE CASCADE,
  player_id text NOT NULL,
  player_name text NOT NULL,
  level integer NOT NULL DEFAULT 1,
  map_id text,
  joined_at timestamptz NOT NULL DEFAULT now(),
  last_seen timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (party_id, player_id)
);
CREATE UNIQUE INDEX IF NOT EXISTS party_members_player_unique ON public.party_members(player_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.party_members TO anon, authenticated;
GRANT ALL ON public.party_members TO service_role;
ALTER TABLE public.party_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS party_members_public_game_access ON public.party_members;
DROP POLICY IF EXISTS party_members_public_game_access ON public.party_members;

CREATE POLICY party_members_public_game_access ON public.party_members FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.party_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  party_id uuid NOT NULL REFERENCES public.parties(id) ON DELETE CASCADE,
  party_name text NOT NULL,
  from_id text NOT NULL,
  from_name text NOT NULL,
  target_id text NOT NULL,
  target_name text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS party_invites_target_idx ON public.party_invites(target_id, status);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.party_invites TO anon, authenticated;
GRANT ALL ON public.party_invites TO service_role;
ALTER TABLE public.party_invites ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS party_invites_public_game_access ON public.party_invites;
DROP POLICY IF EXISTS party_invites_public_game_access ON public.party_invites;

CREATE POLICY party_invites_public_game_access ON public.party_invites FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- =========================================================
-- GROUP LEGENDARY STATE
-- =========================================================
CREATE TABLE IF NOT EXISTS public.group_legendary_state (
  spawn_id text PRIMARY KEY,
  map_id text NOT NULL,
  species text NOT NULL,
  party_id uuid,
  captured_by text,
  captured_name text,
  captured_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.group_legendary_state TO anon, authenticated;
GRANT ALL ON public.group_legendary_state TO service_role;
ALTER TABLE public.group_legendary_state ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS gls_public_game_access ON public.group_legendary_state;
DROP POLICY IF EXISTS gls_public_game_access ON public.group_legendary_state;

CREATE POLICY gls_public_game_access ON public.group_legendary_state FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- =========================================================
-- MARKET / CHALLENGES
-- =========================================================
CREATE TABLE IF NOT EXISTS public.market_listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id text NOT NULL,
  seller_name text NOT NULL,
  kind text NOT NULL,
  pet_data jsonb,
  item_id text,
  qty integer,
  price integer NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'gold',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS market_listings_created_idx ON public.market_listings(created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.market_listings TO anon, authenticated;
GRANT ALL ON public.market_listings TO service_role;
ALTER TABLE public.market_listings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS market_public_game_access ON public.market_listings;
DROP POLICY IF EXISTS market_public_game_access ON public.market_listings;

CREATE POLICY market_public_game_access ON public.market_listings FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  challenger_id text NOT NULL,
  challenger_name text NOT NULL,
  challenger_pet jsonb NOT NULL,
  opponent_id text NOT NULL,
  opponent_name text NOT NULL,
  opponent_pet jsonb,
  stake_pet boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'pending',
  winner_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS challenges_participants_idx ON public.challenges(challenger_id, opponent_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.challenges TO anon, authenticated;
GRANT ALL ON public.challenges TO service_role;
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS challenges_public_game_access ON public.challenges;
DROP POLICY IF EXISTS challenges_public_game_access ON public.challenges;

CREATE POLICY challenges_public_game_access ON public.challenges FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- =========================================================
-- ADMIN GIFTS
-- =========================================================
CREATE TABLE IF NOT EXISTS public.admin_gifts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_username text NOT NULL,
  recipient_user_id text,
  kind text NOT NULL,
  item_id text,
  qty integer NOT NULL CHECK (qty > 0),
  note text,
  sender text NOT NULL DEFAULT 'admin',
  created_at timestamptz NOT NULL DEFAULT now(),
  claimed_at timestamptz
);
CREATE INDEX IF NOT EXISTS admin_gifts_recipient_user_idx ON public.admin_gifts(recipient_user_id) WHERE claimed_at IS NULL;
CREATE INDEX IF NOT EXISTS admin_gifts_recipient_name_idx ON public.admin_gifts(lower(recipient_username)) WHERE claimed_at IS NULL;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.admin_gifts TO anon, authenticated;
GRANT ALL ON public.admin_gifts TO service_role;
ALTER TABLE public.admin_gifts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS admin_gifts_public_game_access ON public.admin_gifts;
DROP POLICY IF EXISTS admin_gifts_public_game_access ON public.admin_gifts;

CREATE POLICY admin_gifts_public_game_access ON public.admin_gifts FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- =========================================================
-- GUILDS
-- =========================================================
CREATE TABLE IF NOT EXISTS public.guilds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  element text NOT NULL,
  level integer NOT NULL DEFAULT 1,
  xp integer NOT NULL DEFAULT 0,
  total_donated integer NOT NULL DEFAULT 0,
  treasury_gold integer NOT NULL DEFAULT 0,
  treasury_crystal integer NOT NULL DEFAULT 0,
  treasury_ruby integer NOT NULL DEFAULT 0,
  founder_id text NOT NULL,
  vice_leader_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.guilds TO anon, authenticated;
GRANT ALL ON public.guilds TO service_role;
ALTER TABLE public.guilds ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS guilds_public_game_access ON public.guilds;
DROP POLICY IF EXISTS guilds_public_game_access ON public.guilds;

CREATE POLICY guilds_public_game_access ON public.guilds FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.guild_members (
  guild_id uuid NOT NULL REFERENCES public.guilds(id) ON DELETE CASCADE,
  user_id text NOT NULL,
  username text NOT NULL,
  role text NOT NULL DEFAULT 'member',
  leader_species text,
  level integer NOT NULL DEFAULT 1,
  joined_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (guild_id, user_id)
);
CREATE UNIQUE INDEX IF NOT EXISTS guild_members_user_unique ON public.guild_members(user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.guild_members TO anon, authenticated;
GRANT ALL ON public.guild_members TO service_role;
ALTER TABLE public.guild_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS guild_members_public_game_access ON public.guild_members;
DROP POLICY IF EXISTS guild_members_public_game_access ON public.guild_members;

CREATE POLICY guild_members_public_game_access ON public.guild_members FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.guild_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  guild_id uuid NOT NULL REFERENCES public.guilds(id) ON DELETE CASCADE,
  guild_name text NOT NULL,
  from_user_id text NOT NULL,
  from_username text NOT NULL,
  to_user_id text,
  to_username text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS guild_invites_to_user_idx ON public.guild_invites(to_user_id) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS guild_invites_to_name_idx ON public.guild_invites(lower(to_username)) WHERE status = 'pending';
GRANT SELECT, INSERT, UPDATE, DELETE ON public.guild_invites TO anon, authenticated;
GRANT ALL ON public.guild_invites TO service_role;
ALTER TABLE public.guild_invites ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS guild_invites_public_game_access ON public.guild_invites;
DROP POLICY IF EXISTS guild_invites_public_game_access ON public.guild_invites;

CREATE POLICY guild_invites_public_game_access ON public.guild_invites FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- =========================================================
-- RANKED
-- =========================================================
CREATE TABLE IF NOT EXISTS public.ranked_seasons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  started_at timestamptz NOT NULL DEFAULT now(),
  ends_at timestamptz NOT NULL,
  is_current boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS ranked_seasons_one_current ON public.ranked_seasons(is_current) WHERE is_current = true;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ranked_seasons TO anon, authenticated;
GRANT ALL ON public.ranked_seasons TO service_role;
ALTER TABLE public.ranked_seasons ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS ranked_seasons_public_game_access ON public.ranked_seasons;
DROP POLICY IF EXISTS ranked_seasons_public_game_access ON public.ranked_seasons;

CREATE POLICY ranked_seasons_public_game_access ON public.ranked_seasons FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.ranked_leaderboard (
  season_id uuid NOT NULL REFERENCES public.ranked_seasons(id) ON DELETE CASCADE,
  user_id text NOT NULL,
  username text NOT NULL,
  trainer_level integer NOT NULL DEFAULT 1,
  craft_points integer NOT NULL DEFAULT 0,
  guild_name text,
  score integer GENERATED ALWAYS AS (trainer_level * 100 + craft_points) STORED,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (season_id, user_id)
);
CREATE INDEX IF NOT EXISTS ranked_leaderboard_score_idx ON public.ranked_leaderboard(season_id, score DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ranked_leaderboard TO anon, authenticated;
GRANT ALL ON public.ranked_leaderboard TO service_role;
ALTER TABLE public.ranked_leaderboard ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS ranked_leaderboard_public_game_access ON public.ranked_leaderboard;
DROP POLICY IF EXISTS ranked_leaderboard_public_game_access ON public.ranked_leaderboard;

CREATE POLICY ranked_leaderboard_public_game_access ON public.ranked_leaderboard FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.ranked_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id uuid NOT NULL,
  ended_at timestamptz NOT NULL,
  rank integer NOT NULL,
  user_id text NOT NULL,
  username text NOT NULL,
  trainer_level integer NOT NULL,
  craft_points integer NOT NULL,
  score integer NOT NULL,
  guild_name text
);
CREATE INDEX IF NOT EXISTS ranked_history_season_idx ON public.ranked_history(season_id, rank);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ranked_history TO anon, authenticated;
GRANT ALL ON public.ranked_history TO service_role;
ALTER TABLE public.ranked_history ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS ranked_history_public_game_access ON public.ranked_history;
DROP POLICY IF EXISTS ranked_history_public_game_access ON public.ranked_history;

CREATE POLICY ranked_history_public_game_access ON public.ranked_history FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

INSERT INTO public.ranked_seasons (started_at, ends_at, is_current)
SELECT now(), now() + interval '20 hours', true
WHERE NOT EXISTS (SELECT 1 FROM public.ranked_seasons WHERE is_current = true);

CREATE OR REPLACE FUNCTION public.record_ranked_score(_level int, _craft_points int, _guild_name text DEFAULT null)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _sid uuid;
  _uid text;
  _uname text;
BEGIN
  _uid := coalesce(auth.uid()::text, 'anon-' || md5(coalesce(current_setting('request.headers', true), random()::text)));
  SELECT id INTO _sid FROM public.ranked_seasons WHERE is_current = true LIMIT 1;
  IF _sid IS NULL THEN
    INSERT INTO public.ranked_seasons (started_at, ends_at, is_current)
    VALUES (now(), now() + interval '20 hours', true)
    RETURNING id INTO _sid;
  END IF;
  SELECT coalesce(username, 'Treinador') INTO _uname FROM public.profiles WHERE id::text = _uid;
  INSERT INTO public.ranked_leaderboard (season_id, user_id, username, trainer_level, craft_points, guild_name, updated_at)
  VALUES (_sid, _uid, coalesce(_uname, 'Treinador'), greatest(_level, 1), greatest(_craft_points, 0), _guild_name, now())
  ON CONFLICT (season_id, user_id) DO UPDATE
    SET trainer_level = greatest(excluded.trainer_level, ranked_leaderboard.trainer_level),
        craft_points = greatest(excluded.craft_points, ranked_leaderboard.craft_points),
        guild_name = excluded.guild_name,
        username = excluded.username,
        updated_at = now();
END;
$$;
GRANT EXECUTE ON FUNCTION public.record_ranked_score(int, int, text) TO anon, authenticated;

-- =========================================================
-- REALTIME PUBLICATION
-- =========================================================
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.players;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.parties;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.party_members;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.party_invites;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.market_listings;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.challenges;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.guild_invites;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.group_legendary_state;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ===================== [3/26] supabase/migrations/20260531134858_a4872ce1-c82c-4b6f-84d0-73a711c409c3.sql =====================

-- =========================================================
-- PARTIES
-- =========================================================
CREATE TABLE IF NOT EXISTS public.parties (
  id          UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name        TEXT NOT NULL,
  leader_id   TEXT NOT NULL,
  leader_name TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.parties TO anon, authenticated;
GRANT ALL ON public.parties TO service_role;
ALTER TABLE public.parties ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "parties_public_read" ON public.parties;
CREATE POLICY "parties_public_read"   ON public.parties FOR SELECT USING (true);
DROP POLICY IF EXISTS "parties_public_insert" ON public.parties;

CREATE POLICY "parties_public_insert" ON public.parties FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "parties_public_update" ON public.parties;

CREATE POLICY "parties_public_update" ON public.parties FOR UPDATE USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "parties_public_delete" ON public.parties;

CREATE POLICY "parties_public_delete" ON public.parties FOR DELETE USING (true);

-- =========================================================
-- PARTY MEMBERS
-- =========================================================
CREATE TABLE IF NOT EXISTS public.party_members (
  party_id    UUID NOT NULL REFERENCES public.parties(id) ON DELETE CASCADE,
  player_id   TEXT NOT NULL,
  player_name TEXT NOT NULL,
  level       INTEGER NOT NULL DEFAULT 1,
  map_id      TEXT,
  joined_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen   TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (party_id, player_id)
);
CREATE UNIQUE INDEX IF NOT EXISTS party_members_player_unique ON public.party_members(player_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.party_members TO anon, authenticated;
GRANT ALL ON public.party_members TO service_role;
ALTER TABLE public.party_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "party_members_public_read" ON public.party_members;
CREATE POLICY "party_members_public_read"   ON public.party_members FOR SELECT USING (true);
DROP POLICY IF EXISTS "party_members_public_insert" ON public.party_members;

CREATE POLICY "party_members_public_insert" ON public.party_members FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "party_members_public_update" ON public.party_members;

CREATE POLICY "party_members_public_update" ON public.party_members FOR UPDATE USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "party_members_public_delete" ON public.party_members;

CREATE POLICY "party_members_public_delete" ON public.party_members FOR DELETE USING (true);

-- =========================================================
-- PARTY INVITES
-- =========================================================
CREATE TABLE IF NOT EXISTS public.party_invites (
  id          UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  party_id    UUID NOT NULL REFERENCES public.parties(id) ON DELETE CASCADE,
  party_name  TEXT NOT NULL,
  from_id     TEXT NOT NULL,
  from_name   TEXT NOT NULL,
  target_id   TEXT NOT NULL,
  target_name TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'pending',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS party_invites_target_idx ON public.party_invites(target_id, status);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.party_invites TO anon, authenticated;
GRANT ALL ON public.party_invites TO service_role;
ALTER TABLE public.party_invites ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "party_invites_public_read" ON public.party_invites;
CREATE POLICY "party_invites_public_read"   ON public.party_invites FOR SELECT USING (true);
DROP POLICY IF EXISTS "party_invites_public_insert" ON public.party_invites;

CREATE POLICY "party_invites_public_insert" ON public.party_invites FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "party_invites_public_update" ON public.party_invites;

CREATE POLICY "party_invites_public_update" ON public.party_invites FOR UPDATE USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "party_invites_public_delete" ON public.party_invites;

CREATE POLICY "party_invites_public_delete" ON public.party_invites FOR DELETE USING (true);

-- =========================================================
-- GROUP LEGENDARY STATE (captura competitiva)
-- =========================================================
CREATE TABLE IF NOT EXISTS public.group_legendary_state (
  spawn_id      TEXT NOT NULL PRIMARY KEY,
  map_id        TEXT NOT NULL,
  species       TEXT NOT NULL,
  party_id      UUID,
  captured_by   TEXT,
  captured_name TEXT,
  captured_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.group_legendary_state TO anon, authenticated;
GRANT ALL ON public.group_legendary_state TO service_role;
ALTER TABLE public.group_legendary_state ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "gls_public_read" ON public.group_legendary_state;
CREATE POLICY "gls_public_read"   ON public.group_legendary_state FOR SELECT USING (true);
DROP POLICY IF EXISTS "gls_public_insert" ON public.group_legendary_state;

CREATE POLICY "gls_public_insert" ON public.group_legendary_state FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "gls_public_update" ON public.group_legendary_state;

CREATE POLICY "gls_public_update" ON public.group_legendary_state FOR UPDATE USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "gls_public_delete" ON public.group_legendary_state;

CREATE POLICY "gls_public_delete" ON public.group_legendary_state FOR DELETE USING (true);

-- =========================================================
-- REALTIME
-- =========================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.parties;
ALTER PUBLICATION supabase_realtime ADD TABLE public.party_members;
ALTER PUBLICATION supabase_realtime ADD TABLE public.party_invites;
ALTER PUBLICATION supabase_realtime ADD TABLE public.group_legendary_state;

-- ===================== [4/26] supabase/migrations/20260531134952_8a985bb4-acd2-47c4-b8ca-40ad3caf4c89.sql =====================

-- =========================================================
-- PLAYERS (presença em tempo real)
-- =========================================================
CREATE TABLE IF NOT EXISTS public.players (
  id              TEXT NOT NULL PRIMARY KEY,
  name            TEXT NOT NULL,
  map             TEXT NOT NULL,
  x               INTEGER NOT NULL DEFAULT 0,
  y               INTEGER NOT NULL DEFAULT 0,
  dir             TEXT NOT NULL DEFAULT 'down',
  leader_species  TEXT,
  leader_rarity   TEXT,
  level           INTEGER NOT NULL DEFAULT 1,
  trainer_level   INTEGER NOT NULL DEFAULT 1,
  craft_points    INTEGER NOT NULL DEFAULT 0,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS players_updated_at_idx ON public.players(updated_at);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.players TO anon, authenticated;
GRANT ALL ON public.players TO service_role;
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "players_public_read" ON public.players;
CREATE POLICY "players_public_read"   ON public.players FOR SELECT USING (true);
DROP POLICY IF EXISTS "players_public_insert" ON public.players;

CREATE POLICY "players_public_insert" ON public.players FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "players_public_update" ON public.players;

CREATE POLICY "players_public_update" ON public.players FOR UPDATE USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "players_public_delete" ON public.players;

CREATE POLICY "players_public_delete" ON public.players FOR DELETE USING (true);

-- =========================================================
-- MARKET LISTINGS
-- =========================================================
CREATE TABLE IF NOT EXISTS public.market_listings (
  id           UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id    TEXT NOT NULL,
  seller_name  TEXT NOT NULL,
  kind         TEXT NOT NULL,
  pet_data     JSONB,
  item_id      TEXT,
  qty          INTEGER,
  price        INTEGER NOT NULL DEFAULT 0,
  currency     TEXT NOT NULL DEFAULT 'gold',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS market_listings_created_idx ON public.market_listings(created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.market_listings TO anon, authenticated;
GRANT ALL ON public.market_listings TO service_role;
ALTER TABLE public.market_listings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "market_public_read" ON public.market_listings;
CREATE POLICY "market_public_read"   ON public.market_listings FOR SELECT USING (true);
DROP POLICY IF EXISTS "market_public_insert" ON public.market_listings;

CREATE POLICY "market_public_insert" ON public.market_listings FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "market_public_update" ON public.market_listings;

CREATE POLICY "market_public_update" ON public.market_listings FOR UPDATE USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "market_public_delete" ON public.market_listings;

CREATE POLICY "market_public_delete" ON public.market_listings FOR DELETE USING (true);

-- =========================================================
-- CHALLENGES (PvP)
-- =========================================================
CREATE TABLE IF NOT EXISTS public.challenges (
  id               UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  challenger_id    TEXT NOT NULL,
  challenger_name  TEXT NOT NULL,
  challenger_pet   JSONB NOT NULL,
  opponent_id      TEXT NOT NULL,
  opponent_name    TEXT NOT NULL,
  opponent_pet     JSONB,
  stake_pet        BOOLEAN NOT NULL DEFAULT false,
  status           TEXT NOT NULL DEFAULT 'pending',
  winner_id        TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS challenges_participants_idx ON public.challenges(challenger_id, opponent_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.challenges TO anon, authenticated;
GRANT ALL ON public.challenges TO service_role;
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "challenges_public_read" ON public.challenges;
CREATE POLICY "challenges_public_read"   ON public.challenges FOR SELECT USING (true);
DROP POLICY IF EXISTS "challenges_public_insert" ON public.challenges;

CREATE POLICY "challenges_public_insert" ON public.challenges FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "challenges_public_update" ON public.challenges;

CREATE POLICY "challenges_public_update" ON public.challenges FOR UPDATE USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "challenges_public_delete" ON public.challenges;

CREATE POLICY "challenges_public_delete" ON public.challenges FOR DELETE USING (true);

-- =========================================================
-- GAME SAVES (backup opcional na nuvem)
-- =========================================================
CREATE TABLE IF NOT EXISTS public.game_saves (
  user_id     TEXT NOT NULL PRIMARY KEY,
  data        JSONB NOT NULL,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.game_saves TO anon, authenticated;
GRANT ALL ON public.game_saves TO service_role;
ALTER TABLE public.game_saves ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "saves_public_read" ON public.game_saves;
CREATE POLICY "saves_public_read"   ON public.game_saves FOR SELECT USING (true);
DROP POLICY IF EXISTS "saves_public_insert" ON public.game_saves;

CREATE POLICY "saves_public_insert" ON public.game_saves FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "saves_public_update" ON public.game_saves;

CREATE POLICY "saves_public_update" ON public.game_saves FOR UPDATE USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "saves_public_delete" ON public.game_saves;

CREATE POLICY "saves_public_delete" ON public.game_saves FOR DELETE USING (true);

-- =========================================================
-- REALTIME
-- =========================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.players;
ALTER PUBLICATION supabase_realtime ADD TABLE public.market_listings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.challenges;

-- ===================== [5/26] supabase/migrations/20260822232854_add_active_sessions_table.sql =====================
CREATE TABLE IF NOT EXISTS public.active_sessions (
    user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    session_token text NOT NULL,
    updated_at timestamptz DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.active_sessions TO authenticated;
GRANT ALL ON public.active_sessions TO service_role;

ALTER TABLE public.active_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own active session" ON public.active_sessions;
CREATE POLICY "Users can manage their own active session"
ON public.active_sessions
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- ===================== [6/26] SUPABASE_MAINTENANCE_SETUP.sql =====================
-- Tabela de configuração global (se não existir)
CREATE TABLE IF NOT EXISTS public.app_config (
    key TEXT PRIMARY KEY,
    value JSONB,
    description TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;

-- Grants
GRANT SELECT ON public.app_config TO anon, authenticated;
GRANT ALL ON public.app_config TO service_role;

-- Policy de leitura pública
DROP POLICY IF EXISTS "Public read app_config" ON public.app_config;
DROP POLICY IF EXISTS "Public read app_config" ON public.app_config;

CREATE POLICY "Public read app_config" ON public.app_config
    FOR SELECT USING (true);

-- Inserir modo manutenção (false por padrão)
INSERT INTO public.app_config (key, value, description)
VALUES ('maintenance_mode', 'false', 'Trava o acesso ao jogo para não-admins')
ON CONFLICT (key) DO NOTHING;

-- COLOQUE O JOGO EM MANUTENÇÃO AGORA:
-- UPDATE public.app_config SET value = 'true' WHERE key = 'maintenance_mode';

-- Desconectar sessões (Revoke tokens)
-- SELECT auth.sessions_delete_all(); -- Nota: Isso requer privilégios de superuser/admin no Supabase Dashboard

-- ===================== [7/26] SUPABASE_BLACK_EGG_SAVE.sql =====================
-- =========================================================
-- BLACK MITIC PLUS EGG — persistência de progresso na nuvem
-- Rode este SQL UMA VEZ no Supabase > SQL Editor.
-- Garante que nenhum jogador perca progresso do ovo
-- (afinidade, alimentações, diário, incubação) até chocar.
-- =========================================================

CREATE TABLE IF NOT EXISTS public.black_egg_saves (
  user_id     uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  data        jsonb       NOT NULL DEFAULT '{}'::jsonb,
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- Data API: só jogador autenticado acessa a sua própria linha.
REVOKE ALL ON public.black_egg_saves FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.black_egg_saves TO authenticated;
GRANT ALL ON public.black_egg_saves TO service_role;

ALTER TABLE public.black_egg_saves ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS black_egg_saves_own_select ON public.black_egg_saves;
DROP POLICY IF EXISTS black_egg_saves_own_insert ON public.black_egg_saves;
DROP POLICY IF EXISTS black_egg_saves_own_update ON public.black_egg_saves;

DROP POLICY IF EXISTS black_egg_saves_own_select ON public.black_egg_saves;


CREATE POLICY black_egg_saves_own_select ON public.black_egg_saves
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS black_egg_saves_own_insert ON public.black_egg_saves;


CREATE POLICY black_egg_saves_own_insert ON public.black_egg_saves
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS black_egg_saves_own_update ON public.black_egg_saves;


CREATE POLICY black_egg_saves_own_update ON public.black_egg_saves
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Conferência:
-- SELECT user_id, updated_at, jsonb_pretty(data) FROM public.black_egg_saves ORDER BY updated_at DESC;

-- ===================== [8/26] SUPABASE_CASH_SHOP.sql =====================
-- =====================================================
-- LOJINHA CASH — Setup completo
-- Rodar UMA vez no Supabase Studio → SQL Editor.
-- Idempotente: pode ser re-executado sem quebrar.
-- =====================================================

-- 1) Produtos (todos os itens vendidos na loja)
create table if not exists public.cash_products (
  id text primary key,
  category text not null check (category in ('featured','sapphire','package','egg','premium','promo','other')),
  name text not null,
  description text,
  image_url text,
  currency text not null default 'cash' check (currency in ('cash','sapphires','tokens','tickets','coins','crystals')),
  price integer not null default 0,
  discount_pct integer,
  grants jsonb default '{}'::jsonb,     -- ex: {"crystals":1000,"ultraball":25}
  active boolean not null default true,
  sort integer default 0,
  badge text,                           -- ex: "HOT", "NOVO", "-50%"
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

grant select on public.cash_products to authenticated, anon;
grant all on public.cash_products to service_role;

alter table public.cash_products enable row level security;

drop policy if exists "cash_products_read_all" on public.cash_products;
DROP POLICY IF EXISTS "cash_products_read_all" ON public.cash_products;

CREATE POLICY "cash_products_read_all" ON public.cash_products
  for select to authenticated, anon using (active = true);

-- 2) Carteira do jogador (moedas premium)
create table if not exists public.cash_wallets (
  user_id uuid primary key references auth.users(id) on delete cascade,
  coins bigint not null default 0,
  crystals bigint not null default 0,
  sapphires bigint not null default 0,
  tokens bigint not null default 0,
  tickets bigint not null default 0,
  cash bigint not null default 0,
  vip_until timestamptz,
  premium_until timestamptz,
  updated_at timestamptz not null default now()
);

grant select, insert, update on public.cash_wallets to authenticated;
grant all on public.cash_wallets to service_role;

alter table public.cash_wallets enable row level security;

drop policy if exists "cash_wallets_read_own" on public.cash_wallets;
DROP POLICY IF EXISTS "cash_wallets_read_own" ON public.cash_wallets;

CREATE POLICY "cash_wallets_read_own" ON public.cash_wallets
  for select to authenticated using (user_id = auth.uid());

drop policy if exists "cash_wallets_upsert_own" on public.cash_wallets;
DROP POLICY IF EXISTS "cash_wallets_upsert_own" ON public.cash_wallets;

CREATE POLICY "cash_wallets_upsert_own" ON public.cash_wallets
  for insert to authenticated with check (user_id = auth.uid());

drop policy if exists "cash_wallets_update_own" on public.cash_wallets;
DROP POLICY IF EXISTS "cash_wallets_update_own" ON public.cash_wallets;

CREATE POLICY "cash_wallets_update_own" ON public.cash_wallets
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- 3) Histórico de compras
create table if not exists public.cash_purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  username text,
  product_id text not null,
  currency text not null,
  price_paid integer not null,
  grants jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

grant select, insert on public.cash_purchases to authenticated;
grant all on public.cash_purchases to service_role;

alter table public.cash_purchases enable row level security;

drop policy if exists "cash_purchases_read_own" on public.cash_purchases;
DROP POLICY IF EXISTS "cash_purchases_read_own" ON public.cash_purchases;

CREATE POLICY "cash_purchases_read_own" ON public.cash_purchases
  for select to authenticated using (user_id = auth.uid());

drop policy if exists "cash_purchases_insert_own" on public.cash_purchases;
DROP POLICY IF EXISTS "cash_purchases_insert_own" ON public.cash_purchases;

CREATE POLICY "cash_purchases_insert_own" ON public.cash_purchases
  for insert to authenticated with check (user_id = auth.uid());

-- 4) Histórico de conversões
create table if not exists public.cash_conversions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  from_currency text not null,
  to_currency text not null,
  amount_from integer not null,
  amount_to integer not null,
  created_at timestamptz not null default now()
);

grant select, insert on public.cash_conversions to authenticated;
grant all on public.cash_conversions to service_role;

alter table public.cash_conversions enable row level security;

drop policy if exists "cash_conv_read_own" on public.cash_conversions;
DROP POLICY IF EXISTS "cash_conv_read_own" ON public.cash_conversions;

CREATE POLICY "cash_conv_read_own" ON public.cash_conversions
  for select to authenticated using (user_id = auth.uid());

drop policy if exists "cash_conv_insert_own" on public.cash_conversions;
DROP POLICY IF EXISTS "cash_conv_insert_own" ON public.cash_conversions;

CREATE POLICY "cash_conv_insert_own" ON public.cash_conversions
  for insert to authenticated with check (user_id = auth.uid());

-- =====================================================
-- Produtos de exemplo (opcional — remova se preferir vazio)
-- =====================================================
insert into public.cash_products (id, category, name, description, currency, price, grants, badge, sort) values
  ('pkg_starter', 'package', 'Pacote Inicial', '5000 cristais + 30 pokébolas para começar', 'cash', 990, '{"crystals":5000,"pokeball":30}'::jsonb, 'NOVO', 10),
  ('pkg_vip30',   'premium', 'VIP 30 dias', 'Bônus de XP e Gold por 30 dias', 'cash', 1990, '{"vip_days":30}'::jsonb, 'HOT', 20),
  ('safira_1k',   'sapphire','1.000 Safiras', 'Pacote de 1000 safiras premium', 'cash', 490, '{"sapphires":1000}'::jsonb, null, 30),
  ('egg_myth',    'egg',     'Ovo Mítico ✦', 'Ovo raro com pokemon lendário garantido', 'sapphires', 500, '{"egg_myth":1}'::jsonb, 'RARO', 40)
on conflict (id) do nothing;

-- ===================== [9/26] SUPABASE_CASHSHOP_TICKETS.sql =====================
-- ============================================================
-- CHAT / TICKETS DA LOJINHA CASH
-- Rode no SQL Editor do Supabase.
-- Requer a tabela public.user_roles já existente no projeto
-- (a mesma usada em SUPABASE_PENDING_PURCHASES.sql). Para o
-- painel admin funcionar no DB, o admin precisa ter uma linha
-- em user_roles com role = 'admin'.
-- ============================================================

create table if not exists public.cashshop_tickets (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  username    text not null default '',
  from_role   text not null check (from_role in ('user','support')),
  text        text not null default '',
  image       text,
  created_at  timestamptz not null default now()
);

grant select, insert on public.cashshop_tickets to authenticated;
grant all on public.cashshop_tickets to service_role;

alter table public.cashshop_tickets enable row level security;

-- Usuário vê o próprio ticket
drop policy if exists ct_select_own on public.cashshop_tickets;
DROP POLICY IF EXISTS ct_select_own ON public.cashshop_tickets;

CREATE POLICY ct_select_own ON public.cashshop_tickets
  for select to authenticated using (user_id = auth.uid());

-- Usuário insere só como 'user' e no próprio ticket
drop policy if exists ct_insert_own on public.cashshop_tickets;
DROP POLICY IF EXISTS ct_insert_own ON public.cashshop_tickets;

CREATE POLICY ct_insert_own ON public.cashshop_tickets
  for insert to authenticated
  with check (user_id = auth.uid() and from_role = 'user');

-- Admin lê todos
drop policy if exists ct_select_admin on public.cashshop_tickets;
DROP POLICY IF EXISTS ct_select_admin ON public.cashshop_tickets;

CREATE POLICY ct_select_admin ON public.cashshop_tickets
  for select to authenticated
  using (exists (select 1 from public.user_roles ur
                 where ur.user_id = auth.uid() and ur.role = 'admin'));

-- Admin responde como 'support' em qualquer ticket
drop policy if exists ct_insert_admin on public.cashshop_tickets;
DROP POLICY IF EXISTS ct_insert_admin ON public.cashshop_tickets;

CREATE POLICY ct_insert_admin ON public.cashshop_tickets
  for insert to authenticated
  with check (from_role = 'support'
              and exists (select 1 from public.user_roles ur
                          where ur.user_id = auth.uid() and ur.role = 'admin'));

create index if not exists ct_user_created_idx on public.cashshop_tickets (user_id, created_at);
create index if not exists ct_created_idx      on public.cashshop_tickets (created_at desc);

-- Realtime
alter publication supabase_realtime add table public.cashshop_tickets;

-- ===================== [10/26] SUPABASE_PENDING_PURCHASES.sql =====================
-- ============================================================
-- SISTEMA DE PAGAMENTO MANUAL (PicPay / Stripe Link / Mercado Pago)
-- ============================================================
-- Roda esse SQL no SQL Editor do Supabase.

-- 1) Campos extras nos produtos (link + preço em R$)
alter table if exists public.cash_products
  add column if not exists payment_link_url text,
  add column if not exists price_brl        numeric(10,2),
  add column if not exists payment_method   text; -- "picpay" | "stripe" | "mercadopago" | "outro"

-- 2) Tabela de compras pendentes (fica "em análise" 10 min)
create table if not exists public.pending_purchases (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null,
  username          text not null,
  product_id        uuid not null,
  product_name      text not null,
  price_brl         numeric(10,2),
  payment_method    text,
  payment_link_url  text,
  transaction_ref   text,                -- id da transação / comprovante que o jogador informar
  grants            jsonb not null default '{}'::jsonb,
  status            text not null default 'analise', -- analise | approved | rejected | expired
  admin_note        text,
  approved_by       text,
  created_at        timestamptz not null default now(),
  expires_at        timestamptz not null default (now() + interval '10 minutes'),
  resolved_at       timestamptz
);

grant select, insert, update on public.pending_purchases to authenticated;
grant all on public.pending_purchases to service_role;

alter table public.pending_purchases enable row level security;

-- Jogador vê e cria só as próprias
drop policy if exists pp_select_own on public.pending_purchases;
DROP POLICY IF EXISTS pp_select_own ON public.pending_purchases;

CREATE POLICY pp_select_own ON public.pending_purchases
  for select to authenticated using (user_id = auth.uid());

drop policy if exists pp_insert_own on public.pending_purchases;
DROP POLICY IF EXISTS pp_insert_own ON public.pending_purchases;

CREATE POLICY pp_insert_own ON public.pending_purchases
  for insert to authenticated with check (user_id = auth.uid());

-- Jogador pode cancelar a própria enquanto em análise
drop policy if exists pp_update_own on public.pending_purchases;
DROP POLICY IF EXISTS pp_update_own ON public.pending_purchases;

CREATE POLICY pp_update_own ON public.pending_purchases
  for update to authenticated
  using (user_id = auth.uid() and status = 'analise')
  with check (user_id = auth.uid());

-- Admin: precisa ter role 'admin' em user_roles (já existente no projeto)
drop policy if exists pp_select_admin on public.pending_purchases;
DROP POLICY IF EXISTS pp_select_admin ON public.pending_purchases;

CREATE POLICY pp_select_admin ON public.pending_purchases
  for select to authenticated
  using (exists (select 1 from public.user_roles ur
                 where ur.user_id = auth.uid() and ur.role = 'admin'));

drop policy if exists pp_update_admin on public.pending_purchases;
DROP POLICY IF EXISTS pp_update_admin ON public.pending_purchases;

CREATE POLICY pp_update_admin ON public.pending_purchases
  for update to authenticated
  using (exists (select 1 from public.user_roles ur
                 where ur.user_id = auth.uid() and ur.role = 'admin'))
  with check (exists (select 1 from public.user_roles ur
                 where ur.user_id = auth.uid() and ur.role = 'admin'));

create index if not exists pp_status_idx on public.pending_purchases (status, created_at desc);
create index if not exists pp_user_idx   on public.pending_purchases (user_id, created_at desc);

-- ===================== [11/26] SUPABASE_CASHSHOP_ADMIN_FIX.sql =====================

-- Guarda anti-duplicata (arquivos FIX recriam as mesmas policies) --
drop policy if exists ct_select_own on public.cashshop_tickets;
drop policy if exists ct_insert_own on public.cashshop_tickets;
drop policy if exists ct_select_admin on public.cashshop_tickets;
drop policy if exists ct_insert_admin on public.cashshop_tickets;
drop policy if exists pp_select_own on public.pending_purchases;
drop policy if exists pp_insert_own on public.pending_purchases;
drop policy if exists pp_update_own on public.pending_purchases;
drop policy if exists pp_select_admin on public.pending_purchases;
drop policy if exists pp_update_admin on public.pending_purchases;
drop policy if exists user_roles_read_own_or_admin on public.user_roles;
-- ============================================================
-- FIX ADMIN LOJINHA CASH / TICKETS / VENDAS EM ANÁLISE
-- Rode no SQL Editor do Supabase.
-- Admin liberado: lordryuhhhuyuyghh@gmail.com
-- ============================================================

-- 1) Garante tabela de roles separada e segura
do $$
begin
  if not exists (select 1 from pg_type where typnamespace = 'public'::regnamespace and typname = 'app_role') then
    create type public.app_role as enum ('admin', 'moderator', 'user');
  end if;
end $$;

create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  unique (user_id, role)
);

grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;

alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = _user_id
      and role = _role
  )
$$;

drop policy if exists user_roles_read_own_or_admin on public.user_roles;
DROP POLICY IF EXISTS user_roles_read_own_or_admin ON public.user_roles;
create policy user_roles_read_own_or_admin
  on public.user_roles
  for select
  to authenticated
  using (user_id = auth.uid() or public.has_role(auth.uid(), 'admin'));

-- 2) Torna esse e-mail admin da Lojinha
insert into public.user_roles (user_id, role)
select id, 'admin'::public.app_role
from auth.users
where lower(email) = lower('lordryuhhhuyuyghh@gmail.com')
on conflict (user_id, role) do nothing;

-- 3) Permissões Data API das tabelas da lojinha
grant select, insert on public.cashshop_tickets to authenticated;
grant all on public.cashshop_tickets to service_role;
grant select, insert, update on public.pending_purchases to authenticated;
grant all on public.pending_purchases to service_role;

alter table public.cashshop_tickets enable row level security;
alter table public.pending_purchases enable row level security;

-- 4) Policies dos tickets usando a função segura
drop policy if exists ct_select_own on public.cashshop_tickets;
DROP POLICY IF EXISTS ct_select_own ON public.cashshop_tickets;

CREATE POLICY ct_select_own ON public.cashshop_tickets
  for select to authenticated
  using (user_id = auth.uid());

drop policy if exists ct_insert_own on public.cashshop_tickets;
DROP POLICY IF EXISTS ct_insert_own ON public.cashshop_tickets;

CREATE POLICY ct_insert_own ON public.cashshop_tickets
  for insert to authenticated
  with check (user_id = auth.uid() and from_role = 'user');

drop policy if exists ct_select_admin on public.cashshop_tickets;
DROP POLICY IF EXISTS ct_select_admin ON public.cashshop_tickets;

CREATE POLICY ct_select_admin ON public.cashshop_tickets
  for select to authenticated
  using (public.has_role(auth.uid(), 'admin'));

drop policy if exists ct_insert_admin on public.cashshop_tickets;
DROP POLICY IF EXISTS ct_insert_admin ON public.cashshop_tickets;

CREATE POLICY ct_insert_admin ON public.cashshop_tickets
  for insert to authenticated
  with check (from_role = 'support' and public.has_role(auth.uid(), 'admin'));

-- 5) Policies de vendas em análise usando a função segura
drop policy if exists pp_select_own on public.pending_purchases;
DROP POLICY IF EXISTS pp_select_own ON public.pending_purchases;

CREATE POLICY pp_select_own ON public.pending_purchases
  for select to authenticated using (user_id = auth.uid());

drop policy if exists pp_insert_own on public.pending_purchases;
DROP POLICY IF EXISTS pp_insert_own ON public.pending_purchases;

CREATE POLICY pp_insert_own ON public.pending_purchases
  for insert to authenticated with check (user_id = auth.uid());

drop policy if exists pp_update_own on public.pending_purchases;
DROP POLICY IF EXISTS pp_update_own ON public.pending_purchases;

CREATE POLICY pp_update_own ON public.pending_purchases
  for update to authenticated
  using (user_id = auth.uid() and status = 'analise')
  with check (user_id = auth.uid());

drop policy if exists pp_select_admin on public.pending_purchases;
DROP POLICY IF EXISTS pp_select_admin ON public.pending_purchases;

CREATE POLICY pp_select_admin ON public.pending_purchases
  for select to authenticated
  using (public.has_role(auth.uid(), 'admin'));

drop policy if exists pp_update_admin on public.pending_purchases;
DROP POLICY IF EXISTS pp_update_admin ON public.pending_purchases;

CREATE POLICY pp_update_admin ON public.pending_purchases
  for update to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- 6) Realtime (se já existir na publicação, ignora o erro de duplicado)
do $$
begin
  begin
    alter publication supabase_realtime add table public.cashshop_tickets;
  exception when duplicate_object then null;
  end;

  begin
    alter publication supabase_realtime add table public.pending_purchases;
  exception when duplicate_object then null;
  end;
end $$;

-- 7) Conferência final
select u.id, u.email, ur.role
from auth.users u
left join public.user_roles ur on ur.user_id = u.id
where lower(u.email) = lower('lordryuhhhuyuyghh@gmail.com');

-- ===================== [12/26] SUPABASE_FIX_PENDING_PURCHASES_NOW.sql =====================

-- Guarda anti-duplicata (arquivos FIX recriam as mesmas policies) --
drop policy if exists ct_select_own on public.cashshop_tickets;
drop policy if exists ct_insert_own on public.cashshop_tickets;
drop policy if exists ct_select_admin on public.cashshop_tickets;
drop policy if exists ct_insert_admin on public.cashshop_tickets;
drop policy if exists pp_select_own on public.pending_purchases;
drop policy if exists pp_insert_own on public.pending_purchases;
drop policy if exists pp_update_own on public.pending_purchases;
drop policy if exists pp_select_admin on public.pending_purchases;
drop policy if exists pp_update_admin on public.pending_purchases;
drop policy if exists user_roles_read_own_or_admin on public.user_roles;
-- ============================================================
-- FIX: "Could not find the table 'public.pending_purchases'"
-- Roda TUDO isso no SQL Editor do Supabase (pode rodar quantas vezes quiser).
-- ============================================================

-- 0) Garante que user_roles + has_role existem (necessário pras policies de admin)
do $$
begin
  if not exists (select 1 from pg_type where typnamespace = 'public'::regnamespace and typname = 'app_role') then
    create type public.app_role as enum ('admin', 'moderator', 'user');
  end if;
end $$;

create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

drop policy if exists user_roles_read_own_or_admin on public.user_roles;
DROP POLICY IF EXISTS user_roles_read_own_or_admin ON public.user_roles;

CREATE POLICY user_roles_read_own_or_admin ON public.user_roles
  for select to authenticated
  using (user_id = auth.uid() or public.has_role(auth.uid(), 'admin'));

-- 1) Colunas extras em cash_products (se a tabela existir)
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema='public' and table_name='cash_products') then
    execute 'alter table public.cash_products
      add column if not exists payment_link_url text,
      add column if not exists price_brl        numeric(10,2),
      add column if not exists payment_method   text';
  end if;
end $$;

-- 2) TABELA pending_purchases (é ELA que tá faltando no seu banco)
create table if not exists public.pending_purchases (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null,
  username          text not null,
  product_id        uuid not null,
  product_name      text not null,
  price_brl         numeric(10,2),
  payment_method    text,
  payment_link_url  text,
  transaction_ref   text,
  grants            jsonb not null default '{}'::jsonb,
  status            text not null default 'analise',
  admin_note        text,
  approved_by       text,
  created_at        timestamptz not null default now(),
  expires_at        timestamptz not null default (now() + interval '10 minutes'),
  resolved_at       timestamptz
);

grant select, insert, update on public.pending_purchases to authenticated;
grant all on public.pending_purchases to service_role;

alter table public.pending_purchases enable row level security;

drop policy if exists pp_select_own on public.pending_purchases;
DROP POLICY IF EXISTS pp_select_own ON public.pending_purchases;

CREATE POLICY pp_select_own ON public.pending_purchases
  for select to authenticated using (user_id = auth.uid());

drop policy if exists pp_insert_own on public.pending_purchases;
DROP POLICY IF EXISTS pp_insert_own ON public.pending_purchases;

CREATE POLICY pp_insert_own ON public.pending_purchases
  for insert to authenticated with check (user_id = auth.uid());

drop policy if exists pp_update_own on public.pending_purchases;
DROP POLICY IF EXISTS pp_update_own ON public.pending_purchases;

CREATE POLICY pp_update_own ON public.pending_purchases
  for update to authenticated
  using (user_id = auth.uid() and status = 'analise')
  with check (user_id = auth.uid());

drop policy if exists pp_select_admin on public.pending_purchases;
DROP POLICY IF EXISTS pp_select_admin ON public.pending_purchases;

CREATE POLICY pp_select_admin ON public.pending_purchases
  for select to authenticated using (public.has_role(auth.uid(), 'admin'));

drop policy if exists pp_update_admin on public.pending_purchases;
DROP POLICY IF EXISTS pp_update_admin ON public.pending_purchases;

CREATE POLICY pp_update_admin ON public.pending_purchases
  for update to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

create index if not exists pp_status_idx on public.pending_purchases (status, created_at desc);
create index if not exists pp_user_idx   on public.pending_purchases (user_id, created_at desc);

-- 3) Garante seu e-mail como admin
insert into public.user_roles (user_id, role)
select id, 'admin'::public.app_role
from auth.users
where lower(email) = lower('lordryuhhhuyuyghh@gmail.com')
on conflict (user_id, role) do nothing;

-- 4) Realtime (ignora se já estiver)
do $$
begin
  begin
    alter publication supabase_realtime add table public.pending_purchases;
  exception when duplicate_object then null;
  end;
end $$;

-- 5) FORÇA o PostgREST a recarregar o schema cache (mata o erro do print)
notify pgrst, 'reload schema';

-- 6) Conferência
select 'pending_purchases OK' as check_1,
       (select count(*) from public.pending_purchases) as total_linhas;

select u.email, ur.role
from auth.users u
left join public.user_roles ur on ur.user_id = u.id
where lower(u.email) = lower('lordryuhhhuyuyghh@gmail.com');

-- ===================== [13/26] SUPABASE_MARKET_LISTINGS_CREATE.sql =====================
-- Cria a tabela market_listings usada pelo Mercado VIP (itens/stones/etc).
-- Rode UMA VEZ no Supabase Studio -> SQL Editor.

CREATE TABLE IF NOT EXISTS public.market_listings (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id    uuid NOT NULL,
  seller_name  text NOT NULL,
  buyer_id     uuid,
  kind         text NOT NULL,               -- 'item' | 'stone' | etc.
  item_id      text,
  qty          integer DEFAULT 1,
  pet_data     jsonb,
  price        numeric NOT NULL DEFAULT 0,
  currency     text NOT NULL DEFAULT 'gold',
  sold_at      timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT market_listings_currency_check
    CHECK (currency IN ('gold','crystal','safira','esmerald'))
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.market_listings TO authenticated;
GRANT SELECT ON public.market_listings TO anon;
GRANT ALL    ON public.market_listings TO service_role;

ALTER TABLE public.market_listings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "market_listings_select_all" ON public.market_listings;
DROP POLICY IF EXISTS "market_listings_select_all" ON public.market_listings;
CREATE POLICY "market_listings_select_all"
  ON public.market_listings FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "market_listings_insert_own" ON public.market_listings;
DROP POLICY IF EXISTS "market_listings_insert_own" ON public.market_listings;
CREATE POLICY "market_listings_insert_own"
  ON public.market_listings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = seller_id);

DROP POLICY IF EXISTS "market_listings_update_participants" ON public.market_listings;
DROP POLICY IF EXISTS "market_listings_update_participants" ON public.market_listings;
CREATE POLICY "market_listings_update_participants"
  ON public.market_listings FOR UPDATE
  TO authenticated
  USING (auth.uid() = seller_id OR auth.uid() = buyer_id)
  WITH CHECK (auth.uid() = seller_id OR auth.uid() = buyer_id);

DROP POLICY IF EXISTS "market_listings_delete_own" ON public.market_listings;
DROP POLICY IF EXISTS "market_listings_delete_own" ON public.market_listings;
CREATE POLICY "market_listings_delete_own"
  ON public.market_listings FOR DELETE
  TO authenticated
  USING (auth.uid() = seller_id);

CREATE INDEX IF NOT EXISTS idx_market_listings_open
  ON public.market_listings (created_at DESC)
  WHERE sold_at IS NULL;

-- ===================== [14/26] supabase/migrations/20260708071832_b798c5ea-7a69-4b28-8e67-0c9ac7074a80.sql =====================
-- Colunas novas (compatíveis com o schema atual)
ALTER TABLE public.market_listings
  ADD COLUMN IF NOT EXISTS sold_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS buyer_id TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- Índices
CREATE INDEX IF NOT EXISTS market_listings_active_idx
  ON public.market_listings (created_at DESC)
  WHERE sold_at IS NULL;
CREATE INDEX IF NOT EXISTS market_listings_seller_idx
  ON public.market_listings (seller_id);

-- GRANTs (Data API)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.market_listings TO authenticated;
GRANT ALL ON public.market_listings TO service_role;

-- Políticas (idempotentes)
DROP POLICY IF EXISTS "Anyone authenticated can view listings" ON public.market_listings;
DROP POLICY IF EXISTS "Anyone authenticated can view listings" ON public.market_listings;
CREATE POLICY "Anyone authenticated can view listings"
  ON public.market_listings FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Seller can create own listing" ON public.market_listings;
DROP POLICY IF EXISTS "Seller can create own listing" ON public.market_listings;
CREATE POLICY "Seller can create own listing"
  ON public.market_listings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid()::text = seller_id AND sold_at IS NULL AND buyer_id IS NULL);

DROP POLICY IF EXISTS "Seller can cancel own unsold listing" ON public.market_listings;
DROP POLICY IF EXISTS "Seller can cancel own unsold listing" ON public.market_listings;
CREATE POLICY "Seller can cancel own unsold listing"
  ON public.market_listings FOR DELETE
  TO authenticated
  USING (auth.uid()::text = seller_id AND sold_at IS NULL);

DROP POLICY IF EXISTS "Any authenticated user can buy an active listing" ON public.market_listings;
DROP POLICY IF EXISTS "Any authenticated user can buy an active listing" ON public.market_listings;
CREATE POLICY "Any authenticated user can buy an active listing"
  ON public.market_listings FOR UPDATE
  TO authenticated
  USING (sold_at IS NULL AND auth.uid()::text <> seller_id)
  WITH CHECK (buyer_id = auth.uid()::text AND sold_at IS NOT NULL);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS update_market_listings_updated_at ON public.market_listings;
CREATE TRIGGER update_market_listings_updated_at
BEFORE UPDATE ON public.market_listings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ===================== [15/26] SUPABASE_MARKET_LISTINGS_CURRENCY_FIX.sql =====================
-- Garante que market_listings aceita as moedas usadas no jogo (inclui safira).
-- Rode UMA VEZ no Supabase Studio -> SQL Editor.

ALTER TABLE public.market_listings
  DROP CONSTRAINT IF EXISTS market_listings_currency_check;

ALTER TABLE public.market_listings
  ADD CONSTRAINT market_listings_currency_check
  CHECK (currency IN ('gold','crystal','safira','esmerald'));

-- ===================== [16/26] SUPABASE_MARKET_LISTINGS_PAYOUT.sql =====================
-- Adiciona coluna payout_claimed em market_listings para o vendedor
-- coletar (ouro / cristal / safira) DEPOIS que alguém comprou o anúncio.
-- Antes desse patch, quando o comprador clicava em "Comprar" o item ia pra
-- ele mas o vendedor nunca recebia a moeda -> "cristal não ia pro jogador".
-- Rode UMA vez no Supabase Studio -> SQL Editor.

ALTER TABLE public.market_listings
  ADD COLUMN IF NOT EXISTS payout_claimed boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_market_listings_payout_pending
  ON public.market_listings (seller_id)
  WHERE sold_at IS NOT NULL AND payout_claimed = false;

NOTIFY pgrst, 'reload schema';

-- ===================== [17/26] SUPABASE_MARKETPLACE_POKEMON.sql =====================
-- =====================================================
-- Marketplace de Pokémon (P2P entre jogadores)
-- Rode este SQL uma vez no Supabase Studio → SQL Editor.
-- Já tolera "rodei duas vezes" (uses IF NOT EXISTS / OR REPLACE).
-- =====================================================

create table if not exists public.pokemon_market (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references auth.users(id) on delete cascade,
  seller_name text not null,
  pokemon jsonb not null,
  price bigint not null check (price > 0 and price <= 100000000),
  currency text not null check (currency in ('gold','crystal')),
  status text not null default 'pending' check (status in ('pending','active','sold','cancelled')),
  activate_at timestamptz not null,
  buyer_id uuid references auth.users(id),
  buyer_name text,
  sold_at timestamptz,
  payout_claimed boolean not null default false,
  buyer_claimed boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists pokemon_market_status_idx on public.pokemon_market (status, activate_at);
create index if not exists pokemon_market_seller_idx on public.pokemon_market (seller_id, status);
create index if not exists pokemon_market_buyer_idx  on public.pokemon_market (buyer_id, status);

-- GRANTs obrigatórios (PostgREST não concede nada por padrão)
grant select, insert, update on public.pokemon_market to authenticated;
grant all on public.pokemon_market to service_role;

alter table public.pokemon_market enable row level security;

-- limpa políticas antigas se re-executar
drop policy if exists "pkm_market_select"        on public.pokemon_market;
drop policy if exists "pkm_market_insert_own"    on public.pokemon_market;
drop policy if exists "pkm_market_update_seller" on public.pokemon_market;
drop policy if exists "pkm_market_update_buyer"  on public.pokemon_market;

-- SELECT: qualquer autenticado vê vitrine ativa; dono/comprador vê o próprio
DROP POLICY IF EXISTS "pkm_market_select" ON public.pokemon_market;

CREATE POLICY "pkm_market_select" ON public.pokemon_market
  for select to authenticated
  using (
    (status = 'active' and activate_at <= now())
    or (status = 'pending' and seller_id = auth.uid())
    or seller_id = auth.uid()
    or buyer_id = auth.uid()
  );

-- INSERT: só cria em nome próprio, sempre em estado pending
DROP POLICY IF EXISTS "pkm_market_insert_own" ON public.pokemon_market;

CREATE POLICY "pkm_market_insert_own" ON public.pokemon_market
  for insert to authenticated
  with check (
    seller_id = auth.uid()
    and status = 'pending'
    and activate_at >= now()
  );

-- UPDATE do vendedor: promover pending→active, cancelar, marcar payout
DROP POLICY IF EXISTS "pkm_market_update_seller" ON public.pokemon_market;

CREATE POLICY "pkm_market_update_seller" ON public.pokemon_market
  for update to authenticated
  using (seller_id = auth.uid())
  with check (seller_id = auth.uid());

-- UPDATE do comprador: comprar (status active→sold)
DROP POLICY IF EXISTS "pkm_market_update_buyer" ON public.pokemon_market;

CREATE POLICY "pkm_market_update_buyer" ON public.pokemon_market
  for update to authenticated
  using (
    status = 'active'
    and activate_at <= now()
    and seller_id <> auth.uid()
    and buyer_id is null
  )
  with check (
    buyer_id = auth.uid()
    and status = 'sold'
  );

-- ===================== [18/26] SUPABASE_MARKETPLACE_OFFERS.sql =====================
-- =====================================================
-- Ofertas do Marketplace de Pokémon
-- Rode UMA vez no Supabase Studio → SQL Editor.
-- Requer que SUPABASE_MARKETPLACE_POKEMON.sql já esteja rodado.
-- Idempotente.
-- =====================================================

-- Coluna opcional na listing pra marcar "vendido via oferta"
alter table public.pokemon_market
  add column if not exists via_offer boolean not null default false;

create table if not exists public.pokemon_market_offers (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.pokemon_market(id) on delete cascade,
  seller_id uuid not null,
  buyer_id uuid not null references auth.users(id) on delete cascade,
  buyer_name text not null,
  amount bigint not null check (amount > 0 and amount <= 100000000),
  currency text not null check (currency in ('gold','crystal')),
  status text not null default 'pending' check (status in ('pending','accepted','rejected','cancelled')),
  created_at timestamptz not null default now()
);

create index if not exists pkm_offers_listing_idx on public.pokemon_market_offers (listing_id, status);
create index if not exists pkm_offers_buyer_idx   on public.pokemon_market_offers (buyer_id, status);
create index if not exists pkm_offers_seller_idx  on public.pokemon_market_offers (seller_id, status);

grant select, insert, update on public.pokemon_market_offers to authenticated;
grant all on public.pokemon_market_offers to service_role;

alter table public.pokemon_market_offers enable row level security;

drop policy if exists "pkm_offers_select"        on public.pokemon_market_offers;
drop policy if exists "pkm_offers_insert_buyer"  on public.pokemon_market_offers;
drop policy if exists "pkm_offers_update_seller" on public.pokemon_market_offers;
drop policy if exists "pkm_offers_update_buyer"  on public.pokemon_market_offers;

-- SELECT: comprador vê as próprias; vendedor vê as do próprio anúncio
DROP POLICY IF EXISTS "pkm_offers_select" ON public.pokemon_market_offers;

CREATE POLICY "pkm_offers_select" ON public.pokemon_market_offers
  for select to authenticated
  using (buyer_id = auth.uid() or seller_id = auth.uid());

-- INSERT: comprador cria em nome próprio, sempre pending, nunca no próprio anúncio
DROP POLICY IF EXISTS "pkm_offers_insert_buyer" ON public.pokemon_market_offers;

CREATE POLICY "pkm_offers_insert_buyer" ON public.pokemon_market_offers
  for insert to authenticated
  with check (
    buyer_id = auth.uid()
    and status = 'pending'
    and seller_id <> auth.uid()
  );

-- UPDATE do vendedor: aceitar/rejeitar
DROP POLICY IF EXISTS "pkm_offers_update_seller" ON public.pokemon_market_offers;

CREATE POLICY "pkm_offers_update_seller" ON public.pokemon_market_offers
  for update to authenticated
  using (seller_id = auth.uid())
  with check (seller_id = auth.uid());

-- UPDATE do comprador: cancelar a própria oferta pending
DROP POLICY IF EXISTS "pkm_offers_update_buyer" ON public.pokemon_market_offers;

CREATE POLICY "pkm_offers_update_buyer" ON public.pokemon_market_offers
  for update to authenticated
  using (buyer_id = auth.uid() and status = 'pending')
  with check (buyer_id = auth.uid() and status = 'cancelled');

-- ===================== [19/26] SUPABASE_MARKETPLACE_OFFERS_ONLY.sql =====================
-- =====================================================
-- Marketplace: modo "somente ofertas"
-- Rode UMA vez no Supabase Studio → SQL Editor. Idempotente.
-- Requer SUPABASE_MARKETPLACE_POKEMON.sql e SUPABASE_MARKETPLACE_OFFERS.sql.
-- =====================================================

alter table public.pokemon_market
  add column if not exists offers_only boolean not null default false;

-- ===================== [20/26] SUPABASE_MARKETPLACE_CURRENCY_FIX.sql =====================
-- SUPABASE_MARKETPLACE_CURRENCY_FIX.sql
-- Relaxa o CHECK de currency no pokemon_market e pokemon_market_offers
-- para aceitar as novas moedas: gold, crystal, safira, esmerald.
-- Rode este SQL uma vez no SQL Editor do Supabase.

ALTER TABLE public.pokemon_market
  DROP CONSTRAINT IF EXISTS pokemon_market_currency_check;
ALTER TABLE public.pokemon_market
  ADD CONSTRAINT pokemon_market_currency_check
  CHECK (currency IN ('gold','crystal','safira','esmerald'));

ALTER TABLE public.pokemon_market_offers
  DROP CONSTRAINT IF EXISTS pokemon_market_offers_currency_check;
ALTER TABLE public.pokemon_market_offers
  ADD CONSTRAINT pokemon_market_offers_currency_check
  CHECK (currency IN ('gold','crystal','safira','esmerald'));

-- ===================== [21/26] SUPABASE_MARKETPLACE_BUY_FIX.sql =====================
-- ============================================================
-- FIX: compras no Mercado VIP falhando silenciosamente
-- Causa: a policy de UPDATE exigia auth.uid() = buyer_id no USING,
-- mas o comprador ainda NÃO é buyer_id quando clica em "Comprar"
-- (buyer_id está NULL). Resultado: 0 linhas atualizadas → "anúncio
-- indisponível", mesmo com stones/itens listados.
--
-- Este script separa em duas policies:
--   1) vendedor pode editar/atualizar seu próprio anúncio
--   2) qualquer autenticado pode "reivindicar" um anúncio aberto
--      (sold_at IS NULL AND buyer_id IS NULL), gravando-se como buyer_id
-- Rode no SQL Editor do Supabase.
-- ============================================================

alter table public.market_listings enable row level security;

drop policy if exists "market_listings_update_participants" on public.market_listings;
drop policy if exists "market_listings_update_seller"       on public.market_listings;
drop policy if exists "market_listings_update_buy"          on public.market_listings;

-- Vendedor pode atualizar seu próprio anúncio (ex.: editar preço/cancelar via update)
DROP POLICY IF EXISTS "market_listings_update_seller" ON public.market_listings;
create policy "market_listings_update_seller"
  on public.market_listings for update
  to authenticated
  using  (auth.uid() = seller_id)
  with check (auth.uid() = seller_id);

-- Comprador pode reivindicar um anúncio aberto, gravando buyer_id = auth.uid()
DROP POLICY IF EXISTS "market_listings_update_buy" ON public.market_listings;
create policy "market_listings_update_buy"
  on public.market_listings for update
  to authenticated
  using  (sold_at is null and buyer_id is null and auth.uid() <> seller_id)
  with check (auth.uid() = buyer_id and sold_at is not null);

-- Força PostgREST a recarregar o schema/policies
notify pgrst, 'reload schema';

-- Conferência
select policyname, cmd, qual, with_check
from pg_policies
where schemaname = 'public' and tablename = 'market_listings'
order by policyname;

-- ===================== [22/26] SUPABASE_MARKETPLACE_CLAIM_FIX.sql =====================
-- =====================================================
-- FIX: comprador não conseguia marcar buyer_claimed=true
-- após a venda (RLS bloqueava porque exigia status='active').
-- Sintoma: F5 fazia o cliente re-processar a compra, descontando
-- cristais/ouro várias vezes.
-- Rode UMA VEZ no Supabase Studio → SQL Editor.
-- =====================================================

drop policy if exists "pkm_market_update_buyer"       on public.pokemon_market;
drop policy if exists "pkm_market_update_buyer_claim" on public.pokemon_market;

-- Compra atômica: só quando ainda está ativo e sem comprador.
DROP POLICY IF EXISTS "pkm_market_update_buyer" ON public.pokemon_market;

CREATE POLICY "pkm_market_update_buyer" ON public.pokemon_market
  for update to authenticated
  using (
    status = 'active'
    and activate_at <= now()
    and seller_id <> auth.uid()
    and buyer_id is null
  )
  with check (
    buyer_id = auth.uid()
    and status = 'sold'
  );

-- Reclamar entrega: o próprio comprador marca buyer_claimed=true
-- depois que a venda foi concluída (status='sold', buyer_id = eu).
DROP POLICY IF EXISTS "pkm_market_update_buyer_claim" ON public.pokemon_market;

CREATE POLICY "pkm_market_update_buyer_claim" ON public.pokemon_market
  for update to authenticated
  using (
    status = 'sold'
    and buyer_id = auth.uid()
  )
  with check (
    status = 'sold'
    and buyer_id = auth.uid()
  );

-- ===================== [23/26] SUPABASE_ODDISH_LEADERBOARD.sql =====================
-- ============================================================
-- Ranking global do evento GRASS ODDISH
-- Rode no Supabase → SQL Editor. Cria a tabela, GRANTs, RLS
-- e as RPCs usadas pelo cliente (submit + top).
-- ============================================================

create extension if not exists pgcrypto;

create table if not exists public.oddish_event_leaderboard (
  user_id uuid primary key,
  username text not null default 'Treinador',
  captures integer not null default 0,
  updated_at timestamptz not null default now()
);

grant select on public.oddish_event_leaderboard to anon;
grant select, insert, update on public.oddish_event_leaderboard to authenticated;
grant all on public.oddish_event_leaderboard to service_role;

alter table public.oddish_event_leaderboard enable row level security;

drop policy if exists "Anyone can read oddish leaderboard" on public.oddish_event_leaderboard;
DROP POLICY IF EXISTS "Anyone can read oddish leaderboard" ON public.oddish_event_leaderboard;
create policy "Anyone can read oddish leaderboard"
on public.oddish_event_leaderboard
for select
to anon, authenticated
using (true);

drop policy if exists "Users can insert own oddish score" on public.oddish_event_leaderboard;
DROP POLICY IF EXISTS "Users can insert own oddish score" ON public.oddish_event_leaderboard;
create policy "Users can insert own oddish score"
on public.oddish_event_leaderboard
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can update own oddish score" on public.oddish_event_leaderboard;
DROP POLICY IF EXISTS "Users can update own oddish score" ON public.oddish_event_leaderboard;
create policy "Users can update own oddish score"
on public.oddish_event_leaderboard
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- Upsert seguro: só permite o valor subir (evita rollback por save antigo).
-- Aceita `_username` do cliente e, quando ele não vier/for fallback, busca
-- o nome real em `profiles.username`. Isso corrige "todo mundo aparece como Treinador".
drop function if exists public.record_oddish_captures(integer);
drop function if exists public.record_oddish_captures(integer, text);
create or replace function public.record_oddish_captures(_captures integer, _username text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  _uid uuid := auth.uid();
  _name text;
  _safe integer := greatest(0, least(coalesce(_captures, 0), 10000000));
begin
  if _uid is null then
    raise exception 'not authenticated';
  end if;

  select nullif(btrim(p.username), '') into _name
  from public.profiles p
  where p.id = _uid
  limit 1;

  _name := coalesce(
    nullif(nullif(btrim(_username), ''), 'Treinador'),
    nullif(_name, 'Treinador'),
    nullif(current_setting('request.jwt.claims', true)::jsonb -> 'user_metadata' ->> 'username', ''),
    nullif(current_setting('request.jwt.claims', true)::jsonb -> 'user_metadata' ->> 'name', ''),
    'Treinador'
  );
  _name := left(_name, 24);

  insert into public.oddish_event_leaderboard (user_id, username, captures, updated_at)
  values (_uid, _name, _safe, now())
  on conflict (user_id) do update set
    username = excluded.username,
    captures = greatest(public.oddish_event_leaderboard.captures, excluded.captures),
    updated_at = now();
end;
$$;

grant execute on function public.record_oddish_captures(integer, text) to authenticated;

-- Corrige nomes antigos já gravados como fallback no ranking.
update public.oddish_event_leaderboard o
set username = left(btrim(p.username), 24),
    updated_at = now()
from public.profiles p
where o.user_id = p.id
  and nullif(btrim(p.username), '') is not null
  and o.username = 'Treinador';

create or replace function public.get_oddish_top(_limit integer default 100)
returns table (
  user_id uuid,
  username text,
  captures integer,
  updated_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select user_id, username, captures, updated_at
  from public.oddish_event_leaderboard
  where captures > 0
  order by captures desc, updated_at asc
  limit greatest(1, least(coalesce(_limit, 100), 500));
$$;

grant execute on function public.get_oddish_top(integer) to anon;
grant execute on function public.get_oddish_top(integer) to authenticated;

create index if not exists oddish_event_leaderboard_captures_idx
on public.oddish_event_leaderboard (captures desc, updated_at asc);

-- ===================== [24/26] SUPABASE_RANKED_FIX.sql =====================
-- Correção do TOP RANKED para Supabase externo.
-- Rode este SQL no Supabase SQL Editor.
-- Ele cria/ajusta as tabelas públicas, GRANTs, RLS e RPC usados pelo jogo.

create extension if not exists pgcrypto;

create table if not exists public.ranked_seasons (
  id uuid primary key default gen_random_uuid(),
  started_at timestamptz not null default now(),
  ends_at timestamptz not null default (now() + interval '30 days'),
  is_current boolean not null default true
);

grant select on public.ranked_seasons to anon;
grant select on public.ranked_seasons to authenticated;
grant all on public.ranked_seasons to service_role;

alter table public.ranked_seasons enable row level security;

drop policy if exists "Anyone can read ranked seasons" on public.ranked_seasons;
DROP POLICY IF EXISTS "Anyone can read ranked seasons" ON public.ranked_seasons;
create policy "Anyone can read ranked seasons"
on public.ranked_seasons
for select
to anon, authenticated
using (true);

insert into public.ranked_seasons (started_at, ends_at, is_current)
select now(), now() + interval '30 days', true
where not exists (select 1 from public.ranked_seasons where is_current = true);

create table if not exists public.ranked_leaderboard (
  season_id uuid not null references public.ranked_seasons(id) on delete cascade,
  user_id uuid not null,
  username text not null default 'Treinador',
  trainer_level integer not null default 1,
  craft_points integer not null default 0,
  guild_name text,
  score bigint not null default 100,
  updated_at timestamptz not null default now(),
  primary key (season_id, user_id)
);

grant select on public.ranked_leaderboard to anon;
grant select, insert, update on public.ranked_leaderboard to authenticated;
grant all on public.ranked_leaderboard to service_role;

alter table public.ranked_leaderboard enable row level security;

drop policy if exists "Anyone can read ranked leaderboard" on public.ranked_leaderboard;
DROP POLICY IF EXISTS "Anyone can read ranked leaderboard" ON public.ranked_leaderboard;
create policy "Anyone can read ranked leaderboard"
on public.ranked_leaderboard
for select
to anon, authenticated
using (true);

drop policy if exists "Users can upsert own ranked leaderboard" on public.ranked_leaderboard;
DROP POLICY IF EXISTS "Users can upsert own ranked leaderboard" ON public.ranked_leaderboard;
create policy "Users can upsert own ranked leaderboard"
on public.ranked_leaderboard
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can update own ranked leaderboard" on public.ranked_leaderboard;
DROP POLICY IF EXISTS "Users can update own ranked leaderboard" ON public.ranked_leaderboard;
create policy "Users can update own ranked leaderboard"
on public.ranked_leaderboard
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create table if not exists public.ranked_scores (
  user_id uuid primary key,
  username text not null default 'Treinador',
  trainer_level integer not null default 1,
  pokedex_count integer not null default 0,
  total_kills integer not null default 0,
  updated_at timestamptz not null default now()
);

grant select on public.ranked_scores to anon;
grant select, insert, update on public.ranked_scores to authenticated;
grant all on public.ranked_scores to service_role;

alter table public.ranked_scores enable row level security;

drop policy if exists "Anyone can read ranked scores" on public.ranked_scores;
DROP POLICY IF EXISTS "Anyone can read ranked scores" ON public.ranked_scores;
create policy "Anyone can read ranked scores"
on public.ranked_scores
for select
to anon, authenticated
using (true);

drop policy if exists "Users can insert own ranked score" on public.ranked_scores;
DROP POLICY IF EXISTS "Users can insert own ranked score" ON public.ranked_scores;
create policy "Users can insert own ranked score"
on public.ranked_scores
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can update own ranked score" on public.ranked_scores;
DROP POLICY IF EXISTS "Users can update own ranked score" ON public.ranked_scores;
create policy "Users can update own ranked score"
on public.ranked_scores
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create or replace function public.record_ranked_score(
  _level integer,
  _craft_points integer,
  _guild_name text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  _uid uuid := auth.uid();
  _season uuid;
  _username text;
  _level_safe integer := greatest(1, least(coalesce(_level, 1), 10000));
  _craft_safe integer := greatest(0, least(coalesce(_craft_points, 0), 500));
  _save_level_text text;
  _save_level integer;
begin
  if _uid is null then
    raise exception 'not authenticated';
  end if;

  select id into _season
  from public.ranked_seasons
  where is_current = true
  order by started_at desc
  limit 1;

  if _season is null then
    insert into public.ranked_seasons (started_at, ends_at, is_current)
    values (now(), now() + interval '30 days', true)
    returning id into _season;
  end if;

  _username := coalesce(
    nullif(current_setting('request.jwt.claims', true)::jsonb -> 'user_metadata' ->> 'username', ''),
    nullif(current_setting('request.jwt.claims', true)::jsonb -> 'user_metadata' ->> 'name', ''),
    'Treinador'
  );

  -- Se o cliente chegou com level 1 por cache/timing, usa o nível REAL do save completo.
  -- O game_saves é a fonte de verdade do jogo publicado.
  select case
    when (data #>> '{idle,trainerLevel}') ~ '^[0-9]+$' then data #>> '{idle,trainerLevel}'
    when (data #>> '{idle,trainer_level}') ~ '^[0-9]+$' then data #>> '{idle,trainer_level}'
    else null
  end
  into _save_level_text
  from public.game_saves
  where user_id = _uid
  limit 1;

  if _save_level_text ~ '^[0-9]+$' then
    _save_level := greatest(1, least(_save_level_text::integer, 10000));
    _level_safe := greatest(_level_safe, _save_level);
  end if;

  insert into public.ranked_leaderboard (
    season_id, user_id, username, trainer_level, craft_points, guild_name, score, updated_at
  ) values (
    _season,
    _uid,
    _username,
    _level_safe,
    _craft_safe,
    _guild_name,
    (_level_safe::bigint * 100) + _craft_safe,
    now()
  )
  on conflict (season_id, user_id) do update set
    username = excluded.username,
    -- SEMPRE reflete o nível REAL atual do treinador (sem greatest histórico).
    trainer_level = excluded.trainer_level,
    craft_points = excluded.craft_points,
    guild_name = excluded.guild_name,
    score = excluded.score,
    updated_at = now();

  insert into public.ranked_scores (user_id, username, trainer_level, pokedex_count, updated_at)
  values (_uid, _username, _level_safe, _craft_safe, now())
  on conflict (user_id) do update set
    username = excluded.username,
    trainer_level = excluded.trainer_level,
    pokedex_count = excluded.pokedex_count,
    updated_at = now();
end;
$$;

grant execute on function public.record_ranked_score(integer, integer, text) to authenticated;

-- Backfill: corrige jogadores que já ficaram gravados como Lv 1 no ranked,
-- usando o nível real do save completo.
with real_saves as (
  select
    user_id as uid,
    greatest(1, least((case
      when (data #>> '{idle,trainerLevel}') ~ '^[0-9]+$' then (data #>> '{idle,trainerLevel}')::integer
      when (data #>> '{idle,trainer_level}') ~ '^[0-9]+$' then (data #>> '{idle,trainer_level}')::integer
      else 1
    end), 10000)) as real_level,
    updated_at
  from public.game_saves
  where ((data #>> '{idle,trainerLevel}') ~ '^[0-9]+$' or (data #>> '{idle,trainer_level}') ~ '^[0-9]+$')
)
update public.ranked_scores rs
set trainer_level = real_saves.real_level,
    updated_at = greatest(rs.updated_at, real_saves.updated_at)
from real_saves
where rs.user_id = real_saves.uid
  and real_saves.real_level > rs.trainer_level;

with real_saves as (
  select
    user_id as uid,
    greatest(1, least((case
      when (data #>> '{idle,trainerLevel}') ~ '^[0-9]+$' then (data #>> '{idle,trainerLevel}')::integer
      when (data #>> '{idle,trainer_level}') ~ '^[0-9]+$' then (data #>> '{idle,trainer_level}')::integer
      else 1
    end), 10000)) as real_level,
    updated_at
  from public.game_saves
  where ((data #>> '{idle,trainerLevel}') ~ '^[0-9]+$' or (data #>> '{idle,trainer_level}') ~ '^[0-9]+$')
)
update public.ranked_leaderboard rl
set trainer_level = real_saves.real_level,
    score = (real_saves.real_level::bigint * 100) + rl.craft_points,
    updated_at = greatest(rl.updated_at, real_saves.updated_at)
from real_saves
where rl.user_id = real_saves.uid
  and real_saves.real_level > rl.trainer_level;

-- Ranking público definitivo: mostra o nível REAL atual vindo do save completo.
-- Retorna só campos públicos do ranking; não expõe o JSON do save.
create or replace function public.get_global_ranked(_limit integer default 200)
returns table (
  user_id uuid,
  username text,
  trainer_level integer,
  craft_points integer,
  guild_name text,
  score bigint,
  updated_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  with season as (
    select id
    from public.ranked_seasons
    where is_current = true
    order by started_at desc
    limit 1
  ), saves as (
    select
      gs.user_id as uid,
      greatest(1, least((case
        when (gs.data #>> '{idle,trainerLevel}') ~ '^[0-9]+$' then (gs.data #>> '{idle,trainerLevel}')::integer
        when (gs.data #>> '{idle,trainer_level}') ~ '^[0-9]+$' then (gs.data #>> '{idle,trainer_level}')::integer
        else 1
      end), 10000)) as real_level,
      gs.updated_at as save_updated_at
    from public.game_saves gs
    where ((gs.data #>> '{idle,trainerLevel}') ~ '^[0-9]+$' or (gs.data #>> '{idle,trainer_level}') ~ '^[0-9]+$')
  ), base as (
    select
      coalesce(rl.user_id, rs.user_id, saves.uid) as uid,
      coalesce(nullif(rl.username, ''), nullif(rs.username, ''), 'Treinador') as uname,
      greatest(coalesce(saves.real_level, 1), coalesce(rl.trainer_level, 1), coalesce(rs.trainer_level, 1)) as lvl,
      greatest(coalesce(rl.craft_points, 0), coalesce(rs.pokedex_count, 0), 0) as craft,
      rl.guild_name as guild,
      greatest(coalesce(saves.save_updated_at, 'epoch'::timestamptz), coalesce(rl.updated_at, 'epoch'::timestamptz), coalesce(rs.updated_at, 'epoch'::timestamptz)) as upd
    from saves
    full join public.ranked_scores rs on rs.user_id = saves.uid
    full join public.ranked_leaderboard rl on rl.user_id = coalesce(saves.uid, rs.user_id)
      and (not exists (select 1 from season) or rl.season_id = (select id from season))
  )
  select
    uid as user_id,
    uname as username,
    lvl as trainer_level,
    craft as craft_points,
    guild as guild_name,
    (lvl::bigint * 100) + craft as score,
    upd as updated_at
  from base
  where uid is not null
  order by lvl desc, craft desc, upd asc
  limit greatest(1, least(coalesce(_limit, 200), 500));
$$;

grant execute on function public.get_global_ranked(integer) to anon;
grant execute on function public.get_global_ranked(integer) to authenticated;

create index if not exists ranked_leaderboard_score_idx
on public.ranked_leaderboard (season_id, score desc, updated_at asc);

create index if not exists ranked_scores_level_idx
on public.ranked_scores (trainer_level desc, pokedex_count desc, total_kills desc);

-- ===================== [25/26] SUPABASE_HARDEN_SAVES.sql =====================
-- =====================================================================
-- BLINDAGEM DOS SAVES (anti-cheat)  —  rodar no SQL Editor do Supabase
-- =====================================================================
-- Problema atual: as policies de public.game_saves eram "USING (true)",
-- ou seja, QUALQUER pessoa (inclusive anon) podia ler e sobrescrever o
-- save de QUALQUER treinador direto pela API REST. Isso é o que permitia
-- alterar ouro/cristal/nível pelo front e gravar no banco.
--
-- Este script:
--   1) tranca game_saves por auth.uid()  (dono só mexe no próprio save)
--   2) remove acesso do papel anon
--   3) força user_id = auth.uid() em INSERT/UPDATE
--   4) trigger com tetos + anti-jump (nível, ouro, cristal, esmeralda,
--      safira, itens, coleção, nível de pokémon) e proteção de rollback
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) RLS: só o dono
-- ---------------------------------------------------------------------
alter table public.game_saves enable row level security;

drop policy if exists game_saves_public_game_access on public.game_saves;
drop policy if exists saves_public_read   on public.game_saves;
drop policy if exists saves_public_insert on public.game_saves;
drop policy if exists saves_public_update on public.game_saves;
drop policy if exists saves_public_delete on public.game_saves;

DROP POLICY IF EXISTS game_saves_owner_select ON public.game_saves;


CREATE POLICY game_saves_owner_select ON public.game_saves
  for select to authenticated using (user_id = auth.uid());

DROP POLICY IF EXISTS game_saves_owner_insert ON public.game_saves;


CREATE POLICY game_saves_owner_insert ON public.game_saves
  for insert to authenticated with check (user_id = auth.uid());

DROP POLICY IF EXISTS game_saves_owner_update ON public.game_saves;


CREATE POLICY game_saves_owner_update ON public.game_saves
  for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Delete só via service_role (nenhuma policy para authenticated).

revoke all on public.game_saves from anon;
grant select, insert, update on public.game_saves to authenticated;
grant all on public.game_saves to service_role;

-- ---------------------------------------------------------------------
-- 2) Trigger de validação server-side
-- ---------------------------------------------------------------------
create or replace function public.enforce_game_save_caps()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  _prev_level int := 1;
  _new_level  int;
  _cap_jump   int := 5000;     -- salto maximo de niveis por save
  _cap_level  int := 1000000;
  _cap_gold   bigint := 50000000;
  _cap_cry    bigint := 1000000;
  _cap_esm    bigint := 1000000;
  _cap_saf    bigint := 1000000;
  _cap_col    int := 500;
  _cap_item   bigint := 999999;
  _k          text;
  _v          jsonb;
  _items      jsonb;
  _out        jsonb;
begin
  -- Dono sempre é quem está autenticado (bloqueia gravar no save de outro).
  if auth.uid() is not null then
    new.user_id := auth.uid();
  end if;

  new.updated_at := now();

  if new.data is null or jsonb_typeof(new.data) <> 'object' then
    return new;
  end if;

  -- ---------------- nível do treinador (teto + anti-jump) -------------
  if tg_op = 'UPDATE' and old.data is not null then
    begin
      _prev_level := greatest(1, coalesce(
        nullif(old.data #>> '{idle,trainerLevel}','')::int,
        nullif(old.data #>> '{idle,trainer_level}','')::int, 1));
    exception when others then _prev_level := 1;
    end;
  end if;

  begin
    _new_level := coalesce(
      nullif(new.data #>> '{idle,trainerLevel}','')::int,
      nullif(new.data #>> '{idle,trainer_level}','')::int, _prev_level);
  exception when others then _new_level := _prev_level;
  end;

  _new_level := least(_cap_level, greatest(1, _new_level));
  if _new_level > _prev_level + _cap_jump then
    _new_level := _prev_level + _cap_jump;
  end if;

  if (new.data #>> '{idle,trainerLevel}') is not null then
    new.data := jsonb_set(new.data, '{idle,trainerLevel}', to_jsonb(_new_level), true);
  end if;
  if (new.data #>> '{idle,trainer_level}') is not null then
    new.data := jsonb_set(new.data, '{idle,trainer_level}', to_jsonb(_new_level), true);
  end if;

  -- ---------------- moedas: teto absoluto ----------------------------
  begin
    if coalesce(nullif(new.data #>> '{idle,gold}','')::bigint, 0) > _cap_gold then
      new.data := jsonb_set(new.data, '{idle,gold}', to_jsonb(_cap_gold), true);
    end if;
  exception when others then null; end;

  begin
    if coalesce(nullif(new.data #>> '{idle,crystal}','')::bigint, 0) > _cap_cry then
      new.data := jsonb_set(new.data, '{idle,crystal}', to_jsonb(_cap_cry), true);
    end if;
  exception when others then null; end;

  begin
    if coalesce(nullif(new.data #>> '{idle,esmeralda}','')::bigint, 0) > _cap_esm then
      new.data := jsonb_set(new.data, '{idle,esmeralda}', to_jsonb(_cap_esm), true);
    end if;
  exception when others then null; end;

  begin
    if coalesce(nullif(new.data #>> '{idle,safira}','')::bigint, 0) > _cap_saf then
      new.data := jsonb_set(new.data, '{idle,safira}', to_jsonb(_cap_saf), true);
    end if;
  exception when others then null; end;

  -- ---------------- itens: teto por item ------------------------------
  begin
    _items := new.data #> '{idle,items}';
    if _items is not null and jsonb_typeof(_items) = 'object' then
      _out := '{}'::jsonb;
      for _k, _v in select * from jsonb_each(_items) loop
        if jsonb_typeof(_v) = 'number' then
          _out := _out || jsonb_build_object(
            _k, to_jsonb(least(_cap_item, greatest(0, floor((_v #>> '{}')::numeric)::bigint))));
        end if;
      end loop;
      new.data := jsonb_set(new.data, '{idle,items}', _out, true);
    end if;
  exception when others then null; end;

  -- ---------------- coleção: máximo de 500 ---------------------------
  begin
    if jsonb_typeof(new.data #> '{idle,collection}') = 'array'
       and jsonb_array_length(new.data #> '{idle,collection}') > _cap_col then
      new.data := jsonb_set(
        new.data, '{idle,collection}',
        (select jsonb_agg(e) from (
           select e from jsonb_array_elements(new.data #> '{idle,collection}') e limit _cap_col
         ) s), true);
    end if;
  exception when others then null; end;

  -- ---------------- nível dos pokémon (teto 10000) --------------------
  begin
    if jsonb_typeof(new.data -> 'team') = 'array' then
      new.data := jsonb_set(new.data, '{team}', (
        select coalesce(jsonb_agg(
          case when jsonb_typeof(m -> 'level') = 'number'
               then jsonb_set(m, '{level}', to_jsonb(least(_cap_level,
                      greatest(1, floor((m #>> '{level}')::numeric)::int))), true)
               else m end), '[]'::jsonb)
        from jsonb_array_elements(new.data -> 'team') m), true);
    end if;
  exception when others then null; end;

  begin
    if jsonb_typeof(new.data -> 'restingBench') = 'array' then
      new.data := jsonb_set(new.data, '{restingBench}', (
        select coalesce(jsonb_agg(
          case when jsonb_typeof(m -> 'level') = 'number'
               then jsonb_set(m, '{level}', to_jsonb(least(_cap_level,
                      greatest(1, floor((m #>> '{level}')::numeric)::int))), true)
               else m end), '[]'::jsonb)
        from jsonb_array_elements(new.data -> 'restingBench') m), true);
    end if;
  exception when others then null; end;

  return new;
end;
$$;

revoke all on function public.enforce_game_save_caps() from anon, authenticated;

drop trigger if exists enforce_game_save_caps_trg on public.game_saves;
create trigger enforce_game_save_caps_trg
  before insert or update on public.game_saves
  for each row execute function public.enforce_game_save_caps();

-- ---------------------------------------------------------------------
-- 3) Correção retroativa de saves já estourados
-- ---------------------------------------------------------------------
update public.game_saves
   set data = jsonb_set(data, '{idle,gold}', to_jsonb(50000000::bigint), true)
 where (data #>> '{idle,gold}') ~ '^[0-9]+$'
   and (data #>> '{idle,gold}')::bigint > 50000000;

update public.game_saves
   set data = jsonb_set(data, '{idle,crystal}', to_jsonb(1000000::bigint), true)
 where (data #>> '{idle,crystal}') ~ '^[0-9]+$'
   and (data #>> '{idle,crystal}')::bigint > 1000000;

-- ===================== [26/26] supabase/migrations/20260923120000_revo_secure_checkpoints.sql =====================
-- =====================================================================
-- IDLE MON REVO — persistência segura (checkpoints versionados)
-- Rodar UMA vez no SQL Editor do Supabase (projeto novo).
-- Idempotente: pode rodar de novo sem quebrar nada.
--
-- O que cria:
--   1) profiles (login/personagem) — RLS só-dono
--   2) game_saves (+ save_version) — SEM escrita direta do cliente
--   3) trigger de tetos server-side (anti-cheat)
--   4) idempotency_keys (anti replay/duplicata)
--   5) audit_log leve (só conflitos/rejeições/bootstrap)
--   6) RPCs: checkpoint_save / checkpoint_fetch / delete_own_save
--
-- Segurança: cliente NUNCA escreve direto em game_saves. Tudo passa
-- pelo RPC checkpoint_save (compare-and-swap de versão + rate-limit de
-- ouro + tetos). RLS garante: cada jogador só lê o próprio save.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) profiles
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text,
  last_login timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;

drop policy if exists profiles_owner_select on public.profiles;
drop policy if exists profiles_owner_insert on public.profiles;
drop policy if exists profiles_owner_update on public.profiles;

DROP POLICY IF EXISTS profiles_owner_select ON public.profiles;

CREATE POLICY profiles_owner_select ON public.profiles
  for select to authenticated using (id = auth.uid());

DROP POLICY IF EXISTS profiles_owner_insert ON public.profiles;

CREATE POLICY profiles_owner_insert ON public.profiles
  for insert to authenticated with check (id = auth.uid());

DROP POLICY IF EXISTS profiles_owner_update ON public.profiles;

CREATE POLICY profiles_owner_update ON public.profiles
  for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

revoke all on public.profiles from anon;
grant select, insert, update on public.profiles to authenticated;

-- ---------------------------------------------------------------------
-- 2) game_saves (+ save_version para checkpoints versionados)
-- ---------------------------------------------------------------------
create table if not exists public.game_saves (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  save_version int not null default 0,
  updated_at timestamptz default now()
);

alter table public.game_saves
  add column if not exists save_version int not null default 0;

alter table public.game_saves enable row level security;

-- Remove políticas legadas abertas/permissivas (se existirem).
drop policy if exists game_saves_public_game_access on public.game_saves;
drop policy if exists saves_public_read   on public.game_saves;
drop policy if exists saves_public_insert on public.game_saves;
drop policy if exists saves_public_delete on public.game_saves;
drop policy if exists saves_public_update on public.game_saves;
drop policy if exists game_saves_own_select on public.game_saves;
drop policy if exists game_saves_own_insert on public.game_saves;
drop policy if exists game_saves_own_update on public.game_saves;
drop policy if exists game_saves_owner_insert on public.game_saves;
drop policy if exists game_saves_owner_update on public.game_saves;
drop policy if exists game_saves_owner_select on public.game_saves;
drop policy if exists profiles_public_game_access on public.profiles;

-- Leitura: só o dono. Escrita direta: NENHUMA (só via RPC checkpoint_save).
DROP POLICY IF EXISTS game_saves_owner_select ON public.game_saves;
CREATE POLICY game_saves_owner_select ON public.game_saves
  for select to authenticated using (user_id = auth.uid());

revoke all on public.game_saves from anon;
revoke insert, update, delete on public.game_saves from authenticated;
grant select on public.game_saves to authenticated;
grant all on public.game_saves to service_role;

-- ---------------------------------------------------------------------
-- 3) Trigger de tetos server-side (última linha de defesa)
-- ---------------------------------------------------------------------
create or replace function public.enforce_game_save_caps()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  _prev_level int := 1;
  _new_level  int;
  _cap_jump   int := 5000;
  _cap_level  int := 1000000;
  _cap_gold   bigint := 50000000;
  _cap_cry    bigint := 1000000;
  _cap_esm    bigint := 1000000;
  _cap_saf    bigint := 1000000;
  _cap_col    int := 500;
  _cap_item   bigint := 999999;
  _k          text;
  _v          jsonb;
  _items      jsonb;
  _out        jsonb;
begin
  if auth.uid() is not null then
    new.user_id := auth.uid();
  end if;

  new.updated_at := now();

  if new.data is null or jsonb_typeof(new.data) <> 'object' then
    return new;
  end if;

  -- nível do treinador (teto + anti-jump por save)
  if tg_op = 'UPDATE' and old.data is not null then
    begin
      _prev_level := greatest(1, coalesce(
        nullif(old.data #>> '{idle,trainerLevel}','')::int,
        nullif(old.data #>> '{idle,trainer_level}','')::int, 1));
    exception when others then _prev_level := 1;
    end;
  end if;

  begin
    _new_level := coalesce(
      nullif(new.data #>> '{idle,trainerLevel}','')::int,
      nullif(new.data #>> '{idle,trainer_level}','')::int, _prev_level);
  exception when others then _new_level := _prev_level;
  end;

  _new_level := least(_cap_level, greatest(1, _new_level));
  if _new_level > _prev_level + _cap_jump then
    _new_level := _prev_level + _cap_jump;
  end if;

  if (new.data #>> '{idle,trainerLevel}') is not null then
    new.data := jsonb_set(new.data, '{idle,trainerLevel}', to_jsonb(_new_level), true);
  end if;
  if (new.data #>> '{idle,trainer_level}') is not null then
    new.data := jsonb_set(new.data, '{idle,trainer_level}', to_jsonb(_new_level), true);
  end if;

  -- moedas: teto absoluto (bank e flat)
  begin
    if coalesce(nullif(new.data #>> '{idle,bank,gold}','')::bigint,
                nullif(new.data #>> '{idle,gold}','')::bigint, 0) > _cap_gold then
      if (new.data #>> '{idle,bank,gold}') is not null then
        new.data := jsonb_set(new.data, '{idle,bank,gold}', to_jsonb(_cap_gold), true);
      end if;
      if (new.data #>> '{idle,gold}') is not null then
        new.data := jsonb_set(new.data, '{idle,gold}', to_jsonb(_cap_gold), true);
      end if;
    end if;
  exception when others then null; end;

  begin
    if coalesce(nullif(new.data #>> '{idle,bank,crystals}','')::bigint,
                nullif(new.data #>> '{idle,crystal}','')::bigint, 0) > _cap_cry then
      if (new.data #>> '{idle,bank,crystals}') is not null then
        new.data := jsonb_set(new.data, '{idle,bank,crystals}', to_jsonb(_cap_cry), true);
      end if;
      if (new.data #>> '{idle,crystal}') is not null then
        new.data := jsonb_set(new.data, '{idle,crystal}', to_jsonb(_cap_cry), true);
      end if;
    end if;
  exception when others then null; end;

  begin
    if coalesce(nullif(new.data #>> '{idle,esmeralda}','')::bigint, 0) > _cap_esm then
      new.data := jsonb_set(new.data, '{idle,esmeralda}', to_jsonb(_cap_esm), true);
    end if;
  exception when others then null; end;

  begin
    if coalesce(nullif(new.data #>> '{idle,safira}','')::bigint, 0) > _cap_saf then
      new.data := jsonb_set(new.data, '{idle,safira}', to_jsonb(_cap_saf), true);
    end if;
  exception when others then null; end;

  -- itens: teto por item
  begin
    _items := new.data #> '{idle,items}';
    if _items is not null and jsonb_typeof(_items) = 'object' then
      _out := '{}'::jsonb;
      for _k, _v in select * from jsonb_each(_items) loop
        if jsonb_typeof(_v) = 'number' then
          _out := _out || jsonb_build_object(
            _k, to_jsonb(least(_cap_item, greatest(0, floor((_v #>> '{}')::numeric)::bigint))));
        end if;
      end loop;
      new.data := jsonb_set(new.data, '{idle,items}', _out, true);
    end if;
  exception when others then null; end;

  -- coleção: máximo de 500
  begin
    if jsonb_typeof(new.data #> '{idle,collection}') = 'array'
       and jsonb_array_length(new.data #> '{idle,collection}') > _cap_col then
      new.data := jsonb_set(
        new.data, '{idle,collection}',
        (select jsonb_agg(e) from (
           select e from jsonb_array_elements(new.data #> '{idle,collection}') e limit _cap_col
         ) s), true);
    end if;
  exception when others then null; end;

  -- nível dos pokémon (teto 1M)
  begin
    if jsonb_typeof(new.data -> 'team') = 'array' then
      new.data := jsonb_set(new.data, '{team}', (
        select coalesce(jsonb_agg(
          case when jsonb_typeof(m -> 'level') = 'number'
               then jsonb_set(m, '{level}', to_jsonb(least(_cap_level,
                      greatest(1, floor((m #>> '{level}')::numeric)::int))), true)
               else m end), '[]'::jsonb)
        from jsonb_array_elements(new.data -> 'team') m), true);
    end if;
  exception when others then null; end;

  begin
    if jsonb_typeof(new.data -> 'restingBench') = 'array' then
      new.data := jsonb_set(new.data, '{restingBench}', (
        select coalesce(jsonb_agg(
          case when jsonb_typeof(m -> 'level') = 'number'
               then jsonb_set(m, '{level}', to_jsonb(least(_cap_level,
                      greatest(1, floor((m #>> '{level}')::numeric)::int))), true)
               else m end), '[]'::jsonb)
        from jsonb_array_elements(new.data -> 'restingBench') m), true);
    end if;
  exception when others then null; end;

  return new;
end;
$$;

revoke all on function public.enforce_game_save_caps() from anon, authenticated;

drop trigger if exists enforce_game_save_caps_trg on public.game_saves;
create trigger enforce_game_save_caps_trg
  before insert or update on public.game_saves
  for each row execute function public.enforce_game_save_caps();

-- ---------------------------------------------------------------------
-- 4) idempotency_keys (anti replay/duplicata) — só via RPC
-- ---------------------------------------------------------------------
create table if not exists public.idempotency_keys (
  action_id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz default now()
);
create index if not exists idempotency_keys_created_idx on public.idempotency_keys (created_at);

alter table public.idempotency_keys enable row level security;
revoke all on public.idempotency_keys from anon, authenticated;
grant all on public.idempotency_keys to service_role;

-- ---------------------------------------------------------------------
-- 5) audit_log leve (só eventos importantes: conflitos, rejeições, bootstrap)
-- ---------------------------------------------------------------------
create table if not exists public.audit_log (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users(id) on delete cascade,
  action text not null,
  detail jsonb not null default '{}'::jsonb,
  created_at timestamptz default now()
);
create index if not exists audit_log_user_idx on public.audit_log (user_id, created_at desc);

alter table public.audit_log enable row level security;
drop policy if exists audit_log_owner_select on public.audit_log;
DROP POLICY IF EXISTS audit_log_owner_select ON public.audit_log;
CREATE POLICY audit_log_owner_select ON public.audit_log
  for select to authenticated using (user_id = auth.uid());
revoke all on public.audit_log from anon;
revoke insert, update, delete on public.audit_log from authenticated;
grant select on public.audit_log to authenticated;
grant all on public.audit_log to service_role;

-- ---------------------------------------------------------------------
-- 6) RPC checkpoint_save — compare-and-swap versionado + idempotente
-- ---------------------------------------------------------------------
create or replace function public.checkpoint_save(
  p_expected_version int,
  p_data jsonb,
  p_action_id text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  _uid uuid := auth.uid();
  _cur_version int := 0;
  _cur_gold bigint := 0;
  _cur_updated timestamptz := null;
  _has_row boolean := false;
  _new_version int;
  _new_gold bigint := 0;
  _elapsed_s numeric := 1;
  _max_gold_per_sec numeric := 200; -- folga ~30x acima do farm legítimo (~6/s)
begin
  if _uid is null then
    return jsonb_build_object('ok', false, 'reason', 'unauthenticated');
  end if;
  if p_action_id is null or length(p_action_id) = 0 or length(p_action_id) > 200 then
    return jsonb_build_object('ok', false, 'reason', 'bad_action_id');
  end if;
  if p_data is null or jsonb_typeof(p_data) <> 'object' then
    return jsonb_build_object('ok', false, 'reason', 'bad_snapshot');
  end if;
  if p_data -> 'idle' is null or jsonb_typeof(p_data -> 'idle') <> 'object' then
    return jsonb_build_object('ok', false, 'reason', 'bad_snapshot');
  end if;

  select save_version, updated_at into _cur_version, _cur_updated
    from public.game_saves where user_id = _uid;
  if found then
    _has_row := true;
  else
    _cur_version := 0;
  end if;

  -- Idempotência: replay do mesmo checkpoint não duplica.
  insert into public.idempotency_keys (action_id, user_id)
    values (p_action_id, _uid)
    on conflict (action_id) do nothing;
  if not found then
    return jsonb_build_object('ok', false, 'reason', 'duplicate', 'server_version', _cur_version);
  end if;

  -- Compare-and-swap: base defasada nunca sobrescreve o oficial.
  if _has_row and p_expected_version <> _cur_version then
    insert into public.audit_log (user_id, action, detail)
      values (_uid, 'checkpoint_stale',
        jsonb_build_object('expected', p_expected_version, 'server', _cur_version));
    return jsonb_build_object('ok', false, 'reason', 'stale', 'server_version', _cur_version);
  end if;

  -- Rate-limit de ouro server-side (ganho absurdo entre checkpoints = rejeita + audita).
  if _has_row then
    begin
      _cur_gold := coalesce(
        nullif((select data #>> '{idle,bank,gold}' from public.game_saves where user_id = _uid),'')::bigint,
        nullif((select data #>> '{idle,gold}' from public.game_saves where user_id = _uid),'')::bigint, 0);
    exception when others then _cur_gold := 0;
    end;
    begin
      _new_gold := coalesce(
        nullif(p_data #>> '{idle,bank,gold}','')::bigint,
        nullif(p_data #>> '{idle,gold}','')::bigint, 0);
    exception when others then _new_gold := 0;
    end;
    _elapsed_s := greatest(1, extract(epoch from (now() - _cur_updated)));
    if _new_gold > _cur_gold + (_elapsed_s * _max_gold_per_sec) then
      insert into public.audit_log (user_id, action, detail)
        values (_uid, 'checkpoint_rate_limited',
          jsonb_build_object('gold_was', _cur_gold, 'gold_now', _new_gold,
            'elapsed_s', _elapsed_s, 'server_version', _cur_version));
      return jsonb_build_object('ok', false, 'reason', 'rate_limited', 'server_version', _cur_version);
    end if;
  end if;

  if _has_row then
    _new_version := _cur_version + 1;
  else
    -- bootstrap (conta nova ou projeto novo): ancora na versão do cliente
    _new_version := greatest(1, p_expected_version + 1);
  end if;

  insert into public.game_saves (user_id, data, save_version, updated_at)
    values (_uid, p_data, _new_version, now())
    on conflict (user_id) do update
      set data = excluded.data,
          save_version = excluded.save_version,
          updated_at = excluded.updated_at;

  -- limpeza leve de chaves antigas (7 dias)
  delete from public.idempotency_keys where created_at < now() - interval '7 days';

  if not _has_row then
    insert into public.audit_log (user_id, action, detail)
      values (_uid, 'checkpoint_bootstrap', jsonb_build_object('server_version', _new_version));
  end if;

  return jsonb_build_object('ok', true, 'server_version', _new_version);
end;
$$;

-- ---------------------------------------------------------------------
-- 7) RPC delete_own_save
-- ---------------------------------------------------------------------
create or replace function public.delete_own_save()
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  _uid uuid := auth.uid();
begin
  if _uid is null then return false; end if;
  delete from public.game_saves where user_id = _uid;
  delete from public.idempotency_keys where user_id = _uid;
  return true;
end;
$$;

-- Grants: só authenticated executa os RPCs. Nada para anon.
revoke all on function public.checkpoint_save(int, jsonb, text) from public, anon;
grant execute on function public.checkpoint_save(int, jsonb, text) to authenticated;
revoke all on function public.delete_own_save() from public, anon;
grant execute on function public.delete_own_save() to authenticated;
grant all on all functions in schema public to service_role;

-- =====================================================================
-- VERIFICAÇÃO (rode após aplicar; tudo deve retornar 0/true):
--   select count(*) from public.game_saves;              -- tabela existe
--   select * from pg_policies where tablename='game_saves';
--   select proname from pg_proc where proname in ('checkpoint_save','delete_own_save');
-- =====================================================================
