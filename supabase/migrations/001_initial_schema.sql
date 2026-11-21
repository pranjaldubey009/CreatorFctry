-- CreatorFctry Supabase PostgreSQL Schema & Security Migration
-- Run this migration in your Supabase SQL Editor or via Supabase CLI.

create extension if not exists "pgcrypto";

-- 1. Admin Users (maps Supabase Auth users to studio admin privileges)
create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  role text not null default 'admin' check (role in ('admin', 'owner')),
  created_at timestamptz not null default now()
);

-- 2. Projects / Portfolio
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 2 and 160),
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  category text not null check (category in ('LinkedIn', 'UGC', 'Reels', 'Carousels', 'Thumbnails')),
  short_summary text not null default '',
  description text not null default '',
  image_url text not null default '',
  tags text[] not null default '{}',
  external_url text default '',
  is_concept boolean not null default true,
  is_published boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_projects_published_category on public.projects (is_published, category, sort_order);
create index if not exists idx_projects_slug on public.projects (slug);

-- 3. Services
create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  number_label text not null,
  title text not null,
  slug text not null unique,
  short_label text not null,
  description text not null,
  deliverables text[] not null default '{}',
  mockup_type text not null default 'linkedin' check (mockup_type in ('linkedin', 'ugc', 'reels', 'carousels', 'thumbnails')),
  is_published boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_services_published_order on public.services (is_published, sort_order);

-- 4. Packages
create table if not exists public.packages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  tagline text not null default '',
  currency text not null default 'USD' check (currency in ('INR', 'USD')),
  price_display text not null,
  billing_type text not null default 'Monthly',
  description text not null default '',
  features text[] not null default '{}',
  deliverables_count text not null default '',
  revisions_count text not null default '',
  cta_label text not null default 'GET A CUSTOM QUOTE',
  is_featured boolean not null default false,
  is_published boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_packages_published_order on public.packages (is_published, sort_order);

