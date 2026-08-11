// Quota/usage indicators for the dashboard usages panel
// (`dashboard/site/[slug]/usages.vue`, expects a bare array of `{ key, usage }`
// rows). The old `siteDateAnalytics` rollup this used to read is gone, but the
// `usages` table (still written by `incrementUsage()` — see
// `apps/app/server/api/indexing/[url].post.ts`, key `indexingApi`) is real
// and live, so this sums it for the current calendar month instead of
// inventing numbers. GSC/indexing usage only — no PSI or CrUX counters.
import { and, eq, gte, sql } from 'drizzle-orm'
import { usages } from '~~/layers/core/server/db/schema'
import { currentPstDate } from '~~/layers/core/server/utils/dayjs'
import { defineProApiHandler } from '#layers/pro-saas/server/utils/handler'

export default defineProApiHandler(async (event) => {
  const access = await requireTeamSite(event)
  const monthStart = `${currentPstDate().slice(0, 7)}-01`

  const rows = await access.db.select({
    key: usages.key,
    usage: sql<number>`sum(${usages.usage})`,
  })
    .from(usages)
    .where(and(eq(usages.siteId, access.site.siteId), gte(usages.date, monthStart)))
    .groupBy(usages.key)
    .all()

  return rows.map(row => ({ key: row.key, usage: Number(row.usage) }))
})
