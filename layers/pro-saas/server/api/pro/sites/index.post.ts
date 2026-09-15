import { z } from 'zod'
import { defineProApiHandler } from '#layers/pro-saas/server/utils/handler'
import { registerSite } from '#layers/pro-saas/server/utils/register-site'
import { ProError } from '#layers/pro-saas/shared/errors'

const bodySchema = z.object({
  url: z.string().trim().min(1).max(2048),
})

/** Connect one site to the caller's current team. Address first, Google after. */
export default defineProApiHandler({
  team: { ability: 'manage-sites' },
  body: bodySchema,
}, async ({ event, team: ctx, body }) => {
  const result = await registerSite(event, ctx, { url: body.url })

  switch (result._tag) {
    case 'InvalidUrl':
      throw new ProError('validation_failed', { message: result.message })
    case 'OverLimit':
      throw new ProError('validation_failed', {
        message: `Connect up to ${result.max} sites. You already have ${result.selected - 1}.`,
        details: { reason: 'site_limit', max: result.max },
      })
    case 'AlreadyConnected':
      throw new ProError('conflict', {
        message: 'That site is already connected.',
        details: { siteId: result.site.publicId },
      })
    case 'Ok':
      return {
        site: {
          id: result.site.publicId,
          domain: result.site.domain,
          property: result.site.property,
        },
      }
  }
})
