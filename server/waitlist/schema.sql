-- WB Pro waitlist (#1961). One row per address; joining twice keeps one row.
CREATE TABLE IF NOT EXISTS waitlist (
  email     TEXT PRIMARY KEY,
  joined_at TEXT NOT NULL
);

-- Sign-up attempts in the last hour, for the rate limit. "visitor" is a
-- salted SHA-256 of the IP address; the address itself is never stored.
CREATE TABLE IF NOT EXISTS join_attempts (
  visitor TEXT NOT NULL,
  at      INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS join_attempts_visitor ON join_attempts (visitor);
CREATE INDEX IF NOT EXISTS join_attempts_at ON join_attempts (at);
