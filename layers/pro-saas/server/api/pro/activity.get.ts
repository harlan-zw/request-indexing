import { desc, eq } from 'drizzle-orm'
import { mcpUsage } from '../../database'
import { defineProApiHandler } from '../../utils/handler'

export default defineProApiHandler({ team: true }, async ({ db, team }) => {
  // mcpUsage is team-scoped (activity log per team).
  // toolLookups was dropped (deferred); only MCP usage feeds the activity feed.
  const mcp = await db.select({
    id: mcpUsage.mcpUsageId,
    action: mcpUsage.action,
    target: mcpUsage.target,
    client: mcpUsage.client,
    status: mcpUsage.status,
    createdAt: mcpUsage.createdAt,
  })
    .from(mcpUsage)
    .where(eq(mcpUsage.teamId, team.team.teamId))
    .orderBy(desc(mcpUsage.createdAt))
    .limit(50)

  const activity = mcp
    .map(m => ({ type: 'mcp' as const, ...m }))
    .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime())
    .slice(0, 50)

  return { activity, mcpCount: mcp.length, toolCount: 0 }
})
