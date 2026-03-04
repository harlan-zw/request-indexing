# Pillar 4: Fix Indexing Problems — Verified Research

> Generated: March 4, 2026
> Methodology: Same as `03-indexing-api-verified.md` — every stat verified via DataForSEO, WebFetch, or direct source. Fabricated claims from the original `04-fix-indexing-problems.md` are flagged and replaced.

---

## 1. Keyword Verification

### DataForSEO-Verified Keywords

| Keyword | Volume | KD | Intent | Notes |
|---------|--------|-----|--------|-------|
| crawl budget | 390/mo | 40 | commercial | Trending down from 880 peak (May 2025) |
| seo crawl budget | 140/mo | 43 | commercial | Synonym, same SERP |
| crawl budget optimization | 140/mo | 36 | commercial | **Best target — lower KD** |
| crawl budget seo | 140/mo | 37 | commercial | Synonym |
| google crawl budget | 90/mo | 46 | navigational | Higher KD, navigational intent |
| what is crawl budget | 70/mo | 36 | informational | Good for explainer page |
| what is crawl budget in seo | 70/mo | 14 | informational | **Lowest KD in cluster** |

### Long-Tail Keywords (SERP-verified, volume unconfirmed)

DataForSEO cannot return volume for 4+ word seeds. Gemini estimated these volumes — **all are likely inflated** based on Pillar 3 pattern (e.g., "google indexing api tutorial" was estimated at 1K but showed no standalone volume in DataForSEO).

| Keyword | Gemini Est. | Likely Actual | KD Est. | SERP Competition |
|---------|------------|--------------|---------|-----------------|
| discovered currently not indexed | 5K-10K | Unknown (high activity based on SERP) | 45 | Reddit #1, Google Support #2, Conductor #3, Rank Math #4, SEL #5 |
| crawled currently not indexed | 3K-7K | Unknown (high activity) | 60 | Reddit #1, Google Support #2, Onely #3, seotesting #4 |
| why is my page not indexed | 1K-5K | Unknown | 65 | Google Support #1, breaktheweb #2, Reddit #3 — **HAS AI OVERVIEW** |
| request indexing not working | 500-1.5K | Unknown | 40 | Google Support #1, Reddit #2 — **HAS AI OVERVIEW** |

**Key observation:** "discovered currently not indexed" and "crawled currently not indexed" do NOT trigger AI Overviews (as of March 2026). The diagnostic/troubleshooting keywords DO. This makes the specific GSC status pages better targets — users see organic results, not an AI summary.

### Addressable Volume Assessment

**Crawl budget cluster:** ~390 + 140 + 70 = ~600/mo (verified)
**Indexing problem cluster:** Volume unknown but SERP signals suggest high activity — Reddit threads get thousands of upvotes, Google Support threads have hundreds of replies.

**Combined Pillar 4 estimate:** Likely 800-1,500/mo addressable, but this is less certain than Pillar 3 due to unverifiable long-tail volumes.

---

## 2. Fabricated Claims from Original Research

