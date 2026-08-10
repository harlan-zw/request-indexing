import type { H3Event } from 'h3'

export interface GscSyncCompletePayload {
  event: H3Event
  siteId: string
  teamId: string
  /** Period identifier (e.g. `2026-04`). */
  period: string
  rowsIngested: number
}

declare module 'nitropack/types' {
  interface NitroRuntimeHooks {
    'pro:gsc:sync-complete': (payload: GscSyncCompletePayload) => void | Promise<void>
  }
}

export {}
