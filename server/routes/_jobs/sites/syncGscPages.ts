import dayjs from 'dayjs'
import type {
  SiteUrlSelect,
} from '~/server/database/schema'
import {
  siteUrls,
  sites,
} from '~/server/database/schema'
import { defineJobHandler } from '~/server/plugins/eventServiceProvider'
// import { wsUsers } from '~/server/routes/_ws'

export default defineJobHandler(async (event) => {
  const { siteId } = await readBody<{ siteId: number }>(event)

  const db = useDrizzle()
  const site = await db.query.sites.findFirst({
    with: {
      owner: true,
    },
    where: eq(sites.siteId, siteId),
  })

  if (!site || !site.owner) {
    throw createError({
      statusCode: 404,
      message: 'Site or User not found',
    })
  }

  const pages = await fetchGSCPages(site.owner.loginTokens, {
    period: {
      start: dayjs().subtract(30, 'day').toDate(),
      end: dayjs().subtract(1, 'day').toDate(),
    },
  }, site)

  if (!pages.rows.length)
    return { res: 0 }

  const indexedPages = pages.rows.map((row) => {
    return {
      ...row,
      isIndexed: true,
      path: new URL(row.page).pathname,
      siteId,
    }
  }) as any as SiteUrlSelect[]

  await db.batch(indexedPages.map(row => db.insert(siteUrls).values(row).onConflictDoUpdate({
    target: [siteUrls.siteId, siteUrls.path],
    set: { ...row, isIndexed: true },
  })))

  return {
    res: indexedPages.length,
  }
})
