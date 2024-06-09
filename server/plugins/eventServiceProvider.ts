import type { NitroRuntimeHooks } from 'nitropack'
import type { H3Event } from 'h3'
import { createConsola } from 'consola'
import { desc, eq, inArray, lt } from 'drizzle-orm'
import { joinURL } from 'ufo'
import { stringify } from 'devalue'
import { useMessageQueue } from '#imports'
import type { JobBatchInsert, JobInsert, JobSelect } from '~/server/database/schema'
import { failedJobs, jobBatches, jobs } from '~/server/database/schema'

const logger = createConsola({
  level: import.meta.dev ? 5 : 3,
  defaults: {
    tag: 'jobs',
  },
})

// const queues = {
//   'google-search-console': {
//     /**
//      * QPS quota
//      * The Search Analytics resource enforces the following QPS (queries per second) QPM (queries per minute) and QPD (queries per day) limits:
//      *
//      * Per-site quota (calls querying the same site):
//      * 1,200 QPM
//      * Per-user quota (calls made by the same user):
//      * 1,200 QPM
//      * Per-project quota (calls made using the same Developer Console key):
//      * 30,000,000 QPD
//      * 40,000 QPM
//      */
//     concurrency: 1,
//   },
//   'url-inspection': {
//     /**
//      * URL inspection
//      * index inspection quota
//      *
//      * Per-site quota (calls querying the same site):
//      * 2000 QPD
//      * 600 QPM
//      * Per-project quota (calls made using the same Developer Console key):
//      * 10,000,000 QPD
//      * 15,000 QPM
//      */
//   },
//   'pagespeed-insights': {
//     /**
//      * PSI
//      * Per-project quota (calls made using the same Developer Console key):
//      * 25,000 QPD
//      * 25,000 QPM
//      */
//   },
// }

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
  const createdJobs = await db.batch(
    _jobs.map(job => db.insert(jobs).values(job).returning()),
  )
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
  // url-inspection
  // 10,000,000 QPD
  // 15,000 QPM
  'paths/gscInspect': { siteId: number, page: string }
  // gsc API
  // 30,000,000 QPD
  // 40,000 QPM
  'gsc/all': { siteId: number, date: string }
  'gsc/country': { siteId: number, date: string }
  'gsc/date': { siteId: number, date: string }
  'gsc/device': { siteId: number, date: string }
  'gsc/page': { siteId: number, date: string }
  'gsc/query': { siteId: number, date: string }
  // 'sites/syncGscDates': { siteId: number }
  // teams
  'teams/syncSelected': Parameters<NitroRuntimeHooks['app:team:sites-selected']>[number]
  'sites/syncSitemapPages': { siteId: number }
  'sites/syncFinished': { siteId: number }

  'keywords/adwords': { siteId: number, keywords: string[] }
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

export async function failJob(job: JobSelect, body: any) {
  const db = useDrizzle()
  const mq = useMessageQueue()
  const jobId = job.jobId
  // failed
  await db.insert(failedJobs).values({
    jobId,
    exception: stringify(body),
  })
  // check if we're at max attempts
  if (job.attempts >= 3) {
    await db.update(jobs).set({
      status: 'failed',
    }).where(eq(jobs.jobId, jobId))
    if (job.jobBatchId) {
      const payload: Partial<JobBatchInsert> = {
        pendingJobs: sql`${jobBatches.pendingJobs} - 1`,
        failedJobs: sql`${jobBatches.pendingJobs} + 1`,
        // failedJobIds: [...(batch.failedJobIds || []), jobId],
      }
      await db.update(jobBatches).set(payload).where(eq(jobBatches.jobBatchId, job.jobBatchId))
    }
    return 'OK'
  }
  console.log('re-attempting job', { jobId })
  // increment attempts
  await db.update(jobs).set({
    attempts: sql`${jobs.attempts} + 1`,
    status: 'pending',
  }).where(eq(jobs.jobId, jobId))
  await mq.message(`/_jobs/run`, { jobId: job.jobId })
}

export async function runJob(job: JobSelect) {
  const jobId = job.jobId
  const db = useDrizzle()
  const nitro = useNitroApp()
  const now = Date.now()
  const res = await nitro.localFetch(joinURL('/_jobs', job.name), {
    body: job.payload,
    method: 'POST',
    retry: false,
    ignoreResponseError: true,
    // we want json back
    headers: {
      Accept: 'application/json',
    },
  })

  const body = await res.json()
  // insert the response
  await db.update(jobs).set({
    response: body,
  }).where(eq(jobs.jobId, jobId))
  if (res.status >= 400) {
    return failJob(job, body)
  }
  await db.update(jobs).set({
    timeTaken: Date.now() - now,
    status: 'completed',
  }).where(eq(jobs.jobId, jobId))
  if (job.jobBatchId) {
    const updatedBatch = (await db.update(jobBatches)
      .set({
        pendingJobs: sql`${jobBatches.pendingJobs} - 1`,
      })
      .where(eq(jobBatches.jobBatchId, job.jobBatchId))
      .returning({ pendingJobs: jobBatches.pendingJobs, options: jobBatches.options }))?.[0]
    // job can run separately and inherit broadcasting
    if (updatedBatch?.pendingJobs === 0) {
      // save finishedAt
      await db.update(jobBatches).set({
        finishedAt: Date.now(),
      }).where(eq(jobBatches.jobBatchId, job.jobBatchId))
      if (updatedBatch.options?.onFinish)
        await queueJob(updatedBatch.options.onFinish.name, updatedBatch.options.onFinish.payload)
    }
  }
  const { broadcastTo } = body as { broadcastTo?: string[] | string }
  if (broadcastTo) {
    (Array.isArray(broadcastTo) ? broadcastTo : [broadcastTo])
      .forEach((to) => {
        // success we can trigger broadcasting
        nitro.hooks.callHook(`ws:message:${to}`, {
          name: job.name,
          entityId: job.entityId,
          entityType: job.entityType,
          payload: {
            ...body,
            broadcastTo: undefined,
          },
        })
      })
  }
}

export async function failStaleRunningJobs() {
  const db = useDrizzle()
  const runningJobs = await db.select()
    .from(jobs)
    .where(and(
      eq(jobs.status, 'running'),
      lt(jobs.startedAt, Date.now() - 120_000), // 200 seconds - 3m20s
    ))
  await Promise.all(runningJobs.map(job => failJob(job, 'Stale running job')))
}

export async function nextWaitingJob(queue: string) {
  const db = useDrizzle()
  // we need to update the db immediately for the next row as a form of lockiong

  const nextJobSubQuery = db.select({
    jobId: jobs.jobId,
  })
    .from(jobs)
    .where(and(
      eq(jobs.status, 'pending'),
      eq(jobs.queue, queue),
    ))
    .orderBy(desc(jobs.priority), jobs.createdAt)
    .limit(1)

  const job = await db.update(jobs)
    .set({
      status: 'running',
      startedAt: Date.now(),
    })
    .where(and(
      inArray(jobs.jobId, nextJobSubQuery),
    ))
    .returning().catch(() => {
      return null
    })
  return job[0]
}
