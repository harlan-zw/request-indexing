import { joinURL } from 'ufo'
import type { JobBatchInsert, JobBatchSelect } from '~/server/database/schema'
import { failedJobs, jobBatches, jobs } from '~/server/database/schema'
import { useMessageQueue } from '~/lib/nuxt-ttyl/runtime/nitro/mq'
import { queueJob } from '~/server/plugins/eventServiceProvider'

export default defineEventHandler(async (event) => {
  const { jobId } = await readBody<{ jobId: number }>(event)
  const db = useDrizzle()
  const job = await db.query.jobs.findFirst({
    where: eq(jobs.jobId, jobId),
  })
  if (!job) {
    throw createError({
      status: 404,
      message: 'Job not found',
    })
  }
  let batch: JobBatchSelect | undefined
  if (job.jobBatchId) {
    batch = await db.query.jobBatches.findFirst({
      where: eq(jobBatches.jobBatchId, job.jobBatchId),
    })
  }
  const nitro = useNitroApp()
  const now = Date.now()
  const res = await nitro.localFetch(joinURL('/_jobs', job.name), {
    body: job.payload,
    method: 'POST',
    retry: false,
    ignoreResponseError: true,
    // we want json back
    headers: {
      'Content-Type': 'application/json',
    },
  })
  const body = res.status >= 400 ? await res.text() : await res.json()
  // insert the response
  await db.update(jobs).set({
    response: JSON.stringify({
      status: res.status,
      body,
    }),
  }).where(eq(jobs.jobId, jobId))
  if (res.status >= 400) {
    // failed
    await db.insert(failedJobs).values({
      jobId,
      exception: JSON.stringify(body),
    })
    // check if we're at max attempts
    if (job.attempts >= 3) {
      await db.update(jobs).set({
        status: 'failed',
      }).where(eq(jobs.jobId, jobId))
      if (batch) {
        const payload: Partial<JobBatchInsert> = {
          pendingJobs: batch.pendingJobs - 1,
          failedJobs: batch.failedJobs + 1,
          failedJobIds: [...(batch.failedJobIds || []), jobId],
        }
        await db.update(jobBatches).set(payload).where(eq(jobBatches.jobBatchId, batch.jobBatchId))
      }
      return 'OK'
    }
    // increment attempts
    await db.update(jobs).set({
      attempts: job.attempts + 1,
    }).where(eq(jobs.jobId, jobId))
    // retry
    const mq = useMessageQueue()
    await mq.message(`/_jobs/run`, { jobId: job.jobId })
  }
  else {
    await db.update(jobs).set({
      timeTaken: Date.now() - now,
      status: 'completed',
    }).where(eq(jobs.jobId, jobId))
    if (batch) {
      const updatedBatch = await db.update(jobBatches)
        .set({
          pendingJobs: sql`${jobBatches.pendingJobs} - 1`,
        })
        .where(eq(jobBatches.jobBatchId, batch.jobBatchId))
        .returning({ pendingJobs: jobBatches.pendingJobs })
      // job can run separately and inherit broadcasting
      if (updatedBatch?.[0]?.pendingJobs === 0) {
        // save finishedAt
        await db.update(jobBatches).set({
          finishedAt: Date.now(),
        }).where(eq(jobBatches.jobBatchId, batch.jobBatchId))
        if (batch.options?.onFinish)
          await queueJob(batch.options.onFinish.name, batch.options.onFinish.payload)
      }
    }
    const { broadcastTo } = body as { broadcastTo?: string[] | string }
    if (broadcastTo) {
      (Array.isArray(broadcastTo) ? broadcastTo : [broadcastTo])
        .forEach(async (to) => {
          // success we can trigger broadcasting
          nitro.hooks.callHook(`ws:message:${to}`, {
            name: job.name,
            entityId: job.entityId,
            entityType: job.entityType,
            payload: JSON.stringify({
              ...body,
              broadcastTo: undefined,
            }),
          })
        })
    }
  }
  return 'OK'
})
