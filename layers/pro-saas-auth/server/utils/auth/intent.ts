import type { H3Event } from 'h3'
import { deleteCookie, getCookie, getQuery } from 'h3'

export type AuthIntent = 'signin' | 'link'

export function getAuthIntent(event: H3Event): AuthIntent {
  const q = getQuery(event)
  if (q.intent === 'link')
    return 'link'
  const cookie = getCookie(event, 'auth-intent')
  if (cookie === 'link') {
    deleteCookie(event, 'auth-intent')
    return 'link'
  }
  return 'signin'
}
