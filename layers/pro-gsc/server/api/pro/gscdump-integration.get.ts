import { eq } from 'drizzle-orm'
// Lazy gscdump integration credentials. Per ADR-0002, integration data
// lives behind its own endpoint, not on the Caller seam.
// See CONTEXT.md and docs/adr/0002-caller-is-the-user-context-seam.md.

import { getGscdumpApiBase } from '#layers/pro-gsc/server/utils/gscdump-origin'
import { loadGscdumpSettings } from '#layers/pro-gsc/server/utils/gscdump-proxy'
import { defineProApiHandler } from '#layers/pro-saas/server/utils/handler'
import { users } from '#layers/pro-saas/server/database'

export default defineProApiHandler({}, async ({ event, db, caller }) => {
  // gscdump credentials live on the users row but aren't part of Caller.
  // One small read per dashboard mount — cheaper than bundling on every /me.
  const row = await db.select({
    apiKey: users.gscdumpApiKey,
    userId: users.gscdumpUserId,
  }).from(users).where(eq(users.userId, caller.user.id)).get()

  const settings = await loadGscdumpSettings(event, caller.user.id, row?.apiKey ?? null)

  return {
    apiKey: row?.apiKey ?? null,
    userId: row?.userId ?? null,
    apiBase: getGscdumpApiBase(event),
    browserAnalyzerEnabled: settings.browserAnalyzerEnabled,
  }
})
