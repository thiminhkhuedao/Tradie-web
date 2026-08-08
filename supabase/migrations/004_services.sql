-- ══════════════════════════════════════════════════════
-- Vimen — Services + booking request image support
-- Paste into: Supabase Dashboard → SQL Editor → Run
-- Depends on 001_schema.sql and 003_payments.sql already applied.
-- ══════════════════════════════════════════════════════

-- ── SERVICES ─────────────────────────────────────────
-- Services a professional offers on their public booking page,
-- each with an optional photo, price, and duration. Edited from
-- Settings → Booking page → Services, shown to visitors on
-- /b/:slug via PublicBookingPage.jsx.
create table if not exists services (
  id            uuid primary key default uuid_generate_v4(),
  profile_id    uuid not null references profiles(id) on delete cascade,
  name          text not null,
  description   text default '',
  price         numeric(10,2) not null default 0,
  duration_min  integer,
  image_url     text,
  active        boolean not null default true,
  sort_order    integer not null default 0,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);
create index if not exists services_profile_idx on services(profile_id);

alter table services enable row level security;

-- Owner: full access to their own services (create/edit/delete/toggle).
create policy "services_own" on services for all
  using (profile_id = my_profile_id());

-- Public: anyone (including anonymous visitors on the booking page)
-- can read ACTIVE services only — matches the .eq("active", true)
-- filter already used in PublicBookingPage.jsx.
create policy "services_public_read" on services
  for select using (active = true);

create trigger trg_services_updated before update on services
  for each row execute function set_updated_at();

-- ── BOOKING REQUESTS — new columns for service + client image ──
-- PublicBookingPage.jsx submits these fields; they didn't exist yet
-- on booking_requests, so inserts from the public page would have
-- failed (or silently dropped the extra data, depending on how
-- Postgres handles unknown insert keys — safer to add them properly).
alter table booking_requests
  add column if not exists service_id          uuid references services(id) on delete set null,
  add column if not exists client_image_url    text,
  add column if not exists client_instructions text,
  add column if not exists quoted_price        numeric(10,2);

-- ── STORAGE — booking-attachments bucket ────────────────
-- Used for both: (a) professionals uploading service photos from
-- Settings, and (b) clients uploading a reference image on the
-- public booking page (no login). Public bucket = anyone can view
-- an image by URL, matching how <img src={service.image_url}> and
-- the client's uploaded reference image are displayed.
insert into storage.buckets (id, name, public)
values ('booking-attachments', 'booking-attachments', true)
on conflict (id) do nothing;

-- Anyone can upload (needed for anonymous clients attaching a
-- reference image on the public page, and for logged-in
-- professionals uploading service photos — both go through the
-- same bucket).
create policy "booking_attachments_public_insert"
  on storage.objects for insert
  to anon, authenticated
  with check (bucket_id = 'booking-attachments');

-- Anyone can read (bucket is public — images need to display on the
-- public booking page and on the professional's own booking-page
-- settings, both without necessarily being authenticated).
create policy "booking_attachments_public_read"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'booking-attachments');

-- NOTE: this bucket intentionally allows anyone to upload/read —
-- there's no way to tell "this professional's own photo" from
-- "a client's reference image" at the storage-policy level given
-- the current path scheme (both just get a random filename). If you
-- want tighter control later (e.g. only the owning profile can
-- delete/replace their own service photos), consider prefixing
-- uploads with the profile_id in the storage path (e.g.
-- `services/{profile_id}/...`) and writing a policy that checks
-- storage.foldername(name) against my_profile_id().
