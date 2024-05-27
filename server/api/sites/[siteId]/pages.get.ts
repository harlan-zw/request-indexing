import { avg, between, count, desc, gt, ilike, inArray, sum } from 'drizzle-orm'
import { getQuery } from 'h3'
import { authenticateUser } from '~/server/app/utils/auth'
import {
  siteKeywordDatePathAnalytics,
  sitePathDateAnalytics,
  sites,
} from '~/server/database/schema'
import { userPeriodRange } from '~/server/app/models/User'

export default defineEventHandler(async (e) => {
  // extract from db
  const user = await authenticateUser(e)
  const { siteId } = getRouterParams(e, { decode: true })
  const site = await useDrizzle().query.sites.findFirst({
    where: eq(sites.publicId, siteId),
  })
  if (!site) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Site not found',
    })
  }
  const { filter, page, q } = getQuery<{
    filter: 'top-level' | 'new' | 'lost' | 'improving' | 'declining'
    page: string
    q: string
  }>(e)
  const range = userPeriodRange(user, {
    includeToday: false,
  })
  const _where = [
    eq(sitePathDateAnalytics.siteId, site.siteId),
  ]
  if (q?.length)
    _where.push(ilike(sitePathDateAnalytics.path, `%${q}%`))
  const sq = useDrizzle()
    .select({
      path: filter === 'top-level' ? sql`SUBSTR(path, 1, INSTR(SUBSTR(path, 2), '/') + 1)`.as('topLevelPath1') : sitePathDateAnalytics.path,
      clicks: sum(sitePathDateAnalytics.clicks).as('clicks'),
      ctr: avg(sitePathDateAnalytics.ctr).as('ctr'),
      impressions: sum(sitePathDateAnalytics.impressions).as('impressions'),
      position: avg(sitePathDateAnalytics.position).as('position'),
    })
    .from(sitePathDateAnalytics)
    .where(and(
      between(sitePathDateAnalytics.date, range.period.startDate, range.period.endDate),
      ..._where,
    ))
    .groupBy(filter === 'top-level' ? sql`topLevelPath1` : sitePathDateAnalytics.path)
    .as('sq')

  // we're going to get previous period data so we can join it and compute differences
  const sq2 = useDrizzle()
    .select({
      path: filter === 'top-level' ? sql`SUBSTR(path, 1, INSTR(SUBSTR(path, 2), '/') + 1)`.as('topLevelPath2') : sitePathDateAnalytics.path,
      prevClicks: sum(sitePathDateAnalytics.clicks).as('prevClicks'),
      ctr: avg(sitePathDateAnalytics.ctr).as('prevCtr'),
      prevImpressions: sum(sitePathDateAnalytics.impressions).as('prevImpressions'),
      position: avg(sitePathDateAnalytics.position).as('prevPosition'),
    })
    .from(sitePathDateAnalytics)
    .where(and(
      between(sitePathDateAnalytics.date, range.prevPeriod.startDate, range.prevPeriod.endDate),
      ..._where,
    ))
    .groupBy(filter === 'top-level' ? sql`topLevelPath2` : sitePathDateAnalytics.path)
    .as('sq2')

  let finalWhere
  if (filter === 'new') {
    finalWhere = and(
      gt(sq.clicks, 0),
      eq(sq2.prevClicks, 0),
    )
  }
  else if (filter === 'lost') {
    finalWhere = and(
      eq(sq.clicks, 0),
      gt(sq2.prevClicks, 0),
    )
  }
  else if (filter === 'improving') {
    finalWhere = gt(sq.clicks, sq2.prevClicks)
  }
  else if (filter === 'declining') {
    finalWhere = gt(sq2.prevClicks, sq.clicks)
  }

  const offset = ((Number(page) || 1) - 1) * 10

  const pagesSelect = useDrizzle().select({
    clicks: sq.clicks,
    ctr: sq.ctr,
    impressions: sq.impressions,
    path: sq.path,
    position: sq.position,
    prevClicks: sq2.prevClicks,
    prevCtr: sq2.ctr,
    prevImpressions: sq2.prevImpressions,
    prevPosition: sq2.position,
    // pages: sq3.path,
  })
    .from(sq)
    .leftJoin(sq2, filter === 'top-level' ? sql`sq.topLevelPath1 = sq2.topLevelPath2` : eq(sq.path, sq2.path))
    .where(finalWhere)
    .orderBy(desc(sq.clicks))
    .as('pagesSelect')

  const pages = await useDrizzle().select()
    .from(pagesSelect)
    .offset(offset)
    .limit(10)

  if (pages.length) {
    // for each keyword find the top pages
    const keywords = await useDrizzle().select({
      clicks: sum(siteKeywordDatePathAnalytics.clicks).as('clicks'),
      position: avg(siteKeywordDatePathAnalytics.position).as('position'),
      ctr: avg(siteKeywordDatePathAnalytics.ctr).as('ctr'),
      impressions: sum(siteKeywordDatePathAnalytics.impressions).as('impressions'),
      keyword: siteKeywordDatePathAnalytics.keyword,
      path: siteKeywordDatePathAnalytics.path,
    })
      .from(siteKeywordDatePathAnalytics)
      .where(and(
        eq(siteKeywordDatePathAnalytics.siteId, site.siteId),
        between(siteKeywordDatePathAnalytics.date, range.period.startDate, range.period.endDate),
        // filter for keywords
        inArray(siteKeywordDatePathAnalytics.path, pages.map(row => row.path)),
      ))
      .groupBy(siteKeywordDatePathAnalytics.keyword, siteKeywordDatePathAnalytics.path)
      .orderBy(desc(sum(siteKeywordDatePathAnalytics.clicks)))

    // apply keywords to pages
    for (const page of pages)
      page.keywords = keywords.filter(row => row.path === page.path)
  }

  const totals = await useDrizzle().select({
    count: count().as('total'),
    clicks: sum(sq.clicks).as('clicks'),
  })
    .from(pagesSelect)
  return {
    rows: pages.map((row) => {
      row.clicks = Number(row.clicks)
      row.impressions = Number(row.impressions)
      row.position = Number(row.position)
      row.ctr = Number(row.ctr)
      row.prevClicks = Number(row.prevClicks)
      row.prevImpressions = Number(row.prevImpressions)
      row.prevPosition = Number(row.prevPosition)
      row.prevCtr = Number(row.prevCtr)
      return row
    }),
    total: totals[0].count,
    totalClicks: Number(totals[0].clicks),
  }
})
