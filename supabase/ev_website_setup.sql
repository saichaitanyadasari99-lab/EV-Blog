-- ============================================
-- FULL SUPABASE SETUP
-- Run this in Supabase SQL Editor
-- ============================================

-- Enable extensions
create extension if not exists pgcrypto;

-- Create posts table with all required columns
DROP TABLE IF EXISTS public.posts;

CREATE TABLE public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid references auth.users(id),
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

-- Add unique constraint on slug
ALTER TABLE public.posts ADD CONSTRAINT posts_slug_key UNIQUE (slug);

-- Enable RLS
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for posts
DROP POLICY IF EXISTS "public_read_published" ON public.posts;
CREATE POLICY "public_read_published" ON public.posts 
FOR SELECT TO anon, authenticated 
USING (published = true);

DROP POLICY IF EXISTS "auth_all_posts" ON public.posts;
CREATE POLICY "auth_all_posts" ON public.posts 
FOR ALL TO authenticated 
USING (true) 
WITH CHECK (true);

-- Media storage
INSERT INTO storage.buckets (id, name, public)
VALUES ('media', 'media', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public media read" ON storage.objects;
CREATE POLICY "Public media read" ON storage.objects FOR SELECT USING (bucket_id = 'media');

DROP POLICY IF EXISTS "Authenticated media insert" ON storage.objects;
CREATE POLICY "Authenticated media insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'media' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated media update" ON storage.objects;
CREATE POLICY "Authenticated media update" ON storage.objects FOR UPDATE USING (bucket_id = 'media' AND auth.role() = 'authenticated') WITH CHECK (bucket_id = 'media' AND auth.role() = 'authenticated');

-- Newsletter
CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  email text not null unique,
  full_name text,
  source text,
  opted_in boolean not null default true
);

ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_insert" ON public.newsletter_subscribers;
CREATE POLICY "anon_insert" ON public.newsletter_subscribers FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "anon_read" ON public.newsletter_subscribers;
CREATE POLICY "anon_read" ON public.newsletter_subscribers FOR SELECT USING (true);

-- Contact
CREATE TABLE IF NOT EXISTS public.contact_submissions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  full_name text not null,
  email text not null,
  subject text not null,
  message text not null,
  intent text
);

ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_insert_contact" ON public.contact_submissions;
CREATE POLICY "anon_insert_contact" ON public.contact_submissions FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "auth_read_contact" ON public.contact_submissions;
CREATE POLICY "auth_read_contact" ON public.contact_submissions FOR SELECT USING (auth.role() = 'authenticated');

-- Trigger function
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE PLPGSQL AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Triggers
DROP TRIGGER IF EXISTS trg_posts_updated_at ON public.posts;
CREATE TRIGGER trg_posts_updated_at BEFORE UPDATE ON public.posts FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_newsletter_updated_at ON public.newsletter_subscribers;
CREATE TRIGGER trg_newsletter_updated_at BEFORE UPDATE ON public.newsletter_subscribers FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();