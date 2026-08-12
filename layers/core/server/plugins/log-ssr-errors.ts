// Nitro swallows server-render failures into a bare 500 page, and nothing in
// this app logged them: `wrangler tail` showed `outcome: "ok"` with an empty
// `exceptions` array for a request that returned 500, which made SSR-only
// breakage effectively undiagnosable in production.
//
// This surfaces the path, message and stack so the failure is visible in
// Workers logs and Sentry breadcrumbs.
export default defineNitroPlugin((nitro) => {
  nitro.hooks.hook('error', (error: unknown, ctx: { event?: { path?: string } }) => {
    const err = error as { message?: string, stack?: string, statusCode?: number } | undefined
    // Expected, explicitly-thrown responses (404 for an unknown site, 401 for a
    // signed-out caller) are control flow, not faults worth a stack trace.
    if (err?.statusCode && err.statusCode < 500)
      return
    console.error('[ssr error]', ctx?.event?.path, '|', err?.message, '|', err?.stack)
  })
})
