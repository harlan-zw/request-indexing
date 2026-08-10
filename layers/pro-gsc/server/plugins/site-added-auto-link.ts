import { eq } from 'drizzle-orm'
import { users } from '#layers/pro-saas/server/database'
import { autoLinkGsc } from '../utils/auto-link-gsc'

export default defineProListener('pro:site:added', async ({ event, siteId, url, userId }) => {
  const db = useDrizzle(event)
  const user = await db.select({ gscdumpUserId: users.gscdumpUserId }).from(users).where(eq(users.userId, userId)).get()
  if (!user?.gscdumpUserId)
    return
  await autoLinkGsc({
    db,
    gscdumpUserId: user.gscdumpUserId,
    siteId,
    origin: url,
    availableSites: event.context.gscAvailableSites,
  })
})
