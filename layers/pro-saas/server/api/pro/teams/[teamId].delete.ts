import { deleteTeam } from '../../../actions/team'
import { defineProApiHandler } from '../../../utils/handler'

/**
 * Delete a team. Owner-only. Refuses on personal teams.
 *
 * Schema declares onDelete: 'restrict' on sites, scheduledReports, monthlyReports,
 * contentBriefs to force explicit cleanup here. Skipping any of these throws an FK
 * violation on `db.delete(teams)`. team_memberships + team_invitations cascade.
 *
 * users.currentTeamId has no declared FK (schema gap to be repaired by migration);
 * we re-point any user whose currentTeamId points at this team to their personal
 * team so they don't end up with an orphan reference.
 */
export default defineProApiHandler({
  team: { ability: 'delete-team' },
}, async ({ event, team: ctx }) => {
  await deleteTeam(event, ctx)
  return { ok: true }
})
