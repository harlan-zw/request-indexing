import { withBase, withHttps, withoutBase, withoutProtocol, withoutTrailingSlash } from 'ufo'
import { OAuth2Client } from 'googleapis-common'
import { searchconsole } from '@googleapis/searchconsole'
import type { searchconsole_v1 } from '@googleapis/searchconsole/v1'
import type { H3Event } from 'h3'
import { count } from 'drizzle-orm'
import dayjs from 'dayjs'
import countries from '../../data/countries'
import type { ResolvedAnalyticsRange, SiteAnalytics } from '~/types'
import { percentDifference } from '~/server/app/utils/formatting'
import { requireEventSite } from '~/server/app/services/util'
import { authenticateUser } from '~/server/app/utils/auth'
import type {
  GoogleAccountsSelect,
  GoogleOAuthClientsSelect,
  SiteSelect,
} from '~/server/database/schema'
import {
  siteDateAnalytics,
  sitePaths,
} from '~/server/database/schema'
import type { RequiredNonNullable } from '~/types/util'
import { userPeriodRange } from '~/server/app/models/User'

export async function recursiveQuery(api: searchconsole_v1.Searchconsole, query: searchconsole_v1.Params$Resource$Searchanalytics$Query, page: number = 1, rows: searchconsole_v1.Schema$ApiDataRow[] = []) {
  const rowLimit = query.requestBody?.rowLimit || 25_000 // 25k hard limit
  const res = await api.searchanalytics.query({
    ...query,
    requestBody: {
      ...query.requestBody,
      startRow: (page - 1) * rowLimit,
    },
  })
  const _rows = res.data?.rows || []
  const rowsLength = _rows.length || 0
  // add res rows
  rows.push(..._rows)
  if (rowsLength === rowLimit)
    await recursiveQuery(api, query, page + 1, rows)

  return { data: { rows }, pages: page }
}

export function createGoogleOAuthClient(account: GoogleAccountsSelect & { googleOAuthClient: GoogleOAuthClientsSelect }) {
  // token = token || tokens[0]
  return new OAuth2Client({
    // tells client to use the refresh_token...
    forceRefreshOnFailure: true,
    credentials: account.tokens,
    clientId: account.googleOAuthClient.clientId,
    clientSecret: account.googleOAuthClient.clientSecret,
  })
}

// export async function fetchGoogleSearchConsoleDates(account: GoogleAccountsSelect & { googleOAuthClient: GoogleOAuthClientsSelect }, siteUrl: string, options: Schema$SearchAnalyticsQueryRequest = {}): Promise<searchconsole_v1.Schema$ApiDataRow[]> {
//   const services = searchconsole({
//     version: 'v1',
//     h3: createGoogleOAuthClient(account),
//   })
//   // we need accurate data, use last 6 weeks
//   const startPeriod = new Date()
//   startPeriod.setDate(new Date().getDate() - 28)
//   return await services.searchanalytics.query({
//     siteUrl,
//     requestBody: {
//       ...options,
//       startDate: formatDateGsc(options.startDate) || formatDateGsc(startPeriod),
//       endDate: formatDateGsc(options.endDate) || formatDateGsc(),
//       dataState: 'all',
//       dimensions: ['date'],
//       type: 'web',
//       startRow: 0,
//       aggregationType: 'byPage',
//       rowLimit: 5000,
//     },
//   }).then(res => (res.data.rows || []))
// }

// export async function fetchGoogleSearchConsolePages(account: GoogleAccountsSelect & { googleOAuthClient: GoogleOAuthClientsSelect }, siteUrl: string, options: Schema$SearchAnalyticsQueryRequest = {}): Promise<searchconsole_v1.Schema$ApiDataRow[]> {
//   const services = searchconsole({
//     version: 'v1',
//     h3: createGoogleOAuthClient(account),
//   })
//   // we need accurate data, use last 6 weeks
//   const startPeriod = new Date()
//   startPeriod.setDate(new Date().getDate() - 28)
//
//   return await services.searchanalytics.query({
//     siteUrl,
//     requestBody: {
//       ...options,
//       startDate: options.startDate || formatDateGsc(startPeriod),
//       endDate: options.endDate || formatDateGsc(),
//       dataState: 'all',
//       dimensions: ['page'],
//       type: 'web',
//       startRow: 0,
//       aggregationType: 'byPage',
//       rowLimit: 5000,
//     },
//   }).then(res => (res.data.rows || []))
// }

