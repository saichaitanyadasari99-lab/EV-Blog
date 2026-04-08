-- ============================================
-- SIMPLE SUPABASE SETUP (No problematic indexes)
-- Run this in Supabase SQL Editor
-- ============================================

-- Drop existing table completely
DROP TABLE IF EXISTS public.posts CASCADE;

-- Create simple table
CREATE TABLE public.posts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  author_id uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  title text NOT NULL,
  slug text NOT NULL,
  content jsonb,
  excerpt text,
  cover_url text,
  category text,
  tags text[],
  published boolean DEFAULT false,
  reading_time int
);

-- Add simple unique index on slug only
CREATE UNIQUE INDEX posts_slug_unique ON public.posts (slug);

-- Enable RLS
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

-- RLS policies
DROP POLICY IF EXISTS "public_read_published" ON public.posts;
CREATE POLICY "public_read_published" ON public.posts 
FOR SELECT USING (published = true);

DROP POLICY IF EXISTS "auth_all_posts" ON public.posts;
CREATE POLICY "auth_all_posts" ON public.posts 
FOR ALL USING (auth.role() = 'authenticated') 
WITH CHECK (auth.role() = 'authenticated');