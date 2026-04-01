-- ============================================================
-- DESIDERI DI PUGLIA CLUB
-- Full app schema bootstrap for the current codebase
-- ============================================================

create extension if not exists "pgcrypto";
create extension if not exists "uuid-ossp";

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ============================================================
-- utenti: align with features used in the app
-- ============================================================

alter table public.utenti add column if not exists avatar_url text;
alter table public.utenti add column if not exists instagram_url text;
alter table public.utenti add column if not exists partner_id uuid;
alter table public.utenti add column if not exists desideri_balance integer not null default 0;
alter table public.utenti add column if not exists boost_multiplier numeric(4,2) not null default 1.0;
alter table public.utenti add column if not exists boost_expires_at timestamptz;
alter table public.utenti add column if not exists last_quiz_at timestamptz;
alter table public.utenti add column if not exists updated_at timestamptz not null default now();

drop trigger if exists trg_utenti_updated_at on public.utenti;
create trigger trg_utenti_updated_at
before update on public.utenti
for each row execute function public.set_updated_at();

-- ============================================================
-- partners
-- ============================================================

create table if not exists public.partners (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid references public.utenti(id) on delete set null,
  user_id uuid references public.utenti(id) on delete set null,
  name text not null,
  owner_name text,
  slug text unique,
  category text,
  subcategory text,
  description text,
  storytelling text,
  city text,
  address text,
  latitude double precision,
  longitude double precision,
  google_maps_url text,
  logo_url text,
  cover_image_url text,
  image text,
  card_image_url text,
  website_url text,
  instagram_url text,
  facebook_url text,
  tiktok_url text,
  phone text,
  whatsapp_phone text,
  whatsapp_number text,
  pin_code text,
  visits_month integer not null default 0,
  clicks_month integer not null default 0,
  saldo_punti integer not null default 0,
  is_verified boolean not null default false,
  verified_until timestamptz,
  is_active boolean not null default false,
  plan_tier text,
  commission_rate numeric(5,2) not null default 25,
  stripe_product_id text,
  stripe_customer_id text,
  stripe_subscription_id text,
  stripe_account_id text,
  stripe_connect_account_id text,
  subscription_status text not null default 'inactive',
  subscription_current_period_end timestamptz,
  must_choose_plan_once boolean not null default false,
  charges_enabled boolean not null default false,
  payouts_enabled boolean not null default false,
  price_range text,
  atmosphere text[] not null default '{}',
  ideal_moment text[] not null default '{}',
  ideal_target text[] not null default '{}',
  features jsonb not null default '{}'::jsonb,
  profile_score integer not null default 0,
  advanced_profile_completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_partners_owner_user_id on public.partners(owner_user_id);
create index if not exists idx_partners_city on public.partners(city);
create index if not exists idx_partners_slug on public.partners(slug);
create index if not exists idx_partners_is_active on public.partners(is_active);
create index if not exists idx_partners_subscription_status on public.partners(subscription_status);
create index if not exists idx_partners_is_verified on public.partners(is_verified) where is_verified = true;

alter table public.partners enable row level security;

drop policy if exists partners_public_read on public.partners;
create policy partners_public_read on public.partners
for select using (is_active = true or owner_user_id = auth.uid());

drop policy if exists partners_owner_insert on public.partners;
create policy partners_owner_insert on public.partners
for insert to authenticated
with check (owner_user_id = auth.uid());

drop policy if exists partners_owner_update on public.partners;
create policy partners_owner_update on public.partners
for update to authenticated
using (owner_user_id = auth.uid())
with check (owner_user_id = auth.uid());

drop trigger if exists trg_partners_updated_at on public.partners;
create trigger trg_partners_updated_at
before update on public.partners
for each row execute function public.set_updated_at();

-- Safe FK if utenti.partner_id already exists without constraint
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'utenti_partner_id_fkey'
  ) then
    alter table public.utenti
      add constraint utenti_partner_id_fkey
      foreign key (partner_id) references public.partners(id) on delete set null;
  end if;
exception when duplicate_object then
  null;
end $$;

-- ============================================================
-- partner profile support
-- ============================================================

create table if not exists public.partner_opening_hours (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references public.partners(id) on delete cascade,
  weekday integer not null check (weekday between 0 and 6),
  open_time time,
  close_time time,
  break_open_time time,
  break_close_time time,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (partner_id, weekday)
);

create table if not exists public.partner_analytics_monthly (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references public.partners(id) on delete cascade,
  month_start date not null,
  visits integer not null default 0,
  clicks_instagram integer not null default 0,
  clicks_website integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (partner_id, month_start)
);

create table if not exists public.master_tags (
  id text primary key,
  label text not null,
  group_name text,
  created_at timestamptz not null default now()
);

