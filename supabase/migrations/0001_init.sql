-- Saathi schema. Every table is protected by row-level security: a user can only
-- ever read or write rows whose user_id equals their own auth.uid().
-- Uploaded documents are analysed in memory and are intentionally NOT stored.

create table if not exists public.profiles (
  id            uuid primary key references auth.users (id) on delete cascade,
  display_name  text check (char_length(display_name) <= 60),
  language      text not null default 'en'
                check (language in ('en','hi','bn','ta','te','mr','kn','gu','ml','pa','or')),
  state         text check (char_length(state) <= 60),
  work_type     text check (work_type in ('delivery','ride_driver','daily_wage','domestic','other')),
  age_band      text check (age_band in ('18-25','26-40','41-59','60+')),
  income_band   text check (income_band in ('lt_10k','10k_20k','20k_40k','gt_40k')),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table if not exists public.earnings (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  entry_date  date not null default current_date,
  platform    text not null check (char_length(platform) between 1 and 40),
  amount_in   numeric(10,2) not null default 0 check (amount_in >= 0 and amount_in <= 1000000),
  expenses    numeric(10,2) not null default 0 check (expenses >= 0 and expenses <= 1000000),
  hours       numeric(4,2)  not null default 0 check (hours >= 0 and hours <= 24),
  trips       integer       not null default 0 check (trips >= 0 and trips <= 1000),
  notes       text check (char_length(notes) <= 300),
  source      text not null default 'manual' check (source in ('manual','voice','screenshot')),
  created_at  timestamptz not null default now()
);
create index if not exists earnings_user_date_idx on public.earnings (user_id, entry_date desc);

create table if not exists public.grievances (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null default auth.uid() references auth.users (id) on delete cascade,
  issue_type    text not null check (char_length(issue_type) between 1 and 40),
  counterparty  text not null check (char_length(counterparty) between 1 and 80),
  language      text not null default 'en',
  letter        text not null check (char_length(letter) <= 8000),
  summary       text check (char_length(summary) <= 2000),
  created_at    timestamptz not null default now()
);
create index if not exists grievances_user_idx on public.grievances (user_id, created_at desc);

alter table public.profiles   enable row level security;
alter table public.earnings   enable row level security;
alter table public.grievances enable row level security;

-- (select auth.uid()) is evaluated once per statement, not once per row.
create policy "profiles_select_own" on public.profiles for select to authenticated
  using (id = (select auth.uid()));
create policy "profiles_insert_own" on public.profiles for insert to authenticated
  with check (id = (select auth.uid()));
create policy "profiles_update_own" on public.profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));
create policy "profiles_delete_own" on public.profiles for delete to authenticated
  using (id = (select auth.uid()));

create policy "earnings_select_own" on public.earnings for select to authenticated
  using (user_id = (select auth.uid()));
create policy "earnings_insert_own" on public.earnings for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy "earnings_update_own" on public.earnings for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "earnings_delete_own" on public.earnings for delete to authenticated
  using (user_id = (select auth.uid()));

create policy "grievances_select_own" on public.grievances for select to authenticated
  using (user_id = (select auth.uid()));
create policy "grievances_insert_own" on public.grievances for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy "grievances_update_own" on public.grievances for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "grievances_delete_own" on public.grievances for delete to authenticated
  using (user_id = (select auth.uid()));

create or replace function public.touch_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end $$;

create trigger profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();
