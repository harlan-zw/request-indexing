import { withBase, withHttps, withoutBase, withoutProtocol, withoutTrailingSlash } from 'ufo'
import type { Credentials } from 'google-auth-library'
import { OAuth2Client } from 'googleapis-common'
import { searchconsole } from '@googleapis/searchconsole'
import type { searchconsole_v1 } from '@googleapis/searchconsole/v1'
import type { H3Event } from 'h3'
import countries from '../../data/countries'
import type { ResolvedAnalyticsRange, SiteAnalytics } from '~/types'
import { percentDifference } from '~/server/app/utils/formatting'

// @ts-expect-error untyped
import { tokens } from '#app/token-pool.mjs'
import { requireEventSite } from '~/server/app/services/util'
import { useAuthenticatedUser } from '~/server/app/utils/auth'
import type { SiteSelect } from '~/server/database/schema'
import type { RequiredNonNullable } from '~/types/util'
import { userPeriodRange } from '~/server/app/models/User'

export async function recursiveQuery(api: searchconsole_v1.Searchconsole, query: searchconsole_v1.Params$Resource$Searchanalytics$Query, maxRows: number, page: number = 1, rows: searchconsole_v1.Schema$ApiDataRow[] = []) {
  const rowLimit = query.requestBody?.rowLimit || maxRows
  const res = await api.searchanalytics.query({
    ...query,
    requestBody: {
      ...query.requestBody,
      startRow: (page - 1) * rowLimit,
    },
  })
  // add res rows
  rows.push(...res.data.rows!)
  if (res.data.rows!.length === rowLimit && res.data.rows!.length < maxRows && page <= 4)
    await recursiveQuery(api, query, maxRows, page + 1, rows)

  return { data: { rows } }
}

export function createGoogleOAuthClient(credentials: Credentials, token?: { client_id: string, client_secret: string }) {
  token = token || tokens[0]
  return new OAuth2Client({
    // tells client to use the refresh_token...
    forceRefreshOnFailure: true,
    credentials,
    clientId: token.client_id,
    clientSecret: token.client_secret,
  })
}

// export async function fetchGoogleSearchConsoleDates(credentials: Credentials, siteUrl: string, options: Schema$SearchAnalyticsQueryRequest = {}): Promise<searchconsole_v1.Schema$ApiDataRow[]> {
//   const services = searchconsole({
//     version: 'v1',
//     h3: createGoogleOAuthClient(credentials),
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

// export async function fetchGoogleSearchConsolePages(credentials: Credentials, siteUrl: string, options: Schema$SearchAnalyticsQueryRequest = {}): Promise<searchconsole_v1.Schema$ApiDataRow[]> {
//   const services = searchconsole({
//     version: 'v1',
//     h3: createGoogleOAuthClient(credentials),
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

export async function fetchGscSitesWithSitemaps(credentials: Credentials): Promise<(RequiredNonNullable<searchconsole_v1.Schema$WmxSite> & { sitemaps: RequiredNonNullable<searchconsole_v1.Schema$WmxSitemap>[] })[]> {
  const api = searchconsole({
    version: 'v1',
    auth: createGoogleOAuthClient(credentials),
  })
  const sites = await api.sites.list().then(res => (res.data.siteEntry || []))
  return Promise.all(sites.map(async (site) => {
    return {
      sitemaps: await api.sitemaps.list({
        siteUrl: site.siteUrl!,
      }).then(res => res.data.sitemap || []),
      ...site as RequiredNonNullable<searchconsole_v1.Schema$WmxSite>,
    }
  }))
}

// export async function fetchGoogleSearchConsoleAnalytics(credentials: Credentials, periodRange: ResolvedAnalyticsRange, site: SiteSelect): Promise<SiteAnalytics> {
//   const services = searchconsole({
//     version: 'v1',
//     h3: createGoogleOAuthClient(credentials),
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

