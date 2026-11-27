-- Código único VIP GOLD 60 dias (1 uso global), entregue ao proprietário
-- fora do Git. Apenas o hash SHA-256 fica versionado.
insert into private.vipgold60_reward_codes (code_hash) values
  ('4fcbbc325bfefb0b52951910bf962fe5ae3298070f8e701798b198123ffb1347')
on conflict (code_hash) do nothing;
