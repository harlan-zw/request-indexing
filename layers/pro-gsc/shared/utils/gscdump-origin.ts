// Pure URL policy for the gscdump.com partner integration. Kept free of Nuxt
// auto-imports so both the server adapter and tests can use it directly; the
// runtimeConfig read lives in `server/utils/gscdump-origin.ts`.

export const GSCDUMP_DEFAULT_API_URL = 'https://gscdump.com/api'
export const GSCDUMP_DEFAULT_WEBHOOK_URL = 'https://requestindexing.com/api/webhooks/gscdump'

/**
 * Normalize a configured gscdump origin to its `.../api` root.
 *
 * `NUXT_GSCDUMP_API_URL` has historically regressed to `.../api/partner`:
 * SDK clients then append their own surface path. Stripping the stray suffix
 * here prevents malformed `/api/partner/...` request paths.
 */
export function normalizeGscdumpApiUrl(raw: string | undefined | null): string {
  return (raw || GSCDUMP_DEFAULT_API_URL)
    .replace(/\/+$/, '')
    .replace(/\/partner$/, '')
}

/**
 * The callback URL gscdump delivers webhooks to, passed on every site
 * registration. Config-sourced so dev/preview can point registrations at a
 * tunnel; the default must be our own origin, since registering a sibling
 * partner's URL silently routes our lifecycle signals to them.
 */
export function normalizeGscdumpWebhookUrl(raw: string | undefined | null): string {
  return raw || GSCDUMP_DEFAULT_WEBHOOK_URL
}
