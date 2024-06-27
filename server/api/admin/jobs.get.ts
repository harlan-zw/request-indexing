import { desc } from 'drizzle-orm'
import { authenticateAdmin } from '~/server/app/utils/auth'
import { jobs } from '~/server/database/schema'

export default defineEventHandler(async (e) => {
  await authenticateAdmin(e)
  const db = useDrizzle()
  return db.query.jobs.findMany({
    with: {
      failedJobs: true,
    },
    orderBy: desc(jobs.createdAt),
    limit: 1000,
  })
})
