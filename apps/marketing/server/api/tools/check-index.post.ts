import { runDataForSEORequest } from '../../../../../shared/dataforseo'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ url: string }>(event)

  if (!body?.url?.trim())
    throw createError({ statusCode: 400, message: 'URL is required' })

  const url = body.url.trim()

  // Basic URL validation
  let normalizedUrl = url
  if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://'))
    normalizedUrl = `https://${normalizedUrl}`

  if (!URL.canParse(normalizedUrl))
    throw createError({ statusCode: 400, message: 'Invalid URL format' })

  // Rate limiting via simple in-memory check (per-request IP)
  // In production, use Cloudflare KV or Durable Objects for proper rate limiting

  const outcome = await runDataForSEORequest(() => checkUrlIndexed(normalizedUrl))

  if (outcome._tag === 'Unavailable') {
    setResponseStatus(event, 503, 'Service Unavailable')
    return {
      error: true,
      message: 'Index status is temporarily unavailable. Please try again shortly.',
    }
  }

  return {
    ...outcome.value,
    checkedAt: new Date().toISOString(),
  }
})
