<script lang="ts" setup>
const { loggedIn, user } = useUserSession()

const SiteCards = [
  {
    analytics: {
      period: {
        totalClicks: 3471,
        totalImpressions: 64141,
      },
      prevPeriod: {
        totalClicks: 902,
        totalImpressions: 14100,
      },
    },
    nonIndexedPercent: 0.79,
    siteUrl: 'https://nuxtseo.com',
    indexedUrls: Array.from({ length: 109 }),
    nonIndexedUrls: [
      {
        inspectionResult: {
          inspectionResultLink: 'https://search.google.com/search-console/inspect?resource_id=sc-domain:nuxtseo.com&id=kh5uM9YfPMye-g6EmaWJ0w&utm_medium=link&utm_source=api',
          indexStatusResult: {
            verdict: 'NEUTRAL',
            coverageState: 'Discovered - currently not indexed',
            robotsTxtState: 'ROBOTS_TXT_STATE_UNSPECIFIED',
            indexingState: 'INDEXING_STATE_UNSPECIFIED',
            pageFetchState: 'PAGE_FETCH_STATE_UNSPECIFIED',
            sitemap: [
              'https://nuxtseo.com/sitemap.xml',
            ],
            crawledAs: 'CRAWLING_USER_AGENT_UNSPECIFIED',
          },
        },
        url: '/blog/hello-world',
        lastInspected: 1707485818370,
      },
      {
        inspectionResult: {
          inspectionResultLink: 'https://search.google.com/search-console/inspect?resource_id=sc-domain:nuxtseo.com&id=SuEcdGMwVNxKwRNrtABaUg&utm_medium=link&utm_source=api',
          indexStatusResult: {
            verdict: 'NEUTRAL',
            coverageState: 'Discovered - currently not indexed',
            robotsTxtState: 'ROBOTS_TXT_STATE_UNSPECIFIED',
            indexingState: 'INDEXING_STATE_UNSPECIFIED',
            pageFetchState: 'PAGE_FETCH_STATE_UNSPECIFIED',
            sitemap: [
              'https://nuxtseo.com/sitemap.xml',
              'https://nuxtseo.com/sitemap.xml',
            ],
            referringUrls: [
              'https://nuxtseo.com/sitemap.xml',
              'https://nuxtseo.com/sitemap/getting-started/installation',
              'https://nuxtseo.com/sitemap.xml',
              'https://nuxtseo.com/sitemap/getting-started/installation',
            ],
            crawledAs: 'CRAWLING_USER_AGENT_UNSPECIFIED',
          },
        },
        url: '/is-this-thing-on',
        lastInspected: 1707491214785,
        urlNotificationMetadata: {
          url: 'https://nuxtseo.com/nuxt-seo/migration-guide/beta-to-rc',
          latestUpdate: {
            url: 'https://nuxtseo.com/nuxt-seo/migration-guide/beta-to-rc',
            type: 'URL_UPDATED',
            notifyTime: '2024-02-09T15:07:04.669472038Z',
          },
        },
      },
      {
        inspectionResult: {
          inspectionResultLink: 'https://search.google.com/search-console/inspect?resource_id=sc-domain:nuxtseo.com&id=jBbvkezl_lDwTpVNvganYw&utm_medium=link&utm_source=api',
          indexStatusResult: {
            verdict: 'PASS',
            coverageState: 'Submitted and indexed',
            robotsTxtState: 'ALLOWED',
            indexingState: 'INDEXING_ALLOWED',
            lastCrawlTime: '2024-02-08T09:12:23Z',
            pageFetchState: 'SUCCESSFUL',
            googleCanonical: 'https://nuxtseo.com/og-image/guides/jpegs',
            userCanonical: 'https://nuxtseo.com/og-image/guides/jpegs',
            sitemap: [
              'https://nuxtseo.com/sitemap.xml',
            ],
            crawledAs: 'MOBILE',
          },
        },
        url: '/maybe-it-is',
        lastInspected: 1707486608709,
      },
      {
        url: '/one-way-to-find-out',
      },
    ],
    graph: [
      {
        clicks: 3,
        impressions: 59,
        time: '2023-08-14',
      },
      {
        clicks: 7,
        impressions: 62,
        time: '2023-08-15',
      },
      {
        clicks: 2,
        impressions: 60,
        time: '2023-08-16',
      },
      {
        clicks: 1,
        impressions: 52,
        time: '2023-08-17',
      },
      {
        clicks: 2,
        impressions: 30,
        time: '2023-08-18',
      },
      {
        clicks: 0,
        impressions: 28,
        time: '2023-08-19',
      },
      {
        clicks: 1,
        impressions: 44,
        time: '2023-08-20',
      },
      {
        clicks: 0,
        impressions: 41,
        time: '2023-08-21',
      },
      {
        clicks: 0,
        impressions: 55,
        time: '2023-08-22',
      },
      {
        clicks: 2,
        impressions: 70,
        time: '2023-08-23',
      },
      {
        clicks: 1,
        impressions: 55,
        time: '2023-08-24',
      },
      {
        clicks: 5,
        impressions: 51,
        time: '2023-08-25',
      },
      {
        clicks: 3,
        impressions: 34,
        time: '2023-08-26',
      },
      {
        clicks: 1,
        impressions: 52,
        time: '2023-08-27',
      },
      {
        clicks: 3,
        impressions: 58,
        time: '2023-08-28',
      },
      {
        clicks: 6,
        impressions: 89,
        time: '2023-08-29',
      },
      {
        clicks: 4,
        impressions: 77,
        time: '2023-08-30',
      },
      {
        clicks: 0,
        impressions: 69,
        time: '2023-08-31',
      },
      {
        clicks: 1,
        impressions: 40,
        time: '2023-09-01',
      },
      {
        clicks: 1,
        impressions: 42,
        time: '2023-09-02',
      },
      {
        clicks: 2,
        impressions: 38,
        time: '2023-09-03',
      },
      {
        clicks: 5,
        impressions: 72,
        time: '2023-09-04',
      },
      {
        clicks: 1,
        impressions: 99,
        time: '2023-09-05',
      },
      {
        clicks: 11,
        impressions: 97,
        time: '2023-09-06',
      },
      {
        clicks: 3,
        impressions: 89,
        time: '2023-09-07',
      },
      {
        clicks: 3,
        impressions: 70,
        time: '2023-09-08',
      },
      {
        clicks: 2,
        impressions: 31,
        time: '2023-09-09',
      },
      {
        clicks: 0,
        impressions: 38,
        time: '2023-09-10',
      },
      {
        clicks: 4,
        impressions: 102,
        time: '2023-09-11',
      },
      {
        clicks: 4,
        impressions: 100,
        time: '2023-09-12',
      },
      {
        clicks: 1,
        impressions: 114,
        time: '2023-09-13',
      },
      {
        clicks: 6,
        impressions: 93,
        time: '2023-09-14',
      },
      {
        clicks: 6,
        impressions: 85,
        time: '2023-09-15',
      },
      {
        clicks: 2,
        impressions: 49,
        time: '2023-09-16',
      },
      {
        clicks: 3,
        impressions: 63,
        time: '2023-09-17',
      },
      {
        clicks: 10,
        impressions: 146,
        time: '2023-09-18',
      },
      {
        clicks: 4,
        impressions: 127,
        time: '2023-09-19',
      },
      {
        clicks: 10,
        impressions: 154,
        time: '2023-09-20',
      },
      {
        clicks: 5,
        impressions: 161,
        time: '2023-09-21',
      },
      {
        clicks: 10,
        impressions: 99,
        time: '2023-09-22',
      },
      {
        clicks: 5,
        impressions: 75,
        time: '2023-09-23',
      },
      {
        clicks: 7,
        impressions: 83,
        time: '2023-09-24',
      },
      {
        clicks: 7,
        impressions: 132,
        time: '2023-09-25',
      },
      {
        clicks: 6,
        impressions: 175,
        time: '2023-09-26',
      },
      {
        clicks: 5,
        impressions: 172,
        time: '2023-09-27',
      },
      {
        clicks: 10,
        impressions: 134,
        time: '2023-09-28',
      },
      {
        clicks: 6,
        impressions: 158,
        time: '2023-09-29',
      },
      {
        clicks: 10,
        impressions: 88,
        time: '2023-09-30',
      },
      {
        clicks: 2,
        impressions: 102,
        time: '2023-10-01',
      },
      {
        clicks: 15,
        impressions: 184,
        time: '2023-10-02',
      },
      {
        clicks: 13,
        impressions: 176,
        time: '2023-10-03',
      },
      {
        clicks: 11,
        impressions: 209,
        time: '2023-10-04',
      },
      {
        clicks: 11,
        impressions: 130,
        time: '2023-10-05',
      },
      {
        clicks: 11,
        impressions: 138,
        time: '2023-10-06',
      },
      {
        clicks: 6,
        impressions: 112,
        time: '2023-10-07',
      },
      {
        clicks: 9,
        impressions: 124,
        time: '2023-10-08',
      },
      {
        clicks: 9,
        impressions: 176,
        time: '2023-10-09',
      },
      {
        clicks: 13,
        impressions: 166,
        time: '2023-10-10',
      },
      {
        clicks: 22,
        impressions: 201,
        time: '2023-10-11',
      },
      {
        clicks: 14,
        impressions: 146,
        time: '2023-10-12',
      },
      {
        clicks: 17,
        impressions: 155,
        time: '2023-10-13',
      },
      {
        clicks: 5,
        impressions: 109,
        time: '2023-10-14',
      },
      {
        clicks: 8,
        impressions: 139,
        time: '2023-10-15',
      },
      {
        clicks: 32,
        impressions: 278,
        time: '2023-10-16',
      },
      {
        clicks: 26,
        impressions: 339,
        time: '2023-10-17',
      },
      {
        clicks: 20,
        impressions: 263,
        time: '2023-10-18',
      },
      {
        clicks: 25,
        impressions: 269,
        time: '2023-10-19',
      },
      {
        clicks: 19,
        impressions: 215,
        time: '2023-10-20',
      },
      {
        clicks: 13,
        impressions: 162,
        time: '2023-10-21',
      },
      {
        clicks: 10,
        impressions: 162,
        time: '2023-10-22',
      },
      {
        clicks: 15,
        impressions: 289,
        time: '2023-10-23',
      },
      {
        clicks: 20,
        impressions: 300,
        time: '2023-10-24',
      },
      {
        clicks: 28,
        impressions: 372,
        time: '2023-10-25',
      },
      {
        clicks: 29,
        impressions: 353,
        time: '2023-10-26',
      },
      {
        clicks: 18,
        impressions: 215,
        time: '2023-10-27',
      },
      {
        clicks: 8,
        impressions: 150,
        time: '2023-10-28',
      },
      {
        clicks: 9,
        impressions: 157,
        time: '2023-10-29',
      },
      {
        clicks: 26,
        impressions: 349,
        time: '2023-10-30',
      },
      {
        clicks: 32,
        impressions: 329,
        time: '2023-10-31',
      },
      {
        clicks: 27,
        impressions: 282,
        time: '2023-11-01',
      },
      {
        clicks: 24,
        impressions: 308,
        time: '2023-11-02',
      },
      {
        clicks: 14,
        impressions: 216,
        time: '2023-11-03',
      },
      {
        clicks: 6,
        impressions: 179,
        time: '2023-11-04',
      },
      {
        clicks: 6,
        impressions: 253,
        time: '2023-11-05',
      },
      {
        clicks: 21,
        impressions: 405,
        time: '2023-11-06',
      },
      {
        clicks: 27,
        impressions: 502,
        time: '2023-11-07',
      },
      {
        clicks: 27,
        impressions: 508,
        time: '2023-11-08',
      },
      {
        clicks: 31,
        impressions: 468,
        time: '2023-11-09',
      },
      {
        clicks: 23,
        impressions: 344,
        time: '2023-11-10',
      },
      {
        clicks: 9,
        impressions: 254,
        time: '2023-11-11',
      },
      {
        clicks: 19,
        impressions: 305,
        time: '2023-11-12',
      },
      {
        clicks: 29,
        impressions: 491,
        time: '2023-11-13',
      },
      {
        clicks: 32,
        impressions: 640,
        time: '2023-11-14',
      },
      {
        clicks: 27,
        impressions: 551,
        time: '2023-11-15',
      },
      {
        clicks: 18,
        impressions: 455,
        time: '2023-11-16',
      },
      {
        clicks: 18,
        impressions: 388,
        time: '2023-11-17',
      },
      {
        clicks: 13,
        impressions: 284,
        time: '2023-11-18',
      },
      {
        clicks: 17,
        impressions: 262,
        time: '2023-11-19',
      },
      {
        clicks: 24,
        impressions: 561,
        time: '2023-11-20',
      },
      {
        clicks: 40,
        impressions: 570,
        time: '2023-11-21',
      },
      {
        clicks: 29,
        impressions: 432,
        time: '2023-11-22',
      },
      {
        clicks: 20,
        impressions: 419,
        time: '2023-11-23',
      },
      {
        clicks: 31,
        impressions: 536,
        time: '2023-11-24',
      },
      {
        clicks: 9,
        impressions: 292,
        time: '2023-11-25',
      },
      {
        clicks: 19,
        impressions: 296,
        time: '2023-11-26',
      },
      {
        clicks: 28,
        impressions: 566,
        time: '2023-11-27',
      },
      {
        clicks: 25,
        impressions: 544,
        time: '2023-11-28',
      },
      {
        clicks: 37,
        impressions: 643,
        time: '2023-11-29',
      },
      {
        clicks: 29,
        impressions: 491,
        time: '2023-11-30',
      },
      {
        clicks: 42,
        impressions: 552,
        time: '2023-12-01',
      },
      {
        clicks: 20,
        impressions: 265,
        time: '2023-12-02',
      },
      {
        clicks: 22,
        impressions: 369,
        time: '2023-12-03',
      },
      {
        clicks: 51,
        impressions: 715,
        time: '2023-12-04',
      },
      {
        clicks: 34,
        impressions: 599,
        time: '2023-12-05',
      },
      {
        clicks: 55,
        impressions: 701,
        time: '2023-12-06',
      },
      {
        clicks: 48,
        impressions: 632,
        time: '2023-12-07',
      },
      {
        clicks: 30,
        impressions: 430,
        time: '2023-12-08',
      },
      {
        clicks: 15,
        impressions: 361,
        time: '2023-12-09',
      },
      {
        clicks: 20,
        impressions: 325,
        time: '2023-12-10',
      },
      {
        clicks: 43,
        impressions: 717,
        time: '2023-12-11',
      },
      {
        clicks: 32,
        impressions: 655,
        time: '2023-12-12',
      },
      {
        clicks: 29,
        impressions: 600,
        time: '2023-12-13',
      },
      {
        clicks: 41,
        impressions: 600,
        time: '2023-12-14',
      },
      {
        clicks: 24,
        impressions: 439,
        time: '2023-12-15',
      },
      {
        clicks: 17,
        impressions: 289,
        time: '2023-12-16',
      },
      {
        clicks: 26,
        impressions: 408,
        time: '2023-12-17',
      },
      {
        clicks: 39,
        impressions: 722,
        time: '2023-12-18',
      },
      {
        clicks: 35,
        impressions: 660,
        time: '2023-12-19',
      },
      {
        clicks: 35,
        impressions: 595,
        time: '2023-12-20',
      },
      {
        clicks: 47,
        impressions: 690,
        time: '2023-12-21',
      },
      {
        clicks: 24,
        impressions: 451,
        time: '2023-12-22',
      },
      {
        clicks: 23,
        impressions: 361,
        time: '2023-12-23',
      },
      {
        clicks: 16,
        impressions: 453,
        time: '2023-12-24',
      },
      {
        clicks: 26,
        impressions: 548,
        time: '2023-12-25',
      },
      {
        clicks: 36,
        impressions: 664,
        time: '2023-12-26',
      },
      {
        clicks: 32,
        impressions: 614,
        time: '2023-12-27',
      },
      {
        clicks: 31,
        impressions: 691,
        time: '2023-12-28',
      },
      {
        clicks: 39,
        impressions: 506,
        time: '2023-12-29',
      },
      {
        clicks: 26,
        impressions: 458,
        time: '2023-12-30',
      },
      {
        clicks: 19,
        impressions: 312,
        time: '2023-12-31',
      },
      {
        clicks: 36,
        impressions: 543,
        time: '2024-01-01',
      },
      {
        clicks: 41,
        impressions: 731,
        time: '2024-01-02',
      },
      {
        clicks: 47,
        impressions: 777,
        time: '2024-01-03',
      },
      {
        clicks: 53,
        impressions: 766,
        time: '2024-01-04',
      },
      {
        clicks: 55,
        impressions: 720,
        time: '2024-01-05',
      },
      {
        clicks: 32,
        impressions: 516,
        time: '2024-01-06',
      },
      {
        clicks: 37,
        impressions: 598,
        time: '2024-01-07',
      },
      {
        clicks: 54,
        impressions: 969,
        time: '2024-01-08',
      },
      {
        clicks: 65,
        impressions: 1124,
        time: '2024-01-09',
      },
      {
        clicks: 55,
        impressions: 1103,
        time: '2024-01-10',
      },
      {
        clicks: 64,
        impressions: 1099,
        time: '2024-01-11',
      },
      {
        clicks: 52,
        impressions: 834,
        time: '2024-01-12',
      },
      {
        clicks: 24,
        impressions: 597,
        time: '2024-01-13',
      },
      {
        clicks: 39,
        impressions: 858,
        time: '2024-01-14',
      },
      {
        clicks: 72,
        impressions: 1314,
        time: '2024-01-15',
      },
      {
        clicks: 66,
        impressions: 1297,
        time: '2024-01-16',
      },
      {
        clicks: 70,
        impressions: 1343,
        time: '2024-01-17',
      },
      {
        clicks: 61,
        impressions: 1090,
        time: '2024-01-18',
      },
      {
        clicks: 53,
        impressions: 1075,
        time: '2024-01-19',
      },
      {
        clicks: 34,
        impressions: 664,
        time: '2024-01-20',
      },
      {
        clicks: 47,
        impressions: 944,
        time: '2024-01-21',
      },
      {
        clicks: 58,
        impressions: 1486,
        time: '2024-01-22',
      },
      {
        clicks: 57,
        impressions: 1123,
        time: '2024-01-23',
      },
      {
        clicks: 70,
        impressions: 1348,
        time: '2024-01-24',
      },
      {
        clicks: 65,
        impressions: 1381,
        time: '2024-01-25',
      },
      {
        clicks: 48,
        impressions: 1172,
        time: '2024-01-26',
      },
      {
        clicks: 25,
        impressions: 728,
        time: '2024-01-27',
      },
      {
        clicks: 35,
        impressions: 861,
        time: '2024-01-28',
      },
      {
        clicks: 93,
        impressions: 1597,
        time: '2024-01-29',
      },
      {
        clicks: 82,
        impressions: 1594,
        time: '2024-01-30',
      },
      {
        clicks: 88,
        impressions: 1520,
        time: '2024-01-31',
      },
      {
        clicks: 70,
        impressions: 1474,
        time: '2024-02-01',
      },
      {
        clicks: 49,
        impressions: 1128,
        time: '2024-02-02',
      },
      {
        clicks: 28,
        impressions: 692,
        time: '2024-02-03',
      },
      {
        clicks: 41,
        impressions: 952,
        time: '2024-02-04',
      },
      {
        clicks: 74,
        impressions: 1571,
        time: '2024-02-05',
      },
      {
        clicks: 90,
        impressions: 1444,
        time: '2024-02-06',
      },
    ],
  },
  {
    siteUrl: 'https://unlighthouse.dev',
    analytics: {
      period: { totalClicks: 436 },
      prevPeriod: { totalClicks: 0 },
    },
    indexedUrls: Array.from({ length: 45 }),
    nonIndexedUrls: Array.from({ length: 26 }),
  },
  {
    siteUrl: 'https://harlanzw.com/',
    analytics: { period: { totalClicks: 308, totalImpressions: 16593 }, prevPeriod: { totalClicks: 185, totalImpressions: 12407 } },
    indexedUrls: Array.from({ length: 19 }),
    nonIndexedUrls: Array.from({ length: 3 }),
    sitemaps: Array.from({ length: 1 }),
    nonIndexedPercent: 19 / 22,
  },
]
</script>

