import type { NitroRuntimeHooks } from 'nitropack'
import type { H3Event } from 'h3'
import { createConsola } from 'consola'
import { useMessageQueue } from '#imports'
import type { JobBatchInsert, JobInsert } from '~/server/database/schema'
import { jobBatches, jobs } from '~/server/database/schema'

const logger = createConsola({
  level: import.meta.dev ? 5 : 3,
  defaults: {
    tag: 'jobs',
  },
})

export async function batchJobs(batchOptions: JobBatchInsert, _jobs: Partial<JobInsert>[]) {
  if (!_jobs.length)
    return []

  const db = useDrizzle()
  // create the batch
  const batch = (await db.insert(jobBatches).values({
    totalJobs: _jobs.length,
    pendingJobs: _jobs.length,
    ...batchOptions,
  }).returning())[0]
  _jobs = _jobs.map(j => ({
    queue: 'default',
    jobBatchId: batch.jobBatchId,
    payload: {
      ...j.payload || {},
      jobBatchesId: batch.jobBatchId,
    },
    ...j,
  } as JobInsert))
  const createdJobs = await db.batch(_jobs.map((job) => {
    return db.insert(jobs).values(job).returning()
  }))
  const mq = useMessageQueue()
  return Promise.all(createdJobs.map(job => mq.message(`/_jobs/run`, { jobId: job[0].jobId })))
}

export async function queueJob<T extends keyof TaskMap>(taskName: T, payload: TaskMap[T], options?: Partial<JobInsert>) {
  const mq = useMessageQueue()
  const db = useDrizzle()
  const job = (await db.insert(jobs).values({
    queue: 'default',
    name: taskName,
    payload,
    ...options,
  }).returning())[0]
  return await mq.message(`/_jobs/run`, { jobId: job.jobId })
}

export interface TaskMap {
  'users/sendWelcomeEmail': Parameters<NitroRuntimeHooks['app:user:created']>[number]
  'users/syncGscSites': Parameters<NitroRuntimeHooks['app:user:created']>[number]
  // sites
  'sites/setup': { siteId: number }
  // site urls
  'paths/runPsi': { siteId: number, path: string, strategy: 'mobile' | 'desktop' }
  'paths/gscInspect': { siteId: number, page: string }
  'sites/syncGscDate': { siteId: number, date: string }
  // teams
  'teams/syncSelected': Parameters<NitroRuntimeHooks['app:team:sites-selected']>[number]
  'sites/syncGscDates': { siteId: number }
  'sites/syncSitemapPages': { siteId: number }
  'sites/syncFinished': { siteId: number }
}

export function defineJobHandler(handler: (event: H3Event) => Promise<void | { broadcastTo?: string[] | string }>) {
  return defineEventHandler((event) => {
    try {
      return handler(event)
    }
    catch (e) {
      logger.warn('Job handler failed', e)
      throw e
    }
  })
}

function listeners<T extends keyof NitroRuntimeHooks>(hookName: T, tasks: (keyof TaskMap | ([keyof TaskMap, (ctx: Parameters<NitroRuntimeHooks[T]>[number]) => boolean]))[], payloadTransformer: (ctx: Parameters<NitroRuntimeHooks[T]>[number]) => Omit<Partial<JobInsert>, 'name'>) {
  return {
    [hookName]: async (ctx: Parameters<NitroRuntimeHooks[T]>[number]) => {
      // const mq = useMessageQueue()
      // const db = useDrizzle()
      // create jobs for each tasks
      await Promise.all(
        tasks.map(async (task) => {
          const taskName = typeof task === 'string' ? task : task[0]
          const filter = typeof task === 'string' ? () => true : task[1]
          if (!filter(ctx))
            return
          return await queueJob(taskName, payloadTransformer(ctx).payload)
          // const job = (await db.insert(jobs).values({
          //   queue: 'default',
          //   name: taskName,
          //   ...payloadTransformer(ctx),
          // }).returning())[0]
          // return await mq.message(`/_jobs/run`, { jobId: job.jobId })
        }),
      )
    },
  }
}

export default defineNitroPlugin(async (nitro) => {
  nitro.hooks.addHooks({
    ...listeners('app:user:created', [
      'users/sendWelcomeEmail',
      'users/syncGscSites',
    ], (ctx) => {
      return {
        payload: {
          userId: ctx.userId,
        },
        entityId: ctx.userId,
        entityType: 'user',
      }
    }),
    ...listeners('app:team:sites-selected', [
      // do expensive site work
      'teams/syncSelected',
      // do actual crawl?
    ], (ctx) => {
      return {
        payload: {
          teamId: ctx.teamId,
        },
        entityId: ctx.teamId,
        entityType: 'team',
      }
    }),
    ...listeners('app:site:created', [
      // ['sites/syncSitemapPages', ctx => !!ctx.domain],
      // ['sites/syncGscFirstDate', ctx => !!ctx.domain],
      // ['sites/syncGscPages', ctx => !!ctx.domain],
      // no domain and a site property means we'll need to split this up and new sites will be created
      // ['sites/setup'],
      ['sites/setup', ctx => ctx.permissionLevel !== 'siteUnverifiedUser'],
    ], (ctx) => {
      return {
        payload: {
          siteId: ctx.siteId,
        },
        entityId: ctx.siteId,
        entityType: 'site',
      }
    }),
  })
})
