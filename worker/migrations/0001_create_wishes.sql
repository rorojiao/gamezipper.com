-- GameZipper Wish Wall: public requests, private moderation, and abuse controls.
-- Raw IP addresses are never stored. voter_hash and rate-limit keys are HMAC-SHA-256 digests.

CREATE TABLE IF NOT EXISTS wishes (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  details TEXT NOT NULL DEFAULT '',
  nickname TEXT NOT NULL DEFAULT 'Player',
  category TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'added', 'hidden')),
  votes INTEGER NOT NULL DEFAULT 0 CHECK (votes >= 0),
  game_url TEXT NOT NULL DEFAULT '',
  email_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (email_status IN ('pending', 'sent', 'failed', 'not_configured')),
  email_id TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_wishes_created
  ON wishes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wishes_status_created
  ON wishes(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wishes_public_votes
  ON wishes(status, votes DESC, created_at DESC);

CREATE TABLE IF NOT EXISTS wish_votes (
  wish_id TEXT NOT NULL REFERENCES wishes(id) ON DELETE CASCADE,
  voter_hash TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  PRIMARY KEY (wish_id, voter_hash)
);

CREATE INDEX IF NOT EXISTS idx_wish_votes_created
  ON wish_votes(created_at);

CREATE TABLE IF NOT EXISTS wish_rate_limits (
  key TEXT PRIMARY KEY,
  count INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_wish_rate_limits_expiry
  ON wish_rate_limits(expires_at);