create table if not exists public.partner_tags (
  partner_id uuid not null references public.partners(id) on delete cascade,
  tag_id text not null references public.master_tags(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (partner_id, tag_id)
);

alter table public.partner_opening_hours enable row level security;
alter table public.partner_analytics_monthly enable row level security;
alter table public.master_tags enable row level security;
alter table public.partner_tags enable row level security;

drop policy if exists partner_opening_hours_read on public.partner_opening_hours;
create policy partner_opening_hours_read on public.partner_opening_hours
for select using (true);

drop policy if exists partner_opening_hours_write on public.partner_opening_hours;
create policy partner_opening_hours_write on public.partner_opening_hours
for all to authenticated
using (exists (select 1 from public.partners p where p.id = partner_id and p.owner_user_id = auth.uid()))
with check (exists (select 1 from public.partners p where p.id = partner_id and p.owner_user_id = auth.uid()));

drop policy if exists partner_analytics_monthly_read on public.partner_analytics_monthly;
create policy partner_analytics_monthly_read on public.partner_analytics_monthly
for select to authenticated
using (exists (select 1 from public.partners p where p.id = partner_id and p.owner_user_id = auth.uid()));

drop policy if exists master_tags_read on public.master_tags;
create policy master_tags_read on public.master_tags
for select using (true);

drop policy if exists partner_tags_read on public.partner_tags;
create policy partner_tags_read on public.partner_tags
for select using (true);

drop policy if exists partner_tags_write on public.partner_tags;
create policy partner_tags_write on public.partner_tags
for all to authenticated
using (exists (select 1 from public.partners p where p.id = partner_id and p.owner_user_id = auth.uid()))
with check (exists (select 1 from public.partners p where p.id = partner_id and p.owner_user_id = auth.uid()));

drop trigger if exists trg_partner_opening_hours_updated_at on public.partner_opening_hours;
create trigger trg_partner_opening_hours_updated_at
before update on public.partner_opening_hours
for each row execute function public.set_updated_at();

drop trigger if exists trg_partner_analytics_monthly_updated_at on public.partner_analytics_monthly;
create trigger trg_partner_analytics_monthly_updated_at
before update on public.partner_analytics_monthly
for each row execute function public.set_updated_at();

-- ============================================================
-- cards / album
-- ============================================================

create table if not exists public.cards (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  title_en text,
  image_url text,
  image_url_en text,
  audio_url text,
  audio_url_en text,
  type text not null check (type in ('monument', 'partner')),
  rarity text not null default 'common' check (rarity in ('common', 'rare', 'legendary')),
  city text,
  gps_lat double precision,
  gps_lng double precision,
  gps_radius integer not null default 100,
  pin_code text,
  description text,
  description_en text,
  points_value integer not null default 100,
  created_at timestamptz not null default now()
);

create table if not exists public.user_cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.utenti(id) on delete cascade,
  card_id uuid not null references public.cards(id) on delete cascade,
  unlocked_at timestamptz not null default now(),
  is_favorite boolean not null default false,
  unique (user_id, card_id)
);

alter table public.cards enable row level security;
alter table public.user_cards enable row level security;

drop policy if exists cards_public_read on public.cards;
create policy cards_public_read on public.cards
for select using (true);

drop policy if exists user_cards_read_own on public.user_cards;
create policy user_cards_read_own on public.user_cards
for select to authenticated using (user_id = auth.uid());

drop policy if exists user_cards_write_own on public.user_cards;
create policy user_cards_write_own on public.user_cards
for all to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- ============================================================
-- notifications / logs
-- ============================================================

create table if not exists public.notifiche (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.utenti(id) on delete cascade,
  titolo text not null,
  messaggio text not null,
  tipo text not null default 'sistema',
  letta boolean not null default false,
  link_azione text,
  created_at timestamptz not null default now()
);

create table if not exists public.logs_transazioni (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.utenti(id) on delete cascade,
  partner_id uuid references public.partners(id) on delete set null,
  tipo text not null,
  punti integer not null default 0,
  moltiplicatore numeric(4,2),
  punti_effettivi integer not null default 0,
  note text,
  created_at timestamptz not null default now()
);

create index if not exists idx_logs_transazioni_user on public.logs_transazioni(user_id);
create index if not exists idx_logs_transazioni_partner on public.logs_transazioni(partner_id);
create index if not exists idx_logs_transazioni_tipo on public.logs_transazioni(tipo);

alter table public.notifiche enable row level security;
alter table public.logs_transazioni enable row level security;

drop policy if exists notifiche_read_own on public.notifiche;
create policy notifiche_read_own on public.notifiche
for select to authenticated using (user_id = auth.uid());

