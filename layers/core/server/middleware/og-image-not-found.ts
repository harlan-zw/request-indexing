/**
 * `ogImage.zeroRuntime` strips the OG image renderer from the worker, so the
 * only OG images that exist are the files written during prerendering. Those
 * are served by the static asset layer and never reach this handler.
 *
 * A `/_og/**` request arriving here therefore asks for an image that does not
 * exist: a stale social card URL from an older deploy, or a crawler guessing.
 * Answer 404 so the request is reported as a missing file, instead of letting
 * the stripped renderer throw "Not supported in zeroRuntime mode." as a 500.
 *
 * Dev and prerendering still render on demand, matching the module's own
 * zero-runtime handler.
 */
export default defineEventHandler((event) => {
  if (import.meta.dev || import.meta.prerender)
    return

  if (event.path === '/_og' || event.path.startsWith('/_og/'))
    throw createError({ statusCode: 404, statusMessage: 'OG image not found' })
})
