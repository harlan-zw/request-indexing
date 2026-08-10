import type { H3Event } from 'h3'
import type { ApiUsageSource, ApiUsageStatus, NewApiUsageEvent } from '../database'
import { logError } from '~~/shared/logging'
import { apiUsageEvents } from '../database'

export interface RecordApiUsageInput {
  teamId?: number | null
  teamApiTokenId?: number | null
  userId?: number | null
  source: ApiUsageSource
  method?: string | null
  path?: string | null
  action?: string | null
  target?: string | null
  status?: ApiUsageStatus
  statusCode?: number | null
  responseTime?: number | null
  client?: string | null
  userAgent?: string | null
  ip?: string | null
  errorCode?: string | null
}

export interface NormalizedApiUsageEvent {
  teamId: number
  teamApiTokenId: number | null
  userId: number | null
  source: ApiUsageSource
  method: string | null
  path: string | null
  action: string | null
  target: string | null
  status: ApiUsageStatus
  statusCode: number | null
  responseTime: number | null
  client: string | null
  userAgent: string | null
  ipHash: string | null
  errorCode: string | null
}

function trimNullable(value: string | null | undefined, max = 500): string | null {
  const trimmed = value?.trim()
  if (!trimmed)
    return null
  return trimmed.length > max ? trimmed.slice(0, max) : trimmed
}

async function sha256(value: string): Promise<string> {
  const data = new TextEncoder().encode(value)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, '0')).join('')
}

export async function hashApiUsageIp(ip: string | null | undefined): Promise<string | null> {
  const normalized = trimNullable(ip, 128)
  if (!normalized)
    return null
  const salt = useRuntimeConfig().apiUsageIpHashSalt || useRuntimeConfig().session?.password || 'nuxtseo-api-usage'
  return await sha256(`${salt}:${normalized}`)
}

export async function normalizeApiUsageInput(input: RecordApiUsageInput): Promise<NormalizedApiUsageEvent | null> {
  const teamId = typeof input.teamId === 'number' ? input.teamId : null
  if (teamId == null)
    return null

  const statusCode = typeof input.statusCode === 'number' ? Math.trunc(input.statusCode) : null
  const responseTime = typeof input.responseTime === 'number' ? Math.max(0, Math.trunc(input.responseTime)) : null

  return {
    teamId,
    teamApiTokenId: typeof input.teamApiTokenId === 'number' ? input.teamApiTokenId : null,
    userId: typeof input.userId === 'number' ? input.userId : null,
    source: input.source,
    method: trimNullable(input.method?.toUpperCase(), 16),
    path: trimNullable(input.path, 500),
    action: trimNullable(input.action, 120),
    target: trimNullable(input.target, 500),
    status: input.status ?? (statusCode && statusCode >= 400 ? 'error' : 'success'),
    statusCode,
    responseTime,
    client: trimNullable(input.client, 120),
    userAgent: trimNullable(input.userAgent, 500),
    ipHash: await hashApiUsageIp(input.ip),
    errorCode: trimNullable(input.errorCode, 120),
  }
}

export async function recordApiUsage(
  event: H3Event | null,
  input: RecordApiUsageInput,
): Promise<void> {
  try {
    const normalized = await normalizeApiUsageInput(input)
    if (!normalized)
      return

    const db = event ? useDrizzle(event) : useDrizzle()
    await db.insert(apiUsageEvents).values({
      ...normalized,
      createdAt: new Date(),
    } satisfies NewApiUsageEvent)
  }
  catch (err) {
    logError('telemetry.insert_failed', err, { stage: 'sync_insert' })
  }
}

export function recordApiUsageLater(event: H3Event, input: RecordApiUsageInput): void {
  recordApiUsage(event, input).catch(err => logError('telemetry.insert_failed', err, { stage: 'async_insert' }))
}
