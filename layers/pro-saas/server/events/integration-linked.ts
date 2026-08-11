import { defineEvent } from '@harlan-zw/nuxt-domain-events/server'
import { z } from 'zod'
import { idSchema, integrationKindSchema, requestEventSchema } from './_schemas'

export default defineEvent({
  name: 'pro:integration:linked',
  transport: { _tag: 'local' },
  input: z.object({
    event: requestEventSchema,
    userId: idSchema,
    kind: integrationKindSchema,
  }),
})
