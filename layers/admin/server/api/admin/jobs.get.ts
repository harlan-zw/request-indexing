import { desc } from 'drizzle-orm'
import { failedJobs, jobs } from '~~/server/db/schema'

export default defineEventHandler(async (e) => {
  await requireAdminAuth(e)
  const db = useDrizzle()
  const recentJobs = await db.select().from(jobs).orderBy(desc(jobs.createdAt)).limit(1000)
  const recentFailed = await db.select().from(failedJobs).orderBy(desc(failedJobs.failedAt)).limit(100)
  return { jobs: recentJobs, failedJobs: recentFailed }
})
