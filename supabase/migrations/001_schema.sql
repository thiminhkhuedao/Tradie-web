-- ══════════════════════════════════════════════════════
-- Vimen — Supabase Schema
-- Paste into: Supabase Dashboard → SQL Editor → Run
-- ══════════════════════════════════════════════════════

create extension if not exists "uuid-ossp";

-- ── PROFILES ─────────────────────────────────────────
create table if not exists profiles (
  id               uuid primary key default uuid_generate_v4(),
  clerk_id         text unique not null,
  name             text    not null default '',
  trade            text    not null default '',
  email            text    not null default '',
  phone            text    not null default '',
  bio              text    not null default '',
  hourly_rate      numeric(10,2) not null default 0,
  bank_name        text default '',
  sort_code        text default '',
  account_number   text default '',
  payment_terms    text default '14 days',
  invoice_notes    text default '',
  booking_slug     text unique,
  stripe_customer_id text,
  plan             text not null default 'free',
  notif_email_booking   boolean default true,
  notif_sms_paid        boolean default false,
  notif_weekly_digest   boolean default true,
  notif_overdue_reminder boolean default true,
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);

-- ── CLIENTS ──────────────────────────────────────────
create table if not exists clients (
  id          uuid primary key default uuid_generate_v4(),
  profile_id  uuid not null references profiles(id) on delete cascade,
  name        text not null,
  email       text default '',
  phone       text default '',
  address     text default '',
  notes       text default '',
  created_at  timestamptz default now()
);
create index if not exists clients_profile_idx on clients(profile_id);

-- ── JOBS ─────────────────────────────────────────────
create table if not exists jobs (
  id          uuid primary key default uuid_generate_v4(),
  profile_id  uuid not null references profiles(id) on delete cascade,
  client_id   uuid references clients(id) on delete set null,
  title       text not null,
  notes       text default '',
  date        date not null,
  time        text default '09:00',
  duration    numeric(5,2) default 1,
  amount      numeric(10,2) default 0,
  status      text not null default 'scheduled',
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);
create index if not exists jobs_profile_idx on jobs(profile_id);
create index if not exists jobs_status_idx  on jobs(status);

-- ── INVOICES ─────────────────────────────────────────
create table if not exists invoices (
  id                      uuid primary key default uuid_generate_v4(),
  profile_id              uuid not null references profiles(id) on delete cascade,
  client_id               uuid references clients(id) on delete set null,
  job_id                  uuid references jobs(id) on delete set null,
  invoice_number          text not null,
  amount                  numeric(10,2) not null,
  status                  text not null default 'unpaid',
  due_date                date,
  paid_at                 timestamptz,
  stripe_payment_link_id  text,
  stripe_payment_link_url text,
  created_at              timestamptz default now(),
  updated_at              timestamptz default now()
);
create index if not exists invoices_profile_idx on invoices(profile_id);

-- ── BOOKING REQUESTS ─────────────────────────────────
create table if not exists booking_requests (
  id              uuid primary key default uuid_generate_v4(),
  profile_id      uuid not null references profiles(id) on delete cascade,
  customer_name   text not null,
  customer_email  text default '',
  customer_phone  text default '',
  preferred_date  date,
  notes           text default '',
  status          text not null default 'pending',
  created_at      timestamptz default now()
);
create index if not exists bookings_profile_idx on booking_requests(profile_id);

-- ── ROW LEVEL SECURITY ────────────────────────────────
alter table profiles         enable row level security;
alter table clients          enable row level security;
alter table jobs             enable row level security;
alter table invoices         enable row level security;
alter table booking_requests enable row level security;

-- Helper: extract clerk_id from JWT sub claim
create or replace function my_clerk_id() returns text
  language sql stable as $$ select auth.jwt() ->> 'sub' $$;

create or replace function my_profile_id() returns uuid
  language sql stable as $$
    select id from profiles where clerk_id = my_clerk_id()
  $$;

-- Profiles: own row only
create policy "profiles_own" on profiles for all
  using (clerk_id = my_clerk_id());

-- Clients, jobs, invoices: own data only
create policy "clients_own"  on clients  for all using (profile_id = my_profile_id());
create policy "jobs_own"     on jobs     for all using (profile_id = my_profile_id());
create policy "invoices_own" on invoices for all using (profile_id = my_profile_id());

-- Booking requests: owner reads, public inserts
create policy "bookings_owner_read" on booking_requests
  for select using (profile_id = my_profile_id());
create policy "bookings_public_insert" on booking_requests
  for insert with check (true);

-- ── AUTO updated_at ───────────────────────────────────
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

create trigger trg_profiles_updated  before update on profiles  for each row execute function set_updated_at();
create trigger trg_jobs_updated      before update on jobs      for each row execute function set_updated_at();
create trigger trg_invoices_updated  before update on invoices  for each row execute function set_updated_at();
