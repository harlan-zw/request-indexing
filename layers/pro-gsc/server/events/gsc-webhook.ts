import type { WebhookEnvelope } from '@gscdump/contracts'
import { defineEvent } from '@harlan-zw/nuxt-domain-events/server'
import { z } from 'zod'
import { idSchema, requestEventSchema } from '#layers/pro-saas/server/events/_schemas'

const webhookEnvelopeSchema = z.custom<WebhookEnvelope>(value => (
  typeof value === 'object'
  && value !== null
))

export default defineEvent({
  name: 'pro:gsc:webhook',
  transport: { _tag: 'local' },
  input: z.object({
    event: requestEventSchema,
    envelope: webhookEnvelopeSchema,
    userId: idSchema,
    siteId: idSchema.nullable(),
  }),
})
