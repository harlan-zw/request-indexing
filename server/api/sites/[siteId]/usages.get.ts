import { between, sum } from 'drizzle-orm'
import { userPeriodRange } from '~/server/app/models/User'
import { authenticateUser } from '~/server/app/utils/auth'
import {
  sites,
  usages,
} from '~/server/db/schema'

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

  const _where = [
    eq(usages.siteId, site.siteId),
  ]
  const range = userPeriodRange(user)
  return await useDrizzle()
    .select({
      key: usages.key,
      usage: sum(usages.usage).as('usage'),
    })
    .from(usages)
    .where(and(
      ..._where,
      between(usages.date, range.period.startDate, range.period.endDate),
    ))
    .groupBy(usages.key)
})
