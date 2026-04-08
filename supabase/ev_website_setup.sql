-- ============================================
-- FIX RLS FOR PUBLIC ACCESS
-- Run this in Supabase SQL Editor
-- ============================================

-- Enable RLS
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "public_read_published" ON public.posts;
DROP POLICY IF EXISTS "auth_all_posts" ON public.posts;

-- Create policies that work for everyone including anon
CREATE POLICY "public_read_published" ON public.posts 
FOR SELECT 
TO anon, authenticated 
USING (published = true);

CREATE POLICY "auth_manage_posts" ON public.posts 
FOR ALL 
TO authenticated 
USING (auth.uid() = author_id OR auth.role() = 'admin')
WITH CHECK (auth.uid() = author_id OR auth.role() = 'admin');

-- Also make sure it works without authentication check for now
CREATE POLICY "public_read_all" ON public.posts 
FOR SELECT 
TO anon, authenticated 
USING (true);

-- Test if posts are accessible
SELECT id, title, slug, published FROM public.posts LIMIT 5;