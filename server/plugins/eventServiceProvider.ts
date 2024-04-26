import type { NitroRuntimeHooks } from 'nitropack'
import type { H3Event } from 'h3'
import { useMessageQueue } from '#imports'
import type { JobInsert } from '~/server/database/schema'
import { jobs } from '~/server/database/schema'

export async function queueJob<T extends keyof TaskMap>(taskName: T, payload: TaskMap[T]) {
  const mq = useMessageQueue()
  const db = useDrizzle()
  const job = (await db.insert(jobs).values({
    queue: 'default',
    name: taskName,
    payload,
  }).returning())[0]
  return await mq.message(`/_jobs/run`, { jobId: job.jobId })
}

interface TaskMap {
  'users/sendWelcomeEmail': Parameters<NitroRuntimeHooks['app:user:created']>[number]
  'users/syncGscSites': Parameters<NitroRuntimeHooks['app:user:created']>[number]
  // sites
  'sites/syncGscFirstDate': Parameters<NitroRuntimeHooks['app:site:created']>[number]
  'sites/syncGscPages': Parameters<NitroRuntimeHooks['app:site:created']>[number]
  'sites/syncSitemapPages': Parameters<NitroRuntimeHooks['app:site:created']>[number]
  'sites/meta': Parameters<NitroRuntimeHooks['app:site:created']>[number]
  'sites/splitDomainPropertySites': Parameters<NitroRuntimeHooks['app:site:created']>[number]
  // teams
  'teams/queueTopPagesPsiScan': Parameters<NitroRuntimeHooks['app:team:sites-selected']>[number]
}

export function defineJobHandler(handler: (event: H3Event) => Promise<void | { broadcastTo?: string[] | string }>) {
  return defineEventHandler((event) => {
    try {
      return handler(event)
    }
    catch (e) {
      console.log('caught exception! returning error', e)
      return {
        status: 200, // avoid nitro from ending request, allow bubble up
        body: JSON.stringify({ error: e.message }),
      }
    }
  })
}

function listeners<T extends keyof NitroRuntimeHooks>(hookName: T, tasks: (keyof TaskMap | ([keyof TaskMap, (ctx: Parameters<NitroRuntimeHooks[T]>[number]) => boolean]))[], payloadTransformer: (ctx: Parameters<NitroRuntimeHooks[T]>[number]) => Omit<Partial<JobInsert>, 'name'>) {
  return {
    [hookName]: async (ctx: Parameters<NitroRuntimeHooks[T]>[number]) => {
      const mq = useMessageQueue()
      const db = useDrizzle()
      // create jobs for each tasks
      await Promise.all(
        tasks.map(async (task) => {
          const taskName = typeof task === 'string' ? task : task[0]
          const filter = typeof task === 'string' ? () => true : task[1]
          if (!filter(ctx))
            return
          const job = (await db.insert(jobs).values({
            queue: 'default',
            name: taskName,
            ...payloadTransformer(ctx),
          }).returning())[0]
          return await mq.message(`/_jobs/run`, { jobId: job.jobId })
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
      'teams/queueTopPagesPsiScan',
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
      ['sites/syncSitemapPages', ctx => !!ctx.domain],
      ['sites/syncGscFirstDate', ctx => !!ctx.domain],
      ['sites/syncGscPages', ctx => !!ctx.domain],
      // no domain and a site property means we'll need to split this up and new sites will be created
      ['sites/splitDomainPropertySites', ctx => ctx.property.startsWith('sc-domain') && !ctx.domain],
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
