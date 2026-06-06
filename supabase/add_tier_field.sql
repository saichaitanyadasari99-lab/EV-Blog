-- Migration: Add tier field to posts table
-- Run this in Supabase Dashboard > SQL Editor

-- Add tier column with default 'intermediate'
ALTER TABLE posts ADD COLUMN IF NOT EXISTS tier TEXT DEFAULT 'intermediate';

-- Create index for faster filtering
CREATE INDEX IF NOT EXISTS idx_posts_tier ON posts(tier) WHERE tier IS NOT NULL;

-- Update all existing posts to 'intermediate'
UPDATE posts SET tier = 'intermediate' WHERE tier IS NULL;

-- Verify
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'posts' 
AND column_name = 'tier';