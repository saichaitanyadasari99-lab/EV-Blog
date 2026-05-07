-- Run this in Supabase SQL Editor to enable persistent poll voting
CREATE TABLE IF NOT EXISTS poll_votes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  poll_id text NOT NULL,
  option_index int NOT NULL CHECK (option_index >= 0),
  voter_hash text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_poll_votes_poll_id ON poll_votes(poll_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_poll_votes_unique ON poll_votes(poll_id, voter_hash);

-- Enable RLS
ALTER TABLE poll_votes ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read poll results
CREATE POLICY "Anyone can read poll votes"
  ON poll_votes FOR SELECT
  USING (true);

-- Allow anyone to insert a vote (dedup handled by unique index)
CREATE POLICY "Anyone can insert poll vote"
  ON poll_votes FOR INSERT
  WITH CHECK (true);