export async function inspectGscUrl(account: GoogleAccountsSelect & { googleOAuthClient: GoogleOAuthClientsSelect }, site: SiteSelect, path: string) {
  const gscApi = searchconsole({
    version: 'v1',
    auth: createGoogleOAuthClient(account),
  })
  const inspection = await gscApi.urlInspection.index.inspect({
    requestBody: {
      inspectionUrl: withHttps(withBase(path, site.domain!)),
      siteUrl: site.property,
    },
  }).then(r => r.data)
  const isIndexed = inspection.inspectionResult?.indexStatusResult?.verdict === 'PASS'
  // save inspection to siteUrls
  const siteUrlUpdated = await useDrizzle().update(sitePaths).set({
    lastInspected: Date.now(),
    isIndexed,
    inspectionPayload: inspection.inspectionResult,
    indexingVerdict: inspection.inspectionResult?.indexStatusResult?.verdict,
  }).where(and(eq(sitePaths.siteId, site.siteId), eq(sitePaths.path, path)))
    .returning()

  if (isIndexed) {
    const indexedPages = await useDrizzle().select({ count: count() })
      .from(sitePaths)
      .where(and(eq(sitePaths.siteId, site.siteId), eq(sitePaths.isIndexed, true)))
    const nonIndexedPages = await useDrizzle().select({ count: count() })
      .from(sitePaths)
      .where(and(eq(sitePaths.siteId, site.siteId), eq(sitePaths.isIndexed, false)))
    // we need to update the site's indexed pages for the day
    await useDrizzle().update(siteDateAnalytics).set({
      // do a count of all indexed pages for the day
      indexedPagesCount: indexedPages[0].count,
      totalPagesCount: indexedPages[0].count + nonIndexedPages[0].count,
    }).where(and(eq(siteDateAnalytics.siteId, site.siteId), eq(siteDateAnalytics.date, dayjs().format('YYYY-MM-DD'))))
  }

  return {
    inspection,
    siteUrl: siteUrlUpdated,
  }
}

export async function fetchGscSites(account: GoogleAccountsSelect & { googleOAuthClient: GoogleOAuthClientsSelect }): Promise<(RequiredNonNullable<searchconsole_v1.Schema$WmxSite>)[]> {
  const api = searchconsole({
    version: 'v1',
    auth: createGoogleOAuthClient(account),
  })
  return api.sites.list().then(res => res.data?.siteEntry || [])
  // return Promise.all(sites.map(async (site) => {
  //   console.log(site.siteUrl, site.permissionLevel)
  //   return {
  //     sitemaps: site.permissionLevel === 'owner'
  //       ? await api.sitemaps.list({
  //         siteUrl: site.siteUrl!,
  //       }).then(res => res.data.sitemap || [])
  //       : [],
  //     ...site as RequiredNonNullable<searchconsole_v1.Schema$WmxSite>,
  //   }
  // }))
}

export async function fetchGscSitesWithSitemaps(account: GoogleAccountsSelect & { googleOAuthClient: GoogleOAuthClientsSelect }): Promise<(RequiredNonNullable<searchconsole_v1.Schema$WmxSite> & { sitemaps: RequiredNonNullable<searchconsole_v1.Schema$WmxSitemap>[] })[]> {
  const api = searchconsole({
    version: 'v1',
    auth: createGoogleOAuthClient(account),
  })
  const sites = (await api.sites.list().then(res => (res.data.siteEntry || []))).filter((s) => {
    return s.permissionLevel !== 'siteUnverifiedUser'
  })
  return Promise.all(sites.map(async (site) => {
    return {
      sitemaps: site.permissionLevel === 'owner'
        ? await api.sitemaps.list({
          siteUrl: site.siteUrl!,
        }).then(res => res.data.sitemap || [])
        : [],
      ...site as RequiredNonNullable<searchconsole_v1.Schema$WmxSite>,
    }
  }))
}

