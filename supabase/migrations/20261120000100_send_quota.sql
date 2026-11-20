-- Günlük gönderim sınırı sunucuda da denetlenir.
-- İstemci her gönderimden önce reserve_send çağırır; sınır doluysa hata alır.
-- Gün sınırı Türkiye saatine göredir. Tavan 20 (istemcideki MAX_DAILY_LIMIT ile aynı).

create or replace function public.reserve_send(p_limit integer)
returns integer
language plpgsql
stable
security invoker
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_cap integer := least(greatest(coalesce(p_limit, 10), 1), 20);
  v_day_start timestamptz :=
    date_trunc('day', now() at time zone 'Europe/Istanbul') at time zone 'Europe/Istanbul';
  v_sent integer;
begin
  if v_uid is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;
  select count(*) into v_sent
  from public.applications
  where user_id = v_uid and status = 'success' and created_at >= v_day_start;
  if v_sent >= v_cap then
    raise exception 'DAILY_SEND_LIMIT' using errcode = 'P0001', detail = format('%s/%s', v_sent, v_cap);
  end if;
  return v_cap - v_sent;
end;
$$;

revoke all on function public.reserve_send(integer) from public, anon;
grant execute on function public.reserve_send(integer) to authenticated;
