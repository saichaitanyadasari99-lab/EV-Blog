-- ============================================
-- VOLTPULSE SUPABASE SETUP
-- Run this in Supabase SQL Editor
-- ============================================

-- Enable UUID extension
create extension if not exists pgcrypto;

-- Drop any existing posts table to start fresh (backup data first if needed)
DROP TABLE IF EXISTS public.posts;

-- Posts table - NO INDEX on content column to avoid size issues
create table public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid references auth.users(id) default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  title text not null,
  slug text not null,
  content jsonb,
  excerpt text,
  cover_url text,
  category text,
  tags text[],
  published boolean not null default false,
  reading_time int
);

-- Add unique constraint on slug separately (not during table creation)
alter table public.posts add constraint posts_slug_key unique (slug);

-- Media storage bucket
insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do nothing;

-- Storage policies
drop policy if exists "Public media read" on storage.objects;
create policy "Public media read" on storage.objects for select using (bucket_id = 'media');

drop policy if exists "Authenticated media insert" on storage.objects;
create policy "Authenticated media insert" on storage.objects for insert with check (bucket_id = 'media' and auth.role() = 'authenticated');

drop policy if exists "Authenticated media update" on storage.objects;
create policy "Authenticated media update" on storage.objects for update using (bucket_id = 'media' and auth.role() = 'authenticated') with check (bucket_id = 'media' and auth.role() = 'authenticated');

drop policy if exists "Authenticated media delete" on storage.objects;
create policy "Authenticated media delete" on storage.objects for delete using (bucket_id = 'media' and auth.role() = 'authenticated');

-- ============================================
-- NEWSLETTER SUBSCRIBERS
-- ============================================

create table if not exists public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  email text not null unique,
  full_name text,
  source text,
  opted_in boolean not null default true
);

-- DISABLE RLS TEMPORARILY FOR TESTING
alter table public.newsletter_subscribers disable row level security;

-- Re-enable RLS with permissive policies
alter table public.newsletter_subscribers enable row level security;

-- Allow all inserts
drop policy if exists "anon_insert" on public.newsletter_subscribers;
create policy "anon_insert" on public.newsletter_subscribers for insert with check (true);

-- Allow all reads
drop policy if exists "anon_read" on public.newsletter_subscribers;
create policy "anon_read" on public.newsletter_subscribers for select using (true);

-- Allow all updates
drop policy if exists "anon_update" on public.newsletter_subscribers;
create policy "anon_update" on public.newsletter_subscribers for update using (true) with check (true);

-- ============================================
-- CONTACT SUBMISSIONS
-- ============================================

create table if not exists public.contact_submissions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  full_name text not null,
  email text not null,
  subject text not null,
  message text not null,
  intent text
);

-- Disable RLS
alter table public.contact_submissions disable row level security;

-- Re-enable with permissive policies
alter table public.contact_submissions enable row level security;

drop policy if exists "anon_insert_contact" on public.contact_submissions;
create policy "anon_insert_contact" on public.contact_submissions for insert with check (true);

drop policy if exists "auth_read_contact" on public.contact_submissions;
create policy "auth_read_contact" on public.contact_submissions for select using (auth.role() = 'authenticated');

-- ============================================
-- POSTS RLS
-- ============================================

alter table public.posts enable row level security;

-- Anyone can read published posts
drop policy if exists "public_read_published" on public.posts;
create policy "public_read_published" on public.posts for select using (published = true);

-- Authenticated users can manage posts
drop policy if exists "auth_all_posts" on public.posts;
create policy "auth_all_posts" on public.posts for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- ============================================
-- TRIGGERS
-- ============================================

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_posts_updated_at on public.posts;
create trigger trg_posts_updated_at before update on public.posts for each row execute function public.set_updated_at();

drop trigger if exists trg_newsletter_updated_at on public.newsletter_subscribers;
create trigger trg_newsletter_updated_at before update on public.newsletter_subscribers for each row execute function public.set_updated_at();