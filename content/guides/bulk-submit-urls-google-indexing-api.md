---
title: "How to Bulk Submit URLs to the Google Indexing API"
description: "Submit hundreds of URLs to Google's Indexing API efficiently. Learn the batch endpoint format, build queue strategies in Node.js and Python, and manage quota across large sites."
navigation:
  order: 4
  icon: i-heroicons-arrow-up-tray
icon: i-heroicons-arrow-up-tray
publishedAt: "2026-03-04"
updatedAt: "2026-03-04"
readTime: "12 min"
keywords:
  - bulk submit urls google indexing api
  - bulk url indexing
  - google indexing api batch
  - bulk request indexing google
relatedPages:
  - path: /google-indexing-api-node-js
    title: Node.js Implementation
  - path: /google-indexing-api-quota
    title: Quota & Rate Limits
---

When you have dozens or hundreds of URLs that need indexing, submitting them one at a time is impractical. The Google Indexing API supports batch requests that combine up to 100 API calls into a single HTTP request, and with the right queue strategy, you can manage large-scale indexing workflows within the 200/day quota limit.

This guide covers the batch endpoint format, practical submission scripts, queue strategies, and tools that simplify bulk indexing.

## The Batch Endpoint

The Indexing API's batch endpoint accepts multiple publish requests in a single HTTP call:

```
POST https://indexing.googleapis.com/batch
```

### Request Format

Batch requests use `multipart/mixed` content type. Each part contains an individual API request:

```http
POST /batch HTTP/1.1
Content-Type: multipart/mixed; boundary=batch_indexing
Authorization: Bearer YOUR_ACCESS_TOKEN

--batch_indexing
Content-Type: application/http
Content-ID: <item1>

POST /v3/urlNotifications:publish HTTP/1.1
Content-Type: application/json

{"url": "https://example.com/page-1", "type": "URL_UPDATED"}
--batch_indexing
Content-Type: application/http
Content-ID: <item2>

POST /v3/urlNotifications:publish HTTP/1.1
Content-Type: application/json

{"url": "https://example.com/page-2", "type": "URL_UPDATED"}
--batch_indexing--
```

### Key Rules

