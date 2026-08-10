// Pure error mapping for gscdump API failures. Kept separate from useProGscdump
// so it is unit-testable without the composable harness.

export interface GscdumpError {
  message: string
  code: 'AUTH' | 'NOT_FOUND' | 'RATE_LIMIT' | 'SERVER' | 'NETWORK' | 'UNKNOWN'
  status?: number
  retry?: boolean
}

export function parseGscdumpError(e: unknown): GscdumpError {
  if (e instanceof Error) {
    const fetchError = e as Error & { status?: number, statusCode?: number, data?: { message?: string } }
    const status = fetchError.status || fetchError.statusCode

    if (status === 401 || status === 403) {
      return { message: 'Authentication failed. Please reconnect your account.', code: 'AUTH', status, retry: false }
    }
    if (status === 404) {
      return { message: 'Data not found. The site may not be synced yet.', code: 'NOT_FOUND', status, retry: false }
    }
    if (status === 429) {
      return { message: 'Rate limited. Please wait a moment and try again.', code: 'RATE_LIMIT', status, retry: true }
    }
    if (status && status >= 500) {
      return { message: 'Server error. Please try again later.', code: 'SERVER', status, retry: true }
    }
    if (e.message.includes('fetch') || e.message.includes('network') || e.message.includes('Failed to fetch')) {
      return { message: 'Network error. Check your connection.', code: 'NETWORK', retry: true }
    }

    return { message: fetchError.data?.message || e.message || 'An error occurred', code: 'UNKNOWN', status, retry: true }
  }

  return { message: 'An unexpected error occurred', code: 'UNKNOWN', retry: true }
}