// export async function fetchGoogleSearchConsoleAnalytics(account: GoogleAccountsSelect & { googleOAuthClient: GoogleOAuthClientsSelect }, periodRange: ResolvedAnalyticsRange, site: SiteSelect): Promise<SiteAnalytics> {
//   const services = searchconsole({
//     version: 'v1',
//     h3: createGoogleOAuthClient(account),
//   })
//
//   const [dates] = await Promise.all([
//     // dates for the graph
//     fetchGSCDates(credentials, periodRange, site),
//     // pages for indexed card metrics
//     fetchGSCPages(credentials, periodRange, site),
//   ])
//
//   const requestBody = {
//     dimensions: ['page'],
//     type: 'web',
//     aggregationType: 'byPage',
//   }
//   const [/*keywordsPeriod, keywordsPrevPeriod, */period, prevPeriod, graph] = (await Promise.all([
//     // do a query based on keywords instead of dates
//     // services.searchanalytics.query({
//     //   siteUrl,
//     //   requestBody: {
//     //     ...requestBody,
//     //     // 1 month
//     //     startDate: formatDateGsc(startPeriod),
//     //     endDate: formatDateGsc(),
//     //     // keywords
//     //     dimensions: ['query'],
//     //   },
//     // }),
//     // services.searchanalytics.query({
//     //   siteUrl,
//     //   requestBody: {
//     //     ...requestBody,
//     //     // 1 month
//     //     startDate: formatDateGsc(startPrevPeriod),
//     //     endDate: formatDateGsc(endPrevPeriod),
//     //     // keywords
//     //     dimensions: ['query'],
//     //   },
//     // }),
//     services.searchanalytics.query({
//       siteUrl,
//       requestBody: {
//         ...requestBody,
//         // 1 month
//         startDate: formatDateGsc(startPeriod),
//         endDate: formatDateGsc(),
//       },
//     }),
//     services.searchanalytics.query({
//       siteUrl,
//       requestBody: {
//         ...requestBody,
//         startDate: formatDateGsc(startPrevPeriod),
//         endDate: formatDateGsc(endPrevPeriod),
//       },
//     }),
//     // do another query but do it based on clicks / impressions for the day
//     services.searchanalytics.query({
//       siteUrl,
//       requestBody: {
//         ...requestBody,
//         startDate: formatDateGsc(startPrevPeriod),
//         endDate: formatDateGsc(),
//         dimensions: ['date'],
//       },
//     }),
//   ]))
//     .map(res => res.data.rows || [])
//   const analytics = {
//     // compute analytics from calcualting each url stats togethor
//     period: {
//       totalClicks: period!.reduce((acc, row) => acc + row.clicks!, 0),
//       totalImpressions: period!.reduce((acc, row) => acc + row.impressions!, 0),
//     },
//     prevPeriod: {
//       totalClicks: prevPeriod!.reduce((acc, row) => acc + row.clicks!, 0),
//       totalImpressions: prevPeriod!.reduce((acc, row) => acc + row.impressions!, 0),
//     },
//   }
//   const normalizedSiteUrl = normalizeSiteUrl(siteUrl)
//   const indexedUrls = period!
//     .map(r => r.keys![0].replace('www.', '')) // doman property using www.
//     // strip out subdomains, hash and query
//     .filter(r => !r.includes('#') && !r.includes('?')
//     // fix www.
//     && r.startsWith(normalizedSiteUrl),
//     )
//
//   const sitemaps = await services.sitemaps.list({
//     siteUrl,
//   })
//     .then(res => res.data.sitemap || [])
//   return {
//     analytics,
//     sitemaps,
//     indexedUrls,
//     period: period.map((row) => {
//       const prevPeriodRow = prevPeriod.find(r => r.keys![0] === row.keys![0])
//       return {
//         url: withoutBase(withoutProtocol(row.keys![0]), site.domain),
//         clicks: row.clicks!,
//         prevClicks: prevPeriodRow ? prevPeriodRow.clicks! : 0,
//         clicksPercent: percentDifference(row.clicks!, prevPeriodRow?.clicks || 0),
//         impressions: row.impressions!,
//         impressionsPercent: percentDifference(row.impressions!, prevPeriodRow?.impressions || 0),
//         prevImpressions: prevPeriodRow ? prevPeriodRow.impressions! : 0,
//       } satisfies SiteAnalytics['period'][0]
//     }),
//     // keywords: keywordsPeriod.map((row) => {
//     //   const prevPeriodRow = keywordsPrevPeriod.find(r => r.keys![0] === row.keys![0])
//     //   return {
//     //     keyword: row.keys![0],
//     //     // position and ctr
//     //     position: row.position!,
//     //     positionPercent: percentDifference(row.position!, prevPeriodRow?.position || 0),
//     //     prevPosition: prevPeriodRow ? prevPeriodRow.position! : 0,
//     //     ctr: row.ctr!,
//     //     ctrPercent: percentDifference(row.ctr!, prevPeriodRow?.ctr || 0),
//     //     prevCtr: prevPeriodRow ? prevPeriodRow.ctr! : 0,
//     //     clicks: row.clicks!,
//     //   } satisfies SiteAnalytics['keywords'][0]
//     // }),
//     graph: graph.map((row) => {
//       // fix key
//       return {
//         clicks: row.clicks!,
//         impressions: row.impressions!,
//         time: row.keys![0],
//         keys: undefined,
//       } satisfies SiteAnalytics['graph'][0]
//     }),
//   }
// }

