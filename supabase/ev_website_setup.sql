-- ============================================
-- FIX RLS FOR PUBLIC ACCESS
-- Run this in Supabase SQL Editor
-- ============================================

-- Enable RLS if not already enabled
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

-- Drop existing policies that might block access
DROP POLICY IF EXISTS "public_read_published" ON public.posts;
DROP POLICY IF EXISTS "auth_all_posts" ON public.posts;

-- Create policy for public read access to published posts
CREATE POLICY "public_read_published" ON public.posts 
FOR SELECT 
TO anon, authenticated 
USING (published = true);

-- Allow authenticated users to manage their own posts
CREATE POLICY "auth_manage_posts" ON public.posts 
FOR ALL 
TO authenticated 
USING (auth.uid() = author_id OR auth.role() = 'admin')
WITH CHECK (auth.uid() = author_id OR auth.role() = 'admin');

-- Ensure there's a fallback for anonymous reads
DROP POLICY IF EXISTS "public_read_all" ON public.posts;
CREATE POLICY "public_read_all" ON public.posts 
FOR SELECT 
TO anon, authenticated 
USING (true);

-- Test if posts are accessible
SELECT id, title, slug, published FROM public.posts LIMIT 5;