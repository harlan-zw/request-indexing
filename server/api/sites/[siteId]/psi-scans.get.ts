import { between, count, desc, ilike } from 'drizzle-orm'
import { getQuery } from 'h3'
import { authenticateUser } from '~/server/app/utils/auth'
import {
  sitePageSpeedInsightScans,
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
  const { page, q } = getQuery<{
    page: string
    q: string
  }>(e)
  const range = userPeriodRange(user)
  const _where = [
    eq(sitePageSpeedInsightScans.siteId, site.siteId),
  ]
  if (q?.length)
    _where.push(ilike(sitePageSpeedInsightScans.path, `%${q}%`))
  const sq = useDrizzle()
    .select()
    .from(sitePageSpeedInsightScans)
    .where(and(
      // format createdAt as a unix timestamp number
      // TODO need to find a solution to this
      between(sitePageSpeedInsightScans.createdAt, range.period.startTimestamp, sql`CURRENT_TIMESTAMP`),
      ..._where,
    ))
    .as('sq')

  const offset = ((Number(page) || 1) - 1) * 10

  const pagesSelect = useDrizzle().select()
    .from(sq)
    .orderBy(desc(sq.path))
    .as('pagesSelect')

  const pages = await useDrizzle().select()
    .from(pagesSelect)
    .offset(offset)
    .limit(10)

  const totals = await useDrizzle().select({
    count: count().as('total'),
  })
    .from(pagesSelect)

  return {
    rows: pages,
    total: totals[0].count,
  }
})
