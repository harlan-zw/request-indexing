// V1 PIVOT: verify-based site registration retired.
//
// Previously this endpoint registered a site from a Nuxt module's `pro.verify()`
// call (GSC-based ownership verify). That flow is not part of the current
// product; sites are added directly through the GSC connection instead.
//
// Kept as a 501 stub so existing module shims fail loudly without crashing
// the nitro app.

import { defineProApiHandler } from '../../utils/handler'

export default defineProApiHandler({
  caller: false,
  usage: { source: 'rest', action: 'verify' },
}, async () => {
  throw createError({
    statusCode: 501,
    message: 'Not implemented: site verification via pro.verify() has been retired.',
  })
})
