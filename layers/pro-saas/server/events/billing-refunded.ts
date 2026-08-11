import { defineEvent } from '@harlan-zw/nuxt-domain-events/server'
import { z } from 'zod'
import { idSchema, requestEventSchema } from './_schemas'

export default defineEvent({
  name: 'pro:billing:refunded',
  transport: { _tag: 'local' },
  input: z.object({
    event: requestEventSchema,
    userId: idSchema,
    teamId: idSchema.nullable(),
    chargeId: z.string().min(1),
    amount: z.number(),
    reason: z.string().nullable(),
  }),
})
