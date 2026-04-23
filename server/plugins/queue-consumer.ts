import type { AppEventName, EventContextMap, TaskName } from '../utils/event-service'
import type { JobMessage } from '../utils/jobs'
import { eq } from 'drizzle-orm'
import { jobs } from '../db/schema'
import { onJobComplete, onJobFailed } from '../utils/event-service'
import { dispatchJob } from '../utils/job-dispatcher'
import { claimJob, completeJob, failJob, getCFQueue } from '../utils/jobs'

function emitEvent<E extends AppEventName>(event: E, ctx: EventContextMap[E]): Promise<void> {
  return useNitroApp().hooks.callHook(event, ctx)
}

interface QueueMessage<T> {
  body: T
  attempts: number
  ack: () => void
  retry: (opts?: { delaySeconds?: number }) => void
}

interface QueueBatch<T> {
  queue: string
  messages: QueueMessage<T>[]
}

interface QueuePayload {
  batch: QueueBatch<JobMessage>
  env: Record<string, unknown>
}

const JOB_QUEUES = ['ri-default', 'ri-psi']

export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('cloudflare:queue' as any, async (payload: QueuePayload) => {
    const { batch, env } = payload

    if (JOB_QUEUES.includes(batch.queue)) {
      await processJobBatch(batch, env)
    }
    else if (batch.queue === 'ri-dlq') {
      await processDLQBatch(batch, env)
    }
    else {
      console.warn(`[Queue] Unknown queue: ${batch.queue}, acking ${batch.messages.length} messages`)
      for (const msg of batch.messages)
        msg.ack()
    }
  })
})

async function processJobBatch(batch: QueueBatch<JobMessage>, env: Record<string, unknown>) {
  const db = useDrizzle()

  console.warn(`[Queue] Processing ${batch.messages?.length} jobs from ${batch.queue}`)

  for (const msg of batch.messages) {
    const { jobId } = msg.body

    // Claim job atomically
    const job = await claimJob(db, jobId)
    if (!job) {
      const existing = await db.select({
        reservedAt: jobs.reservedAt,
        completedAt: jobs.completedAt,
        failedAt: jobs.failedAt,
      }).from(jobs).where(eq(jobs.id, jobId)).get()

      if (!existing || existing.completedAt || existing.failedAt) {
        msg.ack()
      }
      else {
        msg.retry({ delaySeconds: 60 })
      }
      continue
    }

    const taskName = (job.payload as { _task?: TaskName })._task

    try {
      const result = await dispatchJob(env, job)

      if (!result.success)
        throw new Error(result.error || 'Job dispatch failed')

      // Handler used release() or fail()
      if (result.control?.handled) {
        if (result.control.action === 'failed') {
          await onJobFailed(db, env, jobId)
          if (taskName) {
            await emitEvent('app:job:failed', {
              env,
              jobId,
              taskName,
              error: result.control.error || 'Handler called fail()',
              attempt: job.attempts,
              permanent: true,
            })
          }
        }
        msg.ack()
        continue
      }

      // Complete job and trigger batch callbacks
      const { durationMs } = await completeJob(db, jobId)
      const batchResult = await onJobComplete(db, env, jobId)

      if (batchResult.batchProgress) {
        await emitEvent('app:batch:progress', {
          env,
          batchId: batchResult.batchProgress.batchId,
          batchName: batchResult.batchProgress.name,
          completed: batchResult.batchProgress.completed,
          total: batchResult.batchProgress.total,
          failed: batchResult.batchProgress.failed,
        })
      }

      if (batchResult.batchComplete && batchResult.batchProgress) {
        await emitEvent('app:batch:complete', {
          env,
          batchId: batchResult.batchProgress.batchId,
          batchName: batchResult.batchProgress.name,
          total: batchResult.batchProgress.total,
          failed: batchResult.batchProgress.failed,
        })
      }

      msg.ack()
      console.warn(`[Queue] Job ${jobId} (${taskName}) succeeded in ${durationMs}ms`)

      if (taskName) {
        await emitEvent('app:job:completed', {
          env,
          jobId,
          taskName,
          siteId: job.siteId ?? undefined,
          userId: job.userId ?? undefined,
          durationMs,
        })
      }
    }
    catch (error: unknown) {
      const errorMsg = error instanceof Error
        ? error.message
        : typeof error === 'string' ? error : 'Unknown error'

      console.error(`[Queue] Job ${jobId} (${taskName}) failed: ${errorMsg}`)

      // D1 rate limit - retry without updating
      if (errorMsg.includes('Too many API requests')) {
        await db.update(jobs)
          .set({ reservedAt: null, lastError: errorMsg })
          .where(eq(jobs.id, jobId))
          .run()
          .catch(() => {})
        msg.retry({ delaySeconds: 30 })
        continue
      }

      const isPermanentFailure = job.attempts >= job.maxAttempts

      if (isPermanentFailure) {
        await failJob(db, jobId, errorMsg)
          .catch(e => console.error(`[Queue] failJob failed for ${jobId}:`, (e as Error)?.message))

        await onJobFailed(db, env, jobId)
          .catch(e => console.error(`[Queue] onJobFailed error for ${jobId}:`, (e as Error)?.message))

        if (taskName) {
          await emitEvent('app:job:failed', {
            env,
            jobId,
            taskName,
            error: errorMsg,
            attempt: job.attempts,
            permanent: true,
          }).catch(() => {})
        }
        msg.ack()
      }
      else {
        await db.update(jobs)
          .set({ reservedAt: null, lastError: errorMsg })
          .where(eq(jobs.id, jobId))
          .run()
          .catch(() => {})

        const delay = Math.min(10 * 2 ** job.attempts, 300)
        msg.retry({ delaySeconds: delay })
      }
    }
  }
}

