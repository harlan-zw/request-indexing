import { checkUrlIndexed, dataForSeoCallContext } from '~~/layers/core/server/app/services/dataforseo'
import { checkDataForSeoBudget } from '~~/layers/core/server/app/services/dataforseo-spend'
import { checkFreeToolRateLimit } from '#layers/pro-saas/server/utils/rate-limit'
import { runDataForSEORequest } from '../../../../../shared/dataforseo'

export default defineEventHandler(async (event) => {
  await checkFreeToolRateLimit(event)

  const body = await readBody<{ url: string }>(event)

  if (!body?.url?.trim())
    throw createError({ statusCode: 400, message: 'URL is required' })

  const url = body.url.trim()

  // Basic URL validation
  let normalizedUrl = url
  if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://'))
    normalizedUrl = `https://${url}`

  if (!URL.canParse(normalizedUrl))
    throw createError({ statusCode: 400, message: 'Invalid URL format' })

  const ctx = dataForSeoCallContext('check-index', event)
  const budget = await checkDataForSeoBudget({ tool: ctx.tool!, endpoint: '/serp/google/organic/live/advanced', taskCount: 1 }, ctx)
  if (budget.blocked) {
    throw createError({
      statusCode: 429,
      message: 'Index checking is at capacity for today. Please try again tomorrow.',
    })
  }

  const outcome = await runDataForSEORequest(() => checkUrlIndexed(normalizedUrl, ctx))

  if (outcome._tag === 'Unavailable') {
    throw createError({
      statusCode: 503,
      message: 'Index status is temporarily unavailable. Please try again shortly.',
    })
  }

  return {
    ...outcome.value,
    checkedAt: new Date().toISOString(),
  }
})
