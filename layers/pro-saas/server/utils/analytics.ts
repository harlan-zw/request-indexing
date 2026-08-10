/// <reference types="@cloudflare/workers-types" />
import type { H3Event } from 'h3'
import { logWarn } from '~~/shared/logging'
import { mcpUsage } from '#layers/pro-saas/server/database'
import { recordApiUsageLater } from '#layers/pro-saas/server/utils/api-usage'

type ToolName = 'keyword-research' | 'serp-analyzer' | 'domain-rankings' | 'meta-tag-checker' | 'social-share-debugger' | 'xml-sitemap-validator' | 'schema-validator'

export interface AnalyticsDataPoint {
  blobs: string[]
  doubles: number[]
  indexes?: string[]
}

export function getAnalyticsEngine(event: H3Event): AnalyticsEngineDataset | undefined {
  return (event.context.cloudflare?.env as { TOOL_ANALYTICS?: AnalyticsEngineDataset } | undefined)?.TOOL_ANALYTICS
}

export async function trackToolUsage(
  event: H3Event,
  toolId: string,
  action: 'view' | 'use' | 'share' | 'export' | 'copy',
  metadata?: {
    resultCount?: number
    responseTime?: number
    error?: boolean
  },
) {
  const analytics = getAnalyticsEngine(event)

  if (!analytics) {
    return
  }

  const sessionId = getCookie(event, 'analytics-session') || crypto.randomUUID()
  const timestamp = Date.now()

  const dataPoint: AnalyticsDataPoint = {
    blobs: [
      'tool',
      toolId,
      action,
      sessionId,
      metadata?.error ? 'error' : 'success',
    ],
    doubles: [
      timestamp,
      metadata?.responseTime || 0,
      metadata?.resultCount || 0,
    ],
    indexes: [sessionId.substring(0, 8)],
  }

  try {
    analytics.writeDataPoint(dataPoint)
  }
  catch (error) {
    logWarn('telemetry.insert_failed', error, { toolId, action })
  }
}

export async function trackApiUsage(
  event: H3Event,
  endpoint: string,
  responseTime: number,
  statusCode: number,
) {
  const analytics = getAnalyticsEngine(event)

  if (!analytics) {
    return
  }

  const sessionId = getCookie(event, 'analytics-session') || crypto.randomUUID()
  const method = event.method
  const timestamp = Date.now()

  const dataPoint: AnalyticsDataPoint = {
    blobs: [
      'api',
      endpoint,
      method,
      sessionId,
      statusCode.toString(),
    ],
    doubles: [
      timestamp,
      responseTime,
      statusCode,
    ],
    indexes: [sessionId.substring(0, 8)],
  }

  try {
    analytics.writeDataPoint(dataPoint)
  }
  catch (error) {
    logWarn('telemetry.insert_failed', error, { endpoint })
  }
}

function getBrowserFromUA(userAgent: string): string {
  if (userAgent.includes('Claude'))
    return 'claude'
  if (userAgent.includes('Cursor'))
    return 'cursor'
  if (userAgent.includes('Windsurf'))
    return 'windsurf'
  if (userAgent.includes('Chrome'))
    return 'chrome'
  if (userAgent.includes('Safari'))
    return 'safari'
  if (userAgent.includes('Firefox'))
    return 'firefox'
  if (userAgent.includes('Edge'))
    return 'edge'
  return 'other'
}

export async function trackPageView(
  event: H3Event,
  path: string,
  referrer?: string,
) {
  const analytics = getAnalyticsEngine(event)

  if (!analytics) {
    return
  }

  const sessionId = getCookie(event, 'analytics-session') || crypto.randomUUID()
  const timestamp = Date.now()
  const userAgent = getHeader(event, 'user-agent') || 'unknown'

  const dataPoint: AnalyticsDataPoint = {
    blobs: [
      'page',
      path,
      'view',
      sessionId,
      getBrowserFromUA(userAgent),
      referrer || 'direct',
    ],
    doubles: [
      timestamp,
      0,
      0,
    ],
    indexes: [sessionId.substring(0, 8)],
  }

  try {
    analytics.writeDataPoint(dataPoint)
  }
  catch (error) {
    logWarn('telemetry.insert_failed', error, { path })
  }
}

