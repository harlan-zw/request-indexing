import { isNull, not } from 'drizzle-orm'
import { authenticateAdmin } from '~/server/app/utils/auth'
import { sites } from '~/server/database/schema'

export default defineEventHandler(async (e) => {
  await authenticateAdmin(e)
  const db = useDrizzle()
  return db.query.sites.findMany({
    // only active with domain
    where: and(
      eq(sites.active, true),
      not(isNull(sites.domain)),
    ),
  })
})
