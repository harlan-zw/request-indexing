import type { H3Event } from 'h3'
import { timingSafeEqual } from 'node:crypto'
import { createError, getHeader, getRequestURL, setResponseHeader } from 'h3'

export function requireCheckinAuth(event: H3Event, token: string) {
  setResponseHeader(event, 'Cache-Control', 'no-store')
  const authorization = getHeader(event, 'authorization')
  const expected = Buffer.from(`Bearer ${token}`)
  const supplied = Buffer.from(authorization ?? '')
  if (event.method !== 'GET' || getRequestURL(event).pathname !== '/api/internal/checkin'
    || !token || expected.length !== supplied.length || !timingSafeEqual(expected, supplied)) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }
}
