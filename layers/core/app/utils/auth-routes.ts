const authenticatedRoutePrefixes = ['/pro/dashboard']

export function requiresAuthentication(path: string): boolean {
  return authenticatedRoutePrefixes.some(prefix =>
    path === prefix || path.startsWith(`${prefix}/`),
  )
}
