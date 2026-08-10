// Partner webhook from gscdump.com posted when a periodic GSC sync finishes
// for a connected pro site. Auth-gated by the shared partner key (the same
// `NUXT_GSCDUMP_API_KEY` we use to call gscdump.com — both sides hold it).
// Body shape is contracted with gscdump.com.
//
// On success, fires `pro:gsc:sync-complete` so layer-local listeners (reports,
// signal caches) can react.

import { z } from 'zod'
import { logWarn } from '~~/shared/logging'
import { dispatchProEvent } from '#layers/pro-saas/server/utils/dispatch'

const bodySchema = z.object({
  siteId: z.string().min(1),
  teamId: z.string().min(1),
  period: z.string().min(1),
  rowsIngested: z.number().int().nonnegative(),
})

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const expected = config.gscdump?.apiKey
  if (!expected)
    throw createError({ statusCode: 500, message: 'NUXT_GSCDUMP_API_KEY not configured' })

  const provided = getHeader(event, 'x-api-key')
  if (provided !== expected)
    throw createError({ statusCode: 401, message: 'Unauthorized' })

  const body = await readValidatedBody(event, bodySchema.parse)

  await dispatchProEvent(event, 'pro:gsc:sync-complete', {
    siteId: body.siteId,
    teamId: body.teamId,
    period: body.period,
    rowsIngested: body.rowsIngested,
  }).catch((err: unknown) => logWarn('webhook.side_effect_failed', err, { event: 'pro:gsc:sync-complete' }))

  return { ok: true }
})
