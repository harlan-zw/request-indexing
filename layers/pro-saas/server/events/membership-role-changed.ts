import { defineEvent } from '@harlan-zw/nuxt-domain-events/server'
import { z } from 'zod'
import { idSchema, requestEventSchema } from './_schemas'

export default defineEvent({
  name: 'pro:membership:role-changed',
  transport: { _tag: 'local' },
  input: z.object({
    event: requestEventSchema,
    teamId: idSchema,
    userId: idSchema,
    role: z.string().min(1),
    previousRole: z.string().min(1),
  }),
})
