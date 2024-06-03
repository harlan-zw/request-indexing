import { avg, between, count, desc, gt, ilike, isNotNull } from 'drizzle-orm'
import { getQuery } from 'h3'
import { authenticateUser } from '~/server/app/utils/auth'
import {
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
    includeToday: true,
  })
  const _where = [
    eq(sitePathDateAnalytics.siteId, site.siteId),
    isNotNull(sitePathDateAnalytics.psiDesktopPerformance),
  ]
  if (q?.length)
    _where.push(ilike(sitePathDateAnalytics.path, `%${q}%`))
  const sq = useDrizzle()
    .select({
      path: filter === 'top-level' ? sql`SUBSTR(path, 1, INSTR(SUBSTR(path, 2), '/') + 1)`.as('topLevelPath1') : sitePathDateAnalytics.path,
      psiDesktopPerformance: avg(sitePathDateAnalytics.psiDesktopPerformance).as('psiDesktopPerformance'),
      psiMobilePerformance: avg(sitePathDateAnalytics.psiMobilePerformance).as('psiMobilePerformance'),
      psiDesktopLcp: avg(sitePathDateAnalytics.psiDesktopLcp).as('psiDesktopLcp'),
      psiMobileLcp: avg(sitePathDateAnalytics.psiMobileLcp).as('psiMobileLcp'),
      psiDesktopFcp: avg(sitePathDateAnalytics.psiDesktopFcp).as('psiDesktopFcp'),
      psiMobileFcp: avg(sitePathDateAnalytics.psiMobileFcp).as('psiMobileFcp'),
      psiDesktopSi: avg(sitePathDateAnalytics.psiDesktopSi).as('psiDesktopSi'),
      psiMobileSi: avg(sitePathDateAnalytics.psiMobileSi).as('psiMobileSi'),
      psiDesktopTbt: avg(sitePathDateAnalytics.psiDesktopTbt).as('psiDesktopTbt'),
      psiMobileTbt: avg(sitePathDateAnalytics.psiMobileTbt).as('psiMobileTbt'),
      psiDesktopCls: avg(sitePathDateAnalytics.psiDesktopCls).as('psiDesktopCls'),
      psiMobileCls: avg(sitePathDateAnalytics.psiMobileCls).as('psiMobileCls'),
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
      prevPsiDesktopPerformance: avg(sitePathDateAnalytics.psiDesktopPerformance).as('prevPsiDesktopPerformance'),
      prevPsiDesktopSeo: avg(sitePathDateAnalytics.psiDesktopSeo).as('prevPsiDesktopSeo'),
      prevPsiDesktopAccessibility: avg(sitePathDateAnalytics.psiDesktopAccessibility).as('prevPsiDesktopAccessibility'),
      prevPsiDesktopBestPractices: avg(sitePathDateAnalytics.psiDesktopBestPractices).as('prevPsiDesktopBestPractices'),
      prevPsiDesktopScore: avg(sitePathDateAnalytics.psiDesktopScore).as('prevPsiDesktopScore'),
    })
    .from(sitePathDateAnalytics)
    .where(and(
      between(sitePathDateAnalytics.date, range.prevPeriod.startDate, range.prevPeriod.endDate),
      ..._where,
    ))
    .groupBy(filter === 'top-level' ? sql`topLevelPath2` : sitePathDateAnalytics.path)
    .as('sq2')

  let finalWhere
  if (filter === 'improving') {
    finalWhere = gt(sq.psiDesktopPerformance, sq2.prevPsiDesktopPerformance)
  }
  else if (filter === 'declining') {
    finalWhere = gt(sq2.prevPsiDesktopPerformance, sq.psiDesktopPerformance)
  }

  const offset = ((Number(page) || 1) - 1) * 10

  const pagesSelect = useDrizzle().select({
    path: sq.path,
    psiDesktopPerformance: sq.psiDesktopPerformance,
    psiMobilePerformance: sq.psiMobilePerformance,
    psiDesktopLcp: sq.psiDesktopLcp,
    psiMobileLcp: sq.psiMobileLcp,
    psiDesktopFcp: sq.psiDesktopFcp,
    psiMobileFcp: sq.psiMobileFcp,
    psiDesktopSi: sq.psiDesktopSi,
    psiMobileSi: sq.psiMobileSi,
    psiDesktopTbt: sq.psiDesktopTbt,
    psiMobileTbt: sq.psiMobileTbt,
    psiDesktopCls: sq.psiDesktopCls,
    psiMobileCls: sq.psiMobileCls,
    // prevPsiDesktopPerformance: sq2.prevPsiDesktopPerformance,
    // prevPsiDesktopSeo: sq2.prevPsiDesktopSeo,
    // prevPsiDesktopAccessibility: sq2.prevPsiDesktopAccessibility,
    // prevPsiDesktopBestPractices: sq2.prevPsiDesktopBestPractices,
    // prevPsiDesktopScore: sq2.prevPsiDesktopScore,
  })
    .from(sq)
    // .leftJoin(sq2, filter === 'top-level' ? sql`sq.topLevelPath1 = sq2.topLevelPath2` : eq(sq.path, sq2.path))
    .where(finalWhere)
    .orderBy(desc(sq.path))
    .as('pagesSelect')

  const pages = await useDrizzle().select()
    .from(pagesSelect)
    .offset(offset)
    .limit(10)

  const totals = await useDrizzle().select({
    count: count().as('total'),
    // totalAvgDesktop: avg(sq.psiDesktopScore).as('psiDesktopScore'),
  })
    .from(pagesSelect)
  return {
    rows: pages,
    total: totals[0].count,
  }
})
