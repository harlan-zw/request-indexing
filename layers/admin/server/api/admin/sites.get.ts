import { isNull, not } from 'drizzle-orm'
import { sites } from '~~/server/db/schema'

export default defineEventHandler(async (e) => {
  await requireAdminAuth(e)
  const db = useDrizzle()
  return db.query.sites.findMany({
    where: and(
      eq(sites.active, true),
      not(isNull(sites.domain)),
    ),
  })
})
