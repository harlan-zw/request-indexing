# Content Pillar Deep Research Plan

> For Gemini CLI agent to execute. Each pillar has specific research tasks.
> Output findings as structured markdown under `research/pillars/` directory.

---

## Global Research Tasks (run first)

Before diving into pillars, establish baseline context:

1. **Competitor content audit** - For each of these domains, catalog every blog/guide page they have about Google indexing:
   - rankmath.com/blog (ranks for "google indexing api")
   - breaktheweb.agency (ranks for "why pages aren't indexed")
   - oncrawl.com (ranks for indexing API bulk usage)
   - ziptie.dev (ranks for "discovered currently not indexed")
   - jobboardly.com (ranks for "google indexing api")
   - For each: note word count, headings structure, what topics they cover, what they miss, what their CTA is

2. **Google's official documentation** - Read and summarize the current state of:
   - https://developers.google.com/search/docs/crawling-indexing/ask-google-to-recrawl
   - https://developers.google.com/search/apis/indexing-api/v3/quickstart
   - https://developers.google.com/search/apis/indexing-api/v3/using-api
   - https://developers.google.com/search/docs/crawling-indexing/overview-google-crawlers
   - https://support.google.com/webmasters/answer/7440203 (page indexing report)
   - Note any recent changes, deprecations, or new features in 2025-2026

3. **Reddit & forum sentiment** - Search Reddit (r/SEO, r/TechSEO, r/webdev, r/Wordpress) for the top 20 most upvoted threads about:
   - Google indexing problems
   - Request indexing not working
   - Indexing API usage
   - Bulk indexing tools
   - Note: what questions keep coming up? What frustrations do people have? What workarounds do they share?

4. **People Also Ask mining** - For each of these queries, record all PAA questions Google shows:
   - "request indexing google"
   - "google indexing api"
   - "why is my site not indexed"
   - "submit url to google"
   - "crawl budget optimization"
   - "discovered currently not indexed"
   - "google indexing checker"

---

## Pillar 1: "Google Indexing" Research

**Output to:** `research/pillars/01-google-indexing.md`

### What to research:

1. **How Google indexing actually works in 2026** - What is the current crawl > render > index pipeline? Has anything changed with the shift to AI-powered search? What is the role of Caffeine vs newer systems?

2. **Mobile-first indexing status** - Is mobile-first indexing now universal? Any exceptions? What does Google's documentation currently say? Any recent Search Central blog posts about it?

3. **Indexing speed benchmarks** - Search for any studies, blog posts, or data about:
   - How long does Google typically take to index a new page?
   - Does page type matter (blog vs product vs homepage)?
   - Does domain authority affect indexing speed?
   - What's the difference between indexing via sitemap vs URL Inspection vs Indexing API?

4. **Google indexing checker tools landscape** - What free/paid tools exist for checking if a URL is indexed?
   - site: operator limitations
   - Google Search Console URL Inspection
   - Third-party tools (Ahrefs, SEMrush, etc.)
   - API-based checking methods
   - What gaps exist that requestindexing.com could fill?

5. **Recent Google algorithm updates affecting indexing** - Any 2025-2026 changes to:
   - Quality thresholds for indexing (Google has been more selective)
   - Helpful Content Update impact on indexing decisions
   - AI content and indexing policies
   - Any new indexing signals or requirements

6. **Statistics and data points** - Find citable stats about:
   - How many pages does Google index total?
   - What percentage of the web is indexed?
   - Average crawl rates for different site sizes
   - Any Google statements about indexing capacity/priorities

---

## Pillar 2: "Submit URL to Google" Research

**Output to:** `research/pillars/02-submit-url-google.md`

### What to research:

1. **History of Google's URL submission** - Document the evolution:
   - Old "Add URL" tool (deprecated) - when was it removed? What replaced it?
   - Google Search Console URL Inspection tool - current capabilities and limitations
   - Indexing API - when was it introduced? Original scope (job postings/livestreams) vs current usage
   - IndexNow protocol - what is it? Does Google support it yet? Status as of 2026?

