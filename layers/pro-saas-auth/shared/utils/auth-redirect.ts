const AUTHENTICATED_PATHS = ['/dashboard', '/account'] as const
const AUTH_ORIGIN = 'https://auth.local'

export function safeAuthRedirect(value: unknown): string | null {
  if (typeof value !== 'string' || !value.startsWith('/'))
    return null

  const url = new URL(value, AUTH_ORIGIN)
  if (url.origin !== AUTH_ORIGIN)
    return null

  const allowed = AUTHENTICATED_PATHS.some(path => url.pathname === path || url.pathname.startsWith(`${path}/`))
  if (!allowed)
    return null

  return `${url.pathname}${url.search}${url.hash}`
}
