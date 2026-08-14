// Repair path for a stale gscdump user credential.
//
// `users.gscdump_api_key` is the raw key every browser proxy sends upstream as
// Bearer auth. gscdump stores only its hash, so once our copy stops matching,
// every Search Console read 401s and nothing on this side can tell: the key
// looks present, the dashboard looks connected.
//
// The old recovery only fired when we held NO key (`if (gscdumpUserId &&
// !gscdumpApiKey)`). A key that is present but dead therefore stayed dead
// forever. gscdump now issues one credential per (partner, user), so another
// partner registering the same person can no longer invalidate ours — but an
// admin key rotation or a lost write here still can, and those are exactly the
// cases the old guard could not see.
//
// Registration is gscdump's repair seam: it is idempotent and always returns a
// freshly minted credential scoped to this partner.

import type { H3Event } from 'h3'
import { getGscdumpApiUrl } from './gscdump-origin'

/** Outcome of probing the stored key against gscdump. */
export type GscdumpKeyProbe
  /** The key authenticated. */
  = | 'ok'
  /** Upstream explicitly rejected the credential (401/403). */
    | 'unauthorized'
  /** Upstream failed for some other reason — says nothing about the key. */
    | 'error'
  /** No probe was run, because there was no key to probe. */
    | 'skipped'

export interface RepairDecisionInput {
  storedKey: string | null
  probe: GscdumpKeyProbe
}

/**
 * Only a missing key or an explicit rejection justifies re-minting. A transient
 * upstream failure must not rotate a working credential, or every gscdump wobble
 * turns into a key change.
 */
export function shouldRepairGscdumpKey({ storedKey, probe }: RepairDecisionInput): boolean {
  if (!storedKey)
    return true
  return probe === 'unauthorized'
}

/** Classify a thrown fetch failure into a probe outcome. */
export function probeOutcomeFromError(err: unknown): GscdumpKeyProbe {
  const record = err as { status?: number, statusCode?: number, response?: { status?: number } }
  const code = record?.status ?? record?.statusCode ?? record?.response?.status
  return code === 401 || code === 403 ? 'unauthorized' : 'error'
}

/**
 * Ask gscdump whether the raw key we hold still authenticates, using the same
 * lifecycle read the browser proxy serves. Cheap and side-effect free.
 */
export async function probeGscdumpUserKey(
  event: H3Event | undefined,
  gscdumpUserId: string,
  apiKey: string,
): Promise<GscdumpKeyProbe> {
  const url = `${getGscdumpApiUrl(event)}/partner/v1/users/${encodeURIComponent(gscdumpUserId)}/lifecycle`
  try {
    const response = await fetch(url, {
      headers: { authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(8000),
    })
    if (response.ok)
      return 'ok'
    return response.status === 401 || response.status === 403 ? 'unauthorized' : 'error'
  }
  catch (err) {
    return probeOutcomeFromError(err)
  }
}
