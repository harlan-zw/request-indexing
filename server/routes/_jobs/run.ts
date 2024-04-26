import { joinURL } from 'ufo'
import type { FetchOptions } from 'ofetch'
import { failedJobs, jobs } from '~/server/database/schema'

export default defineEventHandler(async (event) => {
  const { jobId } = await readBody<{ jobId: number }>(event)
  const db = useDrizzle()
  const job = await db.query.jobs.findFirst({
    where: eq(jobs.jobId, jobId),
  })
  if (!job) {
    return createError({
      statusCode: 404,
      message: 'Job not found',
    })
  }
  console.log(`Running job ${job.jobId}`, job.name, job.payload)
  const nitro = useNitroApp()
  const res = await nitro.localFetch(joinURL('/_jobs', job.name), <FetchOptions> {
    body: job.payload,
    method: 'POST',
    retry: false,
    onRequestError() {
      console.log('request error')
    },
    onResponseError() {
      console.log('response error')
    },
  })
  const body = res.status >= 400 ? await res.text() : await res.json()
  if (res.status >= 400 || body.error) {
    // failed
    console.log(`Job error ${job.jobId}`, job.name)
    // increment attempts
    await db.update(jobs).set({
      attempts: job.attempts + 1,
    }).where(eq(jobs.jobId, jobId))
    // insert failed job
    await db.insert(failedJobs).values({
      jobId,
      exception: JSON.stringify(body),
    })
  }
  else {
    console.log('Job response', job.name, body)
    const { broadcastTo } = body as { broadcastTo?: string[] | string }
    if (broadcastTo) {
      (Array.isArray(broadcastTo) ? broadcastTo : [broadcastTo])
        .forEach(async (to) => {
          // success we can trigger broadcasting
          nitro.hooks.callHook(`ws:message:${to}`, {
            event: 'job:completed',
            payload: JSON.stringify(res),
          })
        })
    }
  }
  return 'OK'
})
