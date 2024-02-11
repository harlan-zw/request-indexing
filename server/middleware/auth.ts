import { isError } from 'h3'
import { getAuthenticatedData } from '~/server/composables/auth'

// TODO move to route rules
// authenticated by default
const NonAuthenticatedPaths = [
  '/api/_auth/session',
  '/api/github',
]

const AdminPaths = [
  '/api/admin',
]

export default defineEventHandler(async (event) => {
  if (NonAuthenticatedPaths.some(p => event.path.startsWith(p)))
    return
  // only need to auth the context once
  if (!event.path.startsWith('/api') || event.context.authenticatedData)
    return
  const data = await getAuthenticatedData(event)
  if (isError(data))
    return sendError(event, data)
  if (!data.user?.userId) {
    throw createError({
      statusCode: 401,
      message: 'Invalid user data.',
    })
  }
  if (AdminPaths.some(p => event.path.startsWith(p)) && data.user.email !== 'harlan@harlanzw.com') {
    return sendError(event, createError({
      statusCode: 401,
      message: 'Unauthorized',
    }))
  }
  event.context.authenticatedData = data
})
