-- ============================================
-- MINIMAL SUPABASE SETUP (No indexes on content)
-- Run this in Supabase SQL Editor
-- ============================================

-- Drop existing table
DROP TABLE IF EXISTS public.posts CASCADE;

-- Create table WITHOUT any constraints that might index content
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

-- Add unique constraint on slug (using INDEX to avoid unique constraint on table)
CREATE UNIQUE INDEX posts_slug_idx ON public.posts (slug) WHERE slug IS NOT NULL;

-- Disable RLS temporarily
ALTER TABLE public.posts DISABLE ROW LEVEL SECURITY;

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

-- Test it
SELECT 'Posts table created successfully' as result;