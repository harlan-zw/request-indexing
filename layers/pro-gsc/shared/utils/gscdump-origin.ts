// Pure URL policy for the gscdump.com partner integration. Kept free of Nuxt
// auto-imports so both the server adapter and tests can use it directly; the
// runtimeConfig read lives in `server/utils/gscdump-origin.ts`.

export const GSCDUMP_DEFAULT_API_URL = 'https://gscdump.com/api'
export const GSCDUMP_DEFAULT_WEBHOOK_URL = 'https://requestindexing.com/api/webhooks/gscdump'

/**
 * Normalize a configured gscdump origin to its `.../api` root.
 *
 * `NUXT_GSCDUMP_API_URL` has historically regressed to `.../api/partner`:
 * server partner calls then append a second `/partner`, and the browser SDK
 * base ({@link gscdumpApiBase} strips `/api`, the client re-adds it) doubles
 * into `/api/partner/api/...`, a route with no CORS coverage. Stripping the
 * stray suffix here means a misconfigured secret cannot reintroduce that.
 */
export function normalizeGscdumpApiUrl(raw: string | undefined | null): string {
  return (raw || GSCDUMP_DEFAULT_API_URL)
    .replace(/\/+$/, '')
    .replace(/\/partner$/, '')
}

export function gscdumpApiBase(raw: string | undefined | null): string {
  return normalizeGscdumpApiUrl(raw).replace(/\/api$/, '')
}

export function gscdumpPartnerApiUrl(raw: string | undefined | null): string {
  return `${normalizeGscdumpApiUrl(raw)}/partner`
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
