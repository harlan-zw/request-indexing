---
title: "Google Indexing API Quota: Limits, Strategies & How to Request Increases"
description: "Understand the Google Indexing API's 200/day default quota, how batch requests count, 429 error handling, quota increase process, and strategies for staying under the limit."
navigation:
  order: 6
  icon: i-heroicons-chart-bar
icon: i-heroicons-chart-bar
publishedAt: "2026-03-04"
updatedAt: "2026-03-04"
readTime: "8 min"
keywords:
  - google indexing api quota
  - indexing api rate limit
  - indexing api 429 error
  - indexing api quota increase
relatedPages:
  - path: /bulk-submit-urls-google-indexing-api
    title: Bulk URL Submission
  - path: /google-indexing-api
    title: Complete API Guide
---

The Google Indexing API has strict quota and rate limits. Understanding these limits and how to work within them is essential for any indexing workflow, whether you're submitting a handful of URLs per day or managing a large-scale site.

## Default Quota Limits

| Limit | Default | Scope |
|---|---|---|
| **Publish requests** (URL_UPDATED / URL_DELETED) | 200 per day | Per GCP project |
| **getMetadata requests** | 180 per minute | Per GCP project |
| **Batch request size** | Max 100 requests per HTTP call | Per request |

The publish quota is the one that matters most. You get 200 URL submissions per day across all websites using the same Google Cloud project. The quota resets daily at midnight Pacific Time.

### How Batch Requests Affect Quota

This is a critical detail that many guides get wrong: **batch requests don't save quota.**

Google's documentation is explicit:

> "Quota is counted at the URL level. For example, if you combine 10 requests into a single HTTP request, it still counts as 10 requests for your quota."

A batch of 100 URLs uses 100 quota. The batch endpoint only reduces HTTP overhead (fewer connections, less latency) — it doesn't reduce quota consumption.

### What Counts Against Quota

| Action | Quota Impact |
|---|---|
| `URL_UPDATED` publish request | 1 per URL |
| `URL_DELETED` publish request | 1 per URL |
| `getMetadata` request | Separate limit (180/min) |
| Failed requests (400, 403, 404) | Still counts against quota |
| Requests returning 429 | Does not count (quota already exhausted) |

Note that **failed requests still consume quota** (except 429 responses, which indicate the quota is already exhausted). A malformed URL that returns 400 Bad Request still uses one quota unit.

## Handling 429 Errors

When you exceed the daily quota, the API returns:

```
429 Too Many Requests: Quota exceeded for quota metric 'Publish requests'
and limit 'Publish requests per day' of service 'indexing.googleapis.com'
```

### During Batch Requests

If you send a batch of 10 requests when you have 3 quota remaining:

- Requests 1–3: Process normally (200 OK)
- Requests 4–10: Return 429 individually within the multipart response

Each request in a batch is evaluated independently against remaining quota.

### Handling Strategy

```typescript
async function submitWithQuotaHandling(url: string) {
  return indexing.urlNotifications.publish({
    requestBody: { url, type: 'URL_UPDATED' },
  })
    .then(res => ({ url, success: true, data: res.data }))
    .catch((err) => {
      const status = err.response?.status

      if (status === 429) {
        // Quota exhausted — stop all submissions until reset
        console.log(`Quota exceeded. Resume after midnight PT.`)
        return { url, success: false, quotaExceeded: true }
      }

      if (status === 500 || status === 503) {
        // Server error — retry with exponential backoff
        return { url, success: false, retryable: true }
      }

      // Other errors (400, 401, 403) — don't retry
      return {
        url,
        success: false,
        error: err.response?.data?.error?.message,
      }
    })
}
```

## Checking Your Current Quota Usage

### Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services > Enabled APIs & services**
3. Click on **Web Search Indexing API**
4. Go to the **Quotas** tab

This shows your current usage, remaining quota, and when the quota resets.

### Programmatic Tracking

Track quota usage in your application:

```typescript
const DAILY_QUOTA = 200
let quotaUsed = 0

async function submitUrl(url: string) {
  if (quotaUsed >= DAILY_QUOTA) {
    console.log(`Quota exhausted (${quotaUsed}/${DAILY_QUOTA}). Skipping.`)
    return { url, success: false, error: 'Local quota limit reached' }
  }

  const result = await submitWithQuotaHandling(url)

  if (result.success) {
    quotaUsed++
    console.log(`[${quotaUsed}/${DAILY_QUOTA}] Submitted: ${url}`)
  }

  return result
}
```

## Requesting a Quota Increase

If 200/day isn't enough, you can request an increase through the Google Cloud Console.

### How to Request

