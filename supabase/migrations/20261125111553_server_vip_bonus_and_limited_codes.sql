create table private.server_vip_campaign (
  id text primary key,
  starts_at timestamptz not null default now(),
  ends_at timestamptz not null
);
create table private.server_vip_grants (
  user_id uuid primary key references auth.users(id) on delete cascade,
  vip_until bigint not null,
  granted_at timestamptz not null default now()
);
alter table private.server_vip_campaign enable row level security;
alter table private.server_vip_grants enable row level security;
revoke all on private.server_vip_campaign, private.server_vip_grants from public, anon, authenticated;
insert into private.server_vip_campaign(id,ends_at) values('server_bonus_20261125',now()+interval '48 hours')
  on conflict(id) do nothing;

-- Expiração única: não são 48h novas a cada login/save. VIPs ativos são preservados.
insert into private.server_vip_grants(user_id,vip_until)
select s.user_id,floor(extract(epoch from c.ends_at)*1000)::bigint
from public.game_saves s cross join private.server_vip_campaign c
where c.id='server_bonus_20261125' and c.ends_at>now() and jsonb_typeof(s.data->'idle')='object'
  and (private.market_nonnegative_int(s.data #> '{idle,buffs,goldMultUntil}',9000000000000)<=floor(extract(epoch from now())*1000)::bigint
    or case when jsonb_typeof(s.data #> '{idle,buffs,goldMult}')='number'
      then round((s.data #>> '{idle,buffs,goldMult}')::numeric*100)<20 else true end)
on conflict(user_id) do nothing;

create function private.guard_server_bonus_and_lab_maps()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_now bigint := floor(extract(epoch from clock_timestamp())*1000)::bigint;
  v_until bigint; v_buffs jsonb; v_current bigint;
begin
  if jsonb_typeof(new.data->'idle') is distinct from 'object' then return new; end if;
  -- Todos os destinos da aba MAPAS do Professor estão fechados. O hub do
  -- Laboratório continua acessível para incubadora, professor e outros serviços.
  if new.data #>> '{idle,currentMap}' = any(array[
    'iceblow','monte_floreto','rayow','sakura_city','venenot','azulante','margrande',
    'navegante','hallow','caverna_brok','map_0000','map_0055','map_0066','map_0077'
  ]) then
    new.data := jsonb_set(new.data,'{idle,currentMap}','"laboratorio"',true);
  end if;
  v_buffs := coalesce(new.data #> '{idle,buffs}','{}');
  if jsonb_typeof(v_buffs)<>'object' then v_buffs:='{}'; end if;
  select vip_until into v_until from private.server_vip_grants where user_id=new.user_id;
  if v_until is null and (private.market_nonnegative_int(v_buffs->'goldMultUntil',9000000000000)<=v_now
    or case when jsonb_typeof(v_buffs->'goldMult')='number' then round((v_buffs->>'goldMult')::numeric*100)<20 else true end) then
    insert into private.server_vip_grants(user_id,vip_until)
    select new.user_id,floor(extract(epoch from ends_at)*1000)::bigint from private.server_vip_campaign
      where id='server_bonus_20261125' and ends_at>clock_timestamp()
    on conflict(user_id) do nothing;
    select vip_until into v_until from private.server_vip_grants where user_id=new.user_id;
  end if;
  if v_until>v_now then
    v_current := private.market_nonnegative_int(v_buffs->'goldMultUntil',9000000000000);
    if (v_current<=v_until or case when jsonb_typeof(v_buffs->'goldMult')='number'
      then round((v_buffs->>'goldMult')::numeric*100)<20 else true end) then
      v_buffs := v_buffs || jsonb_build_object('goldMult',case
        when v_current>v_now and jsonb_typeof(v_buffs->'goldMult')='number' then greatest((v_buffs->>'goldMult')::numeric,0.20)
        else 0.20 end,'goldMultUntil',v_until);
    end if;
    -- Não estica um livro de EXP mais forte nem reduz o buff ativo.
    v_current := private.market_nonnegative_int(v_buffs->'expMultUntil',9000000000000);
    if v_current<=v_now or (v_current<=v_until and
      case when jsonb_typeof(v_buffs->'expMult')='number' then (v_buffs->>'expMult')::numeric else 0 end <=0.20) then
      v_buffs := v_buffs || jsonb_build_object('expMult',0.20,'expMultUntil',v_until);
    end if;
    new.data := jsonb_set(new.data,'{idle,buffs}',v_buffs,true);
    new.data := jsonb_set(new.data,'{idle,serverVip48Until}',to_jsonb(v_until),true);
  end if;
  return new;
end;
$$;
revoke all on function private.guard_server_bonus_and_lab_maps() from public, anon, authenticated;
create trigger zy_server_bonus_and_lab_maps before insert or update on public.game_saves
  for each row execute function private.guard_server_bonus_and_lab_maps();

-- Ativação imediata para os saves elegíveis, sem apagar progresso/itens/introdução.
update public.game_saves s set
  data=jsonb_set(s.data,'{savedAt}',to_jsonb(floor(extract(epoch from clock_timestamp())*1000)::bigint),true),
  save_version=s.save_version+1
where exists(select 1 from private.server_vip_grants g where g.user_id=s.user_id and g.vip_until>floor(extract(epoch from now())*1000)::bigint)
   or s.data #>> '{idle,currentMap}' = any(array[
    'iceblow','monte_floreto','rayow','sakura_city','venenot','azulante','margrande',
    'navegante','hallow','caverna_brok','map_0000','map_0055','map_0066','map_0077'
   ]);

create function public.get_server_vip_bonus()
returns jsonb language sql stable security definer set search_path = '' as $$
select jsonb_build_object('vip_until',g.vip_until,'buffs',s.data #> '{idle,buffs}')
from private.server_vip_grants g join public.game_saves s on s.user_id=g.user_id
where g.user_id=(select auth.uid())
$$;
revoke all on function public.get_server_vip_bonus() from public, anon;
grant execute on function public.get_server_vip_bonus() to authenticated;

create table private.limited_server_reward_codes (
  code_hash text primary key check(code_hash ~ '^[0-9a-f]{64}$'),
  reward_kind text not null check(reward_kind in ('vip_annual','ancestral_tickets')),
  reward_qty integer not null check(reward_qty=1),
  max_uses integer not null default 3 check(max_uses=3),
  used_count integer not null default 0 check(used_count between 0 and 3),
  created_at timestamptz not null default now()
);
alter table private.limited_server_reward_codes enable row level security;
revoke all on private.limited_server_reward_codes from public, anon, authenticated;
-- Somente hashes; os dois códigos legíveis são entregues diretamente ao dono.
insert into private.limited_server_reward_codes(code_hash,reward_kind,reward_qty) values
  ('d246af9be2eab36e201ab48dfcd737210f5e77c654734245942fc41997abc5db','vip_annual',1),
  ('b0cafa5475cd295a16ce23342c2ef6f141b166532dc9de969abe80c7cfc18104','ancestral_tickets',1)
on conflict(code_hash) do nothing;

create function public.redeem_limited_server_reward(p_code text,p_expected_version bigint)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := auth.uid();
  v_code text := upper(regexp_replace(coalesce(p_code,''),'[^a-zA-Z0-9]','','g'));
  v_hash text; v_save public.game_saves%rowtype; v_reward private.limited_server_reward_codes%rowtype;
  v_item text; v_qty bigint; v_data jsonb; v_items jsonb; v_version bigint; v_remaining integer;
  v_now bigint := floor(extract(epoch from clock_timestamp())*1000)::bigint;
begin
  if v_uid is null then return jsonb_build_object('ok',false,'reason','unauthenticated'); end if;
  if v_code !~ '^(VIPANUAL3|ANC3)[A-Z2-9]{20}$' then return jsonb_build_object('ok',false,'reason','invalid_or_used'); end if;
  v_hash := encode(sha256(convert_to(v_code,'UTF8')),'hex');
  select * into v_save from public.game_saves where user_id=v_uid for update;
  if not found or jsonb_typeof(v_save.data->'idle') is distinct from 'object' or jsonb_typeof(v_save.data->'team') is distinct from 'array' then
    return jsonb_build_object('ok',false,'reason','save_incomplete');
  end if;
  if p_expected_version is null or v_save.save_version<>p_expected_version then return jsonb_build_object('ok',false,'reason','stale'); end if;
  select * into v_reward from private.limited_server_reward_codes where code_hash=v_hash for update;
  if not found or v_reward.used_count>=v_reward.max_uses then return jsonb_build_object('ok',false,'reason','invalid_or_used'); end if;
  v_item := case when v_reward.reward_kind='vip_annual' then 'book_vip_60' else 'ticket_ancestral' end;
  v_data:=v_save.data;
  v_items:=coalesce(v_data #> '{idle,items}','{}');
  v_qty:=private.market_nonnegative_int(v_items->v_item,999999);
  if v_qty>999999-v_reward.reward_qty then return jsonb_build_object('ok',false,'reason','inventory_cap'); end if;
  v_qty:=v_qty+v_reward.reward_qty;
  v_items:=jsonb_set(v_items,array[v_item],to_jsonb(v_qty),true);
  v_data:=jsonb_set(v_data,'{idle,items}',v_items,true);
  v_data:=jsonb_set(v_data,'{savedAt}',to_jsonb(v_now),true);
  update private.limited_server_reward_codes set used_count=used_count+1
    where code_hash=v_hash and used_count<max_uses returning max_uses-used_count into v_remaining;
  if not found then raise exception 'reward_limit_race'; end if;
  update public.game_saves set data=v_data,save_version=save_version+1 where user_id=v_uid returning save_version into v_version;
  return jsonb_build_object('ok',true,'server_version',v_version,'saved_at',v_now,
    'reward_kind',v_reward.reward_kind,'item_id',v_item,'item_qty',v_qty,'reward_qty',v_reward.reward_qty,'uses_remaining',v_remaining);
end;
$$;
revoke all on function public.redeem_limited_server_reward(text,bigint) from public, anon;
grant execute on function public.redeem_limited_server_reward(text,bigint) to authenticated;
