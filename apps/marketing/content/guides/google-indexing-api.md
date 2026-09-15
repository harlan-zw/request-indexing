---
title: "Google Indexing API: What It Does and When to Use It"
description: "Understand Google's supported Indexing API use, notification responses, approval requirements, and how it differs from URL Inspection."
navigation:
  order: 1
  icon: i-heroicons-book-open
icon: i-heroicons-book-open
publishedAt: "2026-03-04"
updatedAt: "2026-09-15"
readTime: "4 min"
keywords:
  - google indexing api
  - indexing api
  - google api indexing
  - google indexing api tutorial
  - request indexing
---

The Google Indexing API notifies Google when an eligible URL changes or disappears. It supports pages with `JobPosting`, or `BroadcastEvent` embedded in `VideoObject`. Ordinary website pages are outside that supported use. [Google's quickstart](https://developers.google.com/search/apis/indexing-api/v3/quickstart) defines that boundary.

If you publish ordinary articles, start with [the blog-post guide](/indexing-api-for-blog-posts). For eligible job listings or livestream pages, start with one notification.

## A notification for one job listing

Suppose you update a job listing at `https://example.com/jobs/42`. Your client sends an authenticated POST to `https://indexing.googleapis.com/v3/urlNotifications:publish` with this body:

```json
{
  "url": "https://example.com/jobs/42",
  "type": "URL_UPDATED"
}
```

This is a request body, not a runnable authenticated example. The [setup tutorial](/google-indexing-api-tutorial) covers the credentials and first call.

A successful response means Google may attempt to recrawl the URL. It does not prove that a crawl happened or that Google indexed the page. The metadata endpoint reports notification history, so a recent timestamp there also cannot establish indexing. See [Google's request and response meanings](https://developers.google.com/search/apis/indexing-api/v3/using-api).

## Choose the correct Google interface

| Interface | What you use it for | What the result tells you |
| --- | --- | --- |
| Indexing API | Notify Google about changed or deleted eligible URLs | Notification receipt |
| Search Console URL Inspection tool | Inspect a URL and manually request indexing | Inspection information; a request remains subject to Google's processing |
| URL Inspection API | Read stored index information programmatically | Information about the version Google has in its index |

Google recommends [manual URL Inspection for a few URLs and sitemaps for many](https://developers.google.com/search/docs/crawling-indexing/ask-google-to-recrawl). The [URL Inspection API](https://developers.google.com/webmaster-tools/v1/urlInspection.index/inspect) has no live-test or request-indexing operation.

## Before you build

Google's documented setup uses a Cloud project with the API enabled, a service account, Search Console ownership, and the `https://www.googleapis.com/auth/indexing` scope. The service account needs delegated ownership of the property. Cloud project permissions and Search Console ownership are separate. Follow the [prerequisites](https://developers.google.com/search/apis/indexing-api/v3/prereqs).

The default publish allowance is 200 requests per day per project for onboarding and testing. Google requires additional approval for usage and resource provisioning. Check the [approval and quota page](https://developers.google.com/search/apis/indexing-api/v3/quota-pricing) before planning a production integration.

Use the [Node.js example](/google-indexing-api-node-js) to send one notification. Once that works for your eligible content, the [bulk guide](/bulk-submit-urls-google-indexing-api) explains multiple requests and per-URL results.

## When a page is removed

Use `URL_DELETED` after the URL returns `404` or `410`, or includes `noindex`. This tells Google about the removal; it does not prove removal has finished. The current [usage documentation](https://developers.google.com/search/apis/indexing-api/v3/using-api) covers those prerequisites.

*Correction, 15 September 2026: This guide now separates notification receipt from indexing and includes Google's approval requirement. Earlier descriptions of general-page use and guaranteed response timing were unsupported.*
