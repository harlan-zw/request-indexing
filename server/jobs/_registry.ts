import type { TaskName } from '../utils/event-service'
import type { JobDefinition, JobHandler, QueueName } from './_types'

// Import all job handlers
import cruxHistory from './crux/history'
import pathsRunPsi from './paths/run-psi'
import sitesSetup from './sites/setup'
import sitesSyncFinished from './sites/sync-finished'
import teamsSyncSelected from './teams/sync-selected'
import usersSendWelcomeEmail from './users/send-welcome-email'

export const jobs: JobDefinition<any>[] = [
  // Users
  usersSendWelcomeEmail,

  // Sites
  sitesSetup,
  sitesSyncFinished,

  // Teams
  teamsSyncSelected,

  // PSI / CrUX (external APIs)
  pathsRunPsi,
  cruxHistory,
]

// Lookup map for fast dispatch
export const handlers = new Map<TaskName, JobHandler<any>>(
  jobs.map(job => [job.name, job.handle]),
)

export function getHandler(name: TaskName): JobHandler<any> | undefined {
  return handlers.get(name)
}

export function getJobDefinition(name: TaskName): JobDefinition<any> | undefined {
  return jobs.find(j => j.name === name)
}

export function getJobQueue(name: TaskName): QueueName | undefined {
  return jobs.find(j => j.name === name)?.queue
}

export function validateRegistry(expectedTasks: TaskName[]): { missing: TaskName[], extra: TaskName[] } {
  const registered = new Set(handlers.keys())
  const expected = new Set(expectedTasks)
  const missing = expectedTasks.filter(t => !registered.has(t))
  const extra = [...registered].filter(t => !expected.has(t as TaskName)) as TaskName[]
  return { missing, extra }
}
