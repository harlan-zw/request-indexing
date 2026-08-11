import { eq } from 'drizzle-orm'
import { sites } from '../../database'
import { defineProApiHandler } from '../../utils/handler'

// DataForSEO + lifetime-grant usage paths removed during V1 port — both deferred
// (V1 line 181, V1 pricing replaces lifetime). Replace with V1 prompts/day quota
// when the citation tracker lands (06-pro-chat.md Phase C).
export default defineProApiHandler({}, async ({ db, caller }) => {
  const siteRows = await db.select({ id: sites.siteId }).from(sites).where(eq(sites.ownerId, caller.user.id)).all()

  return {
    sites: {
      used: siteRows.length,
      limit: caller.subscription.sitesLimit ?? 1,
    },
    ai: {
      estimatedUsd: 0,
      limitUsd: null,
      overCap: false,
      resetsAt: null,
    },
  }
})
