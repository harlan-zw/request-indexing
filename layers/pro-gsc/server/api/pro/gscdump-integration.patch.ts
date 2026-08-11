import { eq } from 'drizzle-orm'
// PATCH endpoint for gscdump integration settings (currently
// browserAnalyzerEnabled). Returns the fresh integration shape so optimistic
// updaters can replace the cached payload in one round trip.

import { z } from 'zod'
import { loadGscdumpSettings, patchGscdumpSettings } from '#layers/pro-gsc/server/utils/gscdump-proxy'
import { users } from '#layers/pro-saas/server/database'
import { defineProApiHandler } from '#layers/pro-saas/server/utils/handler'

const PatchSchema = z.object({
  browserAnalyzerEnabled: z.boolean().optional(),
}).strict()

export default defineProApiHandler({ body: PatchSchema }, async ({ event, db, caller, body }) => {
  const row = await db.select({
    apiKey: users.gscdumpApiKey,
    userId: users.gscdumpUserId,
  }).from(users).where(eq(users.userId, caller.user.id)).get()

  if (typeof body.browserAnalyzerEnabled === 'boolean') {
    await patchGscdumpSettings(event, caller.user.id, row?.apiKey ?? null, {
      browserAnalyzerEnabled: body.browserAnalyzerEnabled,
    })
  }

  const settings = await loadGscdumpSettings(event, caller.user.id, row?.apiKey ?? null)
  return {
    connected: !!(row?.apiKey && row?.userId),
    browserAnalyzerEnabled: settings.browserAnalyzerEnabled,
  }
})
