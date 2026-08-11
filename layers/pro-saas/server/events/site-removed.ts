import { defineEvent } from '@harlan-zw/nuxt-domain-events/server'
import { z } from 'zod'
import { idSchema, requestEventSchema } from './_schemas'

export default defineEvent({
  name: 'pro:site:removed',
  transport: { _tag: 'local' },
  input: z.object({
    event: requestEventSchema,
    siteId: idSchema,
    teamId: idSchema,
    userId: idSchema,
    gscdumpSiteId: z.string().nullable(),
  }),
})