export async function fetchGSCDates(account: GoogleAccountsSelect & { googleOAuthClient: GoogleOAuthClientsSelect }, range: ResolvedAnalyticsRange, site: SiteSelect): Promise<{ startDate?: string, endDate?: string, rows: (Omit<searchconsole_v1.Schema$ApiDataRow, 'keys'> & { date: string })[] }> {
  const api = searchconsole({
    version: 'v1',
    auth: createGoogleOAuthClient(account),
  })
  const dates = await api.searchanalytics.query({
    siteUrl: site.property,
    requestBody: {
      ...generateDefaultQueryBody(site, range.period),
      dimensions: ['date'],
    },
  }).then((res) => {
    return (res.data.rows || []).map((row) => {
      return {
        ...row,
        date: row.keys![0],
        keys: undefined,
      }
    })
  })
  if (!dates.length) {
    return {
      startDate: undefined,
      endDate: undefined,
      rows: [],
    }
  }
  return {
    startDate: dates[0].date,
    endDate: dates[dates.length - 1].date,
    rows: dates,
  }
}

export async function fetchGSCDevices(account: GoogleAccountsSelect & { googleOAuthClient: GoogleOAuthClientsSelect }, range: ResolvedAnalyticsRange, site: SiteSelect): Promise<searchconsole_v1.Schema$ApiDataRow[]> {
  const api = searchconsole({
    version: 'v1',
    auth: createGoogleOAuthClient(account),
  })
  const [period, prevPeriod] = await Promise.all([
    api.searchanalytics.query({
      siteUrl: site.property,
      requestBody: {
        ...generateDefaultQueryBody(site, range.period),
        dimensions: ['device'],
      },
    }).then((res) => {
      return (res.data.rows || []).map((row) => {
        return {
          ...row,
          device: row.keys![0],
          keys: undefined,
        }
      })
    }),
    api.searchanalytics.query({
      siteUrl: site.property,
      requestBody: {
        ...generateDefaultQueryBody(site, range.prevPeriod),
        dimensions: ['device'],
      },
    }).then((res) => {
      return (res.data.rows || []).map((row) => {
        return {
          ...row,
          device: row.keys![0],
          keys: undefined,
        }
      })
    }),
  ])

  return { period, prevPeriod }
}

