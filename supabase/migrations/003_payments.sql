-- ══════════════════════════════════════════════════════
-- TRADIE PAY — Payments Layer Schema
-- Run in Supabase SQL Editor AFTER 001_schema.sql
-- This is the revenue engine: 2% on every invoice paid
-- ══════════════════════════════════════════════════════

-- ── PAYMENT TRANSACTIONS ─────────────────────────────
-- Every payment processed through Tradie Pay
create table if not exists payment_transactions (
  id                    uuid primary key default uuid_generate_v4(),
  profile_id            uuid not null references profiles(id) on delete cascade,
  invoice_id            uuid references invoices(id) on delete set null,
  client_id             uuid references clients(id) on delete set null,

  -- Stripe identifiers
  stripe_payment_intent_id  text unique,
  stripe_charge_id          text,
  stripe_payment_link_id    text,

  -- Money (all in pence internally, displayed as pounds)
  gross_amount          numeric(12,2) not null,   -- what client paid, e.g. 550.00
  stripe_fee            numeric(12,2) not null,   -- Stripe's cut, e.g. 7.90 (1.4% + 20p)
  platform_fee          numeric(12,2) not null,   -- Tradie's 2%, e.g. 11.00
  net_amount            numeric(12,2) not null,   -- what tradesperson receives

  -- Status
  status                text not null default 'pending',
  -- pending → processing → completed → failed | refunded

  -- Payout reference (set when money is sent to tradesperson)
  payout_id             uuid,

  -- Metadata
  description           text default '',
  client_name           text default '',
  client_email          text default '',

  paid_at               timestamptz,
  created_at            timestamptz default now(),
  updated_at            timestamptz default now()
);

create index if not exists pt_profile_idx  on payment_transactions(profile_id);
create index if not exists pt_invoice_idx  on payment_transactions(invoice_id);
create index if not exists pt_status_idx   on payment_transactions(status);
create index if not exists pt_paid_at_idx  on payment_transactions(paid_at);

-- ── PAYOUTS ───────────────────────────────────────────
-- When Tradie sends accumulated earnings to the tradesperson's bank
create table if not exists payouts (
  id                    uuid primary key default uuid_generate_v4(),
  profile_id            uuid not null references profiles(id) on delete cascade,

  stripe_payout_id      text unique,
  amount                numeric(12,2) not null,   -- total paid out
  transaction_count     int not null default 0,   -- how many transactions included

  status                text not null default 'pending',
  -- pending → in_transit → paid | failed

  arrival_date          date,
  bank_last4            text,                     -- last 4 digits of destination account

  created_at            timestamptz default now(),
  updated_at            timestamptz default now()
);

create index if not exists po_profile_idx on payouts(profile_id);

-- Link transactions to their payout
alter table payment_transactions
  add constraint fk_payout foreign key (payout_id)
  references payouts(id) on delete set null;

-- ── PLATFORM REVENUE SUMMARY (materialised view) ──────
-- Used for the admin/founder dashboard to see total platform earnings
create or replace view platform_revenue_summary as
select
  date_trunc('month', paid_at) as month,
  count(*)                      as transaction_count,
  sum(gross_amount)             as gross_volume,
  sum(platform_fee)             as platform_revenue,
  sum(stripe_fee)               as stripe_fees,
  sum(net_amount)               as tradesperson_earnings,
  avg(gross_amount)             as avg_transaction_value
from payment_transactions
where status = 'completed'
group by 1
order by 1 desc;

-- ── ROW LEVEL SECURITY ────────────────────────────────
alter table payment_transactions enable row level security;
alter table payouts              enable row level security;

create policy "pt_own"     on payment_transactions for all using (profile_id = my_profile_id());
create policy "po_own"     on payouts              for all using (profile_id = my_profile_id());

