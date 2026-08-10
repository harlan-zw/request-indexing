# @request-indexing/edge

The DNS-level edge Worker. Observe-only MVP.

## What it does

1. Receives every request to the customer's origin.
2. Classifies the User-Agent against the AI crawler pattern set (GPTBot, ClaudeBot, anthropic, Google-Extended, Applebot-Extended, PerplexityBot, OAI-SearchBot, ChatGPT-User, Bytespider, CCBot, cohere, diffbot, etc.).
3. On match, logs `{ts, engine, bot_name, path, status, country, cf-ray, ua_hash}` to D1 asynchronously via `ctx.waitUntil`.
4. Forwards the request to `ORIGIN_URL` and returns the origin response unchanged.

This is the smallest defensible proof of the "point a CNAME, see your first AI crawler hit logged in under 60 seconds" commitment from [VISION.md](../../VISION.md).

## What it does NOT do (yet)

- Inject `llms.txt`, sitemap, JSON-LD, or Markdown alternatives.
- Pre-render SPAs.
- Submit new URLs to Indexing API or IndexNow.
- Track LLM citations.

All of the above are scoped in [V1.md](../../V1.md) and will land on this same Worker as additional layers.

## Quick start (self-host)

```bash
pnpm i

# create a D1 database
pnpm wrangler d1 create request-indexing-edge
# copy the database_id it prints into wrangler.toml

# apply schema
pnpm db:migrate

# set ORIGIN_URL and SITE_ID in wrangler.toml (or via secrets/vars)

pnpm dev      # local
pnpm deploy   # ship
```

Point a Cloudflare route or a CNAME at the deployed Worker. Hit the resulting URL with a UA containing `GPTBot/1.2` and you should see a row in `crawler_hits` within seconds.

## Schema

```sql
CREATE TABLE crawler_hits (
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
```

## License

[GPL-3.0](../../LICENSE) © Harlan Wilton