drop policy if exists notifiche_update_own on public.notifiche;
create policy notifiche_update_own on public.notifiche
for update to authenticated using (user_id = auth.uid());

drop policy if exists notifiche_insert_auth on public.notifiche;
create policy notifiche_insert_auth on public.notifiche
for insert to authenticated with check (true);

drop policy if exists logs_transazioni_read_own on public.logs_transazioni;
create policy logs_transazioni_read_own on public.logs_transazioni
for select to authenticated
using (user_id = auth.uid() or exists (select 1 from public.partners p where p.id = partner_id and p.owner_user_id = auth.uid()));

drop policy if exists logs_transazioni_insert_auth on public.logs_transazioni;
create policy logs_transazioni_insert_auth on public.logs_transazioni
for insert to authenticated with check (true);

-- ============================================================
-- partner events / bookings
-- ============================================================

create table if not exists public.partner_events_created (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid references public.partners(id) on delete cascade,
  title text not null,
  description text,
  location text,
  city text,
  starts_at timestamptz not null,
  ends_at timestamptz,
  interest_tags text[],
  is_active boolean not null default true,
  registration_deadline timestamptz,
  available_spots integer,
  price numeric(10,2) not null default 0,
  payment_methods text[],
  latitude double precision,
  longitude double precision,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.prenotazioni_eventi (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.utenti(id) on delete cascade,
  event_id text not null,
  is_guest_event boolean not null default false,
  status text not null default 'confermato',
  num_ospiti integer not null default 1,
  note_aggiuntive text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.booking_payments (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid references public.prenotazioni_eventi(id) on delete cascade,
  user_id uuid references public.utenti(id) on delete set null,
  event_id text not null,
  partner_id uuid references public.partners(id) on delete set null,
  stripe_checkout_session_id text unique not null,
  stripe_payment_intent_id text unique,
  stripe_refund_id text,
  amount_total_cents integer not null default 0,
  application_fee_amount integer not null default 0,
  commission_rate numeric(5,2) not null default 25,
  currency text not null default 'eur',
  status text not null default 'paid',
  refunded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.partner_events_created enable row level security;
alter table public.prenotazioni_eventi enable row level security;
alter table public.booking_payments enable row level security;

drop policy if exists partner_events_public_read on public.partner_events_created;
create policy partner_events_public_read on public.partner_events_created
for select using (true);

drop policy if exists partner_events_owner_write on public.partner_events_created;
create policy partner_events_owner_write on public.partner_events_created
for all to authenticated
using (exists (select 1 from public.partners p where p.id = partner_id and p.owner_user_id = auth.uid()))
with check (exists (select 1 from public.partners p where p.id = partner_id and p.owner_user_id = auth.uid()));

drop policy if exists prenotazioni_eventi_read_own on public.prenotazioni_eventi;
create policy prenotazioni_eventi_read_own on public.prenotazioni_eventi
for select to authenticated using (user_id = auth.uid());

drop policy if exists prenotazioni_eventi_write_own on public.prenotazioni_eventi;
create policy prenotazioni_eventi_write_own on public.prenotazioni_eventi
for all to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists booking_payments_read_own on public.booking_payments;
create policy booking_payments_read_own on public.booking_payments
for select to authenticated
using (user_id = auth.uid() or exists (select 1 from public.partners p where p.id = partner_id and p.owner_user_id = auth.uid()));

drop trigger if exists trg_partner_events_created_updated_at on public.partner_events_created;
create trigger trg_partner_events_created_updated_at
before update on public.partner_events_created
for each row execute function public.set_updated_at();

drop trigger if exists trg_prenotazioni_eventi_updated_at on public.prenotazioni_eventi;
create trigger trg_prenotazioni_eventi_updated_at
before update on public.prenotazioni_eventi
for each row execute function public.set_updated_at();

drop trigger if exists trg_booking_payments_updated_at on public.booking_payments;
create trigger trg_booking_payments_updated_at
before update on public.booking_payments
for each row execute function public.set_updated_at();

-- ============================================================
-- club events
-- ============================================================

create table if not exists public.eventi_club (
  id uuid primary key default gen_random_uuid(),
  titolo text not null,
  titolo_en text,
  descrizione text not null,
  descrizione_en text,
  luogo text not null,
  latitudine double precision,
  longitudine double precision,
  data_inizio timestamptz not null,
  data_fine timestamptz not null,
  immagine_url text,
  tipo_sblocco text not null default 'gps' check (tipo_sblocco in ('gps', 'pin')),
  pin_code text,
  partner_id uuid references public.partners(id) on delete set null,
  ricompensa_card_id uuid references public.cards(id) on delete set null,
  link_esterno text,
  disponibile boolean not null default true,
  data_creazione timestamptz not null default now()
);

alter table public.eventi_club enable row level security;

drop policy if exists eventi_club_public_read on public.eventi_club;
create policy eventi_club_public_read on public.eventi_club
for select using (true);

create index if not exists idx_eventi_club_date on public.eventi_club(data_inizio, data_fine);

-- ============================================================
-- quests
-- ============================================================

create table if not exists public.quest_sets (
  id uuid primary key default gen_random_uuid(),
  title text,
  title_it text not null,
  title_en text,
  description text,
  description_it text,
  description_en text,
  image_url text,
  city text,
  quest_type text,
  is_active boolean not null default true,
  is_original boolean not null default false,
  estimated_time_min integer not null default 90,
  estimated_steps integer not null default 5,
  lore_text_it text,
  lore_text_en text,
  starting_point text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.quest_set_steps (
  id uuid primary key default gen_random_uuid(),
  quest_set_id uuid not null references public.quest_sets(id) on delete cascade,
  step_order integer not null,
  title text,
  description text,
  reference_table text,
  reference_id uuid,
  created_at timestamptz not null default now(),
  unique (quest_set_id, step_order)
);

create table if not exists public.user_quest_sets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.utenti(id) on delete cascade,
  set_id uuid not null references public.quest_sets(id) on delete cascade,
  status text not null default 'in_progress',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, set_id)
);

create table if not exists public.user_quest_set_steps (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.utenti(id) on delete cascade,
  step_id uuid not null references public.quest_set_steps(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, step_id)
);

create table if not exists public.user_quest_favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.utenti(id) on delete cascade,
  set_id uuid not null references public.quest_sets(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, set_id)
);

alter table public.quest_sets enable row level security;
alter table public.quest_set_steps enable row level security;
alter table public.user_quest_sets enable row level security;
alter table public.user_quest_set_steps enable row level security;
alter table public.user_quest_favorites enable row level security;

drop policy if exists quest_sets_public_read on public.quest_sets;
create policy quest_sets_public_read on public.quest_sets
for select using (is_active = true);

drop policy if exists quest_set_steps_public_read on public.quest_set_steps;
create policy quest_set_steps_public_read on public.quest_set_steps
for select using (exists (select 1 from public.quest_sets qs where qs.id = quest_set_id and qs.is_active = true));

drop policy if exists user_quest_sets_read_own on public.user_quest_sets;
create policy user_quest_sets_read_own on public.user_quest_sets
for select to authenticated using (user_id = auth.uid());

drop policy if exists user_quest_sets_write_own on public.user_quest_sets;
create policy user_quest_sets_write_own on public.user_quest_sets
for all to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists user_quest_set_steps_read_own on public.user_quest_set_steps;
create policy user_quest_set_steps_read_own on public.user_quest_set_steps
for select to authenticated using (user_id = auth.uid());

drop policy if exists user_quest_set_steps_write_own on public.user_quest_set_steps;
create policy user_quest_set_steps_write_own on public.user_quest_set_steps
for all to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists user_quest_favorites_rw_own on public.user_quest_favorites;
create policy user_quest_favorites_rw_own on public.user_quest_favorites
for all to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop trigger if exists trg_quest_sets_updated_at on public.quest_sets;
create trigger trg_quest_sets_updated_at
before update on public.quest_sets
for each row execute function public.set_updated_at();

drop trigger if exists trg_user_quest_sets_updated_at on public.user_quest_sets;
create trigger trg_user_quest_sets_updated_at
before update on public.user_quest_sets
for each row execute function public.set_updated_at();

-- ============================================================
-- concierge / creator
-- ============================================================

do $$ begin
  create type public.slot_type as enum ('food', 'culture', 'nightlife', 'relax', 'shopping', 'nature', 'sport');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.plan_season as enum ('primavera', 'estate', 'autunno', 'inverno', 'tutto_anno');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.plan_audience as enum ('coppie', 'famiglie', 'giovani', 'solo', 'tutti');
exception when duplicate_object then null;
end $$;

create table if not exists public.daily_plans (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.utenti(id) on delete cascade,
  title_it text not null,
  title_en text,
  description_it text not null,
  description_en text,
  cover_image_url text,
  price numeric(6,2) not null default 2.50,
  is_premium boolean not null default true,
  city text not null,
  season public.plan_season not null default 'tutto_anno',
  target_audience public.plan_audience not null default 'tutti',
  rating_avg double precision not null default 0,
  rating_count integer not null default 0,
  purchases_count integer not null default 0,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.plan_slots (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.daily_plans(id) on delete cascade,
  slot_order integer not null,
  time_label text not null,
  activity_title_it text not null,
  activity_title_en text,
  activity_description_it text,
  activity_description_en text,
  activity_image_url text,
  alt_activity_title_it text,
  alt_activity_title_en text,
  alt_activity_description_it text,
  alt_activity_description_en text,
  alt_activity_image_url text,
  latitude double precision,
  longitude double precision,
  type public.slot_type not null default 'culture',
  unique (plan_id, slot_order)
);

create table if not exists public.plan_purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.utenti(id) on delete cascade,
  plan_id uuid not null references public.daily_plans(id) on delete cascade,
  amount_paid numeric(6,2) not null,
  creator_share numeric(6,2) not null,
  platform_share numeric(6,2) not null,
  stripe_payment_id text,
  purchased_at timestamptz not null default now(),
  unique (user_id, plan_id)
);

create table if not exists public.plan_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.utenti(id) on delete cascade,
  plan_id uuid not null references public.daily_plans(id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  review_text text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, plan_id)
);

