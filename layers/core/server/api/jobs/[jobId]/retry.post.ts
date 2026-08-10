import { dispatchToQueue } from '~~/layers/core/server/utils/event-service'
import { retryFailedJob } from '~~/layers/core/server/utils/jobs'

export default defineEventHandler(async (e) => {
  await requireAdminAuth(e)
  const { jobId } = getRouterParams(e, { decode: true })
  const db = useDrizzle()
  const env = (e.context.cloudflare?.env ?? {}) as Record<string, unknown>

  const result = await retryFailedJob(db, jobId!)
  if (result) {
    await dispatchToQueue(env, result.id, result.queue)
    return 'OK'
  }
  return '404'
})
