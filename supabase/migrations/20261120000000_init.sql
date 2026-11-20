-- Stajyer Asistanı: ilk şema. Her tablo RLS ile yalnız sahibine açık.

create extension if not exists pgcrypto;

-- Profil (form alanları jsonb içinde; CV dosyası Storage'da)
create table public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table public.companies (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 2 and 160),
  name_normalized text not null,
  status text not null default 'idle'
    check (status in ('idle', 'analyzing', 'analyzed', 'generating', 'generated', 'sending', 'sent', 'error')),
  analysis jsonb,
  email_draft jsonb,
  recipient text,
  sources text[] not null default '{}',
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, name_normalized)
);

create table public.applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  company_id uuid references public.companies (id) on delete set null,
  company_name text not null,
  company_name_normalized text not null,
  position text,
  recipient text,
  subject text not null,
  body text,
  gmail_message_id text,
  status text not null check (status in ('success', 'failed')),
  error text,
  created_at timestamptz not null default now()
);

create index applications_user_created_idx on public.applications (user_id, created_at desc);
create index applications_user_name_idx on public.applications (user_id, company_name_normalized);

-- Günlük AI istek sayacı (Edge Function okur ve artırır)
create table public.usage (
  user_id uuid not null references auth.users (id) on delete cascade,
  day date not null default current_date,
  count integer not null default 0 check (count >= 0),
  primary key (user_id, day)
);

alter table public.profiles enable row level security;
alter table public.companies enable row level security;
alter table public.applications enable row level security;
alter table public.usage enable row level security;

create policy "profiles_owner" on public.profiles for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create policy "companies_owner" on public.companies for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create policy "applications_owner" on public.applications for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- usage: kullanıcı yalnız okur; yazma yalnız aşağıdaki fonksiyonla.
create policy "usage_owner_read" on public.usage for select to authenticated
  using (user_id = (select auth.uid()));

create or replace function public.consume_ai_request()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_count integer;
begin
  if v_uid is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;
  insert into public.usage (user_id, day, count)
  values (v_uid, current_date, 1)
  on conflict (user_id, day) do update set count = public.usage.count + 1
  returning count into v_count;
  return v_count;
end;
$$;

revoke all on function public.consume_ai_request() from public, anon;
grant execute on function public.consume_ai_request() to authenticated;

-- CV: özel bucket, yol {auth.uid()}/cv.pdf, yalnız PDF, en çok 5 MB
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('cv', 'cv', false, 5242880, array['application/pdf'])
on conflict (id) do nothing;

create policy "cv_owner_select" on storage.objects for select to authenticated
  using (bucket_id = 'cv' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "cv_owner_insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'cv' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "cv_owner_update" on storage.objects for update to authenticated
  using (bucket_id = 'cv' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "cv_owner_delete" on storage.objects for delete to authenticated
  using (bucket_id = 'cv' and (storage.foldername(name))[1] = (select auth.uid())::text);
