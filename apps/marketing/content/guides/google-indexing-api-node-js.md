---
title: "Google Indexing API with Node.js: Complete Implementation Guide"
description: "Implement the Google Indexing API in Node.js and TypeScript. Covers authentication, single URL submission, batch requests, error handling, and production-ready patterns."
navigation:
  order: 3
  icon: i-simple-icons-nodedotjs
icon: i-simple-icons-nodedotjs
publishedAt: "2026-03-04"
updatedAt: "2026-03-04"
readTime: "10 min"
keywords:
  - google indexing api node js
  - google indexing api javascript
  - google indexing api typescript
  - googleapis indexing npm
relatedPages:
  - path: /google-indexing-api-tutorial
    title: Setup Tutorial
  - path: /bulk-submit-urls-google-indexing-api
    title: Bulk URL Submission
---

This guide covers everything you need to implement the Google Indexing API in a Node.js or TypeScript project — from initial setup to production-ready code with error handling, batch requests, and retry logic.

**Prerequisites:** You need a Google Cloud project with the Indexing API enabled and a service account JSON key. If you haven't done this yet, follow our [setup tutorial](/google-indexing-api-tutorial) first.

## Installation

Install the official Google APIs client library:

```bash
npm install googleapis
```

Or if you prefer a lighter package that only includes the Indexing API:

```bash
npm install @googleapis/indexing google-auth-library
```

The `googleapis` package (~70MB) includes every Google API client. The `@googleapis/indexing` package (~8,400 weekly downloads) is much smaller and only includes what you need. Both work identically for the Indexing API.

## Authentication Setup

### Using a JSON Key File

The simplest approach — reference your service account JSON key directly:

```typescript
import { google } from 'googleapis'

const auth = new google.auth.GoogleAuth({
  keyFile: './service-account.json',
  scopes: ['https://www.googleapis.com/auth/indexing'],
})

const indexing = google.indexing({ version: 'v3', auth })
```

### Using Environment Variables

For production deployments, load credentials from environment variables instead of a file:

```typescript
import { google } from 'googleapis'

const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  },
  scopes: ['https://www.googleapis.com/auth/indexing'],
})

const indexing = google.indexing({ version: 'v3', auth })
```

Note the `.replace(/\\n/g, '\n')` on the private key — this is critical. Environment variables often escape newlines as literal `\n` strings, but the PEM format requires actual newline characters. Without this, you'll get a `PEM routines: get_name: no start line` error.

### Using JWT Client Directly

An alternative authentication approach using the JWT client:

```typescript
import { google } from 'googleapis'
import key from './service-account.json' assert { type: 'json' }

const jwtClient = new google.auth.JWT(
  key.client_email,
  undefined,
  key.private_key,
  ['https://www.googleapis.com/auth/indexing'],
)

await jwtClient.authorize()

const indexing = google.indexing({ version: 'v3', auth: jwtClient })
```

## Submitting a Single URL

The most basic operation — notify Google that a URL has been updated:

```typescript
async function submitUrl(url: string, type: 'URL_UPDATED' | 'URL_DELETED' = 'URL_UPDATED') {
  const response = await indexing.urlNotifications.publish({
    requestBody: { url, type },
  })
  return response.data
}

// Usage
const result = await submitUrl('https://example.com/my-page')
console.log('Notification sent:', result.urlNotificationMetadata?.latestUpdate?.notifyTime)
```

## Checking Notification Status

Query whether Google received a notification for a specific URL:

```typescript
async function getStatus(url: string) {
  const response = await indexing.urlNotifications.getMetadata({
    url,
  })
  return response.data
}

const status = await getStatus('https://example.com/my-page')
console.log('Last notification:', status.latestUpdate)
```

This only confirms Google received your notification. It does **not** tell you whether the page was indexed.

## Batch Requests

Submit up to 100 URLs in a single HTTP request. The batch endpoint uses `multipart/mixed` format. The `googleapis` library handles the formatting for you:

