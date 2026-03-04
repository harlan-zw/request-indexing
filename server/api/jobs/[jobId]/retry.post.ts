import { authenticateAdmin } from '~/server/app/utils/auth'
import { dispatchToQueue } from '~/server/utils/event-service'
import { retryFailedJob } from '~/server/utils/jobs'

export default defineEventHandler(async (e) => {
  await authenticateAdmin(e)
  const { jobId } = getRouterParams(e, { decode: true })
  const db = useDrizzle()
  const env = (e.context.cloudflare?.env ?? {}) as Record<string, unknown>

  const result = await retryFailedJob(db, jobId)
  if (result) {
    await dispatchToQueue(env, result.id, result.queue)
    return 'OK'
  }
  return '404'
})