2. **Current methods comparison** - For each method of submitting URLs to Google, document:
   - XML Sitemap submission: process, limits, how often Google re-reads sitemaps
   - URL Inspection "Request Indexing" button: daily limits, quota, success rate
   - Indexing API: official scope, quota (200 URLs/day), whether it works for non-job-posting URLs
   - Ping endpoints: are sitemap ping endpoints still working?
   - robots.txt sitemap directive: how reliable is it?
   - Google Search Console sitemap report: common errors and fixes

3. **XML Sitemap best practices in 2026** - Research:
   - Optimal sitemap size (URL count, file size)
   - Sitemap index files - when to use them
   - lastmod accuracy - does Google actually use it?
   - Dynamic vs static sitemaps
   - Sitemap for images, video, news
   - Common sitemap errors and validation

4. **Step-by-step screenshots needed** - Identify every UI flow that needs screenshots:
   - Google Search Console URL Inspection flow
   - Sitemap submission in GSC
   - Testing a sitemap
   - Request Indexing button interaction
   - Any rate limit messages or error states

---

## Pillar 3: "Google Indexing API" Research

**Output to:** `research/pillars/03-indexing-api.md`

### What to research:

1. **Official API documentation deep-dive** - Thoroughly document:
   - Authentication setup (service account, OAuth)
   - API endpoints (URL_UPDATED, URL_DELETED, getMetadata)
   - Rate limits and quotas (200 publish requests per day per project)
   - Batch request format
   - Error codes and their meanings
   - Official scope limitations (job postings and livestream content only, officially)

2. **Unofficial usage for non-job-posting URLs** - Research the community consensus:
   - Does the API actually work for regular URLs? What evidence exists?
   - Has Google made any statements about enforcement?
   - Are there any risks (API key revocation, penalties)?
   - What do SEO professionals recommend?
   - Search for any case studies with data (before/after indexing speed)

3. **Implementation guides that exist** - Analyze what's currently published:
   - RankMath's guide (what does it cover? what's missing?)
   - OnCrawl's Python bulk guide
   - WordPress plugin implementations
   - Any npm packages or libraries for the API?
   - GitHub repos with indexing API tools - which are popular/maintained?

4. **Code samples needed** - Research working code for:
   - Node.js/TypeScript implementation (most relevant for our audience)
   - Python implementation (popular in SEO community)
   - Batch processing implementation
   - Error handling patterns
   - Service account setup automation

5. **Alternatives and related APIs** - Research:
   - IndexNow protocol (Bing, Yandex support) - does Google support it as of 2026?
   - Bing URL Submission API
   - Yandex Webmaster API
   - Any new APIs or protocols announced at Google I/O or Search Central events

---

## Pillar 4: "Fix Indexing Problems" Research

**Output to:** `research/pillars/04-fix-indexing-problems.md`

### What to research:

1. **Google Search Console indexing status types** - Document every status in the Page Indexing report:
   - "Discovered - currently not indexed" - what causes it, how to fix
   - "Crawled - currently not indexed" - what causes it, how to fix
   - "Excluded by 'noindex' tag"
   - "Blocked by robots.txt"
   - "Page with redirect"
   - "Not found (404)"
   - "Soft 404"
   - "Duplicate without user-selected canonical"
   - "Duplicate, Google chose different canonical"
   - "Blocked due to other 4xx issue"
   - "Server error (5xx)"
   - For EACH: common causes, diagnostic steps, fix instructions

2. **"Discovered - currently not indexed" deep dive** - This is the most common complaint. Research:
   - What does it actually mean technically?
   - Google's official guidance
   - Common causes (thin content, crawl budget, site quality)
   - Proven fix strategies with evidence
   - How long should you wait before taking action?
   - Reddit threads and forum discussions about fixes that actually worked

