import { GoogleAdsApi } from 'google-ads-api'
import { desc, inArray, isNotNull } from 'drizzle-orm'
import { keywords, relatedKeywords } from '~/server/database/schema'

export async function fetchKeywordHistorialData(keywords: string[]) {
  const { adsApiToken: developer_token, adsCustomerId: customer_id, adsClientId: client_id, adsClientSecret: client_secret, adsRefreshToken: refresh_token } = useRuntimeConfig().google
  const client = new GoogleAdsApi({
    client_id,
    client_secret,
    developer_token,
  })

  const customer = client.Customer({
    customer_id,
    refresh_token,
  })

  const res = await customer.keywordPlanIdeas.generateKeywordHistoricalMetrics({
    keywords,
    customer_id,
    keyword_plan_network: 'GOOGLE_SEARCH',
  }).catch((err) => {
    return { err }
  }).then(res => res.results)
  return res
}

export async function fetchKeywordIdeas(keyword: string, siteId: number) {
  const { adsApiToken: developer_token, adsCustomerId: customer_id, adsClientId: client_id, adsClientSecret: client_secret, adsRefreshToken: refresh_token } = useRuntimeConfig().google
  const client = new GoogleAdsApi({
    client_id,
    client_secret,
    developer_token,
  })

  const customer = client.Customer({
    customer_id,
    refresh_token,
  })
  const db = useDrizzle()
  // check db if keyword exists with search volume data
  const previous = await db.select().from(keywords)
    .where(and(eq(keywords.keyword, keyword), isNotNull(keywords.lastSynced)))

  if (previous.length) {
    // TODO get related keywords
    const relatedSq = await db.select({ relatedKeywordId: relatedKeywords.relatedKeywordId }).from(relatedKeywords)
      .where(eq(relatedKeywords.keywordId, previous[0].keywordId))
    if (relatedSq.length) {
      return await db.select({
        keyword: keywords.keyword,
        competition: keywords.competition,
        competitionIndex: keywords.competitionIndex,
        avgMonthlySearches: keywords.avgMonthlySearches,
        averageCpcMicros: keywords.averageCpcMicros,
        currentMonthSearchVolume: keywords.currentMonthSearchVolume,
        monthlySearchVolumes: keywords.monthlySearchVolumes,
      })
        .from(keywords)
        .where(inArray(keywords.keywordId, relatedSq.map(row => row.relatedKeywordId)))
        .orderBy(desc(keywords.currentMonthSearchVolume))
    }
  }

  const res = await customer.keywordPlanIdeas.generateKeywordIdeas({
    keyword_seed: { keywords: [keyword] },
    customer_id,
    keyword_plan_network: 'GOOGLE_SEARCH',
    page_size: 100,
    historical_metrics_options: {
      include_average_cpc: true,
    },
  }).catch((err) => {
    return { err }
  })

  if (res.err) {
    return res
  }
  // save the data in the db
  const inserts = res.map((row) => {
    const { competition, competition_index, avg_monthly_searches, monthly_search_volumes, average_cpc_micros } = row.keyword_idea_metrics
    const payload = {
      competition,
      lastSynced: sql`CURRENT_TIMESTAMP`,
      relatedKeywords: res.map(row => row.text),
      competitionIndex: competition_index,
      avgMonthlySearches: avg_monthly_searches,
      averageCpcMicros: average_cpc_micros,
      currentMonthSearchVolume: monthly_search_volumes[monthly_search_volumes.length - 1].monthly_searches,
      monthlySearchVolumes: monthly_search_volumes.map((row) => {
        const monthTextToNumber = {
          JANUARY: '01',
          FEBRUARY: '02',
          MARCH: '03',
          APRIL: '04',
          MAY: '05',
          JUNE: '06',
          JULY: '07',
          AUGUST: '08',
          SEPTEMBER: '09',
          OCTOBER: '10',
          NOVEMBER: '11',
          DECEMBER: '12',
        }
        const month = monthTextToNumber[row.month]
        return {
          date: `${row.year}-${month}-01`,
          value: row.monthly_searches,
        }
      }),
    }
    const keywordMatches = [...new Set([row.text, ...row.close_variants])]
    return keywordMatches.map((keyword) => {
      return db.insert(keywords).values({
        keyword,
        ...payload,
      }).onConflictDoUpdate({
        target: [keywords.keyword],
        set: payload,
      }).returning()
    })
  }).flat()
  const keywordEntries: { keywordId: number }[] = (await db.batch(inserts)).map(row => row[0])
  const inserts2 = keywordEntries.map((row) => {
    // save related keywords
    return keywordEntries.map((row2) => {
      return db.insert(relatedKeywords).values({
        keywordId: row.keywordId,
        relatedKeywordId: row2.keywordId,
        siteId,
      }).onConflictDoNothing() // already linked
    })
  }).flat()
  // link up each keyword with related keywords
  await db.batch(inserts2)
  // console.log('IDEAS', keywordEntries)
  // return keywordEntries

  return await db.select({
    keyword: keywords.keyword,
    competition: keywords.competition,
    competitionIndex: keywords.competitionIndex,
    avgMonthlySearches: keywords.avgMonthlySearches,
    averageCpcMicros: keywords.averageCpcMicros,
    currentMonthSearchVolume: keywords.currentMonthSearchVolume,
    monthlySearchVolumes: keywords.monthlySearchVolumes,
  })
    .from(keywords)
    .where(inArray(keywords.keywordId, keywordEntries.map(row => row.keywordId)))
    .orderBy(desc(keywords.currentMonthSearchVolume))
}
