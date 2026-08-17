import { authenticateUser } from '~~/layers/core/server/app/utils/auth'

export default defineGscdumpSiteHandler(async ({ event, gscdumpSiteId }) => {
  // The sync status is per user, not per site: gscdump keys it by the caller's
  // own engine user id, which lives on the user row and not on the caller seam.
  const user = await authenticateUser(event)
  if (!user.gscdumpUserId) {
    throw createError({ statusCode: 404, message: 'Site not found or not registered with gscdump' })
  }

  const gscdump = useGscdumpClient()
  return gscdump.getSiteSyncStatus(gscdumpSiteId, user.gscdumpUserId)
})