-- 5. Inquiries
create table if not exists public.inquiries (
  id uuid primary key default gen_random_uuid(),
  full_name text not null check (char_length(full_name) between 2 and 120),
  email text not null check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  brand_name text not null default '',
  service_required text not null,
  currency text not null default 'USD' check (currency in ('INR', 'USD')),
  budget_range text not null,
  project_details text not null check (char_length(project_details) between 10 and 4000),
  status text not null default 'new' check (status in ('new', 'contacted', 'in_progress', 'completed', 'archived')),
  admin_notes text not null default '',
  source_ip_hash text default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_inquiries_status_created on public.inquiries (status, created_at desc);
create index if not exists idx_inquiries_currency_created on public.inquiries (currency, created_at desc);

-- 6. Testimonials
create table if not exists public.testimonials (
  id uuid primary key default gen_random_uuid(),
  author_name text not null,
  author_role text not null default '',
  company text not null default '',
  quote text not null,
  is_published boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 7. Site Settings (Singleton row id = 1)
create table if not exists public.site_settings (
  id integer primary key default 1 check (id = 1),
  brand_name text not null default 'CREATORFCTRY',
  tagline text not null default 'One Factory. Every Format.',
  contact_email text not null default 'creatorfctry@gmail.com',
  instagram_handle text not null default '@creatorfctry',
  instagram_url text not null default 'https://instagram.com/creatorfctry',
  social_links jsonb not null default '[]'::jsonb,
  about_headline text not null default 'A SMALL STUDIO. BIG CREATIVE ENERGY.',
  about_body text not null default 'CreatorFctry is a creative content studio focused on helping brands, founders and creators show up with better content. We bring multiple content formats together under one creative direction — making content creation simpler, more consistent and more impactful.',
  hero_kicker text not null default 'CONTENT & CREATOR GROWTH STUDIO',
  hero_headline_line1 text not null default 'ONE FACTORY.',
  hero_headline_line2 text not null default 'EVERY FORMAT.',
  hero_subheadline text not null default 'We turn ideas into content that makes brands, founders and creators stand out.',
  budget_options jsonb not null default '["Under $1,000","$1,000 – $2,500","$2,500 – $5,000","$5,000+","Custom / Let''s Discuss"]'::jsonb,
  updated_at timestamptz not null default now()
);

-- Updated_at trigger
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_projects_updated on public.projects;
create trigger trg_projects_updated before update on public.projects for each row execute function public.set_updated_at();

drop trigger if exists trg_services_updated on public.services;
create trigger trg_services_updated before update on public.services for each row execute function public.set_updated_at();

drop trigger if exists trg_packages_updated on public.packages;
create trigger trg_packages_updated before update on public.packages for each row execute function public.set_updated_at();

drop trigger if exists trg_inquiries_updated on public.inquiries;
create trigger trg_inquiries_updated before update on public.inquiries for each row execute function public.set_updated_at();

drop trigger if exists trg_testimonials_updated on public.testimonials;
create trigger trg_testimonials_updated before update on public.testimonials for each row execute function public.set_updated_at();

drop trigger if exists trg_settings_updated on public.site_settings;
create trigger trg_settings_updated before update on public.site_settings for each row execute function public.set_updated_at();

-- Helper function for RLS admin check
create or replace function public.is_studio_admin()
returns boolean as $$
  select exists (
    select 1 from public.admin_users where user_id = auth.uid()
  );
$$ language sql security definer stable;

-- Enable Row Level Security on all tables
alter table public.admin_users enable row level security;
alter table public.projects enable row level security;
alter table public.services enable row level security;
alter table public.packages enable row level security;
alter table public.inquiries enable row level security;
alter table public.testimonials enable row level security;
alter table public.site_settings enable row level security;

-- Admin Users RLS
create policy "Admins can view admin_users" on public.admin_users for select to authenticated using (public.is_studio_admin());

-- Projects RLS
create policy "Public can view published projects" on public.projects for select to anon, authenticated using (is_published = true);
create policy "Admins manage all projects" on public.projects for all to authenticated using (public.is_studio_admin()) with check (public.is_studio_admin());

-- Services RLS
create policy "Public can view published services" on public.services for select to anon, authenticated using (is_published = true);
create policy "Admins manage all services" on public.services for all to authenticated using (public.is_studio_admin()) with check (public.is_studio_admin());

-- Packages RLS
create policy "Public can view published packages" on public.packages for select to anon, authenticated using (is_published = true);
create policy "Admins manage all packages" on public.packages for all to authenticated using (public.is_studio_admin()) with check (public.is_studio_admin());

-- Testimonials RLS
create policy "Public can view published testimonials" on public.testimonials for select to anon, authenticated using (is_published = true);
create policy "Admins manage all testimonials" on public.testimonials for all to authenticated using (public.is_studio_admin()) with check (public.is_studio_admin());

-- Site Settings RLS
create policy "Public can read site settings" on public.site_settings for select to anon, authenticated using (true);
create policy "Admins update site settings" on public.site_settings for all to authenticated using (public.is_studio_admin()) with check (public.is_studio_admin());

-- Inquiries RLS (public can insert only; only admins can read/update/delete)
create policy "Public can submit inquiries" on public.inquiries for insert to anon, authenticated with check (status = 'new');
create policy "Admins manage inquiries" on public.inquiries for select to authenticated using (public.is_studio_admin());
create policy "Admins update inquiries" on public.inquiries for update to authenticated using (public.is_studio_admin()) with check (public.is_studio_admin());
create policy "Admins delete inquiries" on public.inquiries for delete to authenticated using (public.is_studio_admin());

-- Storage bucket for portfolio assets
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('portfolio-assets', 'portfolio-assets', true, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
on conflict (id) do nothing;

create policy "Public read portfolio assets" on storage.objects for select to public using (bucket_id = 'portfolio-assets');
create policy "Admins upload portfolio assets" on storage.objects for insert to authenticated with check (bucket_id = 'portfolio-assets' and public.is_studio_admin());
create policy "Admins delete portfolio assets" on storage.objects for delete to authenticated using (bucket_id = 'portfolio-assets' and public.is_studio_admin());

-- Seed default site settings row
insert into public.site_settings (id) values (1) on conflict (id) do nothing;
