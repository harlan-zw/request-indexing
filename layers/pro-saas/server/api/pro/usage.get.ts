import { eq } from 'drizzle-orm'
import { FREE_SITES_LIMIT } from '../../../shared/caller-policy'
import { sites } from '../../database'
import { defineProApiHandler } from '../../utils/handler'

// DataForSEO + lifetime-grant usage paths removed during V1 port; V1 pricing
// replaces lifetime grants.
export default defineProApiHandler({}, async ({ db, caller }) => {
  const siteRows = await db.select({ id: sites.siteId }).from(sites).where(eq(sites.ownerId, caller.user.id)).all()

  return {
    sites: {
      used: siteRows.length,
      limit: FREE_SITES_LIMIT,
    },
  }
})
