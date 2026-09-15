import { eq } from 'drizzle-orm'
import { FREE_SITES_LIMIT } from '../../../shared/caller-policy'
import { sites } from '../../database'
import { defineProApiHandler } from '../../utils/handler'

// DataForSEO + lifetime-grant usage paths removed during V1 port; V1 pricing
// replaces lifetime grants.
export default defineProApiHandler({}, async ({ db, caller }) => {
  // The cap counts the current team's sites, because the team owns them.
  const siteRows = caller.currentTeamId
    ? await db.select({ id: sites.id }).from(sites).where(eq(sites.teamId, caller.currentTeamId)).all()
    : []

  return {
    sites: {
      used: siteRows.length,
      limit: FREE_SITES_LIMIT,
    },
  }
})
