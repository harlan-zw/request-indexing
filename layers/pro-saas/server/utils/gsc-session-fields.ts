// Pure projection: the user's `google_accounts` row becomes the session's
// Search Console block.
//
// The session plugin used to assign `gscConnected`, `gscEmail` and
// `googleScopes` inline and stop there, so `pro-gate.global.ts` read
// `gscIndexingScope` and `gscSitemapsScope` off a session that never carried
// them. Both were permanently false, which locks every
// `gsc-indexing-connected` and `gsc-sitemaps-writable` feature for every user.
// One projection makes the partial write unrepresentable: a caller cannot
// publish the connection without also publishing what it is allowed to do.

import { hasGscWriteScope, hasIndexingScope, parseGrantedScopes } from 'gscdump'

/** The stored grant, narrowed to what the session projection reads. */
export interface GscAccountRow {
  payload?: { email?: string | null } | unknown
  tokens?: { scope?: string | null } | null
}

export interface GscSessionFields {
  gscConnected: boolean
  gscEmail: string | null
  googleScopes: string | null
  /** Indexing API grant. Required to submit URLs. */
  gscIndexingScope: boolean
  /** Read-write `webmasters` grant. Required to submit sitemaps. */
  gscSitemapsScope: boolean
}

export function buildGscSessionFields(account: GscAccountRow | null | undefined): GscSessionFields {
  const scope = account?.tokens?.scope ?? null
  const granted = parseGrantedScopes(scope)
  return {
    gscConnected: !!account,
    gscEmail: (account?.payload as { email?: string | null } | undefined)?.email ?? null,
    googleScopes: scope,
    gscIndexingScope: hasIndexingScope(granted),
    gscSitemapsScope: hasGscWriteScope(granted),
  }
}