create table if not exists public.vibe_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.utenti(id) on delete cascade,
  city text,
  vibe text,
  note text,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table if not exists public.creator_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.utenti(id) on delete cascade,
  instagram_url text,
  perla_segreta text not null,
  vibe_tags text[] not null default '{}',
  accetta_piano_b boolean not null default false,
  accetta_qualita boolean not null default false,
  accetta_aggiornamento boolean not null default false,
  accetta_commissione boolean not null default false,
  stato text not null default 'pending' check (stato in ('pending', 'approved', 'rejected')),
  note_admin text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.daily_plans enable row level security;
alter table public.plan_slots enable row level security;
alter table public.plan_purchases enable row level security;
alter table public.plan_reviews enable row level security;
alter table public.vibe_reports enable row level security;
alter table public.creator_applications enable row level security;

drop policy if exists daily_plans_public_read on public.daily_plans;
create policy daily_plans_public_read on public.daily_plans
for select using (is_published = true or creator_id = auth.uid());

drop policy if exists daily_plans_creator_write on public.daily_plans;
create policy daily_plans_creator_write on public.daily_plans
for all to authenticated
using (creator_id = auth.uid())
with check (creator_id = auth.uid());

drop policy if exists plan_slots_public_read on public.plan_slots;
create policy plan_slots_public_read on public.plan_slots
for select using (exists (select 1 from public.daily_plans dp where dp.id = plan_id and (dp.is_published = true or dp.creator_id = auth.uid())));

