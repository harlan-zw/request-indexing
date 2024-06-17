import { keywords, relatedKeywords, sites } from '~/server/database/schema'
import { defineJobHandler } from '~/server/plugins/eventServiceProvider'
import { fetchKeywordIdeas } from '~/server/app/services/ads'
import { incrementUsage } from '~/server/app/services/usage'

export default defineJobHandler(async (event) => {
  const { siteId, keywords: _keywords } = await readBody<{ siteId: number, keywords: string[] }>(event)
  const db = useDrizzle()

  const site = await db.query.sites.findFirst({
    with: {
      owner: {
        with: {
          googleAccounts: {
            with: {
              googleOAuthClient: true,
            },
          },
        },
      },
    },
    where: eq(sites.siteId, siteId),
  })

  if (!site || !site.owner || !site.owner.googleAccounts[0]) {
    throw createError({
      statusCode: 404,
      message: 'Site or User not found',
    })
  }

  /**
   *   const db = useDrizzle()
   *   // check db if keyword exists with search volume data
   *   // TODO do existing checks on api endpoints
   *   // const previous = await db.select().from(keywords)
   *   //   // TODO hacky, fix
   *   //   .where(and(eq(keywords.keyword, Array.isArray(keyword) ? keyword[0] : keyword), isNotNull(keywords.lastSynced)))
   *   //
   *   // if (previous.length) {
   *   //   // TODO get related keywords
   *   //   const relatedSq = db.select({ relatedKeywordId: relatedKeywords.relatedKeywordId }).from(relatedKeywords)
   *   //     .where(eq(relatedKeywords.keywordId, previous[0].keywordId)).as('relatedSq')
   *   //   return await db.select({
   *   //     keyword: keywords.keyword,
   *   //     competition: keywords.competition,
   *   //     competitionIndex: keywords.competitionIndex,
   *   //     avgMonthlySearches: keywords.avgMonthlySearches,
   *   //     averageCpcMicros: keywords.averageCpcMicros,
   *   //     currentMonthSearchVolume: keywords.currentMonthSearchVolume,
   *   //     monthlySearchVolumes: keywords.monthlySearchVolumes,
   *   //   })
   *   //     .from(keywords)
   *   //     .where(inArray(keywords.keywordId, relatedSq.relatedKeywordId))
   *   //     .orderBy(desc(keywords.currentMonthSearchVolume))
   *   // }
   */

  const res = await fetchKeywordIdeas(_keywords, site.siteId)
  if (!res) {
    return {}
  }
  // save the data in the db
  const inserts = res.map((row) => {
    if (!row.keyword_idea_metrics) {
      return false
    }
    const { competition, competition_index, avg_monthly_searches, monthly_search_volumes, average_cpc_micros } = row.keyword_idea_metrics
    const payload = {
      competition,
      lastSynced: dayjsPst().format('YYYY-MM-DD'),
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
  }).filter(Boolean).flat()
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
  await chunkedBatch(inserts2)
  await incrementUsage(siteId, 'googleAds')

  return {
    broadcastTo: site.owner.publicId,
    siteId: site.publicId,
  }
})