export async function fetchGSCCountries(account: GoogleAccountsSelect & { googleOAuthClient: GoogleOAuthClientsSelect }, range: ResolvedAnalyticsRange, site: SiteSelect): Promise<searchconsole_v1.Schema$ApiDataRow[]> {
  const api = searchconsole({
    version: 'v1',
    auth: createGoogleOAuthClient(account),
  })
  function fixCountryRows(res) {
    return (res.data.rows || []).map((row) => {
      const alpha3Code = row.keys![0]
      const country = countries.find(c => c['alpha-3'].toLowerCase() === alpha3Code)
      return {
        ...row,
        countryCodeGsc: alpha3Code,
        country: country?.name || alpha3Code,
        countryCode: country?.['alpha-2'] || alpha3Code,
        keys: undefined,
      }
    })
  }
  const [period, prevPeriod] = await Promise.all([
    api.searchanalytics.query({
      siteUrl: site.property,
      requestBody: {
        ...generateDefaultQueryBody(site, range.period),
        dimensions: ['country'],
        rowLimit: 5,
      },
    }).then(fixCountryRows),
    api.searchanalytics.query({
      siteUrl: site.property,
      requestBody: {
        ...generateDefaultQueryBody(site, range.prevPeriod),
        dimensions: ['country'],
        rowLimit: 5,
      },
    }).then(fixCountryRows),
  ])

  // for each country, we want to check the keywords
  const keywords = await Promise.all(period.map(async (row) => {
    return api.searchanalytics.query({
      siteUrl: site.property,
      requestBody: {
        ...generateDefaultQueryBody(site, range.period, [
          {
            dimension: 'country',
            operator: 'equals',
            expression: row.countryCodeGsc,
          },
        ]),
        dimensions: ['query'],
      },
    }).then((res) => {
      return {
        countryCodeGsc: row.countryCodeGsc,
        keywords: res!.data.rows?.length || 0,
      }
    })
  }))
  // join keywords to period country
  for (const row of period) {
    const keyword = keywords.find(k => k.countryCodeGsc === row.countryCodeGsc)
    if (keyword)
      row.keywords = keyword.keywords
  }

  return { period, prevPeriod, keywords }
}

export async function fetchGSCAnalytics(account: GoogleAccountsSelect & { googleOAuthClient: GoogleOAuthClientsSelect }, range: ResolvedAnalyticsRange, site: SiteSelect): Promise<searchconsole_v1.Schema$ApiDataRow[]> {
  const api = searchconsole({
    version: 'v1',
    auth: createGoogleOAuthClient(account),
  })
  const [period, prevPeriod, keywordsPeriod, keywordsPrevPeriod] = await Promise.all([
    api.searchanalytics.query({
      siteUrl: site.property,
      requestBody: {
        ...generateDefaultQueryBody(site, range.period),
      },
    }).then((res) => {
      return (res.data.rows || [])[0]
    }),
    api.searchanalytics.query({
      siteUrl: site.property,
      requestBody: {
        ...generateDefaultQueryBody(site, range.prevPeriod),
      },
    }).then((res) => {
      return (res.data.rows || [])[0]
    }),
    // also check keywords
    api.searchanalytics.query({
      siteUrl: site.property,
      requestBody: {
        ...generateDefaultQueryBody(site, range.period),
        dimensions: ['date', 'query'],
      },
    }).then((res) => {
      return (res.data.rows || [])
    }),
    api.searchanalytics.query({
      siteUrl: site.property,
      requestBody: {
        ...generateDefaultQueryBody(site, range.prevPeriod),
        dimensions: ['date', 'query'],
      },
    }).then((res) => {
      return (res.data.rows || [])
    }),
  ])

  return { period, prevPeriod, keywordsPeriod, keywordsPrevPeriod }
}

