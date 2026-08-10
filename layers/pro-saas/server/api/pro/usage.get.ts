import type { ProUsageContribution } from '../../utils/hooks'
import { eq } from 'drizzle-orm'
import { sites } from '../../database'
import { dispatchProEvent } from '../../utils/dispatch'
import { defineProApiHandler } from '../../utils/handler'

// DataForSEO + lifetime-grant usage paths removed during V1 port — both deferred
// (V1 line 181, V1 pricing replaces lifetime). Replace with V1 prompts/day quota
// when the citation tracker lands (06-pro-chat.md Phase C).
export default defineProApiHandler({}, async ({ event, db, caller }) => {
  const contributions: ProUsageContribution[] = []
  const [siteRows] = await Promise.all([
    db.select({ id: sites.siteId }).from(sites).where(eq(sites.ownerId, caller.user.id)).all(),
    dispatchProEvent(event, 'pro:usage:collect', { userId: caller.user.id, contributions }),
  ])

  const ai = contributions.find(c => c.key === 'ai')

  return {
    sites: {
      used: siteRows.length,
      limit: caller.subscription.sitesLimit ?? 1,
    },
    ai: {
      estimatedUsd: ai?.estimatedUsd ?? 0,
      limitUsd: ai?.limitUsd ?? null,
      overCap: ai?.overCap ?? false,
      resetsAt: ai?.resetsAt ?? null,
    },
  }
})