### FABRICATED: "62% of AI-generated content marked Crawled - not indexed"
- **Attributed to:** "SEO Tech Summit 2025"
- **Reality:** The real event is called "Tech SEO Summit" (not "SEO Tech Summit"). The 2025 edition was April 29, 2025 in Hamburg. None of the talks covered AI content indexing rates. Speaker list: Mark Williams-Cook, Martin Splitt (Google), Gus Pelogia (Indeed), Roxana Stingu (Alamy), Dan Taylor (SALT.agency), Pascal Landau (ABOUT YOU). No 62% statistic exists anywhere.
- **Replacement stat:** IndexCheckr study of 16M pages found 61.94% of pages were not indexed overall — a different metric (all content types, not just AI). Source: [indexcheckr.com/resources/google-indexing](https://indexcheckr.com/resources/google-indexing)

### FABRICATED: "100% higher success rate for Indexing API vs sitemap submission"
- **Attributed to:** "Ziptie.dev 2025 Study"
- **Reality:** URL `ziptie.dev/indexing-trends-2025/` returns 404. The related URL `ziptie.dev/blog/how-to-fix-discovered-currently-not-indexed/` EXISTS but contains no such statistic.
- **Replacement stat:** IndexCheckr found only 29.37% of submitted URLs (via GSC "Request Indexing") end up indexed. No comparative study exists for API vs sitemap.

### UNVERIFIABLE: "40% of crawl budget wasted on faceted navigation"
- **No source found.** The concept is real but the specific 40% figure doesn't appear in any findable publication.
- **Replacement stat:** Botify data shows 58% of pages on large retail sites are never crawled by Google at all. Source: [botify.com/blog/crawl-budget-optimization](https://www.botify.com/blog/crawl-budget-optimization)

### FABRICATED: All 3 Reddit Quotes
All three Reddit quotes from the original research are fabricated:
- u/SEO_Master on r/TechSEO — username doesn't exist, quote not found
- u/Vue_Dev on r/Nuxt — username doesn't exist, quote not found
- u/Niche_King on r/Blogging — username doesn't exist, quote not found

### DEAD LINKS from Original Research
- `searchenginejournal.com/google-indexing-problems/45123/` — 404
- `ziptie.dev/indexing-trends-2025/` — 404

### VALID LINKS from Original Research
- `ahrefs.com/blog/discovered-currently-not-indexed/` — EXISTS
- `support.google.com/webmasters/answer/7440203` — EXISTS (Google's Page Indexing Report docs)

---

## 3. Verified Statistics for Content

### IndexCheckr Study (16 Million Pages)
Source: [indexcheckr.com/resources/google-indexing](https://indexcheckr.com/resources/google-indexing)
Covered by: [Search Engine Journal](https://www.searchenginejournal.com/data-suggests-google-indexing-rates-are-improving/540700/), [Stan Ventures](https://www.stanventures.com/news/googles-indexing-rates-are-rising-but-so-is-deindexing-2062/)

- **61.94%** of pages in the dataset were not indexed (domain indexed, page excluded)
- Only **37.08%** achieved full indexing
- Average time to index: **27.4 days**
- Only **29.37%** of submitted URLs end up indexed
- Deindexing rate: **21.29%** of previously indexed pages eventually get removed
- **13.7%** deindexed within the first 90 days

### Google Official Statements
- Google claimed core updates "cleaned **45%** of content in search results" through 2023-2024
- Gary Illyes: **90%** of websites don't need to worry about crawl budget (Search Off the Record podcast)

### Crawl & Index Benchmarks
- **130-day** benchmark for URL retention in Google's index (Search Engine Land)
- **75-140 day** crawl window before URLs may drop from index (Search Engine Land)
- **58%** of pages on large retail sites are never crawled by Googlebot (Botify)

---

## 4. Verified Quotes with Real Sources

### Gary Illyes (Google) — on "Crawled – Currently Not Indexed"
Source: [Search Engine Journal](https://www.searchenginejournal.com/google-explains-crawled-not-indexed/521321/)

> "Dupe elimination is one of those things, where we crawl the page and then we decide to not index it because there's already a version of that or an extremely similar version of that content available in our index and it has better signals."

> "The general quality of the of the site, that can matter a lot of how many of these crawled but not indexed you see in search console."

> "When you see that number rising, that the perception of… Google's perception of the site has changed, that could be one thing."

### John Mueller (Google) — on Indexing API Scope
Source: [SERoundTable](https://www.seroundtable.com/google-indexing-api-other-content-types-32957.html)

> "If you don't have content that falls into those categories then the API really isn't going to help you there."

> "No... if you don't have job postings then there's like nothing to do with that API."

### Barry Schwartz / SERoundTable — September 2024 Enforcement
Source: [SERoundTable](https://www.seroundtable.com/google-indexing-api-not-working-38078.html)

In September 2024, reports surfaced of the Indexing API returning 200 OK but no longer triggering Googlebot visits. Multiple indexing service providers halted their services. This aligns with Google's enforcement of the API's intended scope (job posting / livestream content only).

### Real Forum Discussion — LocalSearchForum (May 2024)
Source: [localsearchforum.com/threads/...61401](https://localsearchforum.com/threads/why-did-google-stop-indexing-only-my-blog-pages.61401/)

- **CarrieHill:** "I doubt 'crawl budget' is the issue — there are million page sites that get plenty of 'budget'. More than likely — the blog posts are not unique enough from other content"
- **noahlearner:** "Why does my content on THIS PAGE deserve to rank over all the content available on the web" and "Crawl budget problems don't really impact sites unless they have ~1 million pages or more"
- **mikepcservice** (resolution): "I had removed all duplicate posts, 32 of them and the original posts have gotten indexed again"

### Adam Gent — Canonicalization Case Study
Source: [Search Engine Journal](https://www.searchenginejournal.com/fixed-crawled-not-indexed/426038/)

SEO practitioner Adam Gent (@Adoubleagent) published a case study where WordPress RSS feed pages were being canonicalized over actual content pages, causing "Crawled – currently not indexed." Fix: removed feed pages, let them 404, resubmitted correct URLs — resolved within days.

---

## 5. SERP Landscape & Competitor Analysis

### "discovered currently not indexed" SERP
| Pos | Domain | Type |
|-----|--------|------|
| 1 | reddit.com | Forum (r/SEO thread) |
| 2 | support.google.com | Official support thread |
| 3 | conductor.com | SEO platform academy |
| 4 | rankmath.com | WordPress SEO plugin KB |
| 5 | searchengineland.com | SEO news/guide |
| 6 | seotesting.com | SEO tool guide |
| 7 | embarque.io | SEO agency case study |
| 8 | webmasters.stackexchange.com | Q&A |

**SERP features:** Video, Perspectives, People Also Ask, Related Searches. **No AI Overview.**

### "crawled currently not indexed" SERP
| Pos | Domain | Type |
|-----|--------|------|
| 1 | reddit.com | Forum (r/TechSEO) |
| 2 | support.google.com | Official support thread |
| 3 | onely.com | Technical SEO agency |
| 4 | seotesting.com | SEO tool guide |
| 5 | support.wix.com | Platform support |
| 6 | forum.ghost.org | Platform forum |
| 7 | conductor.com | SEO platform academy |
| 8 | stackoverflow.com | Q&A |

**SERP features:** People Also Ask, Video, Perspectives, Related Searches. **No AI Overview.**

### Competitor Content Analysis

**Conductor** (~1,500-2,000 words actual):
- Visual diagram of indexing process
- Four-cause framework (overloaded servers, content overload, poor linking, quality)
- John Mueller quote (2021)
- Structured FAQ in academy hub

**Search Engine Land** (~1,100 words — thin):
- Gary Illyes 90% crawl budget stat
- 130-day / 75-140 day retention benchmarks
- Tech SEO Summit graph (URL indexing curve)
- GSC Inspection API with `coverageState` parameter
- No FAQ

**Onely** (~3,500-4,000 words — best):
- 6-step numbered process (most actionable)
- Temporary sitemap technique for redirects
- "Discovered vs Crawled" comparison (unique — competitors skip this)
- Adam Gent canonicalization case study
- 13 FAQ items
- No hard data/numbers

### Content Gaps (Opportunities)
1. **No page has real data** — no indexed/non-indexed ratio benchmarks at scale
2. **No monitoring/prevention angle** — all focus on one-time fixes
3. **No tool integration** — none mention using Request Indexing or similar tools for ongoing tracking
4. **The "Discovered vs Crawled" distinction** — only Onely covers this, yet it's the #1 user confusion point
5. **No quantification** — typical fix timelines, percentage recoverable, what to expect
6. **Word count sweet spot:** 2,500-3,500 words with real structure and data would outperform

---

## 6. Revised Page Plan

Based on verified data, the original 6-page plan needs adjustment:

### Recommended Pages (Priority Order)

#### Page 4.1: /fix-discovered-currently-not-indexed
- **Target:** "discovered currently not indexed" (volume unknown but high SERP activity, NO AI overview)
- **Angle:** Step-by-step diagnostic with real data (IndexCheckr stats), Googler quotes, tool integration
- **Differentiation:** Include actual benchmarks (27.4 days avg, 29.37% submission success rate), monitoring workflow using Request Indexing
- **Word target:** 2,500-3,000

#### Page 4.2: /fix-crawled-currently-not-indexed
- **Target:** "crawled currently not indexed" (volume unknown but high SERP activity, NO AI overview)
- **Angle:** Quality-focused diagnostic (Gary Illyes quotes on dupe elimination and site quality perception)
- **Differentiation:** Real case studies (Adam Gent canonicalization, LocalSearchForum duplicate content fix), EEAT checklist with specific examples
- **Word target:** 2,500-3,000

#### Page 4.3: /crawl-budget-optimization
- **Target:** "crawl budget optimization" (140/mo, KD 36)
- **Angle:** Practical guide with verified stats (Botify 58% uncrawled, Gary Illyes 90% don't need to worry)
- **Differentiation:** Decision tree for "does crawl budget even matter for your site?", specific to site size tiers
- **Word target:** 2,000-2,500

#### Page 4.4: /what-is-crawl-budget
- **Target:** "what is crawl budget" (70/mo, KD 36) + "what is crawl budget in seo" (70/mo, KD 14)
- **Angle:** Explainer/definition page, links to optimization guide
- **Differentiation:** Google's own definition, crawl rate vs crawl demand distinction, when it actually matters
- **Word target:** 1,500-2,000

### Deprioritized Pages

#### /why-page-not-indexed (DEFER)
- "why is my page not indexed" — **HAS AI OVERVIEW**, reducing organic click potential
- Very generic intent, hard to rank against Google Support #1
- Better to capture this traffic via internal linking from pages 4.1 and 4.2

#### /request-indexing-not-working (DEFER)
- "request indexing not working" — **HAS AI OVERVIEW**
- Google Support page ranks #1 (navigational intent)
- Could be a section within the existing `/request-indexing` page instead of standalone

### Revised Addressable Volume
- Crawl budget cluster: ~600/mo (verified)
- Indexing status cluster: Unknown but significant based on SERP signals
- **Total estimated: 800-1,200/mo** (conservative given unverifiable long-tail volumes)
- **Average KD: ~35** (higher than Pillar 3's ~15 avg but still achievable)

---

## 7. Content Guidelines

### Stats to Use (All Verified)
- IndexCheckr: 61.94% not indexed, 37.08% indexed, 27.4 days avg, 29.37% submission success
- Botify: 58% of large retail pages never crawled
- Google: 45% content cleaned 2023-2024, 90% of sites don't need crawl budget concern
- SEL: 130-day retention benchmark, 75-140 day crawl window

### Stats to NEVER Use
- ~~62% AI content marked crawled not indexed~~ (fabricated)
- ~~100% higher success rate for Indexing API~~ (fabricated)
- ~~40% crawl budget wasted on faceted navigation~~ (unverifiable)

### Quotes to Use (All Verified with Sources)
- Gary Illyes on dupe elimination and site quality (SEJ)
- John Mueller on API scope (SERoundTable)
- CarrieHill / noahlearner on crawl budget myths (LocalSearchForum)
- Adam Gent canonicalization case study (SEJ)

### Quotes to NEVER Use
- ~~u/SEO_Master, u/Vue_Dev, u/Niche_King~~ (all fabricated)

---

## 8. Sources (All Verified Working)

1. [Google Search Central — Page Indexing Report](https://support.google.com/webmasters/answer/7440203)
2. [IndexCheckr — Google Indexing Study (16M pages)](https://indexcheckr.com/resources/google-indexing)
3. [SEJ — Data Suggests Google Indexing Rates Are Improving](https://www.searchenginejournal.com/data-suggests-google-indexing-rates-are-improving/540700/)
4. [SEJ — Google Explains Crawled Not Indexed](https://www.searchenginejournal.com/google-explains-crawled-not-indexed/521321/)
5. [SEJ — Fixed Crawled Not Indexed (Adam Gent case study)](https://www.searchenginejournal.com/fixed-crawled-not-indexed/426038/)
6. [SERoundTable — Google Indexing API Not Working (Sept 2024)](https://www.seroundtable.com/google-indexing-api-not-working-38078.html)
7. [SERoundTable — Google Indexing API Other Content Types](https://www.seroundtable.com/google-indexing-api-other-content-types-32957.html)
8. [Botify — Crawl Budget Optimization](https://www.botify.com/blog/crawl-budget-optimization)
9. [Ahrefs — How to Fix Discovered Currently Not Indexed](https://ahrefs.com/blog/discovered-currently-not-indexed/)
10. [LocalSearchForum — Why Did Google Stop Indexing My Blog Pages](https://localsearchforum.com/threads/why-did-google-stop-indexing-only-my-blog-pages.61401/)
11. [Conductor — Discovered Not Indexed](https://www.conductor.com/academy/index-coverage/faq/discovered-not-indexed/)
12. [SEL — Understanding Discovered Currently Not Indexed](https://searchengineland.com/understanding-resolving-discovered-currently-not-indexed-392659)
13. [Onely — How to Fix Crawled Currently Not Indexed](https://www.onely.com/blog/how-to-fix-crawled-currently-not-indexed-in-google-search-console/)
14. [Stan Ventures — Google's Indexing Rates Rising](https://www.stanventures.com/news/googles-indexing-rates-are-rising-but-so-is-deindexing-2062/)