```typescript
import { google } from 'googleapis'

const auth = new google.auth.GoogleAuth({
  keyFile: './service-account.json',
  scopes: ['https://www.googleapis.com/auth/indexing'],
})

async function submitBatch(urls: string[]) {
  const indexing = google.indexing({ version: 'v3', auth })
  const batch = new google.batching.Batch()

  const results: Array<{ url: string, success: boolean, error?: string }> = []

  for (const url of urls) {
    batch.add(
      indexing.urlNotifications.publish({
        requestBody: { url, type: 'URL_UPDATED' },
      })
    )
  }

  const responses = await batch.execute()

  return responses
}
```

Batch requests count against your quota individually — 100 URLs in one batch = 100 quota used, not 1. For more details on handling batch submissions at scale, see our [bulk submission guide](/bulk-submit-urls-google-indexing-api).

### Manual Batch Requests with fetch

If you want full control over the batch request format:

```typescript
async function submitBatchManual(urls: string[], accessToken: string) {
  const boundary = 'batch_indexing'
  const body = `${urls.map((url, i) => [
    `--${boundary}`,
    'Content-Type: application/http',
    `Content-ID: <item${i + 1}>`,
    '',
    'POST /v3/urlNotifications:publish HTTP/1.1',
    'Content-Type: application/json',
    '',
    JSON.stringify({ url, type: 'URL_UPDATED' }),
  ].join('\r\n')).join('\r\n')}\r\n--${boundary}--`

  const response = await fetch('https://indexing.googleapis.com/batch', {
    method: 'POST',
    headers: {
      'Content-Type': `multipart/mixed; boundary=${boundary}`,
      'Authorization': `Bearer ${accessToken}`,
    },
    body,
  })

  return response.text()
}
```

## Error Handling

A production-ready wrapper that handles common error scenarios:

```typescript
import { GaxiosError } from 'googleapis-common'

interface IndexingResult {
  url: string
  success: boolean
  error?: string
  retryable: boolean
}

async function submitUrlSafe(url: string): Promise<IndexingResult> {
  return indexing.urlNotifications.publish({
    requestBody: { url, type: 'URL_UPDATED' },
  })
    .then(() => ({ url, success: true, retryable: false }))
    .catch((error: GaxiosError) => {
      const status = error.response?.status
      const message = error.response?.data?.error?.message || error.message

      // Determine if this error is retryable
      const retryable = status === 429 || status === 500 || status === 503

      return { url, success: false, error: `${status}: ${message}`, retryable }
    })
}
```

### Retry with Exponential Backoff

For retryable errors (429, 500, 503), implement exponential backoff:

```typescript
async function submitWithRetry(
  url: string,
  maxRetries = 3,
  baseDelay = 1000,
): Promise<IndexingResult> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const result = await submitUrlSafe(url)

    if (result.success || !result.retryable || attempt === maxRetries) {
      return result
    }

    // Exponential backoff: 1s, 2s, 4s
    const delay = baseDelay * 2 ** attempt
    await new Promise(resolve => setTimeout(resolve, delay))
  }

  // TypeScript: unreachable, but satisfies the compiler
  return { url, success: false, error: 'Max retries exceeded', retryable: false }
}
```

## Production Patterns

### Queue-Based Submission

For sites that publish content throughout the day, use a queue to batch submissions and respect the daily limit. (Read more about [managing your API quota](/google-indexing-api-quota)).

```typescript
const DAILY_QUOTA = 200
let usedToday = 0
const queue: string[] = []

function enqueueUrl(url: string) {
  queue.push(url)
  processQueue()
}

async function processQueue() {
  while (queue.length > 0 && usedToday < DAILY_QUOTA) {
    const url = queue.shift()!
    const result = await submitWithRetry(url)

    if (result.success) {
      usedToday++
      console.log(`[${usedToday}/${DAILY_QUOTA}] Submitted: ${url}`)
    }
    else if (result.error?.startsWith('429')) {
      // Quota exceeded — put it back and stop
      queue.unshift(url)
      console.log('Quota exceeded. Stopping until reset.')
      break
    }
    else {
      console.error(`Failed: ${url} — ${result.error}`)
    }
  }
}
```

