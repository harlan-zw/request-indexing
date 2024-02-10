import { isError } from 'h3'
import { getAuthenticatedData } from '~/server/composables/auth'

export default defineEventHandler(async (event) => {
  // only need to auth the context once
  if (!event.path.startsWith('/api') || event.context.authenticatedData || event.path.startsWith('/api/_auth'))
    return
  const data = await getAuthenticatedData(event)
  if (isError(data))
    return sendError(event, data)
  if (!data.user.userId) {
    throw createError({
      statusCode: 401,
      message: 'Invalid user data.',
    })
  }
  event.context.authenticatedData = data
})
