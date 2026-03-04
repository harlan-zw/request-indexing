# Pillar 3 Deep Research: Google Indexing API — Verification & Gap Fill

> For Gemini Deep Research. Output findings to `research/pillars/03-indexing-api-verified.md`
> Date: March 4, 2026

## CRITICAL INSTRUCTIONS — READ BEFORE STARTING

The previous run of this prompt produced **unacceptable output**. Specifically:

1. **Do NOT mark claims as "VERIFIED" unless you provide the FULL URL to the specific article/page.** Linking to a domain root (e.g., `sparktoro.com`, `ziptie.dev`, `semrush.com`) is NOT verification. We need the exact article URL (e.g., `https://sparktoro.com/blog/new-2024-google-search-data-shows-21-percent-growth`). If you cannot find the specific page, mark the claim as **UNVERIFIABLE**.

2. **Do NOT fabricate Reddit verification.** Saying "sentiment verified as common industry talk" is not verification. Either provide the actual thread URL (`https://reddit.com/r/SEO/comments/abc123/...`) with the real username, or say **"No matching thread found."**

3. **Do NOT use Gemini grounding redirect URLs** (`vertexaisearch.cloud.google.com/grounding-api-redirect/...`). These are internal Gemini links, not real sources.

4. **Every section must be thorough.** The previous run produced 3-4 lines per competitor and skipped 6 of 7 SERP queries. If a task says "for each," do ALL of them — not just the first one.

5. **Depth over speed.** We need 10 pages of dense, cited findings — not 3 pages of summaries. Visit and read every URL you reference.

---

## Context

requestindexing.com is building 6 pages about the Google Indexing API (Pillar 3). Previous research rounds produced stats and claims that lack real source URLs. We need **every claim verified or debunked** before writing content. We also need fresh competitive intelligence and ecosystem analysis.

The 6 pages we're building:
1. `/google-indexing-api` — hub/overview (target: "google indexing api", 260/mo KD 15)
2. `/google-indexing-api-tutorial` — step-by-step setup guide
3. `/google-indexing-api-node-js` — TypeScript/Node.js implementation
4. `/google-indexing-api-python` — Python implementation
5. `/google-indexing-api-quota` — quota & rate limits reference
6. `/bulk-url-indexing` — bulk indexing methods comparison

---

## Task 1: Verify or Debunk These Claims

Our previous research included these stats. For each one, find the actual source URL or mark as UNVERIFIABLE/FABRICATED:

1. "93% of sites using the API for non-job content report indexing within 12 hours" — attributed to "SEO Tech Summit 2025"
2. "84% of pages indexed via API remain indexed for at least 6 months" — attributed to "SEO Tech Summit 2025"
3. "The Indexing API has a 100% higher success rate for crawling than the manual Request Indexing button" — attributed to "Ziptie.dev 2025 Study"
4. "Rapid URL Indexer 91% success rate within 72 hours" — attributed to "RapidURLIndexer Internal Report"
5. "62% of purely AI-generated content marked Crawled - currently not indexed" — attributed to "SEO Tech Summit 2025"
6. "80% of Discovered pages index within 24h when API is triggered"
7. "GCP setup takes an average of 45 minutes for a first-time user"
8. "3773% traffic increase" — attributed to The Search Initiative case study
9. "Only 36% of clicks reach the open web" — attributed to SparkToro 2024
10. "13.14% of US desktop queries trigger an AI Overview" — attributed to SEMrush 2025
11. "Google search volume grew 21.64% in 2024" — attributed to SparkToro/Rand Fishkin

**Verification requirements:**
- Provide the FULL article URL (not domain root). Example: `https://sparktoro.com/blog/new-2024-google-search-data` NOT `https://sparktoro.com`
- If the source is behind a paywall or a conference talk, note that and provide whatever public reference exists (slides, summary blog post, tweet)
- If the stat exists but with a different number, provide the correct number AND the source
- If "SEO Tech Summit 2025" is not a real conference, say so explicitly

Also verify these Reddit quotes — find the ACTUAL thread URL or mark as fabricated:
- "If you're not using the Indexing API for your blog posts, you're literally fighting for crumbs"
- "Google says it's only for Jobs, but they haven't penalised anyone in 5 years"
- "My site went from $200/mo to $3000/mo just by automating the API"

**Expected output: a table with 11 rows, each with a specific verdict and a clickable URL or explicit "FABRICATED/UNVERIFIABLE" label.**

---

## Task 2: Competitor Content Audit for "google indexing api"

