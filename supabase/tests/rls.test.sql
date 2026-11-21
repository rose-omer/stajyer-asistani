-- RLS testi (pgTAP). Çalıştırma: supabase test db
-- Kullanıcı A, kullanıcı B'nin satırlarını göremez ve değiştiremez.
begin;
create extension if not exists pgtap with schema extensions;
select plan(8);

insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'a@example.test'),
  ('22222222-2222-2222-2222-222222222222', 'b@example.test');

insert into public.companies (user_id, name, name_normalized)
values ('22222222-2222-2222-2222-222222222222', 'B Şirketi', 'b şirketi');

insert into public.applications (user_id, company_name, company_name_normalized, subject, status)
values ('22222222-2222-2222-2222-222222222222', 'B Şirketi', 'b şirketi', 'Başvuru', 'success');

-- A olarak oturum aç
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}', true);

select is((select count(*) from public.companies)::int, 0, 'A, B''nin şirketini görmez');
select is((select count(*) from public.applications)::int, 0, 'A, B''nin başvurusunu görmez');

select throws_ok(
  $$ insert into public.companies (user_id, name, name_normalized)
     values ('22222222-2222-2222-2222-222222222222', 'Sahte', 'sahte') $$,
  '42501', null, 'A, B adına satır ekleyemez'
);

update public.companies set name = 'Ele geçirildi';
select is((select count(*) from public.companies where name = 'Ele geçirildi')::int, 0, 'A, B''nin satırını güncelleyemez');

select is(public.consume_ai_request(), 1, 'Kota sayacı ilk istekte 1');

update public.usage set count = 0;
select is((select count from public.usage limit 1), 1, 'usage sayacı doğrudan sıfırlanamaz');

-- Günlük gönderim sınırı sunucuda da denetlenir.
select is(public.reserve_send(10), 10, 'reserve_send kalan hakkı döndürür');

insert into public.applications (user_id, company_name, company_name_normalized, subject, status)
values
  ('11111111-1111-1111-1111-111111111111', 'C', 'c', 'Başvuru', 'success'),
  ('11111111-1111-1111-1111-111111111111', 'D', 'd', 'Başvuru', 'success');

select throws_ok(
  $$ select public.reserve_send(2) $$,
  'P0001', 'DAILY_SEND_LIMIT', 'sınır dolunca reserve_send hata verir'
);

select * from finish();
rollback;
