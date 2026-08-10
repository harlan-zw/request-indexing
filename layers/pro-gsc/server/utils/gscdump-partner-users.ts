// gscdump.com Partner Users API.
//
// Cross-org cleanup calls into gscdump.com's partner endpoints, scoped to user
// records (the teams equivalent lives in gscdump-teams-client.ts).
// gscdump.com queues an `app:user:cleanup-requested` event off DELETE so its
// own purge runs async; this just needs to fire-and-acknowledge.

import type { H3Event } from 'h3'
import { getGscdumpPartnerApiUrl } from './gscdump-origin'

export interface PartnerDeleteResult {
  ok: boolean
  status?: number
  message?: string
}

export async function deletePartnerUser(event: H3Event, gscdumpUserId: string): Promise<PartnerDeleteResult> {
  const config = useRuntimeConfig(event)
  const apiKey = config.gscdump?.apiKey
  if (!apiKey)
    return { ok: false, message: 'NUXT_GSCDUMP_API_KEY not configured' }
  try {
    const res = await $fetch<{ ok: true, queued?: boolean }>(
      `${getGscdumpPartnerApiUrl(event)}/users/${gscdumpUserId}`,
      { method: 'DELETE', headers: { 'x-api-key': apiKey } },
    )
    return { ok: true, message: JSON.stringify(res) }
  }
  catch (err: any) {
    return {
      ok: false,
      status: err?.statusCode || err?.response?.status,
      message: err?.data?.message || err?.message || String(err),
    }
  }
}
