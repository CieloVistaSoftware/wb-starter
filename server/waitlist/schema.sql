-- WB Pro waitlist (#1961). One row per address; joining twice keeps one row.
CREATE TABLE IF NOT EXISTS waitlist (
  email     TEXT PRIMARY KEY,
  joined_at TEXT NOT NULL
);
