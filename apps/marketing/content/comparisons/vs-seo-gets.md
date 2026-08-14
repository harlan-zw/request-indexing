---
title: Request Indexing vs SEO Gets
description: SEO Gets extends Google Search Console retention past 16 months. Request Indexing does the same retention plus indexing status and submission, free during beta and open source.
keywords:
  - seo gets alternative
  - gsc retention tool
  - google search console history
---

# Request Indexing vs SEO Gets

SEO Gets solves one real problem well: Google deletes your Search Console data after 16 months, and SEO Gets keeps it for five years. Request Indexing solves the same problem, plus the indexing side: what's indexed, what isn't, and pushing the URLs that need submitting.

## At a glance

| | Request Indexing | SEO Gets |
|---|---|---|
| **GSC retention** | Past 16 months | 5 years |
| **Open source** | GPL-3.0 | Closed |
| **Self-hostable** | Yes | No |
| **Indexing status per URL, with reason** | Yes | Page-level reports |
| **Indexing API submission** | Yes | No |
| **IndexNow / Bing** | Planned, via the gscdump protocol | No |
| **Sitemap tracking (declared vs. discovered)** | Yes | No |
| **Row caps** | None | 50k rows (vs. GSC's 1k) |
| **Price** | Free during beta | $49/mo |

## What SEO Gets does well

- Clean, focused product around GSC retention and analytics.
- 50x the row cap of GSC's native UI.
- Page-level indexing reports beyond what GSC's API surfaces.
- Established, with thousands of SEO professionals already using it.

## Where Request Indexing differs

**1. Submission is part of the job.** SEO Gets is excellent at GSC retention and stops there. Request Indexing keeps the same history, then lets you act on it: submit unindexed URLs to Google's Indexing API from the same dashboard.

**2. Open by default.** SEO Gets is closed SaaS. Request Indexing is GPL-3.0 on GitHub. Self-host on your own Cloudflare account, or export your data if you ever want to leave.

**3. Built on an open protocol.** Retention and indexing data run through gscdump, a public protocol with its own documented contract, not a private database only we can query.

**4. Free during beta.** SEO Gets charges from day one. Request Indexing doesn't have a paid tier yet; the product shape is still settling.

## When to choose SEO Gets

If you only care about GSC retention and analytics today, want the longer five-year window, and want a mature, proven product with no setup beyond OAuth, SEO Gets is a solid choice.

## When to choose Request Indexing

If you want retention and indexing submission in the same place, want to self-host or read the source, and don't want to pay for a tool that's still finding its shape.

Try it: [requestindexing.com](https://requestindexing.com) · GitHub: [harlan-zw/request-indexing](https://github.com/harlan-zw/request-indexing)
