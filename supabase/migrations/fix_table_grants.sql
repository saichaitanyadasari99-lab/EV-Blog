-- ============================================
-- Fix: Explicit GRANTs for Data API access
-- Required by Supabase from May 30, 2026
-- Run this in Supabase SQL Editor
-- ============================================

-- Posts table
GRANT SELECT ON public.posts TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.posts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.posts TO service_role;

-- Categories table
GRANT SELECT ON public.categories TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.categories TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.categories TO service_role;

-- Poll votes table (if exists)
GRANT SELECT, INSERT ON public.poll_votes TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.poll_votes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.poll_votes TO service_role;