-- ── HELPER: calculate Tradie Pay fees ─────────────────
-- gross_amount in pounds → returns {stripe_fee, platform_fee, net_amount}
create or replace function calculate_fees(gross_amount numeric)
returns table(stripe_fee numeric, platform_fee numeric, net_amount numeric)
language sql immutable as $$
  select
    round(gross_amount * 0.014 + 0.20, 2)  as stripe_fee,      -- 1.4% + 20p (UK Stripe rate)
    round(gross_amount * 0.020, 2)          as platform_fee,    -- Tradie's 2%
    round(gross_amount - (gross_amount * 0.014 + 0.20) - (gross_amount * 0.020), 2) as net_amount
$$;

-- ── AUTO updated_at ───────────────────────────────────
create trigger trg_pt_updated before update on payment_transactions
  for each row execute function set_updated_at();
create trigger trg_po_updated before update on payouts
  for each row execute function set_updated_at();

-- ══════════════════════════════════════════════════════
-- EXTENDED FEATURES — Quotes, Materials, Reviews,
-- Referrals, Certifications, Subcontractors
-- ══════════════════════════════════════════════════════

-- ── QUOTES ───────────────────────────────────────────
create table if not exists quotes (
  id               uuid primary key default uuid_generate_v4(),
  profile_id       uuid not null references profiles(id) on delete cascade,
  client_id        uuid references clients(id) on delete set null,
  quote_number     text not null,
  title            text not null,
  notes            text default '',
  status           text not null default 'draft',
  -- draft | sent | viewed | accepted | declined | converted
  valid_until      date,
  -- Line items stored as JSONB array:
  -- [{ description, quantity, unit_price, unit, type: 'labour'|'material'|'other' }]
  line_items       jsonb not null default '[]',
  subtotal         numeric(12,2) default 0,
  vat_rate         numeric(5,2)  default 0,
  vat_amount       numeric(12,2) default 0,
  total            numeric(12,2) default 0,
  margin_pct       numeric(5,2)  default 0,
  -- Client signature
  signed_at        timestamptz,
  signed_by        text default '',
  signature_ip     text default '',
  -- Converted to job
  job_id           uuid references jobs(id) on delete set null,
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);
create index if not exists quotes_profile_idx on quotes(profile_id);
create index if not exists quotes_status_idx  on quotes(status);

alter table quotes enable row level security;
create policy "quotes_own" on quotes for all using (profile_id = my_profile_id());

-- ── MATERIALS ORDERS ─────────────────────────────────
create table if not exists materials_orders (
  id             uuid primary key default uuid_generate_v4(),
  profile_id     uuid not null references profiles(id) on delete cascade,
  job_id         uuid references jobs(id) on delete set null,
  quote_id       uuid references quotes(id) on delete set null,
  order_number   text not null,
  supplier       text not null default '',
  -- Items: [{ name, sku, quantity, unit_price, total }]
  items          jsonb not null default '[]',
  subtotal       numeric(12,2) default 0,
  platform_margin numeric(12,2) default 0,  -- 5-12% Tradie margin
  total          numeric(12,2) default 0,
  status         text not null default 'pending',
  -- pending | confirmed | shipped | delivered | cancelled
  delivery_date  date,
  delivery_address text default '',
  created_at     timestamptz default now()
);
create index if not exists mo_profile_idx on materials_orders(profile_id);
alter table materials_orders enable row level security;
create policy "mo_own" on materials_orders for all using (profile_id = my_profile_id());

-- ── CERTIFICATIONS ────────────────────────────────────
create table if not exists certifications (
  id             uuid primary key default uuid_generate_v4(),
  profile_id     uuid not null references profiles(id) on delete cascade,
  name           text not null,      -- e.g. "18th Edition Wiring Regulations"
  issuing_body   text default '',    -- e.g. "NICEIC", "Gas Safe Register"
  cert_number    text default '',
  issued_date    date,
  expiry_date    date,
  status         text not null default 'active', -- active | expired | pending_renewal
  document_url   text default '',
  created_at     timestamptz default now()
);
create index if not exists cert_profile_idx on certifications(profile_id);
alter table certifications enable row level security;
create policy "certs_own" on certifications for all using (profile_id = my_profile_id());