export type GscPage = (Omit<searchconsole_v1.Schema$ApiDataRow, 'keys'> & { page: string })

export async function fetchGSCPages(account: GoogleAccountsSelect & { googleOAuthClient: GoogleOAuthClientsSelect }, range: ResolvedAnalyticsRange, site: SiteSelect): Promise<GscPage[]> {
  const api = searchconsole({
    version: 'v1',
    auth: createGoogleOAuthClient(account),
  })
  const period = await recursiveQuery(api, {
    siteUrl: site.property,
    requestBody: {
      ...generateDefaultQueryBody(site, range.period),
      dimensions: ['page'],
    },
  }).then(d => d.data.rows)
  return period.map((row) => {
    return {
      ...row,
      page: row.keys![0]!,
    }
  })
}

export async function fetchGSCPagesWithKeywords(account: GoogleAccountsSelect & { googleOAuthClient: GoogleOAuthClientsSelect }, range: ResolvedAnalyticsRange, site: SiteSelect, options?: searchconsole_v1.Schema$SearchAnalyticsQueryRequest): Promise<{ rows: SiteAnalytics[], periodCount: number, prevPeriodCount: number }> {
  const api = searchconsole({
    version: 'v1',
    auth: createGoogleOAuthClient(account),
  })

  const [period, prevPeriod, keywords] = (await Promise.all([
    api.searchanalytics.query({
      siteUrl: site.property,
      requestBody: {
        ...generateDefaultQueryBody(site, range.period),
        ...options,
        dimensions: ['page'],
      },
    }).then(res => res.data.rows || []),
    range.prevPeriod
      ? api.searchanalytics.query({
        siteUrl: site.property,
        requestBody: {
          ...generateDefaultQueryBody(site, range.prevPeriod),
          ...options,
          dimensions: ['page'],
        },
      }).then(res => res.data.rows || [])
      : [],
    // keywords
    api.searchanalytics.query({
      siteUrl: site.property,
      requestBody: {
        ...generateDefaultQueryBody(site, range.period),
        ...options,
        dimensions: ['query', 'page'],
      },
    }).then(res => res.data.rows || []),
  ]))
  const rows = period.map((row) => {
    const prevPeriodRow = prevPeriod.find(r => r.keys![0] === row.keys![0])
    const keyword = keywords.find(r => r.keys![1] === row.keys![0])
    return {
      ...row,
      page: row.keys![0],
      keyword: keyword?.keys![0] || undefined,
      keywordPosition: keyword?.position || 0,
      clicks: row.clicks!,
      prevClicks: prevPeriodRow ? prevPeriodRow.clicks! : 0,
      clicksPercent: percentDifference(row.clicks!, prevPeriodRow?.clicks || 0),
      impressions: row.impressions!,
      impressionsPercent: percentDifference(row.impressions!, prevPeriodRow?.impressions || 0),
      prevImpressions: prevPeriodRow ? prevPeriodRow.impressions! : 0,
    } satisfies SiteAnalytics['period'][0]
  })
  // need to account for pages that are missing in current period that existed in previous period
  for (const prevRow of prevPeriod) {
    const periodRow = period.find(r => r.keys![0] === prevRow.keys![0])
    if (!periodRow) {
      rows.push({
        ...periodRow,
        keyword: keywords.find(r => r.keys![1] === periodRow?.keys?.[0])?.keys![0] || null,
        url: withoutBase(withoutProtocol(prevRow.keys![0]), site.domain),
        lost: true,
        clicks: 0,
        impressions: 0,
        prevClicks: prevRow.clicks,
        prevImpressions: prevRow.impressions,
        clicksPercent: 0,
        impressionsPercent: 0,
      } satisfies SiteAnalytics['period'][0])
    }
  }
  return {
    rows,
    periodCount: period.length,
    prevPeriodCount: prevPeriod.length,
  }
}

