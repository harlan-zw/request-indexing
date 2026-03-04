import type { TaskMap, TaskName } from '../utils/event-service'

export type { TaskMap, TaskName }
export type QueueName = 'default' | 'psi'

export interface JobControlResult {
  handled: boolean
  action?: 'released' | 'failed'
  delaySeconds?: number
  error?: string
}

export interface JobContext {
  env: Record<string, unknown>
  jobId: string
  batchId: string | null
  attempt: number
  db: ReturnType<typeof useDrizzle>
  release: (delaySeconds: number) => Promise<void>
  fail: (error: string) => Promise<void>
}

export type JobHandler<T extends TaskName> = (
  payload: TaskMap[T],
  ctx: JobContext,
) => Promise<void>

export interface JobDefinition<T extends TaskName = TaskName> {
  name: T
  queue: QueueName
  handle: JobHandler<T>
  maxAttempts?: number
}

export function defineJob<T extends TaskName>(
  opts: {
    name: T
    queue: QueueName
    handle: JobHandler<T>
    maxAttempts?: number
  },
): JobDefinition<T> {
  return opts
}
