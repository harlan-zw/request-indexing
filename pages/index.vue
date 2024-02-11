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
    nonIndexedPercent: 0.91,
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
    keywords: [
      {
        keyword: 'nuxt seo',
        position: 2.3571889103804,
        positionPercent: -0.48431649577312424,
        ctr: 0.0720681997277742,
        ctrPercent: -0.28147734953058084,
        clicks: 1006,
      },
      {
        keyword: 'nuxt-simple-sitemap',
        position: 2.8939267886855244,
        positionPercent: -0.2381858596849324,
        ctr: 0.0740432612312812,
        ctrPercent: 0.3172535022274704,
        clicks: 178,
      },
      {
        keyword: 'nuxtseo',
        position: 2.2145833333333336,
        positionPercent: -0.36998922413793095,
        ctr: 0.13020833333333334,
        ctrPercent: -0.5042067307692308,
        clicks: 125,
      },
      {
        keyword: 'nuxt simple sitemap',
        position: 2.861441013460016,
        positionPercent: -0.306623618780088,
        ctr: 0.09026128266033254,
        ctrPercent: 1.0639746634996041,
        clicks: 114,
      },
      {
        keyword: 'nuxt seo kit',
        position: 3.159656652360515,
        positionPercent: -0.6830621327170684,
        ctr: 0.096137339055794,
        ctrPercent: 2.134077253218884,
        clicks: 112,
      },
      {
        keyword: '@nuxtseo/module',
        position: 1.9105339105339105,
        positionPercent: -0.6541564274428949,
        ctr: 0.10966810966810966,
        ctrPercent: -0.058682058682058745,
        clicks: 76,
      },
      {
        keyword: 'nuxt seo module',
        position: 1.6607407407407409,
        positionPercent: -0.5139295392953929,
        ctr: 0.10518518518518519,
        ctrPercent: -0.6493827160493827,
        clicks: 71,
      },
      {
        keyword: 'nuxt-simple-robots',
        position: 3.3314176245210727,
        positionPercent: 0.19753621709855118,
        ctr: 0.1360153256704981,
        ctrPercent: 0.3220689655172414,
        clicks: 71,
      },
      {
        keyword: 'nuxt-seo',
        position: 2.166281755196305,
        positionPercent: -0.31072853243753923,
        ctr: 0.12471131639722864,
        ctrPercent: -0.2063825320176359,
        clicks: 54,
      },
      {
        keyword: 'nuxt simple robots',
        position: 3.046808510638298,
        positionPercent: 0.04232922732362811,
        ctr: 0.19574468085106383,
        ctrPercent: 0.11329787234042547,
        clicks: 46,
      },
      {
        keyword: 'defineogimage',
        position: 1.9061032863849765,
        positionPercent: 0.270735524256651,
        ctr: 0.19718309859154928,
        ctrPercent: -0.014084507042253641,
        clicks: 42,
      },
      {
        keyword: 'nuxt sitemap',
        position: 9.69927536231884,
        positionPercent: -0.4629380021527698,
        ctr: 0.024758454106280192,
        ctrPercent: null,
        clicks: 41,
      },
    ],
    period: [
      {
        url: '/',
        clicks: 1719,
        prevClicks: 406,
        clicksPercent: 3.2339901477832513,
        impressions: 6526,
        prevImpressions: 2535,
        impressionsPercent: 1.5743589743589743,
      },
      {
        url: '/sitemap/getting-started/installation',
        clicks: 522,
        prevClicks: 142,
        clicksPercent: 2.676056338028169,
        impressions: 6338,
        prevImpressions: 2987,
        impressionsPercent: 1.1218613993973887,
      },
      {
        url: '/robots/getting-started/installation',
        clicks: 178,
        prevClicks: 66,
        clicksPercent: 1.696969696969697,
        impressions: 5094,
        prevImpressions: 1204,
        impressionsPercent: 3.2308970099667773,
      },
      {
        url: '/experiments/guides/open-graph-images',
        clicks: 88,
        prevClicks: 13,
        clicksPercent: 5.769230769230769,
        impressions: 5326,
        prevImpressions: 817,
        impressionsPercent: 5.518971848225214,
      },
      {
        url: '/og-image/guides/cache',
        clicks: 88,
        prevClicks: 0,
        clicksPercent: null,
        impressions: 1074,
        prevImpressions: 10,
        impressionsPercent: 106.4,
      },
      {
        url: '/sitemap/guides/prerendering',
        clicks: 66,
        prevClicks: 1,
        clicksPercent: 65,
        impressions: 1151,
        prevImpressions: 24,
        impressionsPercent: 46.958333333333336,
      },
      {
        url: '/site-config/getting-started/installation',
        clicks: 64,
        prevClicks: 38,
        clicksPercent: 0.6842105263157895,
        impressions: 3877,
        prevImpressions: 633,
        impressionsPercent: 5.124802527646129,
      },
      {
        url: '/og-image/getting-started/installation',
        clicks: 63,
        prevClicks: 29,
        clicksPercent: 1.1724137931034482,
        impressions: 2646,
        prevImpressions: 1289,
        impressionsPercent: 1.0527540729247478,
      },
      {
        url: '/schema-org/getting-started/installation',
        clicks: 50,
        prevClicks: 15,
        clicksPercent: 2.3333333333333335,
        impressions: 1860,
        prevImpressions: 1081,
        impressionsPercent: 0.7206290471785384,
      },
      {
        url: '/sitemap/releases/v4',
        clicks: 41,
        prevClicks: 0,
        clicksPercent: 0,
        impressions: 859,
        prevImpressions: 0,
        impressionsPercent: 0,
      },
      {
        url: '/nuxt-seo/guides/title-templates',
        clicks: 38,
        prevClicks: 5,
        clicksPercent: 6.6,
        impressions: 1313,
        prevImpressions: 42,
        impressionsPercent: 30.261904761904763,
      },
      {
        url: '/sitemap/guides/dynamic-urls',
        clicks: 36,
        prevClicks: 2,
        clicksPercent: 17,
        impressions: 1121,
        prevImpressions: 22,
        impressionsPercent: 49.95454545454545,
      },
      {
        url: '/og-image/getting-started/your-first-image',
        clicks: 32,
        prevClicks: 31,
        clicksPercent: 0.03225806451612903,
        impressions: 366,
        prevImpressions: 308,
        impressionsPercent: 0.18831168831168832,
      },
      {
        url: '/sitemap/api/config',
        clicks: 30,
        prevClicks: 5,
        clicksPercent: 5,
        impressions: 483,
        prevImpressions: 70,
        impressionsPercent: 5.9,
      },
      {
        url: '/og-image/api/define-og-image',
        clicks: 23,
        prevClicks: 0,
        clicksPercent: 0,
        impressions: 146,
        prevImpressions: 0,
        impressionsPercent: 0,
      },
      {
        url: '/link-checker/getting-started/installation',
        clicks: 22,
        prevClicks: 11,
        clicksPercent: 1,
        impressions: 907,
        prevImpressions: 437,
        impressionsPercent: 1.0755148741418765,
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
        <div class="xl:grid gap-8 xl:grid-cols-12 mx-auto w-full sm:px-6 lg:px-0 px-0">
          <div class="mx-auto max-w-[50rem] xl:col-span-6 xl:mr-10 xl:ml-0 mb-10 xl:mb-0 flex flex-col justify-center">
            <div class="text-gray-900 mb-3 dark:text-gray-100 text-center text-4xl font-bold sm:text-5xl lg:text-left lg:text-6xl">
              <div class="text-2xl opacity-70 font-normal mb-2">
                Crawled, but not indexed?
              </div>
              <span class="max-w-5xl">Get your pages indexed within 48 hours</span>
            </div>
            <p class="text-gray-700 dark:text-gray-300 max-w-3xl text-center text-xl lg:text-left mb-5">
              A free, open-source tool to request pages to be
              indexed using the <NuxtLink to="/" class="font-semibold">
                Web Search Indexing API
              </NuxtLink> and view your <NuxtLink to="https://search.google.com/search-console/about" class="font-semibold">
                Google Search Console
              </NuxtLink> data.
            </p>
            <div class="mb-10 flex items-center justify-center gap-3 flex-row sm:gap-6 lg:justify-start">
              <UButton v-if="!loggedIn" icon="i-heroicons-arrow-long-right" to="/get-started" size="xl" external color="green">
                <span>Get Started<span class="hidden sm:inline"> For Free</span></span>
              </UButton>
              <template v-else>
                <UButton to="/dashboard" size="lg" color="gray">
                  <UAvatar :src="user.picture" size="xs" />
                  Dashboard
                </UButton>
              </template>
              <UButton size="xl" variant="link" color="black" icon="i-simple-icons-github" target="_blank" to="https://github.com/harlan-zw/request-indexing">
                View code
              </UButton>
            </div>
            <div class="text-base ml-5 space-y-5">
              <p>
                ⚡ <a href="#" class="underline">Request indexing</a> on new sites and pages, have them appear on Google in 48 hours.
              </p>
              <p>
                📊 <a href="#dashboard" class="underline">Dashboard</a> to see the search performance of all your Google Search Console sites.
              </p>
              <p>
                🌲 <a href="#dashboard" class="underline">Keep your site data</a>. Google Search Console data deletes site data longer than 16 months, start keeping it.
              </p>
            </div>
          </div>
          <div class="xl:col-span-6 relative max-w-full flex items-center justify-center">
            <UCard class="shadow-lg max-w-full">
              <template #header>
                <div class="flex items-center justify-between gap-3">
                  <div class="flex items-center justify-between gap-7 w-full">
                    <div>
                      <div class="text-xl sm:text-3xl flex items-center gap-2 dark:text-gray-300 text-gray-900 ">
                        <img src="https://www.google.com/s2/favicons?domain=https://nuxtseo.com" alt="favicon" class="w-4 h-4 rounded-sm">
                        nuxtseo.com
                      </div>
                      <div>
                        <div class="opacity-60 text-sm sm:text-lg">
                          Domain Property
                        </div>
                      </div>
                    </div>
                    <div class="hidden sm:flex items-center text-right gap-3 text-gray-500 text-sm justify-end">
                      <span>% of your pages<br> indexed</span>
                      <MetricGuage :score="0.91">
                        <div class="text-xl">
                          91
                        </div>
                      </MetricGuage>
                    </div>
                  </div>
                </div>
              </template>
              <TableNonIndexedUrls mock :value="SiteCards[0].nonIndexedUrls" :site="{ siteUrl: 'test', permissionLevel: 'siteOwner' }" />
            </UCard>
          </div>
        </div>
      </section>
    </UContainer>

    <div class="dark:bg-gray-950">
      <UContainer class="z-1 relative">
        <ULandingSection
          id="dashboard"
          class="relative"
          align="left"
          title="Insights for all your sites in one dashboard"
          description="Google Search Console has no dashboard. Why is that? I'm not sure. It would be pretty useful, just check out these site cards."
          :features="[
            { name: 'All of your sites. One page.', description: 'See the search performance of all your sites in one a simple dashboard.', icon: 'i-heroicons-eye' },
            { name: 'Growth insights as clear as day.', description: 'See how your pages clicks and impressions are trending between periods, as well as your keywords.', icon: 'i-heroicons-chart-bar-square' },
            { name: 'See Percent Indexed', description: 'See the search performance of all your sites in one a simple dashboard.', icon: 'i-heroicons-arrow-path' },
          ]"
        >
          <div class="relative">
            <SiteCard
              v-for="(card, i) in SiteCards" :key="i"
              :site="{ siteUrl: card.siteUrl, permissionLevel: 'owner' }"
              :mock-data="card"
              :style="{ zIndex: 5 - i, translate: `${(i === 0 ? -1 : i) * 25}px ${i * 50}px` }"
              class="lg:absolute -bottom-20  right-0 w-full mx-auto max-w-[400px] bg-white shadow-xl"
              :class="i > 0 ? 'hidden lg:block' : ''"
            />
          </div>
          <template #bottom>
            <div class="mt-12 max-w-3xl mx-auto">
              <UTabs
                class="" :items="[
                  { label: 'Indexed Pages', count: SiteCards[0].period.length },
                  { label: 'Keywords', count: SiteCards[0].keywords.length },
                ]"
              >
                <template #default="{ item, index, selected }">
                  <div class="flex items-center gap-2 relative truncate ">
                    <UBadge v-if="item.count" :color="selected ? 'green' : 'gray'">
                      {{ item.count }}
                    </UBadge>
                    <UIcon v-else-if="index === 0" name="i-heroicons-check-circle" class="w-5 h-5" :class="selected ? 'text-green-400' : 'text-gray-400'" />
                    <span class="truncate">{{ item.label }}</span>
                  </div>
                </template>
                <template #item="{ item }">
                  <div class="my-5 shadow-lg">
                    <UCard v-if="item.label === 'Indexed Pages'">
                      <TableIndexedUrls :page-count="4" :value="SiteCards[0].period" site-url="nuxtseo.com" />
                    </UCard>
                    <UCard v-else>
                      <TableKeywords :page-count="4" :value="SiteCards[0].keywords" />
                    </UCard>
                  </div>
                </template>
              </UTabs>
            </div>
          </template>
        </ULandingSection>

        <ULandingSection
          title="Google is deleting your valuable data"
          description="Your data is only stored for 16 months before its permanently deleted from Google Search Console. Without this data you won't be able to see larger trends on your sites."
          align="left"
          :features="[
            { name: 'Retain for as long as you want', description: 'You have your data retained for as long as you like, you will always have access to it and can export it.', icon: 'i-heroicons-circle-stack' },
            { name: 'Own your data', description: 'It\'s your data, do what you want with it. Export it, access it via an API or delete it.', icon: 'i-heroicons-eye-slash' },
          ]"
        >
          <template #top>
            <UBadge color="blue" class="ml-7 mb-3" variant="outline">
              Coming Soon
            </UBadge>
          </template>
          <ULandingTestimonial
            icon="i-simple-icons-google"
            quote="Search Console keeps data for the last 16 months. As a result, SEO reports in Analytics also include a maximum of 16 months of data."
            :author="{ name: 'Google Analytics', to: 'https://support.google.com/analytics/answer/1308621?hl=en#:~:text=Search%20Console%20keeps%20data%20for,is%20collected%20by%20Search%20Console.', target: '_blank' }"
            card
          />
        </ULandingSection>

        <ULandingSection title="You have questions">
          <ULandingFAQ
            :items="[
              {
                label: 'Does it actually work?',
                content: 'It does not guarantee to have all of your URLs indexed quicker, but it does, on average, speed up the process.',
              },
              {
                label: 'Will I be penalized for using this?',
                content: 'Nope! These are public APIs managed by Google. We just make it easier to use them.',
              }, {
                label: 'Can I see the code?',
                content: 'Sure! The entire project is open-source and available on GitHub under the MIT license. Build your own version if you like.',
              }]" multiple default-open class="max-w-3xl mx-auto"
          />
        </ULandingSection>

        <ULandingSection title="Built by developers, for developers" description="Request Indexing is a project build for everyone. It does not paywall you or expect you to know how to code.">
          <UPageGrid>
            <ULandingCard
              v-for="(item, index) in [
                { title: 'Open Source', description: 'Released under MIT license on GitHub. Built with Nuxt by a Nuxt core team as an idealized version of an open-source SaaS.', icon: 'i-heroicons-check-badge' },
                { title: 'Private', description: 'It\'s simple, we want as little of your data as possible to make a great tool. Delete your data at any time.', icon: 'i-heroicons-eye-slash' },
                { title: 'Secure', description: 'Encryption at rest and transit for sensitive data. Secure hashes to avoid leaking your Google sub, you name.', icon: 'i-heroicons-lock-closed' },
              ]" :key="index" v-bind="item"
            />
          </UPageGrid>
        </ULandingSection>

        <ULandingSection>
          <ULandingCTA title="Request Indexing on your pages today" description="Get started for free now and get your pages, find valuable insights through your GSC data and storing your GSC data older than 16 months." :links="[{ label: 'Get Started', to: '/get-started', size: 'xl' }]" class="bg-gray-100/50 dark:bg-gray-800/50">
            <template #description>
              <div class="text-lg max-w-xl mx-auto text-left space-y-5">
                <p>
                  ⚡ <a href="#" class="underline">Request indexing</a> on new sites and pages, have them appear on Google in 48 hours.
                </p>
                <p>
                  📊 <a href="#dashboard" class="underline">Dashboard</a> to see the search performance of all your Google Search Console sites.
                </p>
                <p>
                  🌲 <a href="#dashboard" class="underline">Keep your site data</a>. Google Search Console data deletes site data longer than 16 months, start keeping it.
                </p>
              </div>
            </template>
          </ULandingCTA>
        </ULandingSection>
      </UContainer>
    </div>
  </div>
</template>
