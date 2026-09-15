# Brief: indexing-api-for-blog-posts

State: brief reviewed. Parent revision: cf640ac56542cca8850b2ce3ab773f35c8910e21.
Owner: product_writer. Brief reviewer: sources_reviewer. Coordinator: request_content_lead.

Read [COPY](../../COPY.md), [SOURCES](../../SOURCES.md), [VERIFIED-CLAIMS](../../VERIFIED-CLAIMS.md), [SCREENSHOTS](../../SCREENSHOTS.md), and the root glossary.

- File: `guides/indexing-api-for-blog-posts.md`; stable route: `/indexing-api-for-blog-posts`.
- Reader: Blog publisher without API experience.
- Question: Can I use the Indexing API for my blog?
- Outcome: Decide correctly, then use a supported recrawl path for ordinary posts.
- Claim IDs: GOOGLE-01, GOOGLE-05, GOOGLE-11, GOOGLE-12, GOOGLE-13. Source dates and qualifications remain in the shared ledger.
- Search evidence: no current measured demand. NuxtSEO unavailable; locale/Site unresolved. Old research is discovery only.
- Contribution: A worked ordinary-post decision: inspect one URL, submit a sitemap for many, then interpret the stored index result without mistaking a notification for success.
- Progressive outline: Answer no for ordinary blog posts; supported content boundary; example of a new post using inspection or sitemap; receipt versus indexing; remove unsupported risk predictions and deprecated ping.
- Exclusions: unsupported content efficacy, ranking promises, undocumented detection signals, invented tests, unrelated roadmap, and unverified pricing.
- Related articles, only at a natural decision: google-indexing-api, google-indexing-api-quota.
- Navigation: Google Indexing Guides; retain current route. Do not add Markdown H1 beneath the rendered title.
- Dates: preserve publishedAt. Set updatedAt only after actual rewrite and review.
- Visual plan: No screenshot required for this decision-focused article. Add only if a real control/result materially clarifies the task.
- Execution boundary: examples must pass syntax/type or mocked protocol checks as appropriate. No authenticated API submission is claimed. A sequential loop is not multipart batching; a per-run limit is not durable project-wide quota.
- Checks: factual review before humanization; both humanize passes with changes recorded; post-humanize meaning review; one H1, metadata/canonical, internal links/fragments, desktop/mobile render, code/table overflow, FAQ/schema consistency.

## Definitive sources

- https://developers.google.com/search/apis/indexing-api/v3/quickstart
- https://developers.google.com/search/apis/indexing-api/v3/using-api
- https://developers.google.com/search/apis/indexing-api/v3/prereqs
- https://developers.google.com/search/apis/indexing-api/v3/quota-pricing
- https://developers.google.com/search/docs/crawling-indexing/ask-google-to-recrawl

Use the ledger's additional exact URLs where claim IDs require them. Open full sources during review.

## Review record

Brief review: approved by sources_reviewer on2026-09-15 against foundation files at cf640ac5; evidence in private brief-review.md. Writer response: pending.
Factual draft review: pending. Humanize surface/structural changes: pending.
Final article review: pending. Rendered evidence: pending. Coordinator decision: pending.

## Factual draft handoff

Writer: product_writer, 15 September 2026. Base: f24859697e413ca08a79057557e811863abb3091.
Read all four foundations and the approved glossary. Reopened Google quickstart, usage, recrawl and sitemap retirement sources.
Draft replaces unsupported efficacy/risk advice with one ordinary-post example and supported alternatives.
Preserved route and publishedAt; revised title, description, readTime, related metadata and updatedAt.
Removed contradictory FAQ component and added a dated correction for prior unsupported guidance.
No API code, authenticated action or screenshot added. Factual review requested before both humanize passes.

## Humanize passes

Factual review: sources_reviewer approved eb3bc3371f9a733993c04dda7c44f2762205d525; evidence pilot-factual-review.md.
Surface pass: replaced "investigate" and "evaluate" with "check"; corrected "an URL_UPDATED"; retained precise API names. No lexical filler or dash patterns needed removal.
Structural pass: moved the apple-tree notification example to the start of the result section. Removed its repeated explanatory paragraph and the closing "Those actions answer different questions" takeaway. Turned the tool-selection sentence into a direct reader question. Preserved the simple common-case steps and later API details.
Meaning recheck: supported types, owner/full-user prerequisite, receipt versus crawling/indexing, stored versus live inspection, retired ping, dates and source URLs preserved. Read time adjusted to three minutes for the shorter article. No new efficacy claim or personal experience.

## Writer rendered handoff

Final article hash: 035e9107ba9eca4f03d6e48a0be1348b69d9d915.
Local Nuxt dev server: port3192, writer worktree. QA desktop1440 and mobile390 on15September2026.
Both direct loads have one correct H1, article title/description, production canonical, published2026-03-04 and updated2026-09-15.
Desktop has no document overflow. Mobile document width595 exceeds viewport390 due an800px absolute decorative line outside article content.
Real article-link click changes route to /google-indexing-api but destination heading never renders. Browser shows breadcrumbs only. Nuxt reports the guide page has multiple root nodes; renderer repair requires coordinator assignment.
Inspected full-page PNGs: private ri-pilot-1440.png and ri-pilot-390.png. Metadata evidence: ri-pilot-checks.json, all under ~/.dev-browser/tmp/.
No authenticated Google actions tested. Named browser page closed. Independent final review and coordinator pilot approval pending renderer repair.

## Renderer repair verification

Authorized repair moves Head inside the guide page's existing root element and adds max-w-full to the shared decorative line. Pilot prose unchanged.
Targeted ESLint and full pnpm typecheck passed. An initial useHead alternative failed strict link typing; final patch preserves the existing Head/Link interface.
Final browser checks: guide1440/390 document widths match viewport; client link to overview and browser-back both render expected H1. Comparison-to-pilot sidebar click and browser-back also render expected headings. Comparison fits390; its duplicate Markdown H1 remains assigned to the comparison rewrite.
Screenshots ri-pilot-fixed-1440.png and ri-pilot-fixed-390.png inspected. Browser pages closed. Comparison-hub card test could not establish navigation because the hub became empty during navigation; record for collection review, not a passed path.