### CMS Integration Hook

Trigger indexing when content is published in your CMS or framework:

```typescript
// Example: Nuxt server route
export default defineEventHandler(async (event) => {
  const { url } = await readBody(event)

  const result = await submitWithRetry(url)

  if (!result.success)
    throw createError({ statusCode: 502, message: result.error })

  return { submitted: true, url }
})
```

### Sitemap-Driven Submission

Parse your sitemap and submit all URLs:

```typescript
import { parseStringPromise } from 'xml2js'

async function submitFromSitemap(sitemapUrl: string) {
  const response = await fetch(sitemapUrl)
  const xml = await response.text()
  const parsed = await parseStringPromise(xml)

  const urls: string[] = parsed.urlset.url.map(
    (entry: any) => entry.loc[0]
  )

  console.log(`Found ${urls.length} URLs in sitemap`)

  const results = []
  for (const url of urls.slice(0, DAILY_QUOTA)) {
    results.push(await submitWithRetry(url))
    // Small delay between requests to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100))
  }

  const succeeded = results.filter(r => r.success).length
  const failed = results.filter(r => !r.success).length
  console.log(`Results: ${succeeded} submitted, ${failed} failed`)

  return results
}
```

## Ecosystem Comparison

| Tool | Type | Best For |
|---|---|---|
| **`googleapis`** | Library | Full Google API access, production apps |
| **`@googleapis/indexing`** | Library | Lightweight, Indexing API only |
| **[google-indexing-script](https://github.com/goenning/google-indexing-script)** | CLI Tool | Quick one-time bulk submission |
| **[Request Indexing](/)** | Web App | No-code, dashboard, GSC integration |

For most Node.js applications, `googleapis` (or `@googleapis/indexing`) is the right choice. It handles authentication, token refresh, and request formatting. The `google-indexing-script` CLI tool (7,500+ GitHub stars) is useful for one-off bulk submissions but isn't designed for integration into application code.

## Complete Working Example

Here's a self-contained script you can run immediately:

```typescript
import { google } from 'googleapis'

// --- Configuration ---
const KEY_FILE = './service-account.json'
const URLS_TO_SUBMIT = [
  'https://example.com/page-1',
  'https://example.com/page-2',
  'https://example.com/page-3',
]

// --- Setup ---
const auth = new google.auth.GoogleAuth({
  keyFile: KEY_FILE,
  scopes: ['https://www.googleapis.com/auth/indexing'],
})
const indexing = google.indexing({ version: 'v3', auth })

// --- Submit URLs ---
for (const url of URLS_TO_SUBMIT) {
  const result = await indexing.urlNotifications.publish({
    requestBody: { url, type: 'URL_UPDATED' },
  })
    .then(res => ({ url, success: true, time: res.data.urlNotificationMetadata?.latestUpdate?.notifyTime }))
    .catch(err => ({ url, success: false, error: err.response?.data?.error?.message || err.message }))

  if (result.success) {
    console.log(`Submitted: ${url}`)
  }
  else {
    console.error(`Failed: ${url} — ${result.error}`)
  }
}
```

Save this as `submit-urls.ts`, place your `service-account.json` in the same directory, update the URLs array, and run with `npx tsx submit-urls.ts`.

## Frequently Asked Questions

::content-faq
---
items:
  - question: "Should I use googleapis or @googleapis/indexing?"
    answer: "If you only need the Indexing API, use @googleapis/indexing for a smaller bundle. If you also use other Google APIs (Search Console, Analytics, etc.), use the full googleapis package."
  - question: "Does the googleapis library handle token refresh automatically?"
    answer: "Yes. Both GoogleAuth and JWT clients handle token refresh automatically. You don't need to manually refresh access tokens."
  - question: "Can I use ESM imports with googleapis?"
    answer: "Yes. The googleapis package supports both CommonJS (require) and ESM (import) syntax. TypeScript type definitions are included."
  - question: "What's the minimum Node.js version required?"
    answer: "The googleapis package requires Node.js 14 or later. For TypeScript support with modern features, Node.js 18+ is recommended."
---
::
