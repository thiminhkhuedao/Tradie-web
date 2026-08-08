-- ══════════════════════════════════════════════════════
-- Vimen MARKETPLACE — Schema Extension
-- Paste this into Supabase SQL Editor AFTER 001_schema.sql
-- ══════════════════════════════════════════════════════

-- ── MARKETPLACE LISTINGS ─────────────────────────────
-- Three types of posts in one table:
--   'demand'     → buyer wants a tradesperson / service
--   'sale'       → shop / business / fonds de commerce for sale
--   'recruitment'→ company looking for workers / subcontractors

create table if not exists marketplace_listings (
  id           uuid primary key default uuid_generate_v4(),
  profile_id   uuid references profiles(id) on delete set null,

  -- Type of listing
  type         text not null check (type in ('demand','sale','recruitment')),

  -- Core fields
  title        text not null,
  description  text not null,
  trade        text not null default '',     -- e.g. "Electrician", "Plumber", "All trades"
  location     text not null default '',     -- e.g. "Rouen (76)", "Normandie"
  budget       numeric(12,2),               -- for demand: max budget; for sale: asking price
  budget_label text default '',             -- e.g. "€", "negotiable", "on request"
  urgent       boolean default false,

  -- Demand-specific
  work_start_date date,

  -- Sale-specific
  business_type  text default '',           -- e.g. "electrical firm", "plumbing shop"
  annual_revenue numeric(12,2),
  employees      int,

  -- Recruitment-specific
  contract_type  text default '',           -- CDI, CDD, subcontracting, interim
  experience_req text default '',           -- e.g. "2+ years"
  salary_range   text default '',

  -- Contact
  contact_name   text not null default '',
  contact_email  text not null default '',
  contact_phone  text default '',
  contact_method text default 'both',       -- 'email' | 'phone' | 'both'

  -- Meta
  status         text not null default 'active', -- 'active' | 'closed' | 'paused'
  views          int not null default 0,
  created_at     timestamptz default now(),
  updated_at     timestamptz default now(),
  expires_at     timestamptz default (now() + interval '60 days')
);

create index if not exists mkt_type_idx      on marketplace_listings(type);
create index if not exists mkt_trade_idx     on marketplace_listings(trade);
create index if not exists mkt_location_idx  on marketplace_listings(location);
create index if not exists mkt_status_idx    on marketplace_listings(status);
create index if not exists mkt_profile_idx   on marketplace_listings(profile_id);

-- ── MARKETPLACE INTERESTS ─────────────────────────────
-- Tracks when someone clicks "I'm interested" on a listing.
-- Creates a lead without exposing full contact details publicly.

create table if not exists marketplace_interests (
  id           uuid primary key default uuid_generate_v4(),
  listing_id   uuid not null references marketplace_listings(id) on delete cascade,
  profile_id   uuid references profiles(id) on delete set null,
  -- For non-registered users expressing interest
  name         text default '',
  email        text default '',
  phone        text default '',
  message      text default '',
  created_at   timestamptz default now()
);

create index if not exists mkt_interest_listing_idx on marketplace_interests(listing_id);

-- ── ROW LEVEL SECURITY ────────────────────────────────

alter table marketplace_listings  enable row level security;
alter table marketplace_interests enable row level security;

-- Listings: anyone can read active listings
create policy "mkt_listings_public_read" on marketplace_listings
  for select using (status = 'active');

-- Listings: logged-in users can insert
create policy "mkt_listings_auth_insert" on marketplace_listings
  for insert with check (true);

-- Listings: owner can update/delete their own
create policy "mkt_listings_owner_update" on marketplace_listings
  for update using (profile_id = my_profile_id());

create policy "mkt_listings_owner_delete" on marketplace_listings
  for delete using (profile_id = my_profile_id());

-- Interests: listing owner can read interests on their listings
create policy "mkt_interests_owner_read" on marketplace_interests
  for select using (
    listing_id in (
      select id from marketplace_listings where profile_id = my_profile_id()
    )
  );

-- Interests: anyone can insert (express interest)
create policy "mkt_interests_public_insert" on marketplace_interests
  for insert with check (true);

-- ── AUTO updated_at ───────────────────────────────────
create trigger trg_mkt_listings_updated before update on marketplace_listings
  for each row execute function set_updated_at();

-- ── AUTO increment views ──────────────────────────────
-- Call this function when a listing is viewed
create or replace function increment_listing_views(listing_id uuid)
returns void language sql as $$
  update marketplace_listings set views = views + 1 where id = listing_id;
$$;
