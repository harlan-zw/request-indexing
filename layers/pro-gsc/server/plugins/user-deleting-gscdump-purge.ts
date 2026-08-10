// Pre-hook listener: ask gscdump.com to purge its side of the user data when a
// pro user deletion is happening. gscdump.com queues an async purge off the
// DELETE so this returns quickly. Best-effort but logged — a non-200 here does
// not abort the local delete (the user already wants out).

import { deletePartnerUser } from '../utils/gscdump-partner-users'

export default defineProListener('pro:user:deleting', async ({ event, gscdumpUserId }) => {
  if (!gscdumpUserId)
    return
  const result = await deletePartnerUser(event, gscdumpUserId)
  if (!result.ok)
    throw new Error(`gscdump partner delete: ${result.message}`)
})
