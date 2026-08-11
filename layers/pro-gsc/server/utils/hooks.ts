import type { WebhookEnvelope } from '@gscdump/contracts'
import type { H3Event } from 'h3'

export interface GscdumpWebhookPayload {
  event: H3Event
  /** Verified, schema-parsed delivery from gscdump.com. */
  envelope: WebhookEnvelope
  /** Local user the delivery's `envelope.userId` resolves to. */
  userId: number
  /** Local site for site-scoped events; null for user-scoped ones. */
  siteId: number | null
}

declare module 'nitropack/types' {
  interface NitroRuntimeHooks {
    'pro:gsc:webhook': (payload: GscdumpWebhookPayload) => void | Promise<void>
  }
}

export {}
