import { defineEvent } from '@harlan-zw/nuxt-domain-events/server'
import { z } from 'zod'
import { idSchema, requestEventSchema } from './_schemas'

export default defineEvent({
  name: 'pro:billing:payment-failed',
  transport: { _tag: 'local' },
  input: z.object({
    event: requestEventSchema,
    userId: idSchema,
    teamId: idSchema.nullable(),
    invoiceId: z.string().min(1),
    amountDue: z.number(),
    attemptCount: z.number().int().nonnegative(),
  }),
})