async function processDLQBatch(batch: QueueBatch<JobMessage>, env: Record<string, unknown>) {
  const db = useDrizzle()

  console.warn(`[DLQ] Processing ${batch.messages.length} failed jobs`)

  for (const msg of batch.messages) {
    const { jobId, queue } = msg.body

    const job = await db.select()
      .from(jobs)
      .where(eq(jobs.id, jobId))
      .get()

    if (!job) {
      msg.ack()
      continue
    }

    // Count DLQ cycles from error prefix
    const dlqCycles = (job.lastError?.match(/\[DLQ \d+\]/g) || []).length
    const effectiveAttempt = dlqCycles + 1

    // Exponential backoff: 1hr, 4hr, 16hr
    const backoffHours = 4 ** (effectiveAttempt - 1)

    if (effectiveAttempt > 3 || job.attempts >= job.maxAttempts) {
      await failJob(db, jobId, `[DLQ exhausted] ${job.lastError || 'Unknown error'}`)
      console.error(`[DLQ] Job ${jobId} permanently failed after ${effectiveAttempt} DLQ cycles`)
      msg.ack()
      continue
    }

    // Reset job for retry
    const availableAt = Math.floor(Date.now() / 1000) + backoffHours * 3600
    await db.update(jobs)
      .set({
        reservedAt: null,
        availableAt,
        lastError: `[DLQ ${effectiveAttempt}] ${job.lastError || 'Unknown error'}`,
      })
      .where(eq(jobs.id, jobId))
      .run()

    // Re-queue to appropriate queue
    const cfQueue = getCFQueue(env, queue)
    if (!cfQueue) {
      msg.retry({ delaySeconds: 300 })
      continue
    }

    await cfQueue.send({ jobId, queue }, { delaySeconds: Math.min(backoffHours * 3600, 43200) })
    console.warn(`[DLQ] Re-queued job ${jobId} with ${backoffHours}h delay (DLQ cycle ${effectiveAttempt})`)
    msg.ack()
  }
}
