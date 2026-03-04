---
title: "Google Indexing API: The Complete Guide (2026)"
description: "Learn how the Google Indexing API works, set up authentication, submit URLs with code examples in curl, TypeScript and Python, understand quotas, and get pages indexed faster."
navigation:
  order: 1
  icon: i-heroicons-book-open
icon: i-heroicons-book-open
publishedAt: "2026-03-04"
updatedAt: "2026-03-04"
readTime: "15 min"
keywords:
  - google indexing api
  - indexing api
  - google api indexing
  - google indexing api tutorial
  - request indexing
relatedPages:
  - path: /google-indexing-api-tutorial
    title: Step-by-Step Tutorial
  - path: /google-indexing-api-quota
    title: Quota & Rate Limits
---

## What Is the Google Indexing API?

The [Google Indexing API](https://developers.google.com/search/apis/indexing-api/v3/quickstart) is a REST API that lets you notify Google directly when pages are added, updated, or removed from your site. Instead of waiting for Googlebot to discover changes through crawling, you send a request and Google schedules a fresh crawl of that URL.

Google describes it as a way to push URL-level notifications. You tell Google "this URL changed" or "this URL was removed," and Google prioritizes crawling it. In most cases, pages submitted through the API are crawled within hours rather than the days or weeks traditional crawling can take.

### How Is It Different from Search Console?

Google Search Console's URL Inspection tool lets you manually submit individual URLs for indexing. The Indexing API is fundamentally different:

| | URL Inspection (GSC) | Indexing API |
|---|---|---|
| **Method** | Manual, one URL at a time | Programmatic, automated |
| **Batch support** | No | Yes, up to 100 per HTTP request |
| **Daily limit** | ~10 manual requests | 200 publish requests/day |
| **Automation** | Not possible | Built for it |
| **Use case** | Spot-checking individual pages | Systematic indexing workflows |

The API is designed for automation. Whether you're publishing content on a schedule, running an e-commerce site with frequent inventory changes, or managing a job board, the API lets you build indexing into your workflow rather than treating it as an afterthought.

## How It Works

The Indexing API has three core operations:

### 1. Publish a URL Notification

Send a `POST` request to tell Google a URL has been updated or deleted:

```bash
POST https://indexing.googleapis.com/v3/urlNotifications:publish
```

The request body contains two fields:

```json
{
  "url": "https://example.com/my-page",
  "type": "URL_UPDATED"
}
```

The `type` field accepts two values:
- **`URL_UPDATED`** — The page is new or has been modified. Google will schedule a crawl.
- **`URL_DELETED`** — The page no longer exists. Google will remove it from the index.

A successful response returns metadata about the notification:

```json
{
  "urlNotificationMetadata": {
    "url": "https://example.com/my-page",
    "latestUpdate": {
      "type": "URL_UPDATED",
      "notifyTime": "2026-03-04T12:00:00.000Z"
    }
  }
}
```

### 2. Check Notification Status

Query the status of a previously submitted URL:

```bash
GET https://indexing.googleapis.com/v3/urlNotifications/metadata?url=https://example.com/my-page
```

This returns when the last notification was received and what type it was. Note that this only tells you Google received the notification — it does not tell you whether the page was actually indexed.

### 3. Batch Requests

Combine up to **100 API calls** into a single HTTP request using the batch endpoint:

```bash
POST https://indexing.googleapis.com/batch
```

Batch requests use `multipart/mixed` content type. Each individual request within the batch is processed independently — if one fails, the others still succeed. This is covered in detail in our [bulk submission guide](/bulk-submit-urls-google-indexing-api).

## Why Use the Indexing API?

### Speed

Traditional crawling relies on Googlebot discovering your content through links, sitemaps, or periodic re-crawls. This can take anywhere from a few days to several weeks. The Indexing API signals Google to crawl specific URLs on your schedule, typically resulting in crawling within hours.

### Control

You decide exactly when Google should re-crawl a URL. Updated a product price? Publish a notification. Fixed a typo in a critical page? Notify immediately. You're no longer waiting and hoping Googlebot comes back.

### Scale

With batch requests and a 200/day quota, you can systematically manage indexing for sites with frequent content changes. For larger sites, you can [request a quota increase](/google-indexing-api-quota) through the Google Cloud Console.

### Automation

Unlike the manual URL Inspection tool in Search Console, the Indexing API integrates into your deployment pipeline, CMS, or content workflow. Publish content and request indexing in the same step.

## Prerequisites

Before making your first API call, you need three things:

1. **A Google Cloud Platform (GCP) project** with the Web Search Indexing API enabled
2. **A service account** with a JSON key file for authentication
3. **The service account added as an Owner** in Google Search Console

The setup process takes about 10–15 minutes. Our [step-by-step tutorial](/google-indexing-api-tutorial) walks through every screen with detailed instructions.

### Authentication

All API requests must be authorized using the OAuth scope:

```
https://www.googleapis.com/auth/indexing
```

You authenticate using a service account JSON key file. The service account's email address (something like `my-service@my-project.iam.gserviceaccount.com`) must be added as a **delegated Owner** of your Google Search Console property.

This is the most common setup mistake — if you get a `403 Forbidden` error, the service account almost certainly isn't set as an Owner in GSC.

## Quick Start

### curl

```bash
# Get an access token using your service account
ACCESS_TOKEN=$(gcloud auth print-access-token \
  --impersonate-service-account=SERVICE_ACCOUNT_EMAIL)

# Submit a URL for indexing
curl -X POST "https://indexing.googleapis.com/v3/urlNotifications:publish" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{
    "url": "https://example.com/my-page",
    "type": "URL_UPDATED"
  }'
```

### TypeScript / Node.js

```typescript
import { google } from 'googleapis'

const auth = new google.auth.GoogleAuth({
  keyFile: 'service-account.json',
  scopes: ['https://www.googleapis.com/auth/indexing'],
})

const indexing = google.indexing({ version: 'v3', auth })

const response = await indexing.urlNotifications.publish({
  requestBody: {
    url: 'https://example.com/my-page',
    type: 'URL_UPDATED',
  },
})

console.log('Submitted:', response.data)
```

For a complete Node.js implementation with error handling, batching, and production patterns, see our [Node.js guide](/google-indexing-api-node-js).

### Python

```python
from google.oauth2 import service_account
from googleapiclient.discovery import build

SCOPES = ['https://www.googleapis.com/auth/indexing']
credentials = service_account.Credentials.from_service_account_file(
    'service-account.json', scopes=SCOPES
)

service = build('indexing', 'v3', credentials=credentials)

response = service.urlNotifications().publish(
    body={
        'url': 'https://example.com/my-page',
        'type': 'URL_UPDATED'
    }
).execute()

print('Submitted:', response)
```

## Quota and Rate Limits

The Indexing API has strict quota limits:

| Limit | Default |
|---|---|
| **Publish requests** | 200 per day (per GCP project) |
| **getMetadata requests** | 180 per minute |
| **Batch size** | Max 100 requests per HTTP call |

A critical detail about batching: Google explicitly states that **quota is counted at the URL level**. If you combine 10 requests into a single batch, it counts as 10 against your daily quota, not 1.

If you exceed your quota, the API returns a `429 Too Many Requests` error. For strategies on managing quota efficiently and requesting increases, see our [quota management guide](/google-indexing-api-quota).

## Using the API for Non-Job Content

Google's official documentation states:

> "Currently, the Indexing API can only be used to crawl pages with either `JobPosting` or `BroadcastEvent` embedded in a `VideoObject`."

In practice, the API has been widely used for all types of content — blog posts, e-commerce pages, documentation sites, and more. However, Google has been tightening enforcement:

- **John Mueller** (May 2025) warned on Bluesky: *"We see a lot of spammers misuse the Indexing API like this, so I'd recommend just sticking to the documented & supported use-cases."* ([Source](https://www.seroundtable.com/google-indexing-api-unsupported-content-39470.html))

- **Gary Illyes** (April 2024) cautioned that users *"shouldn't be surprised"* if the API *"suddenly stopped working for unsupported verticals overnight."* ([Source](https://www.seroundtable.com/google-indexing-api-unsupported-verticals-37255.html))

For a detailed analysis of the risks, community experiences, and best practices, see our guide on [using the Indexing API for blog posts](/indexing-api-for-blog-posts).

## Error Codes

| Code | Error | Common Cause |
|---|---|---|
| **400** | Bad Request | Malformed JSON body or invalid URL format |
| **401** | Unauthorized | Invalid or expired access token. Regenerate your JWT. |
| **403** | Forbidden | Service account not added as Owner in GSC, or API not enabled in GCP |
| **404** | Not Found | Requesting metadata for a URL that was never submitted |
| **429** | Too Many Requests | Exceeded the 200/day publish quota. Use exponential backoff. |
| **500** | Internal Server Error | Google backend issue. Retry later. |
| **503** | Service Unavailable | API temporarily overloaded. Retry with exponential backoff. |

The most common error by far is **403 Forbidden**. This almost always means one of two things:

1. The service account email hasn't been added as an **Owner** (not Editor, not Viewer — Owner) in Google Search Console
2. The Web Search Indexing API hasn't been enabled in your Google Cloud project

See the [troubleshooting section](/google-indexing-api-tutorial#troubleshooting) in our tutorial for step-by-step fixes.

## npm Ecosystem

If you're building with Node.js, several packages simplify working with the Indexing API:

| Package | Weekly Downloads | Description |
|---|---|---|
| [`@googleapis/indexing`](https://www.npmjs.com/package/@googleapis/indexing) | ~8,400 | Official Google client library with full TypeScript support |
| [`google-indexing-script`](https://www.npmjs.com/package/google-indexing-script) | ~750 | CLI tool to index sites quickly ([7,500+ GitHub stars](https://github.com/goenning/google-indexing-script)) |

The official `@googleapis/indexing` package (or the broader `googleapis` package) is the recommended choice for production applications. It handles authentication, token refresh, and request formatting automatically.

For a zero-code approach, [Request Indexing](/) provides a web dashboard that handles the entire workflow — connect your Google account, select your sites, and request indexing with a click.

## Next Steps

Now that you understand how the Indexing API works, dive deeper:

- **[Step-by-Step Tutorial](/google-indexing-api-tutorial)** — Set up your GCP project, service account, and make your first API call
- **[Node.js Implementation](/google-indexing-api-node-js)** — Complete guide with error handling, batching, and production patterns
- **[Bulk URL Submission](/bulk-submit-urls-google-indexing-api)** — Submit hundreds of URLs efficiently with queue strategies
- **[Using the API for Blog Posts](/indexing-api-for-blog-posts)** — Understand the risks and best practices for non-job content
- **[Quota & Rate Limits](/google-indexing-api-quota)** — Manage your 200/day quota and request increases

## Frequently Asked Questions

::content-faq
---
items:
  - question: "Does the Indexing API guarantee my page will be indexed?"
    answer: "No. The API notifies Google to crawl your URL, but Google's algorithms still decide whether to index the page based on content quality, relevance, and other ranking factors. The API response (HTTP 200) only confirms Google received your notification — not that the page was indexed."
  - question: "Is the Indexing API free to use?"
    answer: "Yes. The Indexing API itself is completely free. You need a Google Cloud Platform project, which has a generous free tier. There are no charges for publish or metadata requests within quota limits."
  - question: "Can I use the Indexing API for blog posts and general content?"
    answer: "Google's documentation officially limits the API to JobPosting and BroadcastEvent content. While the API technically works for other content types, Google has warned that this could stop working at any time. Use at your own risk."
  - question: "What happens if I exceed the 200/day quota?"
    answer: "Requests beyond your quota return a 429 (Too Many Requests) error. You can request a quota increase through the Google Cloud Console, though Google typically requires proof that you're using the API for supported content types (JobPosting or BroadcastEvent)."
  - question: "How is this different from IndexNow?"
    answer: "IndexNow is a protocol supported by Bing, Yandex, and others — but not Google. The Google Indexing API only works with Google Search. If you want to notify multiple search engines, you'll need both."
  - question: "How long does it take for a page to be indexed after submitting?"
    answer: "Most pages are crawled within 24-48 hours of submission. However, crawling and indexing are different — Google may crawl your page quickly but decide not to index it if it doesn't meet quality thresholds."
---
::
