# Troubleshooting Indexing Problems (2026 Solutions)

## The Diagnostic Tree
When a URL isn't indexing, the solution depends on the specific GSC status. In 2026, these statuses are "quality filters" more than technical errors.

### 1. "Discovered - currently not indexed" (Discovery Delay)
- **Problem:** Google knows the URL exists but hasn't crawled it yet.
- **2026 Meaning:** Google is low on "crawl budget" or doesn't believe your site is high-priority enough to warrant a visit.
- **The 2026 Solution:**
  1. **Indexing API (Immediate):** Force a crawl by "active notification." 80% of "Discovered" pages index within 24h when the API is triggered.
  2. **Internal Linking (Mid-term):** Add 3-5 links from your *already indexed* high-authority pages to the new URL.
  3. **Social Pinging (Short-term):** Share the link on Twitter/X or LinkedIn. Googlebot follows social link discovery fast.
  4. **The "Wait" Period:** Natural discovery on low-authority sites can now take **6-12 months**.

### 2. "Crawled - currently not indexed" (Quality Filter)
- **Problem:** Googlebot visited, rendered, and read the page, but decided it wasn't worth adding to the index.
- **2026 Meaning:** Your content failed the "Helpful Content" or "Uniqueness" threshold.
- **The 2026 Solution:**
  1. **Uniqueness Audit:** Compare your content with top-ranking results. If you are re-stating common knowledge with no new data/images/opinion, you will likely stay excluded.
  2. **EEAT Upgrade:** Add a clear author bio, cite reputable sources, and add first-hand experience (e.g., "I tested this tool for 30 days and here are the results").
  3. **Hydration Check (Nuxt/JS):** Ensure Googlebot isn't seeing a "blank screen" during rendering. Use the "Live Test" in GSC to see the rendered HTML.
  4. **Thin Content Check:** Ensure the page has more than 500-800 words of *original* text (not just AI-fluff).

### 3. "Excluded by noindex" (Technical Error)
- **Problem:** You accidentally left a `noindex` tag in your header.
- **2026 Note:** Nuxt developers often leave `robots: 'noindex'` in their `nuxt.config.ts` during development. Double-check your environment variables.

### 4. "Soft 404" (The Quality Ghost)
- **Problem:** The page exists, but Google thinks it should be a 404 (often because it's too thin).
- **Solution:** Add more substantial content or redirect to a more relevant page.

## Citable Stats (2026)
- **The "Uniqueness" Threshold:** 62% of purely AI-generated datasets without unique "human" analysis are now marked "Crawled - currently not indexed" by Google's 2025 classifiers. [Source: SEO Tech Summit 2025]
- **API Efficacy:** The Indexing API has a **100% higher success rate** for converting "Discovered" to "Indexed" than sitemap re-submission. [Source: Ziptie.dev 2025 Study]
- **Crawl Budget Wastage:** 40% of crawl budget on large e-commerce sites is wasted on "faceted navigation" (infinite filter combinations).

## Reddit Thread Quotes
- *"If you're in 'Crawled - not indexed', don't keep pinging the API. You need to rewrite the content. Google saw it and didn't like it."* (u/SEO_Master, r/TechSEO)
- *"My Nuxt site was stuck in 'Discovered' for months until I used the Indexing API. Within 4 hours, everything was green."* (u/Vue_Dev, r/Nuxt)
- *"Google's 'Discovered' status is basically their way of saying 'I'll get to you when you prove you're not spam'."* (u/Niche_King, r/Blogging)

## Recommended Fix Flowchart
1. **Is it 'Discovered'?** -> Use Indexing API -> Wait 48h -> Fixed? Yes/No
2. **Is it 'Crawled'?** -> Add original data/EEAT -> Re-request Indexing -> Wait 7 days -> Fixed? Yes/No
3. **Still not fixed?** -> Site-wide authority check. You might be in an "algorithmic sandbox."

## Sources
- [Ahrefs - How to Fix 'Discovered - Currently Not Indexed'](https://ahrefs.com/blog/discovered-currently-not-indexed/)
- [Search Engine Journal - 10 Common Indexing Problems](https://www.searchenginejournal.com/google-indexing-problems/45123/)
- [Google Search Central - Page Indexing Report](https://support.google.com/webmasters/answer/7440203)
- [Ziptie.dev - Why Google is Indexing Less in 2025](https://ziptie.dev/indexing-trends-2025/)
