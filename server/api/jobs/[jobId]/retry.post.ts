import { authenticateAdmin } from '~/server/app/utils/auth'
import { jobs } from '~/server/database/schema'
import { useMessageQueue } from '~/lib/nuxt-ttyl/runtime/nitro/mq'

export default defineEventHandler(async (e) => {
  await authenticateAdmin(e)
  const { jobId } = getRouterParams(e, { decode: true })
  const db = useDrizzle()
  const job = await db.query.jobs.findFirst({
    where: eq(jobs.jobId, Number(jobId)),
  })
  if (job) {
    await db.update(jobs).set({
      attempts: job.attempts + 1,
      status: 'processing',
    }).where(eq(jobs.jobId, Number(jobId)))
    // retry
    const mq = useMessageQueue()
    await mq.message(`/_jobs/run`, { jobId: job.jobId })
    return 'OK'
  }
  return '404'
})
