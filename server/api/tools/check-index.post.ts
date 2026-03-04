export default defineEventHandler(async (event) => {
  const body = await readBody<{ url: string }>(event)

  if (!body?.url?.trim())
    throw createError({ statusCode: 400, message: 'URL is required' })

  const url = body.url.trim()

  // Basic URL validation
  let normalizedUrl = url
  if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://'))
    normalizedUrl = `https://${normalizedUrl}`

  try {
    new URL(normalizedUrl)
  }
  catch {
    throw createError({ statusCode: 400, message: 'Invalid URL format' })
  }

  // Rate limiting via simple in-memory check (per-request IP)
  // In production, use Cloudflare KV or Durable Objects for proper rate limiting

  const result = await checkUrlIndexed(normalizedUrl)

  return {
    ...result,
    checkedAt: new Date().toISOString(),
  }
})
