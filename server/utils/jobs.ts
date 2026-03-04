import type { QueueName } from '../jobs/_types'
import { eq, sql } from 'drizzle-orm'
import { failedJobs, jobs } from '../db/schema'

export type { QueueName } from '../jobs/_types'

// ============================================
// Types
// ============================================

export interface Job {
  id: string
  queue: QueueName
  jobType: string
  batchId: string | null
  userId: number | null
  siteId: number | null
  payload: Record<string, unknown>
  attempts: number
  maxAttempts: number
  reservedAt: number | null
  availableAt: number
  createdAt: number
  completedAt: number | null
  failedAt: number | null
  lastError: string | null
  durationMs: number | null
}

export interface JobMessage {
  jobId: string
  queue: QueueName
}

// ============================================
// Queue routing
// ============================================

export function getCFQueue(env: Record<string, unknown>, queue: QueueName) {
  const map: Record<QueueName, string> = {
    default: 'QUEUE_DEFAULT',
    psi: 'QUEUE_PSI',
  }
  return env[map[queue]] as { send: (msg: JobMessage, opts?: { delaySeconds?: number }) => Promise<void> } | undefined
}

export function getCFDLQ(env: Record<string, unknown>) {
  return env.QUEUE_DLQ as { send: (msg: JobMessage, opts?: { delaySeconds?: number }) => Promise<void> } | undefined
}

// ============================================
// Claim jobs
// ============================================

export async function claimJob(db: ReturnType<typeof useDrizzle>, jobId: string): Promise<Job | null> {
  const now = Math.floor(Date.now() / 1000)
  const staleThreshold = now - 300 // 5 minutes

  const results = await db.run(sql`
    UPDATE jobs
    SET reserved_at = ${now}, attempts = attempts + 1
    WHERE id = ${jobId}
      AND (reserved_at IS NULL OR reserved_at <= ${staleThreshold})
      AND available_at <= ${now}
      AND completed_at IS NULL
      AND failed_at IS NULL
  `)

  // Check if update affected any rows
  if (!(results as any).changes)
    return null

  const row = await db.select().from(jobs).where(eq(jobs.id, jobId)).get()
  if (!row)
    return null

  return parseJobRow(row)
}

// ============================================
// Complete/fail jobs
// ============================================

export async function completeJob(
  db: ReturnType<typeof useDrizzle>,
  jobId: string,
  stats?: { durationMs?: number },
): Promise<{ durationMs: number }> {
  const now = Math.floor(Date.now() / 1000)

  const job = await db.select({
    reservedAt: jobs.reservedAt,
    durationMs: jobs.durationMs,
  })
    .from(jobs)
    .where(eq(jobs.id, jobId))
    .get()

  let durationMs = stats?.durationMs
  if (durationMs === undefined && job?.durationMs)
    durationMs = job.durationMs
  else if (durationMs === undefined && job?.reservedAt)
    durationMs = (now - job.reservedAt) * 1000
  durationMs = durationMs ?? 0

  await db.update(jobs)
    .set({
      completedAt: now,
      reservedAt: null,
      durationMs,
    })
    .where(eq(jobs.id, jobId))
    .run()

  return { durationMs }
}

export async function failJob(
  db: ReturnType<typeof useDrizzle>,
  jobId: string,
  error: string,
): Promise<void> {
  const now = Math.floor(Date.now() / 1000)

  const job = await db.select()
    .from(jobs)
    .where(eq(jobs.id, jobId))
    .get()

  if (job) {
    await db.insert(failedJobs)
      .values({
        id: job.id,
        queue: job.queue,
        jobType: job.jobType,
        batchId: job.batchId,
        userId: job.userId,
        siteId: job.siteId,
        payload: job.payload,
        exception: error,
        attempts: job.attempts!,
        maxAttempts: job.maxAttempts!,
        failedAt: now,
      })
      .onConflictDoUpdate({
        target: failedJobs.id,
        set: { exception: error, failedAt: now, attempts: job.attempts! },
      })
      .run()

    await db.delete(jobs)
      .where(eq(jobs.id, jobId))
      .run()
  }
}

export async function requeueJob(
  db: ReturnType<typeof useDrizzle>,
  jobId: string,
  availableAt: number,
): Promise<void> {
  await db.update(jobs)
    .set({
      reservedAt: null,
      availableAt,
    })
    .where(eq(jobs.id, jobId))
    .run()
}

// ============================================
// Retry failed jobs
// ============================================

export async function retryFailedJob(db: ReturnType<typeof useDrizzle>, failedJobId: string): Promise<{ id: string, queue: QueueName } | null> {
  const failed = await db.select()
    .from(failedJobs)
    .where(eq(failedJobs.id, failedJobId))
    .get()

  if (!failed)
    return null

  const now = Math.floor(Date.now() / 1000)

  await db.insert(jobs)
    .values({
      id: failed.id,
      queue: failed.queue,
      jobType: failed.jobType,
      batchId: failed.batchId,
      userId: failed.userId,
      siteId: failed.siteId,
      payload: failed.payload,
      attempts: 0,
      maxAttempts: failed.maxAttempts,
      reservedAt: null,
      availableAt: now,
      createdAt: now,
      completedAt: null,
      failedAt: null,
      lastError: null,
    })
    .onConflictDoUpdate({
      target: jobs.id,
      set: {
        attempts: 0,
        reservedAt: null,
        availableAt: now,
        completedAt: null,
        failedAt: null,
        lastError: null,
      },
    })
    .run()

  await db.delete(failedJobs)
    .where(eq(failedJobs.id, failedJobId))
    .run()

  return { id: failed.id, queue: failed.queue as QueueName }
}

// ============================================
// Helpers
// ============================================

function parseJobRow(row: typeof jobs.$inferSelect): Job {
  return {
    id: row.id,
    queue: row.queue as QueueName,
    jobType: row.jobType,
    batchId: row.batchId,
    userId: row.userId,
    siteId: row.siteId,
    payload: typeof row.payload === 'string' ? JSON.parse(row.payload) : row.payload as Record<string, unknown>,
    attempts: row.attempts,
    maxAttempts: row.maxAttempts,
    reservedAt: row.reservedAt,
    availableAt: row.availableAt,
    createdAt: row.createdAt,
    completedAt: row.completedAt,
    failedAt: row.failedAt,
    lastError: row.lastError,
    durationMs: row.durationMs,
  }
}