- **Maximum 100 requests per batch.** Exceeding this returns `400 Bad Request: Batch size too large`.
- **Quota counts per URL, not per HTTP request.** Google explicitly states: *"If you combine 10 requests into a single HTTP request, it still counts as 10 requests for your quota."* ([Source](https://developers.google.com/search/apis/indexing-api/v3/using-api))
- **Independent results.** Each request in the batch succeeds or fails independently. If one URL returns a 400 error, the others still process normally.
- **Partial quota failures.** If you're at 199/200 quota and submit a batch of 10, the first request succeeds and the remaining 9 return 429 errors. See our [quota management guide](/google-indexing-api-quota) for details on requesting higher limits.

## Node.js Bulk Submission Script

A complete, production-ready script for bulk submission with queue management. For a broader overview of using the API in Node, see our [Node.js implementation guide](/google-indexing-api-node-js):

```typescript
import { readFileSync } from 'node:fs'
import { google } from 'googleapis'

// --- Configuration ---
const KEY_FILE = './service-account.json'
const DAILY_QUOTA = 200
const BATCH_SIZE = 50 // Stay under 100 for safety
const DELAY_BETWEEN_BATCHES_MS = 2000

// --- Auth setup ---
const auth = new google.auth.GoogleAuth({
  keyFile: KEY_FILE,
  scopes: ['https://www.googleapis.com/auth/indexing'],
})
const indexing = google.indexing({ version: 'v3', auth })

// --- Results tracking ---
interface SubmissionResult {
  url: string
  success: boolean
  error?: string
}

async function submitUrl(url: string): Promise<SubmissionResult> {
  return indexing.urlNotifications.publish({
    requestBody: { url, type: 'URL_UPDATED' },
  })
    .then(() => ({ url, success: true }))
    .catch(err => ({
      url,
      success: false,
      error: err.response?.data?.error?.message || err.message,
    }))
}

async function submitBatch(urls: string[]): Promise<SubmissionResult[]> {
  const results: SubmissionResult[] = []

  for (const url of urls) {
    const result = await submitUrl(url)
    results.push(result)

    if (!result.success && result.error?.includes('429')) {
      console.log('Quota exceeded. Stopping.')
      // Mark remaining URLs as failed
      const remaining = urls.slice(urls.indexOf(url) + 1)
      results.push(...remaining.map(u => ({
        url: u,
        success: false,
        error: 'Skipped — quota exceeded',
      })))
      break
    }
  }

  return results
}

async function bulkSubmit(urls: string[]) {
  console.log(`Submitting ${urls.length} URLs (quota: ${DAILY_QUOTA}/day)`)

  const allResults: SubmissionResult[] = []
  const batches = []

  // Split into batches
  for (let i = 0; i < urls.length; i += BATCH_SIZE) {
    batches.push(urls.slice(i, i + BATCH_SIZE))
  }

  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i]
    console.log(`\nBatch ${i + 1}/${batches.length} (${batch.length} URLs)`)

    const results = await submitBatch(batch)
    allResults.push(...results)

    const succeeded = results.filter(r => r.success).length
    const failed = results.filter(r => !r.success).length
    console.log(`  ${succeeded} submitted, ${failed} failed`)

    // Check if quota is exceeded
    if (results.some(r => r.error?.includes('429')))
      break

    // Delay between batches
    if (i < batches.length - 1) {
      await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES_MS))
    }
  }

  // Summary
  const totalSuccess = allResults.filter(r => r.success).length
  const totalFailed = allResults.filter(r => !r.success).length
  console.log(`\nDone: ${totalSuccess} submitted, ${totalFailed} failed`)

  // Log failures
  const failures = allResults.filter(r => !r.success)
  if (failures.length > 0) {
    console.log('\nFailed URLs:')
    failures.forEach(f => console.log(`  ${f.url} — ${f.error}`))
  }

  return allResults
}

// --- Load URLs and run ---
// Expects a text file with one URL per line
const urls = readFileSync('urls.txt', 'utf-8')
  .split('\n')
  .map(line => line.trim())
  .filter(Boolean)
  .slice(0, DAILY_QUOTA) // Never exceed daily quota

bulkSubmit(urls)
```

### Usage

1. Create a `urls.txt` file with one URL per line
2. Place your `service-account.json` in the same directory
3. Run: `npx tsx bulk-submit.ts`

## Python Bulk Submission Script

```python
import time
from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

# --- Configuration ---
KEY_FILE = 'service-account.json'
DAILY_QUOTA = 200
BATCH_SIZE = 50
DELAY_BETWEEN_BATCHES = 2  # seconds

# --- Auth setup ---
SCOPES = ['https://www.googleapis.com/auth/indexing']
credentials = service_account.Credentials.from_service_account_file(
    KEY_FILE, scopes=SCOPES
)
service = build('indexing', 'v3', credentials=credentials)


def submit_url(url):
    """Submit a single URL and return result."""
    try:
        response = service.urlNotifications().publish(
            body={'url': url, 'type': 'URL_UPDATED'}
        ).execute()
        return {'url': url, 'success': True}
    except HttpError as e:
        return {
            'url': url,
            'success': False,
            'error': f'{e.resp.status}: {e.reason}'
        }


def bulk_submit(urls):
    """Submit URLs in batches with quota management."""
    print(f'Submitting {len(urls)} URLs (quota: {DAILY_QUOTA}/day)')

    results = []
    quota_exceeded = False

    for i in range(0, len(urls), BATCH_SIZE):
        if quota_exceeded:
            break

        batch = urls[i:i + BATCH_SIZE]
        batch_num = (i // BATCH_SIZE) + 1
        total_batches = (len(urls) + BATCH_SIZE - 1) // BATCH_SIZE
        print(f'\nBatch {batch_num}/{total_batches} ({len(batch)} URLs)')

        for url in batch:
            result = submit_url(url)
            results.append(result)

            if not result['success'] and '429' in str(result.get('error', '')):
                print('Quota exceeded. Stopping.')
                quota_exceeded = True
                break

        succeeded = sum(1 for r in results if r['success'])
        failed = sum(1 for r in results if not r['success'])
        print(f'  Running total: {succeeded} submitted, {failed} failed')

        # Delay between batches
        if not quota_exceeded and i + BATCH_SIZE < len(urls):
            time.sleep(DELAY_BETWEEN_BATCHES)

    # Summary
    succeeded = sum(1 for r in results if r['success'])
    failed = sum(1 for r in results if not r['success'])
    print(f'\nDone: {succeeded} submitted, {failed} failed')

    failures = [r for r in results if not r['success']]
    if failures:
        print('\nFailed URLs:')
        for f in failures:
            print(f'  {f["url"]} — {f.get("error", "Unknown")}')

    return results


# --- Load URLs and run ---
with open('urls.txt') as f:
    urls = [line.strip() for line in f if line.strip()]

# Never exceed daily quota
urls = urls[:DAILY_QUOTA]
bulk_submit(urls)
```

## Queue Strategies

When you have more URLs than your daily quota allows, you need a queue strategy.

### Priority Queue

Not all URLs are equally important. Prioritize based on:

1. **New content** — Pages that have never been indexed
2. **Updated content** — Pages with significant content changes
3. **High-value pages** — Revenue-generating or high-traffic pages
4. **Re-submissions** — Pages that were submitted but not indexed

```typescript
interface QueueItem {
  url: string
  priority: number // 1 = highest
  addedAt: Date
}

function prioritizeQueue(items: QueueItem[]): QueueItem[] {
  return items.sort((a, b) => {
    // First by priority (lower = higher priority)
    if (a.priority !== b.priority)
      return a.priority - b.priority
    // Then by age (older items first)
    return a.addedAt.getTime() - b.addedAt.getTime()
  })
}
```

### Daily Rolling Queue

For sites that publish content continuously, process a rolling queue each day:

```typescript
// Pseudo-code for a daily queue processor
async function processDailyQueue(allUrls: string[]) {
  const DAILY_LIMIT = 200
  const stateFile = 'queue-state.json'

  // Load state: which URLs have been submitted and when
  const state = JSON.parse(readFileSync(stateFile, 'utf-8').toString())
  const lastProcessedIndex = state.lastIndex || 0

  // Get next batch
  const todaysBatch = allUrls.slice(lastProcessedIndex, lastProcessedIndex + DAILY_LIMIT)

  if (todaysBatch.length === 0) {
    console.log('All URLs have been submitted.')
    return
  }

  // Submit
  const results = await bulkSubmit(todaysBatch)
  const succeeded = results.filter(r => r.success).length

  // Update state
  state.lastIndex = lastProcessedIndex + succeeded
  state.lastRun = new Date().toISOString()
  writeFileSync(stateFile, JSON.stringify(state, null, 2))

  console.log(`Progress: ${state.lastIndex}/${allUrls.length}`)
}
```

## Sitemap-Driven Bulk Submission

Parse your sitemap.xml to get all URLs, then submit them through the queue:

```typescript
import { parseStringPromise } from 'xml2js'

async function getUrlsFromSitemap(sitemapUrl: string): Promise<string[]> {
  const response = await fetch(sitemapUrl)
  const xml = await response.text()
  const parsed = await parseStringPromise(xml)

  // Handle sitemap index (contains other sitemaps)
  if (parsed.sitemapindex) {
    const sitemapUrls = parsed.sitemapindex.sitemap.map(
      (s: any) => s.loc[0]
    )
    const allUrls: string[] = []
    for (const url of sitemapUrls) {
      const urls = await getUrlsFromSitemap(url)
      allUrls.push(...urls)
    }
    return allUrls
  }

  // Handle regular sitemap
  return parsed.urlset.url.map((entry: any) => entry.loc[0])
}

// Usage
const urls = await getUrlsFromSitemap('https://example.com/sitemap.xml')
console.log(`Found ${urls.length} URLs in sitemap`)
```

## Tools Comparison

If you'd rather not write scripts, several tools handle bulk submission:

| Tool | Type | URLs/Day | Setup | Cost |
|---|---|---|---|---|
| **[Request Indexing](/)** | Web App | 200 | Connect Google account | Free |
| **[google-indexing-script](https://github.com/goenning/google-indexing-script)** | CLI | 200 | Service account JSON | Free |
| **Custom Script** (this guide) | Code | 200 | Service account JSON | Free |
| **WordPress plugins** (Rank Math, etc.) | Plugin | 200 | Plugin settings | Free–Paid |

All tools are limited by the same 200/day quota from Google. The difference is in setup complexity and integration features.

[Request Indexing](/) is the simplest approach — connect your Google account, select your sites, and submit URLs from a dashboard. No service account setup, no code, no CLI.

## Monitoring Submissions

After bulk submission, verify your URLs are being indexed:

1. **Check server logs** — Look for Googlebot crawls on submitted URLs within 24 hours
2. **URL Inspection** in Search Console — Check individual URLs for indexing status
3. **Coverage report** in Search Console — Monitor overall indexed page count
4. **getMetadata endpoint** — Programmatically check notification status

```typescript
async function checkSubmissionStatus(urls: string[]) {
  for (const url of urls) {
    const status = await indexing.urlNotifications.getMetadata({ url })
      .then(res => res.data)
      .catch(() => null)

    if (status) {
      console.log(`${url}: Last notified ${status.latestUpdate?.notifyTime}`)
    }
    else {
      console.log(`${url}: No notification found`)
    }
  }
}
```

## Frequently Asked Questions

::content-faq
---
items:
  - question: "Can I submit more than 200 URLs per day?"
    answer: "The default quota is 200 publish requests per day per GCP project. You can request a quota increase through the Google Cloud Console, but Google typically requires proof that you're using the API for officially supported content types (JobPosting or BroadcastEvent)."
  - question: "Does batching save quota?"
    answer: "No. Google counts quota per URL, not per HTTP request. A batch of 100 URLs uses 100 quota, same as 100 individual requests. Batching only reduces HTTP overhead and latency."
  - question: "What happens if one URL in a batch fails?"
    answer: "Each request in a batch is processed independently. If one URL has a malformed format and returns 400, the other URLs in the batch still process normally."
  - question: "Can I use multiple GCP projects to increase my total quota?"
    answer: "Technically each GCP project has its own 200/day quota. However, Google monitors for quota stacking and may revoke API access if they detect abuse. This is especially risky for non-job content."
  - question: "Should I submit URLs every day or only when content changes?"
    answer: "Only submit URLs when you have new or updated content. Repeatedly submitting unchanged URLs wastes quota and doesn't provide any benefit — Google won't re-index a page just because you submitted it again."
---
::
