# Keyword & SERP Validation Research

You are a keyword research agent for requestindexing.com. Your previous research round produced content pillar plans in `research/pillars/`. Now you need to validate and expand with real keyword data.

## Instructions

Output all findings to `research/keyword-validation.md`.

## Tasks

### 1. Current Rankings Audit

Search Google for each of these queries and find where requestindexing.com ranks (if at all). Record the exact position and the page URL that ranks:

- "request indexing"
- "request index"
- "google request indexing"
- "request indexing google"
- "google search console request indexing"
- "request indexing api"
- "bulk indexing tool"
- "google indexing checker"
- "submit url to google"
- "indexing api"

For each query also record:
- The #1-5 ranking URLs and their domains
- SERP features present (AI Overview, Featured Snippet, PAA, video carousel, etc.)
- Whether the intent is informational, transactional, or mixed

### 2. Keyword Volume & Difficulty Validation

For each pillar's target keywords below, search Google and use any available keyword tools to find:
- Estimated monthly search volume
- Keyword difficulty (if assessable)
- Related long-tail variations worth targeting

**Pillar 1 - Google Indexing:**
- "google indexing"
- "how does google indexing work"
- "google indexing checker"
- "check if google indexed my site"
- "how long does google take to index"
- "google index status"

**Pillar 2 - Submit URL to Google:**
- "submit url to google"
- "add url to google"
- "submit sitemap to google"
- "how to submit website to google"
- "google url submission"
- "indexnow vs google"

**Pillar 3 - Google Indexing API:**
- "google indexing api"
- "indexing api setup"
- "google indexing api tutorial"
- "bulk url indexing"
- "indexing api quota"
- "google indexing api node js"
- "google indexing api python"

**Pillar 4 - Fix Indexing Problems:**
- "discovered currently not indexed"
- "crawled currently not indexed"
- "why is my page not indexed"
- "google not indexing my site"
- "request indexing not working"
- "fix crawl budget"
- "page indexing issues"

**Pillar 5 - Comparisons:**
- "rapid url indexer alternative"
- "rapid url indexer review"
- "best google indexing tool"
- "indexing tool comparison"
- "omega indexer vs"
- "speedyindex review"

### 3. Keyword Gap Discovery

Search for keywords that competitors rank for but requestindexing.com does NOT. Check these competitor domains:
- rapidurlindexer.com
- indexly.ai
- rankmath.com (specifically their indexing-related pages)
- ziptie.dev

For each competitor, find 5-10 keywords they rank for in the indexing/SEO space that represent content opportunities for requestindexing.com.

### 4. Long-Tail & Question Keywords

Search Google for each of these and record every "People Also Ask" question, autocomplete suggestion, and "Related searches" result:

- "how to get google to index my site"
- "why is google not indexing my page"
- "google indexing api for blog posts"
- "how to fix discovered currently not indexed"
- "submit url to google for free"
- "how long does google indexing take"
- "bulk submit urls to google"

### 5. Content Priority Scoring

Based on all findings, create a prioritized list of the top 20 pages to create first, scored by:
- **Search volume** (higher = better)
- **Difficulty** (lower = better)
- **Relevance to requestindexing.com** (direct product relevance = better)
- **Conversion intent** (closer to buying decision = better)

Format as a table:
| Priority | Target Keyword | Est. Volume | Difficulty | Intent | Pillar | Suggested URL Path |
|----------|---------------|-------------|------------|--------|--------|--------------------|

## Output Format

```markdown
# Keyword & SERP Validation - Research Findings

## 1. Current Rankings Audit
[Table of current rankings with SERP feature notes]

## 2. Keyword Volume & Difficulty
### Pillar 1: Google Indexing
[Table: keyword | volume | difficulty | long-tail variations]
### Pillar 2: Submit URL to Google
...
### Pillar 3: Google Indexing API
...
### Pillar 4: Fix Indexing Problems
...
### Pillar 5: Comparisons
...

## 3. Keyword Gap Analysis
### [Competitor Name]
[Keywords they rank for that we don't]

## 4. Long-Tail & Question Keywords
### PAA Questions (deduplicated)
### Autocomplete Suggestions
### Related Searches

## 5. Content Priority Matrix
[The priority table]

## Key Insights
- Top 5 takeaways that should change our content plan
```

## Quality Standards

- **Actually search Google** for every query. Do not guess or hallucinate volumes.
- When you cannot find exact volume data, say "estimated" and explain your reasoning.
- Record what you actually see in the SERPs, not what you think should be there.
- If a competitor doesn't rank for something, say so — don't invent rankings.
- Today's date is March 4, 2026.