3. **"Crawled - currently not indexed" deep dive** - Research:
   - Difference from "Discovered - currently not indexed"
   - Google's quality threshold for indexing
   - Relationship to Helpful Content signals
   - Case studies of sites that fixed this issue
   - Content quality patterns that trigger this status

4. **"Request Indexing" button issues** - Research:
   - "Request indexing is currently unavailable" - history of this message, when it appeared
   - "Indexing request rejected" - what causes rejection
   - Rate limits - how many requests per day/property
   - Common error messages and their meanings
   - Workarounds when the button is unavailable

5. **Crawl budget research** - Deep dive:
   - Google's official definition and documentation
   - Crawl rate vs crawl demand
   - How to check crawl stats in GSC
   - Factors that waste crawl budget (URL parameters, faceted navigation, infinite spaces)
   - Optimization techniques with evidence
   - At what site size does crawl budget actually matter?
   - Myths vs reality (Gary Illyes' statements)

6. **Technical SEO issues that prevent indexing** - Catalog every technical issue:
   - JavaScript rendering problems
   - Canonical tag conflicts
   - Orphan pages
   - Internal linking problems
   - Page speed as an indexing factor
   - Duplicate content patterns
   - hreflang issues
   - Structured data errors affecting indexing

7. **AI content and indexing in 2026** - Research:
   - Is Google less likely to index AI-generated content?
   - Any data or studies comparing indexing rates for AI vs human content
   - Google's stated policies on AI content
   - Best practices for ensuring AI-assisted content gets indexed

---

## Pillar 5: Competitor Comparisons Research

**Output to:** `research/pillars/05-comparisons.md`

### What to research:

1. **Rapid URL Indexer** - Full competitor analysis:
   - What is it? How does it work?
   - Pricing model
   - Features and limitations
   - User reviews and sentiment (G2, Trustpilot, Reddit)
   - What technology does it use under the hood?
   - Success rate claims vs reality
   - How does it compare to Request Indexing?

2. **Other indexing tools/services** - For each, document features, pricing, reviews:
   - Omega Indexer
   - Indexification
   - OneHourIndexing
   - SpeedyIndex
   - Collab.Google Indexing API notebooks
   - RankMath Instant Indexing plugin
   - IndexNow plugins
   - Any new tools that launched in 2025-2026

3. **Manual Google Search Console approach** - Document the pain points:
   - How many URLs can you manually submit per day?
   - Time cost of manual submission
   - Limitations of the URL Inspection tool
   - Why people look for alternatives

4. **Comparison angle research** - For the vs pages, find:
   - Unique selling points of Request Indexing vs each competitor
   - Price comparisons
   - Feature gap analysis
   - Use case differentiation (who should use which tool)

---

## Research Output Format

For each pillar file, structure findings as:

```markdown
# Pillar [N]: [Title] - Research Findings

## Key Takeaways
- Bullet points of most important findings

## Detailed Findings

### [Research Task 1]
[Findings with sources]

### [Research Task 2]
[Findings with sources]

## Content Angles Discovered
- Unique angles competitors aren't covering
- Questions people are asking that nobody answers well

## Recommended Sources to Cite
- [Source 1](url) - why it's credible
- [Source 2](url) - why it's credible

## Data Points & Statistics
- Citable numbers for use in content

## Content Gaps Found
- Topics competitors miss
- Outdated information in existing content
- Opportunities for original research/data
```

---

## Execution Order

1. Global research tasks (establishes context for everything)
2. Pillar 3 (Indexing API) - lowest difficulty, ship first
3. Pillar 4 (Fix Problems) - highest conversion intent
4. Pillar 5 (Comparisons) - fast to research and write
5. Pillar 1 (Google Indexing) - needs authority from earlier pillars
6. Pillar 2 (Submit URL) - most competitive, research last
