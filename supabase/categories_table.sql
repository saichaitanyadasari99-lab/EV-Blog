-- ============================================
-- CATEGORIES TABLE
-- Run this in Supabase SQL Editor
-- ============================================

-- Create categories table
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "public_read_categories" ON public.categories
FOR SELECT TO anon, authenticated USING (true);

-- Allow authenticated users to manage categories
CREATE POLICY "auth_manage_categories" ON public.categories
FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Insert default categories if table is empty
INSERT INTO public.categories (slug, name) VALUES
  ('cell-chemistry', 'Cell Chemistry'),
  ('bms-design', 'BMS Design'),
  ('ev-benchmarks', 'EV Benchmarks'),
  ('vehicle-reviews', 'Vehicle Reviews'),
  ('standards', 'Standards'),
  ('news', 'News')
ON CONFLICT (slug) DO NOTHING;

-- Verify
SELECT * FROM public.categories;