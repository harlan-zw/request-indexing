import { defineEvent } from '@harlan-zw/nuxt-domain-events/server'
import { z } from 'zod'
import { idSchema, requestEventSchema } from './_schemas'

export default defineEvent({
  name: 'pro:subscription:changed',
  transport: { _tag: 'local' },
  input: z.object({
    event: requestEventSchema,
    teamId: idSchema,
    oldPlan: z.string(),
    newPlan: z.string(),
    status: z.string(),
  }),
})
