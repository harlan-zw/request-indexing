import type { JobContext, JobControlResult } from '../jobs/_types'
import type { TaskMap, TaskName } from './event-service'
import type { Job, QueueName } from './jobs'
import { getHandler, getJobDefinition } from '../jobs/_registry'
import { failJob, getCFQueue, requeueJob } from './jobs'

export interface DispatchResult {
  success: boolean
  error?: string
  handlerNotFound?: boolean
  control?: JobControlResult
}

export async function dispatchJob(
  env: Record<string, unknown>,
  job: Job,
): Promise<DispatchResult> {
  const payload = job.payload as { _task?: TaskName, [key: string]: unknown }
  const taskName = payload._task

  if (!taskName)
    return { success: false, error: 'No _task in payload', handlerNotFound: true }

  const handler = getHandler(taskName)
  if (!handler)
    return { success: false, error: `No handler for task: ${taskName}`, handlerNotFound: true }

  const db = useDrizzle()
  const control: JobControlResult = { handled: false }

  const ctx: JobContext = {
    env,
    jobId: job.id,
    batchId: job.batchId,
    attempt: job.attempts,
    db,

    async release(delaySeconds: number) {
      if (control.handled)
        return
      control.handled = true
      control.action = 'released'
      control.delaySeconds = delaySeconds

      const availableAt = Math.floor(Date.now() / 1000) + delaySeconds
      await requeueJob(db, job.id, availableAt)

      const queue = getCFQueue(env, job.queue as QueueName)
      if (queue)
        await queue.send({ jobId: job.id, queue: job.queue as QueueName }, { delaySeconds })
    },

    async fail(error: string) {
      if (control.handled)
        return
      control.handled = true
      control.action = 'failed'
      control.error = error

      await failJob(db, job.id, error)
    },
  }

  const { _task, ...cleanPayload } = payload

  try {
    await handler(cleanPayload as TaskMap[typeof taskName], ctx)
  }
  catch (err) {
    if (control.handled)
      return { success: true, control }
    throw err
  }

  return { success: true, control: control.handled ? control : undefined }
}

export function hasHandler(taskName: TaskName): boolean {
  return !!getHandler(taskName)
}

export function getMaxAttempts(taskName: TaskName): number {
  const def = getJobDefinition(taskName)
  return def?.maxAttempts ?? 3
}
