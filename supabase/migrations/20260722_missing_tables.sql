-- Recreates tables/buckets referenced throughout the codebase that are
-- missing from the Supabase project. The 20260604_analysis_orders.sql
-- migration was never actually applied to this project either, so it's
-- recreated here (idempotently) before analyses references it.

-- ============================================================
-- analysis_orders — same shape as supabase/migrations/20260604_analysis_orders.sql
-- ============================================================
create table if not exists analysis_orders (
  id              uuid primary key default gen_random_uuid(),
  email           text not null,
  analysis_result jsonb,
  invoice_id      text,
  transaction_id  text unique,
  amount          int  not null,
  paid            boolean not null default false,
  paid_at         timestamp with time zone,
  created_at      timestamp with time zone default now()
);

create index if not exists analysis_orders_invoice_id_idx on analysis_orders (invoice_id);
create index if not exists analysis_orders_email_idx      on analysis_orders (email);

-- ============================================================
-- analyses — result of client-side face analysis (see app/api/analyze/route.ts)
-- ============================================================
create table if not exists analyses (
  id                  uuid primary key default gen_random_uuid(),
  email               text not null,
  image_path          text,
  season              text not null,
  sub_type            text not null,
  reasoning           text,
  recommended_colors  jsonb,
  email_sent          boolean not null default false,
  paid                boolean not null default false,
  order_id            uuid references analysis_orders (id),
  created_at          timestamp with time zone not null default now()
);

create index if not exists analyses_email_idx            on analyses (email);
create index if not exists analyses_email_sub_type_idx    on analyses (email, sub_type);
create index if not exists analyses_created_at_idx        on analyses (created_at desc);

-- ============================================================
-- app_config — generic key/value store (currently only the Bonum PSP
-- access token, see lib/bonum.ts)
-- ============================================================
create table if not exists app_config (
  key         text primary key,
  value       text,
  updated_at  timestamp with time zone default now()
);

-- ============================================================
-- verification_codes — 6-digit email OTP for order tracking
-- (see app/api/verify/send-code, app/api/verify/check-code)
-- ============================================================
create table if not exists verification_codes (
  id          uuid primary key default gen_random_uuid(),
  email       text not null,
  code        text not null,
  expires_at  timestamp with time zone not null,
  used        boolean not null default false,
  created_at  timestamp with time zone not null default now()
);

create index if not exists verification_codes_email_created_idx
  on verification_codes (email, created_at);

-- ============================================================
-- sessions — short-lived token issued after OTP verification
-- (see app/api/verify/check-code, app/api/verify/results-by-token)
-- ============================================================
create table if not exists sessions (
  id          uuid primary key default gen_random_uuid(),
  token       uuid not null unique,
  email       text not null,
  expires_at  timestamp with time zone not null,
  created_at  timestamp with time zone not null default now()
);

-- ============================================================
-- user_analyses — legacy/alternate analyses table used as a fallback
-- lookup in app/api/verify/resend-result/route.ts. Given the same shape
-- as `analyses` for forward-compatibility.
-- ============================================================
create table if not exists user_analyses (
  id                  uuid primary key default gen_random_uuid(),
  email               text not null,
  image_path          text,
  season              text not null,
  sub_type            text not null,
  reasoning           text,
  recommended_colors  jsonb,
  email_sent          boolean not null default false,
  paid                boolean not null default false,
  created_at          timestamp with time zone not null default now()
);

create index if not exists user_analyses_email_idx on user_analyses (email);

-- ============================================================
-- analysis_orders — columns referenced in admin/dashboard routes that
-- are missing from the original 20260604 migration
-- ============================================================
alter table analysis_orders
  add column if not exists admin_confirmed    boolean default false,
  add column if not exists email_sent_at      timestamp with time zone,
  add column if not exists pdf_downloaded_at  timestamp with time zone;

-- ============================================================
-- Row Level Security — every read/write in the app goes through the
-- service-role client (lib/supabase-admin.ts), which bypasses RLS, so
-- these tables are locked down from direct anon/authenticated access.
-- ============================================================
alter table analyses            enable row level security;
alter table app_config          enable row level security;
alter table verification_codes  enable row level security;
alter table sessions            enable row level security;
alter table user_analyses       enable row level security;

-- ============================================================
-- Storage buckets — portraits (client-uploaded selfies) and reports
-- (generated PDF reports). Both are read via getPublicUrl() and emailed
-- directly to customers, so both must be public.
-- ============================================================
insert into storage.buckets (id, name, public)
values ('portraits', 'portraits', true)
on conflict (id) do update set public = true;

insert into storage.buckets (id, name, public)
values ('reports', 'reports', true)
on conflict (id) do update set public = true;

-- Card.tsx uploads directly from the browser using the anon key, so the
-- anon role needs INSERT on the portraits bucket. Reads for both public
-- buckets are handled by Supabase's public-bucket bypass, but an explicit
-- select policy is added too for clarity/defense-in-depth.
drop policy if exists "Public can upload portraits" on storage.objects;
create policy "Public can upload portraits"
  on storage.objects for insert
  to anon
  with check (bucket_id = 'portraits');

drop policy if exists "Public can read portraits" on storage.objects;
create policy "Public can read portraits"
  on storage.objects for select
  to public
  using (bucket_id = 'portraits');

drop policy if exists "Public can read reports" on storage.objects;
create policy "Public can read reports"
  on storage.objects for select
  to public
  using (bucket_id = 'reports');