export async function fetchGSCKeywords(account: GoogleAccountsSelect & { googleOAuthClient: GoogleOAuthClientsSelect }, range: ResolvedAnalyticsRange, site: SiteSelect): Promise<SiteAnalytics> {
  const api = searchconsole({
    version: 'v1',
    auth: createGoogleOAuthClient(account),
  })

  const [period, prevPeriod, pages] = (await Promise.all([
    api.searchanalytics.query({
      siteUrl: site.property,
      requestBody: {
        ...generateDefaultQueryBody(site, range.period),
        dimensions: ['query'],
      },
    }),
    api.searchanalytics.query({
      siteUrl: site.property,
      requestBody: {
        ...generateDefaultQueryBody(site, range.prevPeriod),
        dimensions: ['query'],
      },
    }),
    // pages
    api.searchanalytics.query({
      siteUrl: site.property,
      requestBody: {
        ...generateDefaultQueryBody(site, range.period),
        dimensions: ['page', 'query'],
      },
    }),
  ]))
    .map(res => res.data.rows || [])

  const rows = period.map((row) => {
    const prevPeriodRow = prevPeriod.find(r => r.keys![0] === row.keys![0])
    return {
      keyword: row.keys![0],
      page: normalizePage(pages.find(r => r.keys![1] === row.keys![0])?.keys![0] || null, site.domain),
      // position and ctr
      position: row.position!,
      positionPercent: percentDifference(row.position!, prevPeriodRow?.position || 0),
      prevPosition: prevPeriodRow ? prevPeriodRow.position! : 0,
      ctr: row.ctr!,
      ctrPercent: percentDifference(row.ctr!, prevPeriodRow?.ctr || 0),
      prevCtr: prevPeriodRow ? prevPeriodRow.ctr! : 0,
      clicks: row.clicks || 0,
      impressions: row.impressions || 0,
    } satisfies SiteAnalytics['keywords'][0]
  })

  // iterate through prevPeriod and see what's missing
  for (const prevRow of prevPeriod) {
    const periodRow = rows.find(r => r.keyword === prevRow.keys![0])
    if (!periodRow) {
      rows.push({
        keyword: prevRow.keys![0],
        page: normalizePage(pages.find(r => r.keys![1] === prevRow.keys![0])?.keys![0] || null, site.domain),
        lost: true,
        clicks: 0,
        position: 0,
        ctr: 0,
        prevCtr: prevRow.ctr,
        prevPosition: prevRow.position,
        prevClicks: prevRow.clicks,
        prevImpressions: prevRow.impressions,
        positionPercent: 0,
        ctrPercent: 0,
      } satisfies SiteAnalytics['keywords'][0])
    }
  }
  return {
    prevPeriodCount: prevPeriod.length,
    periodCount: period.length,
    rows,
  }
}

export async function fetchGSCKeyword(account: GoogleAccountsSelect & { googleOAuthClient: GoogleOAuthClientsSelect }, range: ResolvedAnalyticsRange, site: SiteSelect, keyword: string): Promise<SiteAnalytics> {
  const api = searchconsole({
    version: 'v1',
    auth: createGoogleOAuthClient(account),
  })

  const [dates, pages] = await Promise.all([
    api.searchanalytics.query({
      siteUrl: site.property,
      requestBody: {
        ...generateDefaultQueryBody(site, range.period, [
          {
            dimension: 'query',
            operator: 'equals',
            expression: keyword,
          },
        ]),
        dimensions: ['date'],
      },
    }).then((res) => {
      return (res.data.rows || []).map((row) => {
        return {
          ...row,
          date: row.keys[0],
          keys: undefined,
        }
      })
    }),
    api.searchanalytics.query({
      siteUrl: site.property,
      requestBody: {
        ...generateDefaultQueryBody(site, range.period, [
          {
            dimension: 'query',
            operator: 'equals',
            expression: keyword,
          },
        ]),
        rowLimit: 5,
        dimensions: ['page'],
      },
    }).then((res) => {
      return (res.data.rows || []).map((row) => {
        return {
          ...row,
          page: normalizePage(row.keys![0], site.domain),
          keys: undefined,
        }
      })
    }),
  ])
  return { dates, pages }
}

