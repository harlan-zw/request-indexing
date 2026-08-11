export const DATAFORSEO_RETRY_OPTIONS = {
  retry: 2,
  retryDelay: 300,
  retryStatusCodes: [408, 409, 425, 429, 500, 502, 503, 504, 520, 521, 522, 523, 524],
}

type DataForSEORequestResult<T>
  = | { _tag: 'Success', value: T }
    | { _tag: 'Unavailable', statusCode: number }

function getStatusCode(error: unknown): number | undefined {
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

export function runDataForSEORequest<T>(request: () => Promise<T>): Promise<DataForSEORequestResult<T>> {
  return request()
    .then(value => ({ _tag: 'Success', value }) as const)
    .catch((error: unknown) => {
      const statusCode = getStatusCode(error)
      if (statusCode === 429 || (statusCode !== undefined && statusCode >= 500))
        return { _tag: 'Unavailable', statusCode } as const

      return Promise.reject(error)
    })
}
