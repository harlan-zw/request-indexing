import type { ApiUsageSource, ApiUsageStatus } from '../../../../database'
import { listTeamApiUsage } from '../../../../resources/team'
import { defineProApiHandler } from '../../../../utils/handler'

const sources = new Set<ApiUsageSource>(['mcp', 'rest', 'internal'])
const statuses = new Set<ApiUsageStatus>(['success', 'error'])

export default defineProApiHandler({ team: true }, async ({ event, team: ctx }) => {
  const query = getQuery(event)
  const source = typeof query.source === 'string' && sources.has(query.source as ApiUsageSource)
    ? query.source as ApiUsageSource
    : null
  const status = typeof query.status === 'string' && statuses.has(query.status as ApiUsageStatus)
    ? query.status as ApiUsageStatus
    : null
  const limit = typeof query.limit === 'string' ? Number.parseInt(query.limit, 10) : undefined

  return await listTeamApiUsage(ctx, {
    tokenId: typeof query.tokenId === 'string' && Number.isFinite(Number(query.tokenId)) ? Number(query.tokenId) : null,
    source,
    status,
    limit: Number.isFinite(limit) ? limit : undefined,
    cursor: typeof query.cursor === 'string' ? query.cursor : null,
  })
})
