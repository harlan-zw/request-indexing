/**
 * Route prefixes the worker renders on every request. Nothing under them is
 * written to disk at build time.
 *
 * `ogImage.zeroRuntime` strips the OG image renderer out of the worker bundle,
 * so an OG image can only be served as a file produced during prerendering.
 * A runtime-only route must therefore never emit an OG image URL: no file
 * exists behind that URL and the stripped renderer throws instead of rendering.
 *
 * This list is the single source for both facts. `nuxt.config.ts` turns it into
 * `prerender: false` route rules, and `layers/core/app/app.vue` uses it to skip
 * the site-wide OG image. Add a prefix here and the two stay in step.
 */
export const RUNTIME_ONLY_ROUTE_PREFIXES = [
  '/_alt',
  '/account',
  '/admin',
  '/api',
  '/auth',
  '/dashboard',
  '/kit',
  '/pro',
  '/team-invitations',
  '/ws',
] as const

export function isRuntimeOnlyRoute(path: string): boolean {
  const pathname = path.split('?')[0]!.split('#')[0]!
  return RUNTIME_ONLY_ROUTE_PREFIXES.some(prefix => pathname === prefix || pathname.startsWith(`${prefix}/`))
}

/** `prerender: false` rules for every runtime-only prefix, keyed by glob. */
export function runtimeOnlyRouteRules(): Record<string, { prerender: false }> {
  return Object.fromEntries(
    RUNTIME_ONLY_ROUTE_PREFIXES.map(prefix => [`${prefix}/**`, { prerender: false }]),
  )
}
