export default defineEventHandler(async (event) => {
  const body = await readBody<{ urls?: string[], sitemapUrl?: string }>(event)

  let urls: string[] = []

  if (body?.sitemapUrl?.trim()) {
    // Fetch URLs from sitemap
    try {
      const sitemapUrls = await fetchSitemapUrls(body.sitemapUrl.trim())
      urls = sitemapUrls.slice(0, 50) // Limit to 50 for public use
    }
    catch {
      throw createError({ statusCode: 400, message: 'Could not fetch or parse the sitemap URL' })
    }
  }
  else if (body?.urls?.length) {
    urls = body.urls
      .map(u => u.trim())
      .filter(Boolean)
      .slice(0, 50)
  }
  else {
    throw createError({ statusCode: 400, message: 'Provide either a list of URLs or a sitemap URL' })
  }

  if (urls.length === 0)
    throw createError({ statusCode: 400, message: 'No valid URLs found' })

  // Normalize URLs
  urls = urls.map((url) => {
    if (!url.startsWith('http://') && !url.startsWith('https://'))
      return `https://${url}`
    return url
  })

  // Validate URLs
  for (const url of urls) {
    try {
      new URL(url)
    }
    catch {
      throw createError({ statusCode: 400, message: `Invalid URL: ${url}` })
    }
  }

  const results = await checkUrlsIndexed(urls)

  const indexed = results.filter(r => r.indexed).length
  const notIndexed = results.filter(r => !r.indexed).length

  return {
    summary: {
      total: results.length,
      indexed,
      notIndexed,
      indexRate: results.length > 0 ? Math.round((indexed / results.length) * 100) : 0,
    },
    results,
    checkedAt: new Date().toISOString(),
  }
})
