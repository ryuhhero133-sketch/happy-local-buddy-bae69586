-- Cosméticos públicos da presença: VIP, Nevezinha e montaria.
-- Qualquer jogador online passa a ver os selos dos outros no mapa.
alter table public.players
  add column if not exists cosmetics jsonb not null default '{}'::jsonb;

comment on column public.players.cosmetics is
  'Selo público do jogador: { vip: vip|vip30|vip60, nevezinha: boolean, mount: boolean }.';
