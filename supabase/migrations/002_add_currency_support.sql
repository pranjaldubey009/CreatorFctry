-- Migration 002: Add explicit INR / USD currency support to inquiries and packages
-- Safe to run on both existing and fresh Supabase PostgreSQL databases.

alter table public.inquiries
  add column if not exists currency text not null default 'USD';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'inquiries_currency_check'
  ) then
    alter table public.inquiries
      add constraint inquiries_currency_check check (currency in ('INR', 'USD'));
  end if;
end $$;

create index if not exists idx_inquiries_currency_created
  on public.inquiries (currency, created_at desc);

alter table public.packages
  add column if not exists currency text not null default 'USD';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'packages_currency_check'
  ) then
    alter table public.packages
      add constraint packages_currency_check check (currency in ('INR', 'USD'));
  end if;
end $$;