1. Go to **Google Cloud Console > APIs & Services > Enabled APIs**
2. Click on **Web Search Indexing API**
3. Go to the **Quotas** tab
4. Click on the quota you want to increase (Publish requests per day)
5. Click **Edit Quotas** (or the pencil icon)
6. Enter your requested limit and a justification
7. Submit the request

### What Google Requires

Google evaluates quota increase requests based on:

- **Content type:** They strongly prefer sites using the API for officially supported content (JobPosting or BroadcastEvent). Requests for blog or e-commerce content are more likely to be declined. For more context on the risks, see our guide on [using the API for blog posts](/indexing-api-for-blog-posts).
- **Justification:** You need to explain why the default quota is insufficient. "I have 5,000 job listings that update daily" is a strong justification. "I want to submit my blog posts faster" is not.
- **Usage history:** Google reviews your existing API usage patterns. Consistent, legitimate usage supports your case.

### Typical Outcomes

- **Job boards / livestream sites:** Usually approved, sometimes to 1,000+ per day
- **E-commerce with JobPosting schema:** Sometimes approved with justification
- **General content sites:** Rarely approved, though some users report success with strong justifications about content freshness

### Timeline

Quota increase requests are typically reviewed within 2–5 business days. Google may approve a lower limit than requested.

## Strategies for Staying Under Quota

### 1. Prioritize New Content

Only submit URLs when you publish new content or make significant updates. Don't re-submit URLs that are already indexed — it wastes quota and provides no benefit.

### 2. Track What's Already Submitted

Maintain a log of submitted URLs and their timestamps:

```typescript
const submitted = new Map<string, Date>()

function shouldSubmit(url: string): boolean {
  const lastSubmitted = submitted.get(url)

  // Never submitted — always submit
  if (!lastSubmitted)
    return true

  // Don't re-submit within 7 days
  const daysSince = (Date.now() - lastSubmitted.getTime()) / (1000 * 60 * 60 * 24)
  return daysSince > 7
}
```

### 3. Use Sitemaps for Bulk Discovery

For large sites, let Google discover most pages through your sitemap. Reserve the Indexing API quota for:

- Time-sensitive content (breaking news, flash sales)
- Important pages that need to be indexed quickly
- Pages that have been stuck in "Discovered - currently not indexed" status

### 4. Batch Efficiently

While batching doesn't save quota, it does reduce latency. Submit URLs in batches of 50–100 rather than one at a time. This completes faster and makes better use of your time window.

### 5. Monitor and Adjust

If you're consistently hitting the 200/day limit, audit your submission patterns:

- Are you submitting pages that don't need the API? (Pages that Googlebot crawls naturally within days)
- Are you re-submitting unchanged pages?
- Can some URLs wait for natural crawling?

## Quota Stacking Risks

Some users create multiple Google Cloud projects, each with its own 200/day quota, to effectively multiply their submission limit. This is called **quota stacking**.

Google monitors for this pattern and considers it abuse. Risks include:

- **API access revocation** for all projects associated with your Google account
- **Detection through shared service accounts** — if the same service account email appears across multiple projects
- **Detection through submission patterns** — if multiple projects submit URLs for the same Search Console property

The Indexing API documentation warns that *"any attempt to bypass quotas or use the API for invalid content types may result in access being revoked."*

If you genuinely need more than 200/day, request a quota increase through the official process rather than stacking projects.

## Frequently Asked Questions

::content-faq
---
items:
  - question: "When does the daily quota reset?"
    answer: "The quota resets at midnight Pacific Time (UTC-8 or UTC-7 during daylight saving time). You can verify the exact reset time in the Google Cloud Console under APIs & Services > Quotas."
  - question: "Does the 200/day limit apply per website or per GCP project?"
    answer: "Per GCP project. If you use one GCP project for multiple websites, all websites share the same 200/day quota. Creating separate GCP projects for each site gives each project its own quota, but be aware of quota stacking risks."
  - question: "Do failed requests count against my quota?"
    answer: "Yes, most failed requests (400, 401, 403, 404) still consume quota. The exception is 429 responses, which indicate your quota is already exhausted."
  - question: "Can I pay for a higher quota?"
    answer: "No. The Indexing API is free and doesn't have paid tiers. Quota increases are granted on a case-by-case basis through the Google Cloud Console request process."
  - question: "What's the difference between the publish quota and the getMetadata quota?"
    answer: "The publish quota (200/day) applies to URL_UPDATED and URL_DELETED requests. The getMetadata quota (180/minute) applies to checking notification status. They're tracked separately — using getMetadata doesn't reduce your publish quota."
---
::