drop policy if exists plan_slots_creator_write on public.plan_slots;
create policy plan_slots_creator_write on public.plan_slots
for all to authenticated
using (exists (select 1 from public.daily_plans dp where dp.id = plan_id and dp.creator_id = auth.uid()))
with check (exists (select 1 from public.daily_plans dp where dp.id = plan_id and dp.creator_id = auth.uid()));

drop policy if exists plan_purchases_read_own on public.plan_purchases;
create policy plan_purchases_read_own on public.plan_purchases
for select to authenticated
using (user_id = auth.uid() or exists (select 1 from public.daily_plans dp where dp.id = plan_id and dp.creator_id = auth.uid()));

drop policy if exists plan_purchases_insert_own on public.plan_purchases;
create policy plan_purchases_insert_own on public.plan_purchases
for insert to authenticated with check (user_id = auth.uid());

drop policy if exists plan_reviews_public_read on public.plan_reviews;
create policy plan_reviews_public_read on public.plan_reviews
for select using (true);

drop policy if exists plan_reviews_write_own on public.plan_reviews;
create policy plan_reviews_write_own on public.plan_reviews
for all to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists vibe_reports_public_read on public.vibe_reports;
create policy vibe_reports_public_read on public.vibe_reports
for select using (expires_at > now());

drop policy if exists vibe_reports_write_auth on public.vibe_reports;
create policy vibe_reports_write_auth on public.vibe_reports
for insert to authenticated with check (user_id = auth.uid());

drop policy if exists creator_applications_rw_own on public.creator_applications;
create policy creator_applications_rw_own on public.creator_applications
for all to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop trigger if exists trg_daily_plans_updated_at on public.daily_plans;
create trigger trg_daily_plans_updated_at
before update on public.daily_plans
for each row execute function public.set_updated_at();

drop trigger if exists trg_plan_reviews_updated_at on public.plan_reviews;
create trigger trg_plan_reviews_updated_at
before update on public.plan_reviews
for each row execute function public.set_updated_at();

drop trigger if exists trg_creator_applications_updated_at on public.creator_applications;
create trigger trg_creator_applications_updated_at
before update on public.creator_applications
for each row execute function public.set_updated_at();

