// Predicate gating pro-gsc client plugins (auth wiring, realtime socket) to
// the dashboard surface. Underscore-prefixed: layer-internal, not auto-imported.

export function isProAppPath(path: string): boolean {
  return path.startsWith('/pro/dashboard/') && !path.startsWith('/login')
}
