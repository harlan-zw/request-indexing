---
title: "Google Indexing API Tutorial: Step-by-Step Setup Guide"
description: "Set up the Google Indexing API from scratch. Create a GCP project, enable the API, configure a service account, add it to Search Console, and make your first API call."
navigation:
  order: 2
  icon: i-heroicons-academic-cap
icon: i-heroicons-academic-cap
publishedAt: "2026-03-04"
updatedAt: "2026-03-04"
readTime: "12 min"
keywords:
  - google indexing api tutorial
  - google indexing api setup
  - how to use google indexing api
  - indexing api service account
relatedPages:
  - path: /google-indexing-api-node-js
    title: Node.js Implementation
  - path: /bulk-submit-urls-google-indexing-api
    title: Bulk URL Submission
---

This tutorial walks you through every step of setting up the Google Indexing API, from creating a Google Cloud project to making your first successful API call. By the end, you'll have a working setup that can submit URLs to Google for indexing.

## What You'll Need

If you're not sure what the Indexing API is or how it differs from Search Console, read our [complete guide to the Google Indexing API](/google-indexing-api) first.

Before starting, make sure you have:

- A **Google account** (personal or Workspace)
- A **website verified in Google Search Console** (URL-prefix or Domain property)
- About **10–15 minutes** for the initial setup

No coding experience is required for the GCP setup, but the API call examples use curl, TypeScript, and Python.

## Step 1: Create a Google Cloud Project

The Indexing API runs through Google Cloud Platform (GCP). You need a project to manage API access and credentials.

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Click the project dropdown in the top navigation bar
3. Click **New Project**
4. Enter a project name (e.g., "My Indexing API")
5. Click **Create**

If you already have a GCP project you want to use, select it from the dropdown instead.

### Accept the Terms of Service

If this is your first time using Google Cloud, you'll need to accept the Terms of Service. You do **not** need to set up billing for the Indexing API — it's free to use within the default quota.

## Step 2: Enable the Web Search Indexing API

With your project selected:

1. Navigate to **APIs & Services > Library** in the left sidebar (or search for "API Library" in the top search bar)
2. Search for **"Web Search Indexing API"**
3. Click on the **Web Search Indexing API** result
4. Click **Enable**

You should see a confirmation that the API has been enabled for your project. If you see "Manage" instead of "Enable," the API is already active.

### Common Mistake

Don't confuse the **Web Search Indexing API** with the **Custom Search JSON API** or the **Search Console API**. These are different APIs. You specifically need the one called **"Web Search Indexing API"** (sometimes labeled "Indexing API").

## Step 3: Create a Service Account

A service account is a special Google account used by applications (rather than people) to authenticate API requests.

1. Go to **APIs & Services > Credentials** in the left sidebar
2. Click **+ Create Credentials** at the top
3. Select **Service Account**
4. Fill in the details:
   - **Service account name:** Something descriptive like "indexing-api"
   - **Service account ID:** Auto-fills based on the name
   - **Description:** Optional, e.g., "Service account for Indexing API requests"
5. Click **Create and Continue**
6. Skip the "Grant this service account access to project" step — click **Continue**
7. Skip the "Grant users access to this service account" step — click **Done**

### Generate a JSON Key File

The service account needs a key file for authentication:

1. Find your new service account in the **Service Accounts** list
2. Click on the service account email
3. Go to the **Keys** tab
4. Click **Add Key > Create new key**
5. Select **JSON** as the key type
6. Click **Create**

A JSON file will download automatically. **Store this file securely** — it grants full access to the Indexing API for your project. Never commit it to version control or expose it publicly.

The JSON file looks something like this:

```json
{
  "type": "service_account",
  "project_id": "my-indexing-api",
  "private_key_id": "abc123...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "indexing-api@my-indexing-api.iam.gserviceaccount.com",
  "client_id": "123456789",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token"
}
```

The two fields you'll use most are `client_email` (for GSC setup) and `private_key` (for authentication).

## Step 4: Add the Service Account to Search Console

This is the most critical step — and the one most people get wrong. The service account must be added as an **Owner** of your Search Console property.

1. Go to [Google Search Console](https://search.google.com/search-console)
2. Select the property you want to use with the Indexing API
3. Click **Settings** in the left sidebar
4. Click **Users and permissions**
5. Click **Add User**
6. Enter the service account email address (the `client_email` from your JSON key file — it ends in `@...iam.gserviceaccount.com`)
7. Set the permission to **Owner**
8. Click **Add**

### Why Owner Access?

The Indexing API requires **Owner** permission — not Editor or Viewer. This is a security requirement from Google. The service account needs to prove it has full authority over the property to submit indexing requests.

### URL-Prefix vs Domain Properties

If you have a **Domain property** (e.g., `example.com`), the service account must be added there. If you only have a **URL-prefix property** (e.g., `https://www.example.com`), the service account must be added to that specific property, and you can only submit URLs that match that prefix.

For best results, verify your site as a Domain property in Search Console and add the service account there.

## Step 5: Make Your First API Call

Now test your setup with a real API call.

### Using curl

```bash
# First, generate an access token from your service account key
# Install gcloud CLI if you haven't: https://cloud.google.com/sdk/docs/install
gcloud auth activate-service-account --key-file=service-account.json

ACCESS_TOKEN=$(gcloud auth print-access-token)

# Submit a URL for indexing
curl -X POST "https://indexing.googleapis.com/v3/urlNotifications:publish" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{
    "url": "https://your-site.com/page-to-index",
    "type": "URL_UPDATED"
  }'
```

### Using TypeScript / Node.js

Install the Google APIs client:

```bash
npm install googleapis
```

Then create a script:

```typescript
import { google } from 'googleapis'

const auth = new google.auth.GoogleAuth({
  keyFile: './service-account.json',
  scopes: ['https://www.googleapis.com/auth/indexing'],
})

const indexing = google.indexing({ version: 'v3', auth })

const response = await indexing.urlNotifications.publish({
  requestBody: {
    url: 'https://your-site.com/page-to-index',
    type: 'URL_UPDATED',
  },
})

console.log('Success:', response.data)
```

For the full Node.js implementation with error handling, retry logic, and batch support, see our [Node.js guide](/google-indexing-api-node-js).

### Using Python

Install the required packages:

```bash
pip install google-api-python-client google-auth
```

Then run:

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
        'url': 'https://your-site.com/page-to-index',
        'type': 'URL_UPDATED'
    }
).execute()

