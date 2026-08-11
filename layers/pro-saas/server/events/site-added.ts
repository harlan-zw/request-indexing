import { defineEvent } from '@harlan-zw/nuxt-domain-events/server'
import { z } from 'zod'
import { idSchema, requestEventSchema } from './_schemas'

export default defineEvent({
  name: 'pro:site:added',
  transport: { _tag: 'local' },
  input: z.object({
    event: requestEventSchema,
    siteId: idSchema,
    teamId: idSchema,
    url: z.string().min(1),
    userId: idSchema,
    isNew: z.boolean(),
  }),
})
