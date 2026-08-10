> 🌱 **The open source AI-visibility engine. One edge, every engine, your data forever.**

> Point your domain at us. We watch every AI crawler, submit every URL, track every citation, and keep all of it long after Google and the LLMs forget. Cloudflare-native, MCP-first, GPL-3.0.

Built by [Harlan Wilton](https://harlanzw.com), maintainer of [Nuxt SEO](https://nuxtseo.com) (3.5M+ downloads/mo) and [Nuxt SEO Pro](https://nuxtseo.com/pro). Same engine that powers his products, available to you.

## Why now

**Generative AI traffic grew 28.6% year-over-year, and AI-referred visitors convert at meaningfully higher rates than Google referrals** (Similarweb, Jan 2026). The share of total traffic is still small, but the trajectory is compounding monthly and the customers it sends are worth more per visit. The teams instrumenting this *now* will own the dataset by the time it shows up in everyone else's analytics.

Three things broke the SEO toolchain in the last 24 months and no incumbent has caught up:

- **August 2023:** OpenAI ships `GPTBot`. **September 2023:** Google ships `Google-Extended`. **2024:** `ClaudeBot`, `PerplexityBot`, `Applebot-Extended`, `OAI-SearchBot`. Six new crawlers, all unobserved by legacy SEO tools.
- **LLM answers compound while staying ephemeral.** ChatGPT cites you today and forgets you tomorrow. No tool stores the timeline.
- **Google still wipes Search Console at 16 months.** Seasonal and year-over-year analysis evaporates on a rolling window — by design.

The teams who win in 2026 will not be the teams that submit the most URLs. They will be the teams that **observe, submit, and retain** across every surface — Google, Bing, ChatGPT, Claude, Perplexity, Gemini — from one engine they own.

## The shift

Existing tools split into two camps and both miss:

- **Legacy SEO suites** (Ahrefs, Semrush, SE Ranking) bolt an "AI mentions" tab onto a backlink product. Bolt-on, not native.
- **Indie indexers** (TagParrot, OmegaIndexer, IndexMeNow) ping six engines from a landing page. Submission-only, no observability, no retention.

Nothing in the middle is AI-native, agent-driven, open source, and operating one engine across every host. That is the gap.

> *Indexly bolts AI onto an SEO suite. lovablehtml prerenders SPAs. TagParrot submits URLs to Google. We do all three from the same Cloudflare Worker — and the engine is open.*

## The thesis

**The engine runs at the edge. The dashboard is one host on top of it, not the engine itself.**

Point your domain (or a CNAME) at our Cloudflare Worker and we:

- **Observe** every AI crawler hit (GPTBot, ClaudeBot, PerplexityBot, Google-Extended, OAI-SearchBot) at the edge.
- **Inject** `llms.txt`, sitemap, JSON-LD, and markdown alternatives without touching origin.
- **Pre-render** SPA routes for crawlers that do not execute JS — covers Lovable, Bolt, v0, Base44, and any framework that ships an empty `<body>`.
- **Submit** new URLs to Google Indexing API and Bing IndexNow the moment they go live.
- **Track** brand and topic citations across the five major LLMs on a daily cadence.
- **Retain** GSC data past Google's 16-month wipe and LLM citations from day one — nobody else stores either.

The dashboard, the CLI, and the MCP server are hosts on top of the same typed engine. What an agent can do, you can do, and vice versa.

**The v1 commitment:** point a CNAME at us, see your first AI crawler hit logged in under 60 seconds. The rest follows from being in the request path.

Ask your agent:

> *"Which pages got cited by Perplexity this week, which dropped, and submit the ones we updated since the last deploy."*

One MCP call. Typed result. Same engine the dashboard uses.

## The moat

Three durable advantages, ordered by half-life. Each is hard to copy alone; together they compound.

### 1. Retention in the stack you control
- **Daily citation runs across the major generative engines**, stored indefinitely. A young category — several closed-SaaS entrants are tracking citations too. The difference: ours is open, in your stack, and retained on your terms. Their dataset lives on their servers and goes with them when they pivot.
- **AI crawler logs captured at the edge** — month-over-month traffic from GPTBot, ClaudeBot, PerplexityBot before referrals ever show up in analytics. Logs hit your D1, not a vendor's warehouse.
- **GSC retained past Google's 16-month wipe** — append-only Parquet on R2, queryable forever, exportable on your terms. SEO Gets does this; we do it in the same engine as the rest.
- **One-command export, day one.** GPL-3.0 covers the code; a `requestindexing export` command covers your data. If we get bored and pivot, your CNAME flips back and your Parquet is yours.

Retention is the only moat that strengthens with time. Aggregated across opt-in customers, anonymized cross-site citation patterns become a benchmark dataset Ahrefs structurally cannot build — they don't sit in the request path. Opt-in by default; the asset compounds with logo count.

### 2. DNS-level edge on Cloudflare primitives
Competitors run periodic crawls; we run continuously inside the request path. The stack — Workers, D1, R2, Queues, Browser Rendering, Vectorize, AI Gateway — turns capabilities that cost $50k of infra on AWS/Vercel into a few hundred dollars a month. Real-time AI crawler observability, zero-config indexing, prerender, markdown alternatives, citation embedding search — all side effects of one Worker. The economics only work on this stack.

### 3. Open source by default, hosted by choice
GPL-3.0 on GitHub. The hosted product is one deployment of the open engine, not a separate codebase. Self-host the same Worker on your own Cloudflare account with your own keys. No SEO competitor offers this; the entire category is closed SaaS.

The MCP server, typed contracts, and CLI are all consumers of the same engine — agent-native is *how we build*, not a separate moat.

## What it is NOT

Strong non-goals; the vision is sharper for stating them.

- **Not a Search Console replacement.** We consume GSC; we do not reimplement it.
- **Not a guarantee of indexing or citation.** We optimise observability and submission. Engines decide outcomes.
- **Not a black-hat tool.** Public APIs, published quotas, your own OAuth grants. No SERP scraping, no proxy rotation, no LLM context manipulation.
- **Not a content generation suite.** We surface what is being said about you. Generation is a different product with a different failure mode.
- **Not a generic SEO platform.** Matching Ahrefs feature lists is a treadmill. We are the canonical OSS AI-visibility engine; broader surfaces are layers built on top.
- **Not a real-user-monitoring tool.** We measure engines (search + LLM + crawler), not your end users.
- **Not a closed surface.** Every host — hosted app, self-hosted deploy, MCP server, CLI, free tools — reads the same typed engine. Add a transport, get every capability for free.
- **Not a data hostage situation.** If we shut down, the engine is GPL-3.0 and your data is yours. One-command export ships day one.

## Who it is for

**Primary: indie devs and small agencies who care about owning the stack.** You ship sites for a living or for fun, you're allergic to $299/mo SaaS that holds your data hostage, and you'd rather self-host than rent. You read the source before you sign up. You want one Worker in front of your origin and an MCP your agent can drive — not another dashboard to log into. GPL-3.0 and Cloudflare-native is the deal you've been waiting for.

Within that ICP, **the paying tier is the operator running 5–30 client sites** — typically on Cloudflare or AI builders (Lovable, Bolt, Framer, Webflow). They have the multi-site pain, can expense per-client, and need prerender for SPA outputs. The solo indie dev is who reads the source and tells the operator about us; the operator is who pays.

Also serves:

- **The agent operator** — drives the engine through MCP from Claude Code, Cursor, or a custom loop. Power-user of the same engine.

## How we ship faster than the incumbents

This is a vision doc, not a roadmap, but the build leverage matters: it is why an indie-led project can outrun closed SaaS suites in this category.

- **Cloudflare primitives do the heavy lifting.** Workers + D1 + R2 + Queues + Browser Rendering + Vectorize + AI Gateway replace what would otherwise be a six-figure infrastructure bill. The DNS-edge moat exists because the primitives exist.
- **DataForSEO handles SERP + keyword + competitor data** we would never build ourselves. Citation tracking, keyword opportunity, share-of-voice — bought as data, shipped as product.
- **`@gscdump/*` provides the engine.** The typed GSC + analysis + storage + MCP stack is already built, shipping at [gscdump.com](https://gscdump.com) as an MCP-native GSC product. We compose it; we don't rebuild it.
- **Nuxt SEO + Nuxt SEO Pro provides the pattern library.** Auth, billing, shell, indexing, GSC — proven layers lifted into this monorepo.

We ship the *integration*. Everything underneath is leveraged.

## Stakes

If the next generation of search tooling ends up where the last one did — five closed SaaS suites charging $299/mo to surface what Google and the LLMs already give away — the open web loses a layer it used to own. The teams shipping content lose the ability to observe, retain, and operate their own visibility data without renting it back. We are building the version where the engine is yours.

---

Implementation plan: [V1.md](./V1.md). Visual identity: [DESIGN.md](./DESIGN.md).

## License

[GPL-3.0](./LICENSE) — Harlan Wilton


comeptiros https://indexfast.co/
