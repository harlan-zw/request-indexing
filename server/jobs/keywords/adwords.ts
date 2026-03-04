import { fetchKeywordIdeas } from '~/server/app/services/ads'
import { incrementUsage } from '~/server/app/services/usage'
import { keywords, relatedKeywords, sites } from '~/server/db/schema'
import { chunkedBatch } from '~/server/utils/drizzle'
import { broadcastToUser } from '~/server/utils/event-service'
import { defineJob } from '../_types'

export default defineJob({
  name: 'keywords/adwords',
  queue: 'default',
  async handle(payload, ctx) {
    const { siteId, keywords: _keywords } = payload
    const db = ctx.db

    const site = await db.query.sites.findFirst({
      with: {
        owner: {
          with: {
            googleAccounts: {
              with: { googleOAuthClient: true },
            },
          },
        },
      },
      where: eq(sites.siteId, siteId),
    })

    if (!site || !site.owner || !site.owner.googleAccounts[0])
      throw new Error('Site or User not found')

    const res = await fetchKeywordIdeas(_keywords, site.siteId)
    if (!res)
      return

    const inserts = res.map((row) => {
      if (!row.keyword_idea_metrics)
        return false
      const { competition, competition_index, avg_monthly_searches, monthly_search_volumes, average_cpc_micros } = row.keyword_idea_metrics
      const kwPayload = {
        competition,
        lastSynced: dayjsPst().format('YYYY-MM-DD'),
        relatedKeywords: res.map(row => row.text),
        competitionIndex: competition_index,
        avgMonthlySearches: avg_monthly_searches,
        averageCpcMicros: average_cpc_micros,
        currentMonthSearchVolume: monthly_search_volumes[monthly_search_volumes.length - 1].monthly_searches,
        monthlySearchVolumes: monthly_search_volumes.map((row) => {
          const monthTextToNumber: Record<string, string> = {
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
          return {
            date: `${row.year}-${monthTextToNumber[row.month]}-01`,
            value: row.monthly_searches,
          }
        }),
      }
      const keywordMatches = [...new Set([row.text, ...row.close_variants])]
      return keywordMatches.map(keyword =>
        db.insert(keywords).values({ keyword, ...kwPayload }).onConflictDoUpdate({ target: [keywords.keyword], set: kwPayload }).returning(),
      )
    }).filter(Boolean).flat()

    if (!inserts.length) {
      if (site.owner) {
        broadcastToUser(site.owner.publicId, {
          name: 'keywords/adwords',
          entityId: siteId,
          entityType: 'site',
          payload: { siteId: site.publicId },
        })
      }
      return
    }

    const keywordEntries: { keywordId: number }[] = (await db.batch(inserts)).map(row => row[0])
    const inserts2 = keywordEntries.map(row =>
      keywordEntries.map(row2 =>
        db.insert(relatedKeywords).values({
          keywordId: row.keywordId,
          relatedKeywordId: row2.keywordId,
          siteId,
        }).onConflictDoNothing(),
      ),
    ).flat()
    await chunkedBatch(inserts2)
    await incrementUsage(siteId, 'googleAds')

    // Broadcast
    if (site.owner) {
      broadcastToUser(site.owner.publicId, {
        name: 'keywords/adwords',
        entityId: siteId,
        entityType: 'site',
        payload: { siteId: site.publicId },
      })
    }
  },
})
