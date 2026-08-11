import { defineProApiHandler } from '#layers/pro-saas/server/utils/handler'

// The team "accounts" the caller belongs to (owned + member-of), for a team
// switcher. Distinct from `teams/members`, which lists the members of the
// caller's *current* team.
export default defineProApiHandler({}, ({ caller }) => caller.memberships)