create or replace function public.calculate_creator_share(amount numeric)
returns numeric
language plpgsql
immutable
as $$
begin
  return round(amount * 0.70, 2);
end;
$$;

create or replace function public.purchase_daily_plan(
  p_user_id uuid,
  p_plan_id uuid,
  p_stripe_payment_id text default null
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_plan record;
  v_creator_share numeric;
  v_platform_share numeric;
begin
  select * into v_plan
  from public.daily_plans
  where id = p_plan_id and is_published = true;

  if not found then
    return jsonb_build_object('success', false, 'message', 'Piano non trovato o non pubblicato.');
  end if;

  if exists (
    select 1 from public.plan_purchases
    where user_id = p_user_id and plan_id = p_plan_id
  ) then
    return jsonb_build_object('success', false, 'message', 'Hai già acquistato questo piano.');
  end if;

  v_creator_share := public.calculate_creator_share(v_plan.price);
  v_platform_share := v_plan.price - v_creator_share;

  insert into public.plan_purchases (
    user_id, plan_id, amount_paid, creator_share, platform_share, stripe_payment_id
  ) values (
    p_user_id, p_plan_id, v_plan.price, v_creator_share, v_platform_share, p_stripe_payment_id
  );

  update public.daily_plans
  set purchases_count = coalesce(purchases_count, 0) + 1
  where id = p_plan_id;

  return jsonb_build_object('success', true, 'message', 'Acquisto completato.');
end;
$$;

-- ============================================================
-- market / vouchers / desideri
-- ============================================================

create table if not exists public.market_items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  short_description text,
  description text,
  category text not null default 'physical',
  image_url text,
  image_url_2 text,
  image_url_3 text,
  price_eur numeric(10,2),
  stock integer,
  payment_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.market_orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.utenti(id) on delete cascade,
  market_item_id uuid references public.market_items(id) on delete set null,
  status text not null default 'pagato',
  metodo text not null default 'stripe',
  prezzo_pagato numeric(10,2),
  payment_intent_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.market_purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.utenti(id) on delete set null,
  market_item_id uuid references public.market_items(id) on delete set null,
  payment_method text,
  price_desideri integer,
  price_eur numeric(10,2),
  created_at timestamptz not null default now()
);

