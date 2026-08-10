// V1 PIVOT: verify-based site registration retired.
//
// Previously this endpoint registered a site from a Nuxt module's `pro.verify()`
// call (GSC-based ownership verify). V1 replaces it with CNAME verify served
// via the Cloudflare edge worker — see `.plans/07-edge-worker.md`.
//
// Kept as a 501 stub so existing module shims fail loudly without crashing the
// nitro app. Restoring this endpoint requires V1 site model + edge worker.

import { defineProApiHandler } from '../../utils/handler'

export default defineProApiHandler({
  caller: false,
  usage: { source: 'rest', action: 'verify' },
}, async () => {
  throw createError({
    statusCode: 501,
    message: 'Not implemented: site verification moved to CNAME verify via edge worker (see .plans/07-edge-worker.md)',
  })
})
