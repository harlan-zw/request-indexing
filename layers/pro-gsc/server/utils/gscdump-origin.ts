import type { PartnerFetch } from '@gscdump/sdk'
import type { H3Event } from 'h3'
import { createPartnerClient } from '@gscdump/sdk'
import { createGscdumpV1Client } from '@gscdump/sdk/v1'

export function getGscdumpApiUrl(event?: H3Event): string {
  const config = event ? useRuntimeConfig(event) : useRuntimeConfig()
  return ((config.gscdump as { apiUrl?: string } | undefined)?.apiUrl || 'https://gscdump.com/api').replace(/\/+$/, '')
}

export function getGscdumpApiBase(event?: H3Event): string {
  return getGscdumpApiUrl(event).replace(/\/api$/, '')
}

export function getGscdumpPartnerApiUrl(event?: H3Event): string {
  return `${getGscdumpApiUrl(event)}/partner`
}

/**
 * Resolves `GSCDUMP_API_KEY` + origin and constructs the SDK's partner client.
 * Throws h3-shaped 500 when the key is unset. Callers layer their own error
 * policy (h3 re-raise, best-effort logging, etc.) on top of the returned client.
 */
export function createGscdumpPartnerClient(event?: H3Event) {
  const config = event ? useRuntimeConfig(event) : useRuntimeConfig()
  const apiKey = config.gscdump?.apiKey
  if (!apiKey)
    throw createError({ statusCode: 500, message: 'GSCDUMP_API_KEY not configured' })
  return createPartnerClient({
    apiBase: getGscdumpApiUrl(event),
    apiKey,
    fetch: $fetch as unknown as PartnerFetch,
  })
}

/**
 * Public-v1 client for every operation already present in the frozen registry.
 * Keep `createGscdumpPartnerClient` only for private compatibility operations.
 */
export function createGscdumpPublicV1Client(event?: H3Event) {
  const config = event ? useRuntimeConfig(event) : useRuntimeConfig()
  const apiKey = config.gscdump?.apiKey
  if (!apiKey)
    throw createError({ statusCode: 500, message: 'GSCDUMP_API_KEY not configured' })
  return createGscdumpV1Client({
    apiRoot: getGscdumpApiUrl(event),
    credential: apiKey,
  })
}
