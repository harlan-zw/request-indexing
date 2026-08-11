import type { PartnerFetch } from '@gscdump/sdk/partner'
import type { H3Event } from 'h3'
import { createPartnerClient } from '@gscdump/sdk/partner'
import { createGscdumpV1Client } from '@gscdump/sdk/v1'
import {
  gscdumpApiBase,
  gscdumpPartnerApiUrl,
  normalizeGscdumpApiUrl,
  normalizeGscdumpWebhookUrl,
} from '#layers/pro-gsc/shared/utils/gscdump-origin'

interface GscdumpConfig {
  apiUrl?: string
  apiKey?: string
  webhookUrl?: string
  webhookSecret?: string
}

function gscdumpConfig(event?: H3Event): GscdumpConfig {
  const config = event ? useRuntimeConfig(event) : useRuntimeConfig()
  return (config.gscdump ?? {}) as GscdumpConfig
}

export function getGscdumpApiUrl(event?: H3Event): string {
  return normalizeGscdumpApiUrl(gscdumpConfig(event).apiUrl)
}

export function getGscdumpApiBase(event?: H3Event): string {
  return gscdumpApiBase(gscdumpConfig(event).apiUrl)
}

export function getGscdumpPartnerApiUrl(event?: H3Event): string {
  return gscdumpPartnerApiUrl(gscdumpConfig(event).apiUrl)
}

/**
 * The callback URL gscdump delivers webhooks to, passed on every site
 * registration. Override with `NUXT_GSCDUMP_WEBHOOK_URL` in dev/preview so the
 * webhook path is testable outside production.
 */
export function getGscdumpWebhookUrl(event?: H3Event): string {
  return normalizeGscdumpWebhookUrl(gscdumpConfig(event).webhookUrl)
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
