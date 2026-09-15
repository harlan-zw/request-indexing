---
title: "Google Indexing API Setup: Your First Notification"
description: "Set up a service account, property ownership and scoped Node.js client for your first eligible Indexing API notification."
navigation:
  order: 2
  icon: i-heroicons-academic-cap
icon: i-heroicons-academic-cap
publishedAt: "2026-03-04"
updatedAt: "2026-09-15"
readTime: "5 min"
keywords:
  - google indexing api tutorial
  - google indexing api setup
  - how to use google indexing api
  - indexing api service account
---

Start with one eligible URL, such as a real job listing at `https://example.com/jobs/42`. Google supports the Indexing API for `JobPosting`, or `BroadcastEvent` embedded in `VideoObject`. Ordinary blog posts need [a different workflow](/indexing-api-for-blog-posts).

Google's default quota covers onboarding and testing. Additional approval is required for usage and resource provisioning; use the form linked from [Google's approval page](https://developers.google.com/search/apis/indexing-api/v3/quota-pricing).

## Set up credentials and property access

Follow [Google's prerequisites](https://developers.google.com/search/apis/indexing-api/v3/prereqs) for these account steps:

1. Create or select a Google Cloud project and enable the Indexing API.
2. Create a service account in that project. The optional Cloud IAM role step is not required by this setup.
3. Create its JSON key and keep it outside your repository. The key contains credentials; do not place it in browser code or a public directory.
4. Verify ownership of the matching property in Search Console.
5. Add the service account's `client_email` as a delegated owner of that property.

Being a Cloud project owner does not grant ownership of a Search Console property. Check the property covers the URL you intend to notify Google about.

These are documentation-based steps. This walkthrough did not create a project, key, or property owner during verification.

## Send the first notification

Use Node.js 24 and Google's official `googleapis` client. In a new local directory, install the tested version and point the credential variable at your JSON file:

```bash
npm init -y
npm install googleapis@181.0.0
export GOOGLE_APPLICATION_CREDENTIALS="/absolute/path/to/service-account.json"
```

Save this as `notify.mjs`:

```js
import { google } from 'googleapis'

const url = process.argv[2]
if (!url) {
  throw new Error('Pass one eligible URL: node notify.mjs URL')
}

const auth = new google.auth.GoogleAuth({
  scopes: ['https://www.googleapis.com/auth/indexing'],
})
const indexing = google.indexing({ version: 'v3', auth })

await indexing.urlNotifications.publish({
  requestBody: { url, type: 'URL_UPDATED' },
}, { retry: false }).then(({ data }) => {
  console.log(JSON.stringify({ status: 'notification-accepted', url, metadata: data }))
}).catch((error) => {
  const details = error.response?.data?.error
  console.error(JSON.stringify({
    status: 'request-failed',
    url,
    httpStatus: error.response?.status,
    reasons: details?.errors?.map(item => item.reason),
    message: details?.message ?? error.message,
  }))
  process.exitCode = 1
})

```

Run it with your eligible URL:

```bash
node notify.mjs 'https://example.com/jobs/42'
```

The example uses [GoogleAuth's credential discovery](https://github.com/googleapis/google-auth-library-nodejs) and the indexing scope. The `.mjs` extension makes the file an ES module. Replace the example URL with a page you own that meets Google's supported-content requirements.

## Read the response correctly

`notification-accepted` is the script's label for a successful API response. It does not mean the page was indexed. Google may attempt a recrawl after receiving `URL_UPDATED`; [its usage documentation](https://developers.google.com/search/apis/indexing-api/v3/using-api) defines that response.

On failure, the script prints the status, reasons, and message. Check those together: an ownership problem and an exhausted quota require different actions. The script disables automatic retries, so it does not repeatedly submit while you diagnose the problem.

Verification used the real client with intercepted HTTP responses. Credential exchange and live Google notifications remain untested. For metadata and error handling details, continue with the [Node.js guide](/google-indexing-api-node-js). For approval and rate limits, use the [quota guide](/google-indexing-api-quota).