export async function fetchGSCDates(credentials: Credentials, range: ResolvedAnalyticsRange, site: SiteSelect): Promise<{ startDate?: string, endDate?: string, rows: (Omit<searchconsole_v1.Schema$ApiDataRow, 'keys'> & { date: string })[] }> {
  const api = searchconsole({
    version: 'v1',
    auth: createGoogleOAuthClient(credentials),
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

export async function fetchGSCDevices(credentials: Credentials, range: ResolvedAnalyticsRange, site: SiteSelect): Promise<searchconsole_v1.Schema$ApiDataRow[]> {
  const api = searchconsole({
    version: 'v1',
    auth: createGoogleOAuthClient(credentials),
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

export async function fetchGSCCountries(credentials: Credentials, range: ResolvedAnalyticsRange, site: SiteSelect): Promise<searchconsole_v1.Schema$ApiDataRow[]> {
  const api = searchconsole({
    version: 'v1',
    auth: createGoogleOAuthClient(credentials),
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

export async function fetchGSCAnalytics(credentials: Credentials, range: ResolvedAnalyticsRange, site: SiteSelect): Promise<searchconsole_v1.Schema$ApiDataRow[]> {
  const api = searchconsole({
    version: 'v1',
    auth: createGoogleOAuthClient(credentials),
  })
  const [period, prevPeriod] = await Promise.all([
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
  ])

  return { period, prevPeriod }
}

export async function fetchGSCPages(credentials: Credentials, range: ResolvedAnalyticsRange, site: SiteSelect): Promise<{ rows: SiteAnalytics[], periodCount: number, prevPeriodCount: number }> {
  const api = searchconsole({
    version: 'v1',
    auth: createGoogleOAuthClient(credentials),
  })

  const [period, prevPeriod, keywords] = (await Promise.all([
    api.searchanalytics.query({
      siteUrl: site.property,
      requestBody: {
        ...generateDefaultQueryBody(site, range.period),
        dimensions: ['page'],
      },
    }).then(res => res.data.rows || []),
    range.prevPeriod
      ? api.searchanalytics.query({
        siteUrl: site.property,
        requestBody: {
          ...generateDefaultQueryBody(site, range.prevPeriod),
          dimensions: ['page'],
        },
      }).then(res => res.data.rows || [])
      : [],
    // keywords
    api.searchanalytics.query({
      siteUrl: site.property,
      requestBody: {
        ...generateDefaultQueryBody(site, range.period),
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

export async function fetchGSCKeywords(credentials: Credentials, range: ResolvedAnalyticsRange, site: SiteSelect): Promise<SiteAnalytics> {
  const api = searchconsole({
    version: 'v1',
    auth: createGoogleOAuthClient(credentials),
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

export async function fetchGSCKeyword(credentials: Credentials, range: ResolvedAnalyticsRange, site: SiteSelect, keyword: string): Promise<SiteAnalytics> {
  const api = searchconsole({
    version: 'v1',
    auth: createGoogleOAuthClient(credentials),
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

export async function fetchGSCPage(credentials: Credentials, range: ResolvedAnalyticsRange, site: SiteSelect, url: string): Promise<SiteAnalytics> {
  const api = searchconsole({
    version: 'v1',
    auth: createGoogleOAuthClient(credentials),
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

function generateDefaultQueryBody(site: SiteSelect, range: ResolvedAnalyticsRange[keyof ResolvedAnalyticsRange], filters: searchconsole_v1.Schema$ApiDimensionFilterGroup['filters'][] = []): searchconsole_v1.Schema$SearchAnalyticsQueryRequest {
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
    rowLimit: 3000, // pay for more?
    dimensionFilterGroups: [
      {
        filters,
      },
    ],
  }
}

export async function createGscClientFromEvent(event: H3Event) {
  const user = await useAuthenticatedUser(event)
  const site = await requireEventSite(event)
  // TODO validate user can see this site

  const range = userPeriodRange(user)
  return {
    site,
    countries: () => fetchGSCCountries(user.loginTokens, range, site),
    devices: () => fetchGSCDevices(user.loginTokens, range, site),
    analytics: () => fetchGSCAnalytics(user.loginTokens, range, site),
    dates: () => fetchGSCDates(user.loginTokens, range, site),
    pages: () => fetchGSCPages(user.loginTokens, range, site),
    keywords: () => fetchGSCKeywords(user.loginTokens, range, site),
    keyword: (keyword: string) => fetchGSCKeyword(user.loginTokens, range, site, keyword),
    page: (page: string) => fetchGSCPage(user.loginTokens, range, site, page),
  }
}