print('Success:', response)
```

### Verify It Worked

A successful response looks like:

```json
{
  "urlNotificationMetadata": {
    "url": "https://your-site.com/page-to-index",
    "latestUpdate": {
      "type": "URL_UPDATED",
      "notifyTime": "2026-03-04T10:30:00.000Z"
    }
  }
}
```

This confirms Google received your notification. To verify the page gets crawled, check your server logs for Googlebot activity on that URL within the next few hours, or use the URL Inspection tool in Search Console after 24 hours.

## Step 6: Verify the Notification Status

You can check the status of any previously submitted URL:

```bash
curl "https://indexing.googleapis.com/v3/urlNotifications/metadata?url=https://your-site.com/page-to-index" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

The response will show the most recent notification:

```json
{
  "url": "https://your-site.com/page-to-index",
  "latestUpdate": {
    "type": "URL_UPDATED",
    "notifyTime": "2026-03-04T10:30:00.000Z"
  }
}
```

## Troubleshooting

### 403: Permission denied. Failed to verify the URL ownership.

This is the most common error. It means:

1. **The service account is not an Owner in GSC.** Go to Search Console > Settings > Users and permissions. Confirm the service account email is listed with Owner access.
2. **You're submitting URLs for the wrong property.** If your GSC property is `https://www.example.com`, you cannot submit `https://example.com/page` (without www). The URL must match the verified property.
3. **The API is not enabled.** Go to Google Cloud Console > APIs & Services > Enabled APIs. Confirm "Web Search Indexing API" is listed.

### 403: Indexing API has not been used in project before or it is disabled.

Go to Google Cloud Console > APIs & Services > Library. Search for "Web Search Indexing API" and click Enable.

### 401: Request had invalid authentication credentials.

Your access token is expired or the service account key is invalid. Common causes:

- The JSON key file is corrupted or incomplete
- The `private_key` field has broken newlines (common when loading from environment variables — make sure `\n` characters are preserved)
- You're using the wrong OAuth scope (must be `https://www.googleapis.com/auth/indexing`)

### PEM routines: get_name: no start line

This error means the `private_key` in your JSON file is malformed. This typically happens when:

- The key was copy-pasted and newlines were lost
- An environment variable didn't preserve the `\n` characters
- The JSON file was modified after download

**Fix:** Download a fresh JSON key from the Google Cloud Console. If using environment variables, make sure to preserve the newlines:

```bash
# In .env files, wrap in quotes and keep the \n characters
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQ...\n-----END PRIVATE KEY-----\n"
```

### 429: Quota exceeded

You've hit the 200 publish requests/day limit. Options:

- Wait until the quota resets (daily)
- Request a [quota increase](/google-indexing-api-quota) through Google Cloud Console
- Prioritize which URLs are most important to submit

### Successful Response but Page Not Indexed

The API can return HTTP 200 (success) but the page may still not get indexed. This means Google crawled it but decided not to index it. Common reasons:

- **Thin or duplicate content** — Google doesn't consider the page valuable enough
- **noindex directive** — Check your robots meta tag and X-Robots-Tag headers
- **Canonical pointing elsewhere** — The page may be canonicalized to a different URL
- **Quality threshold** — Google's algorithms determined the page doesn't meet quality standards
- **Unsupported content** — If you're using the API for blog posts or general pages, Google may ignore the notification. See our guide on [using the API for non-job content](/indexing-api-for-blog-posts).

Use the URL Inspection tool in Search Console to see the exact indexing status and any issues Google found.

## What's Next?

You now have a working Indexing API setup. Here's where to go from here:

- **[Node.js Implementation Guide](/google-indexing-api-node-js)** — Build a production-ready integration with error handling and batching
- **[Bulk URL Submission](/bulk-submit-urls-google-indexing-api)** — Submit hundreds of URLs with queue strategies and scripts
- **[Quota Management](/google-indexing-api-quota)** — Understand rate limits and request increases

Or skip the code entirely — [Request Indexing](/) handles the setup, authentication, and submission for you through a simple web dashboard.

## Frequently Asked Questions

::content-faq
---
items:
  - question: "Do I need billing enabled on my Google Cloud project?"
    answer: "No. The Indexing API is free to use within the default quota (200 requests/day). You don't need to set up billing or enter a credit card."
  - question: "Can I use a personal Google account or do I need Workspace?"
    answer: "A personal Google account works. You don't need Google Workspace. However, the Google account must have access to the Search Console property you want to index."
  - question: "How many service accounts can I create?"
    answer: "You can create up to 100 service accounts per GCP project. Each service account can be added as an Owner to multiple Search Console properties."
  - question: "Can I use the same service account for multiple websites?"
    answer: "Yes. Add the service account email as an Owner in each Search Console property. The 200/day quota is per GCP project, not per website."
  - question: "Is it safe to share my service account JSON key?"
    answer: "No. The JSON key grants full access to the Indexing API for your project. Treat it like a password. If compromised, delete the key immediately from the Google Cloud Console and create a new one."
---
::