create table if not exists public.partner_offers (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references public.partners(id) on delete cascade,
  title text not null,
  description text,
  desideri_cost integer not null default 0,
  stock integer,
  expires_days integer,
  usage_mode text not null default 'qr',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.vouchers (
  id uuid primary key default gen_random_uuid(),
  id_utente uuid not null references public.utenti(id) on delete cascade,
  offer_id uuid not null references public.partner_offers(id) on delete cascade,
  code text not null unique,
  qrcode_url text,
  expires_at timestamptz,
  status text not null default 'issued',
  verification_channel text not null default 'qr',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.desideri_movimenti (
  id uuid primary key default gen_random_uuid(),
  id_utente uuid not null references public.utenti(id) on delete cascade,
  amount integer not null,
  reason text not null,
  ref_type text,
  ref_id uuid,
  created_at timestamptz not null default now()
);

alter table public.market_items enable row level security;
alter table public.market_orders enable row level security;
alter table public.market_purchases enable row level security;
alter table public.partner_offers enable row level security;
alter table public.vouchers enable row level security;
alter table public.desideri_movimenti enable row level security;

drop policy if exists market_items_public_read on public.market_items;
create policy market_items_public_read on public.market_items
for select using (is_active = true);

drop policy if exists market_orders_rw_own on public.market_orders;
create policy market_orders_rw_own on public.market_orders
for all to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists market_purchases_read_auth on public.market_purchases;
create policy market_purchases_read_auth on public.market_purchases
for select to authenticated using (true);

drop policy if exists partner_offers_public_read on public.partner_offers;
create policy partner_offers_public_read on public.partner_offers
for select using (active = true);

drop policy if exists partner_offers_owner_write on public.partner_offers;
create policy partner_offers_owner_write on public.partner_offers
for all to authenticated
using (exists (select 1 from public.partners p where p.id = partner_id and p.owner_user_id = auth.uid()))
with check (exists (select 1 from public.partners p where p.id = partner_id and p.owner_user_id = auth.uid()));

drop policy if exists vouchers_rw_own on public.vouchers;
create policy vouchers_rw_own on public.vouchers
for all to authenticated
using (id_utente = auth.uid())
with check (id_utente = auth.uid());

drop policy if exists desideri_movimenti_rw_own on public.desideri_movimenti;
create policy desideri_movimenti_rw_own on public.desideri_movimenti
for all to authenticated
using (id_utente = auth.uid())
with check (id_utente = auth.uid());

drop trigger if exists trg_market_items_updated_at on public.market_items;
create trigger trg_market_items_updated_at
before update on public.market_items
for each row execute function public.set_updated_at();

drop trigger if exists trg_market_orders_updated_at on public.market_orders;
create trigger trg_market_orders_updated_at
before update on public.market_orders
for each row execute function public.set_updated_at();

drop trigger if exists trg_partner_offers_updated_at on public.partner_offers;
create trigger trg_partner_offers_updated_at
before update on public.partner_offers
for each row execute function public.set_updated_at();

drop trigger if exists trg_vouchers_updated_at on public.vouchers;
create trigger trg_vouchers_updated_at
before update on public.vouchers
for each row execute function public.set_updated_at();

create or replace function public.recalc_desideri_balance(u_id uuid)
returns integer
language plpgsql
security definer
as $$
declare
  v_total integer;
begin
  select coalesce(sum(amount), 0)
  into v_total
  from public.desideri_movimenti
  where id_utente = u_id;

  update public.utenti
  set desideri_balance = v_total
  where id = u_id;

  return v_total;
end;
$$;

-- ============================================================
-- now / saga helper tables
-- ============================================================

create table if not exists public.user_now_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.utenti(id) on delete cascade,
  answers jsonb not null default '{}'::jsonb,
  result_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.user_now_sessions enable row level security;

drop policy if exists user_now_sessions_rw_own on public.user_now_sessions;
create policy user_now_sessions_rw_own on public.user_now_sessions
for all to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- ============================================================
-- legacy BnB
-- ============================================================

create table if not exists public.bad_rooms (
  id uuid primary key default gen_random_uuid(),
  slug text unique,
  name text not null,
  max_guests integer not null default 2,
  base_price numeric(10,2) not null default 0,
  club_discount_percent numeric(5,2) not null default 0,
  description text,
  is_active boolean not null default true,
  main_photo_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.bad_room_photos (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.bad_rooms(id) on delete cascade,
  image_url text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.bad_room_blocks (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.bad_rooms(id) on delete cascade,
  start_date date not null,
  end_date date not null,
  reason text,
  created_at timestamptz not null default now()
);

create table if not exists public.bad_bookings (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.bad_rooms(id) on delete cascade,
  user_id uuid references public.utenti(id) on delete set null,
  check_in date not null,
  check_out date not null,
  guests integer not null default 1,
  status text not null default 'confirmed',
  source text,
  price_total numeric(10,2),
  pay_method text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.bad_rooms enable row level security;
alter table public.bad_room_photos enable row level security;
alter table public.bad_room_blocks enable row level security;
alter table public.bad_bookings enable row level security;

drop policy if exists bad_rooms_public_read on public.bad_rooms;
create policy bad_rooms_public_read on public.bad_rooms
for select using (is_active = true);

drop policy if exists bad_room_photos_public_read on public.bad_room_photos;
create policy bad_room_photos_public_read on public.bad_room_photos
for select using (true);

drop policy if exists bad_bookings_rw_own on public.bad_bookings;
create policy bad_bookings_rw_own on public.bad_bookings
for all to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop trigger if exists trg_bad_rooms_updated_at on public.bad_rooms;
create trigger trg_bad_rooms_updated_at
before update on public.bad_rooms
for each row execute function public.set_updated_at();

drop trigger if exists trg_bad_bookings_updated_at on public.bad_bookings;
create trigger trg_bad_bookings_updated_at
before update on public.bad_bookings
for each row execute function public.set_updated_at();

create or replace function public.bad_room_is_available(
  p_room_id uuid,
  p_check_in date,
  p_check_out date
)
returns boolean
language plpgsql
security definer
as $$
begin
  if exists (
    select 1
    from public.bad_room_blocks b
    where b.room_id = p_room_id
      and daterange(b.start_date, b.end_date, '[)') && daterange(p_check_in, p_check_out, '[)')
  ) then
    return false;
  end if;

  if exists (
    select 1
    from public.bad_bookings bb
    where bb.room_id = p_room_id
      and coalesce(bb.status, 'confirmed') <> 'cancelled'
      and daterange(bb.check_in, bb.check_out, '[)') && daterange(p_check_in, p_check_out, '[)')
  ) then
    return false;
  end if;

  return true;
end;
$$;

create or replace function public.bad_create_booking_with_desideri(
  p_user_id uuid,
  p_room_id uuid,
  p_check_in date,
  p_check_out date,
  p_guests integer
)
returns uuid
language plpgsql
security definer
as $$
declare
  v_room public.bad_rooms%rowtype;
  v_total numeric(10,2);
  v_nights integer;
  v_booking_id uuid;
begin
  select * into v_room from public.bad_rooms where id = p_room_id and is_active = true;
  if not found then
    raise exception 'Room not found';
  end if;

  if not public.bad_room_is_available(p_room_id, p_check_in, p_check_out) then
    raise exception 'Room not available';
  end if;

  v_nights := greatest(1, p_check_out - p_check_in);
  v_total := round((v_room.base_price * (1 - coalesce(v_room.club_discount_percent, 0) / 100.0)) * v_nights, 2);

  insert into public.bad_bookings (
    room_id, user_id, check_in, check_out, guests, status, source, price_total, pay_method
  ) values (
    p_room_id, p_user_id, p_check_in, p_check_out, p_guests, 'confirmed', 'app', v_total, 'desideri'
  ) returning id into v_booking_id;

  insert into public.desideri_movimenti (id_utente, amount, reason, ref_type, ref_id)
  values (p_user_id, -ceil(v_total)::integer, 'prenotazione_bad', 'bad_booking', v_booking_id);

  perform public.recalc_desideri_balance(p_user_id);

  return v_booking_id;
end;
$$;

-- ============================================================
-- RPC used by partner detail
-- ============================================================

create or replace function public.validate_pin_visit(
  p_user_id uuid,
  p_partner_id uuid,
  p_pin text
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_partner record;
  v_user record;
  v_last_visit timestamptz;
  v_punti_base integer := 100;
  v_moltiplicatore numeric(4,2) := 1.0;
  v_punti_effettivi integer := 100;
begin
  select * into v_partner
  from public.partners
  where id = p_partner_id and is_active = true;

  if not found then
    return jsonb_build_object('success', false, 'message', 'Partner non trovato o non attivo');
  end if;

  if coalesce(trim(v_partner.pin_code), '') = '' then
    return jsonb_build_object('success', false, 'message', 'PIN non configurato per questo partner');
  end if;

  if trim(v_partner.pin_code) <> trim(p_pin) then
    return jsonb_build_object('success', false, 'message', 'PIN errato');
  end if;

  select max(created_at) into v_last_visit
  from public.logs_transazioni
  where user_id = p_user_id
    and partner_id = p_partner_id
    and tipo = 'visita_pin';

  if v_last_visit is not null and v_last_visit > now() - interval '24 hours' then
    return jsonb_build_object('success', false, 'message', 'Hai già registrato una visita a questo partner nelle ultime 24 ore');
  end if;

  select * into v_user from public.utenti where id = p_user_id;

  if found and v_user.boost_expires_at is not null and v_user.boost_expires_at > now() then
    v_moltiplicatore := coalesce(v_user.boost_multiplier, 1.0);
  end if;

  v_punti_effettivi := floor(v_punti_base * v_moltiplicatore);

  update public.utenti
  set punti_totali = coalesce(punti_totali, 0) + v_punti_effettivi
  where id = p_user_id;

  if coalesce(v_partner.saldo_punti, 0) >= v_punti_base then
    update public.partners
    set saldo_punti = coalesce(saldo_punti, 0) - v_punti_base
    where id = p_partner_id;
  end if;

  insert into public.logs_transazioni (
    user_id, partner_id, tipo, punti, moltiplicatore, punti_effettivi, note
  ) values (
    p_user_id, p_partner_id, 'visita_pin', v_punti_base, v_moltiplicatore, v_punti_effettivi, 'Visita registrata tramite PIN'
  );

  return jsonb_build_object(
    'success', true,
    'punti_assegnati', v_punti_effettivi,
    'moltiplicatore', v_moltiplicatore,
    'message', 'Visita registrata con successo!'
  );
end;
$$;

-- ============================================================
-- storage buckets used by the app
-- ============================================================

insert into storage.buckets (id, name, public)
values
  ('avatars', 'avatars', true),
  ('proofs', 'proofs', true),
  ('partner_assets', 'partner_assets', true),
  ('partner-logos', 'partner-logos', true)
on conflict (id) do nothing;

drop policy if exists storage_public_read_avatars on storage.objects;
create policy storage_public_read_avatars on storage.objects
for select using (bucket_id in ('avatars', 'proofs', 'partner_assets', 'partner-logos'));

drop policy if exists storage_auth_write_avatars on storage.objects;
create policy storage_auth_write_avatars on storage.objects
for insert to authenticated
with check (bucket_id in ('avatars', 'proofs', 'partner_assets', 'partner-logos'));

drop policy if exists storage_auth_update_avatars on storage.objects;
create policy storage_auth_update_avatars on storage.objects
for update to authenticated
using (bucket_id in ('avatars', 'proofs', 'partner_assets', 'partner-logos'))
with check (bucket_id in ('avatars', 'proofs', 'partner_assets', 'partner-logos'));