export async function fetchGSCPage(account: GoogleAccountsSelect & { googleOAuthClient: GoogleOAuthClientsSelect }, range: ResolvedAnalyticsRange, site: SiteSelect, url: string): Promise<SiteAnalytics> {
  const api = searchconsole({
    version: 'v1',
    auth: createGoogleOAuthClient(account),
  })

  const [dates, keywords] = await Promise.all([
    api.searchanalytics.query({
      siteUrl: site.property,
      requestBody: {
        ...generateDefaultQueryBody(site, range.period, [
          {
            dimension: 'page',
            operator: 'equals',
            expression: normalizePageForGsc(url, site.domain),
          },
        ]),
        dimensions: ['date'],
      },
    }).then((res) => {
      return (res.data.rows || []).map((row) => {
        return {
          ...row,
          date: row.keys[0],
          keys: undefined,
        }
      })
    }),
    api.searchanalytics.query({
      siteUrl: site.property,
      requestBody: {
        ...generateDefaultQueryBody(site, range.period, [
          {
            dimension: 'page',
            operator: 'equals',
            expression: normalizePageForGsc(url, site.domain),
          },
        ]),
        rowLimit: 5,
        dimensions: ['query'],
      },
    }).then((res) => {
      return (res.data.rows || []).map((row) => {
        return {
          ...row,
          keyword: row.keys![0],
          keys: undefined,
        }
      })
    }),
  ])
  return { dates, keywords }
}

function normalizePage(page: string | null, domain: string) {
  if (!page)
    return page
  return page.replace('https://', '').replace(domain, '')
}

function normalizePageForGsc(page: string, domain: string) {
  let p = withBase(page, domain)
  // home pages need a slash
  if (p === domain)
    p = `${p}/`
  return withHttps(p)
}

export function generateDefaultQueryBody(site: SiteSelect, range: ResolvedAnalyticsRange[keyof ResolvedAnalyticsRange], filters: searchconsole_v1.Schema$ApiDimensionFilterGroup['filters'][] = []): searchconsole_v1.Schema$SearchAnalyticsQueryRequest {
  filters.unshift({
    dimension: 'page',
    operator: 'excludingRegex',
    expression: `#`,
  })
  if (site.domain) {
    filters.unshift({
      dimension: 'page',
      operator: 'includingRegex',
      expression: `^${withoutTrailingSlash(site.domain).replace(/\./g, '\\.')}/.*`,
    })
  }
  return {
    type: 'web',
    aggregationType: 'byPage',
    dataState: 'all',
    startDate: formatDateGsc(range.start),
    endDate: formatDateGsc(range.end),
    rowLimit: 25_000, // pay for more?
    dimensionFilterGroups: [
      {
        filters,
      },
    ],
  }
}

export async function createGscClientFromEvent(event: H3Event) {
  const user = await authenticateUser(event)
  const { site, googleAccount } = await requireEventSite(event, user)
  // TODO validate user can see this site

  const range = userPeriodRange(user)
  return {
    site,
    countries: () => fetchGSCCountries(googleAccount, range, site),
    devices: () => fetchGSCDevices(googleAccount, range, site),
    analytics: () => fetchGSCAnalytics(googleAccount, range, site),
    dates: () => fetchGSCDates(googleAccount, range, site),
    pages: options => fetchGSCPagesWithKeywords(googleAccount, range, site, options),
    keywords: () => fetchGSCKeywords(googleAccount, range, site),
    keyword: (keyword: string) => fetchGSCKeyword(googleAccount, range, site, keyword),
    page: (page: string) => fetchGSCPage(googleAccount, range, site, page),
  }
}
