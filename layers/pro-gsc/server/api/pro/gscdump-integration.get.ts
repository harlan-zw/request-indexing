import { eq } from 'drizzle-orm'
// Lazy gscdump integration credentials. Per ADR-0002, integration data
// lives behind its own endpoint, not on the Caller seam.
// See CONTEXT.md and docs/adr/0002-caller-is-the-user-context-seam.md.

import { loadGscdumpSettings } from '#layers/pro-gsc/server/utils/gscdump-proxy'
import { users } from '#layers/pro-saas/server/database'
import { defineProApiHandler } from '#layers/pro-saas/server/utils/handler'

export default defineProApiHandler({}, async ({ event, db, caller }) => {
  // gscdump credentials live on the users row but aren't part of Caller.
  // One small read per dashboard mount, cheaper than bundling on every /me.
  // The API key itself never leaves this handler: the browser gets only a
  // `connected` boolean. Every gscdump HTTP call from the browser goes
  // through the same-origin v1 proxy, which resolves the stored key
  // server-side.
  const row = await db.select({
    apiKey: users.gscdumpApiKey,
    userId: users.gscdumpUserId,
  }).from(users).where(eq(users.userId, caller.user.id)).get()

  const settings = await loadGscdumpSettings(event, caller.user.id, row?.apiKey ?? null)

  return {
    connected: !!(row?.apiKey && row?.userId),
    browserAnalyzerEnabled: settings.browserAnalyzerEnabled,
  }
})
