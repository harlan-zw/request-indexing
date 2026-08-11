import { defineEvent } from '@harlan-zw/nuxt-domain-events/server'
import { z } from 'zod'
import { idSchema, requestEventSchema } from './_schemas'

export default defineEvent({
  name: 'pro:user:deleting',
  transport: { _tag: 'local' },
  input: z.object({
    event: requestEventSchema,
    userId: idSchema,
    email: z.string(),
    stripeCustomerId: z.string().nullable(),
    gscdumpUserId: z.string().nullable(),
    subscriptionId: z.string().nullable(),
    subscriptionStatus: z.string().nullable(),
  }),
})