-- Public: homeowners can view certifications of a contractor via their slug
create policy "certs_public_read" on certifications
  for select using (
    profile_id in (select id from profiles where booking_slug is not null)
    and status = 'active'
  );

-- ── REVIEWS ───────────────────────────────────────────
create table if not exists reviews (
  id              uuid primary key default uuid_generate_v4(),
  profile_id      uuid not null references profiles(id) on delete cascade,
  job_id          uuid references jobs(id) on delete set null,
  client_id       uuid references clients(id) on delete set null,
  client_name     text not null,
  client_email    text default '',
  rating          int not null check (rating >= 1 and rating <= 5),
  title           text default '',
  body            text default '',
  -- Verification
  verified        boolean default false,
  verification_token text unique,
  -- Google review redirect
  google_review_url text default '',
  google_review_clicked boolean default false,
  created_at      timestamptz default now()
);
create index if not exists rev_profile_idx on reviews(profile_id);
alter table reviews enable row level security;
create policy "reviews_own"    on reviews for all    using (profile_id = my_profile_id());
create policy "reviews_public" on reviews for select using (verified = true);
create policy "reviews_insert" on reviews for insert with check (true);

-- ── REFERRALS ─────────────────────────────────────────
create table if not exists referrals (
  id                uuid primary key default uuid_generate_v4(),
  referrer_id       uuid not null references profiles(id) on delete cascade,
  referral_code     text unique not null,
  referred_email    text default '',
  referred_name     text default '',
  referred_profile_id uuid references profiles(id) on delete set null,
  status            text not null default 'pending',
  -- pending | signed_up | qualified | rewarded
  reward_months     int default 2,   -- months of free Pro given to referrer
  rewarded_at       timestamptz,
  created_at        timestamptz default now()
);
create index if not exists ref_referrer_idx on referrals(referrer_id);
alter table referrals enable row level security;
create policy "ref_own" on referrals for all using (referrer_id = my_profile_id());

-- ── REVIEW REQUEST TRACKING ───────────────────────────
-- Tracks when review request SMS/emails were sent
create table if not exists review_requests (
  id          uuid primary key default uuid_generate_v4(),
  profile_id  uuid not null references profiles(id) on delete cascade,
  job_id      uuid references jobs(id) on delete set null,
  client_id   uuid references clients(id) on delete set null,
  client_name text default '',
  client_phone text default '',
  client_email text default '',
  sent_at     timestamptz default now(),
  opened_at   timestamptz,
  review_id   uuid references reviews(id) on delete set null,
  status      text not null default 'sent' -- sent | opened | reviewed | skipped
);
alter table review_requests enable row level security;
create policy "rr_own" on review_requests for all using (profile_id = my_profile_id());

-- Auto update triggers
create trigger trg_quotes_updated before update on quotes
  for each row execute function set_updated_at();

-- ══════════════════════════════════════════════════════
-- VERTICAL-SPECIFIC PROFILE FIELDS
-- Stores extra fields that differ by profession vertical:
--   trades       → insurance_provider, insurance_amount, vat_registered
--   beauty       → service_menu (array), instagram_handle
--   professional → bar_number, professional_body, gdpr_accepted
-- Stored as a single flexible JSONB blob rather than one column per
-- possible field, since the field set differs per vertical and may
-- grow over time without needing further migrations.
-- ══════════════════════════════════════════════════════
alter table profiles
  add column if not exists extra_fields jsonb not null default '{}';

-- ══════════════════════════════════════════════════════
-- PUBLIC BOOKING PAGE — anonymous read access
-- The booking page at /b/:slug must work for visitors who are
-- NOT logged in. RLS is row-level only (no column masking), so
-- rather than relax the main "profiles_own" policy — which would
-- expose bank details, invoice notes, and email to anyone — we
-- expose a narrow public VIEW containing only booking-page-safe
-- columns, and grant SELECT on that view to the anon role.
-- ══════════════════════════════════════════════════════
create or replace view public_profiles as
  select id, name, trade, bio, hourly_rate, booking_slug, extra_fields
  from profiles
  where booking_slug is not null;

grant select on public_profiles to anon, authenticated;