<template>
  <div>
    <Gradient class="z-0" />
    <UContainer class="z-1 relative">
      <section class="py-5 sm:py-12 xl:py-20">
        <div class="lg:flex xl:grid gap-8 xl:grid-cols-12 mx-auto w-full sm:px-6 lg:px-0 px-0">
          <div class="mx-auto max-w-[50rem] xl:col-span-6 lg:mr-10 lg:ml-0 mb-10 lg:mb-0 flex flex-col justify-center">
            <div class="text-gray-900/90 mb-3 dark:text-gray-100 text-center text-4xl font-bold sm:text-5xl lg:text-left lg:text-6xl">
              <div class="text-2xl opacity-70 font-normal mb-2">
                Crawled, but not indexed?
              </div>
              <span class="max-w-5xl">Get your pages indexed within 48 hours. <span class="text-lg font-normal">(on average)</span></span>
            </div>
            <p class="text-gray-700 dark:text-gray-300 mt-4 max-w-3xl text-center text-xl lg:text-left">
              Request Indexing is a free, open-source tool that will find your missing on pages Google and requests them to be
              indexed using the <NuxtLink to="/" class="underline">
                Web Search Indexing API
              </NuxtLink>.
            </p>

            <div class="mt-3 flex flex-col items-center justify-center gap-4 sm:mt-10 sm:flex-row sm:gap-6 lg:justify-start">
              <UButton v-if="!loggedIn" icon="i-heroicons-arrow-long-right" to="/get-started" size="xl" external color="green">
                <span>Get Started</span>
              </UButton>
              <template v-else>
                <UButton to="/dashboard" size="lg" color="gray">
                  <UAvatar :src="user.picture" size="xs" />
                  Dashboard
                </UButton>
              </template>
              <UButton size="xl" variant="link" color="black" icon="i-heroicons-command-line" to="/self-hosted">
                Run locally
              </UButton>
            </div>
          </div>
          <div class="lg:col-span-4 relative xl:col-span-6 max-w-full flex items-center justify-center">
            <UCard>
              <TableNonIndexedUrls mock class="bg-white" :value="SiteCards[0].nonIndexedUrls" :site="{ siteUrl: 'test', permissionLevel: 'siteOwner' }" />
            </UCard>
          </div>
        </div>
      </section>

      <ULandingFAQ
        :items="[{
          label: 'Sounds impossible? Is this some shady blackhat SEO?',
          content: 'Nope! These are public APIs managed by Google. We just make it easier to use them. You\'re not guaranteed to have your URLs indexed quicker, but it does, on average, speed up the process.',
          defaultOpen: true,
        }, {
          label: 'Can I see the code?',
          content: 'Sure! The entire project is open-source and available on GitHub under the MIT license. Build your own version if you like.',
        }]" multiple default-open class="max-w-3xl mx-auto"
      />

      <ULandingSection
        class="relative"
        align="left"
        title="And while you're at it."
        description="Google Search Console has no dashboard. Why is that? I'm not sure. It would be pretty useful, just check out these site cards."
        :features="[
          { name: 'See all of your data on one page', description: 'Culpa consectetur dolor pariatur commodo aliqua amet tempor nisi enim deserunt elit cillum.', icon: 'i-heroicons-check' },
          { name: 'Fast Indexing', description: 'Culpa consectetur dolor pariatur commodo aliqua amet tempor nisi enim deserunt elit cillum.' },
          { name: 'Secure', description: 'Culpa consectetur dolor pariatur commodo aliqua amet tempor nisi enim deserunt elit cillum.' },
        ]"
      >
        <div class="relative">
          <SiteCard
            v-for="(card, i) in SiteCards" :key="i"
            :site="{ siteUrl: card.siteUrl, permissionLevel: 'owner' }"
            :mock-data="card"
            :style="{ zIndex: 5 - i, translate: `${(i === 0 ? -1 : i) * 25}px ${i * 50}px` }"
            class="absolute -bottom-20 right-0 w-[400px] bg-white shadow-xl"
          />
        </div>
      </ULandingSection>

      <ULandingSection title="Built for the community" description="Trust us.">
        <UPageGrid>
          <ULandingCard v-for="(item, index) in [{ title: 'Open Source', description: 'Built with Nuxt as a proof-of-concept for a SaaS.', icon: 'i-simple-icons-nuxt' }]" :key="index" v-bind="item" />
        </UPageGrid>
      </ULandingSection>
    </UContainer>
  </div>
</template>
