-- ============================================
-- ADD PUBLIC READ POLICY (Safe - no data loss)
-- Run this in Supabase SQL Editor
-- ============================================

-- Only create policy if it doesn't already exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'public_read_published_posts' AND tablename = 'posts') THEN
    CREATE POLICY "public_read_published_posts" ON public.posts 
    FOR SELECT 
    TO anon, authenticated 
    USING (published = true);
  END IF;
END $$;

-- Verify existing policies
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'posts';