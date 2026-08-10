<h1 align='center'>Request Indexing</h1>

<p align="center">
<b>The open source AI-visibility engine.</b><br>
One edge, every engine, your data forever.
</p>

<p align="center">
<table>
<tbody>
<td align="center">
<img width="800" height="0" /><br>
<i></i> <a href="https://requestindexing.com/">requestindexing.com</a> <br>
<sup>GPL-3.0 · Cloudflare-native · MCP-first</sup><br>
<sub>Built by <a href="https://harlanzw.com">Harlan Wilton</a> · maintainer of <a href="https://nuxtseo.com">Nuxt SEO</a><br> Follow <a href="https://twitter.com/harlan_zw">@harlan_zw</a> · Join <a href="https://discord.gg/275MBUBvgP">Discord</a></sub><br>
<img width="800" height="0" />
</td>
</tbody>
</table>
</p>

> [!NOTE]
> v1 is in active development. The hosted product runs v0 today. See [VISION.md](./VISION.md) and [V1.md](./V1.md) for where this is going.

Point your domain at us. We watch every AI crawler, submit every URL, track every citation, and keep all of it long after Google and the LLMs forget.

## What it does

- 🛰️ **AI crawler observability** — log GPTBot, ClaudeBot, PerplexityBot, Google-Extended, Applebot-Extended, OAI-SearchBot at the edge
- ⚡ **Multi-engine submission** — Google Indexing API + Bing IndexNow + Yandex + Naver + Seznam, one call
- 💬 **LLM citation tracking** — daily prompt runs across ChatGPT, Claude, Perplexity, Gemini; history retained
- 📄 **`llms.txt` + sitemap injection** — generated, versioned, served from the edge
- 🪞 **SPA pre-rendering** — covers Lovable, Bolt, v0, Base44, any framework with an empty `<body>`
- 🗓️ **GSC retention past 16 months** — append-only Parquet on R2, queryable forever
- 🤖 **MCP server** — drive everything from Claude Code, Cursor, or a custom agent loop
- 🔓 **GPL-3.0 + self-host** — same engine, your Cloudflare account, your keys

## Why

Three things broke the SEO toolchain in the last 24 months:

- GPTBot (Aug 2023), Google-Extended (Sep 2023), ClaudeBot, PerplexityBot, OAI-SearchBot, Applebot-Extended — six new crawlers unobserved by legacy tools.
- LLM answers compound while staying ephemeral. ChatGPT cites you today and forgets you tomorrow.
- Google still wipes Search Console at 16 months by design.

Generative AI traffic grew 28.6% year-over-year ([Similarweb, Jan 2026](https://www.similarweb.com/blog/marketing/geo/gen-ai-stats/)). The teams instrumenting this now will own the dataset by the time it shows up in everyone else's analytics.

See [VISION.md](./VISION.md) for the full strategy and [V1.md](./V1.md) for the implementation plan.

## Built on

- [`@gscdump/*`](https://gscdump.com) — typed GSC + analysis + storage + MCP engine
- [`@nuxtjs/robots`](https://github.com/nuxt-modules/robots) — AI crawler classification (`AI_BOTS` pattern set)
- [Nuxt](https://nuxt.com) + [Nuxt UI Pro](https://ui.nuxt.com/pro?aff=5zj9e) + [Nuxt SEO](https://nuxtseo.com)
- Cloudflare Workers, D1, R2, Queues, Browser Rendering, AI Gateway
- DataForSEO for SERP + keyword data

## Run locally

```bash
git clone git@github.com:harlan-zw/request-indexing.git
pnpm i
```

Configure a Google OAuth client at the [Google Developer Console](https://console.developers.google.com/) with scopes `userinfo.email`, `webmasters.readonly`, `indexing`, and redirect URLs `http://localhost:3000/auth/google` and `http://localhost:3000/auth/google-indexing`.

```bash
# .env
NUXT_OAUTH_GOOGLE_CLIENT_ID=<clientId>
NUXT_OAUTH_GOOGLE_CLIENT_SECRET=<clientSecret>
NUXT_KEY=<must be 32 chars>
NUXT_SESSION_PASSWORD=<secret>
```

```bash
pnpm dev
```

Building requires a [Nuxt UI Pro](https://ui.nuxt.com/pro?aff=5zj9e) license:

```bash
NUXT_UI_PRO_LICENSE_KEY=<license> pnpm build
```

## Self-hosting

The hosted product is one deployment of this codebase. Bring your own Cloudflare account, your own Google OAuth app, your own D1 + R2 bindings; deploy with `wrangler deploy`. Full guide: TODO.

## Credits

The original Request Indexing was inspired by [google-indexing-script](https://github.com/goenning/google-indexing-script) ([background](https://seogets.com/blog/google-indexing-script)).

## Sponsors

<p align="center">
  <a href="https://raw.githubusercontent.com/harlan-zw/static/main/sponsors.svg">
    <img src='https://raw.githubusercontent.com/harlan-zw/static/main/sponsors.svg'/>
  </a>
</p>

## License

[GPL-3.0](./LICENSE) © 2022-PRESENT [Harlan Wilton](https://github.com/harlan-zw)
