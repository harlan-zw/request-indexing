CREATE TABLE IF NOT EXISTS crawler_hits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  site_id TEXT NOT NULL,
  ts INTEGER NOT NULL,
  engine TEXT NOT NULL,
  bot_name TEXT NOT NULL,
  path TEXT NOT NULL,
  status INTEGER,
  country TEXT,
  cf_ray TEXT,
  ua_hash TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_crawler_hits_site_ts ON crawler_hits (site_id, ts DESC);
CREATE INDEX IF NOT EXISTS idx_crawler_hits_engine_ts ON crawler_hits (engine, ts DESC);
CREATE INDEX IF NOT EXISTS idx_crawler_hits_path ON crawler_hits (site_id, path);