Search Google for "google indexing api" and analyze the **top 5 organic results** (excluding Google's own docs). For EACH result, provide ALL 10 of these fields — do not skip any:

1. **URL** (full URL, not just domain)
2. **Title tag** (exact, copy-pasted from the page)
3. **Word count** (approximate — count it, don't guess)
4. **H2/H3 heading structure** (list EVERY H2 and H3 on the page)
5. **Key topics covered** (bullet points of what sections cover)
6. **What they miss or get wrong** (specific content gaps we can exploit)
7. **CTA** (what do they sell/promote at the end?)
8. **Schema markup present?** (check page source or rich results test — Article, HowTo, FAQPage, etc.)
9. **Last updated date** (if visible on the page)
10. **Internal links** (list the key pages they link to from this article)

**Do this for ALL 5 competitors, not just 1-2.** Priority competitors:
- jobboardly.com (previously #3)
- rankmath.com/blog/google-indexing-api/
- oncrawl.com (their indexing API content)
- Any new competitors that have appeared in 2025-2026

Also analyze `github.com/harlan-zw/request-indexing` (our own open-source repo):
- Stars, forks, last commit
- README content and positioning
- What it does differently from other tools
- Any community issues/discussions that reveal user pain points

**Expected output: 5 detailed competitor profiles (~15-20 lines each), plus the GitHub repo analysis.**

---

## Task 3: Google's Official Indexing API Documentation — Current State

Read these pages THOROUGHLY (not just snippets) and document:

1. https://developers.google.com/search/apis/indexing-api/v3/quickstart
2. https://developers.google.com/search/apis/indexing-api/v3/using-api
3. https://developers.google.com/search/apis/indexing-api/v3/reference

For each page, extract:

### Endpoints
- List every endpoint with its exact URL, HTTP method, request body format (JSON), and response format
- Include example request and response bodies (copy from docs)

### Error Codes
- List EVERY error code mentioned in the docs with its exact error message string and meaning
- Not just 403/429 — include all of them (400, 401, 404, 500, etc.)
- For each, include Google's recommended resolution if documented

### Quotas
- Confirm current default quota (is it still 200 publish requests/day?)
- Document the getMetadata quota separately
- Document batch request limits (max URLs per batch)
- How to check current quota usage
- The process to request a quota increase (link to the form if one exists)

### Authentication
- Exact OAuth scope required
- Service account setup steps (from the quickstart)
- GSC ownership requirement — exact permission level needed

### Scope Statement
- Copy-paste Google's exact language about supported content types (JobPosting, BroadcastEvent)
- Note any caveats or warnings in the docs about other content types

### Recent Changes
- Has ANYTHING changed in these docs since January 2024? Compare current state to archived versions if possible.

Also check:
- https://developers.google.com/search/blog — any 2025-2026 blog posts about the Indexing API? List every relevant post with URL and summary.
- https://cloud.google.com/docs — the API quotas, service account setup, and IAM permissions live here. Check for any quota/pricing changes.
- Google I/O 2025 announcements — anything about indexing, Search Console API, or related APIs?
- Google Search Central YouTube — any recent videos about indexing?

**Expected output: 2-3 pages of detailed documentation extraction with exact quotes and URLs.**

---

## Task 4: npm/GitHub Ecosystem for Indexing API

### npm Packages
Search npmjs.com for "google indexing api", "indexing api", "google-indexing". For EACH relevant package, provide:
- Package name with link (e.g., `https://www.npmjs.com/package/google-indexing-script`)
- Weekly downloads (exact number from npm)
- Last published date
- TypeScript support? (yes/no)
- Key features (2-3 bullets)
- Maintained? (based on last publish date and open issues)

### GitHub Repos
Search GitHub for "google indexing api" sorted by stars. For the top 10:
- Repo name with full URL (e.g., `https://github.com/goenning/google-indexing-script`)
- Stars (exact number)
- Last commit date
- Language
- What it does (1-2 sentences)
- Maintained? (active issues, recent commits?)

### Official googleapis Usage
- What is the exact import for using the Indexing API via `googleapis`?
- Provide a complete, working code example (10-20 lines) showing auth + publish
- What version of `googleapis` is current?
- Link to the specific API reference page within the googleapis docs

### Python Packages
- What's the standard approach? `google-auth` + `requests`? `google-api-python-client`?
- Provide a complete working code example (10-20 lines)
- Link to any official Google Python quickstart for the Indexing API

**Expected output: 5+ npm packages, 10 GitHub repos, working code examples for both Node.js and Python.**

---

## Task 5: Real Reddit & Community Threads

**This is where the last run completely failed. Do NOT summarize sentiment. Find ACTUAL THREADS.**

Search Reddit for threads about the Google Indexing API from 2024-2026. For EACH thread provide:
- **Full thread URL** (e.g., `https://www.reddit.com/r/SEO/comments/1abc123/title_here/`)
- **Thread title** (exact)
- **Subreddit**
- **Upvotes** (approximate)
- **Date posted**
- **1-2 direct quotes** from comments (with real usernames — copy from the actual thread)
- **Key insight** (what can we learn from this thread for our content?)

Find at least **8 real threads**. Search these subreddits:
- r/SEO — search "indexing api"
- r/TechSEO — search "indexing api"
- r/bigseo — search "indexing api"
- r/webdev — search "google indexing"
- r/Wordpress — search "instant indexing" or "indexing api"
- r/SideProject — search "indexing"

Also find:
- **3+ Hacker News threads** — search hn.algolia.com for "google indexing api". Provide full URLs.
- **3+ Dev.to articles** — search dev.to for "google indexing api". Provide full URLs, titles, reaction counts.
- **5+ Stack Overflow questions** — search for [google-indexing-api] tag or "indexing api" questions. Provide full URLs and view counts.

**Expected output: 8+ Reddit threads with URLs, 3+ HN threads, 3+ Dev.to articles, 5+ SO questions — all with real, clickable URLs.**

---

## Task 6: Fresh SERP Analysis (March 2026)

Search Google for EACH of these 7 queries and document what you see. **Do ALL 7 — do not skip any.**

1. **"google indexing api"**
2. **"google indexing api tutorial"**
3. **"google indexing api node js"**
4. **"google indexing api python"**
5. **"google indexing api quota"**
6. **"bulk url indexing"**
7. **"bulk request indexing google"**

For EACH query, provide:
- **Top 10 organic results** — list each as: `#N: [Title](URL) — content type (guide/docs/tool/listicle/forum)`
- **SERP features present** — AI Overview? Featured Snippet? PAA? Video carousel? Ads? Knowledge panel?
- **PAA questions** — list ALL People Also Ask questions shown (expand the box to get more)
- **AI Overview summary** — if present, summarize what Google's AI says (2-3 sentences)
- **Related searches** — list all "Related searches" shown at the bottom
- **New long-tail keyword opportunities** — any interesting queries you notice in PAA/related/autocomplete

**Expected output: 7 complete SERP profiles, each with 10 ranked URLs, PAA questions, and feature notes. This should be 3-4 pages alone.**

---

## Task 7: Google's Stance on Non-Job-Posting Usage

This is critical for our content. Find EVERY official statement from Google about using the Indexing API for non-JobPosting/BroadcastEvent content.

### Official Statements (with full source URLs)
For each statement found, provide:
- **Who said it** (Gary Illyes, John Mueller, Danny Sullivan, etc.)
- **Where and when** (conference name + date, tweet URL, blog post URL, YouTube video URL with timestamp)
- **Exact quote or close paraphrase**
- **Context** (what was the question that prompted this?)

Check:
1. Google Search Central blog posts
2. Google Search Central YouTube channel (search for "indexing api")
3. Twitter/X posts from @JohnMu, @garylilyes, @dannysullivan
4. Google I/O 2025 sessions
5. Search Central Live events
6. Reddit AMAs from Googlers

### Documentation Evidence
- Copy the exact scope limitation text from the current official docs
- Has this text changed over time? Check web.archive.org snapshots if possible.

### Community Evidence (with full URLs)
- Case studies from people who submitted 1000+ non-job URLs — link to the blog post/thread
- Long-term tracking reports (6+ months of API usage) — link to the source
- Any reports of API access revocation — link to the thread/post
- Any reports of manual actions tied to API usage — link to the thread/post

**Expected output: Every Googler statement with source URL, the exact docs language, and 3-5 community case studies with URLs.**

---

## Task 8: Common Errors & Troubleshooting

Document every error users encounter with the Indexing API. **For EACH error, provide all 4 fields — do not skip any.**

### Setup Errors
For each setup error, provide:
- **Error message** (exact text the user sees)
- **Root cause** (why this happens)
- **Fix** (step-by-step resolution)
- **Source** (Google docs URL, Stack Overflow URL, or GitHub issue URL where this is discussed)

Cover at minimum:
1. Service account not added as Owner in GSC
2. Indexing API not enabled in GCP
3. Wrong OAuth scope
4. JSON key file issues (wrong format, expired)
5. GSC property type mismatch (domain vs URL-prefix)

### API Errors
For each HTTP error code, provide:
- **Status code + error message** (exact JSON response body if available)
- **Root cause**
- **Fix**
- **Source URL**

Cover: 400, 401, 403, 404, 429, 500, 503

### Quota Errors
- What is the exact response when you exceed 200 publish requests/day?
- What is the exact response when you exceed 600 requests/min?
- How does the API behave when you're at 199/200 and send a batch of 10?
- Source for each answer

### Batch Request Errors
- What happens if one URL in a batch is malformed?
- Maximum batch size and what happens if exceeded
- Content-Type header requirements for batch requests

### Silent Failures
- Document cases where the API returns HTTP 200 but the page doesn't get indexed
- What causes this? (quality threshold, content type, site authority)
- How to diagnose (check getMetadata endpoint)
- Source URLs for community reports of this

**Expected output: 15+ distinct error scenarios, each with exact error text and a source URL.**

---

## Output Format

Structure your output EXACTLY like this:

```markdown
# Pillar 3: Google Indexing API — Verified Research (March 2026)

## 1. Claim Verification
| # | Claim | Verdict | Source URL (full path, not domain) | Correct Number |
|---|-------|---------|-------------------------------------|----------------|
| 1 | ... | VERIFIED / UNVERIFIABLE / FABRICATED | https://full-url.com/specific-article | ... |

### Reddit Quote Verification
| Quote | Verdict | Thread URL |
|-------|---------|------------|

## 2. Competitor Content Audit
### [Competitor 1: domain.com]
- **URL:** https://...
- **Title:** "..."
- **Word count:** ~X,XXX
- **Headings:**
  - H2: ...
  - H3: ...
- **Topics covered:** ...
- **Content gaps:** ...
- **CTA:** ...
- **Schema:** ...
- **Last updated:** ...
- **Internal links:** ...

(repeat for all 5 competitors)

### Our GitHub Repo Analysis
...

## 3. Official API Documentation State
### Endpoints (with request/response examples)
### Error Codes (complete list)
### Quotas (with source URLs)
### Authentication
### Scope Statement (exact quote from docs)
### Recent Changes (2024-2026)

## 4. Ecosystem (npm/GitHub)
### npm Packages (table with downloads, dates, links)
### GitHub Repos (table with stars, dates, links)
### Working Code: Node.js/TypeScript
### Working Code: Python

## 5. Real Community Threads
### Reddit Threads (8+ with full URLs)
### Hacker News (3+ with full URLs)
### Dev.to Articles (3+ with full URLs)
### Stack Overflow (5+ with full URLs)

## 6. SERP Analysis (March 2026)
### "google indexing api" (top 10, PAA, features)
### "google indexing api tutorial" (top 10, PAA, features)
### "google indexing api node js" (top 10, PAA, features)
### "google indexing api python" (top 10, PAA, features)
### "google indexing api quota" (top 10, PAA, features)
### "bulk url indexing" (top 10, PAA, features)
### "bulk request indexing google" (top 10, PAA, features)

## 7. Google's Stance on Non-Job Usage
### Official Googler Statements (with URLs and dates)
### Documentation Scope Text (exact quote)
### Community Case Studies (with URLs)

## 8. Common Errors & Troubleshooting
### Setup Errors (5+ with exact messages and source URLs)
### API Errors (7 HTTP codes with exact responses)
### Quota Errors (with exact responses)
### Batch Errors
### Silent Failures (with source URLs)

## Verified Stats We Can Cite
- [stat] — [full source URL]

## Stats We Must Remove (Unverifiable)
- [stat] — why it can't be verified
```

## Quality Checklist — Verify Before Submitting

Before you finalize your output, check:

- [ ] Every "VERIFIED" claim has a full article URL (not just a domain)
- [ ] No Gemini grounding redirect URLs (`vertexaisearch.cloud.google.com/...`)
- [ ] All 5 competitors have complete 10-field profiles
- [ ] All 7 SERP queries have complete profiles with top 10 results
- [ ] All 8+ Reddit threads have full URLs (`reddit.com/r/.../comments/...`)
- [ ] All Stack Overflow questions have full URLs
- [ ] All error scenarios have exact error text and source URLs
- [ ] npm packages have exact weekly download counts and links
- [ ] GitHub repos have exact star counts and links
- [ ] Working code examples are complete (not pseudocode)
- [ ] Google's official docs are quoted exactly, not paraphrased
- [ ] The output is 10+ pages, not 3 pages of summaries