export async function trackMcpUsage(
  event: H3Event,
  endpoint: 'mcp' | 'mcp/pro',
  action: 'connect' | 'tool_call' | 'prompt_call' | 'resource_read' | 'disconnect',
  metadata?: {
    toolName?: string
    promptName?: string
    resourceUri?: string
    responseTime?: number
    error?: boolean
    userId?: string
  },
): Promise<void> {
  try {
    const sessionId = getCookie(event, 'analytics-session') || crypto.randomUUID()
    const timestamp = Date.now()
    const userAgent = getHeader(event, 'user-agent') || 'unknown'
    const targetName = metadata?.toolName || metadata?.promptName || metadata?.resourceUri || null
    const client = getBrowserFromUA(userAgent)
    const status = metadata?.error ? 'error' : 'success'

    // Write to Cloudflare Analytics Engine
    const analytics = getAnalyticsEngine(event)
    if (analytics) {
      const dataPoint: AnalyticsDataPoint = {
        blobs: [
          'mcp',
          endpoint,
          action,
          targetName || 'unknown',
          sessionId,
          status,
          metadata?.userId || 'anonymous',
          client,
        ],
        doubles: [timestamp, metadata?.responseTime || 0, 0],
        indexes: [sessionId.substring(0, 8)],
      }
      // writeDataPoint is sync and returns void
      analytics.writeDataPoint(dataPoint)
    }

    // Write to SQL database for pro endpoint
    if (endpoint === 'mcp/pro') {
      const db = useDrizzle(event)
      const auth = event.context.proAuth as { teamId?: number | null, tokenId?: number | null, user?: { id?: number | null } } | undefined
      await db.insert(mcpUsage).values({
        userId: (typeof metadata?.userId === 'number' ? metadata.userId : null),
        teamId: (typeof auth?.teamId === 'number' ? auth.teamId : null),
        teamApiTokenId: (typeof auth?.tokenId === 'number' ? auth.tokenId : null),
        sessionId,
        endpoint,
        action,
        target: targetName,
        client,
        status: status as 'success' | 'error',
        responseTime: metadata?.responseTime || null,
        createdAt: new Date(),
      })
      recordApiUsageLater(event, {
        teamId: typeof auth?.teamId === 'number' ? auth.teamId : null,
        teamApiTokenId: typeof auth?.tokenId === 'number' ? auth.tokenId : null,
        userId: typeof metadata?.userId === 'number' ? metadata.userId : (typeof auth?.user?.id === 'number' ? auth.user.id : null),
        source: 'mcp',
        method: 'POST',
        path: '/mcp/pro',
        action,
        target: targetName,
        status: status as 'success' | 'error',
        statusCode: metadata?.error ? 500 : 200,
        responseTime: metadata?.responseTime || null,
        client,
        userAgent,
        ip: getRequestIP(event, { xForwardedFor: true }),
      })
    }
  }
  catch (error) {
    logWarn('telemetry.insert_failed', error, { endpoint, action })
  }
}

export function getTimeRangeFilter(range: string): { value: string, unit: string } {
  // Returns Cloudflare Analytics Engine SQL interval parts
  // Usage: INTERVAL '${value}' ${unit}
  const intervals: Record<string, { value: string, unit: string }> = {
    '1h': { value: '1', unit: 'HOUR' },
    '24h': { value: '24', unit: 'HOUR' },
    '7d': { value: '7', unit: 'DAY' },
    '30d': { value: '30', unit: 'DAY' },
    '90d': { value: '90', unit: 'DAY' },
  }
  return intervals[range] || intervals['24h']!
}

export async function trackToolLookup(
  _event: H3Event,
  _tool: ToolName,
  _url: string,
): Promise<void> {
  // V1: `tool_lookups` table was dropped. Stub kept to avoid churning callers
  // until the lookup endpoints are reshaped. See .plans/05-drizzle-reconcile.md.
}
