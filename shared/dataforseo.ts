export const DATAFORSEO_RETRY_OPTIONS = {
  retry: 2,
  retryDelay: 300,
  retryStatusCodes: [408, 409, 425, 429, 500, 502, 503, 504, 520, 521, 522, 523, 524],
}

export const DATAFORSEO_UNAVAILABLE_MESSAGE = 'Search data is temporarily unavailable. Try again shortly.'

export function dataForSeoStatusCode(error: unknown): number | undefined {
  if (!error || typeof error !== 'object')
    return undefined

  const errorRecord = error as {
    status?: unknown
    statusCode?: unknown
    response?: { status?: unknown }
  }

  const candidates = [
    errorRecord.statusCode,
    errorRecord.status,
    errorRecord.response?.status,
  ]

  return candidates.find(status => typeof status === 'number') as number | undefined
}

/**
 * True when the provider, or Cloudflare in front of it, was momentarily unable
 * to answer. Every one of these has already exhausted `DATAFORSEO_RETRY_OPTIONS`,
 * so the outage outlives a retry and belongs to the provider, not to this app.
 */
export function isTransientDataForSeoFailure(error: unknown): boolean {
  const status = dataForSeoStatusCode(error)
  return status === 429 || (status !== undefined && status >= 500)
}
